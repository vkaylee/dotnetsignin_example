// [Angular vs React]
// In React, every component is a function that returns JSX.
// In Angular, every component is a CLASS decorated with @Component.
// The decorator holds metadata: which HTML tag to use, which template/style files to load.
import { Component, signal } from '@angular/core';

// RouterOutlet is a placeholder component — equivalent to <Outlet /> in React Router.
// It renders whichever component matches the current URL (declared in app.routes.ts).
import { RouterOutlet } from '@angular/router';

@Component({
  // selector: The custom HTML tag used to embed this component.
  // e.g. <app-root /> in index.html. In React you just import and use <App />.
  selector: 'app-root',

  // imports: Declare which Angular modules/components are used inside THIS component's template.
  // Unlike React, Angular does not auto-detect what you're using — you must list them explicitly.
  imports: [RouterOutlet],

  // templateUrl/styleUrl: Template and CSS are kept in separate files.
  // In React you typically write HTML inline inside the return() of the function component.
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // signal() is Angular's reactive state primitive — equivalent to useState() in React.
  // Read value : this.title()      ← called like a function
  // Update     : this.title.set('newValue')  or  this.title.update(old => ...)
  // Ref: https://angular.dev/guide/signals
  protected readonly title = signal('Frontend');
}
