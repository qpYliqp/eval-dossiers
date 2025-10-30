import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { RepertoireDirective } from '../directive/directive.component';

@Component({
  selector: 'search-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, RepertoireDirective],
  templateUrl: './search-dropdown.component.html',
  styleUrls: ['./search-dropdown.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchDropdownComponent),
      multi: true
    }
  ]
})
export class SearchDropdownComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() values: string[] = [];
  @Input() placeholder: string = 'test';
  @Input() iconSvg: string = '';
  @Input() required: boolean = false;

  searchTerm: string = '';
  filteredValues: string[] = [];
  showDropdown: boolean = false;

  private onChangeFn: (val: string) => void = () => { };
  private onTouchedFn: () => void = () => { };

  ngOnInit() {
    this.filteredValues = [...this.values];
  }

  filterValues() {
    this.filteredValues = this.values.filter(value =>
      value.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.onChangeFn(this.searchTerm);
  }

  selectValue(value: string) {
    this.searchTerm = value;
    this.showDropdown = false;
    this.onChangeFn(this.searchTerm);
  }

  hideDropdown() {
    setTimeout(() => {
      this.showDropdown = false;
      this.onTouchedFn();
    }, 200);
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this.searchTerm = value || '';
    this.filteredValues = this.values;
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void { }
}
