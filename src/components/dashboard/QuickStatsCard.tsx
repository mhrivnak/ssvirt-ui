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
  Icon,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon } from '@patternfly/react-icons';
import type { DashboardStats } from '../../types';

interface QuickStatsCardProps {
  // New interface for role-based dashboards
  title?: string;
  value?: number | string;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactElement;
  to?: string;
  // Legacy interface
  stats?: DashboardStats;
  onViewSystemHealth?: () => void;
}

export const QuickStatsCard: React.FC<QuickStatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  to,
  stats,
  onViewSystemHealth,
}) => {
  // New role-based dashboard interface
  if (title !== undefined) {
    const cardContent = (
      <Card isFullHeight isClickable={!!to}>
        <CardBody>
          <Stack hasGutter>
            <StackItem>
              <Flex alignItems={{ default: 'alignItemsCenter' }}>
                {icon && (
                  <FlexItem>
                    <Icon size="lg">{icon}</Icon>
                  </FlexItem>
                )}
                <FlexItem>
                  <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                    {title}
                  </div>
                </FlexItem>
              </Flex>
            </StackItem>
            <StackItem>
              <div className="pf-v6-u-font-size-2xl pf-v6-u-font-weight-bold">
                {value}
              </div>
              {subtitle && (
                <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                  {subtitle}
                </div>
              )}
            </StackItem>
            {trend !== undefined && (
              <StackItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <Icon>
                      {trend > 0 ? (
                        <ArrowUpIcon color="var(--pf-v6-global--success-color--100)" />
                      ) : (
                        <ArrowDownIcon color="var(--pf-v6-global--danger-color--100)" />
                      )}
                    </Icon>
                  </FlexItem>
                  <FlexItem>
                    <span
                      className={`pf-v6-u-font-size-sm ${
                        trend > 0
                          ? 'pf-v6-u-success-color-100'
                          : 'pf-v6-u-danger-color-100'
                      }`}
                    >
                      {Math.abs(trend)}%
                    </span>
                  </FlexItem>
                </Flex>
              </StackItem>
            )}
          </Stack>
        </CardBody>
      </Card>
    );

    if (to) {
      return <Link to={to}>{cardContent}</Link>;
    }

    return cardContent;
  }

  // Legacy interface
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
              <SplitItem>
                <h4>System Status</h4>
              </SplitItem>
              <SplitItem>
                <Badge color="green">Healthy</Badge>
              </SplitItem>
            </Split>
          </StackItem>

          <StackItem>
            <Split>
              <SplitItem>
                <p>Total Resources</p>
              </SplitItem>
              <SplitItem>
                <p>{totalResources}</p>
              </SplitItem>
            </Split>
          </StackItem>

          <StackItem>
            <Split>
              <SplitItem>
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
