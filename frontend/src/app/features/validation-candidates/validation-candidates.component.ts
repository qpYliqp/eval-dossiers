import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Listable } from '../../core/interfaces/listable';
import { ViewingListComponent } from '../../shared/components/lists/viewing-list/viewing-list.component';
import { ValidationCandidatesService } from './services/validation-candidates.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LargeButtonComponent } from '../../shared/components/buttons/large-button/large-button.component';
import { ValidationFormComponent } from '../../shared/components/forms/validation-form/validation-form.component';
import { ListAction } from '../../core/interfaces/listAction';
import { CandidateReportsResponse, StudentData, TableColumn, VerificationStatus } from './models/validation-candidates.model';
import { CoffeeAnimationComponent } from '../../shared/components/loading-animations/coffee-animation/coffee-animation.component';
import { CandidateReportsPanelComponent } from '../../shared/components/reports/candidate-reports-panel/candidate-reports-panel.component';

export class ValidationCandidateEntry implements Listable {
  constructor(
    private student: StudentData
  ) { }

  static getColumns(columns: TableColumn[]) {
    // Return all columns except any internal system fields
    return columns.map(column => ({
      key: column.id,
      label: column.label
    }));
  }

  /**
   * Format a score value to have exactly 4 decimal places
   * @param value The score value to format
   * @returns The formatted value or the original if not a valid number
   */
  private formatScoreValue(value: string): string {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num.toFixed(4);
    }
    return value; // Return original value if not a valid number
  }

  getValues() {
    // Create a flat object with all values including scores
    const values: { [key: string]: any } = {
      fullName: this.student.fullName,
      dateOfBirth: this.student.dateOfBirth,
      candidateNumber: this.student.candidateNumber,
      latestInstitution: this.student.latestInstitution,
      verificationStatus: this.student.verificationStatus
    };

    // Add score fields with their dynamic names and format numeric values to 4 decimal places
    if (this.student.scores) {
      Object.entries(this.student.scores).forEach(([key, value]) => {
        const scoreKey = `score_${key.replace(/\s+/g, '_')}`;
        values[scoreKey] = this.formatScoreValue(value);
      });
    }

    return values;
  }

  getStudent() {
    return this.student
  }
}

export enum trustClasses {
  LOW_TRUST = 'low-trust-row',
  MEDIUM_TRUST = 'medium-trust-row',
  HIGH_TRUST = 'high-trust-row',
  INFO_TRUST = 'info-trust-row',
  DEFAULT_TRUST = 'default-trust-row',
}

interface InformationReview {
  title: string,
  pv: string,
  master: string,
}

@Component({
  selector: 'app-validation-candidates',
  standalone: true,
  imports: [
    ViewingListComponent,
    CommonModule,
    LargeButtonComponent,
    ValidationFormComponent,
    CoffeeAnimationComponent,
    CandidateReportsPanelComponent
  ],
  templateUrl: './validation-candidates.component.html',
  styleUrl: './validation-candidates.component.scss'
})
export class ValidationCandidatesComponent implements OnInit {
  candidateEntries: ValidationCandidateEntry[] = [];
  columns: { key: string, label: string }[] = [];
  loading = true;
  error: string | null = null;
  masterName: string | undefined;
  masterId: number = 1; // Default master ID if not provided in route
  showMatchedOnly: boolean = false; // Track filter state
  showPanel: boolean = false; // Track panel visibility
  startingValidation: boolean = false;
  processingValidation: boolean = false; // New state for when validation is being processed
  validationResult: any = null; // Store validation result message
  candidateReports?: CandidateReportsResponse; // Store candidate reports
  selectedCandidate?: StudentData; // Store selected candidate
  loadingReports: boolean = false; // Track reports loading state

  studentActions: ListAction<ValidationCandidateEntry>[] = [
    {
      id: "review-student",
      icon: 'assets/icons/eye.svg',
      label: "Review",
      execute: (entry: ValidationCandidateEntry) => {
        this.openPanelReview(entry.getStudent());
      }
    },
    {
      id: "edit-student",
      icon: 'assets/icons/modify-icon.svg',
      label: "Edit",
      execute: (entry: ValidationCandidateEntry) => {
        this.router.navigate([
          '/master',
          this.masterId,
          'update-candidate',
          entry.getStudent().candidateId
        ]);
      }
    }
  ]

  // Mock data for modification history
  informationReview: InformationReview[] = [];

  constructor(
    private validationService: ValidationCandidatesService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Get masterId from route params if available
    this.route.params.subscribe(params => {
      if (params['masterId']) {
        this.masterId = +params['masterId'];
      }
      this.loadDataWithoutProcessing();
    });
  }

