import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MappingEntry, MappingConfiguration, MappingWithDescription } from './mapping.types';

@Injectable({
    providedIn: 'root'
})
export class MappingService {
    private apiUrl = 'http://localhost:3000/api/mapping';

    constructor(private http: HttpClient) { }

    /**
     * Utility to enrich mappings with descriptions from fields
     */
    enrichMappingsWithDescriptions(
        mappings: MappingWithDescription[],
        masterFields: { index: number, name: string, description: string }[],
        pvFields: { index: number, name: string, description: string }[]
    ): MappingWithDescription[] {

        const masterFieldsMap = new Map(
            masterFields.map(field => [field.index, field])
        );
        const pvFieldsMap = new Map(
            pvFields.map(field => [field.index, field])
        );


        return mappings.map(mapping => ({
            ...mapping,
            master: {
                ...mapping.master,
                description: masterFieldsMap.get(mapping.master.index)?.description || mapping.master.name
            },
            pv: {
                ...mapping.pv,
                description: pvFieldsMap.get(mapping.pv.index)?.description || mapping.pv.name
            }
        }));
    }

    /**
     * Load mapping configuration and entries - API call only
     * Returns null when configuration doesn't exist (404)
     */
    loadMappingConfiguration(monmasterFileId: number, pvFileId: number): Observable<MappingConfiguration | null> {
        return this.http.get<MappingConfiguration>(
            `${this.apiUrl}/configurations?monmasterFileId=${monmasterFileId}&pvFileId=${pvFileId}`
        ).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 404) {

                    console.log('No existing mapping configuration found, will create new one when needed');
                    return of(null);
                }

                throw error;
            })
        );
    }


    addMappingEntry(entry: MappingEntry): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/entries`, entry);
    }


    updateMappingEntry(entryId: number, updates: Partial<MappingEntry>): Observable<MappingEntry> {
        return this.http.put<MappingEntry>(`${this.apiUrl}/entries/${entryId}`, updates);
    }


    deleteMappingEntry(entryId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/entries/${entryId}`);
    }


    getMappingConfigurationById(configId: number): Observable<MappingConfiguration> {
        return this.http.get<MappingConfiguration>(`${this.apiUrl}/configurations/${configId}`);
    }


    deleteMappingConfiguration(configId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/configurations/${configId}`);
    }

    /**
     * Create a new mapping configuration
     */
    createMappingConfiguration(monmasterFileId: number, pvFileId: number): Observable<MappingConfiguration> {
        return this.http.post<MappingConfiguration>(`${this.apiUrl}/configurations`, {
            monmasterFileId,
            pvFileId
        });
    }
}