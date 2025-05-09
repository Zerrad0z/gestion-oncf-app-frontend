import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

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
export class AppComponent implements OnInit {
  // User info (this would come from your auth service)
  userName = 'Mohammed Alami';
  userRole = 'Superviseur';
  userInitials = 'MA';
  
  // Role flags for conditional menu items
  isAdmin = true;  // Changed to true to show admin menus
  isACT = false;
  isEncadrant = false;
  isSuperviseur = true;
  
  // UI state
  sidebarCollapsed = false;
  unreadNotificationsCount = 3;
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  
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
    
    // You would typically get the user's role from your auth service
    this.setRoleFlags(this.userRole);
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
  
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  toggleNotifications() {
    // Implement notification panel toggle
    console.log('Toggle notifications');
  }
  
  toggleProfileMenu() {
    // Implement profile menu toggle
    console.log('Toggle profile menu');
  }
  
  logout() {
    // Implement logout functionality
    console.log('Logging out...');
    // You would typically clear the auth token and redirect to login
    // this.router.navigate(['/login']);
  }
}