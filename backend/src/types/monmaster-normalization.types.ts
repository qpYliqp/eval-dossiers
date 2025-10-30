/**
 * @swagger
 * components:
 *   schemas:
 *     NormalizedCandidate:
 *       type: object
 *       properties:
 *         candidateId:
 *           type: integer
 *           description: Unique ID for the candidate
 *         monmasterFileId:
 *           type: integer
 *           description: ID of the MonMaster file the candidate was extracted from
 *         lastName:
 *           type: string
 *           description: Last name of the candidate
 *         firstName:
 *           type: string
 *           description: First name of the candidate
 *         fullName:
 *           type: string
 *           description: Full name of the candidate in the format 'lastName firstName'
 *         candidateNumber:
 *           type: string
 *           description: Candidate identification number
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Date of birth (stored as string in dd/mm/yyyy format)
 *         processedDate:
 *           type: string
 *           format: date-time
 *           description: Date and time when the data was processed
 *
 *     AcademicRecord:
 *       type: object
 *       properties:
 *         recordId:
 *           type: integer
 *           description: Unique ID for the academic record
 *         candidateId:
 *           type: integer
 *           description: ID of the candidate this record belongs to
 *         academicYear:
 *           type: string
 *           description: Academic year (e.g., "2023-2024")
 *         programType:
 *           type: string
 *           description: Type of program or degree
 *         curriculumYear:
 *           type: string
 *           description: Year in the curriculum
 *         specialization:
 *           type: string
 *           description: Specialization or major
 *         coursePath:
 *           type: string
 *           description: Course path or track
 *         gradeSemester1:
 *           type: number
 *           format: float
 *           description: Grade for the first semester
 *         gradeSemester2:
 *           type: number
 *           format: float
 *           description: Grade for the second semester
 *         institution:
 *           type: string
 *           description: Institution name
 *
 *     CandidateScore:
 *       type: object
 *       properties:
 *         scoreId:
 *           type: integer
 *           description: Unique ID for the score
 *         candidateId:
 *           type: integer
 *           description: ID of the candidate this score belongs to
 *         scoreLabel:
 *           type: string
 *           description: Label or name of the score
 *         scoreValue:
 *           type: string
 *           description: Value of the score (stored as a string for flexibility)
 *
 *     MonMasterNormalizationResult:
 *       type: object
 *       properties:
 *         candidates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NormalizedCandidate'
 *         academicRecords:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AcademicRecord'
 *         candidateScores:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CandidateScore'
 *
 *     MonMasterNormalizationError:
 *       type: string
 *       enum:
 *         - ALREADY_NORMALIZED
 *         - FILE_NOT_FOUND
 *         - INVALID_FILE_TYPE
 *         - PROCESSING_ERROR
 *         - MISSING_REQUIRED_COLUMNS
 *
 *     IndexedMonMasterField:
 *       type: object
 *       properties:
 *         index:
 *           type: integer
 *           description: Numerical index of the field for mapping purposes
 *         name:
 *           type: string
 *           description: Field name/identifier
 *         type:
 *           type: string
 *           enum: [string, number, date]
 *           description: Data type of the field
 *         description:
 *           type: string
 *           description: Human-readable description of the field
 *         category:
 *           type: string
 *           enum: [candidate, academic, score]
 *           description: The category this field belongs to
 *
 *     AvailableMonMasterFields:
 *       type: object
 *       properties:
 *         fileId:
 *           type: integer
 *           description: ID of the MonMaster file
 *         fields:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IndexedMonMasterField'
 */

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

export interface CandidateScore {
    scoreId?: number;
    candidateId: number;
    scoreLabel: string;
    scoreValue: string;
}

export interface MonMasterNormalizationResult {
    candidates: NormalizedCandidate[];
    academicRecords: AcademicRecord[];
    candidateScores: CandidateScore[];
}

export interface ProcessMonMasterResult {
    fileId: number;
    normalizedData: MonMasterNormalizationResult;
}

export enum MonMasterNormalizationError {
    ALREADY_NORMALIZED = 'This MonMaster file has already been normalized',
    FILE_NOT_FOUND = 'MonMaster file not found',
    INVALID_FILE_TYPE = 'Invalid file type. Only Excel files are supported',
    PROCESSING_ERROR = 'Error processing MonMaster file',
    MISSING_REQUIRED_COLUMNS = 'Missing required columns in the MonMaster file'
}

export interface IndexedMonMasterField {
    index: number;
    name: string;
    type: 'string' | 'number' | 'date';
    description: string;
    category: 'candidate' | 'academic' | 'score';
}

export interface AvailableMonMasterFields {
    fileId: number;
    fields: IndexedMonMasterField[];
}

// Header mapping constants for normalization process
export const HEADER_MAPPING = {
    "Nom de naissance": "lastName",
    "Prénom": "firstName",
    "Numéro de candidat": "candidateNumber",
    "Date de naissance": "dateOfBirth",
    "Année universitaire": "academicYear",
    "Type de formation ou de diplôme préparé": "programType",
    "Année dans le cursus": "curriculumYear",
    "Mention ou spécialité": "specialization",
    "Parcours": "coursePath",
    "Moyenne au premier semestre": "gradeSemester1",
    "Moyenne au second semestre": "gradeSemester2",
    "Établissement": "institution"
};

// Keywords for detecting score columns
export const MOYENNE_KEYWORDS = [
    "moyenne",
    "note",
    "score"
];

// Patterns to exclude when identifying score columns
export const EXCLUDED_REGEXES = [
    /^Moyenne au premier semestre(_\d+)?$/,  // Ex: "Moyenne au premier semestre", "_1", "_2" etc.
    /^Moyenne au second semestre(_\d+)?$/,   // Ex: "Moyenne au second semestre", "_1", "_2" etc.
    /^Relevés de notes$/
];
