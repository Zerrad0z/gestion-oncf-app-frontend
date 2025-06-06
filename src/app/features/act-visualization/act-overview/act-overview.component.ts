import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, finalize, map } from 'rxjs/operators';

import { AntenneService } from '../../../services/antenne.service';
import { ActService } from '../../../services/act.service';
import { LettreSommationBilletService } from '../../../services/LettreSommationBillet.service';
import { LettreSommationCarteService } from '../../../services/lettre-sommation-carte.service';
import { RapportMService } from '../../../services/rapport-m.service';
import { PermissionService } from '../../../services/permission.service';
import { AuthService } from '../../../services/auth.service';

import { Antenne } from '../../../core/models/antenne.model';
import { ACT } from '../../../core/models/act.model';

interface ACTWithStats extends ACT {
  lettresBilletCount: number;
  lettresCarteCount: number;
  rapportsCount: number;
  totalDocuments: number;
  monthlyStats: {
    lettresBillet: number;
    lettresCarte: number;
    rapports: number;
  };
}

interface AntenneStats {
  lettresBillet: number;
  lettresCarte: number;
  rapports: number;
  total: number;
}

@Component({
  selector: 'app-act-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './act-overview.component.html',
  styleUrls: ['./act-overview.component.scss']
})
export class ActOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  antennes: Antenne[] = [];
  actsWithStats: ACTWithStats[] = [];
  loading = false;
  error: string | null = null;
  
  totalACTs = 0;
  totalDocuments = 0;
  thisMonthDocuments = 0;

  constructor(
    private antenneService: AntenneService,
    private actService: ActService,
    private billetService: LettreSommationBilletService,
    private carteService: LettreSommationCarteService,
    private rapportService: RapportMService,
    private permissionService: PermissionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.loading = true;
    this.error = null;

    forkJoin({
      antennes: this.antenneService.getAllAntennes(),
      acts: this.actService.getAllActs()
    }).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.error = 'Erreur lors du chargement des données de base';
        return of({ antennes: [], acts: [] });
      })
    ).subscribe(({ antennes, acts }) => {
      this.antennes = antennes;
      const filteredActs = this.filterACTsByUserRole(acts);
      
      if (filteredActs.length === 0) {
        this.actsWithStats = [];
        this.updateSummaryStats();
        this.loading = false;
        return;
      }

      this.loadACTStatistics(filteredActs);
    });
  }

  private filterACTsByUserRole(acts: ACT[]): ACT[] {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return [];
    }

    if (this.permissionService.canViewAllACTs()) {
      return acts;
    }

    if (this.permissionService.canViewOwnACTOnly()) {
      return acts.filter(act => act.id === currentUser.actId);
    }

    return [];
  }

  private loadACTStatistics(acts: ACT[]) {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

    const actStatsObservables = acts.map(act => {
      return forkJoin({
        act: of(act),
        lettresBillet: this.billetService.getLettreSommationBilletByActId(act.id).pipe(
          catchError(() => of([]))
        ),
        lettresCarte: this.carteService.getLettreSommationCarteByActId(act.id).pipe(
          catchError(() => of([]))
        ),
        rapports: this.rapportService.getRapportMByActId(act.id).pipe(
          catchError(() => of([]))
        )
      }).pipe(
        map(({ act, lettresBillet, lettresCarte, rapports }) => {
          const monthlyLettresBillet = lettresBillet.filter(l => 
            l.dateCreation >= startOfMonth && l.dateCreation <= endOfMonth
          ).length;
          
          const monthlyLettresCarte = lettresCarte.filter(l => 
            l.dateCreation >= startOfMonth && l.dateCreation <= endOfMonth
          ).length;
          
          const monthlyRapports = rapports.filter(r => 
            r.dateEnvoi >= startOfMonth && r.dateEnvoi <= endOfMonth
          ).length;

          return {
            ...act,
            lettresBilletCount: lettresBillet.length,
            lettresCarteCount: lettresCarte.length,
            rapportsCount: rapports.length,
            totalDocuments: lettresBillet.length + lettresCarte.length + rapports.length,
            monthlyStats: {
              lettresBillet: monthlyLettresBillet,
              lettresCarte: monthlyLettresCarte,
              rapports: monthlyRapports
            }
          };
        }),
        catchError(() => {
          return of({
            ...act,
            lettresBilletCount: 0,
            lettresCarteCount: 0,
            rapportsCount: 0,
            totalDocuments: 0,
            monthlyStats: {
              lettresBillet: 0,
              lettresCarte: 0,
              rapports: 0
            }
          });
        })
      );
    });

    forkJoin(actStatsObservables).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loading = false;
      }),
      catchError(() => {
        this.error = 'Erreur lors du chargement des statistiques';
        return of([]);
      })
    ).subscribe({
      next: (actsWithStats) => {
        this.actsWithStats = actsWithStats;
        this.updateSummaryStats();
      }
    });
  }  

  private updateSummaryStats() {
    this.totalACTs = this.actsWithStats.length;
    this.totalDocuments = this.actsWithStats.reduce((sum, act) => sum + act.totalDocuments, 0);
    this.thisMonthDocuments = this.actsWithStats.reduce((sum, act) => 
      sum + act.monthlyStats.lettresBillet + act.monthlyStats.lettresCarte + act.monthlyStats.rapports, 0
    );
  }

  getACTsForAntenne(antenneId: number): ACTWithStats[] {
    return this.actsWithStats.filter(act => act.antenne?.id === antenneId);
  }

  getAntenneStats(antenneId: number): AntenneStats {
    const antenneACTs = this.getACTsForAntenne(antenneId);
    
    return {
      lettresBillet: antenneACTs.reduce((sum, act) => sum + act.lettresBilletCount, 0),
      lettresCarte: antenneACTs.reduce((sum, act) => sum + act.lettresCarteCount, 0),
      rapports: antenneACTs.reduce((sum, act) => sum + act.rapportsCount, 0),
      total: antenneACTs.reduce((sum, act) => sum + act.totalDocuments, 0)
    };
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getProgressWidth(value: number, monthlyStats: { lettresBillet: number; lettresCarte: number; rapports: number }): number {
    const total = monthlyStats.lettresBillet + monthlyStats.lettresCarte + monthlyStats.rapports;
    return total > 0 ? (value / total) * 100 : 0;
  }

  canViewACTDetail(actId: number): boolean {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return false;
    }

    if (this.permissionService.canViewAllACTs()) {
      return true;
    }

    if (this.permissionService.canViewOwnACTOnly()) {
      return currentUser.actId === actId;
    }

    return false;
  }

  navigateToACTDetail(actId: number) {
    if (this.canViewACTDetail(actId)) {
      this.router.navigate(['/act-visualization/detail', actId]);
    } else {
      this.error = 'Vous n\'avez pas les droits pour consulter ce détail d\'agent.';
      setTimeout(() => {
        this.error = null;
      }, 3000);
    }
  }

  canAccessACTVisualization(): boolean {
    return this.permissionService.canAccessACTVisualization();
  }

  canViewACTOverview(): boolean {
    return this.permissionService.canViewACTOverview();
  }

  canViewDetailedStats(): boolean {
    return this.permissionService.canViewDetailedStats();
  }

  getCurrentUserRole(): string | null {
    const user = this.authService.getCurrentUser();
    return user ? user.role : null;
  }

  getCurrentUserACTId(): number | null {
    const user = this.authService.getCurrentUser();
    return user?.actId || null;
  }

  trackByActId(index: number, act: ACTWithStats): number {
  return act.id;
}

trackByAntenneId(index: number, antenne: Antenne): number {
  return antenne.id;
}

  isViewingOwnData(): boolean {
    return this.permissionService.canViewOwnACTOnly();
  }

  getDataScopeMessage(): string {
    if (this.permissionService.canViewAllACTs()) {
      return 'Vue globale de tous les ACTs';
    } else if (this.permissionService.canViewOwnACTOnly()) {
      return 'Vue de vos données personnelles';
    }
    return '';
  }

  refreshData() {
    this.loadData();
  }

  handleError(error: any, context: string) {
    this.error = `Erreur lors ${context}. Veuillez réessayer.`;
    this.loading = false;
  }

  retryLoad() {
    this.error = null;
    this.loadData();
  }
}