import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadMetadataSectionComponent } from './upload-metadata-section.component';

describe('UploadMetadataSectionComponent', () => {
  let component: UploadMetadataSectionComponent;
  let fixture: ComponentFixture<UploadMetadataSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadMetadataSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadMetadataSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit selectedUniversityChange when onUniversityChange is called', () => {
    spyOn(component.selectedUniversityChange, 'emit');
    component.onUniversityChange('Test University');
    expect(component.selectedUniversityChange.emit).toHaveBeenCalledWith('Test University');
  });

  it('should emit selectedAcademicYearChange when onAcademicYearChange is called', () => {
    spyOn(component.selectedAcademicYearChange, 'emit');
    component.onAcademicYearChange('2023-2024');
    expect(component.selectedAcademicYearChange.emit).toHaveBeenCalledWith('2023-2024');
  });

  it('should emit selectedAcademicUnitChange when onAcademicUnitChange is called', () => {
    spyOn(component.selectedAcademicUnitChange, 'emit');
    component.onAcademicUnitChange('Computer Science');
    expect(component.selectedAcademicUnitChange.emit).toHaveBeenCalledWith('Computer Science');
  });

  it('should emit selectedSessionChange when onSessionChange is called', () => {
    spyOn(component.selectedSessionChange, 'emit');
    component.onSessionChange('session2');
    expect(component.selectedSessionChange.emit).toHaveBeenCalledWith('session2');
  });
});
