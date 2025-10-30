import { GRADE_SCALES, GradeScale } from "../types/grade-normalization.types";

/**
 * Detect the scale of a grade (0-20 or 0-200)
 * @param grade The grade value as a string or number
 * @returns The detected scale
 */
export function detectGradeScale(grade: string | number | null): GradeScale {
    if (grade === null || grade === undefined || grade === '') {
        return GRADE_SCALES.SCALE_0_20; // Default scale
    }

    const numericGrade = typeof grade === 'string' ? parseFloat(grade) : grade;

    if (isNaN(numericGrade) || numericGrade < 0) {
        return GRADE_SCALES.SCALE_0_20; // Default for invalid grades
    }

    // If grade is > 20 but <= 200, assume 0-200 scale
    if (numericGrade > 20 && numericGrade <= 200) {
        return GRADE_SCALES.SCALE_0_200;
    }

    // Otherwise, assume 0-20 scale
    return GRADE_SCALES.SCALE_0_20;
}

/**
 * Normalize a grade to a common scale (0-20)
 * @param grade The grade to normalize
 * @param scale The scale of the grade (optional, will be auto-detected if not provided)
 * @returns Normalized grade on 0-20 scale
 */
export function normalizeGrade(grade: string | number | null, scale?: GradeScale): number | null {
    if (grade === null || grade === undefined || grade === '') {
        return null;
    }

    const numericGrade = typeof grade === 'string' ? parseFloat(grade) : grade;

    if (isNaN(numericGrade) || numericGrade < 0) {
        return null;
    }

    // Auto-detect scale if not provided
    const gradeScale = scale || detectGradeScale(grade);

    // Validate the grade is within the expected range
    if (numericGrade > gradeScale.max) {
        return null;
    }

    // Convert to 0-20 scale if needed
    if (gradeScale.scale === 20) {
        return numericGrade;
    } else {
        return numericGrade / (gradeScale.scale / 20);
    }
}

/**
 * Parse a value as a normalized grade on a 0-20 scale, or return null if not a valid number
 * @param value Value to parse and normalize
 */
export function parseAndNormalizeGrade(value: any): number | null {
    return normalizeGrade(value);
}
