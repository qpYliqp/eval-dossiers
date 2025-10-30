import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ContextualMenuOverlayComponent } from './contextual-menu-overlay/contextual-menu-overlay.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface MenuOption {
    id: string;
    label: string;
    icon?: string;
}

@Component({
    selector: 'contextual-menu-button',
    standalone: true,
    imports: [CommonModule, OverlayModule],
    templateUrl: './contextual-menu-button.component.html',
    styleUrls: ['./contextual-menu-button.component.scss']
})
export class ContextualMenuButtonComponent implements OnDestroy {
    @Input() iconPath: string = 'assets/icons/menu-icon.svg';
    @Input() options: MenuOption[] = [];
    @Input() disabled: boolean = false;
    @Input() borderColor?: string;
    @Input() hoverBackgroundColor?: string;

    @Output() optionSelected = new EventEmitter<string>();
    @ViewChild('button') buttonRef!: ElementRef;

    private overlayRef: OverlayRef | null = null;
    private destroy$ = new Subject<void>();

    constructor(private overlay: Overlay) { }

    toggleMenu(event: Event): void {
        event.stopPropagation(); // Prevent the click from propagating

        if (this.disabled) return;

        if (this.overlayRef) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    private openMenu(): void {
        // Create overlay positioning strategy
        const positionStrategy = this.overlay
            .position()
            .flexibleConnectedTo(this.buttonRef)
            .withPositions([
                { // Try to position menu below button
                    originX: 'end',
                    originY: 'bottom',
                    overlayX: 'end',
                    overlayY: 'top',
                    offsetY: 4 // Small gap between button and menu
                },
                { // If not enough space below, position menu above button
                    originX: 'end',
                    originY: 'top',
                    overlayX: 'end',
                    overlayY: 'bottom',
                    offsetY: -4 // Small gap between button and menu
                },
                { // Try showing on the left side
                    originX: 'start',
                    originY: 'bottom',
                    overlayX: 'start',
                    overlayY: 'top',
                    offsetY: 4
                }
            ]);

        // Create overlay reference
        this.overlayRef = this.overlay.create({
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
            width: '180px',
            hasBackdrop: true,
            backdropClass: 'cdk-overlay-transparent-backdrop'
        });

        // Listen for backdrop clicks
        this.overlayRef.backdropClick().pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => this.closeMenu());

        // Create portal and attach component
        const menuPortal = new ComponentPortal(ContextualMenuOverlayComponent);
        const menuRef = this.overlayRef.attach(menuPortal);

        // Pass data to the component
        menuRef.instance.options = this.options;

        // Listen for option selection
        menuRef.instance.optionSelected.pipe(
            takeUntil(this.destroy$)
        ).subscribe(optionId => {
            this.optionSelected.emit(optionId);
            this.closeMenu();
        });
    }

    private closeMenu(): void {
        if (this.overlayRef) {
            this.overlayRef.dispose();
            this.overlayRef = null;
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        if (this.overlayRef) {
            this.overlayRef.dispose();
        }
    }
}
