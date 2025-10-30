import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchDropdownComponent } from '../../../../shared/components/search-dropdown/search-dropdown.component';

@Component({
  selector: 'app-upload-metadata-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SearchDropdownComponent
  ],
  templateUrl: './upload-metadata-section.component.html',
  styleUrl: './upload-metadata-section.component.scss'
})
export class UploadMetadataSectionComponent {
  @Input() universityList: string[] = [];
  @Input() academicYearList: string[] = [];
  @Input() academicUnitList: string[] = [];
  @Input() hasSelectedFile: boolean = false;

  @Input() selectedUniversity: string = '';
  @Input() selectedAcademicYear: string = '';
  @Input() selectedAcademicUnit: string = '';
  @Input() selectedSession: string = 'session1';

  @Output() selectedUniversityChange = new EventEmitter<string>();
  @Output() selectedAcademicYearChange = new EventEmitter<string>();
  @Output() selectedAcademicUnitChange = new EventEmitter<string>();
  @Output() selectedSessionChange = new EventEmitter<string>();

  onUniversityChange(value: string): void {
    this.selectedUniversity = value;
    this.selectedUniversityChange.emit(value);
  }

  onAcademicYearChange(value: string): void {
    this.selectedAcademicYear = value;
    this.selectedAcademicYearChange.emit(value);
  }

  onAcademicUnitChange(value: string): void {
    this.selectedAcademicUnit = value;
    this.selectedAcademicUnitChange.emit(value);
  }

  onSessionChange(value: string): void {
    this.selectedSession = value;
    this.selectedSessionChange.emit(value);
  }
}
