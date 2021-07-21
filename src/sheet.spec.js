import { SheetService } from './sheet';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

describe('SheetService', () => {
  function getMockClient(mockResponse = '') {
    return {
      credentials: {
        access_token: 'token',
      },
      request: jest.fn().mockResolvedValue({ data: mockResponse }),
    };
  }

  it('should be createable using a non-blank spreadsheet id', () => {
    expect(() => new SheetService()).toThrow('Spreadsheet id must be supplied');

    const service = new SheetService('foo');
    expect(service).toBeDefined();
  });

  describe('dateFormat', () => {
    it('should be possible to specify the dateFormat as "googleDate" or "milliseconds"', () => {
      let service = new SheetService('foo', { dateFormat: 'googleDate' });
      expect(service.dateFormat(123)).toEqual('1-Jan-1970 0:00:00');

      service = new SheetService('foo', { dateFormat: 'milliseconds' });
      expect(service.dateFormat(123)).toEqual(123);

      expect(() => new SheetService('foo', { dateFormat: 'unknown' })).toThrow(
        'Invalid dateFormat. dateFormat must be one of: milliseconds, googleDate',
      );
    });

    it('should be possible to specify the dateFormat as a function', () => {
      const myDateFunction = () => 'not a date!';

      let service = new SheetService('foo', { dateFormat: myDateFunction });
      expect(service.dateFormat(123)).toEqual('not a date!');

      expect(() => new SheetService('foo', { dateFormat: 123 })).toThrow(
        'Invalid dateFormat. dateFormat must be a string or a function',
      );
    });
  });

  describe('.authorize()', () => {
    it('should be call the clientService.authorize() method, passing the credentials and scopes', () => {
      const service = new SheetService('foo');
      const mockAuthService = function (...params) {
        return {
          authorize() {},
          params: params,
        };
      };

      service.authorize(
        {
          clientEmail: 'a@b.com',
          privateKey: 'really long key',
        },
        mockAuthService,
      );

      // The client was called with the following params
      expect(service.client.params).toEqual([
        {
          email: 'a@b.com',
          key: 'really long key',
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        },
      ]);
    });
  });

  describe('.updateHeader()', () => {
    it('should be call the clientService.request() method, passing the correct data', async () => {
      const service = new SheetService('foo');
      service.client = getMockClient();

      await service.updateHeader('Sheet 2', ['DateTime', 'Metric 1', 'Metric 2']);

      expect(service.client.request.mock.calls).toMatchSnapshot();
    });
  });

  describe('.appendData()', () => {
    it('should be call the clientService.request() method, passing the correct data', async () => {
      const service = new SheetService('foo');
      service.client = getMockClient();

      await service.appendData('Sheet 2', ['12322311277', '78', 12]);

      expect(service.client.request.mock.calls).toMatchSnapshot();
    });
  });

  describe('.createSheet()', () => {
    it('should be call the clientService.request() method, passing the correct data', async () => {
      const service = new SheetService('foo');
      service.client = getMockClient();

      await service.createSheet('Sp a ces');

      expect(service.client.request.mock.calls).toMatchSnapshot();
    });
  });

  describe('.addData()', () => {
    it('should call createSheet(), updateHeader() and appendData() for each record it is passed', async () => {
      const service = new SheetService('foo');
      service.createSheet = jest.fn().mockResolvedValue();
      service.updateHeader = jest.fn().mockResolvedValue();
      service.appendData = jest.fn().mockResolvedValue();
      const fixture = fileURLToPath(new URL('../fixtures/smetrics.json', import.meta.url));
      const data = JSON.parse(fs.readFileSync(fixture, 'utf8'));

      await service.addData(data);

      expect(service.createSheet.mock.calls[0]).toEqual(['sheet a']);
      expect(service.createSheet.mock.calls[1]).toEqual(['sheet b']);

      expect(service.updateHeader.mock.calls[0]).toEqual(['sheet a', ['DateTime', 'Metric 1', 'Metric 2']]);
      expect(service.updateHeader.mock.calls[1]).toEqual(['sheet b', ['DateTime', 'Objects of the future']]);

      expect(service.appendData.mock.calls[0]).toMatchSnapshot();
      expect(service.appendData.mock.calls[1]).toMatchSnapshot();
    });

    it('should apply the dateFormat correctly when calling appendData()', async () => {
      const service = new SheetService('foo', { dateFormat: 'googleDate' });
      service.createSheet = jest.fn().mockResolvedValue();
      service.updateHeader = jest.fn().mockResolvedValue();
      service.appendData = jest.fn().mockResolvedValue();
      const fixture = fileURLToPath(new URL('../fixtures/smetrics.json', import.meta.url));
      const data = JSON.parse(fs.readFileSync(fixture, 'utf8'));

      await service.addData(data);

      expect(service.createSheet.mock.calls[0]).toEqual(['sheet a']);
      expect(service.createSheet.mock.calls[1]).toEqual(['sheet b']);

      expect(service.updateHeader.mock.calls[0]).toEqual(['sheet a', ['DateTime', 'Metric 1', 'Metric 2']]);
      expect(service.updateHeader.mock.calls[1]).toEqual(['sheet b', ['DateTime', 'Objects of the future']]);

      expect(service.appendData.mock.calls[0]).toMatchSnapshot();
      expect(service.appendData.mock.calls[1]).toMatchSnapshot();
    });

    it('should still add data even if createSheet() rejects (as happens when the sheet exists already)', async () => {
      const service = new SheetService('foo');
      service.createSheet = jest.fn().mockRejectedValue({
        errors: [
          {
            message:
              'Invalid requests[0].addSheet: A sheet with the name "sheet a" already exists. Please enter another name.',
          },
        ],
      });
      service.updateHeader = jest.fn().mockResolvedValue();
      service.appendData = jest.fn().mockResolvedValue();
      const fixture = fileURLToPath(new URL('../fixtures/smetrics.json', import.meta.url));
      const data = JSON.parse(fs.readFileSync(fixture, 'utf8'));

      await service.addData(data);

      expect(service.createSheet.mock.calls.length).toEqual(2);
      expect(service.updateHeader.mock.calls.length).toEqual(2);
      expect(service.appendData.mock.calls.length).toEqual(2);
    });

    it('should be able to process two-or-more records at a time', async () => {
      const service = new SheetService('foo');
      service.createSheet = jest.fn().mockResolvedValue();
      service.updateHeader = jest.fn().mockResolvedValue();
      service.appendData = jest.fn().mockResolvedValue();
      const fixture = fileURLToPath(new URL('../fixtures/smetrics-multiple.json', import.meta.url));
      const data = JSON.parse(fs.readFileSync(fixture, 'utf8'));

      await service.addData(data);

      expect(service.createSheet.mock.calls[0]).toEqual(['sheet a']);
      expect(service.createSheet.mock.calls[1]).toEqual(['sheet b']);

      expect(service.updateHeader.mock.calls[0]).toEqual(['sheet a', ['DateTime', 'Metric 1']]);
      expect(service.updateHeader.mock.calls[1]).toEqual(['sheet b', ['DateTime', 'Objects of the future']]);

      expect(service.appendData.mock.calls[0]).toMatchSnapshot();
      expect(service.appendData.mock.calls[1]).toMatchSnapshot();
    });
  });
});
