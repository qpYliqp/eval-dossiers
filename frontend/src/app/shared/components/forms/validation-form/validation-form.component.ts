import { Component, Input, Output, EventEmitter, Renderer2,Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NoScrollComponent } from '../../no-scroll/no-scroll.component';
import { CommonModule } from '@angular/common';


interface DynamicButton {
  label: string;
  action: () => void;
}

@Component({
  selector: 'validation-form',
  standalone: true,
  imports: [NoScrollComponent,CommonModule],
  templateUrl: './validation-form.component.html',
  styleUrls:[ './validation-form.component.scss','../form.scss']
})
export class ValidationFormComponent {

@Input() formHeader? : string = "Titre du formulaire de validation"
@Input() submitLabel?: string = "Confirmer";
@Input() cancelLabel?: string = "Annuler";
@Input() buttons: DynamicButton[] = [];
@Output() formSubmit = new EventEmitter<any>();
@Output() formCancel = new EventEmitter<void>();

submitForm()
{
  this.formSubmit.emit();
}

cancelForm()
{
  this.formCancel.emit();
}

executeAction(action: () => void) {
  if (action) {
    action();
  }
}
}

