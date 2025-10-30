import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CardInfoItemComponent } from "../../cardInfo/card-info-item/card-info-item.component";
import { CommonModule } from '@angular/common';
import { SmallButtonComponent } from "../../buttons/small-button/small-button.component";
import { ContextualMenuButtonComponent, MenuOption } from "../../buttons/contextual-menu-button/contextual-menu-button.component";

@Component({
  selector: 'app-master-program-card',
  imports: [
    CardInfoItemComponent,
    CommonModule,
    SmallButtonComponent,
    ContextualMenuButtonComponent
  ],
  templateUrl: './master-program-card.component.html',
  styleUrl: './master-program-card.component.scss',
})
export class MasterProgramCardComponent {
  @Input() bodyItems: { label: string }[] = [];
  @Input() bodyIconPath: string[] = [
    'assets/icons/certificate-icon.svg',
    'assets/icons/person-icon.svg',
    'assets/icons/calender-icon.svg',
    'assets/icons/people-icon.svg'
  ];
  @Input() headerIconPath: string = 'assets/icons/graduate-icon.svg';
  @Input() headerLabel: string = '';
  @Input() modifyIconPath: string = 'assets/icons/modify-icon.svg';
  @Input() deleteIconPath: string = 'assets/icons/delete-icon.svg';
  @Input() menuIconPath: string = 'assets/icons/more-options-icon.svg';

  // Event for the large button
  @Output() onClick = new EventEmitter<void>();
  // Event for the card's overall click
  @Output() cardClick = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() modification = new EventEmitter<void>();
  // New events for contextual menu options
  @Output() fileSystemSelected = new EventEmitter<void>();
  @Output() mappingSystemSelected = new EventEmitter<void>();
  @Output() dataVerificationSelected = new EventEmitter<void>();

  menuOptions: MenuOption[] = [
    { id: 'fileSystem', label: 'File System', icon: 'assets/icons/file-icon.svg' },
    { id: 'mappingSystem', label: 'Mapping System', icon: 'assets/icons/map-icon.svg' },
    { id: 'dataVerification', label: 'Data Verification', icon: 'assets/icons/verify-icon.svg' },
  ];

  // This method is triggered when the card itself is clicked
  cardClicked(): void {
    this.cardClick.emit();
  }

  // This method is triggered when the large button is clicked
  onLargeButtonClick(event: MouseEvent): void {
    event.stopPropagation();  // Prevents the card's click event from firing
    this.onClick.emit();
  }

  // Optional: You can also create dedicated methods for the small buttons if needed.
  onModifyClick(event: MouseEvent): void {
    event.stopPropagation();
    this.modification.emit();
  }

  onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit();
  }

  // Handler for contextual menu option selection
  onMenuOptionSelected(optionId: string): void {
    switch (optionId) {
      case 'fileSystem':
        this.fileSystemSelected.emit();
        break;
      case 'mappingSystem':
        this.mappingSystemSelected.emit();
        break;
      case 'dataVerification':
        this.dataVerificationSelected.emit();
        break;
    }
  }
}
