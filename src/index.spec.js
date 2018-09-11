'use strict';

jest.mock('fs'); // Mock the file system with an in-memory file system. Makes it easier to clean up after each test

const smetrics = require('./index');
const path = require('path');
const fs = require('fs');

describe('smetrics.appRoot', () => {
  it('should correctly detect the app-root directory', () => {
    expect(smetrics.appRoot.toString()).toEqual(path.resolve(__dirname, '..'));
  });
});

describe('smetrics.addMetric()', () => {
  const metricDir = path.resolve(__dirname, '..', 'fixtures');
  const metricFile = path.resolve(metricDir, 'smetrics.json');

  beforeEach(() => {
    smetrics.appRoot.toString = () => metricDir;
  });

  afterEach(() => {
    fs.__resetMock();
  });

  it('should create the metric file with the metric value supplied', () => {
    expect(fs.existsSync(metricFile)).toEqual(false);

    const metrics = smetrics.addMetric('perf', 'foo', 'bar', 111);

    expect(metrics).toEqual([[{ sheet: 'perf', metric: 'foo', value: 'bar', t: 111}]]);
    expect(fs.existsSync(metricFile)).toEqual(true);

    // Verify that the contents matches what the function returns
    expect(smetrics.readMetricFile()).toEqual(metrics);
  });


  it('should update the metric file and store the values in the same order that they were provided', () => {
    expect(fs.existsSync(metricFile)).toEqual(false);

    smetrics.addMetric('cat A', 'one', 'bar', 1);
    smetrics.addMetric('cat A', 'TWO', 22, 2);
    const metrics = smetrics.addMetric('cat B', 33, 0.3, 1);

    expect(metrics).toEqual([
      [
        { sheet: 'cat A', metric: 'one', value: 'bar', t: 1},
        { sheet: 'cat A', metric: 'TWO', value: 22, t: 2},
        { sheet: 'cat B', metric: '33', value: 0.3, t: 1},
      ]
    ]);
    expect(fs.existsSync(metricFile)).toEqual(true);

    // Verify that the contents matches what the function returns
    expect(smetrics.readMetricFile()).toEqual(metrics);
  });
});

describe('smetrics.commit()', () => {
  const metricDir = path.resolve(__dirname, '..', 'fixtures');
  const metricFile = path.resolve(metricDir, 'smetrics.json');

  beforeEach(() => {
    smetrics.appRoot.toString = () => metricDir;
  });

  afterEach(() => {
    fs.__resetMock();
  });

  it('should do nothing if there are no metrics', async () => {
    const mockService = {
      authorize: jest.fn().mockResolvedValue(), // promise
      addData: jest.fn().mockResolvedValue() // promise
    };
    await smetrics.commit('spreadsheetKey', {}, mockService);

    expect(mockService.authorize.mock.calls.length).toEqual(0);
    expect(mockService.addData.mock.calls.length).toEqual(0);
  });

  it('should call the SheetService then remove the metrics file afterwards', async () => {
    expect(fs.existsSync(metricFile)).toEqual(false);

    smetrics.addMetric('cat A', 'one', 'bar', 1);
    expect(fs.existsSync(metricFile)).toEqual(true);

    // Commit the changes
    const mockService = {
      authorize: jest.fn().mockResolvedValue(), // promise
      addData: jest.fn().mockResolvedValue() // promise
    };
    await smetrics.commit('spreadsheetKey', {}, mockService);

    expect(mockService.authorize.mock.calls.length).toEqual(1);
    expect(mockService.addData.mock.calls.length).toEqual(1);

    expect(fs.existsSync(metricFile)).toEqual(false);
  });

  it('should still remove the metrics file even if commit fails', async () => {
    expect(fs.existsSync(metricFile)).toEqual(false);

    smetrics.addMetric('cat A', 'one', 'bar', 1);
    expect(fs.existsSync(metricFile)).toEqual(true);

    // Commit the changes
    const mockService = {
      authorize: jest.fn().mockResolvedValue(), // promise
      addData: jest.fn().mockRejectedValue('test error') // promise
    };
    await smetrics.commit('spreadsheetKey', {}, mockService);

    expect(mockService.authorize.mock.calls.length).toEqual(1);
    expect(mockService.addData.mock.calls.length).toEqual(1);

    expect(fs.existsSync(metricFile)).toEqual(false);
  });
});
