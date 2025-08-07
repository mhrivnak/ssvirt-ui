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
  Text,
  TextVariants,
  Badge,
} from '@patternfly/react-core';
import { DashboardStats } from '../../types';

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
        <Text component={TextVariants.h2}>Quick Stats</Text>
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Split>
              <SplitItem isFilled>
                <Text component={TextVariants.h4}>System Status</Text>
              </SplitItem>
              <SplitItem>
                <Badge color="green">Healthy</Badge>
              </SplitItem>
            </Split>
          </StackItem>

          <StackItem>
            <Split>
              <SplitItem isFilled>
                <Text component={TextVariants.p}>Total Resources</Text>
              </SplitItem>
              <SplitItem>
                <Text component={TextVariants.p}>{totalResources}</Text>
              </SplitItem>
            </Split>
          </StackItem>

          <StackItem>
            <Split>
              <SplitItem isFilled>
                <Text component={TextVariants.p}>Active VMs</Text>
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
