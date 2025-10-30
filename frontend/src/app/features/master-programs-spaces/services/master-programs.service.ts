import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MasterProgram } from '../models/master-program.model';

export interface CreateMasterProgramDto {
  masterName: string;
  academicUnit: string;
}

@Injectable({
  providedIn: 'root'
})
export class MasterProgramsService {

  private baseUrl = 'http://localhost:3000/api/master-programs';

  private masterProgramsSubject = new BehaviorSubject<MasterProgram[]>([]);
  public masterPrograms$: Observable<MasterProgram[]> = this.masterProgramsSubject.asObservable();

  constructor(private http: HttpClient) { }

  createMasterProgram(dto: CreateMasterProgramDto): Observable<MasterProgram> {
    return this.http.post<{ message: string; space: MasterProgram }>(`${this.baseUrl}`, dto).pipe(
      map(res => res.space),
      tap(newProgram => {
        const current = this.masterProgramsSubject.value;
        this.masterProgramsSubject.next([...current, newProgram]);
      })
    );
  }

  deleteMasterProgram(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const updated = this.masterProgramsSubject.value.filter(mp => mp.masterId !== id);
        this.masterProgramsSubject.next(updated);
      })
    );
  }

  getMasterPrograms(): Observable<MasterProgram[]> {
    return this.http.get<MasterProgram[]>(`${this.baseUrl}`).pipe(
      tap(programs => this.masterProgramsSubject.next(programs))
    );
  }

  getMasterProgramById(id: number): Observable<MasterProgram> {
    return this.http.get<MasterProgram>(`${this.baseUrl}/${id}`);
  }

  updateMasterProgram(id: number, dto: CreateMasterProgramDto): Observable<MasterProgram> {
    return this.http.put<{ message: string; updatedSpace: MasterProgram }>(
      `${this.baseUrl}/${id}`,
      { name: dto.masterName, academicUnit: dto.academicUnit }
    ).pipe(
      map(res => res.updatedSpace),
      tap(updatedProgram => {
        const currentPrograms = this.masterProgramsSubject.value;
        const programIndex = currentPrograms.findIndex(program => program.masterId === id);

        if (programIndex !== -1) {
          // Replace the old program with the updated one
          const updatedPrograms = [...currentPrograms];
          updatedPrograms[programIndex] = updatedProgram;
          this.masterProgramsSubject.next(updatedPrograms);
        }
      })
    );
  }
}
