import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MappingService } from './file-mapping.service';
import { MappingConfiguration } from './mapping.types';

describe('MappingService', () => {
  let service: MappingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MappingService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(MappingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a mapping entry', () => {
    const dummyEntry = {
      configurationId: 1,
      masterColumnIndex: 1,
      masterColumnName: 'Nom',
      pvColumnIndex: 2,
      pvColumnName: 'Name',
      monmasterFileId: 1,
      pvFileId: 1
    };

    service.addMappingEntry(dummyEntry).subscribe(response => {
      expect(response).toEqual(dummyEntry);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/entries`);
    expect(req.request.method).toBe('POST');
    req.flush(dummyEntry);
  });

  it('should update a mapping entry', () => {
    const dummyEntry = {
      configurationId: 1,
      masterColumnIndex: 1,
      masterColumnName: 'Nom',
      pvColumnIndex: 2,
      pvColumnName: 'Name',
      monmasterFileId: 1,
      pvFileId: 1
    };

    service.updateMappingEntry(1, dummyEntry).subscribe(response => {
      expect(response).toEqual(dummyEntry);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/entries/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(dummyEntry);
  });

  it('should delete a mapping entry', () => {
    service.deleteMappingEntry(1).subscribe(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/entries/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should load a mapping configuration', () => {
    const dummyConfig: MappingConfiguration = {
      configurationId: 1,
      monmasterFileId: 1,
      pvFileId: 1,
      entries: [],
      createdDate: new Date(),
      updatedDate: new Date()
    };

    service.loadMappingConfiguration(1, 1).subscribe((response: MappingConfiguration | null) => {
      expect(response).toEqual(dummyConfig);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/configurations?monmasterFileId=1&pvFileId=1`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyConfig);
  });

  it('should get a mapping configuration by ID', () => {
    const dummyConfig: MappingConfiguration = {
      configurationId: 1,
      monmasterFileId: 1,
      pvFileId: 1,
      entries: [],
      createdDate: new Date(),
      updatedDate: new Date()
    };

    service.getMappingConfigurationById(1).subscribe((response: MappingConfiguration) => {
      expect(response).toEqual(dummyConfig);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/configurations/1`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyConfig);
  });

  it('should delete a mapping configuration', () => {
    service.deleteMappingConfiguration(1).subscribe((response: void) => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/configurations/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});