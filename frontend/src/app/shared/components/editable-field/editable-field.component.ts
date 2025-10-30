import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InfoItem } from '../../../features/update-data/components/update-data/update-data.component';

@Component({
  selector: 'app-editable-field',
  templateUrl: './editable-field.component.html',
  styleUrls: ['./editable-field.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class EditableFieldComponent {
  @Input() label: string = '';
  @Input() value: string = '';
  @Input() infoItem!: InfoItem;
  @Output() valueChange = new EventEmitter<string>();

  isEditing = false;
  tempValue = '';

  @ViewChild('editInput') editInput!: ElementRef<HTMLInputElement>;

  ngOnInit() {
    this.tempValue = this.value;
  }

  startEditing(): void {
    this.isEditing = true;
    setTimeout(() => {
      this.editInput?.nativeElement?.focus();
    }, 0);
  }

  saveChanges(): void {
    this.isEditing = false;
    this.value = this.tempValue;
    this.valueChange.emit(this.value);
    
    if (this.infoItem.onEditing) {
      this.infoItem.onEditing(this.tempValue); // Passer la nouvelle valeur
    }
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.tempValue = this.value;
  }
}
