import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LargeButtonComponent } from './large-button.component';

describe('LargeButtonComponent', () => {
  let component: LargeButtonComponent;
  let fixture: ComponentFixture<LargeButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LargeButtonComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LargeButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the label text when provided', () => {
    // Arrange
    component.label = 'Test Label';
    fixture.detectChanges();

    // Act
    const labelEl = fixture.debugElement.query(By.css('.label'));

    // Assert
    expect(labelEl.nativeElement.textContent).toContain('Test Label');
  });

  it('should call onClick callback when button is clicked', () => {
    // Arrange
    const onClickSpy = jasmine.createSpy('onClick');
    component.onClick = onClickSpy;
    fixture.detectChanges();

    // Act: Use the native element's click method.
    const buttonEl = fixture.debugElement.query(By.css('button')).nativeElement;
    buttonEl.click();
    fixture.detectChanges();

    // Assert
    expect(onClickSpy).toHaveBeenCalled();
  });
});
