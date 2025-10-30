import express from 'express';
import { GradeComparisonController } from '../controllers/grade-comparison.controller';

const router = express.Router();
const controller = new GradeComparisonController();

/**
 * @swagger
 * /api/grade-comparison/file-comparisons:
 *   post:
 *     summary: Process grade comparisons for all matches between a MonMaster file and a PV file
 *     tags: [Grade Comparison]
 *     parameters:
 *       - in: query
 *         name: monmasterFileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the MonMaster file
 *       - in: query
 *         name: pvFileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the PV file
 *     responses:
 *       200:
 *         description: Comparisons processed successfully
 *       400:
 *         description: Invalid file IDs
 *       500:
 *         description: Server error
 */
router.post('/file-comparisons', async (req, res) => {
    try {
        await controller.processFileComparisons(req, res);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/grade-comparison/master-program/{masterId}/comparisons:
 *   post:
 *     summary: Process grade comparisons for all files in a master program
 *     tags: [Grade Comparison]
 *     parameters:
 *       - in: path
 *         name: masterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the master program
 *     responses:
 *       200:
 *         description: Comparisons processed successfully
 *       400:
 *         description: Invalid master program ID
 *       404:
 *         description: No files found for this master program
 *       500:
 *         description: Server error
 */
router.post('/master-program/:masterId/comparisons', async (req, res) => {
    try {
        await controller.processMasterProgramComparisons(req, res);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/grade-comparison/reports/{matchId}:
 *   get:
 *     summary: Get a comparison report for a specific match
 *     tags: [Grade Comparison]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the candidate match
 *     responses:
 *       200:
 *         description: Comparison report retrieved successfully
 *       400:
 *         description: Invalid match ID
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.get('/reports/:matchId', async (req, res) => {
    try {
        await controller.getComparisonReport(req, res);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/grade-comparison/reports:
 *   get:
 *     summary: Get all comparison reports for a MonMaster file and PV file pair
 *     tags: [Grade Comparison]
 *     parameters:
 *       - in: query
 *         name: monmasterFileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the MonMaster file
 *       - in: query
 *         name: pvFileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the PV file
 *     responses:
 *       200:
 *         description: Comparison reports retrieved successfully
 *       400:
 *         description: Invalid file IDs
 *       500:
 *         description: Server error
 */
router.get('/reports', async (req, res) => {
    try {
        await controller.getComparisonReports(req, res);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/grade-comparison/master/{masterId}/reports:
 *   get:
 *     summary: Get all comparison reports for a master program
 *     tags: [Grade Comparison]
 *     parameters:
 *       - in: path
 *         name: masterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the master program
 *     responses:
 *       200:
 *         description: Comparison reports retrieved successfully
 *       400:
 *         description: Invalid master program ID
 *       500:
 *         description: Server error
 */
router.get('/master/:masterId/reports', async (req, res) => {
    try {
        await controller.getComparisonReportsByMasterId(req, res);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/grade-comparison/matches:
 *   get:
 *     summary: Get all candidate matches for a MonMaster file and PV file pair
 *     tags: [Grade Comparison]
 *     parameters:
 *       - in: query
 *         name: monmasterFileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the MonMaster file
 *       - in: query
 *         name: pvFileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the PV file
 *     responses:
 *       200:
 *         description: Candidate matches retrieved successfully
 *       400:
 *         description: Invalid file IDs
 *       500:
 *         description: Server error
 */
router.get('/matches', async (req, res) => {
    try {
        await controller.getCandidateMatches(req, res);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/grade-comparison/reports/{matchId}:
 *   delete:
 *     summary: Delete a comparison and all its related data
 *     tags: [Grade Comparison]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the candidate match
 *     responses:
 *       200:
 *         description: Comparison deleted successfully
 *       400:
 *         description: Invalid match ID
 *       404:
 *         description: Comparison not found
 *       500:
 *         description: Server error
 */
router.delete('/reports/:matchId', async (req, res) => {
    try {
        await controller.deleteComparison(req, res);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/grade-comparison/candidate/{candidateId}/reports:
 *   get:
 *     summary: Get all comparison reports for a specific candidate across all PV files
 *     tags: [Grade Comparison]
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the MonMaster candidate
 *     responses:
 *       200:
 *         description: Comparison reports retrieved successfully
 *       400:
 *         description: Invalid candidate ID
 *       500:
 *         description: Server error
 */
router.get('/candidate/:candidateId/reports', async (req, res) => {
    try {
        await controller.getReportsByCandidateId(req, res);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/grade-comparison/student-table/master/{masterId}:
 *   get:
 *     summary: Get structured student data for table rendering in the frontend by master program ID
 *     tags: [Grade Comparison]
 *     parameters:
 *       - in: path
 *         name: masterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the master program
 *     responses:
 *       200:
 *         description: Student table data retrieved successfully
 *       400:
 *         description: Invalid master program ID
 *       500:
 *         description: Server error
 */
router.get('/student-table/master/:masterId', async (req, res) => {
    try {
        await controller.getStudentTableData(req, res);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
