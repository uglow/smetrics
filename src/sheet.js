const { JWT } = require('google-auth-library');

const GOOGLE_AUTH_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets/';

const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DATE_FORMATS = {
  milliseconds: (dateMillis) => dateMillis,
  googleDate: (dateMillis) => {
    const d = new Date(dateMillis);
    return (
      [d.getUTCDate(), MONTH[d.getUTCMonth()], d.getUTCFullYear()].join('-') +
      ' ' +
      [d.getUTCHours(), String(d.getUTCMinutes()).padStart(2, '0'), String(d.getSeconds()).padStart(2, '0')].join(':')
    );
  },
};

class SheetService {
  constructor(spreadsheetId, { dateFormat = 'milliseconds' } = {}) {
    if (!spreadsheetId) throw new Error('Spreadsheet id must be supplied');
    this.spreadsheetId = spreadsheetId;

    const dateFormatType = typeof dateFormat;

    if (!['string', 'function'].includes(dateFormatType)) {
      throw new Error(`Invalid dateFormat. dateFormat must be a string or a function`);
    } else if (dateFormatType === 'string') {
      if (!DATE_FORMATS[dateFormat]) {
        throw new Error(`Invalid dateFormat. dateFormat must be one of: ${Object.keys(DATE_FORMATS).join(', ')}`);
      }
      this.dateFormat = DATE_FORMATS[dateFormat];
    } else {
      this.dateFormat = dateFormat;
    }
  }

  authorize(creds, authService = JWT) {
    this.client = new authService({ email: creds.clientEmail, key: creds.privateKey, scopes: GOOGLE_AUTH_SCOPES });
    return this.client.authorize(); // Returns the access token
  }

  async addData(records) {
    // First step. Assume we have multi-dimensional array.
    records.forEach((recordArr) => {
      // Start by grouping the elements by category
      const groupedItems = recordArr.reduce(groupBy('sheet'), {});

      // Now for each sheet...
      Object.keys(groupedItems).forEach(async (sheet) => {
        // Create the sheet (in case it does not exist)
        try {
          await this.createSheet(sheet);
        } catch (err) {
          if (err && err.errors && err.errors.length) {
            if (!err.errors[0].message.includes('already exists. Please enter another name')) {
              err.errors.forEach((item) => console.log(item));
            }
          } else {
            console.error(err);
          }
        }

        // Update the header then add a new row, appending the dateTime as the first row
        await this.updateHeader(sheet, ['DateTime'].concat(groupedItems[sheet].map((item) => item.metric))).then(() =>
          this.appendData(
            sheet,
            [this.dateFormat(groupedItems[sheet][0].t)].concat(groupedItems[sheet].map((item) => item.value)),
          ),
        );
      });
    });
  }

  /**
   * Update the header, with the first column being the timestamp
   * @param sheetName
   * @param values
   * @returns {Promise<*>}
   */
  async updateHeader(sheetName, values) {
    const range = `'${sheetName}'!A1:${columnToLetter(values.length)}1`; // +1 is the DateTime generated-column
    const url = `${SHEETS_API}${this.spreadsheetId}/values/${range}?access_token=${this.client.credentials.access_token}&valueInputOption=RAW&includeValuesInResponse=true`;
    const data = {
      range,
      majorDimension: 'ROWS',
      values: [values],
    };
    const res = await this.client.request({ url, method: 'put', data });
    return res.data;
  }

  async appendData(sheetName, values) {
    const range = `'${sheetName}'!A1:${columnToLetter(values.length)}1`; // +1 is the DateTime generated-column
    const url = `${SHEETS_API}${this.spreadsheetId}/values/${range}:append?access_token=${this.client.credentials.access_token}&valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const data = {
      range,
      majorDimension: 'ROWS',
      values: [values],
    };

    const res = await this.client.request({ url, method: 'post', data });
    return res.data;
  }

  async createSheet(sheetName) {
    const url = `${SHEETS_API}${this.spreadsheetId}:batchUpdate?access_token=${this.client.credentials.access_token}`;
    const data = {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        },
      ],
    };
    return this.client.request({ url, method: 'post', data });
  }
}

/**
 * Higher-order function which can be used by array.reduce(groupBy('key'), {}) to convert
 * an array into an object grouped-by the specified key
 * @param {string} keyProperty          Property to group the elements on
 * @returns {function(acc, curr): {}}   Accumulator function for use within array.reduce()
 */
function groupBy(keyProperty) {
  return (acc, curr) =>
    Object.assign(
      acc,
      { [curr[keyProperty]]: [...(acc[curr[keyProperty]] || []), curr] }, // Uses array-destructuring to concat to existing or create new arr
    );
}

function columnToLetter(column) {
  let temp,
    letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

module.exports = {
  SheetService,
};
