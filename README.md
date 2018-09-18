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
  
  smetrics.addMetric('Total tests', stats.numTotalTests);
  smetrics.addMetric('Passed tests', stats.numPassedTests);
}

// Gather all the metrics then commit them to Google Sheets
addUnitTestMetrics();
...

// See Authentication section for how to generate this information
const creds = require('./google-generated-creds.json');
// OR, if you cannot save the file locally (like on heroku)
const options = {
  client_email: process.env.SMETRICS_GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  private_key: process.env.SMETRICS_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  dateTimeFormat: 'googleDate', // defaults to 'milliseconds'
}
smetrics.commit('<spreadsheet key>', options); // Async - returns a promise 

```

### Important
**The order that metrics are added is significant.** If you decide to change the order that you add metrics, you
should open the corresponding Google Sheet and change the column-order to match your new metric-capturing order.


### The `options` parameter

#### `client_email` (string)

This value is available in the JSON file that you can download when setting up Authentication with a service account.

#### `private_key` (string)

This value is available in the JSON file that you can download when setting up Authentication with a service account.

#### `dateTimeFormat` (string, default = 'milliseconds')

The default format for the DateTime column is `milliseconds`, which is the number of milliseconds since the epoch (e.g. 1537165777561, 
which is equivalent to Mon Sep 17 2018 16:29:37 GMT+1000 (Australian Eastern Standard Time)).

Alternately, you can specify the format as `googleDate`, which formats the date as `dd-mon-yyyy hh:mm:ss`. 
Google sheets interprets this string as a date, and can be used correctly when the data is charted. You
may need to manually format the DateTime column as a 'Date Time' in the Google Sheet (once-only).

## How it works

Every time a metric is added using this module, a temporary file (`smetrics.json`, [example](fixtures/smetrics.json)) is created/updated in your 
application's root directory (using the [app-root-path](https://www.npmjs.com/package/app-root-path) module),
with the metric name and a value:

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

IMPORTANT: Google recently deprecated their ClientLogin (username+password)
access, so things are slightly more complicated now. Older versions of this
module supported it, so just be aware that things changed.

### Unauthenticated access (read-only access on public docs)

By default, this module makes unauthenticated requests and can therefore
only access spreadsheets that are "public".

The Google Spreadsheets Data API reference and developers guide is a little
ambiguous about how you access a "published" public Spreadsheet.

If you wish to work with a Google Spreadsheet without authenticating, not only
must the Spreadsheet in question be visible to the web, but it must also have
been explicitly published using "File > Publish to the web" menu option in
the google spreadsheets GUI.

Many seemingly "public" sheets have not also been "published" so this may
cause some confusion.

*Unauthenticated requests allow reading, but not writing to sheets. To write on a sheet, you must authenticate.*


### Service Account (recommended method)

This is a 2-legged OAuth method and designed to be "an account that belongs to your application instead of to an individual end user".
Use this for an app that needs to access a set of documents that you have full access to.
([read more](https://developers.google.com/identity/protocols/OAuth2ServiceAccount))

__Setup Instructions__

1. Go to the [Google Developers Console](https://console.developers.google.com/project)
2. Select your project or create a new one (and then select it)
3. Enable the Drive API for your project
   - In the sidebar on the left, expand __APIs & auth__ > __APIs__
   - Search for "drive"
   - Click on "Drive API" or "Google Sheets API"
   - click the blue "Enable API" button
4. Create a service account for your project
   - In the sidebar on the left, expand __APIs & auth__ > __Credentials__
   - Click blue "Add credentials" button
   - Select the "Service account" option
   - Select "Furnish a new private key" checkbox
   - Select the "JSON" key type option
   - Click blue "Create" button
   - your JSON key file is generated and downloaded to your machine (__it is the only copy!__)
   - note your service account's email address (also available in the JSON key file)
5. **Share the doc (or docs) with your service account using the email noted above.**


## Graphing the results

Once you have the data in your spreadsheet, you can provide read-access to allow other tools


## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).


## License

This software is licensed under the MIT Licence. See [LICENSE](LICENSE).

