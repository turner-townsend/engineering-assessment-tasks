import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatIconModule],
  template: `
    <mat-toolbar color="primary" class="flex items-center gap-3 shadow-md">
      <mat-icon>construction</mat-icon>
      <a routerLink="/" class="text-lg font-medium no-underline text-inherit">
        Project Controls Hub
      </a>
      <span class="flex-1"></span>
      <span class="text-sm opacity-80">Construction Consultancy</span>
    </mat-toolbar>

    <main class="mx-auto max-w-7xl p-4 md:p-6">
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent {}
