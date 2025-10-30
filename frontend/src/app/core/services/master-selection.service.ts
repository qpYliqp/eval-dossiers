import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MasterSelectionService {
    private selectedMasterIdSubject = new BehaviorSubject<number | null>(null);
    public selectedMasterId$ = this.selectedMasterIdSubject.asObservable();

    constructor() { }

    setSelectedMaster(masterId: number): void {
        this.selectedMasterIdSubject.next(masterId);
    }

    clearSelectedMaster(): void {
        this.selectedMasterIdSubject.next(null);
    }
}
