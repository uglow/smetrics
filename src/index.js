'use strict';

const fs = require('fs');
const path = require('path');
const { SheetService } = require('./sheet');

const METRICS_FILE = path.resolve(process.cwd(), 'smetrics.json');

/**
 * Adds a metric to the metric file. Synchronous
 * @param sheetName - will become the sheetname that the metric is added too.
 * @param column
 * @param value
 * @param timestamp
 * @param filePath
 * @returns {Object}
 */
function addMetric(sheetName, column, value, { timestamp = Date.now(), filePath = METRICS_FILE }) {
  // Before adding a metric, setup the temporary metric file
  initMetricsFile(filePath);

  const metrics = readMetricFile(filePath); // Initial value: [[]]

  // Add the metric to the first item. Other processes may add other rows.
  metrics[0].push({ sheet: sheetName, metric: String(column), value, t: timestamp });
  fs.writeFileSync(filePath, JSON.stringify(metrics, undefined, '  '));

  return metrics;
}

/**
 * Attempts to write to Google sheets using the credentials supplied. Asynchronous (returns a Promise)
 * @param spreadsheetId {string}
 * @param options {object}
 * @param options.clientEmail {string}
 * @param options.dateFormat {string}   Used by the sheetService
 * @param options.filePath {string}
 * @param options.privateKey {string}
 * @param sheetService {class}
 */
async function commit(spreadsheetId, options, sheetService = new SheetService(spreadsheetId, options)) {
  let data;
  const { filePath = METRICS_FILE, clientEmail, privateKey } = options;
  try {
    data = readMetricFile(filePath);
  } catch (err) {
    console.error(`Metrics file was not found: ${filePath}`, err);
    return;
  }

  await sheetService.authorize({ clientEmail, privateKey });

  // Check if the first row has data.
  try {
    await sheetService.addData(data);
  } catch (err) {
    console.error(err);
  } finally {
    cleanup(filePath);
  }
}

/**
 * Reads the specified file as a JSON file. Exposed to make testing easier
 * @param filePath
 * @returns Object
 * @private
 */
function readMetricFile(filePath = METRICS_FILE) {
  return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
}

/**
 * Creates the metric file if it does not exist
 * @param filePath
 * @returns {any}
 * @private
 */
function initMetricsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[[]]');
  }
}

function cleanup(filePath = METRICS_FILE) {
  fs.unlinkSync(filePath);
}

module.exports = {
  addMetric,
  readMetricFile,
  commit,
};
