import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FileMappingComponent } from './file-mapping.component';
import { MappingFacadeService } from '../../services/mapping-facade.service';
import { of, BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('FileMappingComponent', () => {
  let component: FileMappingComponent;
  let fixture: ComponentFixture<FileMappingComponent>;
  let mappingFacadeService: MappingFacadeService;

  beforeEach(async () => {
    // Create mock state for the facade
    const mockFacadeStateSubject = new BehaviorSubject({
      mappings: [],
      masterFields: [],
      pvFields: [],
      configuration: { configurationId: 1 },
      loading: false,
      error: null,
      configLoaded: true
    });

    const mockMappingFacadeService = {
      state$: mockFacadeStateSubject.asObservable(),
      addMappingEntry: jasmine.createSpy('addMappingEntry').and.returnValue(of({})),
      loadMappingData: jasmine.createSpy('loadMappingData').and.returnValue(of({})),
      deleteMappingEntry: jasmine.createSpy('deleteMappingEntry').and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [FileMappingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MappingFacadeService, useValue: mockMappingFacadeService },
        { provide: ActivatedRoute, useValue: { params: of({}) } }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FileMappingComponent);
    component = fixture.componentInstance;
    mappingFacadeService = TestBed.inject(MappingFacadeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save a mapping', () => {
    component.selectedMasterRow = { index: 1, name: 'Nom' };
    component.selectedPvRow = { index: 2, name: 'Prénom' };
    component.monmasterFileId = 1;
    component.pvFileId = 1;
    component.currentConfigurationId = 1;

    component.saveMapping();

    expect(mappingFacadeService.addMappingEntry).toHaveBeenCalledWith({
      configurationId: 1,
      masterColumnIndex: 1,
      masterColumnName: 'Nom',
      pvColumnIndex: 2,
      pvColumnName: 'Prénom',
      monmasterFileId: 1,
      pvFileId: 1
    });
  });

  it('should delete a mapping', () => {
    component.deleteMapping(1);
    expect(mappingFacadeService.deleteMappingEntry).toHaveBeenCalledWith(1);
  });
});
