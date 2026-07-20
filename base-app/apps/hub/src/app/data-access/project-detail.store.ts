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
} from '@pch/domain';

type Status = 'idle' | 'loading' | 'loaded' | 'error';

interface ProjectDetailState {
  project: ProjectDetail | null;
  costTrend: CostSnapshot[];
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
  status: 'idle',
  error: null,
};

export const ProjectDetailStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isLoading: computed(() => store.status() === 'loading'),
    hasError: computed(() => store.status() === 'error'),
  })),
  withMethods((store, api = inject(ApiClient)) => ({
    load(projectId: string): void {
      patchState(store, { status: 'loading', error: null });
      forkJoin({
        project: api.getProject(projectId),
        costTrend: api.getCostTrend(projectId),
        milestones: api.listMilestones(projectId),
        benchmarks: api.getProjectBenchmarks(projectId),
      }).subscribe({
        next: (result) => patchState(store, { ...result, status: 'loaded' }),
        error: (err) =>
          patchState(store, {
            status: 'error',
            error: err?.message ?? 'Failed to load project',
          }),
      });
    },
  }))
);
