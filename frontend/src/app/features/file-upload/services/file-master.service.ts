      import { Injectable } from '@angular/core';
      import { HttpClient, HttpRequest, HttpEvent, HttpEventType } from '@angular/common/http';
      import { BehaviorSubject, Observable } from 'rxjs';
      import { FileColumn } from '../models/FileColumn';
      import { tap, map } from 'rxjs/operators';
      import { firstValueFrom } from 'rxjs';
  import { columnMasterEntry } from '../../../shared/models/objectListEntries/column-master-entry/column-master-entry';


      @Injectable({
        providedIn: 'root'
      })

      export class FileMasterService
      {
          private masterColumnsSubject = new BehaviorSubject<FileColumn[]>([]);
          public masterColumns$: Observable<FileColumn[]> = this.masterColumnsSubject.asObservable();

          private selectedColumnsSubject = new BehaviorSubject<FileColumn[]>([]);
          public selectedColumns :  Observable<FileColumn[]> = this.selectedColumnsSubject.asObservable();

          private dataColumnsSubject = new BehaviorSubject<columnMasterEntry[]>([]);
          public dataColumns$: Observable<columnMasterEntry[]> = this.dataColumnsSubject.asObservable();
          
          // //'http://localhost:3000/api/files/master/{masterId}/origin/{MonMaster}'

          private baseUrl = 'http://localhost:3000/api/column-selection/';

          constructor(private http: HttpClient) {}
          
          getColumnsByFileId(fileId: number): Observable<FileColumn[]> {
            console.log("Demande de colonnes pour le fichier ID:", fileId);
            return this.http.get<FileColumn[]>(this.baseUrl+fileId+"/original").pipe(
              tap((response: FileColumn[]) => {
                console.log("Réponse reçue:", response);        
                this.masterColumnsSubject.next(response);
                  
              }),
              map(response => response)
            );
          }

          getSelectedColumnsByFileId(fileId: number): Observable<FileColumn[]> {
            console.log("Demande de colonnes pour le fichier ID:", fileId);
            return this.http.get<any[]>(this.baseUrl+fileId).pipe(
              tap((response) => {
                console.log("Réponse reçue:", response);
              }),
              map(response => {
                const fileColumns: FileColumn[] = response.map(item => ({
                  columnIndex: item.columnIndex,
                  columnName: item.columnName
                }));
                return fileColumns;
              }),
              tap(fileColumns => {
                this.selectedColumnsSubject.next(fileColumns);
              })
            );
          }

          toggleColumnSelection(fileId: number, columnIndex: number, columnName: string): Observable<any> {
            const url = `${this.baseUrl}toggle`;
            const body = {
              fileId: fileId,
              column: {
                index: columnIndex,
                name: columnName
              }
            };
          
            return this.http.post<any>(url, body).pipe(
              tap(response => {
                console.log("Réponse reçue:", response);
              })
            );
          }

          async getDataColumnsByFileId(fileId: number): Promise<columnMasterEntry[]> {
            try {
              // Récupérer les données brutes depuis l'API
              const response = await firstValueFrom(
                this.http.get<any>(this.baseUrl + fileId + "/extract")
              );
              console.log("Réponse reçue:", response);
        
              // Transformer les données en une liste de `columnMasterEntry`
              const dataColumns = response.data.map((row: any) => {
                const labels = row.labels; // Supposons que `row.labels` est un tableau de chaînes
                return new columnMasterEntry(labels); // Passer uniquement `labels` au constructeur
              });
        
              // Mettre à jour le BehaviorSubject
              this.dataColumnsSubject.next(dataColumns);
        
              // Retourner les données transformées
              return dataColumns;
            } catch (error) {
              console.error("Erreur lors de la récupération des colonnes:", error);
              throw error;
            }
          }

      }

      