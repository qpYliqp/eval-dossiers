import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuOption } from '../contextual-menu-button.component';

@Component({
    selector: 'app-contextual-menu-overlay',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './contextual-menu-overlay.component.html',
    styleUrls: ['./contextual-menu-overlay.component.scss'],
    animations: [
        // Can add animations for smooth transition
    ]
})
export class ContextualMenuOverlayComponent {
    @Input() options: MenuOption[] = [];
    @Output() optionSelected = new EventEmitter<string>();

    selectOption(optionId: string): void {
        this.optionSelected.emit(optionId);
    }
}
