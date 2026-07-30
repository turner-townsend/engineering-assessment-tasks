import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { ApiClient } from '@pch/api-client';
import type { ChangeOrder } from '@pch/domain';

type Status = 'idle' | 'loading' | 'loaded' | 'error';

interface ProjectChangeOrderCostState {
  changeOrders: ChangeOrder[];
  filter: 'all' | 'approved';
  status: Status;
  error: string | null;
}

const initialState: ProjectChangeOrderCostState = {
  changeOrders: [],
  filter: 'all',
  status: 'idle',
  error: null,
};

export const ProjectChangeOrderCostStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isLoading: computed(() => store.status() === 'loading'),
    hasError: computed(() => store.status() === 'error'),
    allChangeOrders: computed(() => store.changeOrders()),
    approvedChangeOrders: computed(() =>
      store.changeOrders().filter((co) => co.status === 'approved'),
    ),
  })),
  withComputed((store) => ({
    selectedChangeOrders: computed(() =>
      store.filter() === 'approved'
        ? store.approvedChangeOrders()
        : store.allChangeOrders(),
    ),
    isEmpty: computed(() => {
      if (store.status() !== 'loaded') return false;
      const selected =
        store.filter() === 'approved'
          ? store.approvedChangeOrders()
          : store.allChangeOrders();
      return selected.length === 0;
    }),
  })),
  withComputed((store) => ({
    cumulativeCostDeltaSeries: computed(() => {
      const orders = store.selectedChangeOrders();

      const monthlyTotals = new Map<string, number>();
      for (const co of orders) {
        const month = co.raisedDate.slice(0, 7);
        monthlyTotals.set(
          month,
          (monthlyTotals.get(month) ?? 0) + co.costDelta,
        );
      }

      const sortedMonths = [...monthlyTotals.keys()].sort();
      let running = 0;
      return sortedMonths.map((month) => {
        running += monthlyTotals.get(month)!;
        return { month, cumulative: running };
      });
    }),
  })),
  withMethods((store, api = inject(ApiClient)) => ({
    load(projectId: string): void {
      patchState(store, { status: 'loading', error: null });
      api.listChangeOrders(projectId).subscribe({
        next: (changeOrders) =>
          patchState(store, { changeOrders, status: 'loaded' }),
        error: (err) =>
          patchState(store, {
            status: 'error',
            error: err?.message ?? 'Failed to load change orders',
          }),
      });
    },
    setFilter(filter: 'all' | 'approved'): void {
      patchState(store, { filter });
    },
  })),
);
