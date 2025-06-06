// src/app/components/dashboard/dashboard.component.ts (Enhanced)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

import { ActService } from '../../services/act.service';
import { SectionService } from '../../services/section.service';
import { LettreSommationBilletService } from '../../services/LettreSommationBillet.service';
import { LettreSommationCarteService } from '../../services/lettre-sommation-carte.service';
import { RapportMService } from '../../services/rapport-m.service';

interface DashboardStats {
  acts: {
    total: number;
    active: number;
    sections: number;
  };
  lettresBillet: {
    total: number;
    regularisees: number;
    nonRegularisees: number;
    thisMonth: number;
  };
  lettresCarte: {
    total: number;
    regularisees: number;
    nonRegularisees: number;
    thisMonth: number;
  };
  rapports: {
    total: number;
    thisMonth: number;
    byCategory: { [key: string]: number };
  };
}

interface RecentActivity {
  type: 'LETTRE_BILLET' | 'LETTRE_CARTE' | 'RAPPORT_M';
  status: string;
  user: string;
  date: Date;
  description: string;
}

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
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = false;
  error: string | null = null;
  
  stats: DashboardStats = {
    acts: { total: 0, active: 0, sections: 0 },
    lettresBillet: { total: 0, regularisees: 0, nonRegularisees: 0, thisMonth: 0 },
    lettresCarte: { total: 0, regularisees: 0, nonRegularisees: 0, thisMonth: 0 },
    rapports: { total: 0, thisMonth: 0, byCategory: {} }
  };
  
  recentActivities: RecentActivity[] = [];

  constructor(
    private actService: ActService,
    private sectionService: SectionService,
    private billetService: LettreSommationBilletService,
    private carteService: LettreSommationCarteService,
    private rapportService: RapportMService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

    forkJoin({
      acts: this.actService.getAllActs().pipe(catchError(() => of([]))),
      sections: this.sectionService.getAllSections().pipe(catchError(() => of([]))),
      lettresBillet: this.billetService.getAllLettresSommationBillet().pipe(catchError(() => of([]))),
      lettresCarte: this.carteService.getAllLettresSommationCarte().pipe(catchError(() => of([]))),
      rapports: this.rapportService.getAllRapportsM().pipe(catchError(() => of([])))
    }).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Erreur lors du chargement des données';
        return of({ acts: [], sections: [], lettresBillet: [], lettresCarte: [], rapports: [] });
      })
    ).subscribe(({ acts, sections, lettresBillet, lettresCarte, rapports }) => {
      // Calculate ACT stats
      this.stats.acts = {
        total: acts.length,
        active: acts.length, // Assuming all are active for now
        sections: sections.length
      };

      // Calculate Lettres Billet stats
      const regulariseesBillet = lettresBillet.filter(l => l.statut === 'REGULARISEE').length;
      const thisMonthBillet = lettresBillet.filter(l => 
        l.dateCreation >= startOfMonth && l.dateCreation <= endOfMonth
      ).length;

      this.stats.lettresBillet = {
        total: lettresBillet.length,
        regularisees: regulariseesBillet,
        nonRegularisees: lettresBillet.length - regulariseesBillet,
        thisMonth: thisMonthBillet
      };

      // Calculate Lettres Carte stats
      const regulariseesCarte = lettresCarte.filter(l => l.statut === 'REGULARISEE').length;
      const thisMonthCarte = lettresCarte.filter(l => 
        l.dateCreation >= startOfMonth && l.dateCreation <= endOfMonth
      ).length;

      this.stats.lettresCarte = {
        total: lettresCarte.length,
        regularisees: regulariseesCarte,
        nonRegularisees: lettresCarte.length - regulariseesCarte,
        thisMonth: thisMonthCarte
      };

      // Calculate Rapports stats
      const thisMonthRapports = rapports.filter(r => 
        r.dateEnvoi >= startOfMonth && r.dateEnvoi <= endOfMonth
      ).length;

      // Count by category
      const byCategory: { [key: string]: number } = {};
      rapports.forEach(r => {
        byCategory[r.categorie] = (byCategory[r.categorie] || 0) + 1;
      });

      this.stats.rapports = {
        total: rapports.length,
        thisMonth: thisMonthRapports,
        byCategory
      };

      // Generate recent activities
      this.generateRecentActivities(lettresBillet, lettresCarte, rapports);
      
      this.loading = false;
    });
  }

  private generateRecentActivities(lettresBillet: any[], lettresCarte: any[], rapports: any[]) {
    const activities: RecentActivity[] = [];
    
    // Add recent lettres billet
    lettresBillet.slice(0, 5).forEach(lettre => {
      activities.push({
        type: 'LETTRE_BILLET',
        status: lettre.statut,
        user: lettre.act?.nomPrenom || 'N/A',
        date: new Date(lettre.dateCreation),
        description: `Billet ${lettre.numeroBillet} - ${lettre.gare?.nom || 'N/A'}`
      });
    });
    
    // Add recent lettres carte
    lettresCarte.slice(0, 5).forEach(lettre => {
      activities.push({
        type: 'LETTRE_CARTE',
        status: lettre.statut,
        user: lettre.act?.nomPrenom || 'N/A',
        date: new Date(lettre.dateCreation),
        description: `Carte ${lettre.numeroCarte} - ${lettre.gare?.nom || 'N/A'}`
      });
    });
    
    // Add recent rapports
    rapports.slice(0, 5).forEach(rapport => {
      activities.push({
        type: 'RAPPORT_M',
        status: rapport.categorie,
        user: rapport.act?.nomPrenom || 'N/A',
        date: new Date(rapport.dateEnvoi),
        description: `${rapport.references} - ${rapport.objet}`
      });
    });
    
    // Sort by date (most recent first) and take top 10
    this.recentActivities = activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }

  getCurrentMonth(): string {
    return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
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
      case 'EN_COURS':
        return 'En Cours';
      case 'EN_ATTENTE':
        return 'En Attente';
      case 'EPAVES':
        return 'Épaves';
      case 'COMPTABILITE':
        return 'Comptabilité';
      case 'BILLETS':
        return 'Billets';
      case 'DIVERS':
        return 'Divers';
      default:
        return status;
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'REGULARISEE':
        return 'bg-green-100 text-green-700';
      case 'NON_REGULARISEE':
        return 'bg-red-100 text-red-700';
      case 'EN_COURS':
        return 'bg-yellow-100 text-yellow-700';
      case 'EN_ATTENTE':
        return 'bg-gray-100 text-gray-700';
      case 'EPAVES':
        return 'bg-orange-100 text-orange-700';
      case 'COMPTABILITE':
        return 'bg-blue-100 text-blue-700';
      case 'BILLETS':
        return 'bg-purple-100 text-purple-700';
      case 'DIVERS':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  formatActivityDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
    
    return date.toLocaleDateString('fr-FR');
  }
}