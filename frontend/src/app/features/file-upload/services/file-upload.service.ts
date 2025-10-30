import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent, HttpEventType } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { File } from '../../../core/models/file.model';

export interface FileUploadDto {
  file: globalThis.File; // Native File type from the browser
  masterId?: number;
  fileOrigin: string;    // e.g., 'PV', 'MonMaster', or 'StudentDocuments'
  university?: string;
  formation?: string;
  yearAcademic?: string;
  session?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private baseUrl = 'http://localhost:3000/api/files';

  // Observable list of uploaded files
  private filesSubject = new BehaviorSubject<File[]>([]);
  public files$: Observable<File[]> = this.filesSubject.asObservable();

  constructor(private http: HttpClient) { }

  getMasterFileId(masterId: number): Observable<File[]> {
    return this.http.get<{ success: boolean; files: File[] }>(`${this.baseUrl}/master/${masterId}/origin/MonMaster`).pipe(
      map(response => response.files)
    );
  }

  /**
   * Uploads a file along with metadata.
   */
  uploadFile(dto: FileUploadDto): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', dto.file);
    formData.append('fileOrigin', dto.fileOrigin);
    if (dto.masterId) {
      formData.append('masterId', dto.masterId.toString());
    }
    if (dto.university) {
      formData.append('university', dto.university);
    }
    if (dto.formation) {
      formData.append('formation', dto.formation);
    }
    if (dto.yearAcademic) {
      formData.append('yearAcademic', dto.yearAcademic);
    }
    if (dto.session) {
      formData.append('session', dto.session.toString());
    }

    const req = new HttpRequest('POST', `${this.baseUrl}/upload`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request(req).pipe(
      tap(event => {
        if (event.type === HttpEventType.Response && event.body && event.body.success && event.body.file) {
          const newFile = event.body.file as File;
          const currentFiles = this.filesSubject.value;
          this.filesSubject.next([...currentFiles, newFile]);
        }
      })
    );
  }

  /**
   * Retrieves files by master program ID.
   */
  getFilesByMaster(masterId: number): Observable<File[]> {
    return this.http.get<{ success: boolean; files: File[] }>(`${this.baseUrl}/master/${masterId}`).pipe(
      tap(response => {
        if (response.success) {
          this.filesSubject.next(response.files);
        }
      }),
      map(response => response.files)
    );
  }

  /**
   * Deletes a file by its ID.
   */
  deleteFile(fileId: number): Observable<{ message: string; file: File }> {
    return this.http.delete<{ message: string; file: File }>(`${this.baseUrl}/${fileId}`).pipe(
      tap(response => {
        const updatedFiles = this.filesSubject.value.filter(f => f.fileId !== fileId);
        this.filesSubject.next(updatedFiles);
      })
    );
  }

  /**
   * Downloads a file by its ID.
   */
  downloadFile(fileId: number): Observable<Blob> {
    const url = `${this.baseUrl}/${fileId}/download`;
    return this.http.get(url, { responseType: 'blob' });
  }


}
