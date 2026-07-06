import { Component, type ReactNode } from 'react';
import { loadEvents, type RunSummary } from '../lib/db';
import { downloadRunExport } from '../lib/exportRun';

/** Last-resort catch for render/derive crashes — e.g. a legacy run whose
 * events reference area ids the current dataset no longer has. The event log
 * itself is never touched; the fallback offers a way back to the run list and
 * a raw JSON export of the broken run so nothing is lost. */
export class ErrorBoundary extends Component<
  {
    /** The run being rendered, when there is one — enables the Export button. */
    run?: RunSummary | null;
    /** Clears the active run ("Back to runs"). */
    onReset?: () => void;
    children: ReactNode;
  },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prevProps: { run?: RunSummary | null }) {
    // Navigating to a different run (or away from one) deserves a fresh
    // render attempt rather than a stuck fallback.
    if (this.state.error && prevProps.run?.id !== this.props.run?.id) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { run, onReset } = this.props;
    return (
      <section>
        <h2>This run couldn't be loaded</h2>
        <p className="muted">
          Something went wrong while displaying{run ? ' this run' : ' this screen'}. Your data is
          untouched — every run's event log is stored exactly as recorded.
        </p>
        <details className="muted error-details">
          <summary>Error details</summary>
          <pre>{error.message}</pre>
        </details>
        <div className="panel-actions">
          {onReset && (
            <button
              onClick={() => {
                this.setState({ error: null });
                onReset();
              }}
            >
              Back to runs
            </button>
          )}
          {run && (
            <button
              className="secondary"
              onClick={async () => downloadRunExport(run, await loadEvents(run.id))}
            >
              Export JSON
            </button>
          )}
        </div>
      </section>
    );
  }
}
