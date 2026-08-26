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

export type DeltaFilter = 'all' | 'approved';

export interface CumulativePoint {
  month: string;
  monthlyDelta: number;
  cumulative: number;
}

interface ChangeOrderDeltaState {
  changeOrders: ChangeOrder[];
  filter: DeltaFilter;
  status: Status;
  error: string | null;
}

const initialState: ChangeOrderDeltaState = {
  changeOrders: [],
  filter: 'all',
  status: 'idle',
  error: null,
};

/** Months between two 'YYYY-MM' keys, inclusive, so gaps become flat segments. */
function monthRange(first: string, last: string): string[] {
  const months: string[] = [];
  let [year, month] = first.split('-').map(Number);
  const [endYear, endMonth] = last.split('-').map(Number);

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

function buildSeries(orders: ChangeOrder[]): CumulativePoint[] {
  if (orders.length === 0) {
    return [];
  }

  const totals = new Map<string, number>();
  for (const order of orders) {
    // Slice rather than parse: new Date('2025-03-01') is UTC and can shift the
    // month west of Greenwich.
    const month = order.raisedDate.slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + order.costDelta);
  }

  const months = [...totals.keys()].sort();
  let cumulative = 0;

  return monthRange(months[0], months[months.length - 1]).map((month) => {
    const monthlyDelta = totals.get(month) ?? 0;
    cumulative += monthlyDelta;
    return { month, monthlyDelta, cumulative };
  });
}

export const ChangeOrderDeltaStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => {
    const filteredOrders = computed(() =>
      store.filter() === 'approved'
        ? store.changeOrders().filter((co) => co.status === 'approved')
        : store.changeOrders()
    );

    return {
      filteredOrders,
      isLoading: computed(() => store.status() === 'loading'),
      hasError: computed(() => store.status() === 'error'),
      isEmpty: computed(
        () => store.status() === 'loaded' && filteredOrders().length === 0
      ),
      cumulativeSeries: computed(() => buildSeries(filteredOrders())),
    };
  }),
  withMethods((store, api = inject(ApiClient)) => ({
    load(projectId: string): void {
      patchState(store, {
        status: 'loading',
        error: null,
        changeOrders: [],
      });
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

    setFilter(filter: DeltaFilter): void {
      patchState(store, { filter });
    },
  }))
);
