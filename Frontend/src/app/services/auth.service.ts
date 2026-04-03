// [Angular vs React — auth.service.ts]
// In React you typically manage auth state with Context + useReducer, Zustand, or Redux.
// In Angular the equivalent pattern is a "Service" — a singleton class that can be injected
// into any component that needs it, acting like a shared global store.
//
// @Injectable({ providedIn: 'root' }):
//   → Angular creates ONE shared instance (singleton) for the entire app.
//   → Equivalent to a React Context wrapping the entire <App />.

import { Injectable, signal, computed } from '@angular/core';

// HttpClient: Angular's built-in HTTP client — similar to axios or fetch wrapper.
// Returns Observables (RxJS) instead of Promises.
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// Observable, tap: From the RxJS library — think of Observable as a more powerful Promise.
// tap(): Performs a side-effect (e.g. saving the token) WITHOUT transforming the stream value.
//        Similar to .then() in a Promise chain but does not change the result.
import { Observable, tap } from 'rxjs';

// These interfaces type the response payloads from the .NET API.
// Equivalent to declaring response types with TypeScript in a React project.
interface LoginResponse {
  status: string;
  token: string;
}

interface RegisterResponse {
  status: string;
  message: string;
}

interface AuthCheckResponse {
  status: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Base URL of the backend API.
  // '/api' is proxied to http://localhost:5000 via the config in proxy.conf.json.
  // (Similar to VITE_API_URL in Vite or REACT_APP_API_URL in CRA.)
  private readonly apiUrl = '/api';

  // signal<T>(): Angular's reactive state — equivalent to useState<T>() in React.
  // Read  : this._token()         ← called like a function, NOT accessed as a property
  // Update: this._token.set(val)  ← equivalent to setToken(val) in React
  // Initialized from localStorage so the user stays logged in after a page refresh.
  private readonly _token = signal<string | null>(localStorage.getItem('jwt_token'));
  private readonly _userEmail = signal<string | null>(null);

  // computed(): A derived value that updates automatically when its source signal changes.
  // Equivalent to useMemo() in React.
  // When _token changes, isAuthenticated updates automatically everywhere it is read.
  /** Whether the user currently has a stored JWT token. */
  readonly isAuthenticated = computed(() => !!this._token());

  /** The currently authenticated user's email address. */
  readonly userEmail = computed(() => this._userEmail());

  // constructor: Angular automatically injects HttpClient and Router here (Dependency Injection).
  // Equivalent to receiving them from useContext() or as props in React.
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * POST /login — Authenticate with email & password, receive a JWT token.
   *
   * Returns an Observable<LoginResponse>. The HTTP request is NOT sent until .subscribe() is called.
   * Think of it like a function that returns a Promise — you still need to await/then it.
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      // tap(): Runs a side-effect after a successful response WITHOUT changing the stream value.
      // Here: persist the JWT token to localStorage and update the signal.
      tap(res => {
        if (res.status === 'ok' && res.token) {
          localStorage.setItem('jwt_token', res.token);
          // signal.set(): Equivalent to setToken(res.token) in React useState.
          this._token.set(res.token);
        }
      })
    );
  }

  /**
   * POST /register — Create a new user account.
   */
  register(email: string, password: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, { email, password });
  }

  /**
   * GET /auth/check — Verify the JWT token is still valid and retrieve the user's email.
   * Called inside HomeComponent.ngOnInit() (equivalent to useEffect on mount in React).
   */
  checkAuth(): Observable<AuthCheckResponse> {
    return this.http.get<AuthCheckResponse>(`${this.apiUrl}/auth/check`).pipe(
      tap(res => {
        if (res.status === 'ok') {
          this._userEmail.set(res.email);
        }
      })
    );
  }

  /**
   * Returns the raw JWT token string (used by the HTTP interceptor to build the Authorization header).
   */
  getToken(): string | null {
    // Call the signal like a function to read its current value.
    return this._token();
  }

  /**
   * Clear the token from storage and redirect the user to the login page.
   */
  logout(): void {
    localStorage.removeItem('jwt_token');
    // signal.set(null): Reset state — equivalent to setToken(null) in React.
    this._token.set(null);
    this._userEmail.set(null);
    // Programmatic navigation — equivalent to navigate('/login') from useNavigate() in React Router.
    this.router.navigate(['/login']);
  }
}
