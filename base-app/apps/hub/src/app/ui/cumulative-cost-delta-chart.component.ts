import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type * as Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';
import type { CumulativePoint } from '../data-access/change-order-delta.store';

@Component({
  selector: 'app-cumulative-cost-delta-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HighchartsChartComponent],
  template: `
    <highcharts-chart
      [options]="options()"
      style="width: 100%; height: 320px; display: block;"
    ></highcharts-chart>
  `,
})
export class CumulativeCostDeltaChartComponent {
  readonly points = input.required<CumulativePoint[]>();

  protected readonly options = computed<Highcharts.Options>(() => {
    const data = this.points();
    return {
      chart: { type: 'line' },
      title: { text: undefined },
      xAxis: { categories: data.map((p) => p.month) },
      yAxis: { title: { text: 'Cumulative cost delta' } },
      credits: { enabled: false },
      legend: { enabled: false },
      series: [
        {
          type: 'line',
          name: 'Cumulative cost delta',
          data: data.map((p) => p.cumulative),
        },
      ],
    };
  });
}
