import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FileMasterService } from './file-master.service';
import { FileColumn } from '../models/FileColumn';
import { columnMasterEntry } from '../../../shared/models/objectListEntries/column-master-entry/column-master-entry';
import { firstValueFrom } from 'rxjs';

describe('FileMasterService', () => {
  let service: FileMasterService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FileMasterService]
    });
    service = TestBed.inject(FileMasterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getColumnsByFileId', () => {
    it('should return columns and update masterColumnsSubject', () => {
      const mockColumns: FileColumn[] = [
        { columnIndex: 1, columnName: 'Column1' },
        { columnIndex: 2, columnName: 'Column2' }
      ];
      const fileId = 1;

      service.getColumnsByFileId(fileId).subscribe(columns => {
        expect(columns).toEqual(mockColumns);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}${fileId}/original`);
      expect(req.request.method).toBe('GET');
      req.flush(mockColumns);

      service.masterColumns$.subscribe(columns => {
        expect(columns).toEqual(mockColumns);
      });
    });
  });

  describe('getSelectedColumnsByFileId', () => {
    it('should return selected columns and update selectedColumnsSubject', () => {
      const mockResponse = [
        { columnIndex: 1, columnName: 'Column1' },
        { columnIndex: 2, columnName: 'Column2' }
      ];
      const expectedColumns: FileColumn[] = [
        { columnIndex: 1, columnName: 'Column1' },
        { columnIndex: 2, columnName: 'Column2' }
      ];
      const fileId = 1;

      service.getSelectedColumnsByFileId(fileId).subscribe(columns => {
        expect(columns).toEqual(expectedColumns);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}${fileId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      service.selectedColumns.subscribe(columns => {
        expect(columns).toEqual(expectedColumns);
      });
    });
  });

  describe('toggleColumnSelection', () => {
    it('should send a POST request to toggle column selection', () => {
      const fileId = 1;
      const columnIndex = 1;
      const columnName = 'Column1';
      const mockResponse = { success: true };

      service.toggleColumnSelection(fileId, columnIndex, columnName).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}toggle`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        fileId: fileId,
        column: {
          index: columnIndex,
          name: columnName
        }
      });
      req.flush(mockResponse);
    });
  });

  describe('getDataColumnsByFileId', () => {
    it('should return data columns and update dataColumnsSubject', async () => {
      const mockResponse = {
        data: [
          { labels: ['Label1', 'Label2'] },
          { labels: ['Label3', 'Label4'] }
        ]
      };
      const expectedColumns: columnMasterEntry[] = [
        new columnMasterEntry(['Label1', 'Label2']),
        new columnMasterEntry(['Label3', 'Label4'])
      ];
      const fileId = 1;

      const promise = service.getDataColumnsByFileId(fileId);
      const req = httpMock.expectOne(`${service['baseUrl']}${fileId}/extract`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(expectedColumns);

      service.dataColumns$.subscribe(columns => {
        expect(columns).toEqual(expectedColumns);
      });
    });

    it('should handle errors when fetching data columns', async () => {
      const fileId = 1;
      const mockError = { status: 404, statusText: 'Not Found' };

      const promise = service.getDataColumnsByFileId(fileId);
      const req = httpMock.expectOne(`${service['baseUrl']}${fileId}/extract`);
      expect(req.request.method).toBe('GET');
      req.flush(null, mockError);

      try {
        await promise;
        fail('Expected an error but got a successful response');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });
});