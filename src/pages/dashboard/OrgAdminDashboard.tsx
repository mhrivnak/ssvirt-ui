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
  Progress,
  ProgressSize,
  ProgressMeasureLocation,
} from '@patternfly/react-core';
import {
  ServerIcon,
  VirtualMachineIcon,
  UsersIcon,
  PlusIcon,
  UserPlusIcon,
  BookIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { RoleSelector } from '../../components/common/RoleSelector';
import { QuickStatsCard } from '../../components/dashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface OrganizationStats {
  vdcCount: number;
  vmCount: number;
  userCount: number;
  catalogCount: number;
}

interface ResourceUsage {
  cpu: {
    used: number;
    allocated: number;
    percentage: number;
  };
  memory: {
    used: number;
    allocated: number;
    percentage: number;
  };
  storage: {
    used: number;
    allocated: number;
    percentage: number;
  };
}

// Mock data - in real implementation, these would come from API calls
const mockOrgStats: OrganizationStats = {
  vdcCount: 3,
  vmCount: 42,
  userCount: 15,
  catalogCount: 8,
};

const mockResourceUsage: ResourceUsage = {
  cpu: {
    used: 24,
    allocated: 48,
    percentage: 50,
  },
  memory: {
    used: 64,
    allocated: 128,
    percentage: 50,
  },
  storage: {
    used: 2.5,
    allocated: 10,
    percentage: 25,
  },
};

const ResourceUsageOverview: React.FC<{ usage: ResourceUsage }> = ({
  usage,
}) => {
  return (
    <Card>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h3" size="md">
              Resource Usage Overview
            </Title>
          </StackItem>

          <StackItem>
            <Grid hasGutter>
              <GridItem span={4}>
                <div>
                  <div className="pf-v6-u-mb-sm">
                    <strong>CPU Cores</strong>
                  </div>
                  <Progress
                    value={usage.cpu.percentage}
                    title={`${usage.cpu.used} / ${usage.cpu.allocated} cores`}
                    size={ProgressSize.sm}
                    measureLocation={ProgressMeasureLocation.outside}
                  />
                </div>
              </GridItem>

              <GridItem span={4}>
                <div>
                  <div className="pf-v6-u-mb-sm">
                    <strong>Memory</strong>
                  </div>
                  <Progress
                    value={usage.memory.percentage}
                    title={`${usage.memory.used} / ${usage.memory.allocated} GB`}
                    size={ProgressSize.sm}
                    measureLocation={ProgressMeasureLocation.outside}
                  />
                </div>
              </GridItem>

              <GridItem span={4}>
                <div>
                  <div className="pf-v6-u-mb-sm">
                    <strong>Storage</strong>
                  </div>
                  <Progress
                    value={usage.storage.percentage}
                    title={`${usage.storage.used} / ${usage.storage.allocated} TB`}
                    size={ProgressSize.sm}
                    measureLocation={ProgressMeasureLocation.outside}
                  />
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
                <Link to="/vdcs/new">
                  <Button variant="primary" icon={<PlusIcon />} isBlock>
                    Create VDC
                  </Button>
                </Link>
              </StackItem>
              <StackItem>
                <Link to="/vms/new">
                  <Button
                    variant="secondary"
                    icon={<VirtualMachineIcon />}
                    isBlock
                  >
                    Create VM
                  </Button>
                </Link>
              </StackItem>
              <StackItem>
                <Link to="/org-users/invite">
                  <Button variant="secondary" icon={<UserPlusIcon />} isBlock>
                    Invite User
                  </Button>
                </Link>
              </StackItem>
              <StackItem>
                <Link to="/catalogs">
                  <Button variant="secondary" icon={<BookIcon />} isBlock>
                    Browse Catalogs
                  </Button>
                </Link>
              </StackItem>
            </Stack>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

const OrganizationActivityPanel: React.FC<{ orgId: string }> = ({ orgId }) => {
  return (
    <Card>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h3" size="md">
              Recent Activity
            </Title>
          </StackItem>
          <StackItem>
            <div className="pf-v6-u-color-200">
              <p>Recent organization activity will be displayed here...</p>
              <p>Organization ID: {orgId}</p>
            </div>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export const OrgAdminDashboard: React.FC = () => {
  const { sessionData, capabilities, isLoading } = useRole();

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

  const organizationId =
    capabilities.operatingOrganization || capabilities.primaryOrganization;
  const organizationName =
    sessionData.operatingOrg?.name || sessionData.org.name;

  return (
    <PageSection>
      <Stack hasGutter>
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                {organizationName} Dashboard
              </Title>
              <p className="pf-v6-u-color-200">
                Organization ID: {organizationId}
              </p>
            </SplitItem>
            <SplitItem>
              {/* Role selector if user has multiple roles */}
              <RoleSelector />
            </SplitItem>
          </Split>
        </StackItem>

        {/* Organization metrics */}
        <StackItem>
          <Grid hasGutter>
            <GridItem span={3}>
              <QuickStatsCard
                title="Virtual Data Centers"
                value={mockOrgStats.vdcCount}
                icon={<ServerIcon />}
                to="/vdcs"
              />
            </GridItem>
            <GridItem span={3}>
              <QuickStatsCard
                title="Active Virtual Machines"
                value={mockOrgStats.vmCount}
                icon={<VirtualMachineIcon />}
                to="/vms"
              />
            </GridItem>
            <GridItem span={3}>
              <QuickStatsCard
                title="Organization Users"
                value={mockOrgStats.userCount}
                icon={<UsersIcon />}
                to="/org-users"
              />
            </GridItem>
            <GridItem span={3}>
              <QuickStatsCard
                title="Available Catalogs"
                value={mockOrgStats.catalogCount}
                icon={<BookIcon />}
                to="/catalogs"
              />
            </GridItem>
          </Grid>
        </StackItem>

        {/* Resource usage charts */}
        <StackItem>
          <ResourceUsageOverview usage={mockResourceUsage} />
        </StackItem>

        {/* Recent activity and quick actions */}
        <StackItem>
          <Grid hasGutter>
            <GridItem span={8}>
              <OrganizationActivityPanel orgId={organizationId} />
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
