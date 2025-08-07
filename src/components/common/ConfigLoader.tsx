import React, { useState, useEffect } from 'react';
import { Spinner } from '@patternfly/react-core';
import { loadRuntimeConfig } from '../../utils/config';

interface ConfigLoaderProps {
  children: React.ReactNode;
}

/**
 * Component that loads runtime configuration before rendering children
 */
export const ConfigLoader: React.FC<ConfigLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        await loadRuntimeConfig();
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load configuration'
        );
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <Spinner size="lg" />
        <div>Loading configuration...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem',
          color: 'red',
        }}
      >
        <div>Failed to load application configuration</div>
        <div>{error}</div>
      </div>
    );
  }

  return <>{children}</>;
};
