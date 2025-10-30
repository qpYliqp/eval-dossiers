import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface IndexedMonMasterField {
    index: number;
    name: string;
    type: 'string' | 'number' | 'date';
    description: string;
    category: 'candidate' | 'academic' | 'score';
}

export interface AvailableMonMasterFields {
    fileId: number;
    fields: IndexedMonMasterField[];
}

@Injectable({
    providedIn: 'root'
})
export class MonMasterNormalizationService {
    private baseUrl = 'http://localhost:3000/api/monmaster-normalization';

    constructor(private http: HttpClient) { }

    /**
     * Process a MonMaster file to extract normalized data
     */
    processFile(fileId: number): Observable<{ success: boolean, message?: string }> {
        return this.http.post<any>(`${this.baseUrl}/process/${fileId}`, {}).pipe(
            map(response => ({
                success: response && response.success === true,
                message: response?.message || 'File processed successfully'
            })),
            catchError((error: HttpErrorResponse) => {
                console.error('MonMaster processing error:', error);
                const errorMsg = error.error?.message ||
                    (error.status === 409 ? 'File already processed' : 'Failed to process file');
                return of({
                    success: error.status === 409, // If conflict, the file is already processed which is OK
                    message: errorMsg
                });
            })
        );
    }

    /**
     * Check if a MonMaster file has been processed
     */
    isFileProcessed(fileId: number): Observable<boolean> {
        return this.http.get<any>(`${this.baseUrl}/data/${fileId}`)
            .pipe(
                map(response => response.success === true),
                catchError((error: HttpErrorResponse) => {
                    console.log(`MonMaster file ${fileId} is not processed:`, error.status);
                    return of(false);
                })
            );
    }

    /**
     * Get available fields from a normalized MonMaster file for mapping
     */
    getAvailableFields(fileId: number): Observable<IndexedMonMasterField[]> {
        return this.http.get<any>(`${this.baseUrl}/fields/${fileId}`)
            .pipe(
                map(response => {
                    if (response.success && response.data) {
                        return response.data.fields;
                    }
                    return [];
                })
            );
    }

    /**
     * Get normalized MonMaster data as indexed records for mapping
     */
    getIndexedRecords(fileId: number): Observable<Record<string, any>[]> {
        return this.http.get<any>(`${this.baseUrl}/indexed-records/${fileId}`)
            .pipe(
                map(response => {
                    if (response.success && response.data) {
                        return response.data;
                    }
                    return [];
                })
            );
    }
}
