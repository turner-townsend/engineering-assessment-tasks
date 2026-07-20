import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ApiClient } from '@pch/api-client';
import type { Project } from '@pch/domain';
import { PortfolioStore } from './portfolio.store';

const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Alpha',
    region: 'UK',
    sector: 'Healthcare',
    status: 'in_delivery',
    startDate: '2025-01-01',
    plannedEndDate: '2027-01-01',
    baselineCost: 1000,
    currency: 'GBP',
  },
  {
    id: 'p2',
    name: 'Beta',
    region: 'EU',
    sector: 'Transport',
    status: 'planning',
    startDate: '2025-01-01',
    plannedEndDate: '2027-01-01',
    baselineCost: 500,
    currency: 'EUR',
  },
];

function configure(api: Partial<ApiClient>) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: ApiClient, useValue: api },
    ],
  });
  return TestBed.inject(PortfolioStore);
}

describe('PortfolioStore', () => {
  it('loads projects and computes total baseline cost', () => {
    const store = configure({ listProjects: () => of(PROJECTS) });

    store.loadProjects();

    expect(store.status()).toBe('loaded');
    expect(store.projects().length).toBe(2);
    expect(store.totalBaselineCost()).toBe(1500);
    expect(store.isEmpty()).toBe(false);
  });

  it('flags empty result set', () => {
    const store = configure({ listProjects: () => of([]) });

    store.loadProjects();

    expect(store.isEmpty()).toBe(true);
  });

  it('captures errors', () => {
    const store = configure({
      listProjects: () => throwError(() => new Error('boom')),
    });

    store.loadProjects();

    expect(store.status()).toBe('error');
    expect(store.error()).toBe('boom');
  });
});
