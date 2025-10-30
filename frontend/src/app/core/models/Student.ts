import { AcademicRecord } from "./AcademicRecord";
import { CandidateScore } from "./CandidateScore";
import { NormalizedCandidate } from "./NormalizedCandidate";

export interface Student
{
    candidate: NormalizedCandidate;
    academicRecords: AcademicRecord[];
    scores: CandidateScore[];
}

