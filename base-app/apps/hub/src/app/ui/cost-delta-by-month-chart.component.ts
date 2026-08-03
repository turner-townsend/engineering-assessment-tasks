import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type * as Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';

interface CumulativePoint {
  month: string;
  cumulative: number;
}

@Component({
  selector: 'app-cost-delta-by-month-chart',
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
export class CostDeltaByMonthChartComponent {
  readonly orders = input.required<CumulativePoint[]>();

  protected readonly options = computed<Highcharts.Options>(() => {
    const categories = this.orders().map((d) => d.month);
    const seriesData = this.orders().map((d) => d.cumulative);

    return {
      chart: { type: 'line' },
      title: { text: 'Cumulative Cost Delta by Month' },
      xAxis: { categories },
      yAxis: { title: { text: 'Cumulative Cost Delta (£)' } },
      credits: { enabled: false },
      series: [
        { type: 'line', name: 'Cumulative Cost Delta', data: seriesData },
      ],
    };
  });
}