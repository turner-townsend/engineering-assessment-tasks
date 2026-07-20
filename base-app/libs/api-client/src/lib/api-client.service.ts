import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CLIENT_CONFIG } from './api-client.config';
import type {
  BenchmarkComparison,
  ChangeOrder,
  ChangeOrderStatus,
  CostSnapshot,
  Milestone,
  Project,
  ProjectDetail,
} from './types';

/**
 * Typed client for the Project Controls Hub API.
 *
 * Types come from FastAPI OpenAPI export (`yarn api-client:generate`).
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CLIENT_CONFIG);

  private url(path: string): string {
    return `${this.config.baseUrl}${path}`;
  }

  listProjects(filters?: {
    region?: string;
    sector?: string;
    status?: string;
  }): Observable<Project[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters ?? {})) {
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<Project[]>(this.url('/projects'), { params });
  }

  getProject(projectId: string): Observable<ProjectDetail> {
    return this.http.get<ProjectDetail>(this.url(`/projects/${projectId}`));
  }

  getCostTrend(
    projectId: string,
    workPackageId?: string
  ): Observable<CostSnapshot[]> {
    let params = new HttpParams();
    if (workPackageId) {
      params = params.set('workPackageId', workPackageId);
    }
    return this.http.get<CostSnapshot[]>(
      this.url(`/projects/${projectId}/cost-trend`),
      { params }
    );
  }

  listMilestones(projectId: string): Observable<Milestone[]> {
    return this.http.get<Milestone[]>(
      this.url(`/projects/${projectId}/milestones`)
    );
  }

  getProjectBenchmarks(projectId: string): Observable<BenchmarkComparison[]> {
    return this.http.get<BenchmarkComparison[]>(
      this.url(`/projects/${projectId}/benchmarks`)
    );
  }

  listChangeOrders(
    projectId: string,
    status?: ChangeOrderStatus
  ): Observable<ChangeOrder[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<ChangeOrder[]>(
      this.url(`/projects/${projectId}/change-orders`),
      { params }
    );
  }
}
