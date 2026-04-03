// [Angular vs React — auth.guard.ts]
// In React you typically create a <PrivateRoute> wrapper component:
//   <Route path="/home" element={isLoggedIn ? <Home /> : <Navigate to="/login" />} />
//
// In Angular, a "Guard" is a function (or class) that runs BEFORE a component is loaded.
// Angular asks the guard: "Is this user allowed to enter?" before rendering anything.

import { inject } from '@angular/core';

// CanActivateFn: The type signature for a functional guard.
// Router     : Used to build a redirect URL when the user is not authorized.
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Functional route guard — protects routes that require authentication.
 * Redirects to /login if no JWT token is present in storage.
 *
 * [Angular vs React]
 * inject() retrieves a service inside a plain function (outside a class constructor).
 * Equivalent to useContext() in React — reading a value from a global provider.
 */
export const authGuard: CanActivateFn = () => {
  // inject() — pulls the AuthService singleton from Angular's DI container.
  // Angular creates and manages service instances automatically (singleton by default).
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Return true → Angular proceeds to load the component.
    return true;
  }

  // Return a UrlTree → Angular performs the redirect WITHOUT loading the original component.
  return router.createUrlTree(['/login']);
};
