import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MasterProgramCardComponent } from './master-program-card.component';

describe('MasterProgramCardComponent', () => {
  let component: MasterProgramCardComponent;
  let fixture: ComponentFixture<MasterProgramCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterProgramCardComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MasterProgramCardComponent);
    component = fixture.componentInstance;


    component.headerIconPath = 'assets/icons/graduate-icon.svg';
    component.headerLabel = 'Test Header';
    component.bodyItems = [
      { label: 'Item 1' },
      { label: 'Item 2' },
      { label: 'Item 3' },
      { label: 'Item 4' }
    ];
    component.bodyIconPath = [
      'assets/icons/certificate-icon.svg',
      'assets/icons/person-icon.svg',
      'assets/icons/calender-icon.svg',
      'assets/icons/people-icon.svg'
    ];
    component.modifyIconPath = 'assets/icons/modify-icon.svg';
    component.deleteIconPath = 'assets/icons/delete-icon.svg';
    component.menuIconPath = 'assets/icons/more-options-icon.svg';

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render header with a card-info-item', () => {
    const headerEl = fixture.debugElement.query(By.css('.header'));
    expect(headerEl).toBeTruthy();


    const headerCard = headerEl.query(By.css('card-info-item'));
    expect(headerCard).toBeTruthy();
  });

  it('should render the correct number of body card-info-items', () => {
    const bodyEl = fixture.debugElement.query(By.css('.body'));
    expect(bodyEl).toBeTruthy();


    const bodyCards = bodyEl.queryAll(By.css('card-info-item'));
    expect(bodyCards.length).toEqual(component.bodyItems.length);
  });

  it('should render footer with action buttons', () => {
    const footerEl = fixture.debugElement.query(By.css('.footer'));
    expect(footerEl).toBeTruthy();

    const buttonsContainer = footerEl.query(By.css('.buttons'));
    expect(buttonsContainer).toBeTruthy();


    const smallButtons = buttonsContainer.queryAll(By.css('small-button'));
    expect(smallButtons.length).toEqual(2);


    const contextualMenuButton = buttonsContainer.query(By.css('contextual-menu-button'));
    expect(contextualMenuButton).toBeTruthy();
  });
});
