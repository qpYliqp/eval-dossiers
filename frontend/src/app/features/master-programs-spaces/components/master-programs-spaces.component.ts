import { Component, OnInit } from '@angular/core';
import { LargeButtonComponent } from '../../../shared/components/buttons/large-button/large-button.component';
import { MasterProgramCardComponent } from '../../../shared/components/cards/master-program-card/master-program-card.component';
import { User } from '../../../core/models/user.model';
import { userEntry } from '../../../shared/models/objectListEntries/user-entry/userEntry';
import { ViewingListComponent } from '../../../shared/components/lists/viewing-list/viewing-list.component';
import { ListAction } from '../../../core/interfaces/listAction';
import { CommonModule } from '@angular/common';
import { FormCreateMasterProgramComponent } from './form-create-master-program/form-create-master-program.component';
import { CreateMasterProgramDto } from '../services/master-programs.service';
import { FormAddExaminerComponent } from './form-add-examiner/form-add-examiner.component';
import { MasterProgramsService } from '../services/master-programs.service';
import { MasterProgram } from '../../../features/master-programs-spaces/models/master-program.model';
import { ValidationFormComponent } from '../../../shared/components/forms/validation-form/validation-form.component';
import { Router } from '@angular/router';
import { MasterSelectionService } from '../../../core/services/master-selection.service';

@Component({
  selector: 'app-master-programs-spaces',
  imports: [
    LargeButtonComponent,
    MasterProgramCardComponent, ViewingListComponent, CommonModule,
    FormCreateMasterProgramComponent, FormAddExaminerComponent,
    // Add the validation form component:
    ValidationFormComponent
  ],
  templateUrl: './master-programs-spaces.component.html',
  styleUrl: './master-programs-spaces.component.scss',
})
export class MasterProgramsSpacesComponent implements OnInit {

  users: User[];
  userEntries: userEntry[];
  userColumns = userEntry.getColumns();
  userActions: ListAction<userEntry>[];
  isAddingExaminer: boolean;
  isCreatingMaster: boolean;
  isViewingListVisible: boolean = false;
  masterPrograms: MasterProgram[] = []; // new property for dynamic cards

  // New properties for deletion confirmation
  isDeletingMaster: boolean = false;
  masterToDelete: number | null = null;

  //New properties for modification
  isModifyingMaster: boolean = false;
  masterToModify: number | null = null;
  masterDtoToModify: CreateMasterProgramDto = { masterName: '', academicUnit: '' };

  // Add MasterSelectionService to the constructor
  constructor(private masterProgramsService: MasterProgramsService,
    private router: Router,
    private masterSelectionService: MasterSelectionService) {

    this.isCreatingMaster = false;
    this.isAddingExaminer = false;
    this.isViewingListVisible = false;
    this.users = [
      new User(1, "Alice", "Don", "alice@example.com", "Devops"),
      new User(2, "François", "Hollande", "françois@example.com", "Ministre"),
      new User(3, "Julien", "DaSilva", "julien@example.com", "Stagiaire"),
    ];

    this.userEntries = this.users.map(user => new userEntry(user));
    this.userActions = [
      // {
      //   id: 'examine',
      //   icon: 'assets/icons/modify-icon.svg',
      //   label: 'Examiner',
      //   execute: (entry: userEntry) => {
      //     console.log("examine user : ", entry.getUser().fullName, " id : ", entry.getUser().id)
      //   }
      // },
      {
        id: 'delete',
        icon: 'assets/icons/delete-icon.svg',
        label: 'Supprimer',
        execute: (entry: userEntry) => {
          console.log("delete user : ", entry.getUser().fullName, " id : ", entry.getUser().id)
        }
      }
    ];
  }

  ngOnInit(): void {
    // Clear any previously selected master when entering this component
    this.masterSelectionService.clearSelectedMaster();

    // Subscribe to updates from the BehaviorSubject so new master programs appear automatically
    this.masterProgramsService.masterPrograms$.subscribe({
      next: (programs) => {
        this.masterPrograms = programs;
      }
    });
    // Trigger the initial fetch
    this.masterProgramsService.getMasterPrograms().subscribe({
      error: (error) => {
        console.error("Error fetching master programs:", error);
      }
    });
  }
  navigateToFileUpload(masterId: number): void {
    console.log("Navigating to file upload for master program with ID:", masterId);
    this.masterSelectionService.setSelectedMaster(masterId);
    this.router.navigate(['/master', masterId, 'files']); // Path structure remains the same
  }
  onFileUploaded(file: File) {
    console.log('Fichier sélectionné:', file);
  }

