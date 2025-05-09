import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  // Dashboard stats
  stats = {
    lettresBillet: {
      total: 156,
      regularisees: 98,
      nonRegularisees: 58
    },
    lettresCarte: {
      total: 87,
      regularisees: 52,
      nonRegularisees: 35
    },
    rapports: {
      total: 42,
      enAttente: 12,
      enCours: 18,
      traites: 8,
      rejetes: 4
    }
  };
  
  // Recent activity
  recentActivities = [
    { type: 'LETTRE_BILLET', status: 'REGULARISEE', user: 'Mohammed Alami', date: new Date(2025, 4, 6, 14, 30) },
    { type: 'RAPPORT_M', status: 'EN_COURS', user: 'Fatima Benali', date: new Date(2025, 4, 6, 11, 15) },
    { type: 'LETTRE_CARTE', status: 'NON_REGULARISEE', user: 'Karim Tazi', date: new Date(2025, 4, 5, 16, 45) },
    { type: 'LETTRE_BILLET', status: 'REGULARISEE', user: 'Samira Chaoui', date: new Date(2025, 4, 5, 10, 20) },
    { type: 'RAPPORT_M', status: 'TRAITE', user: 'Younes Bakali', date: new Date(2025, 4, 4, 9, 10) }
  ];

  getStatusClass(status: string): string {
    switch(status) {
      case 'REGULARISEE':
      case 'TRAITE':
        return 'regularisee';
      case 'EN_COURS':
        return 'en-cours';
      case 'EN_ATTENTE':
        return 'en-attente';
      case 'NON_REGULARISEE':
      case 'REJETE':
        return 'non-regularisee';
      default:
        return '';
    }
  }
  
  getTypeLabel(type: string): string {
    switch(type) {
      case 'LETTRE_BILLET':
        return 'Lettre (Billet)';
      case 'LETTRE_CARTE':
        return 'Lettre (Carte)';
      case 'RAPPORT_M':
        return 'Rapport M';
      default:
        return type;
    }
  }
  
  getStatusLabel(status: string): string {
    switch(status) {
      case 'REGULARISEE':
        return 'Régularisée';
      case 'NON_REGULARISEE':
        return 'Non Régularisée';
      case 'EN_ATTENTE':
        return 'En Attente';
      case 'EN_COURS':
        return 'En Cours';
      case 'TRAITE':
        return 'Traité';
      case 'REJETE':
        return 'Rejeté';
      default:
        return status;
    }
  }
}