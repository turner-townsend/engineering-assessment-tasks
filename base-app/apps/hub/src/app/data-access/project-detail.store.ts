import { computed, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { ApiClient } from '@pch/api-client';
import type {
  BenchmarkComparison,
  CostSnapshot,
  Milestone,
  ProjectDetail,
  ChangeOrder
} from '@pch/domain';

type Status = 'idle' | 'loading' | 'loaded' | 'error';

interface ProjectDetailState {
  project: ProjectDetail | null;
  costTrend: CostSnapshot[];
  costDelta: ChangeOrder[];
  showOnlyApproved: boolean;
  milestones: Milestone[];
  benchmarks: BenchmarkComparison[];
  status: Status;
  error: string | null;
}

const initialState: ProjectDetailState = {
  project: null,
  costTrend: [],
  milestones: [],
  benchmarks: [],
  costDelta: [],
  showOnlyApproved: false, 
  status: 'idle',
  error: null,
};

export function isApproved(order: ChangeOrder): boolean {
  return order.status === 'approved';
}

export function getVisibleChangeOrders(
  orders: ChangeOrder[],
  showOnlyApproved: boolean
): ChangeOrder[] {
  if (showOnlyApproved) {
    return orders.filter(isApproved);
  }
  return orders;
}

export const ProjectDetailStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isLoading: computed(() => store.status() === 'loading'),
    hasError: computed(() => store.status() === 'error'),
    visibleCostDelta: computed(() =>
      getVisibleChangeOrders(store.costDelta(), store.showOnlyApproved())
    ),
  })),
  withMethods((store, api = inject(ApiClient)) => ({
    load(projectId: string): void {
      patchState(store, { status: 'loading', error: null });
      forkJoin({
        project: api.getProject(projectId),
        costTrend: api.getCostTrend(projectId),
        milestones: api.listMilestones(projectId),
        benchmarks: api.getProjectBenchmarks(projectId),
        costDelta: api.listChangeOrders(projectId),
      }).subscribe({
        next: (result) => patchState(store, { ...result, status: 'loaded' }),
        error: (err) =>
          patchState(store, {
            status: 'error',
            error: err?.message ?? 'Failed to load project',
          }),
      });
    },
    
    setCostDeltaFilter(showOnlyApproved: boolean): void {
      patchState(store, { showOnlyApproved });
    },  
  }))
);
