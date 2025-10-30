import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'large-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './large-button.component.html',
  styleUrls: ['./large-button.component.scss']  // Corrected to plural property
})
export class LargeButtonComponent {
  @Input() iconPath?: string;
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input() onClick?: () => void;
  @Input() BackgroundColor?: string;
  @Input() BorderColor?: string;
  @Input() TextColor?: string;
  @Input() HoverBackgroundColor?: string;
  @Input() HoverBorderColor?: string;

  hasProjectedIcon: boolean = false;
  hasProjectedLabel: boolean = false;

  handleClick() {
    if (this.onClick && typeof this.onClick === 'function') {
      this.onClick();
    }
  }
}
