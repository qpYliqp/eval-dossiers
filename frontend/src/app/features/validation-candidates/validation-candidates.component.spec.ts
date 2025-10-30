import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationCandidatesComponent } from './validation-candidates.component';
import { ValidationCandidatesService } from './services/validation-candidates.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ViewingListComponent } from '../../shared/components/lists/viewing-list/viewing-list.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ValidationCandidatesComponent', () => {
  let component: ValidationCandidatesComponent;
  let fixture: ComponentFixture<ValidationCandidatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ValidationCandidatesComponent,
        ViewingListComponent
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ValidationCandidatesService,
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ masterId: '123' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ValidationCandidatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
