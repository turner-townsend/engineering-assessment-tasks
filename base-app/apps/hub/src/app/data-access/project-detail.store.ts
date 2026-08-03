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
  ChangeOrder,
  ChangeOrderStatus,
  CostSnapshot,
  Milestone,
  ProjectDetail,
} from '@pch/domain';

type Status = 'idle' | 'loading' | 'loaded' | 'error';
type ChangeOrderFilter = ChangeOrderStatus | 'all';

interface ProjectDetailState {
  project: ProjectDetail | null;
  costTrend: CostSnapshot[];
  milestones: Milestone[];
  benchmarks: BenchmarkComparison[];
  changeOrders: ChangeOrder[];
  selectedChangeOrderStatus: ChangeOrderFilter;
  status: Status;
  error: string | null;
}

const initialState: ProjectDetailState = {
  project: null,
  costTrend: [],
  milestones: [],
  benchmarks: [],
  changeOrders: [],
  selectedChangeOrderStatus: 'all',
  status: 'idle',
  error: null,
};

function filterChangeOrders(
  orders: ChangeOrder[],
  status: ChangeOrderFilter
): ChangeOrder[] {
  if (status === 'all') {
    return orders;
  }
  return orders.filter((order) => order.status === status);
}

function toCumulativeByMonth(
  orders: ChangeOrder[]
): { month: string; cumulative: number }[] {
  const grouped = orders.reduce((acc, order) => {
    const month = order.raisedDate.slice(0, 7);
    acc[month] = (acc[month] ?? 0) + order.costDelta;
    return acc;
  }, {} as Record<string, number>);

  const sortedMonths = Object.keys(grouped).sort();

  let running = 0;
  return sortedMonths.map((month) => {
    running += grouped[month];
    return { month, cumulative: running };
  });
}

export const ProjectDetailStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isLoading: computed(() => store.status() === 'loading'),
    hasError: computed(() => store.status() === 'error'),
    cumulativeByMonth: computed(() =>
      toCumulativeByMonth(
        filterChangeOrders(store.changeOrders(), store.selectedChangeOrderStatus())
      )
    ),
    filteredChangeOrders: computed(() => {
      return filterChangeOrders(
        store.changeOrders(),
        store.selectedChangeOrderStatus()
      );
    }),
    
  })),
  withMethods((store, api = inject(ApiClient)) => ({
    load(projectId: string): void {
      patchState(store, { status: 'loading', error: null });
      forkJoin({
        project: api.getProject(projectId),
        costTrend: api.getCostTrend(projectId),
        milestones: api.listMilestones(projectId),
        benchmarks: api.getProjectBenchmarks(projectId),
        changeOrders: api.listChangeOrders(projectId),
      }).subscribe({
        next: (result) => patchState(store, { ...result, status: 'loaded' }),
        error: (err) =>
          patchState(store, {
            status: 'error',
            error: err?.message ?? 'Failed to load project',
          }),
      });
    },

    setChangeOrderStatusFilter(status: string): void {
      const allowedStatuses: readonly ChangeOrderFilter[] = [
        'all',
        'approved',
      ];
      if (allowedStatuses.includes(status as ChangeOrderFilter)) {
        patchState(store, {
          selectedChangeOrderStatus: status as ChangeOrderFilter,
        });
      }
    },
  }))
);
