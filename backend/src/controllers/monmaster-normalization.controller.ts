import { Request, Response } from 'express';
import { MonMasterNormalizationService } from '../services/monmaster-normalization.service';
import { MonMasterNormalizationError } from '../types/monmaster-normalization.types';

export class MonMasterNormalizationController {
    private service = new MonMasterNormalizationService();

    /**
     * Process a MonMaster file and normalize its data
     * @param req Express request
     * @param res Express response
     */
    async processMonMasterFile(req: Request, res: Response) {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
            }

            const result = await this.service.processMonMasterFile(fileId);

            if (!result) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process MonMaster file'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'MonMaster file processed successfully',
                data: {
                    fileId: result.fileId,
                    candidatesCount: result.normalizedData.candidates.length,
                    academicRecordsCount: result.normalizedData.academicRecords.length,
                    scoresCount: result.normalizedData.candidateScores.length
                }
            });
        } catch (error) {
            console.error(`Error in processMonMasterFile controller: ${error}`);

            if (error instanceof Error) {
                // Handle specific error types
                switch (error.message) {
                    case MonMasterNormalizationError.ALREADY_NORMALIZED:
                        return res.status(409).json({
                            success: false,
                            message: MonMasterNormalizationError.ALREADY_NORMALIZED
                        });
                    case MonMasterNormalizationError.FILE_NOT_FOUND:
                        return res.status(404).json({
                            success: false,
                            message: MonMasterNormalizationError.FILE_NOT_FOUND
                        });
                    case MonMasterNormalizationError.INVALID_FILE_TYPE:
                        return res.status(400).json({
                            success: false,
                            message: MonMasterNormalizationError.INVALID_FILE_TYPE
                        });
                }
            }

            return res.status(500).json({
                success: false,
                message: 'Server error while processing MonMaster file'
            });
        }
    }

    /**
     * Get normalized data for a MonMaster file
     * @param req Express request
     * @param res Express response
     */
    async getNormalizedData(req: Request, res: Response) {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
            }

            const normalizedData = await this.service.getNormalizedDataByFileId(fileId);

            if (!normalizedData) {
                return res.status(404).json({
                    success: false,
                    message: 'No normalized data found for this file'
                });
            }

            return res.status(200).json({
                success: true,
                data: normalizedData
            });
        } catch (error) {
            console.error(`Error in getNormalizedData controller: ${error}`);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving normalized data'
            });
        }
    }

    /**
     * Search normalized candidates based on criteria
     * @param req Express request
     * @param res Express response
     */
    async searchCandidates(req: Request, res: Response) {
        try {
            const { firstName, lastName, candidateNumber, monmasterFileId } = req.query;

            const searchParams: any = {};

            if (firstName) searchParams.firstName = String(firstName);
            if (lastName) searchParams.lastName = String(lastName);
            if (candidateNumber) searchParams.candidateNumber = String(candidateNumber);
            if (monmasterFileId) {
                const fileId = parseInt(String(monmasterFileId));
                if (!isNaN(fileId)) {
                    searchParams.monmasterFileId = fileId;
                }
            }

            const candidates = await this.service.searchCandidates(searchParams);

            return res.status(200).json({
                success: true,
                data: candidates
            });
        } catch (error) {
            console.error(`Error in searchCandidates controller: ${error}`);
            return res.status(500).json({
                success: false,
                message: 'Server error while searching candidates'
            });
        }
    }

    /**
     * Get detailed information about a specific candidate
     * @param req Express request
     * @param res Express response
     */
    async getCandidateById(req: Request, res: Response) {
        try {
            const candidateId = parseInt(req.params.candidateId);

            if (isNaN(candidateId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid candidate ID'
                });
            }

            const candidateData = await this.service.getCandidateById(candidateId);

            if (!candidateData) {
                return res.status(404).json({
                    success: false,
                    message: 'Candidate not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: candidateData
            });
        } catch (error) {
            console.error(`Error in getCandidateById controller: ${error}`);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving candidate data'
            });
        }
    }

    /**
     * Delete normalized data for a MonMaster file
     * @param req Express request
     * @param res Express response
     */
    async deleteNormalizedData(req: Request, res: Response) {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
            }

            const result = await this.service.deleteNormalizedDataByFileId(fileId);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'No normalized data found for this file or deletion failed'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Normalized data deleted successfully'
            });
        } catch (error) {
            console.error(`Error in deleteNormalizedData controller: ${error}`);
            return res.status(500).json({
                success: false,
                message: 'Server error while deleting normalized data'
            });
        }
    }

    /**
     * Get available indexed fields from a normalized MonMaster file
     * This is used by the mapping service to know which fields can be mapped
     */
    async getAvailableMonMasterFields(req: Request, res: Response) {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
            }

            const fields = await this.service.getAvailableMonMasterFields(fileId);

            if (!fields) {
                return res.status(404).json({
                    success: false,
                    message: 'No normalized data found for this file or file has not been processed yet'
                });
            }

            return res.status(200).json({
                success: true,
                data: fields
            });
        } catch (error) {
            console.error(`Error in getAvailableMonMasterFields controller: ${error}`);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving MonMaster fields'
            });
        }
    }

    /**
     * Get normalized MonMaster data as indexed records for mapping
     */
    async getNormalizedDataAsIndexedRecords(req: Request, res: Response) {
        try {
            const fileId = parseInt(req.params.fileId);

            if (isNaN(fileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file ID'
                });
            }

            const records = await this.service.getNormalizedDataAsIndexedRecords(fileId);

            if (!records) {
                return res.status(404).json({
                    success: false,
                    message: 'No normalized data found for this file or file has not been processed yet'
                });
            }

            return res.status(200).json({
                success: true,
                data: records
            });
        } catch (error) {
            console.error(`Error in getNormalizedDataAsIndexedRecords controller: ${error}`);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving indexed records'
            });
        }
    }
}
