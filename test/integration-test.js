require('dotenv-safe').config();

const smetrics = require('../src/index');

smetrics.addMetric('sheet a', 'Metric 1', new Date().getMilliseconds());
smetrics.addMetric('sheet b', 'Objects of the future', new Date().getSeconds());
smetrics.addMetric('sheet a', 'Metric 2', new Date().getDay());

smetrics.commit(process.env.SMETRICS_SPREADSHEET_ID, {
  clientEmail: process.env.SMETRICS_GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  privateKey: process.env.SMETRICS_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  dateFormat: 'googleDate',
}).catch(err => {
  console.log(err);
});
