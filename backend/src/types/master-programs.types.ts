/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         mailAdress:
 *           type: string
 *         role:
 *           type: string
 *       required:
 *         - id
 *         - firstName
 *         - lastName
 *         - mailAdress
 *         - role
 *
 *     MasterProgram:
 *       type: object
 *       properties:
 *         masterId:
 *           type: integer
 *         masterName:
 *           type: string
 *         academicUnit:
 *           type: string
 *         createdDate:
 *           type: string
 *           format: date-time
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           $ref: '#/components/schemas/User'
 *         examiners:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *       required:
 *         - masterId
 *         - masterName
 *         - academicUnit
 *
 *     MasterProgramUpdateDto:
 *       type: object
 *       properties:
 *         masterName:
 *           type: string
 *         academicUnit:
 *           type: string
 *       required:
 *         - masterName
 *         - academicUnit
 *
 *     MasterProgramCreateDto:
 *       type: object
 *       properties:
 *         masterName:
 *           type: string
 *         academicUnit:
 *           type: string
 *         createdBy:
 *           type: integer
 *       required:
 *         - masterName
 *         - academicUnit
 *         - createdBy
 */
export interface User {
    id: number;
    firstName: string;
    lastName: string;
    mailAdress: string;
    role: string;
}

export interface MasterProgram {
    masterId: number;
    masterName: string;
    academicUnit: string;
    createdDate: Date;
    lastUpdated: Date;
    createdBy: User;
    examiners: User[];
}

export interface MasterProgramUpdateDto {
    masterName: string;
    academicUnit: string;
}

export interface MasterProgramCreateDto {
    masterName: string;
    academicUnit: string;
    createdBy: number;
}
