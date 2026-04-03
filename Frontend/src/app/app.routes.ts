// [Angular vs React — app.routes.ts]
// In React Router you declare routes with JSX:
//   <Route path="/home" element={<Home />} />
//
// In Angular, routes are declared as a plain JavaScript array (no JSX).
// This array is passed into provideRouter() inside app.config.ts.

import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { HomeComponent } from './pages/home/home';

// authGuard: Protects routes that require authentication.
// Equivalent to the PrivateRoute / ProtectedRoute pattern in React Router.
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // path    : URL segment (no leading '/').
  // component: The component rendered when the URL matches.
  { path: 'login', component: LoginComponent },

  // canActivate: Array of guards that run BEFORE the component is loaded.
  // If a guard returns false or a redirect — the user cannot enter this route.
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },

  // Redirect: empty URL '' → '/home'.
  // pathMatch: 'full' ensures this only matches when the URL is EXACTLY '' (not just a prefix).
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Wildcard '**': Catches every URL that didn't match above → redirect to /login.
  // Equivalent to the catch-all * route in React Router v6.
  { path: '**', redirectTo: '/login' }
];
