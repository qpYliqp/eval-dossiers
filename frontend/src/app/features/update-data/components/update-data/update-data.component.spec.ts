import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateDataComponent } from './update-data.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UpdateCandidateServiceService } from '../../services/update-candidate-service.service';

describe('UpdateDataComponent', () => {
  let component: UpdateDataComponent;
  let fixture: ComponentFixture<UpdateDataComponent>;

  const mockUpdateCandidateService = {
    getCandidateById: jasmine.createSpy('getCandidateById').and.returnValue(of({
      data: {
        candidate: {
          candidateId: 1,
          fullName: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          candidateNumber: '123-45',
          dateOfBirth: '1990-01-01'
        },
        academicRecords: [],
        scores: []
      }
    })),
    updateFirstName: jasmine.createSpy('updateFirstName').and.returnValue(of({})),
    updateLastName: jasmine.createSpy('updateLastName').and.returnValue(of({})),
    updateAcademicRecord: jasmine.createSpy('updateAcademicRecord').and.returnValue(of({})),
    updateCandidateScore: jasmine.createSpy('updateCandidateScore').and.returnValue(of({})),
    put: jasmine.createSpy('put').and.returnValue(of({}))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UpdateDataComponent
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id_master: '123', id_candidate: '456' })
          }
        },
        {
          provide: UpdateCandidateServiceService,
          useValue: mockUpdateCandidateService
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UpdateDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
