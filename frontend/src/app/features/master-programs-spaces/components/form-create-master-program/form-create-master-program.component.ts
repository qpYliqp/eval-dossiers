import { Component, Inject, Renderer2, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DOCUMENT,CommonModule } from '@angular/common';
import { DynamicFormComponent } from '../../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { CreateMasterProgramDto } from '../../services/master-programs.service';
import { NoScrollComponent } from '../../../../shared/components/no-scroll/no-scroll.component';


@Component({
  selector: 'form-create-master-program',
  standalone: true,
  imports: [DynamicFormComponent,CommonModule,NoScrollComponent],
  templateUrl: './form-create-master-program.component.html',
  styleUrl: './form-create-master-program.component.scss'
})
export class FormCreateMasterProgramComponent {
  @Output() formCancel = new EventEmitter<void>();
  @Output() formSubmit = new EventEmitter<{masterName: string; academicUnit: string}>();

  @Input() masterToModify? : CreateMasterProgramDto;
  

  masterFormConfig = [
    { id: 'masterName', name: 'masterName',placeholder: 'e.g., Master Informatique', label: 'Nom du master', type: 'text', required: true },
    { id: 'academicUnit', name: 'academicUnit',placeholder: 'e.g., UF Informatique', label: 'Unité académique', type: 'text', required: true },
    // { id: 'descriptionProjet', name: 'description_projet', label: 'Description', type: 'textarea', required: true },
    // { id: 'dateDebut', name: 'date_debut', label: 'Date de début', type: 'date', required: true },
    // {
    //   id: 'status', name: 'status', label: 'status', type: 'select', required: true,
    //   options: [
    //     { value: "test", label: "test" },
    //     { value: "test1", label: "test1" },
    //     { value: "test2", label: "test2" },
    //   ],
    // },
 
  ];

 
  newMaster: CreateMasterProgramDto = {masterName: '',academicUnit:''}

  ngOnInit(): void {
    if (this.masterToModify) {
      this.newMaster = { ...this.masterToModify };
    }
  }

  submitCreation(formData: CreateMasterProgramDto): void {
    this.newMaster = formData; // Mettre à jour newMaster avec les données du formulaire
    console.log("Program is created", this.newMaster);
    this.formSubmit.emit(this.newMaster);
  }

  cancelCreation(): void {
    console.log("Creation/Modification of program canceled")
    this.formCancel.emit();
  }
}
