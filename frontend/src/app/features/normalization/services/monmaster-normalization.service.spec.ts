import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MonMasterNormalizationService, IndexedMonMasterField } from './monmaster-normalization.service';

describe('MonMasterNormalizationService', () => {
    let service: MonMasterNormalizationService;
    let httpTestingController: HttpTestingController;
    const baseUrl = 'http://localhost:3000/api/monmaster-normalization';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                MonMasterNormalizationService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(MonMasterNormalizationService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('processFile', () => {
        it('should successfully process a file', () => {
            const fileId = 123;
            const mockResponse = { success: true, message: 'File processed successfully' };

            service.processFile(fileId).subscribe(result => {
                expect(result.success).toBeTrue();
                expect(result.message).toBe('File processed successfully');
            });

            const req = httpTestingController.expectOne(`${baseUrl}/process/${fileId}`);
            expect(req.request.method).toBe('POST');
            req.flush(mockResponse);
        });

        it('should handle already processed file with 409 error', () => {
            const fileId = 123;
            const errorResponse = { status: 409, statusText: 'Conflict' };

            service.processFile(fileId).subscribe(result => {
                expect(result.success).toBeTrue(); // 409 is considered success because file is already processed
                expect(result.message).toBe('File already processed');
            });

            const req = httpTestingController.expectOne(`${baseUrl}/process/${fileId}`);
            expect(req.request.method).toBe('POST');
            req.flush({ message: 'File already processed' }, errorResponse);
        });

        it('should handle processing error with other status codes', () => {
            const fileId = 123;
            const errorResponse = { status: 500, statusText: 'Server Error' };

            service.processFile(fileId).subscribe(result => {
                expect(result.success).toBeFalse();
                expect(result.message).toBe('Server Error');
            });

            const req = httpTestingController.expectOne(`${baseUrl}/process/${fileId}`);
            expect(req.request.method).toBe('POST');
            req.flush({ message: 'Server Error' }, errorResponse);
        });
    });

    describe('isFileProcessed', () => {
        it('should return true when file is processed', () => {
            const fileId = 123;
            const mockResponse = { success: true };

            service.isFileProcessed(fileId).subscribe(result => {
                expect(result).toBeTrue();
            });

            const req = httpTestingController.expectOne(`${baseUrl}/data/${fileId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });

        it('should return false when file is not processed', () => {
            const fileId = 123;
            const errorResponse = { status: 404, statusText: 'Not Found' };

            service.isFileProcessed(fileId).subscribe(result => {
                expect(result).toBeFalse();
            });

            const req = httpTestingController.expectOne(`${baseUrl}/data/${fileId}`);
            expect(req.request.method).toBe('GET');
            req.error(new ErrorEvent('error'), errorResponse);
        });
    });

    describe('getAvailableFields', () => {
        it('should return fields when available', () => {
            const fileId = 123;
            const mockFields: IndexedMonMasterField[] = [
                { index: 0, name: 'Field1', type: 'string', description: 'Description 1', category: 'candidate' },
                { index: 1, name: 'Field2', type: 'number', description: 'Description 2', category: 'academic' }
            ];
            const mockResponse = { success: true, data: { fields: mockFields } };

            service.getAvailableFields(fileId).subscribe(result => {
                expect(result).toEqual(mockFields);
                expect(result.length).toBe(2);
            });

            const req = httpTestingController.expectOne(`${baseUrl}/fields/${fileId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });

        it('should return empty array when no fields available', () => {
            const fileId = 123;
            const mockResponse = { success: false };

            service.getAvailableFields(fileId).subscribe(result => {
                expect(result).toEqual([]);
                expect(result.length).toBe(0);
            });

            const req = httpTestingController.expectOne(`${baseUrl}/fields/${fileId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });
    });

    describe('getIndexedRecords', () => {
        it('should return records when available', () => {
            const fileId = 123;
            const mockRecords = [
                { id: 1, name: 'John Doe', score: 85 },
                { id: 2, name: 'Jane Smith', score: 92 }
            ];
            const mockResponse = { success: true, data: mockRecords };

            service.getIndexedRecords(fileId).subscribe(result => {
                expect(result).toEqual(mockRecords);
                expect(result.length).toBe(2);
            });

            const req = httpTestingController.expectOne(`${baseUrl}/indexed-records/${fileId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });

        it('should return empty array when no records available', () => {
            const fileId = 123;
            const mockResponse = { success: false };

            service.getIndexedRecords(fileId).subscribe(result => {
                expect(result).toEqual([]);
                expect(result.length).toBe(0);
            });

            const req = httpTestingController.expectOne(`${baseUrl}/indexed-records/${fileId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });
    });
});
