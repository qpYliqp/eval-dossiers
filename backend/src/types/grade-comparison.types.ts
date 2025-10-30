/**
 * @swagger
 * components:
 *   schemas:
 *     CandidateMatch:
 *       type: object
 *       properties:
 *         matchId:
 *           type: integer
 *           description: Unique ID for the candidate match
 *         monmasterFileId:
 *           type: integer
 *           description: ID of the MonMaster file
 *         pvFileId:
 *           type: integer
 *           description: ID of the PV file
 *         monmasterCandidateId:
 *           type: integer
 *           description: ID of the MonMaster candidate
 *         pvStudentDataId:
 *           type: integer
 *           description: ID of the PV student data
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the match was created
 *       required:
 *         - monmasterFileId
 *         - pvFileId
 *         - monmasterCandidateId
 *         - pvStudentDataId
 *
 *     VerificationStatus:
 *       type: string
 *       enum: [fully_verified, partially_verified, fraud, cannot_verify]
 *       description: Status of the verification
 *
 *     ComparisonResult:
 *       type: object
 *       properties:
 *         resultId:
 *           type: integer
 *           description: Unique ID for the comparison result
 *         matchId:
 *           type: integer
 *           description: ID of the candidate match
 *         fieldName:
 *           type: string
 *           description: Name of the compared field
 *         monmasterValue:
 *           type: string
 *           description: Value from the MonMaster source
 *         pvValue:
 *           type: string
 *           description: Value from the PV source
 *         similarityScore:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *           description: Similarity score between the two values (0-1)
 *         verificationStatus:
 *           $ref: '#/components/schemas/VerificationStatus'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the comparison was created
 *       required:
 *         - matchId
 *         - fieldName
 *         - similarityScore
 *         - verificationStatus
 *
 *     ComparisonSummary:
 *       type: object
 *       properties:
 *         summaryId:
 *           type: integer
 *           description: Unique ID for the comparison summary
 *         matchId:
 *           type: integer
 *           description: ID of the candidate match
 *         averageSimilarity:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *           description: Average similarity score across all fields (0-1)
 *         overallVerificationStatus:
 *           $ref: '#/components/schemas/VerificationStatus'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the summary was created
 *       required:
 *         - matchId
 *         - averageSimilarity
 *         - overallVerificationStatus
 *
 *     ComparisonReport:
 *       type: object
 *       properties:
 *         candidate:
 *           type: object
 *           properties:
 *             monmasterCandidateId:
 *               type: integer
 *             pvStudentDataId:
 *               type: integer
 *             fullName:
 *               type: string
 *             dateOfBirth:
 *               type: string
 *         monmasterFileId:
 *           type: integer
 *         pvFileId:
 *           type: integer
 *         averageSimilarity:
 *           type: number
 *           format: float
 *         overallVerificationStatus:
 *           $ref: '#/components/schemas/VerificationStatus'
 *         fields:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               fieldName:
 *                 type: string
 *               monmasterValue:
 *                 type: string
 *               pvValue:
 *                 type: string
 *               similarityScore:
 *                 type: number
 *                 format: float
 *               verificationStatus:
 *                 $ref: '#/components/schemas/VerificationStatus'
 *       
 *     StudentTableData:
 *       type: object
 *       properties:
 *         candidateId:
 *           type: integer
 *           description: ID of the MonMaster candidate
 *         fullName:
 *           type: string
 *           description: Full name of the student
 *         dateOfBirth:
 *           type: string
 *           description: Date of birth of the student
 *         candidateNumber:
 *           type: string
 *           description: Candidate identification number
 *         latestInstitution:
 *           type: string
 *           description: Institution from the most recent academic record
 *         scores:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Dynamic scores for the student
 *         verificationStatus:
 *           $ref: '#/components/schemas/VerificationStatus'
 *           description: Overall verification status for the student
 */

export interface CandidateMatch {
    matchId?: number;
    monmasterFileId: number;
    pvFileId: number;
    monmasterCandidateId: number;
    pvStudentDataId: number;
    createdAt?: Date;
}

export enum VerificationStatus {
    FULLY_VERIFIED = 'fully_verified',
    PARTIALLY_VERIFIED = 'partially_verified',
    FRAUD = 'fraud',
    CANNOT_VERIFY = 'cannot_verify'
}

export interface ComparisonResult {
    resultId?: number;
    matchId: number;
    fieldName: string;
    monmasterValue?: string;
    pvValue?: string;
    similarityScore: number;
    verificationStatus: VerificationStatus;
    createdAt?: Date;
}

export interface ComparisonSummary {
    summaryId?: number;
    matchId: number;
    averageSimilarity: number;
    overallVerificationStatus: VerificationStatus;
    createdAt?: Date;
}

export interface FieldComparison {
    fieldName: string;
    monmasterValue?: string;
    pvValue?: string;
    similarityScore: number;
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
    averageSimilarity: number;
    overallVerificationStatus: VerificationStatus;
    fields: FieldComparison[];
}

export interface CandidateMatchingResult {
    monmasterFileId: number;
    pvFileId: number;
    matches: Array<{
        monmasterCandidateId: number;
        pvStudentDataId: number;
        score: number;
    }>;
}

export interface StudentTableData {
    candidateId: number;
    fullName: string;
    dateOfBirth: string;
    candidateNumber: string;
    latestInstitution: string;
    scores: {
        [scoreLabel: string]: string;
    };
    verificationStatus: VerificationStatus | null;
}

