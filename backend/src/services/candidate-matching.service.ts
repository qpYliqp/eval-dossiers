import { CandidateMatch } from '../types/grade-comparison.types';
import { CandidateMatchingModel } from '../models/candidate-matching.model';
import { FuzzyMatchingService } from './fuzzy-matching.service';

export class CandidateMatchingService {
    private fuzzyMatchingService: FuzzyMatchingService;
    private candidateMatchingModel: CandidateMatchingModel;

    constructor() {
        this.fuzzyMatchingService = new FuzzyMatchingService();
        this.candidateMatchingModel = new CandidateMatchingModel();
    }

    /**
     * Generate candidate matches between MonMaster and PV files
     * @param monmasterFileId ID of the MonMaster file
     * @param pvFileId ID of the PV file
     * @param candidates Array of MonMaster candidates
     * @param students Array of PV students
     * @returns Array of generated CandidateMatch
     */
    async generateCandidateMatches(
        monmasterFileId: number,
        pvFileId: number,
        candidates: Array<{ candidateId: number; fullName: string; dateOfBirth: string }>,
        students: Array<{ studentDataId: number; name: string; dateOfBirth: string }>
    ): Promise<CandidateMatch[]> {
        // Convert candidates and students to the format required by FuzzyMatchingService
        const sourceCandidates = candidates.map(candidate => ({
            id: candidate.candidateId,
            firstName: candidate.fullName.split(' ')[0],
            lastName: candidate.fullName.split(' ').slice(1).join(' '),
            dateOfBirth: candidate.dateOfBirth,
        }));

        const targetCandidates = students.map(student => ({
            id: student.studentDataId,
            firstName: student.name.split(' ')[0],
            lastName: student.name.split(' ').slice(1).join(' '),
            dateOfBirth: student.dateOfBirth,
        }));

        // Use FuzzyMatchingService to find the best matches
        const matches = this.fuzzyMatchingService.findBestMatches(sourceCandidates, targetCandidates) || [];

        // Convert matches to CandidateMatch format
        const candidateMatches: CandidateMatch[] = matches.map(match => ({
            monmasterFileId,
            pvFileId,
            monmasterCandidateId: Number(match.source.id),
            pvStudentDataId: Number(match.target.id),
            createdAt: new Date(),
        }));

        // Save matches to the database using the model
        return await this.candidateMatchingModel.saveCandidateMatches(candidateMatches);
    }
}