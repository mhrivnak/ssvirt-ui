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
  List,
  ListItem,
  Label,
  Flex,
  FlexItem,
  Icon,
} from '@patternfly/react-core';
import {
  VirtualMachineIcon,
  BookIcon,
  PlusIcon,
  PlayIcon,
  PowerOffIcon,
  PauseIcon,
  InfoCircleIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { QuickStatsCard } from '../../components/dashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { VM } from '../../types';

interface UserVM extends Pick<VM, 'id' | 'name' | 'status' | 'cpu_count' | 'memory_mb'> {
  vdc_name: string;
}

interface CatalogTemplate {
  id: string;
  name: string;
  description: string;
  os_type: string;
  cpu_count: number;
  memory_mb: number;
}

// Mock data - in real implementation, these would come from API calls
const mockUserVMs: UserVM[] = [
  {
    id: 'vm-1',
    name: 'My Development Server',
    status: 'POWERED_ON',
    cpu_count: 2,
    memory_mb: 4096,
    vdc_name: 'Development VDC'
  },
  {
    id: 'vm-2',
    name: 'Test Environment',
    status: 'POWERED_OFF',
    cpu_count: 1,
    memory_mb: 2048,
    vdc_name: 'Development VDC'
  },
  {
    id: 'vm-3',
    name: 'Staging Server',
    status: 'SUSPENDED',
    cpu_count: 4,
    memory_mb: 8192,
    vdc_name: 'Staging VDC'
  }
];

const mockAvailableTemplates: CatalogTemplate[] = [
  {
    id: 'template-1',
    name: 'Ubuntu 20.04 LTS',
    description: 'Standard Ubuntu development environment',
    os_type: 'Linux',
    cpu_count: 2,
    memory_mb: 4096
  },
  {
    id: 'template-2',
    name: 'Windows Server 2019',
    description: 'Windows Server for development and testing',
    os_type: 'Windows',
    cpu_count: 2,
    memory_mb: 8192
  },
  {
    id: 'template-3',
    name: 'CentOS 8',
    description: 'Enterprise Linux for production workloads',
    os_type: 'Linux',
    cpu_count: 4,
    memory_mb: 8192
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'POWERED_ON':
      return <PlayIcon color="var(--pf-v6-global--success-color--100)" />;
    case 'POWERED_OFF':
      return <PowerOffIcon color="var(--pf-v6-global--danger-color--100)" />;
    case 'SUSPENDED':
      return <PauseIcon color="var(--pf-v6-global--warning-color--100)" />;
    default:
      return <InfoCircleIcon color="var(--pf-v6-global--Color--200)" />;
  }
};

const getStatusColor = (status: string): 'green' | 'red' | 'orange' | 'grey' => {
  switch (status) {
    case 'POWERED_ON':
      return 'green';
    case 'POWERED_OFF':
      return 'red';
    case 'SUSPENDED':
      return 'orange';
    default:
      return 'grey';
  }
};

const UserVMDashboard: React.FC<{ vms: UserVM[] }> = ({ vms }) => {
  if (vms.length === 0) {
    return (
      <Card>
        <CardBody>
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h3" size="md">
                My Virtual Machines
              </Title>
            </StackItem>
            <StackItem>
              <div className="pf-v6-u-text-align-center pf-v6-u-p-lg">
                <Icon size="xl" className="pf-v6-u-mb-md">
                  <VirtualMachineIcon />
                </Icon>
                <Title headingLevel="h4" size="lg">
                  No Virtual Machines
                </Title>
                <p className="pf-v6-u-color-200 pf-v6-u-mb-lg">
                  You don't have any virtual machines yet. Get started by creating your first VM.
                </p>
                <Button
                  component={Link}
                  to="/my-vms/new"
                  variant="primary"
                  icon={<PlusIcon />}
                >
                  Create Virtual Machine
                </Button>
              </div>
            </StackItem>
          </Stack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Split hasGutter>
              <SplitItem isFilled>
                <Title headingLevel="h3" size="md">
                  My Virtual Machines ({vms.length})
                </Title>
              </SplitItem>
              <SplitItem>
                <Button
                  component={Link}
                  to="/my-vms"
                  variant="secondary"
                  size="sm"
                >
                  View All
                </Button>
              </SplitItem>
            </Split>
          </StackItem>
          <StackItem>
            <Grid hasGutter>
              {vms.slice(0, 3).map(vm => (
                <GridItem key={vm.id} span={4}>
                  <Card isSelectableRaised>
                    <CardBody>
                      <Stack hasGutter>
                        <StackItem>
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>
                              <Icon>{getStatusIcon(vm.status)}</Icon>
                            </FlexItem>
                            <FlexItem>
                              <strong>{vm.name}</strong>
                            </FlexItem>
                          </Flex>
                        </StackItem>
                        <StackItem>
                          <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                            {vm.vdc_name}
                          </div>
                          <div className="pf-v6-u-font-size-sm">
                            {vm.cpu_count} CPU, {(vm.memory_mb / 1024).toFixed(1)} GB RAM
                          </div>
                        </StackItem>
                        <StackItem>
                          <Label color={getStatusColor(vm.status)}>
                            {vm.status.replace('_', ' ')}
                          </Label>
                        </StackItem>
                      </Stack>
                    </CardBody>
                  </Card>
                </GridItem>
              ))}
            </Grid>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

const GettingStartedPanel: React.FC = () => {
  return (
    <Card>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h3" size="md">
              Getting Started
            </Title>
          </StackItem>
          <StackItem>
            <p className="pf-v6-u-color-200">
              New to the platform? Here are some helpful next steps:
            </p>
          </StackItem>
          <StackItem>
            <List>
              <ListItem>
                <Link to="/catalogs">Browse available VM templates</Link> - 
                Start with pre-configured environments
              </ListItem>
              <ListItem>
                <Link to="/my-vms/new">Create your first virtual machine</Link> - 
                Deploy a VM for development or testing
              </ListItem>
              <ListItem>
                <Link to="/profile">Configure your profile</Link> - 
                Set preferences and notification settings
              </ListItem>
              <ListItem>
                <Link to="/help">View documentation</Link> - 
                Learn about platform features and best practices
              </ListItem>
            </List>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

const QuickTemplatesPanel: React.FC<{ templates: CatalogTemplate[] }> = ({ templates }) => {
  return (
    <Card>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Split hasGutter>
              <SplitItem isFilled>
                <Title headingLevel="h3" size="md">
                  Popular Templates
                </Title>
              </SplitItem>
              <SplitItem>
                <Button
                  component={Link}
                  to="/catalogs"
                  variant="secondary"
                  size="sm"
                >
                  View All
                </Button>
              </SplitItem>
            </Split>
          </StackItem>
          <StackItem>
            <Stack hasGutter>
              {templates.slice(0, 3).map(template => (
                <StackItem key={template.id}>
                  <Card isSelectableRaised>
                    <CardBody>
                      <Flex alignItems={{ default: 'alignItemsCenter' }}>
                        <FlexItem isFilled>
                          <div>
                            <strong>{template.name}</strong>
                            <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                              {template.description}
                            </div>
                            <div className="pf-v6-u-font-size-sm">
                              {template.cpu_count} CPU, {(template.memory_mb / 1024).toFixed(1)} GB RAM
                            </div>
                          </div>
                        </FlexItem>
                        <FlexItem>
                          <Button
                            component={Link}
                            to={`/my-vms/new?template=${template.id}`}
                            variant="secondary"
                            size="sm"
                          >
                            Deploy
                          </Button>
                        </FlexItem>
                      </Flex>
                    </CardBody>
                  </Card>
                </StackItem>
              ))}
            </Stack>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export const VAppUserDashboard: React.FC = () => {
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

  const runningVMs = mockUserVMs.filter(vm => vm.status === 'POWERED_ON').length;

  return (
    <PageSection>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h1" size="xl">
            Welcome, {sessionData.user.name}
          </Title>
          <p className="pf-v6-u-color-200">
            Manage your virtual machines and applications in {sessionData.org.name}
          </p>
        </StackItem>

        {/* User VM overview */}
        <StackItem>
          <Grid hasGutter>
            <GridItem span={6}>
              <QuickStatsCard
                title="My Virtual Machines"
                value={mockUserVMs.length}
                subtitle={`${runningVMs} running`}
                icon={<VirtualMachineIcon />}
                to="/my-vms"
              />
            </GridItem>
            <GridItem span={6}>
              <QuickStatsCard
                title="Available Templates"
                value={mockAvailableTemplates.length}
                subtitle="Ready to deploy"
                icon={<BookIcon />}
                to="/catalogs"
              />
            </GridItem>
          </Grid>
        </StackItem>

        {/* Quick VM dashboard */}
        <StackItem>
          <UserVMDashboard vms={mockUserVMs} />
        </StackItem>

        {/* Templates and getting started */}
        <StackItem>
          <Grid hasGutter>
            <GridItem span={8}>
              <QuickTemplatesPanel templates={mockAvailableTemplates} />
            </GridItem>
            <GridItem span={4}>
              <GettingStartedPanel />
            </GridItem>
          </Grid>
        </StackItem>
      </Stack>
    </PageSection>
  );
};