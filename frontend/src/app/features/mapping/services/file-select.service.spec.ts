import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { FileSelectService, File } from './file-select.service';

describe('FileSelectService', () => {
    let service: FileSelectService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FileSelectService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(FileSelectService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('loadFilesForMaster', () => {
        it('should update state with files when API returns success', () => {
            const masterId = 123;
            const mockResponse = {
                success: true,
                files: [
                    { fileId: 1, fileName: 'monmaster.xlsx', fileType: 'xlsx', fileOrigin: 'MonMaster', masterId },
                    { fileId: 2, fileName: 'pv1.xlsx', fileType: 'xlsx', fileOrigin: 'PV', masterId },
                    { fileId: 3, fileName: 'pv2.xlsx', fileType: 'xlsx', fileOrigin: 'PV', masterId }
                ]
            };

            let stateResult: any;
            service.state$.subscribe(state => {
                stateResult = state;
            });

            service.loadFilesForMaster(masterId).subscribe();

            const req = httpTestingController.expectOne(`http://localhost:3000/api/files/master/${masterId}`);
            expect(req.request.method).toEqual('GET');
            req.flush(mockResponse);

            expect(stateResult.loading).toBeFalse();
            expect(stateResult.monmasterFileId).toBe(1);
            expect(stateResult.monmasterFileName).toBe('monmaster.xlsx');
            expect(stateResult.pvFiles.length).toBe(2);
            expect(stateResult.pvFiles[0].fileId).toBe(2);
            expect(stateResult.pvFiles[1].fileId).toBe(3);
            expect(stateResult.selectedPvFile).toBeNull();
        });

        it('should handle error when API returns failure', () => {
            const masterId = 123;
            const errorMessage = 'Server error';

            let stateResult: any;
            service.state$.subscribe(state => {
                stateResult = state;
            });

            service.loadFilesForMaster(masterId).subscribe({
                error: (error) => {
                    expect(error).toBeTruthy();
                }
            });

            const req = httpTestingController.expectOne(`http://localhost:3000/api/files/master/${masterId}`);
            req.flush({ success: false }, { status: 500, statusText: errorMessage });

            expect(stateResult.loading).toBeFalse();
            expect(stateResult.error).toBeTruthy();
        });
    });

    describe('loadPvFiles', () => {
        it('should load PV files and then MonMaster files', () => {
            const mockPvResponse = {
                success: true,
                files: [
                    { fileId: 1, fileName: 'pv1.xlsx', fileType: 'xlsx', fileOrigin: 'PV' },
                    { fileId: 2, fileName: 'pv2.xlsx', fileType: 'xlsx', fileOrigin: 'PV' }
                ]
            };

            const mockMonMasterResponse = {
                success: true,
                files: [
                    { fileId: 3, fileName: 'monmaster.xlsx', fileType: 'xlsx', fileOrigin: 'MonMaster' }
                ]
            };

            let stateResult: any;
            service.state$.subscribe(state => {
                stateResult = state;
            });

            service.loadPvFiles().subscribe();

            // Handle PV files request
            const pvReq = httpTestingController.expectOne('http://localhost:3000/api/files/origin/PV');
            expect(pvReq.request.method).toEqual('GET');
            pvReq.flush(mockPvResponse);

            // Handle MonMaster files request
            const monmasterReq = httpTestingController.expectOne('http://localhost:3000/api/files/origin/MonMaster');
            expect(monmasterReq.request.method).toEqual('GET');
            monmasterReq.flush(mockMonMasterResponse);

            expect(stateResult.loading).toBeFalse();
            expect(stateResult.pvFiles.length).toBe(2);
            expect(stateResult.monmasterFileId).toBe(3);
            expect(stateResult.monmasterFileName).toBe('monmaster.xlsx');
        });

        it('should handle error when loading PV files', () => {
            let stateResult: any;
            service.state$.subscribe(state => {
                stateResult = state;
            });

            service.loadPvFiles().subscribe({
                error: (error) => {
                    expect(error).toBeTruthy();
                }
            });

            const req = httpTestingController.expectOne('http://localhost:3000/api/files/origin/PV');
            // Use a more modern approach instead of the deprecated ErrorEvent
            req.error(new ProgressEvent('error'));

            expect(stateResult.loading).toBeFalse();
            expect(stateResult.error).toBeTruthy();
        });
    });

    describe('getFilesByOrigin', () => {
        it('should return files for the specified origin', () => {
            const origin = 'PV';
            const mockResponse = {
                success: true,
                files: [
                    { fileId: 1, fileName: 'pv1.xlsx', fileType: 'xlsx', fileOrigin: 'PV' },
                    { fileId: 2, fileName: 'pv2.xlsx', fileType: 'xlsx', fileOrigin: 'PV' }
                ]
            };

            let result: File[] | undefined;
            service.getFilesByOrigin(origin).subscribe(files => {
                result = files;
            });

            const req = httpTestingController.expectOne(`http://localhost:3000/api/files/origin/${origin}`);
            expect(req.request.method).toEqual('GET');
            req.flush(mockResponse);

            expect(result?.length).toBe(2);
            expect(result?.[0].fileId).toBe(1);
            expect(result?.[1].fileId).toBe(2);
        });

        it('should return empty array when API response has no files', () => {
            const origin = 'PV';
            const mockResponse = {
                success: true,
                files: []
            };

            let result: File[] | undefined;
            service.getFilesByOrigin(origin).subscribe(files => {
                result = files;
            });

            const req = httpTestingController.expectOne(`http://localhost:3000/api/files/origin/${origin}`);
            req.flush(mockResponse);

            expect(result?.length).toBe(0);
        });
    });

    describe('selectPvFile', () => {
        it('should update selectedPvFile in state', () => {
            const fileId = 123;

            let stateResult: any;
            service.state$.subscribe(state => {
                stateResult = state;
            });

            service.selectPvFile(fileId);

            expect(stateResult.selectedPvFile).toBe(fileId);
        });
    });

    describe('reset', () => {
        it('should reset service state', () => {
            // First set some state
            service.selectPvFile(123);

            let stateBeforeReset: any;
            service.state$.subscribe(state => {
                stateBeforeReset = state;
            });

            expect(stateBeforeReset.selectedPvFile).toBe(123);

            // Now reset
            service.reset();

            let stateAfterReset: any;
            service.state$.subscribe(state => {
                stateAfterReset = state;
            });

            expect(stateAfterReset.pvFiles).toEqual([]);
            expect(stateAfterReset.monmasterFileId).toBeNull();
            expect(stateAfterReset.monmasterFileName).toBeNull();
            expect(stateAfterReset.selectedPvFile).toBeNull();
            expect(stateAfterReset.error).toBeNull();
        });
    });

    describe('getCurrentFileState', () => {
        it('should return current state snapshot', () => {
            // Set some state
            service.selectPvFile(123);

            const currentState = service.getCurrentFileState();

            expect(currentState.selectedPvFile).toBe(123);
        });
    });
});
