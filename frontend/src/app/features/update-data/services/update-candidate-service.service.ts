import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { Student } from '../../../core/models/Student';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UpdateCandidateServiceService {
  private candidateSubject = new BehaviorSubject<Student | null>(null);
  candidate$ = this.candidateSubject.asObservable();

  private baseUrl = "http://localhost:3000/api/monmaster-normalization/candidates/";
  private candidatesApiUrl = "http://localhost:3000/api/candidates";

  constructor(private http: HttpClient) { }

  getCandidateById(candidateId: number): Observable<any> {
    return this.http.get<any>(this.baseUrl + candidateId).pipe(
      tap(response => this.candidateSubject.next(response.data)),
      catchError(this.handleError)
    );
  }

  updateFirstName(candidateId: number, firstName: string): Observable<any> {
    const url = `${this.candidatesApiUrl}/${candidateId}/first-name`;
    return this.http.put<any>(url, { firstName }).pipe(
      catchError(this.handleError)
    );
  }

  updateLastName(candidateId: number, lastName: string): Observable<any> {
    const url = `${this.candidatesApiUrl}/update-last-name`;
    return this.http.put<any>(url, { candidateId, lastName }).pipe(
      catchError(this.handleError)
    );
  }

  updateAcademicRecord(recordId: number, gradeSemester1: number | null, gradeSemester2: number | null): Observable<any> {
    const url = `${this.candidatesApiUrl}/academic-records/update`;
    return this.http.put<any>(url, { recordId, gradeSemester1, gradeSemester2 }).pipe(
      catchError(this.handleError)
    );
  }

  updateCandidateScore(scoreId: number, scoreValue: string): Observable<any> {
    const url = `${this.candidatesApiUrl}/candidate-scores/update`;
    return this.http.put<any>(url, { scoreId, scoreValue }).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(url: string, requestBody: any): Observable<T> {
    return this.http.put<T>(url, requestBody).pipe(
      catchError(this.handleError)
    );
  }

  setCandidate(candidate: Student | null): void {
    this.candidateSubject.next(candidate);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }
}
