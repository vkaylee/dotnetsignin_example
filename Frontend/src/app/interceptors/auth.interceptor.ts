// [Angular vs React — auth.interceptor.ts]
// In React you typically configure axios to auto-attach the token:
//   axios.interceptors.request.use(config => {
//     config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   });
//
// Angular has an equivalent mechanism built into HttpClient called an "Interceptor".
// Instead of patching every individual request, the interceptor handles ALL requests automatically.

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP interceptor — automatically attaches the JWT Bearer token
 * to every outgoing HTTP request (when a token exists in storage).
 *
 * This interceptor is registered globally in app.config.ts via withInterceptors(),
 * so it runs for EVERY request made by HttpClient anywhere in the application.
 *
 * @param req  - The original request object (immutable — cannot be mutated directly).
 * @param next - Forwards the request to the next step in the HTTP pipeline.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    // Requests are immutable in Angular — clone() before modifying.
    // Equivalent to object spreading in React: { ...config, headers: { ... } }
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    // Forward the cloned request (with token) to the server.
    return next(clonedReq);
  }

  // No token — forward the original request unchanged.
  return next(req);
};
