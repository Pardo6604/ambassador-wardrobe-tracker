import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message + "\n" + error.stack };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-rose-600 bg-rose-50 border border-rose-200 rounded m-8">
          <h1 className="font-bold text-xl mb-4">Something went wrong.</h1>
          <pre className="text-xs overflow-auto">{this.state.errorMsg}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
