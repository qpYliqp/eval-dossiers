import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, CandidateReportsResponse, StudentTableResponse } from '../models/validation-candidates.model';

// Importing necessary types matching backend types
@Injectable({
    providedIn: 'root'
})
export class ValidationCandidatesService {
    private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    /**
     * Get student table data for a master program
     * @param masterId The ID of the master program
     * @returns Observable with the student table data
     */
    getStudentTableData(masterId: number): Observable<ApiResponse<StudentTableResponse>> {
        return this.http.get<ApiResponse<StudentTableResponse>>(
            `${this.apiUrl}/grade-comparison/student-table/master/${masterId}`
        );
    }

    /**
     * Start the validation process for a master program
     * @param masterId The ID of the master program
     * @returns Observable with the validation results
     */
    startValidationProcess(masterId: number): Observable<any> {
        return this.http.post<any>(
            `${this.apiUrl}/grade-comparison/master-program/${masterId}/comparisons`,
            {}
        );
    }

    /**
     * Get comparison reports for a specific candidate
     * @param candidateId The ID of the candidate
     * @returns Observable with the comparison reports
     */
    getCandidateReports(candidateId: number): Observable<ApiResponse<CandidateReportsResponse>> {
        return this.http.get<ApiResponse<CandidateReportsResponse>>(
            `${this.apiUrl}/grade-comparison/candidate/${candidateId}/reports`
        );
    }
}
