import React from 'react';
import {
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Switch,
  Button,
  Flex,
  FlexItem,
  Spinner,
} from '@patternfly/react-core';
import { SyncAltIcon } from '@patternfly/react-icons';

/**
 * Simple time ago formatter
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }
}

interface AutoRefreshControlsProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onManualRefresh: () => void;
  isLoading?: boolean;
  lastUpdated?: Date | null;
  className?: string;
}

/**
 * Component that provides controls for auto-refresh functionality
 */
export const AutoRefreshControls: React.FC<AutoRefreshControlsProps> = ({
  isEnabled,
  onToggle,
  onManualRefresh,
  isLoading = false,
  lastUpdated = null,
  className = '',
}) => {
  return (
    <Toolbar className={className}>
      <ToolbarContent>
        <ToolbarGroup>
          <ToolbarItem>
            <Flex
              spaceItems={{ default: 'spaceItemsSm' }}
              alignItems={{ default: 'alignItemsCenter' }}
            >
              <FlexItem>
                <Switch
                  id="auto-refresh-toggle"
                  label="Auto-refresh (2s)"
                  isChecked={isEnabled}
                  onChange={(_, checked) => onToggle(checked)}
                />
              </FlexItem>
              <FlexItem>
                <Button
                  variant="secondary"
                  onClick={onManualRefresh}
                  isDisabled={isLoading}
                  icon={isLoading ? <Spinner size="sm" /> : <SyncAltIcon />}
                  size="sm"
                >
                  Refresh
                </Button>
              </FlexItem>
              {lastUpdated && (
                <FlexItem>
                  <small className="pf-v6-u-color-200">
                    Last updated: {getTimeAgo(lastUpdated)} ago
                  </small>
                </FlexItem>
              )}
            </Flex>
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};

export default AutoRefreshControls;
