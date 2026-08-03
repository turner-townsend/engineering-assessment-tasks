import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ProjectDetailStore } from '../../data-access/project-detail.store';
import { CostTrendChartComponent } from '../../ui/cost-trend-chart.component';
import { CostDeltaByMonthChartComponent } from '../../ui/cost-delta-by-month-chart.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DecimalPipe,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    CostTrendChartComponent,
    CostDeltaByMonthChartComponent,
  ],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  readonly projectId = input.required<string>();
  protected readonly store = inject(ProjectDetailStore);
  protected readonly milestoneCols = ['name', 'planned', 'rag'];

  ngOnInit(): void {
    this.store.load(this.projectId());
  }
}
