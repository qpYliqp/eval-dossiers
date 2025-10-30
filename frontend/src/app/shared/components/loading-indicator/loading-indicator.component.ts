import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'loading-indicator',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="loading-spinner">
      <div class="spinner"></div>
    </div>
  `,
    styles: [`
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top: 4px solid #3498db;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoadingIndicatorComponent { }
