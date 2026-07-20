import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type * as Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';
import type { CostSnapshot } from '@pch/domain';

@Component({
  selector: 'app-cost-trend-chart',
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
export class CostTrendChartComponent {
  readonly snapshots = input.required<CostSnapshot[]>();

  protected readonly options = computed<Highcharts.Options>(() => {
    const data = this.snapshots();
    const categories = data.map((s) => s.periodMonth);
    return {
      chart: { type: 'line' },
      title: { text: 'Cost trend' },
      xAxis: { categories },
      yAxis: { title: { text: 'Cost' } },
      credits: { enabled: false },
      series: [
        { type: 'line', name: 'Baseline', data: data.map((s) => s.baselineCost) },
        { type: 'line', name: 'Forecast', data: data.map((s) => s.forecastCost) },
        { type: 'line', name: 'Actual', data: data.map((s) => s.actualCost) },
      ],
    };
  });
}