  dynamicButtons = [
    { label: "Aller au mapping", action: () => this.goToMapping() },
  ];

  goToMapping() {
    this.router.navigate([`/master/${this.masterId}/mapping`]);
  }

  toggleStarting() {
    this.startingValidation = !this.startingValidation;
  }

  openPanelReview(student: StudentData) {
    this.selectedCandidate = student;
    this.loadingReports = true;
    this.error = null;

    this.validationService.getCandidateReports(student.candidateId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.candidateReports = response.data;
            this.showPanel = true;
            this.loadingReports = false;
          } else {
            this.error = response.message || 'Failed to load candidate reports';
            this.loadingReports = false;
          }
        },
        error: (err) => {
          console.error('Error loading candidate reports:', err);
          this.error = 'An error occurred while loading candidate reports';
          this.loadingReports = false;
        }
      });
  }

  togglePanel() {
    this.showPanel = !this.showPanel;
  }

  // Modified to first run the validation process
  loadValidationData(): void {
    this.startingValidation = false; // Close modal
    this.processingValidation = true; // Show animation
    this.loading = true;
    this.error = null;

    // Start the validation process
    this.validationService.startValidationProcess(this.masterId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.validationResult = response.message;
            // After successful validation, get the updated data
            this.loadDataAfterProcessing();
          } else {
            this.processingValidation = false;
            this.loading = false;
            this.error = response.message || 'Failed to process validation';
          }
        },
        error: (err) => {
          console.error('Error starting validation process:', err);
          this.processingValidation = false;
          this.loading = false;
          this.error = 'An error occurred during the validation process';
        }
      });
  }

  // Load data without starting the validation process
  loadDataWithoutProcessing(): void {
    this.loading = true;
    this.error = null;

    this.validationService.getStudentTableData(this.masterId)
      .subscribe({
        next: (response) => {
          this.handleDataResponse(response);
        },
        error: (err) => {
          console.error('Error loading validation data:', err);
          this.error = 'An error occurred while loading validation data';
          this.loading = false;
          this.processingValidation = false;
        }
      });
  }

  // Load data after processing validation
  loadDataAfterProcessing(): void {
    this.validationService.getStudentTableData(this.masterId)
      .subscribe({
        next: (response) => {
          this.handleDataResponse(response);
          // Hide processing animation when complete
          this.processingValidation = false;
        },
        error: (err) => {
          console.error('Error loading validation data:', err);
          this.error = 'An error occurred while loading validation data';
          this.loading = false;
          this.processingValidation = false;
        }
      });
  }

  // Common handler for data response
  private handleDataResponse(response: any): void {
    if (response.success) {
      const data = response.data;

      // Set columns from API response
      this.columns = ValidationCandidateEntry.getColumns(data.columns);

      // Set master name if available
      this.masterName = data.columns.find((col: any) => col.id === 'masterId')?.label ||
        `Master ID: ${this.masterId}`;

      // Transform students to ValidationCandidateEntry objects
      this.candidateEntries = data.students.map((student: StudentData) => new ValidationCandidateEntry(student));

      this.loading = false;
    } else {
      this.error = 'Failed to load validation data';
      this.loading = false;
    }
  }

  // Get filtered candidates based on the toggle state
  get filteredCandidateEntries(): ValidationCandidateEntry[] {
    if (!this.showMatchedOnly) {
      return this.candidateEntries;
    }
    return this.candidateEntries.filter(candidate => {
      const values = candidate.getValues();
      // Filter out candidates with "cannot verify" status instead of checking for null
      return values['verificationStatus'] !== VerificationStatus.CANNOT_VERIFY;
    });
  }

  // Toggle the matched-only filter
  toggleMatchedOnly(): void {
    this.showMatchedOnly = !this.showMatchedOnly;
  }

  // Function to determine the CSS class of the row based on verification status
  getRowClass = (candidate: ValidationCandidateEntry): string => {
    const values = candidate.getValues();
    const status = values['verificationStatus'];

    // Now all candidates should have a verification status, so we can remove the null check
    switch (status) {
      case VerificationStatus.FULLY_VERIFIED:
        return trustClasses.HIGH_TRUST;
      case VerificationStatus.PARTIALLY_VERIFIED:
        return trustClasses.MEDIUM_TRUST;
      case VerificationStatus.FRAUD:
        return trustClasses.LOW_TRUST;
      case VerificationStatus.CANNOT_VERIFY:
        return trustClasses.INFO_TRUST;
      default:
        return trustClasses.DEFAULT_TRUST;
    }
  }
}