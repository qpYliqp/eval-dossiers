import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'card-info-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-info-item.component.html',
  styleUrls: ['./card-info-item.component.scss']
})
export class CardInfoItemComponent {
  @Input() iconPath?: string;
  @Input() label: string = '';

  @Input() labelFontSize?: string;
  @Input() iconSize?: string;
  @Input() iconColor?: string;
  @Input() variant: 'title' | 'label' = 'label';
}