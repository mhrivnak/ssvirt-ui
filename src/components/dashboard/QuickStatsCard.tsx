import React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Button,
  Badge,
} from '@patternfly/react-core';
import type { DashboardStats } from '../../types';

interface QuickStatsCardProps {
  stats?: DashboardStats;
  onViewSystemHealth?: () => void;
}

export const QuickStatsCard: React.FC<QuickStatsCardProps> = ({
  stats,
  onViewSystemHealth,
}) => {
  const totalResources = stats
    ? stats.total_vms +
      stats.total_vdcs +
      stats.total_organizations +
      stats.total_catalogs
    : 0;

  return (
    <Card isFullHeight>
      <CardTitle>
        <h2>Quick Stats</h2>
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Split>
              <SplitItem isFilled>
                <h4>System Status</h4>
              </SplitItem>
              <SplitItem>
                <Badge color="green">Healthy</Badge>
              </SplitItem>
            </Split>
          </StackItem>

          <StackItem>
            <Split>
              <SplitItem isFilled>
                <p>Total Resources</p>
              </SplitItem>
              <SplitItem>
                <p>{totalResources}</p>
              </SplitItem>
            </Split>
          </StackItem>

          <StackItem>
            <Split>
              <SplitItem isFilled>
                <p>Active VMs</p>
              </SplitItem>
              <SplitItem>
                <Badge color="blue">{stats?.running_vms ?? 0}</Badge>
              </SplitItem>
            </Split>
          </StackItem>

          {onViewSystemHealth && (
            <StackItem>
              <Button variant="link" isInline onClick={onViewSystemHealth}>
                View System Health
              </Button>
            </StackItem>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};
