"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold mb-2">Something went wrong</p>
          <p className="text-muted-foreground mb-4 text-sm">
            An unexpected error occurred.
          </p>
          <button
            className="text-sm underline text-muted-foreground hover:text-foreground"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
