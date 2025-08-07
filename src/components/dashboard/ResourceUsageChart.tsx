import React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Stack,
  StackItem,
  Progress,
  ProgressSize,
  ProgressVariant,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import type { DashboardStats } from '../../types';

interface ResourceUsageChartProps {
  stats?: DashboardStats;
}

export const ResourceUsageChart: React.FC<ResourceUsageChartProps> = ({
  stats,
}) => {
  if (!stats) {
    return null;
  }

  const vmUtilization =
    stats.total_vms > 0
      ? Math.round((stats.running_vms / stats.total_vms) * 100)
      : 0;

  const getProgressVariant = (percentage: number): ProgressVariant => {
    if (percentage >= 90) return ProgressVariant.danger;
    if (percentage >= 70) return ProgressVariant.warning;
    return ProgressVariant.success;
  };

  return (
    <Card isFullHeight>
      <CardTitle>
        <h2>Resource Utilization</h2>
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Split>
              <SplitItem isFilled>
                <h4>VM Usage</h4>
                <small className="pf-v6-u-color-200">
                  {stats.running_vms} of {stats.total_vms} VMs running
                </small>
              </SplitItem>
              <SplitItem>
                <h4>{vmUtilization}%</h4>
              </SplitItem>
            </Split>
          </StackItem>

          <StackItem>
            <Progress
              value={vmUtilization}
              title="VM utilization"
              size={ProgressSize.lg}
              variant={getProgressVariant(vmUtilization)}
            />
          </StackItem>

          <StackItem>
            <Stack>
              <StackItem>
                <Split>
                  <SplitItem isFilled>
                    <p>Organizations</p>
                  </SplitItem>
                  <SplitItem>
                    <p>{stats.total_organizations}</p>
                  </SplitItem>
                </Split>
              </StackItem>

              <StackItem>
                <Split>
                  <SplitItem isFilled>
                    <p>Virtual Data Centers</p>
                  </SplitItem>
                  <SplitItem>
                    <p>{stats.total_vdcs}</p>
                  </SplitItem>
                </Split>
              </StackItem>

              <StackItem>
                <Split>
                  <SplitItem isFilled>
                    <p>Catalogs</p>
                  </SplitItem>
                  <SplitItem>
                    <p>{stats.total_catalogs}</p>
                  </SplitItem>
                </Split>
              </StackItem>
            </Stack>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};
