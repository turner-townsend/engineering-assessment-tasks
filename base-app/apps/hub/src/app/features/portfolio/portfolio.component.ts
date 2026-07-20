import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { PortfolioStore } from '../../data-access/portfolio.store';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DecimalPipe,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule,
  ],
  template: `
    <header class="mb-4 flex items-baseline justify-between">
      <h1 class="text-2xl font-semibold">Project Portfolio</h1>
      @if (store.status() === 'loaded') {
        <span class="text-sm text-gray-500">
          Total baseline: {{ store.totalBaselineCost() | number: '1.0-0' }}
        </span>
      }
    </header>

    @if (store.isLoading()) {
      <div class="flex justify-center py-16" data-testid="loading">
        <mat-spinner diameter="48"></mat-spinner>
      </div>
    } @else if (store.error()) {
      <mat-card class="p-6" data-testid="error">
        <div class="flex items-center gap-2 text-red-700">
          <mat-icon>error</mat-icon>
          <span>{{ store.error() }}</span>
        </div>
      </mat-card>
    } @else if (store.isEmpty()) {
      <mat-card class="p-6 text-gray-500" data-testid="empty">
        No projects found.
      </mat-card>
    } @else {
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        @for (project of store.projects(); track project.id) {
          <a
            [routerLink]="['/projects', project.id]"
            class="no-underline"
            data-testid="project-card"
          >
            <mat-card class="h-full transition-shadow hover:shadow-lg">
              <mat-card-header>
                <mat-card-title>{{ project.name }}</mat-card-title>
                <mat-card-subtitle>
                  {{ project.sector }} &middot; {{ project.region }}
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content class="mt-2">
                <div class="text-sm text-gray-600">
                  Baseline:
                  {{ project.baselineCost | number: '1.0-0' }}
                  {{ project.currency }}
                </div>
                <mat-chip-set class="mt-3">
                  <mat-chip>{{ project.status }}</mat-chip>
                </mat-chip-set>
              </mat-card-content>
            </mat-card>
          </a>
        }
      </div>
    }
  `,
})
export class PortfolioComponent implements OnInit {
  protected readonly store = inject(PortfolioStore);

  ngOnInit(): void {
    this.store.loadProjects();
  }
}
