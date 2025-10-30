import { TestBed } from '@angular/core/testing';
import { UpdateCandidateServiceService } from './update-candidate-service.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('UpdateCandidateServiceService', () => {
  let service: UpdateCandidateServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(UpdateCandidateServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
