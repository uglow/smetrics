require('dotenv-safe').config();

const smetrics = require('../src/index');

smetrics.addMetric('sheet a', 'Metric 1', 11);
smetrics.addMetric('sheet b', 'Objects of the future', 'car');
smetrics.addMetric('sheet a', 'Metric 2', '503');

smetrics.commit(process.env.SMETRICS_SPREADSHEET_ID, {
  client_email: process.env.SMETRICS_GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  private_key: process.env.SMETRICS_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
}).catch(err => {
  console.log(err);
});
