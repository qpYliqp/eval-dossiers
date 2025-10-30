import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SearchDropdownComponent } from './search-dropdown.component';

describe('SearchDropdownComponent', () => {
  let component: SearchDropdownComponent;
  let fixture: ComponentFixture<SearchDropdownComponent>;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchDropdownComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchDropdownComponent);
    component = fixture.componentInstance;
    // Provide some sample values for filtering tests
    component.values = ['Apple', 'Banana', 'Cherry'];
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('#searchDropdownInput');
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize filteredValues with all values on init', () => {
    expect(component.filteredValues).toEqual(component.values);
  });

  it('should filter values based on searchTerm input', () => {
    // Set the input value to "a"
    component.searchTerm = 'a';
    component.filterValues();
    fixture.detectChanges();
    // "Apple" and "Banana" include 'a' (case-insensitive) while "Cherry" does not.
    expect(component.filteredValues).toEqual(['Apple', 'Banana']);
  });

  it('should call onChange callback when filtering values', () => {
    // Replace the onChangeFn with a spy
    component.registerOnChange(jasmine.createSpy('onChangeSpy'));
    component.searchTerm = 'Ban';
    component.filterValues();
    expect(component['onChangeFn']).toHaveBeenCalledWith('Ban');
  });

  it('should update searchTerm, close dropdown, and call onChange when a value is selected', () => {
    // Ensure the dropdown is visible before selection
    component.showDropdown = true;
    fixture.detectChanges();

    // Replace onChangeFn with a spy
    component.registerOnChange(jasmine.createSpy('onChangeSpy'));
    // Find the first <li> element rendered (should be "Apple" from the filtered list)
    const liDebugEl = fixture.debugElement.query(By.css('li'));
    liDebugEl.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(component.searchTerm).toBe('Apple');
    expect(component.showDropdown).toBeFalse();
    expect(component['onChangeFn']).toHaveBeenCalledWith('Apple');
  });

  it('should display dropdown on input focus', () => {
    // Ensure dropdown is hidden initially
    component.showDropdown = false;
    fixture.detectChanges();
    // Trigger focus event on the input element
    inputEl.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(component.showDropdown).toBeTrue();
  });

  it('should call onTouched callback when input loses focus (after delay)', fakeAsync(() => {
    // Replace onTouchedFn with a spy
    component.registerOnTouched(jasmine.createSpy('onTouchedSpy'));
    // Trigger blur event on the input element
    inputEl.dispatchEvent(new Event('blur'));
    // Advance time by 200ms (the delay in hideDropdown)
    tick(200);
    fixture.detectChanges();
    expect(component['onTouchedFn']).toHaveBeenCalled();
  }));

  it('should implement writeValue properly', () => {
    component.values = ['Apple', 'Banana', 'Cherry'];
    component.writeValue('Test');
    fixture.detectChanges();
    expect(component.searchTerm).toBe('Test');
    // When a value is written, filteredValues should be reset to full list
    expect(component.filteredValues).toEqual(component.values);
  });
});
