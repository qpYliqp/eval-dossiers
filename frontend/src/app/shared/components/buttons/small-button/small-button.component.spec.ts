import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SmallButtonComponent } from './small-button.component';

describe('SmallButtonComponent', () => {
  let component: SmallButtonComponent;
  let fixture: ComponentFixture<SmallButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmallButtonComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SmallButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the icon image when iconPath is provided', () => {
    component.iconPath = 'assets/icons/delete-icon.svg';
    fixture.detectChanges();

    const imgEl = fixture.debugElement.query(By.css('.icon-img'));
    
    expect(imgEl).toBeTruthy();
    expect(imgEl.nativeElement.getAttribute('src')).toContain('assets/icons/delete-icon.svg');
  });

  it('should call onClick callback when button is clicked', () => {
    const onClickSpy = jasmine.createSpy('onClick');
    component.onClick = onClickSpy;
    fixture.detectChanges();

    const buttonEl = fixture.debugElement.query(By.css('button')).nativeElement;
    buttonEl.click();
    fixture.detectChanges();

    expect(onClickSpy).toHaveBeenCalled();
  });
});
