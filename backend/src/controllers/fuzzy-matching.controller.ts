import { Request, Response } from 'express';
import { FuzzyMatchingService } from '../services/fuzzy-matching.service';
import { Candidate, MatchingOptions } from '../types/fuzzy-matching.types';

export class FuzzyMatchingController {
    private service: FuzzyMatchingService;

    constructor() {
        this.service = new FuzzyMatchingService();
    }

    /**
     * Find all possible matches between source and target candidates
     */
    async findMatches(req: Request, res: Response): Promise<void> {
        try {
            const { sourceCandidates, targetCandidates, options } = req.body;

            if (!Array.isArray(sourceCandidates) || !Array.isArray(targetCandidates)) {
                res.status(400).json({
                    success: false,
                    message: 'Both sourceCandidates and targetCandidates must be arrays'
                });
                return;
            }

            // Validate if candidates have the required fields
            if (!this.validateCandidates(sourceCandidates) || !this.validateCandidates(targetCandidates)) {
                res.status(400).json({
                    success: false,
                    message: 'Each candidate must have id, firstName, and lastName fields'
                });
                return;
            }

            const results = this.service.findMatches(
                sourceCandidates as Candidate[],
                targetCandidates as Candidate[],
                options as Partial<MatchingOptions>
            );

            res.status(200).json({
                success: true,
                matches: results,
                totalMatches: results.length
            });
        } catch (error) {
            console.error('Error finding matches:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while finding matches'
            });
        }
    }

    /**
     * Find the best match for each source candidate
     */
    async findBestMatches(req: Request, res: Response): Promise<void> {
        try {
            const { sourceCandidates, targetCandidates, options } = req.body;

            if (!Array.isArray(sourceCandidates) || !Array.isArray(targetCandidates)) {
                res.status(400).json({
                    success: false,
                    message: 'Both sourceCandidates and targetCandidates must be arrays'
                });
                return;
            }

            // Validate if candidates have the required fields
            if (!this.validateCandidates(sourceCandidates) || !this.validateCandidates(targetCandidates)) {
                res.status(400).json({
                    success: false,
                    message: 'Each candidate must have id, firstName, and lastName fields'
                });
                return;
            }

            const results = this.service.findBestMatches(
                sourceCandidates as Candidate[],
                targetCandidates as Candidate[],
                options as Partial<MatchingOptions>
            );

            res.status(200).json({
                success: true,
                matches: results,
                totalMatches: results.length
            });
        } catch (error) {
            console.error('Error finding best matches:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while finding best matches'
            });
        }
    }

    /**
     * Validate that all candidates have the required fields
     */
    private validateCandidates(candidates: any[]): boolean {
        return candidates.every(candidate => 
            candidate && 
            candidate.id !== undefined && 
            typeof candidate.firstName === 'string' && 
            typeof candidate.lastName === 'string'
        );
    }
}