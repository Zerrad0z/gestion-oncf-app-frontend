// src/app/app.component.ts
import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { User } from './core/models/user.model';
import { Subscription } from 'rxjs';
import { PermissionService } from './services/permission.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  // User data from auth service
  currentUser: User | null = null;
  userName = '';
  userRole = '';
  userInitials = '';
  
  // Role flags for conditional menu items
  isAdmin = false;
  isACT = false;
  isEncadrant = false;
  isSuperviseur = false;
  
  // UI state
  sidebarCollapsed = false;
  unreadNotificationsCount = 3;
  
  private userSubscription?: Subscription;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public authService: AuthService,
    private permissionService: PermissionService,
    private router: Router
  ) {}
  
  ngOnInit() {
    // Initialize sidebar state based on screen size - only on browser
    if (isPlatformBrowser(this.platformId)) {
      this.sidebarCollapsed = window.innerWidth < 768;
      
      // Listen for window resize events
      window.addEventListener('resize', () => {
        if (window.innerWidth < 768) {
          this.sidebarCollapsed = true;
        }
      });
    }
    
    // Subscribe to current user changes
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userName = user.nomPrenom;
        this.userRole = this.getRoleLabel(user.role);
        this.userInitials = this.getInitials(user.nomPrenom);
        this.setRoleFlags(user.role);
        console.log('User logged in:', user.nomUtilisateur, 'Role:', user.role);
      } else {
        this.resetUserData();
      }
    });
  }
  
  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }
  
  private resetUserData() {
    this.userName = '';
    this.userRole = '';
    this.userInitials = '';
    this.isAdmin = false;
    this.isACT = false;
    this.isEncadrant = false;
    this.isSuperviseur = false;
  }
  
  private getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  private getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'SUPERVISEUR':
        return 'Superviseur';
      case 'ENCADRANT':
        return 'Encadrant';
      default:
        return role;
    }
  }
  
  setRoleFlags(role: string) {
    // Reset all flags
    this.isAdmin = false;
    this.isACT = false;
    this.isEncadrant = false;
    this.isSuperviseur = false;
    
    // Set the appropriate flag based on role
    switch (role) {
      case 'ADMIN':
        this.isAdmin = true;
        break;
      case 'ACT':
        this.isACT = true;
        break;
      case 'ENCADRANT':
        this.isEncadrant = true;
        break;
      case 'SUPERVISEUR':
        this.isSuperviseur = true;
        break;
    }
  }
  
  // DEBUG METHOD - Add this temporarily
  debugClick(section: string) {
    console.log('Menu clicked:', section);
    console.log('Current user:', this.currentUser);
    console.log('Can access administration:', this.canAccessAdministration());
    console.log('Can access configuration:', this.canAccessConfiguration());
  }
  
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  toggleNotifications() {
    // Implement notification panel toggle
    console.log('Toggle notifications');
  }
  
  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logged out successfully');
      },
      error: (err) => {
        console.error('Logout error:', err);
        // Force logout on error
        this.authService.logoutLocal();
      }
    });
  }
  
  // Helper methods for template
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
  
  canAccessAdministration(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'SUPERVISEUR']);
  }
  
  canAccessConfiguration(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'SUPERVISEUR']);
  }

//ACT 

canAccessACTVisualization(): boolean {
  return this.permissionService.canAccessACTVisualization();
}

canViewACTOverview(): boolean {
  return this.permissionService.canViewACTOverview();
}

canViewACTDetail(): boolean {
  return this.permissionService.canViewACTDetail();
}

// Helper method to check if user can see detailed statistics
canViewDetailedStats(): boolean {
  return this.permissionService.canViewDetailedStats();
}

}