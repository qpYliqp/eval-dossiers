import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MappingFacadeService } from './mapping-facade.service';
import { MappingService } from './file-mapping.service';
import { FieldProviderService, MappingField } from './field-provider.service';
import { MappingConfiguration, MappingEntry, MappingWithDescription } from './mapping.types';

describe('MappingFacadeService', () => {
    let service: MappingFacadeService;
    let mappingServiceSpy: jasmine.SpyObj<MappingService>;
    let fieldProviderServiceSpy: jasmine.SpyObj<FieldProviderService>;

    const mockMasterFields: MappingField[] = [
        { index: 0, name: 'id', description: 'ID field' },
        { index: 1, name: 'name', description: 'Name field' },
        { index: 2, name: 'date', description: 'Date field' }
    ];

    const mockPvFields: MappingField[] = [
        { index: 0, name: 'studentId', description: 'Student ID' },
        { index: 1, name: 'fullName', description: 'Full Name' },
        { index: 2, name: 'examDate', description: 'Exam Date' }
    ];

    const mockMappingConfig: MappingConfiguration = {
        configurationId: 123,
        monmasterFileId: 1,
        pvFileId: 2,
        entries: [
            {
                entryId: 1,
                configurationId: 123,
                masterColumnIndex: 0,
                masterColumnName: 'id',
                pvColumnIndex: 0,
                pvColumnName: 'studentId',
                monmasterFileId: 1,
                pvFileId: 2
            },
            {
                entryId: 2,
                configurationId: 123,
                masterColumnIndex: 1,
                masterColumnName: 'name',
                pvColumnIndex: 1,
                pvColumnName: 'fullName',
                monmasterFileId: 1,
                pvFileId: 2
            }
        ]
    };

    beforeEach(() => {
        const mappingSpy = jasmine.createSpyObj('MappingService', [
            'loadMappingConfiguration',
            'createMappingConfiguration',
            'addMappingEntry',
            'deleteMappingEntry',
            'enrichMappingsWithDescriptions'
        ]);

        const fieldSpy = jasmine.createSpyObj('FieldProviderService', [
            'loadFields'
        ]);

        TestBed.configureTestingModule({
            providers: [
                MappingFacadeService,
                { provide: MappingService, useValue: mappingSpy },
                { provide: FieldProviderService, useValue: fieldSpy }
            ]
        });

        service = TestBed.inject(MappingFacadeService);
        mappingServiceSpy = TestBed.inject(MappingService) as jasmine.SpyObj<MappingService>;
        fieldProviderServiceSpy = TestBed.inject(FieldProviderService) as jasmine.SpyObj<FieldProviderService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('loadMappingData', () => {
        it('should load fields and existing mappings when configuration exists', (done) => {

            fieldProviderServiceSpy.loadFields.and.returnValue(of([mockMasterFields, mockPvFields]));
            mappingServiceSpy.loadMappingConfiguration.and.returnValue(of(mockMappingConfig));

            const expectedMappings: MappingWithDescription[] = [
                {
                    master: { index: 0, name: 'id', description: 'ID field' },
                    pv: { index: 0, name: 'studentId', description: 'Student ID' },
                    entryId: 1
                },
                {
                    master: { index: 1, name: 'name', description: 'Name field' },
                    pv: { index: 1, name: 'fullName', description: 'Full Name' },
                    entryId: 2
                }
            ];

            mappingServiceSpy.enrichMappingsWithDescriptions.and.returnValue(expectedMappings);


            service.loadMappingData(1, 2).subscribe(state => {

                expect(state.masterFields).toEqual(mockMasterFields);
                expect(state.pvFields).toEqual(mockPvFields);
                expect(state.mappings).toEqual(expectedMappings);
                expect(state.configuration).toEqual(mockMappingConfig);
                expect(state.configLoaded).toBeTrue();
                expect(state.loading).toBeFalse();
                expect(state.error).toBeNull();


                expect(fieldProviderServiceSpy.loadFields).toHaveBeenCalledWith(1, 2);
                expect(mappingServiceSpy.loadMappingConfiguration).toHaveBeenCalledWith(1, 2);
                expect(mappingServiceSpy.enrichMappingsWithDescriptions).toHaveBeenCalled();
                done();
            });
        });

        it('should handle scenario with no existing configuration', (done) => {

            fieldProviderServiceSpy.loadFields.and.returnValue(of([mockMasterFields, mockPvFields]));
            mappingServiceSpy.loadMappingConfiguration.and.returnValue(of(null));


            service.loadMappingData(1, 2).subscribe(state => {

                expect(state.masterFields).toEqual(mockMasterFields);
                expect(state.pvFields).toEqual(mockPvFields);
                expect(state.mappings).toEqual([]);
                expect(state.configuration).toBeNull();
                expect(state.configLoaded).toBeFalse();
                expect(state.loading).toBeFalse();
                expect(state.error).toBeNull();

                done();
            });
        });

        it('should handle errors during loading', (done) => {

            const testError = new Error('Test error');
            fieldProviderServiceSpy.loadFields.and.returnValue(throwError(() => testError));


            service.loadMappingData(1, 2).subscribe(state => {

                expect(state.error).toContain('Error loading mapping data');
                expect(state.loading).toBeFalse();
                done();
            });
        });
    });

    describe('addMappingEntry', () => {
        it('should create a new configuration if none exists and then add entry', (done) => {

            service['stateSubject'].next({
                ...service['stateSubject'].getValue(),
                configLoaded: false,
                configuration: null
            });

            const newConfig: MappingConfiguration = {
                configurationId: 456,
                monmasterFileId: 1,
                pvFileId: 2
            };

            const newEntry: MappingEntry = {
                configurationId: 0,
                monmasterFileId: 1,
                pvFileId: 2,
                masterColumnIndex: 2,
                masterColumnName: 'date',
                pvColumnIndex: 2,
                pvColumnName: 'examDate'
            };

            const responseWithId = {
                ...newEntry,
                entryId: 3,
                configurationId: 456
            };


            mappingServiceSpy.createMappingConfiguration.and.returnValue(of(newConfig));
            mappingServiceSpy.addMappingEntry.and.returnValue(of(responseWithId));
            mappingServiceSpy.enrichMappingsWithDescriptions.and.returnValue([{
                master: { index: 2, name: 'date', description: 'Date field' },
                pv: { index: 2, name: 'examDate', description: 'Exam Date' },
                entryId: 3
            }]);


            service['stateSubject'].next({
                ...service['stateSubject'].getValue(),
                masterFields: mockMasterFields,
                pvFields: mockPvFields
            });


            service.addMappingEntry(newEntry).subscribe(response => {

                expect(response).toEqual(responseWithId);


                const updatedState = service.getCurrentState();


                expect(updatedState.configuration).toEqual(newConfig);
                expect(updatedState.configLoaded).toBeTrue();
                expect(updatedState.mappings.length).toBe(1);
                expect(updatedState.mappings[0].master.name).toBe('date');
                expect(updatedState.mappings[0].pv.name).toBe('examDate');


                expect(mappingServiceSpy.createMappingConfiguration).toHaveBeenCalledWith(1, 2);
                expect(mappingServiceSpy.addMappingEntry).toHaveBeenCalled();

                done();
            });
        });

        it('should add entry to existing configuration', (done) => {

            service['stateSubject'].next({
                ...service['stateSubject'].getValue(),
                configLoaded: true,
                configuration: mockMappingConfig,
                mappings: [],
                masterFields: mockMasterFields,
                pvFields: mockPvFields
            });

            const newEntry: MappingEntry = {
                configurationId: mockMappingConfig.configurationId || 0,
                monmasterFileId: 1,
                pvFileId: 2,
                masterColumnIndex: 2,
                masterColumnName: 'date',
                pvColumnIndex: 2,
                pvColumnName: 'examDate'
            };

            const responseWithId = {
                ...newEntry,
                entryId: 3
            };

            mappingServiceSpy.addMappingEntry.and.returnValue(of(responseWithId));
            mappingServiceSpy.enrichMappingsWithDescriptions.and.returnValue([{
                master: { index: 2, name: 'date', description: 'Date field' },
                pv: { index: 2, name: 'examDate', description: 'Exam Date' },
                entryId: 3
            }]);


            service.addMappingEntry(newEntry).subscribe(response => {

                expect(response).toEqual(responseWithId);


                const updatedState = service.getCurrentState();


                expect(updatedState.mappings.length).toBe(1);
                expect(updatedState.mappings[0].entryId).toBe(3);


                expect(mappingServiceSpy.createMappingConfiguration).not.toHaveBeenCalled();
                expect(mappingServiceSpy.addMappingEntry).toHaveBeenCalledWith(newEntry);

                done();
            });
        });

        it('should handle error when adding entry', (done) => {
            const testError = new Error('Failed to add mapping');
            mappingServiceSpy.addMappingEntry.and.returnValue(throwError(() => testError));

            service['stateSubject'].next({
                ...service['stateSubject'].getValue(),
                configLoaded: true,
                configuration: mockMappingConfig
            });

            const newEntry: MappingEntry = {
                configurationId: mockMappingConfig.configurationId || 0,
                monmasterFileId: 1,
                pvFileId: 2,
                masterColumnIndex: 2,
                masterColumnName: 'date',
                pvColumnIndex: 2,
                pvColumnName: 'examDate'
            };


            service.addMappingEntry(newEntry).subscribe({
                error: () => {

                    const updatedState = service.getCurrentState();
                    expect(updatedState.error).toContain('Error adding mapping');
                    expect(updatedState.loading).toBeFalse();
                    done();
                }
            });
        });
    });

    describe('deleteMappingEntry', () => {
        it('should delete entry and update state', (done) => {

            const initialMappings: MappingWithDescription[] = [
                {
                    master: { index: 0, name: 'id', description: 'ID field' },
                    pv: { index: 0, name: 'studentId', description: 'Student ID' },
                    entryId: 1
                },
                {
                    master: { index: 1, name: 'name', description: 'Name field' },
                    pv: { index: 1, name: 'fullName', description: 'Full Name' },
                    entryId: 2
                }
            ];

            service['stateSubject'].next({
                ...service['stateSubject'].getValue(),
                mappings: initialMappings
            });

            mappingServiceSpy.deleteMappingEntry.and.returnValue(of(void 0));


            service.deleteMappingEntry(1).subscribe(() => {
                const updatedState = service.getCurrentState();


                expect(updatedState.mappings.length).toBe(1);
                expect(updatedState.mappings[0].entryId).toBe(2);


                expect(mappingServiceSpy.deleteMappingEntry).toHaveBeenCalledWith(1);

                done();
            });
        });

        it('should handle error when deleting entry', (done) => {
            const testError = new Error('Failed to delete mapping');
            mappingServiceSpy.deleteMappingEntry.and.returnValue(throwError(() => testError));

            service.deleteMappingEntry(1).subscribe({
                error: () => {

                    const updatedState = service.getCurrentState();
                    expect(updatedState.error).toContain('Error deleting mapping');
                    expect(updatedState.loading).toBeFalse();
                    done();
                }
            });
        });
    });

    describe('getCurrentState', () => {
        it('should return current state snapshot', () => {
            const mockState = {
                mappings: [],
                masterFields: mockMasterFields,
                pvFields: mockPvFields,
                configuration: null,
                loading: false,
                error: null,
                configLoaded: false
            };

            service['stateSubject'].next(mockState);

            const result = service.getCurrentState();

            expect(result).toEqual(mockState);
        });
    });
});
