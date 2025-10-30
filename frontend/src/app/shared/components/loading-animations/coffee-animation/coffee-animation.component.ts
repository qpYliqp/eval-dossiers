import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-coffee-animation',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './coffee-animation.component.html',
    styleUrls: ['./coffee-animation.component.scss']
})
export class CoffeeAnimationComponent {
    @Input() message: string = 'Ce processus peut prendre jusqu\'à quelques minutes...';
    @Input() resultMessage: string | null = null;
}
