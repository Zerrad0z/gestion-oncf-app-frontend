import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../services/user.service';
import { User, UserRole } from '../../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  showDeleteModal = false;
  userToDelete: User | null = null;
  
  // For filtering
  roleFilter: string = '';
  statusFilter: string = '';
  searchTerm: string = '';
  
  UserRole = UserRole;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (data: User[]) => {
        this.users = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        console.error(err);
      }
    });
  }

  get filteredUsers(): User[] {
    return this.users.filter(user => {
      // Apply role filter
      if (this.roleFilter && user.role !== this.roleFilter) {
        return false;
      }
      
      // Apply status filter
      if (this.statusFilter === 'ACTIF' && !user.actif) {
        return false;
      }
      if (this.statusFilter === 'INACTIF' && user.actif) {
        return false;
      }
      
      // Apply search term
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        return user.nomPrenom.toLowerCase().includes(term) || 
               user.nomUtilisateur.toLowerCase().includes(term) || 
               user.email.toLowerCase().includes(term) ||
               user.matricule.toLowerCase().includes(term);
      }
      
      return true;
    });
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  deleteUser(): void {
    if (!this.userToDelete) return;
    
    this.loading = true;
    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.loadUsers();
        this.showDeleteModal = false;
        this.userToDelete = null;
      },
      error: (err: any) => {
        this.error = 'Erreur lors de la suppression de l\'utilisateur';
        this.loading = false;
        console.error(err);
      }
    });
  }

  toggleUserStatus(user: User): void {
    this.loading = true;
    this.userService.toggleUserStatus(user.id).subscribe({
      next: (updatedUser) => {
        // Update the user in the list
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = `Erreur lors du changement de statut de l'utilisateur`;
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Helper method to format role names for display
  getRoleName(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN: return 'Administrateur';
      case UserRole.SUPERVISEUR: return 'Superviseur';
      case UserRole.ENCADRANT: return 'Encadrant';
      default: return role;
    }
  }

  clearFilters(): void {
    this.roleFilter = '';
    this.statusFilter = '';
    this.searchTerm = '';
  }
}