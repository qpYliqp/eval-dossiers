import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'error-message',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <div class="error-text">{{ message }}</div>
    </div>
  `,
    styles: [`
    .error-container {
      display: flex;
      align-items: center;
      padding: 12px;
      margin: 10px 0;
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      border-radius: 4px;
    }
    
    .error-icon {
      font-size: 20px;
      margin-right: 12px;
    }
    
    .error-text {
      color: #d32f2f;
      font-size: 14px;
    }
  `]
})
export class ErrorMessageComponent {
    @Input() message: string = '';
}
