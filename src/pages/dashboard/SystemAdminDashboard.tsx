import React from 'react';
import {
  PageSection,
  Title,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Button,
  Alert,
  AlertVariant,
  Flex,
  FlexItem,
  Icon,
} from '@patternfly/react-core';
import {
  BuildingIcon,
  UsersIcon,
  ServerIcon,
  VirtualMachineIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { QuickStatsCard } from '../../components/dashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface SystemStats {
  organizationCount: number;
  userCount: number;
  activeVMCount: number;
  resourceUtilization: number;
  organizationGrowth?: number;
  userGrowth?: number;
  vmGrowth?: number;
  resourceTrend?: number;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

// Mock data - in real implementation, these would come from API calls
const mockSystemStats: SystemStats = {
  organizationCount: 15,
  userCount: 347,
  activeVMCount: 1248,
  resourceUtilization: 67,
  organizationGrowth: 12,
  userGrowth: 8,
  vmGrowth: 23,
  resourceTrend: 5
};

const mockSystemAlerts: SystemAlert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'High Resource Utilization',
    message: 'CPU utilization is at 85% across the datacenter',
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    type: 'info',
    title: 'Scheduled Maintenance',
    message: 'System maintenance scheduled for tonight at 2:00 AM',
    timestamp: '2024-01-15T09:15:00Z'
  }
];

const SystemAlertsPanel: React.FC<{ alerts: SystemAlert[] }> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardBody>
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Icon color="var(--pf-v6-global--success-color--100)">
                <CheckCircleIcon />
              </Icon>
            </FlexItem>
            <FlexItem>
              <Title headingLevel="h3" size="md">
                All Systems Normal
              </Title>
              <p className="pf-v6-u-color-200">No active system alerts</p>
            </FlexItem>
          </Flex>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h3" size="md">
              System Alerts ({alerts.length})
            </Title>
          </StackItem>
          {alerts.map(alert => (
            <StackItem key={alert.id}>
              <Alert
                variant={alert.type as AlertVariant}
                title={alert.title}
                isInline
              >
                {alert.message}
              </Alert>
            </StackItem>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
};

const SystemHealthPanel: React.FC = () => {
  return (
    <Card>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h3" size="md">
              System Health
            </Title>
          </StackItem>
          <StackItem>
            <Grid hasGutter>
              <GridItem span={6}>
                <div className="pf-v6-u-text-align-center">
                  <Icon size="lg" color="var(--pf-v6-global--success-color--100)">
                    <CheckCircleIcon />
                  </Icon>
                  <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                    API Services
                  </div>
                </div>
              </GridItem>
              <GridItem span={6}>
                <div className="pf-v6-u-text-align-center">
                  <Icon size="lg" color="var(--pf-v6-global--success-color--100)">
                    <CheckCircleIcon />
                  </Icon>
                  <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                    Database
                  </div>
                </div>
              </GridItem>
              <GridItem span={6}>
                <div className="pf-v6-u-text-align-center">
                  <Icon size="lg" color="var(--pf-v6-global--warning-color--100)">
                    <ExclamationTriangleIcon />
                  </Icon>
                  <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                    Storage
                  </div>
                </div>
              </GridItem>
              <GridItem span={6}>
                <div className="pf-v6-u-text-align-center">
                  <Icon size="lg" color="var(--pf-v6-global--success-color--100)">
                    <CheckCircleIcon />
                  </Icon>
                  <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                    Network
                  </div>
                </div>
              </GridItem>
            </Grid>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

const QuickActionsPanel: React.FC = () => {
  return (
    <Card>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h3" size="md">
              Quick Actions
            </Title>
          </StackItem>
          <StackItem>
            <Stack hasGutter>
              <StackItem>
                <Button
                  component={Link}
                  to="/organizations/new"
                  variant="secondary"
                  icon={<PlusIcon />}
                  isBlock
                >
                  Create Organization
                </Button>
              </StackItem>
              <StackItem>
                <Button
                  component={Link}
                  to="/admin/users/invite"
                  variant="secondary"
                  icon={<UsersIcon />}
                  isBlock
                >
                  Invite System User
                </Button>
              </StackItem>
              <StackItem>
                <Button
                  component={Link}
                  to="/admin/settings"
                  variant="secondary"
                  icon={<ServerIcon />}
                  isBlock
                >
                  System Settings
                </Button>
              </StackItem>
            </Stack>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export const SystemAdminDashboard: React.FC = () => {
  const { sessionData, isLoading } = useRole();

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (!sessionData) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Authentication Error">
          Unable to load session data. Please log in again.
        </Alert>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Stack hasGutter>
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                System Administration Dashboard
              </Title>
              <p className="pf-v6-u-color-200">
                Welcome, {sessionData.user.name} - Managing {sessionData.site.name}
              </p>
            </SplitItem>
          </Split>
        </StackItem>

        {/* System-wide metrics */}
        <StackItem>
          <Grid hasGutter>
            <GridItem span={3}>
              <QuickStatsCard
                title="Total Organizations"
                value={mockSystemStats.organizationCount}
                trend={mockSystemStats.organizationGrowth}
                icon={<BuildingIcon />}
                to="/organizations"
              />
            </GridItem>
            <GridItem span={3}>
              <QuickStatsCard
                title="Total Users"
                value={mockSystemStats.userCount}
                trend={mockSystemStats.userGrowth}
                icon={<UsersIcon />}
                to="/admin/users"
              />
            </GridItem>
            <GridItem span={3}>
              <QuickStatsCard
                title="System Resources"
                value={`${mockSystemStats.resourceUtilization}%`}
                trend={mockSystemStats.resourceTrend}
                icon={<ServerIcon />}
                to="/admin/monitoring"
              />
            </GridItem>
            <GridItem span={3}>
              <QuickStatsCard
                title="Active VMs"
                value={mockSystemStats.activeVMCount}
                trend={mockSystemStats.vmGrowth}
                icon={<VirtualMachineIcon />}
                to="/vms"
              />
            </GridItem>
          </Grid>
        </StackItem>

        {/* System alerts and health */}
        <StackItem>
          <Grid hasGutter>
            <GridItem span={8}>
              <SystemAlertsPanel alerts={mockSystemAlerts} />
            </GridItem>
            <GridItem span={4}>
              <SystemHealthPanel />
            </GridItem>
          </Grid>
        </StackItem>

        {/* Quick actions */}
        <StackItem>
          <Grid hasGutter>
            <GridItem span={8}>
              <Card>
                <CardBody>
                  <Title headingLevel="h3" size="md">
                    Recent System Activity
                  </Title>
                  <p className="pf-v6-u-color-200">
                    System activity monitoring coming soon...
                  </p>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem span={4}>
              <QuickActionsPanel />
            </GridItem>
          </Grid>
        </StackItem>
      </Stack>
    </PageSection>
  );
};