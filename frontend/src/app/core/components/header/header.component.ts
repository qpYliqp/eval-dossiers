import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MasterSelectionService } from '../../services/master-selection.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  selectedMasterId: number | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private masterSelectionService: MasterSelectionService
  ) { }

  ngOnInit(): void {
    // Subscribe to master ID changes
    const masterSubscription = this.masterSelectionService.selectedMasterId$.subscribe(
      masterId => {
        this.selectedMasterId = masterId;
      }
    );
    this.subscriptions.push(masterSubscription);

    // Listen for route changes
    const routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Check if we're navigating to the root/spaces page
      if (event.url === '/' || event.url === '/spaces') {
        // Clear the selected master when navigating to spaces
        this.masterSelectionService.clearSelectedMaster();
      }
    });
    this.subscriptions.push(routerSubscription);
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }

  goToSpaces() {
    this.masterSelectionService.clearSelectedMaster();
    this.router.navigate(['/']);
  }

  navigateToFiles() {
    if (this.selectedMasterId) {
      this.router.navigate(['/master', this.selectedMasterId, 'files']);
    }
  }

  navigateToMapping() {
    if (this.selectedMasterId) {
      this.router.navigate(['/master', this.selectedMasterId, 'mapping']);
    }
  }

  navigateToValidation() {
    if (this.selectedMasterId) {
      this.router.navigate(['/validation', this.selectedMasterId]);
    }
  }
}
