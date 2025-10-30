export interface NormalizedCandidate {
    candidateId?: number;
    monmasterFileId: number;
    lastName: string;
    firstName: string;
    fullName: string;
    candidateNumber: string;
    dateOfBirth: string;
    processedDate?: Date;
}