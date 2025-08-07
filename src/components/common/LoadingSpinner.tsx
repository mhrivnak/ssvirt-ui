import React from 'react';
import { Spinner, Bullseye } from '@patternfly/react-core';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
}

/**
 * Loading spinner component using PatternFly Spinner
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'lg', 
  message = 'Loading...' 
}) => {
  return (
    <Bullseye>
      <div style={{ textAlign: 'center' }}>
        <Spinner size={size} aria-label={message} />
        {message && (
          <div style={{ marginTop: '1rem', color: '#666' }}>
            {message}
          </div>
        )}
      </div>
    </Bullseye>
  );
};

export default LoadingSpinner;