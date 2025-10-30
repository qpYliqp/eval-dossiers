import { Request, Response } from 'express';
import { GradeComparisonService } from '../services/grade-comparison.service';

export class GradeComparisonController {
    private service = new GradeComparisonService();

    /**
     * Process grade comparisons for all matches between a MonMaster file and a PV file
     * @param req Express request with monmasterFileId and pvFileId in query parameters
     * @param res Express response
     */
    async processFileComparisons(req: Request, res: Response) {
        try {
            const monmasterFileId = parseInt(req.query.monmasterFileId as string);
            const pvFileId = parseInt(req.query.pvFileId as string);

            if (isNaN(monmasterFileId) || isNaN(pvFileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file IDs. Both monmasterFileId and pvFileId must be numbers.'
                });
            }

            const result = await this.service.processFileComparisons(monmasterFileId, pvFileId);

            if (result) {
                return res.status(200).json({
                    success: true,
                    message: `Successfully processed comparisons between MonMaster file ${monmasterFileId} and PV file ${pvFileId}`
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process comparisons'
                });
            }
        } catch (error) {
            console.error('Error processing file comparisons:', error);
            return res.status(500).json({
                success: false,
                message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    /**
     * Process grade comparisons for all files in a master program
     * @param req Express request with masterId in params
     * @param res Express response
     */
    async processMasterProgramComparisons(req: Request, res: Response) {
        try {
            const masterId = parseInt(req.params.masterId);

            if (isNaN(masterId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid master program ID'
                });
            }

            const result = await this.service.processMasterProgramComparisons(masterId);

            return res.status(result.success ? 200 : 404).json(result);
        } catch (error) {
            console.error('Error processing master program comparisons:', error);
            return res.status(500).json({
                success: false,
                message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    /**
     * Get a comparison report for a specific match
     * @param req Express request with matchId in params
     * @param res Express response
     */
    async getComparisonReport(req: Request, res: Response) {
        try {
            const matchId = parseInt(req.params.matchId);

            if (isNaN(matchId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid match ID'
                });
            }

            const report = await this.service.getComparisonReport(matchId);

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Comparison report not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Error retrieving comparison report:', error);
            return res.status(500).json({
                success: false,
                message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    /**
     * Get all comparison reports for a MonMaster file and PV file pair
     * @param req Express request with monmasterFileId and pvFileId in query
     * @param res Express response
     */
    async getComparisonReports(req: Request, res: Response) {
        try {
            const monmasterFileId = parseInt(req.query.monmasterFileId as string);
            const pvFileId = parseInt(req.query.pvFileId as string);

            if (isNaN(monmasterFileId) || isNaN(pvFileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file IDs. Both monmasterFileId and pvFileId must be numbers.'
                });
            }

            const reports = await this.service.getComparisonReports(monmasterFileId, pvFileId);

            return res.status(200).json({
                success: true,
                data: {
                    count: reports.length,
                    reports
                }
            });
        } catch (error) {
            console.error('Error retrieving comparison reports:', error);
            return res.status(500).json({
                success: false,
                message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    /**
     * Get all candidate matches for a MonMaster file and PV file pair
     * @param req Express request with monmasterFileId and pvFileId in query
     * @param res Express response
     */
    async getCandidateMatches(req: Request, res: Response) {
        try {
            const monmasterFileId = parseInt(req.query.monmasterFileId as string);
            const pvFileId = parseInt(req.query.pvFileId as string);

            if (isNaN(monmasterFileId) || isNaN(pvFileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file IDs. Both monmasterFileId and pvFileId must be numbers.'
                });
            }

            const matches = await this.service.getCandidateMatches(monmasterFileId, pvFileId);

            return res.status(200).json({
                success: true,
                data: {
                    count: matches.length,
                    matches
                }
            });
        } catch (error) {
            console.error('Error retrieving candidate matches:', error);
            return res.status(500).json({
                success: false,
                message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    /**
     * Get all comparison reports for a master program
     * @param req Express request with masterId in params
     * @param res Express response
     */
    async getComparisonReportsByMasterId(req: Request, res: Response) {
        try {
            const masterId = parseInt(req.params.masterId);

            if (isNaN(masterId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid master program ID'
                });
            }

            const reports = await this.service.getComparisonReportsByMasterId(masterId);

            return res.status(200).json({
                success: true,
                data: {
                    count: reports.length,
                    reports
                }
            });
        } catch (error) {
            console.error('Error retrieving comparison reports by master ID:', error);
            return res.status(500).json({
                success: false,
                message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    /**
     * Delete a comparison and all its related data
     * @param req Express request with matchId in params
     * @param res Express response
     */
    async deleteComparison(req: Request, res: Response) {
        try {
            const matchId = parseInt(req.params.matchId);

            if (isNaN(matchId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid match ID'
                });
            }

            const deleted = await this.service.deleteComparison(matchId);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Comparison not found or already deleted'
                });
            }

            return res.status(200).json({
                success: true,
                message: `Successfully deleted comparison with ID ${matchId}`
            });
        } catch (error) {
            console.error('Error deleting comparison:', error);
            return res.status(500).json({
                success: false,
                message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }


    /**
     * Get all comparison reports for a specific candidate across all PV files
     * @param req Express request with candidateId in params
     * @param res Express response
     */
    async getReportsByCandidateId(req: Request, res: Response) {
        try {
            const candidateId = parseInt(req.params.candidateId);

            if (isNaN(candidateId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid candidate ID'
                });
            }

            const reports = await this.service.getComparisonReportsByCandidateId(candidateId);

            return res.status(200).json({
                success: true,
                data: {
                    candidateId,
                    reportCount: reports.length,
                    reports
                }
            });
        } catch (error) {
            console.error('Error retrieving comparison reports by candidate ID:', error);
            return res.status(500).json({
                success: false,
                message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }

    /**
     * Get structured student data for table rendering
     * @param req Express request with masterId in params
     * @param res Express response
     */
    async getStudentTableData(req: Request, res: Response) {
        try {
            const masterId = parseInt(req.params.masterId);

            if (isNaN(masterId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Master Program ID'
                });
            }

            const { columns, students } = await this.service.getStudentTableData(masterId);

            return res.status(200).json({
                success: true,
                data: {
                    columns,
                    count: students.length,
                    students
                }
            });
        } catch (error) {
            console.error('Error retrieving student table data:', error);
            return res.status(500).json({
                success: false,
                message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }
}
