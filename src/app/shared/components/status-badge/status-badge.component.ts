import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

enum StatutEnum {
  REGULARISEE = 'REGULARISEE',
  NON_REGULARISEE = 'NON_REGULARISEE',
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
      case StatutEnum.REGULARISEE:
        return 'bg-green-500 text-white';
      case StatutEnum.NON_REGULARISEE:
        return 'bg-primary-light text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }
}