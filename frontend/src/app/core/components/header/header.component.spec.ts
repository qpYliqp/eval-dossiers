import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { provideRouter } from '@angular/router';
import { MasterSelectionService } from '../../services/master-selection.service';
import { of } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let masterSelectionServiceMock: jasmine.SpyObj<MasterSelectionService>;

  beforeEach(async () => {
    masterSelectionServiceMock = jasmine.createSpyObj('MasterSelectionService', [
      'clearSelectedMaster'
    ], {
      selectedMasterId$: of(null)
    });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: MasterSelectionService, useValue: masterSelectionServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should clear selected master when navigating to spaces', () => {
    component.goToSpaces();
    expect(masterSelectionServiceMock.clearSelectedMaster).toHaveBeenCalled();
  });
});
