import { Component } from "react";
import { logger } from "../utils/logger.js";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    logger.error('ui', `[ErrorBoundary] ${error.message}`, info.componentStack);
  }

  render() {
    if (this.state.error) {
      // Only expose the raw error message in development — avoid leaking internals in production
      const isDev = import.meta.env?.DEV ?? false;
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-red-200 p-6 space-y-3">
            <h1 className="text-lg font-bold text-brand-red">Something went wrong</h1>
            <pre className="text-xs text-gray-500 whitespace-pre-wrap break-all bg-gray-50 rounded-xl p-4">
              {isDev ? this.state.error.message : "An unexpected error occurred. Please reload the page."}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-green text-white rounded-xl px-4 py-2 text-sm font-semibold"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
