import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { ApiClient } from '@pch/api-client';
import type { Project } from '@pch/domain';

type Status = 'idle' | 'loading' | 'loaded' | 'error';

interface PortfolioState {
  projects: Project[];
  status: Status;
  error: string | null;
  regionFilter: string | null;
}

const initialState: PortfolioState = {
  projects: [],
  status: 'idle',
  error: null,
  regionFilter: null,
};

export const PortfolioStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isLoading: computed(() => store.status() === 'loading'),
    isEmpty: computed(
      () => store.status() === 'loaded' && store.projects().length === 0
    ),
    totalBaselineCost: computed(() =>
      store.projects().reduce((sum, p) => sum + p.baselineCost, 0)
    ),
  })),
  withMethods((store, api = inject(ApiClient)) => ({
    loadProjects(region?: string): void {
      patchState(store, {
        status: 'loading',
        error: null,
        regionFilter: region ?? null,
      });
      api.listProjects(region ? { region } : undefined).subscribe({
        next: (projects) => patchState(store, { projects, status: 'loaded' }),
        error: (err) =>
          patchState(store, {
            status: 'error',
            error: err?.message ?? 'Failed to load projects',
          }),
      });
    },
  }))
);
