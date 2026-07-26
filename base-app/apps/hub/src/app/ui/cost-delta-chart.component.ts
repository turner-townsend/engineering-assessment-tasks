import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type * as Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';
import { MonthlyTotal } from '../data-access/project-detail.store';

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
  readonly points = input.required<MonthlyTotal[]>();

  protected readonly options = computed<Highcharts.Options>(() => {
    const data = this.points();
    const categories = data.map((s) => s.month);
    return {
      chart: { type: 'line' },
      title: { text: 'Cumulative Cost delta' },
      xAxis: { categories },
      yAxis: { title: { text: 'Cumulative Cost' } },
      credits: { enabled: false },
      series: [
        { type: 'line', name: 'Date', data: data.map((s) => s.cumulativeDelta) }
      ],
    };
  });
}
