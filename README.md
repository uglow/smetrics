# smetrics

[![NPM Version](https://img.shields.io/npm/v/smetrics.svg?style=flat-square)](http://npm.im/smetrics)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Coverage Status](https://coveralls.io/repos/github/uglow/smetrics/badge.svg?branch=master)](https://coveralls.io/github/uglow/smetrics?branch=master)
[![Dependencies status](https://david-dm.org/uglow/smetrics/status.svg?theme=shields.io)](https://david-dm.org/uglow/smetrics#info=dependencies)
[![Dev-dependencies status](https://david-dm.org/uglow/smetrics/dev-status.svg?theme=shields.io)](https://david-dm.org/uglow/smetrics#info=devDependencies)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

> Records metrics to your Google Sheets spreadsheet 

`smetrics` is designed to persist metrics (test runs, test coverage, build times, load times, etc) using Google Sheets.
Google Sheets provides cloud-storage for the data, allowing you to see the changes in the metrics over time (and graph them yourself).

## Install

`npm install smetrics --dev`


## Usage

``` js
// File: processMetrics.js
// Lets say you've just built your code, run your unit and performance tests.
// Now you want to persist the results somewhere so you can see the changes over time.

const fs = require('fs');
const smetrics = require('smetrics');

function addUnitTestMetrics() {
  const stats = require('./test-reports/unit.json');
  const tabName = 'My Stats';
  
  smetrics.addMetric(tabName, 'Total tests', stats.numTotalTests);
  smetrics.addMetric(tabName, 'Passed tests', stats.numPassedTests);
}

// Gather all the metrics then commit them to Google Sheets
addUnitTestMetrics();
...

// See Authentication section for how to generate this information
const creds = require('./google-generated-creds.json');
// OR, if you cannot save the file locally (like on heroku)
const options = {
  clientEmail: process.env.SMETRICS_GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  privateKey: process.env.SMETRICS_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  dateTimeFormat: 'googleDate', // defaults to 'milliseconds',
  filePath: '/tmp/yourfile.json' // defaults to CWD + 'smetrics.json'
}
smetrics.commit('<spreadsheet key>', options); // Async - returns a promise 

```

### Important
**The order that metrics are added is significant.** If you decide to change the order that you add metrics, you
should open the corresponding Google Sheet and change the column-order to match your new metric-capturing order.

### Usage within AWS Lambda functions

Because this library persists state to a file, you need to specify the `filePath` when calling `addMetric` and `commit`
with a path underneath the `/tmp` directory:

``` js
const fs = require('fs');
const smetrics = require('smetrics');

// NOTE: filePath is specified explicitly, under the '/tmp' folder
smetrics.addMetric(tabName, 'Total tests', stats.numTotalTests, { filePath: '/tmp/smetrics.json' });

// See Authentication section for how to generate this information
const creds = require('./google-generated-creds.json');
// OR, if you cannot save the file locally (like on heroku)
const options = {
  clientEmail: process.env.SMETRICS_GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  privateKey: process.env.SMETRICS_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  dateTimeFormat: 'googleDate',

  // NOTE: filePath is specified explicitly:
  filePath: '/tmp/smetrics.json'
}
smetrics.commit('<spreadsheet key>', options); // Async - returns a promise 

```

## API

### `addMetric(sheetName, column, value, options) : object`

Adds a metric to the temporary metric-file 

- `sheetName` <string> The name of the sheet within the spreadsheet
- `column` <string> The name of the column within the sheet
- `value` <any> The value to store
- `options` <object> (optional):
  - `timestamp` <timeMillis> The timestamp to associate with the metric. Defaults to the current time.
  - `filePath` <string> The file path to write the metric data to. Defaults to current working directory 'smetrics.json'

### `commit(spreadsheetKey, options) : void`

- `spreadsheetId` <string> The SpreadsheetId

Reads the metrics in the metric-data file ('smetrics.json') and persists it to the
designated Google Sheet.

- `sheetName` <string> The name of the sheet within the spreadsheet
- `options` <object>:
  - `clientEmail` <string> This value is available in the JSON file that you can download when setting up Authentication with a service account.
  - `privateKey` <string> This value is available in the JSON file that you can download when setting up Authentication with a service account.
  - `dateFormat` <string|function> Default value 'milliseconds'.

The default format for DateTime columns is `milliseconds`, which is the number of milliseconds since the epoch (e.g. 1537165777561, 
which is equivalent to Mon Sep 17 2018 16:29:37 GMT+1000 (Australian Eastern Standard Time)).

Alternately, you can specify the format as `googleDate`, which formats the date as `dd-mon-yyyy hh:mm:ss`. 
Google sheets interprets this string as a date, and can be used correctly when the data is charted. You
may need to manually format the DateTime column as a 'Date Time' in the Google Sheet (once-only).

Lastly, you can supply a function for `dateFormat`, which has the signature `(timeMillis: Number) => any`.

## How it works

Every time a metric is added, a temporary file (`smetrics.json`, [example](fixtures/smetrics.json)) is created/updated in your 
current working directory with the metric name and a value:

```js
// smetrics.json:
[
  [
    { metric: 'Test Time (s)', value: 26 }, 
    { metric: 'Time to Interactive (ms)', value: 503 },
    // ...
  ]
]
```

When `commit(spreadsheet, creds)` is called, the `smetrics.json` file is appended to the specified spreadsheet as
a new row, with the first column containing a date-time stamp (generated using `Date.now()`).


## Hacking `smetrics`

Since this package ultimately processes a file called `smetrics.json` when `smetrics.commit(...)` is called, 
you are welcome to write to this file yourself, rather than call `smetrics.addMetric(...)`. If you stick to the same 
format as [this example](fixtures/smetrics.json), and follow the authentication process, you
may even add multiple rows of metrics in one go (Why would you want to? I'm not sure).


## Authentication

### Service Account (recommended method)

This is a 2-legged OAuth method and designed to be "an account that belongs to your application instead of to an individual end user".
Use this for an app that needs to access a set of documents that you have full access to.
([read more](https://developers.google.com/identity/protocols/OAuth2ServiceAccount))

__Setup Instructions__

1. Go to the [Google Developers Console](https://console.developers.google.com/project)
1. Select your project or create a new one (and then select it)
1. Enable the Drive API for your project
   1. In the sidebar on the left, expand APIs & auth > APIs
   1. Search for "sheets"
   1. Click on "Google Sheets API"
   1. Click the blue "Enable API" button
1. Create a service account for your project:
   1. In the sidebar on the left, expand IAM & Admin > Service Accounts
   1. Click "Create Service Account" button
   1. Enter the service account name & a description for step 1 and press Create.
   1. Skip steps 2 & 3 by pressing Cancel
   1. In the Service Accounts panel, select Actions > Manages Key
   1. Press Add Key > Create New Key
   1. Select the "JSON" key type option
   1. Click blue "Create" button.
   
Your JSON key file is generated and downloaded to your machine (it is the only copy!)
note your service account's email address (also available in the JSON key file)
Share the doc (or docs) with your service account using the email noted above.

The `private_key` field in the JSON file that is the private key.

### Sharing the sheet with the service account

1. Open the Google Sheet
1. Press the Share button.
1. In the Share dialog, type the service accounts email: your-service-account-name@google-app.iam.gserviceaccount.com
1. Press Send.

## Spreadsheet ID

The Spreadsheet ID can be found in the URL of the spreadsheet.

E.g. docs.google.com/spreadsheets/d/:spreadsheetID:/edit#gid=0

## Graphing the results

Once you have the data in your spreadsheet, you can provide read-access to allow other tools

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).


## License

This software is licensed under the MIT Licence. See [LICENSE](LICENSE).

