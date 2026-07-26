import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type * as Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';
import type { ChangeOrder,  } from '@pch/domain';

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
  readonly points = input.required<ChangeOrder[]>();

  protected readonly options = computed<Highcharts.Options>(() => {
    const data = this.points();
    const categories = data.map((s) => s.raisedDate);
    return {
      chart: { type: 'line' },
      title: { text: 'Cost delta' },
      xAxis: { categories },
      yAxis: { title: { text: 'Cost' } },
      credits: { enabled: false },
      series: [
        { type: 'line', name: 'Date', data: data.map((s) => s.costDelta) }
      ],
    };
  });
}
