import { User } from '../../../core/models/user.model';

export class MasterProgram {
    masterId: number;
    masterName: string;
    academicUnit: string;
    createdDate: Date;
    lastUpdated: Date;
    createdBy: User;
    examiners: User[];

    constructor(masterId: number, masterName: string, academicUnit: string, createdDate: Date, lastUpdated: Date, createdBy: User, examiners: User[]) {
        this.masterId = masterId;
        this.masterName = masterName;
        this.academicUnit = academicUnit;
        this.createdDate = createdDate;
        this.lastUpdated = lastUpdated;
        this.createdBy = createdBy;
        this.examiners = examiners;
    }
}
