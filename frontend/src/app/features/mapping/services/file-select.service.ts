import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface File {
    fileId: number;
    fileName: string;
    fileType: string;
    fileOrigin: string;
    masterId?: number;
}

export interface FileState {
    pvFiles: File[];
    monmasterFileId: number | null;
    monmasterFileName: string | null;
    selectedPvFile: number | null;
    loading: boolean;
    error: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class FileSelectService {
    private apiBaseUrl = 'http://localhost:3000/api';


    private state = new BehaviorSubject<FileState>({
        pvFiles: [],
        monmasterFileId: null,
        monmasterFileName: null,
        selectedPvFile: null,
        loading: false,
        error: null
    });


    readonly state$ = this.state.asObservable();

    constructor(private http: HttpClient) { }


    private updateState(newState: Partial<FileState>): void {
        this.state.next({ ...this.state.getValue(), ...newState });
    }


    loadFilesForMaster(masterId: number): Observable<void> {
        this.updateState({ loading: true, error: null });

        return this.http.get<any>(`${this.apiBaseUrl}/files/master/${masterId}`).pipe(
            map(response => {
                if (response.success) {

                    const monmasterFiles = response.files.filter(
                        (f: File) => f.fileOrigin === 'MonMaster'
                    );


                    let monmasterFileId = null;
                    let monmasterFileName = null;

                    if (monmasterFiles.length > 0) {
                        monmasterFileId = monmasterFiles[0].fileId;
                        monmasterFileName = monmasterFiles[0].fileName;
                    }


                    const pvFiles = response.files.filter(
                        (f: File) => f.fileOrigin === 'PV'
                    );


                    this.updateState({
                        pvFiles,
                        monmasterFileId,
                        monmasterFileName,
                        loading: false,
                        selectedPvFile: null
                    });
                } else {
                    throw new Error('Failed to load files from server');
                }
            }),
            catchError(error => {
                console.error('Error loading files for master program:', error);
                this.updateState({
                    loading: false,
                    error: error.message || 'Failed to load files for this master program'
                });
                return throwError(() => error);
            }),
            map(() => undefined)
        );
    }


    loadPvFiles(): Observable<void> {
        this.updateState({ loading: true, error: null });

        return this.getFilesByOrigin('PV').pipe(
            tap(pvFiles => {
                this.updateState({ pvFiles, loading: false });
            }),
            catchError(error => {
                this.updateState({
                    loading: false,
                    error: error.message || 'Failed to load PV files'
                });
                return throwError(() => error);
            }),
            tap(() => {

                this.getFilesByOrigin('MonMaster').subscribe({
                    next: (files) => {
                        if (files.length > 0) {
                            this.updateState({
                                monmasterFileId: files[0].fileId,
                                monmasterFileName: files[0].fileName
                            });
                        } else {
                            this.updateState({
                                monmasterFileId: null,
                                monmasterFileName: null
                            });
                        }
                    },
                    error: (error) => {
                        console.error('Error loading MonMaster files:', error);
                        this.updateState({
                            error: 'Failed to load MonMaster files'
                        });
                    }
                });
            }),
            map(() => undefined)
        );
    }


    getFilesByOrigin(origin: string): Observable<File[]> {
        return this.http.get<any>(`${this.apiBaseUrl}/files/origin/${origin}`).pipe(
            map(response => {
                if (response.success && response.files) {
                    return response.files;
                }
                return [];
            }),
            catchError(error => {
                console.error(`Error fetching ${origin} files:`, error);
                return throwError(() => error);
            })
        );
    }


    selectPvFile(fileId: number): void {
        this.updateState({ selectedPvFile: fileId });
    }


    reset(): void {
        this.updateState({
            pvFiles: [],
            monmasterFileId: null,
            monmasterFileName: null,
            selectedPvFile: null,
            error: null
        });
    }


    getCurrentFileState(): FileState {
        return this.state.getValue();
    }
}
