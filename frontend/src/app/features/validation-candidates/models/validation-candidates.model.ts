export enum VerificationStatus {
    FULLY_VERIFIED = 'fully_verified',
    PARTIALLY_VERIFIED = 'partially_verified',
    FRAUD = 'fraud',
    CANNOT_VERIFY = 'cannot_verify'
}

export interface TableColumn {
    id: string;
    label: string;
    type: string;
}

export interface StudentData {
    candidateId: number;
    fullName: string;
    dateOfBirth: string;
    candidateNumber: string;
    latestInstitution: string;
    scores: { [key: string]: string };
    verificationStatus: VerificationStatus | null;
}

export interface StudentTableResponse {
    columns: TableColumn[];
    count: number;
    students: StudentData[];
}

export interface ValidationStatistics {
    totalCandidates: number;
    matchedCandidates: number;
    unmatchedCandidates: number;
    fullyVerifiedCount: number;
    partiallyVerifiedCount: number;
    fraudCount: number;
    cannotVerifyCount: number;
    percentageFullyVerified: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface FieldComparison {
    fieldName: string;
    monmasterValue?: string;
    pvValue?: string;
    similarityScore: string;
    verificationStatus: VerificationStatus;
}

export interface ComparisonReport {
    candidate: {
        monmasterCandidateId: number;
        pvStudentDataId: number;
        fullName: string;
        dateOfBirth?: string;
    };
    monmasterFileId: number;
    pvFileId: number;
    averageSimilarity: string;
    overallVerificationStatus: VerificationStatus;
    fields: FieldComparison[];
}

export interface CandidateReportsResponse {
    candidateId: number;
    reportCount: number;
    reports: ComparisonReport[];
}
