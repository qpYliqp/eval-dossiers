import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { FieldProviderService } from './field-provider.service';
import { MonMasterNormalizationService, IndexedMonMasterField } from '../../normalization/services/monmaster-normalization.service';
import { PvNormalizationService, IndexedPvField } from '../../normalization/services/pv-normalization.service';

describe('FieldProviderService', () => {
    let service: FieldProviderService;
    let monMasterServiceSpy: jasmine.SpyObj<MonMasterNormalizationService>;
    let pvServiceSpy: jasmine.SpyObj<PvNormalizationService>;

    const mockMonMasterFields: IndexedMonMasterField[] = [
        { index: 0, name: 'nom', type: 'string', description: 'Nom de l\'étudiant', category: 'candidate' },
        { index: 1, name: 'prenom', type: 'string', description: 'Prénom de l\'étudiant', category: 'candidate' },
        { index: 2, name: 'moyenne', type: 'number', description: 'Moyenne générale', category: 'score' }
    ];

    const mockPvFields: IndexedPvField[] = [
        { index: 0, name: 'nom_complet', type: 'string', description: 'Nom complet' },
        { index: 1, name: 'note', type: 'number', description: 'Note finale' }
    ];

    const mockMonMasterMappingFields = [
        { index: 0, name: 'nom', description: 'Nom de l\'étudiant' },
        { index: 1, name: 'prenom', description: 'Prénom de l\'étudiant' },
        { index: 2, name: 'moyenne', description: 'Moyenne générale' }
    ];

    const mockPvMappingFields = [
        { index: 0, name: 'nom_complet', description: 'Nom complet' },
        { index: 1, name: 'note', description: 'Note finale' }
    ];

    beforeEach(() => {

        monMasterServiceSpy = jasmine.createSpyObj('MonMasterNormalizationService', [
            'getAvailableFields',
            'processFile',
            'isFileProcessed'
        ]);

        pvServiceSpy = jasmine.createSpyObj('PvNormalizationService', [
            'getAvailableFields',
            'processFile',
            'isFileProcessed'
        ]);


        monMasterServiceSpy.getAvailableFields.and.returnValue(of([]));
        monMasterServiceSpy.processFile.and.returnValue(of({ success: true }));
        monMasterServiceSpy.isFileProcessed.and.returnValue(of(false));

        pvServiceSpy.getAvailableFields.and.returnValue(of([]));
        pvServiceSpy.processFile.and.returnValue(of({ success: true }));
        pvServiceSpy.isFileProcessed.and.returnValue(of(false));

        TestBed.configureTestingModule({
            providers: [
                FieldProviderService,
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: MonMasterNormalizationService, useValue: monMasterServiceSpy },
                { provide: PvNormalizationService, useValue: pvServiceSpy }
            ]
        });

        service = TestBed.inject(FieldProviderService);
        jasmine.clock().install();


        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('loadFields', () => {
        it('should load fields from both MonMaster and PV files when both are available', (done) => {
            monMasterServiceSpy.getAvailableFields.and.returnValue(of(mockMonMasterFields));
            pvServiceSpy.getAvailableFields.and.returnValue(of(mockPvFields));

            service.loadFields(1, 2).subscribe(([monMasterFields, pvFields]) => {
                expect(monMasterFields).toEqual(mockMonMasterMappingFields);
                expect(pvFields).toEqual(mockPvMappingFields);
                expect(monMasterServiceSpy.getAvailableFields).toHaveBeenCalledWith(1);
                expect(pvServiceSpy.getAvailableFields).toHaveBeenCalledWith(2);
                done();
            });
        });

        it('should handle global error and return empty arrays for both services', (done) => {
            monMasterServiceSpy.getAvailableFields.and.returnValue(throwError(() => new Error('Failed to load')));
            pvServiceSpy.getAvailableFields.and.returnValue(throwError(() => new Error('Failed to load')));


            monMasterServiceSpy.processFile.and.returnValue(throwError(() => new Error('Process error')));
            pvServiceSpy.processFile.and.returnValue(throwError(() => new Error('Process error')));

            service.loadFields(1, 2).subscribe(([monMasterFields, pvFields]) => {
                expect(monMasterFields).toEqual([]);
                expect(pvFields).toEqual([]);
                done();
            });

            jasmine.clock().tick(3000);
        });
    });

    describe('loadFieldsGeneric processing', () => {
        it('should process MonMaster file if fields are not initially available', (done) => {

            monMasterServiceSpy.getAvailableFields.and.returnValues(
                throwError(() => new Error('Not processed')),
                of(mockMonMasterFields)
            );


            pvServiceSpy.getAvailableFields.and.returnValue(of(mockPvFields));

            monMasterServiceSpy.processFile.and.returnValue(of({ success: true }));

            service.loadFields(1, 2).subscribe(([monMasterFields, pvFields]) => {
                expect(monMasterServiceSpy.processFile).toHaveBeenCalledWith(1);
                expect(monMasterServiceSpy.getAvailableFields).toHaveBeenCalledTimes(2);
                expect(monMasterFields).toEqual(mockMonMasterMappingFields);
                expect(pvFields).toEqual(mockPvMappingFields);
                done();
            });

            jasmine.clock().tick(3000);
        });

        it('should process PV file if fields are not initially available', (done) => {

            monMasterServiceSpy.getAvailableFields.and.returnValue(of(mockMonMasterFields));


            pvServiceSpy.getAvailableFields.and.returnValues(
                throwError(() => new Error('Not processed')),
                of(mockPvFields)
            );

            pvServiceSpy.processFile.and.returnValue(of({ success: true }));

            service.loadFields(1, 2).subscribe(([monMasterFields, pvFields]) => {
                expect(pvServiceSpy.processFile).toHaveBeenCalledWith(2);
                expect(pvServiceSpy.getAvailableFields).toHaveBeenCalledTimes(2);
                expect(monMasterFields).toEqual(mockMonMasterMappingFields);
                expect(pvFields).toEqual(mockPvMappingFields);
                done();
            });

            jasmine.clock().tick(3000);
        });

        it('should handle failed MonMaster processing and return empty array for MonMaster fields', (done) => {

            monMasterServiceSpy.getAvailableFields.and.returnValue(
                throwError(() => new Error('Not available'))
            );


            monMasterServiceSpy.processFile.and.returnValue(
                of({ success: false, message: 'Processing failed' })
            );


            pvServiceSpy.getAvailableFields.and.returnValue(of(mockPvFields));

            service.loadFields(1, 2).subscribe(([monMasterFields, pvFields]) => {
                expect(monMasterServiceSpy.processFile).toHaveBeenCalledWith(1);
                expect(monMasterFields).toEqual([]);
                expect(pvFields).toEqual(mockPvMappingFields);
                done();
            });

            jasmine.clock().tick(3000);
        });

        it('should handle failed PV processing and return empty array for PV fields', (done) => {

            monMasterServiceSpy.getAvailableFields.and.returnValue(of(mockMonMasterFields));


            pvServiceSpy.getAvailableFields.and.returnValue(
                throwError(() => new Error('Not available'))
            );


            pvServiceSpy.processFile.and.returnValue(
                of({ success: false, message: 'Processing failed' })
            );

            service.loadFields(1, 2).subscribe(([monMasterFields, pvFields]) => {
                expect(pvServiceSpy.processFile).toHaveBeenCalledWith(2);
                expect(monMasterFields).toEqual(mockMonMasterMappingFields);
                expect(pvFields).toEqual([]);
                done();
            });

            jasmine.clock().tick(3000);
        });

        it('should handle error during MonMaster processing attempt', (done) => {

            monMasterServiceSpy.getAvailableFields.and.returnValue(
                throwError(() => new Error('Not available'))
            );


            monMasterServiceSpy.processFile.and.returnValue(
                throwError(() => new Error('Processing error'))
            );


            pvServiceSpy.getAvailableFields.and.returnValue(of(mockPvFields));

            service.loadFields(1, 2).subscribe(([monMasterFields, pvFields]) => {
                expect(monMasterServiceSpy.processFile).toHaveBeenCalledWith(1);
                expect(monMasterFields).toEqual([]);
                expect(pvFields).toEqual(mockPvMappingFields);
                done();
            });

            jasmine.clock().tick(3000);
        });

        it('should handle error getting fields after successful MonMaster processing', (done) => {

            monMasterServiceSpy.getAvailableFields.and.callFake(() => {
                return throwError(() => new Error('Fields not available'));
            });


            monMasterServiceSpy.processFile.and.returnValue(of({ success: true }));


            pvServiceSpy.getAvailableFields.and.returnValue(of(mockPvFields));


            spyOn(service as any, 'loadFieldsGeneric').and.callThrough();


            (service as any).loadMonMasterFields(1).subscribe((fields: any) => {
                expect(fields).toEqual([]);
                expect(monMasterServiceSpy.processFile).toHaveBeenCalledWith(1);
                expect(monMasterServiceSpy.getAvailableFields).toHaveBeenCalled();
                done();
            });


            jasmine.clock().tick(10000);
        });
    });

    describe('field transformations', () => {
        it('should transform MonMaster fields correctly', (done) => {
            monMasterServiceSpy.getAvailableFields.and.returnValue(of(mockMonMasterFields));
            pvServiceSpy.getAvailableFields.and.returnValue(of([]));

            service.loadFields(1, 2).subscribe(([monMasterFields, pvFields]) => {
                expect(monMasterFields).toEqual(mockMonMasterMappingFields);
                expect(monMasterFields[0].description).toBe(mockMonMasterFields[0].description);
                expect(monMasterFields[0].name).toBe(mockMonMasterFields[0].name);
                expect(monMasterFields[0].index).toBe(mockMonMasterFields[0].index);
                expect(pvFields).toEqual([]);
                done();
            });
        });

        it('should transform PV fields correctly', (done) => {
            monMasterServiceSpy.getAvailableFields.and.returnValue(of([]));
            pvServiceSpy.getAvailableFields.and.returnValue(of(mockPvFields));

            service.loadFields(1, 2).subscribe(([monMasterFields, pvFields]) => {
                expect(monMasterFields).toEqual([]);
                expect(pvFields).toEqual(mockPvMappingFields);
                expect(pvFields[0].description).toBe(mockPvFields[0].description);
                expect(pvFields[0].name).toBe(mockPvFields[0].name);
                expect(pvFields[0].index).toBe(mockPvFields[0].index);
                done();
            });
        });

        it('should handle empty arrays correctly', (done) => {
            monMasterServiceSpy.getAvailableFields.and.returnValue(of([]));
            pvServiceSpy.getAvailableFields.and.returnValue(of([]));

            service.loadFields(1, 2).subscribe(([monMasterFields, pvFields]) => {
                expect(monMasterFields).toEqual([]);
                expect(pvFields).toEqual([]);
                done();
            });
        });
    });
});
