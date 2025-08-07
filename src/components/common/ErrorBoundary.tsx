import React, { Component, type ReactNode } from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Button,
  EmptyStateActions,
  Title,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <EmptyState>
          <ExclamationTriangleIcon />
          <Title headingLevel="h4" size="lg">
            Something went wrong
          </Title>
          <EmptyStateBody>
            An unexpected error occurred. Please try refreshing the page or
            contact support if the problem persists.
          </EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary" onClick={this.handleReset}>
                Try again
              </Button>
              <Button variant="link" onClick={() => window.location.reload()}>
                Refresh page
              </Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
