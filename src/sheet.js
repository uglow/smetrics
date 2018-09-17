const {JWT} = require('google-auth-library');

const GOOGLE_AUTH_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets/';

class SheetService {
  constructor(spreadsheetId) {
    if (!spreadsheetId) throw new Error('Spreadsheet id must be supplied');

    this.spreadsheetId = spreadsheetId;
  }

  authorize(creds, authService = JWT) {
    this.client = new authService({email: creds.client_email, key: creds.private_key, scopes: GOOGLE_AUTH_SCOPES});
    return this.client.authorize(); // Returns the access token
  }

  async addData(records) {
    // First step. Assume we have multi-dimensional array.
    records.forEach(recordArr => {
      // Start by grouping the elements by category
      const groupedItems = recordArr.reduce(groupBy('sheet'), {});

      // Now for each sheet...
      Object.keys(groupedItems).forEach(async sheet => {
        // Create the sheet (in case it does not exist)
        try {
          await this.createSheet(sheet);
        } catch (err) {
          if (err && err.errors && err.errors.length) {
            if (err.errors[0].message.indexOf('already exists. Please enter another name') === -1) {
              err.errors.forEach(console.log);
            }
          } else {
            console.error(err);
          }
        }
        // Update the header then add a new row
        await this.updateHeader(sheet, ['DateTime'].concat(groupedItems[sheet].map(item => item.metric)))
          .then(() => this.appendData(sheet, [groupedItems[sheet][0].t].concat(groupedItems[sheet].map(item => item.value))));
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
      values: [values]
    };
    const res = await this.client.request({url, method: 'put', data});
    return res.data;
  }

  async appendData(sheetName, values) {
    const range = `'${sheetName}'!A1:${columnToLetter(values.length)}1`; // +1 is the DateTime generated-column
    const url = `${SHEETS_API}${this.spreadsheetId}/values/${range}:append?access_token=${this.client.credentials.access_token}&valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    const data = {
      range,
      majorDimension: 'ROWS',
      values: [values]
    };

    const res = await this.client.request({url, method: 'post', data});
    return res.data;
  }

  async createSheet(sheetName) {
    const url = `${SHEETS_API}${this.spreadsheetId}:batchUpdate?access_token=${this.client.credentials.access_token}`;
    const data = {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }
      ]
    };
    return this.client.request({url, method: 'post', data});
  }
}

/**
 * Higher-order function which can be used by array.reduce(groupBy('key'), {}) to convert
 * an array into an object grouped-by the specified key
 * @param {string} keyProperty          Property to group the elements on
 * @returns {function(acc, curr): {}}   Accumulator function for use within array.reduce()
 */
function groupBy(keyProperty) {
  return (acc, curr) => Object.assign(
    acc,
    {[curr[keyProperty]]: [...(acc[curr[keyProperty]] || []), curr]}, // Uses array-destructuring to concat to existing or create new arr
  );
}


function columnToLetter(column) {
  let temp, letter = '';
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
