import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import type { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ChangeOrderDeltaStore,
  type DeltaFilter,
} from '../../data-access/change-order-delta.store';
import { CumulativeCostDeltaChartComponent } from '../../ui/cumulative-cost-delta-chart.component';

@Component({
  selector: 'app-change-order-delta-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonToggleModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CumulativeCostDeltaChartComponent,
  ],
  template: `
    <mat-card class="p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-medium">Cumulative change-order cost delta</h2>
        <mat-button-toggle-group
          [value]="store.filter()"
          (change)="onFilterChange($event)"
          hideSingleSelectionIndicator
          aria-label="Change order status filter"
        >
          <mat-button-toggle value="all">All</mat-button-toggle>
          <mat-button-toggle value="approved">Approved only</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      @if (store.isLoading()) {
        <div class="flex justify-center py-16" data-testid="loading">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (store.hasError()) {
        <div class="flex items-center gap-2 py-6 text-red-700" data-testid="error">
          <mat-icon>error</mat-icon>
          <span>{{ store.error() }}</span>
        </div>
      } @else if (store.isEmpty()) {
        <div class="py-6 text-gray-500" data-testid="empty">
          No change orders match this filter.
        </div>
      } @else {
        <app-cumulative-cost-delta-chart [points]="store.cumulativeSeries()" />
      }
    </mat-card>
  `,
})
export class ChangeOrderDeltaPanelComponent implements OnInit {
  readonly projectId = input.required<string>();
  protected readonly store = inject(ChangeOrderDeltaStore);

  ngOnInit(): void {
    this.store.load(this.projectId());
  }

  protected onFilterChange(event: MatButtonToggleChange): void {
    this.store.setFilter(event.value as DeltaFilter);
  }
}
