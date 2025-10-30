import { Component } from '@angular/core';
import { EditableFieldComponent } from '../../../../shared/components/editable-field/editable-field.component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UpdateCandidateServiceService } from '../../services/update-candidate-service.service';
import { Student } from '../../../../core/models/Student';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

export interface InfoItem {
  label: string;
  value: string;
  isEditable: boolean;
  onEditing?: (newValue: string) => void; // Fonction optionnelle
  recordId?: number; // Added to identify which record this belongs to
  scoreId?: number; // Added to identify which score this belongs to
  groupLabel?: string; // For grouping/section headers
}

@Component({
  selector: 'app-update-data',
  standalone: true,
  imports: [EditableFieldComponent, CommonModule, NgxExtendedPdfViewerModule],
  templateUrl: './update-data.component.html',
  styleUrls: ['./update-data.component.scss']
})
export class UpdateDataComponent {
  masterId!: number;
  candidateId!: number;
  student: Student | null = null;
  personalInfo: InfoItem[] = []
  academicInfo: InfoItem[] = []
  scoreInfo: InfoItem[] = []
  academicGroups: { year: string, items: InfoItem[] }[] = [];
  scoreGroups: { category: string, items: InfoItem[] }[] = [];
  constructor(
    private route: ActivatedRoute,
    private updateCandidateService: UpdateCandidateServiceService
  ) { }
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['masterId']) {
        this.masterId = +params['masterId']; // Updated parameter name
      }

      // Unchanged code for id_candidate
      if (params['id_candidate']) {
        this.candidateId = +params['id_candidate'];
      }
    });

    this.updateCandidateService.getCandidateById(this.candidateId).subscribe({
      next: (response: any) => {
        console.log('Candidate Data:', response.data);
        this.student = response.data;
        if (this.student != null) {
          this.populatePersonalInfo(this.student);
          this.populateAcademicInfo(this.student);
          this.populateScoreInfo(this.student);
          this.candidateNumber = this.student.candidate.candidateNumber || '';
        }
      },
      error: (error) => {
        console.error('Error fetching candidate data:', error);
      }
    });
  }

  candidateNumber = '169-00';
  pdfSrc = '/assets/sample.pdf';
  zoomLevel = 1.0;
  currentPage = 1;
  pagesNumber: number | null = null;

  populatePersonalInfo(student: Student): void {
    this.personalInfo = [
      { label: 'Full Name', value: student.candidate.fullName ?? "", isEditable: false },
      {
        label: 'First Name',
        value: student.candidate.firstName || "",
        isEditable: true,
        onEditing: (newValue: string) => {
          if (this.student && this.student.candidate.candidateId !== undefined) {
            this.updateCandidateService.updateFirstName(
              this.student.candidate.candidateId,
              newValue
            ).subscribe({
              next: (response) => {
                console.log('First name updated successfully:', response);
                // Update the fullName in UI
                if (this.student) {
                  this.student.candidate.firstName = newValue;
                  this.student.candidate.fullName = `${newValue} ${this.student.candidate.lastName}`;
                  this.updateFullNameInPersonalInfo();
                }
              },
              error: (error) => {
                console.error('Failed to update first name:', error);
              }
            });
          }
        },
      },
      {
        label: 'Last Name',
        value: student.candidate.lastName || "",
        isEditable: true,
        onEditing: (newValue: string) => {
          if (this.student && this.student.candidate.candidateId !== undefined) {
            this.updateCandidateService.updateLastName(
              this.student.candidate.candidateId,
              newValue
            ).subscribe({
              next: (response) => {
                console.log('Last name updated successfully:', response);
                // Update the fullName in UI
                if (this.student) {
                  this.student.candidate.lastName = newValue;
                  this.student.candidate.fullName = `${this.student.candidate.firstName} ${newValue}`;
                  this.updateFullNameInPersonalInfo();
                }
              },
              error: (error) => {
                console.error('Failed to update last name:', error);
              }
            });
          }
        },
      },
      { label: 'Date of Birth', value: student.candidate.dateOfBirth || "", isEditable: false },
      { label: 'Candidate Number', value: student.candidate.candidateNumber || "", isEditable: false }
    ];
  }

  updateFullNameInPersonalInfo(): void {
    if (this.student) {
      // Update the full name in personalInfo array
      const fullNameItem = this.personalInfo.find(item => item.label === 'Full Name');
      if (fullNameItem) {
        fullNameItem.value = this.student.candidate.fullName || '';
      }
    }
  }

  populateAcademicInfo(student: Student): void {
    this.academicInfo = [];
    this.academicGroups = [];

    // Sort academic records by academic year (newest first)
    const sortedRecords = [...student.academicRecords].sort((a, b) =>
      b.academicYear.localeCompare(a.academicYear)
    );

    sortedRecords.forEach(record => {
      // Create a group for this academic record
      const academicGroup = {
        year: record.academicYear,
        items: [
          { label: 'Program Type', value: record.programType, isEditable: false, recordId: record.recordId },
          { label: 'Curriculum Year', value: record.curriculumYear || 'N/A', isEditable: false, recordId: record.recordId },
          { label: 'Specialization', value: record.specialization, isEditable: false, recordId: record.recordId },
          { label: 'Course Path', value: record.coursePath || 'N/A', isEditable: false, recordId: record.recordId },
          {
            label: 'Semester 1 Grade',
            value: record.gradeSemester1?.toString() || 'N/A',
            isEditable: true,
            recordId: record.recordId,
            onEditing: (newValue: string) => {
              const numericValue = parseFloat(newValue);
              if (!isNaN(numericValue) && record.recordId !== undefined) {
                this.updateCandidateService.updateAcademicRecord(
                  record.recordId,
                  numericValue,
                  record.gradeSemester2 ? parseFloat(record.gradeSemester2.toString()) : null
                ).subscribe({
                  next: (response) => {
                    console.log('Semester 1 grade updated successfully:', response);
                    record.gradeSemester1 = numericValue;
                  },
                  error: (error) => {
                    console.error('Failed to update semester 1 grade:', error);
                  }
                });
              }
            }
          },
          {
            label: 'Semester 2 Grade',
            value: record.gradeSemester2?.toString() || 'N/A',
            isEditable: true,
            recordId: record.recordId,
            onEditing: (newValue: string) => {
              const numericValue = parseFloat(newValue);
              if (!isNaN(numericValue) && record.recordId !== undefined) {
                this.updateCandidateService.updateAcademicRecord(
                  record.recordId,
                  record.gradeSemester1 ? parseFloat(record.gradeSemester1.toString()) : null,
                  numericValue
                ).subscribe({
                  next: (response) => {
                    console.log('Semester 2 grade updated successfully:', response);
                    record.gradeSemester2 = numericValue;
                  },
                  error: (error) => {
                    console.error('Failed to update semester 2 grade:', error);
                  }
                });
              }
            }
          },
          { label: 'Institution', value: record.institution, isEditable: false, recordId: record.recordId }
        ]
      };

      this.academicGroups.push(academicGroup);
    });
  }

  populateScoreInfo(student: Student): void {
    this.scoreInfo = [];
    this.scoreGroups = [];

    // Group scores by semester or category
    const groupedScores: { [key: string]: any[] } = {};

    student.scores.forEach(score => {
      // Extract category from score label if possible
      let category = 'General Scores';

      // Try to extract semester information from the label
      const semesterMatch = score.scoreLabel.match(/semestre (\d+)/i);
      if (semesterMatch) {
        category = `Semester ${semesterMatch[1]} Scores`;
      }

      if (!groupedScores[category]) {
        groupedScores[category] = [];
      }

      groupedScores[category].push(score);
    });

    // Create score groups from the grouped data
    Object.keys(groupedScores).forEach(category => {
      const scoreItems: InfoItem[] = groupedScores[category].map(score => ({
        label: score.scoreLabel,
        value: score.scoreValue,
        isEditable: true,
        scoreId: score.scoreId,
        onEditing: (newValue: string) => {
          if (score.scoreId !== undefined) {
            this.updateCandidateService.updateCandidateScore(
              score.scoreId,
              newValue
            ).subscribe({
              next: (response) => {
                console.log('Score value updated successfully:', response);
                score.scoreValue = newValue;
              },
              error: (error) => {
                console.error('Failed to update score value:', error);
              }
            });
          }
        }
      }));

      this.scoreGroups.push({
        category,
        items: scoreItems
      });
    });

    // Keep original implementation for backward compatibility
    student.scores.forEach(score => {
      this.scoreInfo.push({
        label: score.scoreLabel,
        value: score.scoreValue,
        isEditable: true,
        scoreId: score.scoreId,
        onEditing: (newValue: string) => {
          if (score.scoreId !== undefined) {
            this.updateCandidateService.updateCandidateScore(
              score.scoreId,
              newValue
            ).subscribe({
              next: (response) => {
                console.log('Score value updated successfully:', response);
                score.scoreValue = newValue;
              },
              error: (error) => {
                console.error('Failed to update score value:', error);
              }
            });
          }
        }
      });
    });
  }

  putService(url: string, requestBody: any) {
    this.updateCandidateService.put<any>(url, requestBody).subscribe({
      next: (response) => {
        console.log('First name updated successfully:', response);
      },
      error: (error) => {
        console.error('Failed to update first name:', error);
      },
    });
  }

  onPageChange(newPageNumber: number): void {
    this.currentPage = newPageNumber;
    console.log('Current page:', this.currentPage);
  }


  zoomIn(): void {
    this.zoomLevel += 0.2;
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(0.2, this.zoomLevel - 0.2);
  }
  downloadPdf(): void {
    const link = document.createElement('a');
    link.href = this.pdfSrc;
    link.download = 'myDocument.pdf';
    link.click();
  }

  printPdf(): void {
    window.open(this.pdfSrc, '_blank')?.print();
  }

  onFieldValueChanged(item: InfoItem, newValue: string) {
    item.value = newValue; // Mettre à jour directement la valeur de l'objet item
  }
}
