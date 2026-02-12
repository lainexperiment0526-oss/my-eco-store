import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error in React tree:', error, errorInfo);
  }

  openTroubleshooter = () => {
    try {
      // Call the troubleshooting helper injected in `public/troubleshoot.js`
      // Fallback: open DevTools instructions if not available
      if (typeof (window as any).troubleshootPiBrowser === 'function') {
        (window as any).troubleshootPiBrowser();
      } else {
        alert('Troubleshooter not available. Please open the browser console.');
      }
    } catch (err) {
      console.warn('Failed to run troubleshooter:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: 20,
          boxSizing: 'border-box',
          background: '#fff'
        }}>
          <div style={{ maxWidth: 720, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Something went wrong</h1>
            <p style={{ color: '#333', marginBottom: 16 }}>
              The app encountered an error while loading. This usually indicates a runtime
              issue or an incompatibility with the Pi Browser. The error has been logged to the console.
            </p>

            <div style={{ marginBottom: 16 }}>
              <button onClick={this.openTroubleshooter} style={{
                padding: '10px 16px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: '#111827',
                color: '#fff',
                cursor: 'pointer'
              }}>Run Troubleshooter</button>
            </div>

            <details style={{ textAlign: 'left', color: '#666' }}>
              <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Error details</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, color: '#111' }}>
                {this.state.error ? this.state.error.stack || this.state.error.message : 'No stack available'}
              </pre>
            </details>

            <p style={{ marginTop: 14, color: '#666' }}>
              If the problem persists, try clearing Pi Browser cache or open this site in a regular browser.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
