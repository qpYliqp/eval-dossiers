import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FileUploadComponent } from './file-upload.component';
import { FileUploadService } from '../services/file-upload.service';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { fileEntry } from '../../../shared/models/objectListEntries/file-entry/file-entry';
import { File } from '../../../core/models/file.model';

// Stub for FileUploadService
class FileUploadServiceStub {
  private filesSubject = new Subject<File[]>();
  files$ = this.filesSubject.asObservable();

  uploadFile(dto: any) {
    const event: HttpEvent<any> = {
      type: HttpEventType.Response,
      body: {
        success: true,
        file: {
          id: 1,
          fileName: 'test.xml',
          fileType: 'xml',
          uploadDate: '2023-01-01',
          universityName: 'U1',
          academicUnitName: 'AU1',
          session: '1',
          academicYear: '2022-2023',
          fileOrigin: dto.fileOrigin
        }
      }
    } as HttpEvent<any>;
    return of(event);
  }

  getFilesByMaster(masterId: number) {
    const files: File[] = [
      new File('PV', 1, 'pvfile.xml', 'xml', '2023-01-01', 'U1', 'AU1', '1', '2022-2023'),
      new File('MonMaster', 2, 'mmfile.xlsx', 'xlsx', '2023-01-02', '', '', '', '')
    ];
    this.filesSubject.next(files);
    return of(files);
  }

  deleteFile(fileId: number) {
    return of({ message: 'File deleted successfully', file: { id: fileId } });
  }

  downloadFile(fileId: number) {
    const blob = new Blob(['dummy content'], { type: 'text/plain' });
    return of(blob);
  }
}

class ActivatedRouteStub {
  params = of({ masterId: '123' });
}

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;
  let fileUploadService: FileUploadServiceStub;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(async () => {
    activatedRoute = new ActivatedRouteStub();
    fileUploadService = new FileUploadServiceStub();

    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
      providers: [
        { provide: FileUploadService, useValue: fileUploadService },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set masterId from route params and refresh files', fakeAsync(() => {
    // Spy on refreshFiles to verify it's called
    spyOn(component, 'refreshFiles').and.callThrough();
    // Spy on the service method that should be called by refreshFiles
    spyOn(fileUploadService, 'getFilesByMaster').and.callThrough();

    fixture.detectChanges();
    tick(); // process all pending asynchronous activities

    // Verify the masterId is correctly set from the route param
    expect(component.masterId).toBe(123);
    // Verify refreshFiles was called
    expect(component.refreshFiles).toHaveBeenCalled();
    // Verify the service method was called with correct masterId
    expect(fileUploadService.getFilesByMaster).toHaveBeenCalledWith(123);
    // Verify fileEntries is defined
    expect(component.fileEntries).toBeDefined();
    // Verify there are entries in filteredFileEntries
    expect(component.filteredFileEntries.length).toBeGreaterThan(0);
  }));

  it('should filter file entries based on activeTab', () => {
    const files: File[] = [
      new File('PV', 1, 'pvfile.xml', 'xml', '2023-01-01', 'U1', 'AU1', '1', '2022-2023'),
      new File('MonMaster', 2, 'mmfile.xlsx', 'xlsx', '2023-01-02', '', '', '', '')
    ];
    component.fileEntries = files.map(file => new fileEntry(file));
    component.activeTab = 'PV';
    let filtered = component.filteredFileEntries;
    expect(filtered.length).toBe(1);
    expect(filtered[0].getFile().fileOrigin).toBe('PV');

    component.activeTab = 'MonMaster';
    filtered = component.filteredFileEntries;
    expect(filtered.length).toBe(1);
    expect(filtered[0].getFile().fileOrigin).toBe('MonMaster');
  });

  it('should call deleteFile when confirmDelete is invoked', fakeAsync(() => {
    spyOn(fileUploadService, 'deleteFile').and.callThrough();
    spyOn(component, 'refreshFiles');
    component.FileToDelete = 1;
    component.confirmDelete();
    tick();
    expect(fileUploadService.deleteFile).toHaveBeenCalledWith(1);
    expect(component.refreshFiles).toHaveBeenCalled();
    expect(component.FileToDelete).toBeNull();
    expect(component.isDeletingFile).toBeFalse();
  }));

  it('should call downloadFile service when downloadFile is triggered', fakeAsync(() => {
    spyOn(fileUploadService, 'downloadFile').and.callThrough();
    const file = new File('PV', 1, 'test.xml', 'xml', '2023-01-01', 'U1', 'AU1', '1', '2022-2023');
    const entry = new fileEntry(file);
    component.downloadFile(entry, 'PV');
    tick();
    expect(fileUploadService.downloadFile).toHaveBeenCalledWith(1);
  }));
});
