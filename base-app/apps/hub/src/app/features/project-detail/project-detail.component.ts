import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  effect,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ProjectDetailStore } from '../../data-access/project-detail.store';
import { CostTrendChartComponent } from '../../ui/cost-trend-chart.component';
import { ProjectChangeOrderCostStore } from '../../data-access/project-change-order-cost.store';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CostDeltaChartComponent } from '../../ui/cost-delta-chart.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DecimalPipe,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    CostTrendChartComponent,
    MatButtonToggleModule,
    CostDeltaChartComponent,
  ],
  template: `
    <a routerLink="/" mat-button class="mb-3">
      <mat-icon>arrow_back</mat-icon>
      Portfolio
    </a>

    @if (store.isLoading()) {
      <div class="flex justify-center py-16" data-testid="loading">
        <mat-spinner diameter="48"></mat-spinner>
      </div>
    } @else if (store.hasError()) {
      <mat-card class="p-6 text-red-700" data-testid="error">
        {{ store.error() }}
      </mat-card>
    } @else if (store.project(); as project) {
      <header class="mb-4">
        <h1 class="text-2xl font-semibold">{{ project.name }}</h1>
        <p class="text-gray-500">
          {{ project.sector }} &middot; {{ project.region }} &middot;
          {{ project.status }}
        </p>
      </header>

      <section class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <mat-card class="p-4">
          <div class="text-xs uppercase text-gray-500">Baseline</div>
          <div class="text-xl font-semibold">
            {{ project.baselineCost | number: '1.0-0' }}
          </div>
        </mat-card>
        <mat-card class="p-4">
          <div class="text-xs uppercase text-gray-500">Actual to date</div>
          <div class="text-xl font-semibold">
            {{ project.actualCostToDate | number: '1.0-0' }}
          </div>
        </mat-card>
        <mat-card class="p-4">
          <div class="text-xs uppercase text-gray-500">Cost variance</div>
          <div
            class="text-xl font-semibold"
            [class.text-red-600]="project.costVariance > 0"
            [class.text-green-600]="project.costVariance <= 0"
          >
            {{ project.costVariance | number: '1.0-0' }}
          </div>
        </mat-card>
        <mat-card class="p-4">
          <div class="text-xs uppercase text-gray-500">Schedule slip</div>
          <div class="text-xl font-semibold">
            {{ project.scheduleSlippageDays }} days
          </div>
        </mat-card>
      </section>

      <section class="mb-6">
        <mat-card class="p-4">
          <app-cost-trend-chart [snapshots]="store.costTrend()" />
        </mat-card>
      </section>

      <section class="mb-6">
        <mat-card class="p-4">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-medium">Change-order cost delta</h2>
            <mat-button-toggle-group
              [value]="changeOrderCostStore.filter()"
              (change)="changeOrderCostStore.setFilter($event.value)"
            >
              <mat-button-toggle value="all">All</mat-button-toggle>
              <mat-button-toggle value="approved"
                >Approved only</mat-button-toggle
              >
            </mat-button-toggle-group>
          </div>

          @if (changeOrderCostStore.isLoading()) {
            <div class="flex justify-center py-8" data-testid="co-loading">
              <mat-spinner diameter="36"></mat-spinner>
            </div>
          } @else if (changeOrderCostStore.hasError()) {
            <div class="text-red-700" data-testid="co-error">
              {{ changeOrderCostStore.error() }}
            </div>
          } @else if (changeOrderCostStore.isEmpty()) {
            <div class="text-gray-500" data-testid="co-empty">
              No change orders.
            </div>
          } @else {
            <app-cost-delta-chart
              [changeOrders]="changeOrderCostStore.selectedChangeOrders()"
            />
          }
        </mat-card>
      </section>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <mat-card class="p-4">
          <h2 class="mb-3 text-lg font-medium">Schedule milestones</h2>
          <table mat-table [dataSource]="store.milestones()" class="w-full">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Milestone</th>
              <td mat-cell *matCellDef="let m">{{ m.name }}</td>
            </ng-container>
            <ng-container matColumnDef="planned">
              <th mat-header-cell *matHeaderCellDef>Planned</th>
              <td mat-cell *matCellDef="let m">{{ m.plannedDate }}</td>
            </ng-container>
            <ng-container matColumnDef="rag">
              <th mat-header-cell *matHeaderCellDef>RAG</th>
              <td mat-cell *matCellDef="let m">
                <span
                  class="inline-block h-3 w-3 rounded-full"
                  [class.bg-red-500]="m.ragStatus === 'red'"
                  [class.bg-amber-500]="m.ragStatus === 'amber'"
                  [class.bg-green-500]="m.ragStatus === 'green'"
                ></span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="milestoneCols"></tr>
            <tr mat-row *matRowDef="let row; columns: milestoneCols"></tr>
          </table>
        </mat-card>

        <mat-card class="p-4">
          <h2 class="mb-3 text-lg font-medium">Benchmarks vs peers</h2>
          @for (b of store.benchmarks(); track b.metricKey) {
            <div class="mb-3 border-b pb-2 last:border-0">
              <div class="flex justify-between text-sm">
                <span class="font-medium">{{ b.metricKey }}</span>
                <span class="text-gray-500">{{ b.unit }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Project: {{ b.projectValue | number: '1.0-2' }}</span>
                <span>Peer median: {{ b.peerMedian | number: '1.0-2' }}</span>
              </div>
              <div class="text-xs text-gray-500">
                Position: {{ b.position }}
              </div>
            </div>
          }
        </mat-card>
      </div>
    }
  `,
})
export class ProjectDetailComponent implements OnInit {
  readonly projectId = input.required<string>();
  protected readonly store = inject(ProjectDetailStore);
  protected readonly changeOrderCostStore = inject(ProjectChangeOrderCostStore);
  protected readonly milestoneCols = ['name', 'planned', 'rag'];

  ngOnInit(): void {
    this.store.load(this.projectId());
    this.changeOrderCostStore.load(this.projectId());
  }

  constructor() {
    effect(() => {
      console.log('[CO] all:', this.changeOrderCostStore.allChangeOrders());
      console.log(
        '[CO] approved:',
        this.changeOrderCostStore.approvedChangeOrders(),
      );
    });
  }
}
