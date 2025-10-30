/**
 * @swagger
 * components:
 *   schemas:
 *     Candidate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier of the candidate
 *           example: '12345'
 *         firstName:
 *           type: string
 *           description: First name of the candidate
 *           example: 'John'
 *         lastName:
 *           type: string
 *           description: Last name of the candidate
 *           example: 'Smith'
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Date of birth of the candidate (YYYY-MM-DD format)
 *           example: '1990-01-15'
 *       required:
 *         - id
 *         - firstName
 *         - lastName
 *     
 *     MatchResult:
 *       type: object
 *       properties:
 *         source:
 *           $ref: '#/components/schemas/MatchCandidate'
 *         target:
 *           $ref: '#/components/schemas/MatchCandidate'
 *         score:
 *           type: number
 *           description: Global matching score between 0 and 1
 *           minimum: 0
 *           maximum: 1
 *           example: 0.85
 *         nameScore:
 *           type: number
 *           description: Name matching score between 0 and 1
 *           minimum: 0
 *           maximum: 1
 *           example: 0.9
 *         dateScore:
 *           type: number
 *           description: Date of birth matching score between 0 and 1
 *           minimum: 0
 *           maximum: 1
 *           example: 0.8
 *       required:
 *         - source
 *         - target
 *         - score
 *         - nameScore
 *     
 *     MatchingOptions:
 *       type: object
 *       properties:
 *         threshold:
 *           type: number
 *           description: Minimum threshold to consider a match valid
 *           minimum: 0
 *           maximum: 1
 *           example: 0.7
 *         nameWeight:
 *           type: number
 *           description: Weight of names in the final score calculation
 *           minimum: 0
 *           maximum: 1
 *           example: 0.6
 *         dateWeight:
 *           type: number
 *           description: Weight of date in the final score calculation
 *           minimum: 0
 *           maximum: 1
 *           example: 0.4
 *         fuzzyDateMatching:
 *           type: boolean
 *           description: Enable fuzzy date matching
 *           example: true
 *           default: false
 *       required:
 *         - threshold
 *         - nameWeight
 *         - dateWeight
 *         - fuzzyDateMatching
 */
export interface Candidate {
    id: string | number;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
}

export interface MatchResult {
    source: Candidate;
    target: Candidate;
    score: number; // score de correspondance entre 0 et 1
    nameScore: number; // score pour la correspondance de nom
    dateScore?: number; // score optionnel pour la date de naissance
}

export interface MatchingOptions {
    threshold: number; // seuil minimum pour considérer une correspondance (0-1)
    nameWeight: number; // importance du nom dans le score final (0-1)
    dateWeight: number; // importance de la date dans le score final (0-1)
    fuzzyDateMatching: boolean; // activer la correspondance floue des dates
}