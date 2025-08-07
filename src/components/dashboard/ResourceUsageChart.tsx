import React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Stack,
  StackItem,
  Text,
  TextVariants,
  Progress,
  ProgressSize,
  ProgressVariant,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { DashboardStats } from '../../types';

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
        <Text component={TextVariants.h2}>Resource Utilization</Text>
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Split>
              <SplitItem isFilled>
                <Text component={TextVariants.h4}>VM Usage</Text>
                <Text
                  component={TextVariants.small}
                  className="pf-v6-u-color-200"
                >
                  {stats.running_vms} of {stats.total_vms} VMs running
                </Text>
              </SplitItem>
              <SplitItem>
                <Text component={TextVariants.h4}>{vmUtilization}%</Text>
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
                    <Text component={TextVariants.p}>Organizations</Text>
                  </SplitItem>
                  <SplitItem>
                    <Text component={TextVariants.p}>
                      {stats.total_organizations}
                    </Text>
                  </SplitItem>
                </Split>
              </StackItem>

              <StackItem>
                <Split>
                  <SplitItem isFilled>
                    <Text component={TextVariants.p}>Virtual Data Centers</Text>
                  </SplitItem>
                  <SplitItem>
                    <Text component={TextVariants.p}>{stats.total_vdcs}</Text>
                  </SplitItem>
                </Split>
              </StackItem>

              <StackItem>
                <Split>
                  <SplitItem isFilled>
                    <Text component={TextVariants.p}>Catalogs</Text>
                  </SplitItem>
                  <SplitItem>
                    <Text component={TextVariants.p}>
                      {stats.total_catalogs}
                    </Text>
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
