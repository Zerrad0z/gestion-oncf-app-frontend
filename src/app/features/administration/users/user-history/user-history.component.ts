// src/app/features/administration/users/user-history/user-history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { HistoriqueService } from '../../../../services/historique.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-user-history',
  templateUrl: './user-history.component.html',
  styleUrls: ['./user-history.component.scss'],
  imports: [CommonModule, RouterLink],
  standalone: true
})
export class UserHistoryComponent implements OnInit {
  user: User | null = null;
  activities: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private historiqueService: HistoriqueService
  ) {}

  ngOnInit(): void {
    const userId = +this.route.snapshot.params['id'];
    this.loadUser(userId);
    this.loadUserHistory(userId);
  }

  loadUser(id: number): void {
    this.loading = true;
    this.userService.getUserById(id).subscribe({
      next: (data) => {
        this.user = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des détails de l\'utilisateur';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadUserHistory(id: number): void {
    this.loading = true;
    this.historiqueService.getHistoriqueForUser(id).subscribe({
      next: (data) => {
        this.activities = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de l\'historique d\'activité';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getEntityTypeName(type: string): string {
    const typeNames: {[key: string]: string} = {
      'LETTRE_BILLET': 'Lettre de sommation (billet)',
      'LETTRE_CARTE': 'Lettre de sommation (carte)',
      'RAPPORT_M': 'Rapport M',
      'ACT': 'ACT',
      'ANTENNE': 'Antenne',
      'SECTION': 'Section',
      'TRAIN': 'Train',
      'GARE': 'Gare',
      'UTILISATEUR_SYSTEME': 'Utilisateur',
      'PARAMETRE_SYSTEME': 'Paramètre système'
    };
    
    return typeNames[type] || type;
  }

  getActionName(action: string): string {
    const actionNames: {[key: string]: string} = {
      'CREATION': 'Création',
      'MODIFICATION': 'Modification',
      'SUPPRESSION': 'Suppression',
      'CHANGEMENT_STATUT': 'Changement de statut',
      'CONNEXION': 'Connexion',
      'DECONNEXION': 'Déconnexion'
    };
    
    return actionNames[action] || action;
  }
}