import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHighcharts } from 'highcharts-angular';
import { API_CLIENT_CONFIG } from '@pch/api-client';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHighcharts({
      instance: () => import('highcharts').then((m) => m.default ?? m),
    }),
    {
      provide: API_CLIENT_CONFIG,
      useValue: {
        baseUrl: environment.apiBaseUrl,
      },
    },
  ],
};
