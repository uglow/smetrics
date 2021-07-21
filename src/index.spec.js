import { addMetric, commit, readMetricFile } from '.';
import path from 'path';
import fs from 'fs';
import assert from 'assert';
import { jest } from '@jest/globals';

describe('smetrics', () => {
  let tempDir;
  let metricFile;

  // Setup a temp directory and temp metrics file (as output),
  // then tear the file and temp dir down after each test.
  beforeEach(() => {
    tempDir = path.join(process.cwd(), 'tempDir-' + Date.now());
    fs.mkdirSync(tempDir);
    metricFile = path.join(tempDir, 'metric.json');
  });

  afterEach(() => {
    // Allow either call to fail, but they must both be executed
    try {
      fs.unlinkSync(metricFile);
    } catch {}
    try {
      fs.rmdirSync(tempDir);
    } catch {}
    assert.throws(() => fs.statSync(tempDir), /no such file or directory/, 'directory should be removed');
  });

  describe('addMetric()', () => {
    it('should create the metric file with the metric value supplied', () => {
      expect(fs.existsSync(metricFile)).toEqual(false);

      const metrics = addMetric('perf', 'foo', 'bar', { timestamp: 111, filePath: metricFile });

      expect(metrics).toEqual([[{ sheet: 'perf', metric: 'foo', value: 'bar', t: 111 }]]);
      expect(fs.existsSync(metricFile)).toEqual(true);

      // Verify that the contents matches what the function returns
      expect(readMetricFile(metricFile)).toEqual(metrics);
    });

    it('should update the metric file as metrics are added, and store the values in the same order that they were provided', () => {
      expect(fs.existsSync(metricFile)).toEqual(false);

      addMetric('cat A', 'one', 'bar', { timestamp: 1, filePath: metricFile });
      addMetric('cat A', 'TWO', 22, { timestamp: 2, filePath: metricFile });
      const metrics = addMetric('cat B', 33, 0.3, { timestamp: 1, filePath: metricFile });

      expect(metrics).toEqual([
        [
          { sheet: 'cat A', metric: 'one', value: 'bar', t: 1 },
          { sheet: 'cat A', metric: 'TWO', value: 22, t: 2 },
          { sheet: 'cat B', metric: '33', value: 0.3, t: 1 },
        ],
      ]);
      expect(fs.existsSync(metricFile)).toEqual(true);

      // Verify that the contents matches what the function returns
      expect(readMetricFile(metricFile)).toEqual(metrics);
    });
  });

  describe('commit()', () => {
    it('should do nothing if there are no metrics', async () => {
      const mockService = {
        authorize: jest.fn().mockResolvedValue(), // promise
        addData: jest.fn().mockResolvedValue(), // promise
      };
      expect(fs.existsSync(metricFile)).toEqual(false);

      await commit('spreadsheetId', { filePath: metricFile }, mockService);

      expect(mockService.authorize.mock.calls.length).toEqual(0);
      expect(mockService.addData.mock.calls.length).toEqual(0);
    });

    it('should call the SheetService then remove the metrics file afterwards', async () => {
      expect(fs.existsSync(metricFile)).toEqual(false);

      addMetric('cat A', 'one', 'bar', { timestamp: 1, filePath: metricFile });
      expect(fs.existsSync(metricFile)).toEqual(true);

      // Commit the changes
      const mockService = {
        authorize: jest.fn().mockResolvedValue(), // promise
        addData: jest.fn().mockResolvedValue(), // promise
      };
      await commit('spreadsheetId', { filePath: metricFile }, mockService);

      expect(mockService.authorize.mock.calls.length).toEqual(1);
      expect(mockService.addData.mock.calls.length).toEqual(1);

      expect(fs.existsSync(metricFile)).toEqual(false);
    });

    it('should still remove the metrics file even if commit fails', async () => {
      expect(fs.existsSync(metricFile)).toEqual(false);

      addMetric('cat A', 'one', 'bar', { timestamp: 1, filePath: metricFile });
      expect(fs.existsSync(metricFile)).toEqual(true);

      // Commit the changes
      const mockService = {
        authorize: jest.fn().mockResolvedValue(), // promise
        addData: jest.fn().mockRejectedValue('test error'), // promise
      };
      await commit('spreadsheetId', { filePath: metricFile }, mockService);

      expect(mockService.authorize.mock.calls.length).toEqual(1);
      expect(mockService.addData.mock.calls.length).toEqual(1);

      expect(fs.existsSync(metricFile)).toEqual(false);
    });
  });
});
