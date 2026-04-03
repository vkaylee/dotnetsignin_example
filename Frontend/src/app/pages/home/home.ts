// [Angular vs React — home.ts]
// This component renders the home page — only accessible when the user is authenticated
// (protected by authGuard in app.routes.ts).
//
// In React, you typically fetch data on mount with useEffect:
//   useEffect(() => {
//     checkAuth().then(...).catch(...);
//   }, []);
//
// In Angular, component lifecycle is handled through "lifecycle hook" interfaces and methods.
// implements OnInit → requires the class to define a ngOnInit() method.
// ngOnInit() runs AFTER the component is created and its inputs are bound.
// It is equivalent to useEffect(() => { ... }, []) with an empty dependency array.

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  // UI state signals.
  readonly loading = signal(true);          // Starts as true — waiting for the API response.
  readonly error = signal<string | null>(null);

  // authService is public so the template (home.html) can access it directly.
  // In React you'd call useContext(AuthContext) inside JSX — Angular uses a public service instead.
  constructor(public authService: AuthService) {}

  // ngOnInit(): Equivalent to useEffect(() => { ... }, []) in React.
  // Runs once after the component is initialized.
  // The ideal place to fetch data, call APIs, etc.
  ngOnInit(): void {
    // Call GET /auth/check to verify the stored token is still valid.
    // subscribe() — equivalent to .then().catch() on a Promise.
    this.authService.checkAuth().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Session expired. Please sign in again.');
        // Auto-logout after 2 seconds if the token has expired.
        setTimeout(() => this.authService.logout(), 2000);
      }
    });
  }

  /** Log out — delegates to AuthService which also redirects to /login. */
  onLogout(): void {
    this.authService.logout();
  }
}
