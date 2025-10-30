import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, throwError, timer } from 'rxjs';
import { catchError, delay, map, retry, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import { MonMasterNormalizationService, IndexedMonMasterField } from '../../normalization/services/monmaster-normalization.service';
import { PvNormalizationService, IndexedPvField } from '../../normalization/services/pv-normalization.service';

export interface MappingField {
    index: number;
    name: string;
    description: string;
}

@Injectable({
    providedIn: 'root'
})
export class FieldProviderService {

    private processingDelay = environment.test ? 100 : 1000;
    private retryDelay = environment.test ? 100 : 1500;
    private retryCount = environment.test ? 1 : 3;

    constructor(
        private monmasterService: MonMasterNormalizationService,
        private pvService: PvNormalizationService
    ) { }

    /**
     * Load fields from both MonMaster and PV files
     */
    loadFields(monmasterFileId: number, pvFileId: number): Observable<[MappingField[], MappingField[]]> {
        return forkJoin([
            this.loadMonMasterFields(monmasterFileId),
            this.loadPvFields(pvFileId)
        ]).pipe(
            catchError(error => {
                console.error('Error loading fields:', error);
                return of([[], []] as [MappingField[], MappingField[]]);
            })
        );
    }

    /**
     * Generic method to load fields from any service
     */
    private loadFieldsGeneric<T>(
        fileId: number,
        service: {
            getAvailableFields: (fileId: number) => Observable<T[]>,
            processFile: (fileId: number) => Observable<{ success: boolean, message?: string }>
        },
        transform: (fields: T[]) => MappingField[],
        serviceName: string
    ): Observable<MappingField[]> {

        return service.getAvailableFields(fileId).pipe(
            map(fields => transform(fields)),

            catchError(() => {
                console.log(`${serviceName} file not yet normalized, attempting to process...`);


                return service.processFile(fileId).pipe(
                    switchMap(processResponse => {
                        if (!processResponse.success) {
                            console.error(`Failed to process ${serviceName} file: ${processResponse.message}`);
                            return of([] as MappingField[]);
                        }
                        console.log(`${serviceName} file processed successfully, loading fields...`);


                        return of(true).pipe(
                            delay(this.processingDelay),

                            switchMap(() => service.getAvailableFields(fileId).pipe(
                                retry({ count: this.retryCount, delay: this.retryDelay }),
                                map(fields => transform(fields)),
                                catchError(error => {
                                    console.error(`Failed to load ${serviceName} fields after processing: ${error.message || 'Unknown error'}`);
                                    return of([] as MappingField[]);
                                })
                            ))
                        );
                    }),
                    catchError(error => {
                        console.error(`Error during ${serviceName} processing: ${error.message || 'Unknown error'}`);
                        return of([] as MappingField[]);
                    })
                );
            })
        );
    }

    private loadMonMasterFields(fileId: number): Observable<MappingField[]> {
        return this.loadFieldsGeneric<IndexedMonMasterField>(
            fileId,
            this.monmasterService,
            fields => this.transformMonMasterFields(fields),
            'MonMaster'
        );
    }

    private loadPvFields(fileId: number): Observable<MappingField[]> {
        return this.loadFieldsGeneric<IndexedPvField>(
            fileId,
            this.pvService,
            fields => this.transformPvFields(fields),
            'PV'
        );
    }

    private transformMonMasterFields(fields: IndexedMonMasterField[]): MappingField[] {
        return fields.map(field => ({
            index: field.index,
            name: field.name,
            description: field.description
        }));
    }

    private transformPvFields(fields: IndexedPvField[]): MappingField[] {
        return fields.map(field => ({
            index: field.index,
            name: field.name,
            description: field.description
        }));
    }
}
