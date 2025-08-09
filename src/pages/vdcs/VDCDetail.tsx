import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Button,
  Badge,
  Switch,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Tabs,
  Tab,
  TabTitleText,
  TabContent,
  EmptyState,
  EmptyStateBody,
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbItem,
  Flex,
  FlexItem,
  Icon,
  Progress,
  ProgressSize,
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ActionsColumn,
} from '@patternfly/react-table';
import {
  NetworkIcon,
  EditIcon,
  UsersIcon,
  CubeIcon,
  PlusCircleIcon,
  ChartAreaIcon,
  CpuIcon,
  MemoryIcon,
  StorageDomainIcon,
} from '@patternfly/react-icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useVDC, useToggleVDCStatus, useVMs } from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { VM } from '../../types';
import { ROUTES } from '../../utils/constants';
import { formatBytes } from '../../utils/format';

const VDCDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [errorMessage, setErrorMessage] = useState('');
  const toggleStatusMutation = useToggleVDCStatus();

  // Hooks must be called before any conditional returns
  const { data: vdcResponse, isLoading, error } = useVDC(id || '');
  const { data: vmsResponse } = useVMs({ vdc_id: id });

  // Early validation for id parameter
  if (!id) {
    return (
      <PageSection>
        <EmptyState icon={NetworkIcon}>
          <Title headingLevel="h4" size="lg">
            Invalid VDC
          </Title>
          <EmptyStateBody>
            No VDC ID provided. Please select a valid VDC.
          </EmptyStateBody>
          <Button variant="primary" onClick={() => navigate(ROUTES.VDCS)}>
            Back to VDCs
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  const vdc = vdcResponse?.data;
  const vms = vmsResponse?.data || [];

  const handleStatusToggle = async (enabled: boolean) => {
    if (!vdc) return;
    try {
      await toggleStatusMutation.mutateAsync({ id: vdc.id, enabled });
    } catch (error) {
      setErrorMessage(
        `Failed to toggle VDC status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const getResourceUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getResourceUsageVariant = (percentage: number) => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  // Mock resource usage data - in real implementation, this would come from API
  const mockResourceUsage = {
    cpu: { used: 0, limit: vdc?.cpu_limit || 0 },
    memory: { used: 0, limit: vdc?.memory_limit_mb || 0 },
    storage: { used: 0, limit: vdc?.storage_limit_mb || 0 },
  };

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (error || !vdc) {
    return (
      <PageSection>
        <EmptyState icon={NetworkIcon}>
          <Title headingLevel="h4" size="lg">
            VDC not found
          </Title>
          <EmptyStateBody>
            The VDC you're looking for doesn't exist or you don't have
            permission to view it.
          </EmptyStateBody>
          <Button variant="primary" onClick={() => navigate(ROUTES.VDCS)}>
            Back to VDCs
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  const overviewTabContent = (
    <Grid hasGutter>
      <GridItem span={12} md={8}>
        <Stack hasGutter>
          <StackItem>
            <Card>
              <CardTitle>VDC Information</CardTitle>
              <CardBody>
                <DescriptionList isHorizontal>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Name</DescriptionListTerm>
                    <DescriptionListDescription>
                      {vdc.name}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Namespace</DescriptionListTerm>
                    <DescriptionListDescription>
                      <code>{vdc.namespace}</code>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Allocation Model</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Badge color="blue">{vdc.allocation_model}</Badge>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Status</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Split hasGutter>
                        <SplitItem>
                          <Badge color={vdc.enabled ? 'green' : 'red'}>
                            {vdc.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </SplitItem>
                        <SplitItem>
                          <Switch
                            id="vdc-status-toggle"
                            isChecked={vdc.enabled}
                            onChange={(_, checked) =>
                              handleStatusToggle(checked)
                            }
                            isDisabled={toggleStatusMutation.isPending}
                            aria-label="Toggle VDC status"
                          />
                        </SplitItem>
                      </Split>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Created</DescriptionListTerm>
                    <DescriptionListDescription>
                      {vdc.created_at
                        ? new Date(vdc.created_at).toLocaleString()
                        : 'N/A'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Last Updated</DescriptionListTerm>
                    <DescriptionListDescription>
                      {vdc.updated_at
                        ? new Date(vdc.updated_at).toLocaleString()
                        : 'N/A'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </StackItem>

          <StackItem>
            <Card>
              <CardTitle>Resource Limits</CardTitle>
              <CardBody>
                <Grid hasGutter>
                  <GridItem span={4}>
                    <Stack>
                      <StackItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Icon>
                              <CpuIcon />
                            </Icon>
                          </FlexItem>
                          <FlexItem>
                            <strong>CPU Cores</strong>
                          </FlexItem>
                        </Flex>
                      </StackItem>
                      <StackItem>
                        <Title headingLevel="h3" size="2xl">
                          {vdc.cpu_limit}
                        </Title>
                      </StackItem>
                    </Stack>
                  </GridItem>
                  <GridItem span={4}>
                    <Stack>
                      <StackItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Icon>
                              <MemoryIcon />
                            </Icon>
                          </FlexItem>
                          <FlexItem>
                            <strong>Memory</strong>
                          </FlexItem>
                        </Flex>
                      </StackItem>
                      <StackItem>
                        <Title headingLevel="h3" size="2xl">
                          {formatBytes(vdc.memory_limit_mb * 1024 * 1024)}
                        </Title>
                      </StackItem>
                    </Stack>
                  </GridItem>
                  <GridItem span={4}>
                    <Stack>
                      <StackItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Icon>
                              <StorageDomainIcon />
                            </Icon>
                          </FlexItem>
                          <FlexItem>
                            <strong>Storage</strong>
                          </FlexItem>
                        </Flex>
                      </StackItem>
                      <StackItem>
                        <Title headingLevel="h3" size="2xl">
                          {formatBytes(vdc.storage_limit_mb * 1024 * 1024)}
                        </Title>
                      </StackItem>
                    </Stack>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>
          </StackItem>
        </Stack>
      </GridItem>

      <GridItem span={12} md={4}>
        <Stack hasGutter>
          <StackItem>
            <Card>
              <CardTitle>Quick Actions</CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Button
                      variant="primary"
                      icon={<EditIcon />}
                      onClick={() =>
                        navigate(ROUTES.VDC_EDIT.replace(':id', vdc.id))
                      }
                      isBlock
                    >
                      Edit VDC
                    </Button>
                  </StackItem>
                  <StackItem>
                    <Button
                      variant="secondary"
                      icon={<UsersIcon />}
                      onClick={() =>
                        navigate(ROUTES.VDC_USERS.replace(':id', vdc.id))
                      }
                      isBlock
                    >
                      Manage Users
                    </Button>
                  </StackItem>
                  <StackItem>
                    <Button
                      variant="secondary"
                      icon={<PlusCircleIcon />}
                      onClick={() =>
                        navigate(ROUTES.VM_CREATE, {
                          state: { vdcId: vdc.id },
                        })
                      }
                      isBlock
                    >
                      Create VM
                    </Button>
                  </StackItem>
                  <StackItem>
                    <Button
                      variant="link"
                      icon={<ChartAreaIcon />}
                      onClick={() =>
                        navigate(ROUTES.VDC_MONITORING.replace(':id', vdc.id))
                      }
                      isBlock
                    >
                      View Monitoring
                    </Button>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </StackItem>

          <StackItem>
            <Card>
              <CardTitle>Resource Usage</CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <span>CPU Usage</span>
                        <span>
                          {mockResourceUsage.cpu.used} /{' '}
                          {mockResourceUsage.cpu.limit} cores
                        </span>
                      </div>
                      <Progress
                        value={getResourceUsagePercentage(
                          mockResourceUsage.cpu.used,
                          mockResourceUsage.cpu.limit
                        )}
                        size={ProgressSize.sm}
                        variant={getResourceUsageVariant(
                          getResourceUsagePercentage(
                            mockResourceUsage.cpu.used,
                            mockResourceUsage.cpu.limit
                          )
                        )}
                      />
                    </div>
                  </StackItem>
                  <StackItem>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <span>Memory Usage</span>
                        <span>
                          {formatBytes(
                            mockResourceUsage.memory.used * 1024 * 1024
                          )}{' '}
                          /{' '}
                          {formatBytes(
                            mockResourceUsage.memory.limit * 1024 * 1024
                          )}
                        </span>
                      </div>
                      <Progress
                        value={getResourceUsagePercentage(
                          mockResourceUsage.memory.used,
                          mockResourceUsage.memory.limit
                        )}
                        size={ProgressSize.sm}
                        variant={getResourceUsageVariant(
                          getResourceUsagePercentage(
                            mockResourceUsage.memory.used,
                            mockResourceUsage.memory.limit
                          )
                        )}
                      />
                    </div>
                  </StackItem>
                  <StackItem>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <span>Storage Usage</span>
                        <span>
                          {formatBytes(
                            mockResourceUsage.storage.used * 1024 * 1024
                          )}{' '}
                          /{' '}
                          {formatBytes(
                            mockResourceUsage.storage.limit * 1024 * 1024
                          )}
                        </span>
                      </div>
                      <Progress
                        value={getResourceUsagePercentage(
                          mockResourceUsage.storage.used,
                          mockResourceUsage.storage.limit
                        )}
                        size={ProgressSize.sm}
                        variant={getResourceUsageVariant(
                          getResourceUsagePercentage(
                            mockResourceUsage.storage.used,
                            mockResourceUsage.storage.limit
                          )
                        )}
                      />
                    </div>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </StackItem>

          <StackItem>
            <Card>
              <CardTitle>Resource Summary</CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Split>
                      <SplitItem isFilled>
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Icon>
                              <CubeIcon />
                            </Icon>
                          </FlexItem>
                          <FlexItem>Virtual Machines</FlexItem>
                        </Flex>
                      </SplitItem>
                      <SplitItem>
                        <strong>{vms.length}</strong>
                      </SplitItem>
                    </Split>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </StackItem>
        </Stack>
      </GridItem>
    </Grid>
  );

  const vmsTabContent = (
    <Card>
      <CardTitle>
        <Split>
          <SplitItem isFilled>Virtual Machines</SplitItem>
          <SplitItem>
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircleIcon />}
              onClick={() =>
                navigate(ROUTES.VM_CREATE, {
                  state: { vdcId: vdc.id },
                })
              }
            >
              Create VM
            </Button>
          </SplitItem>
        </Split>
      </CardTitle>
      <CardBody>
        {vms.length === 0 ? (
          <EmptyState icon={CubeIcon}>
            <Title headingLevel="h4" size="lg">
              No Virtual Machines
            </Title>
            <EmptyStateBody>
              This VDC doesn't have any VMs yet. Create one to get started.
            </EmptyStateBody>
            <Button
              variant="primary"
              icon={<PlusCircleIcon />}
              onClick={() =>
                navigate(ROUTES.VM_CREATE, {
                  state: { vdcId: vdc.id },
                })
              }
            >
              Create VM
            </Button>
          </EmptyState>
        ) : (
          <Table aria-label="VMs table" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>CPU</Th>
                <Th>Memory</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {vms.map((vm: VM) => (
                <Tr key={vm.id}>
                  <Td dataLabel="Name">
                    <Button
                      variant="link"
                      isInline
                      onClick={() =>
                        navigate(ROUTES.VM_DETAIL.replace(':id', vm.id))
                      }
                    >
                      {vm.name}
                    </Button>
                  </Td>
                  <Td dataLabel="Status">
                    <Badge color={vm.status === 'POWERED_ON' ? 'green' : 'red'}>
                      {vm.status}
                    </Badge>
                  </Td>
                  <Td dataLabel="CPU">{vm.cpu_count} cores</Td>
                  <Td dataLabel="Memory">
                    {formatBytes(vm.memory_mb * 1024 * 1024)}
                  </Td>
                  <Td dataLabel="Created">
                    {vm.created_at
                      ? new Date(vm.created_at).toLocaleDateString()
                      : 'N/A'}
                  </Td>
                  <Td dataLabel="Actions">
                    <ActionsColumn
                      items={[
                        {
                          title: 'View Details',
                          onClick: () =>
                            navigate(ROUTES.VM_DETAIL.replace(':id', vm.id)),
                        },
                        {
                          title: 'Edit',
                          onClick: () =>
                            navigate(ROUTES.VM_EDIT.replace(':id', vm.id)),
                        },
                        {
                          title: 'Power On',
                          onClick: () => console.log('Power on VM', vm.id),
                          isDisabled: vm.status === 'POWERED_ON',
                        },
                        {
                          title: 'Power Off',
                          onClick: () => console.log('Power off VM', vm.id),
                          isDisabled: vm.status === 'POWERED_OFF',
                        },
                      ]}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to={ROUTES.VDCS}>Virtual Data Centers</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{vdc.name}</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Stack>
                <StackItem>
                  <Title headingLevel="h1" size="xl">
                    {vdc.name}
                  </Title>
                </StackItem>
                <StackItem>
                  <p className="pf-v6-u-color-200">
                    Namespace: {vdc.namespace}
                  </p>
                </StackItem>
              </Stack>
            </SplitItem>
            <SplitItem>
              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <Button
                    variant="secondary"
                    icon={<EditIcon />}
                    onClick={() =>
                      navigate(ROUTES.VDC_EDIT.replace(':id', vdc.id))
                    }
                  >
                    Edit
                  </Button>
                </FlexItem>
                <FlexItem>
                  <Button
                    variant="secondary"
                    icon={<UsersIcon />}
                    onClick={() =>
                      navigate(ROUTES.VDC_USERS.replace(':id', vdc.id))
                    }
                  >
                    Manage Users
                  </Button>
                </FlexItem>
              </Flex>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Error Alert */}
        {errorMessage && (
          <StackItem>
            <Alert variant={AlertVariant.danger} title="Error" isInline>
              {errorMessage}
              <br />
              <Button variant="link" onClick={() => setErrorMessage('')}>
                Dismiss
              </Button>
            </Alert>
          </StackItem>
        )}

        {/* Status Alert */}
        {!vdc.enabled && (
          <StackItem>
            <Alert
              variant={AlertVariant.warning}
              title="VDC is disabled"
              isInline
            >
              This Virtual Data Center is currently disabled. Users will not be
              able to create or manage VMs within this VDC.
            </Alert>
          </StackItem>
        )}

        {/* Tabs */}
        <StackItem>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}
            aria-label="VDC details tabs"
          >
            <Tab
              eventKey={0}
              title={<TabTitleText>Overview</TabTitleText>}
              aria-label="Overview tab"
            >
              <TabContent id="overview-tab">{overviewTabContent}</TabContent>
            </Tab>
            <Tab
              eventKey={1}
              title={
                <TabTitleText>Virtual Machines ({vms.length})</TabTitleText>
              }
              aria-label="VMs tab"
            >
              <TabContent id="vms-tab">{vmsTabContent}</TabContent>
            </Tab>
          </Tabs>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default VDCDetail;
