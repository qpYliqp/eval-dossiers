import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CardInfoItemComponent } from './card-info-item.component';

describe('CardInfoItemComponent', () => {
  let component: CardInfoItemComponent;
  let fixture: ComponentFixture<CardInfoItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardInfoItemComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardInfoItemComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render the label text when provided', () => {
    // Arrange
    component.label = 'Test Label';
    fixture.detectChanges();

    // Act
    const labelEl = fixture.debugElement.query(By.css('.card-label'));

    // Assert
    expect(labelEl.nativeElement.textContent).toContain('Test Label');
  });

  it('should not render the icon image if iconPath is not provided', () => {
    // Arrange
    component.iconPath = undefined;
    fixture.detectChanges();

    // Act
    const imgEl = fixture.debugElement.query(By.css('.card-icon'));

    // Assert
    expect(imgEl).toBeNull();
  });

  it('should render the icon image when iconPath is provided', () => {
    // Arrange
    component.iconPath = 'assets/icons/test-icon.svg';
    fixture.detectChanges();

    // Act
    const imgEl = fixture.debugElement.query(By.css('.card-icon'));

    // Assert
    expect(imgEl).toBeTruthy();
    expect(imgEl.nativeElement.getAttribute('src')).toContain('assets/icons/test-icon.svg');
  });

  it('should apply custom label font size and icon color via ngStyle', () => {
    // Arrange
    component.labelFontSize = '18px';
    component.iconColor = 'red';
    fixture.detectChanges();

    // Act
    const labelEl = fixture.debugElement.query(By.css('.card-label'));

    // Assert
    // The inline style set by [ngStyle] should reflect our custom values.
    expect(labelEl.nativeElement.style.fontSize).toBe('18px');
    expect(labelEl.nativeElement.style.color).toBe('red');
  });

  it('should apply custom icon size via ngStyle on the icon container', () => {
    // Arrange
    component.iconSize = '50px';
    fixture.detectChanges();

    // Act
    const iconContainer = fixture.debugElement.query(By.css('.icon-container'));

    // Assert
    expect(iconContainer.nativeElement.style.width).toBe('50px');
    expect(iconContainer.nativeElement.style.height).toBe('50px');
  });
});
