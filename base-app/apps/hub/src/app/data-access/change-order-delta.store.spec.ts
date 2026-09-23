import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ApiClient } from '@pch/api-client';
import type { ChangeOrder, ChangeOrderStatus } from '@pch/domain';
import { ChangeOrderDeltaStore } from './change-order-delta.store';

let seq = 0;

function order(
  raisedDate: string,
  status: ChangeOrderStatus,
  costDelta: number
): ChangeOrder {
  seq += 1;
  return {
    id: `co-${seq}`,
    reference: `CO-${String(seq).padStart(3, '0')}`,
    title: `Change ${seq}`,
    status,
    costDelta,
    scheduleDeltaDays: 0,
    raisedDate,
  };
}

// Riverside Hospital Expansion, from contracts/seed-data.json. Note the gap at
// 2025-02, and that approved orders skip 2025-04, 2025-06, and 2025-08.
const RIVERSIDE: ChangeOrder[] = [
  order('2025-01-10', 'submitted', 4_500_000),
  order('2025-03-01', 'approved', 2_500_000),
  order('2025-04-10', 'submitted', 1_200_000),
  order('2025-05-01', 'approved', 2_500_000),
  order('2025-06-10', 'submitted', 120_000),
  order('2025-07-01', 'approved', 2_100_000),
  order('2025-08-10', 'submitted', 200_000),
  order('2025-09-01', 'approved', 500_000),
];

function configure(api: Partial<ApiClient>) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: ApiClient, useValue: api },
    ],
  });
  return TestBed.inject(ChangeOrderDeltaStore);
}

describe('ChangeOrderDeltaStore', () => {
  it('accumulates every change order by month, carrying empty months forward', () => {
    const store = configure({ listChangeOrders: () => of(RIVERSIDE) });

    store.load('p1');

    expect(store.status()).toBe('loaded');
    expect(store.cumulativeSeries().map((p) => p.month)).toEqual([
      '2025-01',
      '2025-02',
      '2025-03',
      '2025-04',
      '2025-05',
      '2025-06',
      '2025-07',
      '2025-08',
      '2025-09',
    ]);
    expect(store.cumulativeSeries().map((p) => p.cumulative)).toEqual([
      4_500_000, 4_500_000, 7_000_000, 8_200_000, 10_700_000, 10_820_000,
      12_920_000, 13_120_000, 13_620_000,
    ]);
    expect(store.cumulativeSeries()[1].monthlyDelta).toBe(0);
  });

  it('recomputes from approved orders only when the filter changes', () => {
    const store = configure({ listChangeOrders: () => of(RIVERSIDE) });

    store.load('p1');
    store.setFilter('approved');

    expect(store.filteredOrders().length).toBe(4);
    expect(store.cumulativeSeries().map((p) => p.month)).toEqual([
      '2025-03',
      '2025-04',
      '2025-05',
      '2025-06',
      '2025-07',
      '2025-08',
      '2025-09',
    ]);
    expect(store.cumulativeSeries().map((p) => p.cumulative)).toEqual([
      2_500_000, 2_500_000, 5_000_000, 5_000_000, 7_100_000, 7_100_000,
      7_600_000,
    ]);
  });

  it('spans a year boundary', () => {
    const store = configure({
      listChangeOrders: () =>
        of([
          order('2024-11-05', 'approved', 100),
          order('2025-01-05', 'approved', 50),
        ]),
    });

    store.load('p1');

    expect(store.cumulativeSeries()).toEqual([
      { month: '2024-11', monthlyDelta: 100, cumulative: 100 },
      { month: '2024-12', monthlyDelta: 0, cumulative: 100 },
      { month: '2025-01', monthlyDelta: 50, cumulative: 150 },
    ]);
  });

  it('flags an empty result and draws nothing', () => {
    const store = configure({ listChangeOrders: () => of([]) });

    store.load('p1');

    expect(store.isEmpty()).toBe(true);
    expect(store.cumulativeSeries()).toEqual([]);
  });

  it('flags empty when the filter excludes every order', () => {
    const store = configure({
      listChangeOrders: () => of([order('2025-01-10', 'submitted', 1000)]),
    });

    store.load('p1');
    store.setFilter('approved');

    expect(store.isEmpty()).toBe(true);
    expect(store.cumulativeSeries()).toEqual([]);
  });

  it('keeps a series whose deltas cancel out', () => {
    const store = configure({
      listChangeOrders: () =>
        of([
          order('2025-01-10', 'approved', 1000),
          order('2025-02-10', 'approved', -1000),
        ]),
    });

    store.load('p1');

    expect(store.isEmpty()).toBe(false);
    expect(store.cumulativeSeries().map((p) => p.cumulative)).toEqual([1000, 0]);
  });

  it('captures errors', () => {
    const store = configure({
      listChangeOrders: () => throwError(() => new Error('boom')),
    });

    store.load('p1');

    expect(store.hasError()).toBe(true);
    expect(store.error()).toBe('boom');
  });

  it('drops the previous project orders when loading another', () => {
    const api = {
      listChangeOrders: (projectId: string) =>
        of(
          projectId === 'p1'
            ? RIVERSIDE
            : [order('2024-02-01', 'approved', 8_000_000)]
        ),
    };
    const store = configure(api as Partial<ApiClient>);

    store.load('p1');
    store.load('p2');

    expect(store.changeOrders().length).toBe(1);
    expect(store.cumulativeSeries()).toEqual([
      { month: '2024-02', monthlyDelta: 8_000_000, cumulative: 8_000_000 },
    ]);
  });
});
