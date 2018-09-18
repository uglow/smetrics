'use strict';

const appRoot = require('app-root-path');
const fs = require('fs');
const path = require('path');
const { SheetService } = require('./sheet');

const METRICS_FILE = 'smetrics.json';

/**
 * Adds a metric to the metric file. Synchronous
 * @param categort - will become the sheetname that the metric is added too.
 * @param metric
 * @param value
 * @param timestamp
 * @returns {Object}
 */
function addMetric(category, metric, value, timeStamp = Date.now()) {
  const filePath = path.resolve(appRoot.toString(), METRICS_FILE);

  // Before adding a metric, setup the temporary metric file
  initMetricsFile(filePath);

  const metrics = readMetricFile(filePath); // Initial value: [[]]

  // Add the metric to the first item. Other processes may add other rows.
  metrics[0].push({ sheet: category, metric: String(metric), value, t: timeStamp });
  fs.writeFileSync(filePath, JSON.stringify(metrics, null, '  '));

  return metrics;
}


/**
 * Attempts to write to Google sheets using the credentials supplied. Asynchronous (returns a Promise)
 * @param spreadsheetKey {string}
 * @param options {Object}
 */
async function commit(spreadsheetKey, options, sheetService = new SheetService(spreadsheetKey, options)) {
  let data;
  try {
    data = readMetricFile();
  } catch(err) {
    console.error(`${METRICS_FILE} file was not found in ${appRoot.toString()}`);
    return;
  }

  await sheetService.authorize(options);

  // Check if the first row has data.
  try {
    await sheetService.addData(data);
  } catch (err) {
     console.error(err);
  } finally {
    cleanup();
  }
}


/**
 * Reads the specified file as a JSON file. Exposed to make testing easier
 * @param filePath
 * @returns Object
 * @private
 */
function readMetricFile(filePath = path.resolve(appRoot.toString(), METRICS_FILE)) {
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

function cleanup(filePath = path.resolve(appRoot.toString(), METRICS_FILE)) {
  fs.unlinkSync(filePath);
}

module.exports = {
  addMetric,
  readMetricFile,
  commit,
  appRoot,
};
