import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'small-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './small-button.component.html',
  styleUrls: ['./small-button.component.scss']
})
export class SmallButtonComponent {
  @Input() iconPath?: string;
  @Input() disabled: boolean = false;
  @Input() onClick?: () => void;
  @Input() hoverBackgroundColor?: string;
  @Input() borderColor?: string;

  handleClick() {
    if (this.onClick && typeof this.onClick === 'function') {
      this.onClick();
    }
  }
}