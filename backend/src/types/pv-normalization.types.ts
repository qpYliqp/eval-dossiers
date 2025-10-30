export interface NormalizedStudentData {
    studentDataId?: number;
    name: string;
    dateOfBirth: string;
    studentNumber: string;
    semesterResults: SemesterResult[];
}

export interface SemesterResult {
    semesterName: string;
    grade: number;
}

export interface NormalizationResult {
    success: boolean;
    data?: NormalizedStudentData[];
    errorMessage?: string;
}

export interface PvNormalizerPlugin {
    universityName: string;
    canNormalize(xmlContent: string): boolean;
    normalize(xmlContent: string): Promise<NormalizationResult>;
}

export enum NormalizationError {
    INVALID_XML = 'Invalid XML structure',
    MISSING_REQUIRED_FIELDS = 'Missing required student fields',
    UNSUPPORTED_FORMAT = 'Unsupported PV file format',
    PARSING_ERROR = 'Error parsing the PV file',
    ALREADY_NORMALIZED = 'The PV file has already been normalized'
}

export interface ProcessPvResult {
    fileId: number;
    normalizedData: NormalizedStudentData[];
}

export interface IndexedPvField {
    index: number;
    name: string;
    type: 'string' | 'number' | 'date';
    description: string;
}

export interface AvailablePvFields {
    fileId: number;
    fields: IndexedPvField[];
}
