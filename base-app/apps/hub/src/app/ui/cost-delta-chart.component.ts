import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type * as Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';
import type { ChangeOrder } from '@pch/domain';

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
  readonly changeOrders = input.required<ChangeOrder[]>();

  protected readonly options = computed<Highcharts.Options>(() => {
    const data = this.changeOrders();
    const categories = data.map((co) => co.raisedDate);
    return {
      chart: { type: 'line' },
      title: { text: 'Change-order cost delta' },
      xAxis: { categories },
      yAxis: { title: { text: 'Cost delta' } },
      credits: { enabled: false },
      series: [
        {
          type: 'line',
          name: 'Cost delta',
          data: data.map((co) => co.costDelta),
        },
      ],
    };
  });
}
