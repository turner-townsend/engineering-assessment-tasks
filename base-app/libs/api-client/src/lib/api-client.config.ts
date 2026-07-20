import { InjectionToken } from '@angular/core';

export interface ApiClientConfig {
  /** Base URL of the Project Controls Hub API, e.g. http://localhost:8000 */
  baseUrl: string;
}

export const API_CLIENT_CONFIG = new InjectionToken<ApiClientConfig>(
  'API_CLIENT_CONFIG'
);