  toggleCreatingMaster() {
    console.log("Toggle creation master pop-up")
    this.isCreatingMaster = !this.isCreatingMaster;
  }
  toggleAddingExaminer() {
    console.log("Toggle creation master pop-up")
    this.isAddingExaminer = !this.isAddingExaminer;
  }
  onExaminerAdded(): void {
    console.log("Données reçues pour l'ajout de l'examinateur: ");
    this.toggleAddingExaminer();
  }
  onMasterCreated(newMaster: CreateMasterProgramDto): void {
    this.masterProgramsService.createMasterProgram(newMaster).subscribe({
      next: (createdMaster) => {
        console.log("Master program created: ", createdMaster);
      },
      error: (error) => {
        console.error("Error creating master program: ", error);
      },
      complete: () => {
        this.toggleCreatingMaster();
      }
    });
  }
  toggleViewingList() {
    this.isViewingListVisible = !this.isViewingListVisible;

  }

  // New method: Request deletion confirmation
  onRequestDeleteMaster(masterId: number): void {
    this.masterToDelete = masterId;
    this.isDeletingMaster = true;
  }

  // New method: Confirm deletion and call service
  confirmDelete(): void {
    if (this.masterToDelete !== null) {
      this.masterProgramsService.deleteMasterProgram(this.masterToDelete).subscribe({
        next: (res) => {
          console.log('Deleted master program:', res.message);
          this.isDeletingMaster = false;
          this.masterToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting master program:', error);
          this.isDeletingMaster = false;
          this.masterToDelete = null;
        }
      });
    }
  }

  // New method: Cancel deletion confirmation
  cancelDelete(): void {
    this.isDeletingMaster = false;
    this.masterToDelete = null;
  }

  onRequestModificationMaster(master: MasterProgram) {
    console.log("modification of a master started")
    this.isModifyingMaster = true;
    this.masterToModify = master.masterId;
    this.masterDtoToModify = { masterName: master.masterName, academicUnit: master.academicUnit };
  }

  confirmModification(newMaster: CreateMasterProgramDto): void {
    if (this.masterToModify !== null) {
      this.masterProgramsService.updateMasterProgram(this.masterToModify, newMaster).subscribe({
        next: (updatedMaster) => {
          console.log('Master program updated successfully:', updatedMaster);
          this.isModifyingMaster = false;
          this.masterToModify = null;
          this.masterDtoToModify = { masterName: '', academicUnit: '' };
        },
        error: (error) => {
          console.error('Error updating master program:', error);
          // Optionally add error handling UI feedback here
        }
      });
    }
  }

  cancelModification() {
    this.isModifyingMaster = false;
    this.masterToModify = null;
    this.masterDtoToModify = { masterName: '', academicUnit: '' };
  }

  // New methods to handle contextual menu options
  navigateToFileSystem(masterId: number): void {
    console.log('Navigating to file system for master program with ID:', masterId);
    this.masterSelectionService.setSelectedMaster(masterId);
    this.router.navigate(['/master', masterId, 'files']);
  }

  navigateToMappingSystem(masterId: number): void {
    console.log('Navigating to mapping system for master program with ID:', masterId);
    this.masterSelectionService.setSelectedMaster(masterId);
    this.router.navigate(['/master', masterId, 'mapping']);
  }

  navigateToDataVerification(masterId: number): void {
    console.log('Navigating to data verification for master program with ID:', masterId);
    this.masterSelectionService.setSelectedMaster(masterId);
    this.router.navigate(['/master', masterId, 'validation']);
  }

  navigateToViewingData(masterId: number): void {
    console.log('Navigating to viewing data for master program with ID:', masterId);
    this.masterSelectionService.setSelectedMaster(masterId);
    this.router.navigate(['/master', masterId, 'viewing']);
  }
}
