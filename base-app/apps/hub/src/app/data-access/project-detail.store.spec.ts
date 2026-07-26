import type { ChangeOrder } from '@pch/domain';
import {
  getCumulativeByMonth,
  getVisibleChangeOrders,
} from './project-detail.store';

describe('getVisibleChangeOrders', () => {
  it('keeps only the approved orders when the toggle is on', () => {
    const orders = [
      { id: '1', status: 'draft' },
      { id: '2', status: 'approved' },
      { id: '3', status: 'rejected' },
      { id: '4', status: 'approved' },
    ] as ChangeOrder[];

    expect(getVisibleChangeOrders(orders, true).map((o) => o.id)).toEqual([
      '2',
      '4',
    ]);
    expect(getVisibleChangeOrders(orders, false)).toEqual(orders);
  });
});

describe('getCumulativeByMonth', () => {
  it('totals each month and carries the running total forward', () => {
    const orders = [
      { raisedDate: '2026-03-05', costDelta: 50 },
      { raisedDate: '2026-01-10', costDelta: 100 },
      { raisedDate: '2026-01-28', costDelta: 400 },
    ] as ChangeOrder[];

    expect(getCumulativeByMonth(orders)).toEqual([
      { month: '2026-01', cumulativeDelta: 500 }, // 100 + 400
      { month: '2026-03', cumulativeDelta: 550 }, // 500 + 50
    ]);
  });
});
