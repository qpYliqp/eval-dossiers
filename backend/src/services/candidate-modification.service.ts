import { CandidateModificationModel } from "../models/candidate-modification.model";
import { NormalizedCandidate, AcademicRecord, CandidateScore } from "../types/monmaster-normalization.types";

export class CandidateModificationService {
    /**
     * Met à jour le prénom d'un candidat et met à jour ⁠ fullName ⁠.
     */
    async updateFirstName(candidateId: number, firstName: string): Promise<NormalizedCandidate | null> {
        return await CandidateModificationModel.updateFirstName(candidateId, firstName);
    }

    /**
     * Met à jour le nom de famille d'un candidat et met à jour ⁠ fullName ⁠.
     */
    async updateLastName(candidateId: number, lastName: string): Promise<NormalizedCandidate | null> {
        return await CandidateModificationModel.updateLastName(candidateId, lastName);
    }

    /**
     * Met à jour les notes d'un relevé académique spécifique.
     */
    async updateAcademicRecord(recordId: number, gradeSemester1: number | null, gradeSemester2: number | null): Promise<AcademicRecord | null> {
        return await CandidateModificationModel.updateAcademicRecord(recordId, gradeSemester1, gradeSemester2);
    }

    /**
     * Met à jour la valeur d'un score de candidat.
     */
    async updateCandidateScore(scoreId: number, scoreValue: string): Promise<CandidateScore | null> {
        return await CandidateModificationModel.updateCandidateScore(scoreId, scoreValue);
    }
}