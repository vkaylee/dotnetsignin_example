// [Angular vs React — login.ts]
// This component handles both the Login and Register screens (combined into one component).
//
// In React, a functional component looks like:
//   function LoginPage() {
//     const [mode, setMode] = useState('login');
//     const [email, setEmail] = useState('');
//     ...
//     return <form onSubmit={handleSubmit}>...</form>;
//   }
//
// In Angular, a component is a CLASS. Its HTML template lives in a separate file (login.html).
// State is managed with signal() instead of useState().

import { Component, signal } from '@angular/core';

// CommonModule: Provides built-in template directives such as @if and @for.
// (Angular 17+ has @if/@for built-in without needing CommonModule,
//  but it is still required for directives like [ngClass], [ngStyle], etc.)
import { CommonModule } from '@angular/common';

// FormsModule: Required to use [(ngModel)] — Angular's two-way data binding syntax.
// [(ngModel)]="email" is equivalent to:
//   value={email} onChange={e => setEmail(e.target.value)} in React.
import { FormsModule } from '@angular/forms';

// Router: Used for programmatic navigation — equivalent to useNavigate() in React Router.
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  // selector: The HTML tag name used to embed this component. e.g. <app-login />
  selector: 'app-login',

  // imports: Declare which modules/components are needed inside THIS component's template.
  // Angular does not auto-detect what you use — you must list them explicitly.
  imports: [CommonModule, FormsModule],

  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  // signal<'login' | 'register'>: Reactive state with a union type.
  // Read  : this.mode()           ← must be called as a function
  // Update: this.mode.set('register')  or  this.mode.update(m => ...)
  /** Toggles between 'login' and 'register' mode. */
  readonly mode = signal<'login' | 'register'>('login');

  // Plain class properties — kept in sync with the user's input via [(ngModel)] two-way binding.
  // No need for signal here because these values don't drive any derived/computed state.
  email = '';
  password = '';
  confirmPassword = '';

  /** UI state flags */
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // constructor: Angular automatically injects AuthService and Router (Dependency Injection).
  // Equivalent to: const authService = useContext(AuthContext) in React.
  // The key difference: Angular uses a class + DI container, not React Context.
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /** Switch between the login and register forms. */
  toggleMode(): void {
    // signal.update(): Receives a function with the previous value, returns the next value.
    // Equivalent to: setMode(prev => prev === 'login' ? 'register' : 'login') in React.
    this.mode.update(m => m === 'login' ? 'register' : 'login');
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  /** Handle form submission — calls login or register depending on the current mode. */
  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.email || !this.password) {
      this.errorMessage.set('Email and password are required.');
      return;
    }

    if (this.mode() === 'register' && this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);

    if (this.mode() === 'login') {
      // .subscribe(): Equivalent to .then().catch() on a Promise.
      // next : Called when the request succeeds.
      // error: Called when the server returns an error (HTTP 4xx / 5xx).
      this.authService.login(this.email, this.password).subscribe({
        next: () => {
          this.loading.set(false);
          // Navigate to /home after a successful login.
          // Equivalent to: navigate('/home') with useNavigate() in React Router.
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.loading.set(false);
          // err.error: The HTTP error response body (unlike React/axios where it's err.response.data).
          this.errorMessage.set(err.error?.message || err.error?.status || 'Login failed. Please check your credentials.');
        }
      });
    } else {
      this.authService.register(this.email, this.password).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.successMessage.set(res.message || 'Account created! Please sign in.');
          this.mode.set('login');
          this.password = '';
          this.confirmPassword = '';
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.message || 'Registration failed.');
        }
      });
    }
  }
}
