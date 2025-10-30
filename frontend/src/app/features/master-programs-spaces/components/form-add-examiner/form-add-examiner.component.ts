import { Component, Inject, Renderer2, Input, Output, EventEmitter } from '@angular/core';
import { DOCUMENT,CommonModule } from '@angular/common';
import { DynamicFormComponent } from '../../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { CreateMasterProgramDto } from '../../services/master-programs.service';


@Component({
  selector: 'form-add-examiner',
  standalone: true,
  imports: [DynamicFormComponent,CommonModule],
  templateUrl: './form-add-examiner.component.html',
  styleUrl: './form-add-examiner.component.scss'
})
export class FormAddExaminerComponent {
  @Output() formCancel = new EventEmitter<void>();
  @Output() formConfirm = new EventEmitter<{masterName: string; academicUnit: string}>();

  masterFormConfig = [
    //{ id: 'masterName', name: 'masterName',placeholder: 'e.g., Master Informatique', label: 'Nom du master', type: 'text', required: true },
    //{ id: 'academicUnit', name: 'academicUnit',placeholder: 'e.g., UF Informatique', label: 'Unité académique', type: 'text', required: true },
    // { id: 'descriptionProjet', name: 'description_projet', label: 'Description', type: 'textarea', required: true },
    //{ id: 'dateDebut', name: 'date_debut', label: 'Date de début', type: 'date', required: true },
    {
      id: 'status', name: 'status', label: 'Nom et Prénom', type: 'select', required: true,
      options: [
        { value: "test", label: "test" },
        { value: "test1", label: "test1" },
        { value: "test2", label: "test2" },
      ],
    },
 
  ];

  newMaster: CreateMasterProgramDto = {masterName: '',academicUnit:''}

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.renderer.addClass(this.document.body, 'no-scroll'); // Empêche le scroll quand le popup s'affiche
  }

  ngOnDestroy() {
    this.renderer.removeClass(this.document.body, 'no-scroll'); // Rétablit le scroll quand le popup est fermé
  }

  submitCreation(formData: CreateMasterProgramDto): void {
    this.newMaster = formData; // Mettre à jour newMaster avec les données du formulaire
    console.log("Program is created", this.newMaster);
    this.formConfirm.emit(this.newMaster);
  }

  cancelCreation(): void {
    console.log("Creation of program canceled")
    this.formCancel.emit();
  }
}
