import React, { Suspense } from 'react';
import { Spinner } from '@patternfly/react-core';
import { loadRuntimeConfig } from '../../utils/config';

interface ConfigLoaderProps {
  children: React.ReactNode;
}

// Create a resource for Suspense-based config loading
let configPromise: Promise<void> | null = null;
let configLoaded = false;

const getConfigResource = () => {
  if (configLoaded) {
    return;
  }
  
  if (!configPromise) {
    configPromise = loadRuntimeConfig().then(() => {
      configLoaded = true;
    });
  }
  
  if (!configLoaded) {
    throw configPromise;
  }
};

/**
 * Component that ensures configuration is loaded before children
 */
const ConfigValidator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  getConfigResource();
  return <>{children}</>;
};

/**
 * Component that loads runtime configuration before rendering children
 * Uses Suspense to prevent any child components from rendering until config is loaded
 */
export const ConfigLoader: React.FC<ConfigLoaderProps> = ({ children }) => {
  return (
    <Suspense
      fallback={
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
      }
    >
      <ConfigValidator>{children}</ConfigValidator>
    </Suspense>
  );
};
