import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SelectColumnMasterComponent } from './select-column-master.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FileMasterService } from '../../../../features/file-upload/services/file-master.service';
import { of } from 'rxjs';
import { FileColumn } from '../../../../features/file-upload/models/FileColumn';

describe('SelectColumnMasterComponent', () => {
  let component: SelectColumnMasterComponent;
  let fixture: ComponentFixture<SelectColumnMasterComponent>;
  let fileMasterServiceSpy: jasmine.SpyObj<FileMasterService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('FileMasterService', [
      'getColumnsByFileId',
      'getSelectedColumnsByFileId',
      'toggleColumnSelection'
    ]);

    await TestBed.configureTestingModule({
      imports: [SelectColumnMasterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FileMasterService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectColumnMasterComponent);
    component = fixture.componentInstance;
    fileMasterServiceSpy = TestBed.inject(FileMasterService) as jasmine.SpyObj<FileMasterService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load columns and selected columns on init when fileId is provided', fakeAsync(() => {
    component.fileId = 1;
    const mockColumns: FileColumn[] = [{ columnIndex: 1, columnName: 'Test' }];
    const mockSelected: FileColumn[] = [{ columnIndex: 1, columnName: 'Test' }];

    fileMasterServiceSpy.getColumnsByFileId.and.returnValue(of(mockColumns));
    fileMasterServiceSpy.getSelectedColumnsByFileId.and.returnValue(of(mockSelected));

    fixture.detectChanges(); // Triggers ngOnInit
    tick();

    expect(fileMasterServiceSpy.getColumnsByFileId).toHaveBeenCalledWith(1);
    expect(fileMasterServiceSpy.getSelectedColumnsByFileId).toHaveBeenCalledWith(1);
    expect(component.masterColumns).toEqual(mockColumns);
    expect(component.selectedRows).toEqual(mockSelected);
  }));

  it('should emit cancel when fileId is null on init', () => {
    component.fileId = null;
    spyOn(component.cancel, 'emit');

    fixture.detectChanges(); // Triggers ngOnInit

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should toggle column selection and update service', () => {
    component.fileId = 1;
    const column: FileColumn = { columnIndex: 1, columnName: 'Test' };
    fileMasterServiceSpy.toggleColumnSelection.and.returnValue(of({}));

    // First call adds to selection
    component.selectRow(column);
    expect(component.selectedRows).toContain(column);
    expect(fileMasterServiceSpy.toggleColumnSelection).toHaveBeenCalledWith(1, 1, 'Test');

    // Second call removes from selection
    component.selectRow(column);
    expect(component.selectedRows).not.toContain(column);
  });

  it('should handle selection when fileId is null', () => {
    component.fileId = null;
    spyOn(component.cancel, 'emit');
    const column: FileColumn = { columnIndex: 1, columnName: 'Test' };

    component.selectRow(column);

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should apply selected class correctly', () => {
    const column: FileColumn = { columnIndex: 1, columnName: 'Test' };

    component.selectedRows = [column];
    expect(component.getRowClass(column)['selected']).toBeTrue();

    component.selectedRows = [];
    expect(component.getRowClass(column)['selected']).toBeFalse();
  });

  it('should emit cancel event when cancelSelection is called', () => {
    spyOn(component.cancel, 'emit');

    component.cancelSelection();

    expect(component.cancel.emit).toHaveBeenCalled();
  });
});