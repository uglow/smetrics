'use strict';

const { SheetService } = require('./sheet');

describe('SheetService', () => {

  function getMockClient(mockResponse = '') {
    return {
      credentials: {
        access_token: 'token',
      },
      request: jest.fn().mockResolvedValue({data: mockResponse})
    }
  }

  it('should be createable using a non-blank spreadsheet id', () => {
    expect(() => new SheetService()).toThrow('Spreadsheet id must be supplied');
    expect(new SheetService('foo')).toBeDefined();
  });

  describe('.authorize()', () => {
    it('should be call the clientService.authorize() method, passing the credentials and scopes', () => {
      const service = new SheetService('foo');
      const mockAuthService = function(...params) {
        return {
          authorize() {},
          params: params
        };
      };

      service.authorize({
        client_email: 'a@b.com',
        private_key: 'really long key',
      }, mockAuthService);

      // The client was called with the following params
      expect(service.client.params).toEqual([{
        email: 'a@b.com',
        key: 'really long key',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      }]);
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

      // Well this is a bit weird! Thanks to Jest. In non-Jest context, you don't need to do this.
      await await await await service.addData(require('../fixtures/smetrics.json'));

      expect(service.createSheet.mock.calls[0]).toEqual(['sheet a']);
      expect(service.createSheet.mock.calls[1]).toEqual(['sheet b']);

      expect(service.updateHeader.mock.calls[0]).toEqual(['sheet a', ['DateTime', 'Metric 1', 'Metric 2']]);
      expect(service.updateHeader.mock.calls[1]).toEqual(['sheet b', ['DateTime', 'Objects of the future']]);

      expect(service.appendData.mock.calls[0]).toMatchSnapshot();
      expect(service.appendData.mock.calls[1]).toMatchSnapshot();
    });

    it('should still add data even if createSheet() rejects (as happens when the sheet exists already)', async () => {
      const service = new SheetService('foo');
      service.createSheet = jest.fn().mockRejectedValue({ errors: [{ message: 'Invalid requests[0].addSheet: A sheet with the name "sheet a" already exists. Please enter another name.'}]});
      service.updateHeader = jest.fn().mockResolvedValue();
      service.appendData = jest.fn().mockResolvedValue();

      // Well this is a bit weird (below)! Thanks to Jest. In non-Jest contexts, you don't need to do this.
      await await await await service.addData(require('../fixtures/smetrics.json'));

      expect(service.createSheet.mock.calls.length).toEqual(2);
      expect(service.updateHeader.mock.calls.length).toEqual(2);
      expect(service.appendData.mock.calls.length).toEqual(2);
    });


    it('should be able to process two-or-more records at a time', async () => {
      const service = new SheetService('foo');
      service.createSheet = jest.fn().mockResolvedValue();
      service.updateHeader = jest.fn().mockResolvedValue();
      service.appendData = jest.fn().mockResolvedValue();

      // Well this is a bit weird (below)! Thanks to Jest. In non-Jest contexts, you don't need to do this.
      await await await await service.addData(require('../fixtures/smetrics-multiple.json'));

      expect(service.createSheet.mock.calls[0]).toEqual(['sheet a']);
      expect(service.createSheet.mock.calls[1]).toEqual(['sheet b']);

      expect(service.updateHeader.mock.calls[0]).toEqual(['sheet a', ['DateTime', 'Metric 1']]);
      expect(service.updateHeader.mock.calls[1]).toEqual(['sheet b', ['DateTime', 'Objects of the future']]);

      expect(service.appendData.mock.calls[0]).toMatchSnapshot();
      expect(service.appendData.mock.calls[1]).toMatchSnapshot();
    });
  });
});

