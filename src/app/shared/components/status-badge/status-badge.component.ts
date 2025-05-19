import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

enum StatutEnum {
  NON_TRAITEE = 'NON_TRAITEE',
  EN_COURS = 'EN_COURS',
  URGENT = 'URGENT',
  TRAITE = 'TRAITE',
  REGULARISEE = 'REGULARISEE',
  NON_REGULARISEE = 'NON_REGULARISEE',
  REJETE = 'REJETE'
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="badgeClass" class="px-2 py-1 text-xs font-semibold rounded-full uppercase">
      {{ status }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status!: StatutEnum;
  
  get badgeClass(): string {
    switch (this.status) {
      case StatutEnum.NON_TRAITEE:
        return 'bg-gray-500 text-white';
      case StatutEnum.EN_COURS:
        return 'bg-secondary text-white';
      case StatutEnum.URGENT:
        return 'bg-red-500 text-white';
      case StatutEnum.TRAITE:
        return 'bg-indigo-500 text-white';
      case StatutEnum.REGULARISEE:
        return 'bg-green-500 text-white';
      case StatutEnum.NON_REGULARISEE:
        return 'bg-primary-light text-white';
      case StatutEnum.REJETE:
        return 'bg-gray-800 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }
}