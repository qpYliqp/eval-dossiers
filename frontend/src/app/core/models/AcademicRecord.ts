export interface AcademicRecord {
    recordId?: number;
    candidateId: number;
    academicYear: string;
    programType: string;
    curriculumYear: string;
    specialization: string;
    coursePath: string;
    gradeSemester1: number | null;
    gradeSemester2: number | null;
    institution: string;
}