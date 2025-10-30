import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { FileUploadService, FileUploadDto } from './file-upload.service';
import { HttpEventType } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, lastValueFrom } from 'rxjs';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:3000/api/files';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FileUploadService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(FileUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should upload a file and update filesSubject', () => {
    // Create a dummy native File object
    const dummyBlob = new Blob(['dummy content'], { type: 'text/plain' });
    const nativeFile = new globalThis.File([dummyBlob], 'test.txt', { type: 'text/plain' });
    const dto: FileUploadDto = {
      file: nativeFile,
      fileOrigin: 'PV',
      masterId: 123,
      university: 'Test University',
      formation: 'Test Formation',
      yearAcademic: '2022-2023',
      session: 1
    };

    service.uploadFile(dto).subscribe(event => {
      if (event.type === HttpEventType.Response) {
        expect(event.body.success).toBeTrue();
        expect(event.body.file.fileName).toBe('test.txt');
      }
    });

    const req = httpMock.expectOne(`${baseUrl}/upload`);
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      file: {
        id: 1,
        fileName: 'test.txt',
        fileType: 'txt',
        uploadDate: '2023-01-01',
        universityName: 'Test University',
        academicUnitName: 'Test Formation',
        session: '1',
        academicYear: '2022-2023',
        fileOrigin: 'PV'
      }
    });
  });

  it('should get files by master and update filesSubject', () => {
    service.getFilesByMaster(123).subscribe(files => {
      expect(files.length).toBe(1);
      expect(files[0].fileName).toBe('test.txt');
    });

    const req = httpMock.expectOne(`${baseUrl}/master/123`);
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      files: [
        {
          id: 1,
          fileName: 'test.txt',
          fileType: 'txt',
          uploadDate: '2023-01-01',
          universityName: 'Test University',
          academicUnitName: 'Test Formation',
          session: '1',
          academicYear: '2022-2023',
          fileOrigin: 'PV'
        }
      ]
    });
  });

  it('should delete a file and update filesSubject', async () => {
    // Set initial state in the subject.
    (service as any).filesSubject.next([
      {
        fileId: 1,
        fileName: 'test.txt',
        fileType: 'txt',
        uploadDate: '2023-01-01',
        universityName: 'Test University',
        academicUnitName: 'Test Formation',
        session: '1',
        academicYear: '2022-2023',
        fileOrigin: 'PV'
      }
    ]);

    // Create observable but don't complete it yet
    const deletePromise = service.deleteFile(1).subscribe();

    // Now check for the request
    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'File deleted successfully', file: { fileId: 1 } });

    // Wait for the observable to complete
    await new Promise(resolve => setTimeout(resolve));

    // Verify that the subject now contains no files.
    const files = await firstValueFrom(service.files$);
    expect(files.length).toBe(0);

    // Clean up subscription
    deletePromise.unsubscribe();
  });

  it('should download a file as blob', () => {
    service.downloadFile(1).subscribe(blob => {
      expect(blob).toBeTruthy();
      expect(blob instanceof Blob).toBeTrue();
    });

    const req = httpMock.expectOne(`${baseUrl}/1/download`);
    expect(req.request.method).toBe('GET');
    req.flush(new Blob(['dummy content'], { type: 'text/plain' }));
  });
});
