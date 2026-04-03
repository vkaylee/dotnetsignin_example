// [Angular vs React — app.config.ts]
// In React (Vite/CRA) you wrap <App /> in <BrowserRouter> to enable routing.
// In Angular there is no JSX, so all app-level configuration (router, HTTP client, etc.)
// is declared here and passed into bootstrapApplication() inside main.ts.
// Think of this file as the central dependency-injection container of the application.

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

// provideRouter: Equivalent to <BrowserRouter> + <Routes> in React Router.
import { provideRouter } from '@angular/router';

// provideHttpClient: Registers Angular's built-in HTTP client (similar to axios or fetch).
// withInterceptors: Attaches interceptors to the HTTP pipeline.
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// authInterceptor: Automatically attaches the JWT Bearer token to every outgoing HTTP request.
// In React you typically handle this with an axios request interceptor.
import { authInterceptor } from './interceptors/auth.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Catches unhandled browser-level errors globally (similar to React's ErrorBoundary).
    provideBrowserGlobalErrorListeners(),

    // Registers all routes defined in app.routes.ts.
    provideRouter(routes),

    // Registers HttpClient with authInterceptor applied to every request.
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
