import { Component } from "react";

/**
 * Without this, a single thrown render unmounts the whole tree and the user
 * gets a white page with nothing to act on. Catch it and show something.
 *
 * Has to be a class — React has no hook equivalent for componentDidCatch.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the stack in the console for whoever is debugging.
    console.error("Unhandled UI error:", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="app-error" role="alert">
        <h1>Something went wrong on this screen.</h1>
        <p>
          The rest of Kribble is fine — reloading usually clears it. If it keeps
          happening, tell us what you were doing and we'll fix it.
        </p>

        <div className="app-error__actions">
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
          <a href="/dashboard">Back to dashboard</a>
        </div>

        {import.meta.env.DEV ? (
          <pre className="app-error__detail">{String(error?.stack || error)}</pre>
        ) : null}
      </div>
    );
  }
}
