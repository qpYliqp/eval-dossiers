import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateReportsResponse, StudentData, VerificationStatus } from '../../../../features/validation-candidates/models/validation-candidates.model';

@Component({
    selector: 'app-candidate-reports-panel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './candidate-reports-panel.component.html',
    styleUrls: ['./candidate-reports-panel.component.scss']
})
export class CandidateReportsPanelComponent {
    @Input() candidate?: StudentData;
    @Input() candidateReports?: CandidateReportsResponse;
    @Input() loading = false;
    @Input() error: string | null = null;

    @Output() closePanel = new EventEmitter<void>();

    /**
     * Format the field name to make it more readable
     * @param fieldName Original field name from the API
     * @returns Formatted field name
     */
    formatFieldName(fieldName: string): string {
        // Split on the arrow
        const parts = fieldName.split('→');

        if (parts.length < 2) {
            return this.cleanupFieldName(fieldName);
        }

        // Get the label before and after the arrow, clean them up, and recombine
        const beforeArrow = this.cleanupFieldName(parts[0].trim());
        const afterArrow = this.cleanupFieldName(parts[1].trim());

        return `${beforeArrow} → ${afterArrow}`;
    }

    /**
     * Clean up a field name by removing prefixes and replacing underscores
     * @param name Original field name
     * @returns Cleaned field name
     */
    cleanupFieldName(name: string): string {
        // Remove prefixes like 'score_', 'grade_'
        let cleanName = name.replace(/(score_|grade_)/g, '');

        // Replace underscores with spaces
        cleanName = cleanName.replace(/_/g, ' ');

        // Capitalize first letter of each word
        return cleanName.replace(/\b\w/g, c => c.toUpperCase());
    }

    /**
     * Get CSS class for verification status
     * @param status Verification status
     * @returns CSS class name
     */
    getStatusClass(status: VerificationStatus): string {
        switch (status) {
            case VerificationStatus.FULLY_VERIFIED:
                return 'status-verified';
            case VerificationStatus.PARTIALLY_VERIFIED:
                return 'status-partial';
            case VerificationStatus.FRAUD:
                return 'status-fraud';
            case VerificationStatus.CANNOT_VERIFY:
                return 'status-cannot-verify';
            default:
                return 'status-unknown';
        }
    }

    /**
     * Get human-readable label for verification status
     * @param status Verification status
     * @returns Human-readable label
     */
    getStatusLabel(status: VerificationStatus): string {
        switch (status) {
            case VerificationStatus.FULLY_VERIFIED:
                return 'Vérifié';
            case VerificationStatus.PARTIALLY_VERIFIED:
                return 'Partiellement vérifié';
            case VerificationStatus.FRAUD:
                return 'Possible fraude';
            case VerificationStatus.CANNOT_VERIFY:
                return 'Non vérifiable';
            default:
                return 'Inconnu';
        }
    }

    /**
     * Parse a string to float safely
     * @param value String value
     * @returns Number or 0 if parsing fails
     */
    parseFloat(value: string): number {
        const num = Number.parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    /**
     * Handle close panel button click
     */
    onClose(): void {
        this.closePanel.emit();
    }
}
