import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { FileSelectComponent } from './file-select.component';
import { FileSelectService } from '../../services/file-select.service';


interface MockFile {
    id?: number;
    name: string;
    type: string;
    createdAt: Date;
}

describe('FileSelectComponent', () => {
    let component: FileSelectComponent;
    let fixture: ComponentFixture<FileSelectComponent>;
    let mockFileSelectService: jasmine.SpyObj<FileSelectService> & { state$: Observable<any> };
    let mockStateSubject: BehaviorSubject<any>;


    const mockPvFiles: MockFile[] = [
        { id: 1, name: 'PV File 1', type: 'PV', createdAt: new Date() },
        { id: 2, name: 'PV File 2', type: 'PV', createdAt: new Date() }
    ];

    beforeEach(async () => {

        mockStateSubject = new BehaviorSubject({
            pvFiles: [],
            monmasterFileId: null,
            monmasterFileName: null,
            selectedPvFile: null,
            loading: false,
            error: null
        });


        mockFileSelectService = {
            ...jasmine.createSpyObj('FileSelectService', [
                'loadFilesForMaster',
                'loadPvFiles',
                'selectPvFile'
            ]),
            state$: mockStateSubject.asObservable()
        };


        mockFileSelectService.loadFilesForMaster.and.returnValue(of(undefined));
        mockFileSelectService.loadPvFiles.and.returnValue(of(undefined));

        await TestBed.configureTestingModule({
            imports: [CommonModule, FormsModule, FileSelectComponent],
            providers: [
                { provide: FileSelectService, useValue: mockFileSelectService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FileSelectComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should load PV files on init when masterId is not provided', () => {
        fixture.detectChanges();
        expect(mockFileSelectService.loadPvFiles).toHaveBeenCalled();
        expect(mockFileSelectService.loadFilesForMaster).not.toHaveBeenCalled();
    });

    it('should load files for master on init when masterId is provided', () => {
        component.masterId = 123;
        fixture.detectChanges();
        expect(mockFileSelectService.loadFilesForMaster).toHaveBeenCalledWith(123);
        expect(mockFileSelectService.loadPvFiles).not.toHaveBeenCalled();
    });

    it('should update component properties when state changes', () => {
        fixture.detectChanges();


        mockStateSubject.next({
            pvFiles: mockPvFiles,
            monmasterFileId: 456,
            monmasterFileName: 'Master File',
            selectedPvFile: 1,
            loading: true,
            error: null
        });


        expect(component.pvFiles.length).toBe(mockPvFiles.length);
        expect(component.monmasterFileId).toBe(456);
        expect(component.monmasterFileName).toBe('Master File');
        expect(component.selectedPvFile).toBe(1);
        expect(component.loading).toBe(true);
        expect(component.error).toBeNull();
    });

    it('should call selectPvFile on the service when selecting a file', () => {
        const fileId = 2;
        component.selectPvFile(fileId);
        expect(mockFileSelectService.selectPvFile).toHaveBeenCalledWith(fileId);
    });

    it('should emit filesSelected when startMapping is called with valid selections', () => {

        spyOn(component.filesSelected, 'emit');


        component.monmasterFileId = 456;
        component.selectedPvFile = 1;


        component.startMapping();


        expect(component.filesSelected.emit).toHaveBeenCalledWith({
            monmasterFileId: 456,
            pvFileId: 1
        });
    });

    it('should not emit filesSelected when startMapping is called without valid selections', () => {
        spyOn(component.filesSelected, 'emit');


        component.monmasterFileId = 456;
        component.selectedPvFile = null;

        component.startMapping();

        expect(component.filesSelected.emit).not.toHaveBeenCalled();
    });

    it('should unsubscribe from state$ on destroy', () => {
        fixture.detectChanges();


        const subscriptionSpy = spyOn((component as any).subscription, 'unsubscribe');

        component.ngOnDestroy();

        expect(subscriptionSpy).toHaveBeenCalled();
    });
});
