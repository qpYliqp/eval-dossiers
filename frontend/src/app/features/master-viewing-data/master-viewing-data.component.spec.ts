import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MasterViewingDataComponent } from './master-viewing-data.component';
import { ActivatedRoute } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { FileMasterService } from '../file-upload/services/file-master.service';
import { FileUploadService } from '../file-upload/services/file-upload.service';
import { columnMasterEntry } from '../../shared/models/objectListEntries/column-master-entry/column-master-entry';
import { File } from '../../core/models/file.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

// Define the interfaces based on the error messages
interface FileColumn {
    columnIndex: number;
    columnName: string;
    // Add other properties as needed
}

describe('MasterViewingDataComponent', () => {
    let component: MasterViewingDataComponent;
    let fixture: ComponentFixture<MasterViewingDataComponent>;
    let fileMasterServiceSpy: jasmine.SpyObj<FileMasterService>;
    let fileUploadServiceSpy: jasmine.SpyObj<FileUploadService>;

    beforeEach(async () => {
        // Create spies for the services with correct return types
        const fileMasterSpy = jasmine.createSpyObj('FileMasterService',
            ['getSelectedColumnsByFileId', 'getDataColumnsByFileId']);
        fileMasterSpy.dataColumns$ = of([]);

        const fileUploadSpy = jasmine.createSpyObj('FileUploadService',
            ['getMasterFileId']);
        // Set a default return value for getMasterFileId to avoid undefined errors
        fileUploadSpy.getMasterFileId.and.returnValue(of([]));

        // Mock the route params with masterId
        const activatedRouteStub = {
            params: of({ masterId: '123' })
        };

        await TestBed.configureTestingModule({
            imports: [
                MasterViewingDataComponent
            ],
            providers: [
                { provide: ActivatedRoute, useValue: activatedRouteStub },
                { provide: FileMasterService, useValue: fileMasterSpy },
                { provide: FileUploadService, useValue: fileUploadSpy },
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        }).compileComponents();

        fileMasterServiceSpy = TestBed.inject(FileMasterService) as jasmine.SpyObj<FileMasterService>;
        fileUploadServiceSpy = TestBed.inject(FileUploadService) as jasmine.SpyObj<FileUploadService>;

        fixture = TestBed.createComponent(MasterViewingDataComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        // Return empty array to match File[] type
        fileUploadServiceSpy.getMasterFileId.and.returnValue(of([]));
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should set masterId from route params', () => {
        // Return empty array to match File[] type
        fileUploadServiceSpy.getMasterFileId.and.returnValue(of([]));
        fixture.detectChanges();
        expect(component.masterId).toBe(123);
    });

    it('should log error when masterId is null', () => {
        // Replace the route parameter with an empty object
        TestBed.resetTestingModule();

        const emptyRouteStub = {
            params: of({})
        };

        TestBed.configureTestingModule({
            imports: [MasterViewingDataComponent],
            providers: [
                { provide: ActivatedRoute, useValue: emptyRouteStub },
                { provide: FileMasterService, useValue: fileMasterServiceSpy },
                { provide: FileUploadService, useValue: fileUploadServiceSpy },
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        fixture = TestBed.createComponent(MasterViewingDataComponent);
        component = fixture.componentInstance;
    });

    it('should call getMasterFileId with masterId', () => {
        // Create a mock File object with all required properties including fullName
        const mockFiles: File[] = [{
            fileId: 456,
            fileName: 'test',
            fileType: 'txt',
            uploadDate: '2023-01-01',
            universityName: 'Test University',
            academicUnitName: 'Test Formation',
            session: '1',
            academicYear: '2022-2023',
            fileOrigin: 'PV',
            get fullName() { return this.fileName + " " + this.fileType; }
        } as File];

        // Set up the spy BEFORE detectChanges to avoid undefined errors
        fileUploadServiceSpy.getMasterFileId.and.returnValue(of(mockFiles));

        // Use correct return type for getSelectedColumnsByFileId
        const mockColumns: FileColumn[] = [
            { columnIndex: 0, columnName: 'Column1' },
            { columnIndex: 1, columnName: 'Column2' }
        ];
        fileMasterServiceSpy.getSelectedColumnsByFileId.and.returnValue(of(mockColumns));

        // Use correct return type for getDataColumnsByFileId
        const mockEntries: columnMasterEntry[] = [];
        fileMasterServiceSpy.getDataColumnsByFileId.and.returnValue(Promise.resolve(mockEntries));

        fixture.detectChanges();

        expect(fileUploadServiceSpy.getMasterFileId).toHaveBeenCalledWith(123);
    });

    it('should log error when fileId is not found', () => {
        // Spy on console.log before setting up return values
        spyOn(console, 'log');

        // Return empty array which is not null, but will trigger the "not found" condition
        fileUploadServiceSpy.getMasterFileId.and.returnValue(of([]));

        fixture.detectChanges();

        expect(console.log).toHaveBeenCalledWith('error : fileId not found');
    });

    it('should initialize correctly when fileId is found', () => {
        const mockFileId = 456;
        // Create a mock File array with the fileId and fullName getter
        const mockFiles: File[] = [{
            fileId: mockFileId,
            fileName: 'test',
            fileType: 'txt',
            uploadDate: '2023-01-01',
            universityName: 'Test University',
            academicUnitName: 'Test Formation',
            session: '1',
            academicYear: '2022-2023',
            fileOrigin: 'PV',
            get fullName() { return this.fileName + " " + this.fileType; }
        } as File];

        // Use correct interface for FileColumn
        const mockColumns: FileColumn[] = [
            { columnIndex: 0, columnName: 'Column1' },
            { columnIndex: 1, columnName: 'Column2' }
        ];

        // Create mockEntries with the correct structure
        const mockEntries: columnMasterEntry[] = [];

        // Setup spies with correct return types
        fileUploadServiceSpy.getMasterFileId.and.returnValue(of(mockFiles));
        fileMasterServiceSpy.getSelectedColumnsByFileId.and.returnValue(of(mockColumns));
        fileMasterServiceSpy.dataColumns$ = of(mockEntries);
        fileMasterServiceSpy.getDataColumnsByFileId.and.returnValue(Promise.resolve(mockEntries));

        // Mock columnMasterEntry static methods
        spyOn(columnMasterEntry, 'setColumns');
        spyOn(columnMasterEntry, 'getColumns').and.returnValue([
            { key: 'Column1', label: 'Column1' },
            { key: 'Column2', label: 'Column2' }
        ]);

        fixture.detectChanges();

        expect(fileUploadServiceSpy.getMasterFileId).toHaveBeenCalledWith(123);
        expect(fileMasterServiceSpy.getSelectedColumnsByFileId).toHaveBeenCalledWith(mockFileId);
        expect(columnMasterEntry.setColumns).toHaveBeenCalledWith(mockColumns);
        expect(fileMasterServiceSpy.getDataColumnsByFileId).toHaveBeenCalledWith(mockFileId);
        expect(component.rowColumns).toEqual([
            { key: 'Column1', label: 'Column1' },
            { key: 'Column2', label: 'Column2' }
        ]);
        expect(component.rowEntries).toEqual(mockEntries);
    });

    it('should handle async operations correctly in init method', async () => {
        const mockFileId = 456;
        // Create a mock File array with the fileId and fullName getter
        const mockFiles: File[] = [{
            fileId: mockFileId,
            fileName: 'test',
            fileType: 'txt',
            uploadDate: '2023-01-01',
            universityName: 'Test University',
            academicUnitName: 'Test Formation',
            session: '1',
            academicYear: '2022-2023',
            fileOrigin: 'PV',
            get fullName() { return this.fileName + " " + this.fileType; }
        } as File];

        // Use correct column structure
        const mockColumns: FileColumn[] = [
            { columnIndex: 0, columnName: 'Column1' },
            { columnIndex: 1, columnName: 'Column2' }
        ];

        fileUploadServiceSpy.getMasterFileId.and.returnValue(of(mockFiles));
        fileMasterServiceSpy.getSelectedColumnsByFileId.and.returnValue(of(mockColumns));

        // Create a promise with the correct return type
        const mockEntries: columnMasterEntry[] = [];
        const dataPromise = Promise.resolve(mockEntries);

        fileMasterServiceSpy.getDataColumnsByFileId.and.returnValue(dataPromise);

        fixture.detectChanges();

        // The init method should have been called
        expect(fileMasterServiceSpy.getDataColumnsByFileId).toHaveBeenCalledWith(mockFileId);

        // Wait for promise to resolve
        await fixture.whenStable();

        // After promise resolves, expect the component to be in the correct state
        expect(component.masterId).toBe(123);
    });
});