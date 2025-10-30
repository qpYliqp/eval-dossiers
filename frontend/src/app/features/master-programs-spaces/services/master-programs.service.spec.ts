import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MasterProgram } from '../models/master-program.model';

import { MasterProgramsService } from './master-programs.service';
import { provideHttpClient } from '@angular/common/http';

describe('MasterProgramsService', () => {
  let service: MasterProgramsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(MasterProgramsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a master program', () => {
    const dto = { masterName: 'Test Master', academicUnit: 'Unit A' };
    // Use a fixed date for consistency in tests.
    const fixedDate = new Date('2025-02-22T13:16:35Z');

    // Raw API response structure - backend format with lowercase property names
    const rawResponse = {
      message: 'Created successfully',
      space: {
        masterId: 1,
        masterName: dto.masterName,
        academicUnit: dto.academicUnit,
        createdDate: fixedDate,
        lastUpdated: fixedDate,
        createdBy: { /* ...existing user props... */ },
        examiners: []
      }
    };

    // Expected result - frontend model format
    const expected: MasterProgram = {
      masterId: 1,
      masterName: dto.masterName,
      academicUnit: dto.academicUnit,
      createdDate: fixedDate,
      lastUpdated: fixedDate,
      createdBy: { /* ...existing user props... */ } as any,
      examiners: []
    };

    let response: MasterProgram | undefined;
    service.createMasterProgram(dto).subscribe(res => response = res);

    const req = httpTestingController.expectOne('http://localhost:3000/api/master-programs');
    expect(req.request.method).toBe('POST');
    req.flush(rawResponse);

    expect(response).toEqual(expected);
  });

  it('should handle error when createMasterProgram fails', () => {
    const dto = { masterName: 'Error Master', academicUnit: 'Unit Error' };
    let errorResponse: any;
    service.createMasterProgram(dto).subscribe({
      next: () => { },
      error: err => errorResponse = err
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/master-programs');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });

    expect(errorResponse.status).toBe(400);
  });

  it('should delete a master program', () => {
    const initialProgram: MasterProgram = {
      masterId: 2,
      masterName: 'Delete Test',
      academicUnit: 'Unit B',
      createdDate: new Date(),
      lastUpdated: new Date(),
      createdBy: { /* ...existing user props... */ } as any,
      examiners: []
    };

    (service as any).masterProgramsSubject.next([initialProgram]);

    let updatedPrograms: MasterProgram[] = [];
    service.masterPrograms$.subscribe(programs => updatedPrograms = programs);

    service.deleteMasterProgram(2).subscribe(res => {
      expect(res.message).toBeTruthy();
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/master-programs/2');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Deleted successfully' });

    expect(updatedPrograms).not.toContain(initialProgram);
  });

  it('should handle error when deleteMasterProgram fails for non-existent id', () => {
    let errorResponse: any;
    service.deleteMasterProgram(999).subscribe({
      next: () => { },
      error: err => errorResponse = err
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/master-programs/999');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(errorResponse.status).toBe(404);
  });

  it('should fetch all master programs', () => {
    const fixedDate = new Date('2025-02-22T13:16:35Z');

    // Raw response data from backend in correct format
    const rawProgramList = [{
      masterId: 1,
      masterName: 'Program A',
      academicUnit: 'Unit X',
      createdDate: fixedDate,
      lastUpdated: fixedDate,
      createdBy: {}, // raw user object
      examiners: []
    }];

    // Expected frontend model format
    const expected: MasterProgram[] = [{
      masterId: 1,
      masterName: 'Program A',
      academicUnit: 'Unit X',
      createdDate: fixedDate,
      lastUpdated: fixedDate,
      createdBy: {} as any,
      examiners: []
    }];

    let response: MasterProgram[] | undefined;
    service.getMasterPrograms().subscribe(res => response = res);
    const req = httpTestingController.expectOne('http://localhost:3000/api/master-programs');
    expect(req.request.method).toBe('GET');
    req.flush(rawProgramList);

    expect(response).toEqual(expected);
  });

  it('should return an empty array if no master programs are found', () => {
    let response: MasterProgram[] | undefined;
    service.getMasterPrograms().subscribe(res => response = res);

    const req = httpTestingController.expectOne('http://localhost:3000/api/master-programs');
    expect(req.request.method).toBe('GET');
    req.flush([]);

    expect(response).toEqual([]);
  });

  it('should fetch a master program by ID', () => {
    const fixedDate = new Date('2025-02-22T13:16:35Z');

    // Raw response data from backend with correct property naming
    const rawProgram = {
      masterId: 2,
      masterName: 'Program B',
      academicUnit: 'Unit Y',
      createdDate: fixedDate,
      lastUpdated: fixedDate,
      createdBy: {}, // raw user object
      examiners: []
    };

    // Expected frontend model format  
    const expected: MasterProgram = {
      masterId: 2,
      masterName: 'Program B',
      academicUnit: 'Unit Y',
      createdDate: fixedDate,
      lastUpdated: fixedDate,
      createdBy: {} as any,
      examiners: []
    };

    let response: MasterProgram | undefined;
    service.getMasterProgramById(2).subscribe(res => response = res);
    const req = httpTestingController.expectOne('http://localhost:3000/api/master-programs/2');
    expect(req.request.method).toBe('GET');
    req.flush(rawProgram);

    expect(response).toEqual(expected);
  });

  it('should handle error when getMasterProgramById fails', () => {
    let errorResponse: any;
    service.getMasterProgramById(999).subscribe({
      error: err => errorResponse = err
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/master-programs/999');
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    expect(errorResponse.status).toBe(404);
  });

  it('should update a master program', () => {
    const masterId = 3;
    const dto = { masterName: 'Updated Master', academicUnit: 'Updated Unit' };
    const fixedDate = new Date('2025-02-22T13:16:35Z');

    // Set initial state with a program to update
    const initialPrograms: MasterProgram[] = [{
      masterId: masterId,
      masterName: 'Original Master',
      academicUnit: 'Original Unit',
      createdDate: fixedDate,
      lastUpdated: fixedDate,
      createdBy: {} as any,
      examiners: []
    }];

    (service as any).masterProgramsSubject.next(initialPrograms);

    // Raw API response from backend
    const rawResponse = {
      message: 'Updated successfully',
      updatedSpace: {
        masterId: masterId,
        masterName: dto.masterName,
        academicUnit: dto.academicUnit,
        createdDate: fixedDate,
        lastUpdated: new Date('2025-02-23T09:00:00Z'), // Updated date
        createdBy: {}, // raw user object
        examiners: []
      }
    };

    // Expected result after update
    const expected: MasterProgram = {
      masterId: masterId,
      masterName: dto.masterName,
      academicUnit: dto.academicUnit,
      createdDate: fixedDate,
      lastUpdated: new Date('2025-02-23T09:00:00Z'),
      createdBy: {} as any,
      examiners: []
    };

    let response: MasterProgram | undefined;
    let updatedPrograms: MasterProgram[] = [];

    // Subscribe to masterPrograms$ to verify state update
    service.masterPrograms$.subscribe(programs => updatedPrograms = programs);

    // Call the update method
    service.updateMasterProgram(masterId, dto).subscribe(res => response = res);

    // Verify HTTP request was made correctly
    const req = httpTestingController.expectOne(`http://localhost:3000/api/master-programs/${masterId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: dto.masterName, academicUnit: dto.academicUnit });

    req.flush(rawResponse);

    // Check that the returned object is as expected
    expect(response).toEqual(expected);

    // Check that the internal state was updated correctly
    expect(updatedPrograms.length).toBe(1);
    expect(updatedPrograms[0]).toEqual(expected);
  });

  it('should correctly format request payload for updateMasterProgram', () => {
    const masterId = 4;
    const dto = { masterName: 'Renamed Master', academicUnit: 'Renamed Unit' };

    service.updateMasterProgram(masterId, dto).subscribe();

    const req = httpTestingController.expectOne(`http://localhost:3000/api/master-programs/${masterId}`);

    // Check that the frontend correctly maps masterName -> name for backend
    expect(req.request.body).toEqual({
      name: dto.masterName,
      academicUnit: dto.academicUnit
    });

    req.flush({
      message: 'Updated successfully',
      updatedSpace: { masterId, masterName: dto.masterName, academicUnit: dto.academicUnit }
    });
  });

  it('should handle error when updateMasterProgram fails', () => {
    const masterId = 5;
    const dto = { masterName: 'Error Master', academicUnit: 'Error Unit' };

    let errorResponse: any;
    service.updateMasterProgram(masterId, dto).subscribe({
      next: () => { },
      error: err => errorResponse = err
    });

    const req = httpTestingController.expectOne(`http://localhost:3000/api/master-programs/${masterId}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });

    expect(errorResponse.status).toBe(400);
  });

  it('should not update BehaviorSubject when updateMasterProgram fails', () => {
    const masterId = 6;
    const dto = { masterName: 'Error Master', academicUnit: 'Error Unit' };

    // Setup initial state
    const initialProgram: MasterProgram = {
      masterId: masterId,
      masterName: 'Initial Master',
      academicUnit: 'Initial Unit',
      createdDate: new Date(),
      lastUpdated: new Date(),
      createdBy: {} as any,
      examiners: []
    };

    (service as any).masterProgramsSubject.next([initialProgram]);

    let currentPrograms: MasterProgram[] = [];
    service.masterPrograms$.subscribe(programs => currentPrograms = programs);

    // Attempt to update
    service.updateMasterProgram(masterId, dto).subscribe({
      next: () => { },
      error: () => { }
    });

    // Simulate network error
    const req = httpTestingController.expectOne(`http://localhost:3000/api/master-programs/${masterId}`);
    req.error(new ErrorEvent('Network error'));

    // BehaviorSubject should remain unchanged
    expect(currentPrograms.length).toBe(1);
    expect(currentPrograms[0]).toEqual(initialProgram);
  });

  it('should not update state when the updated program ID is not found in current list', () => {
    const masterId = 7;
    const dto = { masterName: 'New Master', academicUnit: 'New Unit' };

    // Set initial state with a different program ID
    const initialPrograms: MasterProgram[] = [{
      masterId: 999, // Different ID than what we're updating
      masterName: 'Different Program',
      academicUnit: 'Different Unit',
      createdDate: new Date(),
      lastUpdated: new Date(),
      createdBy: {} as any,
      examiners: []
    }];

    (service as any).masterProgramsSubject.next(initialPrograms);

    // Keep track of the state
    let stateUpdated = false;
    let currentPrograms: MasterProgram[] = [];

    service.masterPrograms$.subscribe(programs => {
      currentPrograms = programs;
      if (programs !== initialPrograms) {
        stateUpdated = true;
      }
    });

    // Call update for a non-existent ID in the current state
    service.updateMasterProgram(masterId, dto).subscribe();

    const req = httpTestingController.expectOne(`http://localhost:3000/api/master-programs/${masterId}`);
    req.flush({
      message: 'Updated successfully',
      updatedSpace: {
        masterId: masterId,
        masterName: dto.masterName,
        academicUnit: dto.academicUnit,
        createdDate: new Date(),
        lastUpdated: new Date(),
        createdBy: {},
        examiners: []
      }
    });

    // The BehaviorSubject should not update since the ID wasn't found
    expect(currentPrograms.length).toBe(1);
    expect(currentPrograms[0].masterId).toBe(999);
  });

  it('should handle empty master programs list when updating', () => {
    const masterId = 8;
    const dto = { masterName: 'Test Master', academicUnit: 'Test Unit' };

    // Start with an empty list
    (service as any).masterProgramsSubject.next([]);

    let currentPrograms: MasterProgram[] = [];
    service.masterPrograms$.subscribe(programs => currentPrograms = programs);

    // Try to update a master program when the list is empty
    service.updateMasterProgram(masterId, dto).subscribe();

    const req = httpTestingController.expectOne(`http://localhost:3000/api/master-programs/${masterId}`);
    req.flush({
      message: 'Updated successfully',
      updatedSpace: {
        masterId: masterId,
        masterName: dto.masterName,
        academicUnit: dto.academicUnit,
        createdDate: new Date(),
        lastUpdated: new Date(),
        createdBy: {},
        examiners: []
      }
    });

    // The list should still be empty since the ID wasn't found
    expect(currentPrograms.length).toBe(0);
  });
});
