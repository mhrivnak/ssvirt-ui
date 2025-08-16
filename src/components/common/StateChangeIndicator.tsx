import React, { useState, useEffect } from 'react';

interface StateChangeIndicatorProps {
  isChanged: boolean;
  children: React.ReactNode;
  highlightDuration?: number;
  className?: string;
}

/**
 * Component that highlights content when state changes are detected
 */
export const StateChangeIndicator: React.FC<StateChangeIndicatorProps> = ({
  isChanged,
  children,
  highlightDuration = 2000,
  className = '',
}) => {
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    if (isChanged) {
      setShowHighlight(true);
      const timer = setTimeout(
        () => setShowHighlight(false),
        highlightDuration
      );
      return () => clearTimeout(timer);
    }
  }, [isChanged, highlightDuration]);

  const highlightClass = showHighlight
    ? 'pf-v6-u-background-color-warning-100 pf-v6-u-animation-fade-in'
    : '';

  return (
    <div className={`${highlightClass} ${className}`.trim()}>{children}</div>
  );
};

export default StateChangeIndicator;
