import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap, finalize, switchMap } from 'rxjs/operators';

import { MappingService } from './file-mapping.service';
import { FieldProviderService, MappingField } from './field-provider.service';
import { MappingConfiguration, MappingEntry, MappingWithDescription } from './mapping.types';


export interface MappingFacadeState {
    mappings: MappingWithDescription[];
    masterFields: MappingField[];
    pvFields: MappingField[];
    configuration: MappingConfiguration | null;
    loading: boolean;
    error: string | null;
    configLoaded: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class MappingFacadeService {

    private stateSubject = new BehaviorSubject<MappingFacadeState>({
        mappings: [],
        masterFields: [],
        pvFields: [],
        configuration: null,
        loading: false,
        error: null,
        configLoaded: false
    });


    public state$ = this.stateSubject.asObservable();

    constructor(
        private mappingService: MappingService,
        private fieldProvider: FieldProviderService
    ) { }


    private updateState(partialState: Partial<MappingFacadeState>): void {
        this.stateSubject.next({
            ...this.stateSubject.getValue(),
            ...partialState
        });
    }


    loadMappingData(monmasterFileId: number, pvFileId: number): Observable<MappingFacadeState> {

        this.updateState({ loading: true, error: null });


        return forkJoin({

            mappingConfig: this.mappingService.loadMappingConfiguration(monmasterFileId, pvFileId),

            fields: this.fieldProvider.loadFields(monmasterFileId, pvFileId)
        }).pipe(

            tap(({ mappingConfig, fields }) => {
                const [masterFields, pvFields] = fields;


                let mappings: MappingWithDescription[] = [];
                let configLoaded = false;

                if (mappingConfig && mappingConfig.entries) {

                    mappings = mappingConfig.entries.map(entry => ({
                        master: {
                            index: entry.masterColumnIndex,
                            name: entry.masterColumnName
                        },
                        pv: {
                            index: entry.pvColumnIndex,
                            name: entry.pvColumnName
                        },
                        entryId: entry.entryId
                    }));
                    configLoaded = true;
                } else {

                    console.log('No existing mappings found, starting with empty configuration');
                    configLoaded = false;
                }


                if (masterFields.length > 0 && pvFields.length > 0 && mappings.length > 0) {
                    mappings = this.mappingService.enrichMappingsWithDescriptions(
                        mappings,
                        masterFields,
                        pvFields
                    );
                }


                this.updateState({
                    mappings,
                    masterFields,
                    pvFields,
                    configuration: mappingConfig,
                    configLoaded,
                    loading: false
                });
            }),

            catchError(error => {
                const errorMsg = `Error loading mapping data: ${error.message || 'Unknown error'}`;
                console.error(errorMsg, error);
                this.updateState({
                    error: errorMsg,
                    loading: false
                });
                return of({
                    ...this.stateSubject.getValue(),
                    error: errorMsg
                });
            }),

            finalize(() => {
                this.updateState({ loading: false });
            }),

            map(() => this.stateSubject.getValue())
        );
    }


    addMappingEntry(entry: MappingEntry): Observable<any> {
        this.updateState({ loading: true, error: null });

        const currentState = this.stateSubject.getValue();
        const needsNewConfig = !currentState.configLoaded || !currentState.configuration;


        let observable$: Observable<any>;

        if (needsNewConfig) {
            observable$ = this.mappingService.createMappingConfiguration(
                entry.monmasterFileId,
                entry.pvFileId
            ).pipe(
                tap(config => {
                    this.updateState({
                        configuration: config,
                        configLoaded: true
                    });

                    if (config.configurationId !== undefined) {
                        entry.configurationId = config.configurationId;
                    } else {
                        console.error('Configuration created without an ID');
                        throw new Error('Failed to create mapping configuration: No ID received');
                    }
                }),
                switchMap(() => this.mappingService.addMappingEntry(entry))
            );
        } else {

            if (currentState.configuration && currentState.configuration.configurationId) {
                entry.configurationId = currentState.configuration.configurationId;
            }
            observable$ = this.mappingService.addMappingEntry(entry);
        }

        return observable$.pipe(
            tap(response => {

                const newMapping: MappingWithDescription = {
                    master: {
                        index: entry.masterColumnIndex,
                        name: entry.masterColumnName
                    },
                    pv: {
                        index: entry.pvColumnIndex,
                        name: entry.pvColumnName
                    },
                    entryId: response.entryId
                };


                let mappingToAdd = newMapping;
                if (currentState.masterFields.length > 0 && currentState.pvFields.length > 0) {
                    mappingToAdd = this.mappingService.enrichMappingsWithDescriptions(
                        [newMapping],
                        currentState.masterFields,
                        currentState.pvFields
                    )[0];
                }


                this.updateState({
                    mappings: [...currentState.mappings, mappingToAdd],
                    configLoaded: true,
                    loading: false
                });

                return response;
            }),
            catchError(error => {
                const errorMsg = `Error adding mapping: ${error.message || 'Unknown error'}`;
                console.error(errorMsg, error);
                this.updateState({
                    error: errorMsg,
                    loading: false
                });
                throw error;
            }),
            finalize(() => {
                this.updateState({ loading: false });
            })
        );
    }


    deleteMappingEntry(entryId: number): Observable<void> {
        this.updateState({ loading: true, error: null });

        return this.mappingService.deleteMappingEntry(entryId).pipe(
            tap(() => {

                const currentState = this.stateSubject.getValue();


                const updatedMappings = currentState.mappings.filter(
                    mapping => mapping.entryId !== entryId
                );


                this.updateState({
                    mappings: updatedMappings,
                    loading: false
                });
            }),
            catchError(error => {
                const errorMsg = `Error deleting mapping: ${error.message || 'Unknown error'}`;
                this.updateState({
                    error: errorMsg,
                    loading: false
                });
                throw error;
            }),
            finalize(() => {
                this.updateState({ loading: false });
            })
        );
    }


    getCurrentState(): MappingFacadeState {
        return this.stateSubject.getValue();
    }
}
