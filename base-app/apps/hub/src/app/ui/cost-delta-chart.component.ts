import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type * as Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';

export interface CumulativeCostDeltaPoint {
  month: string;
  cumulative: number;
}

@Component({
  selector: 'app-cost-delta-chart',
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
export class CostDeltaChartComponent {
  readonly series = input.required<CumulativeCostDeltaPoint[]>();

  protected readonly options = computed<Highcharts.Options>(() => {
    const data = this.series();
    const categories = data.map((p) => p.month);
    return {
      chart: { type: 'line' },
      title: { text: 'Cumulative cost delta by month' },
      xAxis: { categories },
      yAxis: { title: { text: 'Cumulative cost delta by month' } },
      credits: { enabled: false },
      series: [
        {
          type: 'line',
          name: 'Cumulative cost delta by month',
          data: data.map((p) => p.cumulative),
        },
      ],
    };
  });
}
