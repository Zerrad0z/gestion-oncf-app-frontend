import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';

import { ActService } from '../../../services/act.service';
import { LettreSommationBilletService } from '../../../services/LettreSommationBillet.service';
import { LettreSommationCarteService } from '../../../services/lettre-sommation-carte.service';
import { RapportMService } from '../../../services/rapport-m.service';

import { ACT } from '../../../core/models/act.model';
import { LettreSommationBillet } from '../../../core/models/lettre-sommation-billet.model';
import { LettreSommationCarte } from '../../../core/models/lettre-sommation-carte.model';
import { RapportM } from '../../../core/models/rapportM.model';
import { StatutEnum } from '../../../core/models/StatutEnum.model';

interface MonthlyData {
  month: string;
  lettresBillet: number;
  lettresCarte: number;
  rapports: number;
  total: number;
}

interface DocumentActivity {
  type: 'LETTRE_BILLET' | 'LETTRE_CARTE' | 'RAPPORT_M';
  title: string;
  date: string;
  status?: StatutEnum | string;
  details: string;
  id: number;
}

@Component({
  selector: 'app-act-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './act-detail.component.html',
  styleUrls: ['./act-detail.component.scss']
})
export class ActDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private actId!: number;
  
  act: ACT | null = null;
  lettresBillet: LettreSommationBillet[] = [];
  lettresCarte: LettreSommationCarte[] = [];
  rapports: RapportM[] = [];
  
  loading = false;
  error: string | null = null;
  
  monthlyData: MonthlyData[] = [];
  recentActivity: DocumentActivity[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actService: ActService,
    private billetService: LettreSommationBilletService,
    private carteService: LettreSommationCarteService,
    private rapportService: RapportMService
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.actId = parseInt(id, 10);
        this.loadACTData();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadACTData() {
    this.loading = true;
    this.error = null;

    forkJoin({
      act: this.actService.getActById(this.actId),
      lettresBillet: this.billetService.getLettreSommationBilletByActId(this.actId).pipe(
        catchError(() => of([]))
      ),
      lettresCarte: this.carteService.getLettreSommationCarteByActId(this.actId).pipe(
        catchError(() => of([]))
      ),
      rapports: this.rapportService.getRapportMByActId(this.actId).pipe(
        catchError(() => of([]))
      )
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false),
      catchError(error => {
        console.error('Error loading ACT data:', error);
        this.error = 'Erreur lors du chargement des données de l\'agent';
        return of({ act: null, lettresBillet: [], lettresCarte: [], rapports: [] });
      })
    ).subscribe(({ act, lettresBillet, lettresCarte, rapports }) => {
      this.act = act;
      this.lettresBillet = lettresBillet;
      this.lettresCarte = lettresCarte;
      this.rapports = rapports;
      
      if (act) {
        this.generateMonthlyData();
        this.generateRecentActivity();
      }
    });
  }

  private generateMonthlyData() {
    const months: MonthlyData[] = [];
    const now = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const startStr = monthStart.toISOString().split('T')[0];
      const endStr = monthEnd.toISOString().split('T')[0];
      
      const lettresBilletCount = this.lettresBillet.filter(l => 
        l.dateCreation >= startStr && l.dateCreation <= endStr
      ).length;
      
      const lettresCarteCount = this.lettresCarte.filter(l => 
        l.dateCreation >= startStr && l.dateCreation <= endStr
      ).length;
      
      const rapportsCount = this.rapports.filter(r => 
        r.dateEnvoi >= startStr && r.dateEnvoi <= endStr
      ).length;
      
      months.push({
        month: monthDate.toLocaleDateString('fr-FR', { month: 'short' }),
        lettresBillet: lettresBilletCount,
        lettresCarte: lettresCarteCount,
        rapports: rapportsCount,
        total: lettresBilletCount + lettresCarteCount + rapportsCount
      });
    }
    
    this.monthlyData = months;
  }

  private generateRecentActivity() {
    const activities: DocumentActivity[] = [];
    
    // Add recent lettres billet
    this.lettresBillet.slice(0, 10).forEach(lettre => {
      activities.push({
        type: 'LETTRE_BILLET',
        title: `Lettre de sommation - Billet ${lettre.numeroBillet}`,
        date: lettre.dateCreation,
        status: lettre.statut,
        details: `Train ${lettre.train.numero} - ${lettre.gare.nom}`,
        id: lettre.id!
      });
    });
    
    // Add recent lettres carte
    this.lettresCarte.slice(0, 10).forEach(lettre => {
      activities.push({
        type: 'LETTRE_CARTE',
        title: `Lettre de sommation - Carte ${lettre.numeroCarte}`,
        date: lettre.dateCreation,
        status: lettre.statut,
        details: `Train ${lettre.train.numero} - ${lettre.gare.nom}`,
        id: lettre.id!
      });
    });
    
    // Add recent rapports
    this.rapports.slice(0, 10).forEach(rapport => {
      activities.push({
        type: 'RAPPORT_M',
        title: `Rapport M - ${rapport.references}`,
        date: rapport.dateEnvoi,
        status: rapport.categorie,
        details: rapport.objet,
        id: rapport.id!
      });
    });
    
    // Sort by date (most recent first) and take top 15
    this.recentActivity = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15);
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getBarHeight(value: number, maxValue: number): number {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  }

  getMaxValue(): number {
    return Math.max(...this.monthlyData.map(m => m.total), 1);
  }

  getCurrentMonthName(): string {
    return new Date().toLocaleDateString('fr-FR', { month: 'long' });
  }

  getCurrentMonthData(): MonthlyData {
    return this.monthlyData[this.monthlyData.length - 1] || { month: '', lettresBillet: 0, lettresCarte: 0, rapports: 0, total: 0 };
  }

  getBilletStatusCount(status: string): number {
    return this.lettresBillet.filter(l => l.statut === status).length;
  }

  getCarteStatusCount(status: string): number {
    return this.lettresCarte.filter(l => l.statut === status).length;
  }

  getRapportCategories(): { name: string; count: number }[] {
    const categories = new Map<string, number>();
    
    this.rapports.forEach(rapport => {
      const category = rapport.categorie;
      categories.set(category, (categories.get(category) || 0) + 1);
    });
    
    return Array.from(categories.entries()).map(([name, count]) => ({
      name: this.getCategoryLabel(name),
      count
    }));
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'EPAVES': return 'Épaves';
      case 'COMPTABILITE': return 'Comptabilité';
      case 'BILLETS': return 'Billets';
      case 'DIVERS': return 'Divers';
      default: return category;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'REGULARISEE': return 'Régularisée';
      case 'NON_REGULARISEE': return 'Non Régularisée';
      case 'EN_COURS': return 'En Cours';
      case 'EN_ATTENTE': return 'En Attente';
      case 'EPAVES': return 'Épaves';
      case 'COMPTABILITE': return 'Comptabilité';
      case 'BILLETS': return 'Billets';
      case 'DIVERS': return 'Divers';
      default: return status;
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
    
    return date.toLocaleDateString('fr-FR');
  }

  goBack() {
    this.router.navigate(['/act-visualization/overview']);
  }
}