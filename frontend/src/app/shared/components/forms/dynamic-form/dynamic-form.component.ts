import { Component, EventEmitter, Input, Output,ViewChild  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';


/**
 * Component for creating a dynamic form based on provided configuration.
 */
@Component({
  selector: 'dynamic-form',
  templateUrl: './dynamic-form.component.html',
  imports:[CommonModule,FormsModule ],
  styleUrls: ['./dynamic-form.component.scss','../form.scss']
})
export class DynamicFormComponent {
  @Input() formConfig: any[] = [];
  @Input() formData: any = {};

  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  @Input() formHeader: string = 'Dynamic Form';

  @ViewChild('formRef') formRef!: NgForm;


  submitForm() {
    if (this.formRef.invalid) {
      console.log("Formulaire invalide")
      return; // Ne pas émettre si invalide
    }
    
    // Émettre seulement si le formulaire est valide
    this.formSubmit.emit(this.formData);
  }
  cancelForm() {
    this.formCancel.emit();
  }
}