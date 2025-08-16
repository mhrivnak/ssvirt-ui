import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Button,
  Tabs,
  Tab,
  TabTitleText,
  TabContent,
  TabContentBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  Breadcrumb,
  BreadcrumbItem,
  Alert,
  AlertVariant,
  Divider,
  Content,
  Flex,
  FlexItem,
  Spinner,
  Bullseye,
  Badge,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  Progress,
  ProgressSize,
  ProgressVariant,
} from '@patternfly/react-core';
import {
  PlayIcon,
  PauseIcon,
  PowerOffIcon,
  ExclamationTriangleIcon,
  EditIcon,
  TrashIcon,
  CpuIcon,
  ServerIcon,
  NetworkIcon,
  TagIcon,
  HistoryIcon,
  MonitoringIcon,
  EllipsisVIcon,
} from '@patternfly/react-icons';
import type { MenuToggleElement } from '@patternfly/react-core';
import {
  useVMDetailsWithAutoRefresh,
  usePowerOperationTracking,
  useStateChangeDetection,
  useAutoRefreshState,
} from '../../hooks';
import { transformVMData } from '../../utils/vmTransformers';
import {
  VMPowerActions,
  PowerOperationStatus,
  VMConfigurationTab,
} from '../../components/vms';
import {
  AutoRefreshControls,
  StateChangeIndicator,
} from '../../components/common';
import type { VM, VMStatus } from '../../types';
import { ROUTES, VM_STATUS_LABELS } from '../../utils/constants';

// Mock data for demonstration - in real app this would come from API
const mockVMActivity = [
  {
    id: '1',
    action: 'VM powered on',
    user: 'admin@example.com',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'completed',
  },
  {
    id: '2',
    action: 'Memory increased to 8GB',
    user: 'admin@example.com',
    timestamp: '2024-01-15T09:15:00Z',
    status: 'completed',
  },
  {
    id: '3',
    action: 'VM created',
    user: 'admin@example.com',
    timestamp: '2024-01-15T08:00:00Z',
    status: 'completed',
  },
];

const mockVMTags = ['production', 'web-server', 'ubuntu', 'team-alpha'];

const mockNetworkInterfaces = [
  {
    id: 'nic-1',
    name: 'Primary Network',
    ipAddress: '192.168.1.100',
    macAddress: '00:50:56:9a:8b:7c',
    networkName: 'VM Network',
    connected: true,
  },
  {
    id: 'nic-2',
    name: 'Internal Network',
    ipAddress: '10.0.1.50',
    macAddress: '00:50:56:9a:8b:7d',
    networkName: 'Internal',
    connected: true,
  },
];

const mockStorageDisks = [
  {
    id: 'disk-1',
    name: 'Hard disk 1',
    size: '40 GB',
    type: 'Thin Provisioned',
    used: '15.2 GB',
    usage: 38,
  },
  {
    id: 'disk-2',
    name: 'Hard disk 2',
    size: '20 GB',
    type: 'Thick Provisioned',
    used: '8.7 GB',
    usage: 44,
  },
];

const VMDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Auto-refresh state management
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useAutoRefreshState(
    'vm-detail-auto-refresh',
    true
  );

  // Use the CloudAPI to get individual VM details by ID with auto-refresh
  const {
    data: vmCloudAPI,
    isLoading,
    error,
    refetch: manualRefresh,
    dataUpdatedAt,
  } = useVMDetailsWithAutoRefresh(id, {
    autoRefresh: autoRefreshEnabled,
  });
  const [localVM, setLocalVM] = useState<VM | undefined>(undefined);

  // Transform CloudAPI VM to legacy format
  const vm = vmCloudAPI ? transformVMData(vmCloudAPI) : localVM || undefined;
  const { operations: powerOperations } = usePowerOperationTracking();

  // State change detection for visual indicators
  const { changedFields } = useStateChangeDetection(
    vmCloudAPI as Record<string, unknown> | undefined,
    ['status', 'deployed', 'guestOs', 'cpuCount', 'memoryMb']
  );

  // Initialize local VM state when fetched VM changes
  useEffect(() => {
    if (vm && !localVM) {
      setLocalVM(vm);
    }
  }, [vm, localVM]);

  const handleTabClick = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number
  ) => {
    setActiveTabKey(tabIndex);
  };

  const getStatusBadge = (status: VMStatus) => {
    const statusConfig = {
      POWERED_ON: { color: 'green' as const, icon: PlayIcon },
      POWERED_OFF: { color: 'red' as const, icon: PowerOffIcon },
      SUSPENDED: { color: 'orange' as const, icon: PauseIcon },
      UNRESOLVED: { color: 'grey' as const, icon: ExclamationTriangleIcon },
      INSTANTIATING: { color: 'blue' as const, icon: ExclamationTriangleIcon },
      RESOLVED: { color: 'blue' as const, icon: ExclamationTriangleIcon },
      DEPLOYED: { color: 'green' as const, icon: PlayIcon },
      FAILED: { color: 'red' as const, icon: ExclamationTriangleIcon },
      UNKNOWN: { color: 'grey' as const, icon: ExclamationTriangleIcon },
    };

    const config = statusConfig[status] || {
      color: 'grey' as const,
      icon: ExclamationTriangleIcon,
    };
    const IconComponent = config.icon;

    return (
      <Label color={config.color} icon={<IconComponent />}>
        {VM_STATUS_LABELS[status] || status}
      </Label>
    );
  };

  const formatMemory = (memoryMb: number) => {
    if (memoryMb >= 1024) {
      return `${(memoryMb / 1024).toFixed(1)} GB`;
    }
    return `${memoryMb} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVMActions = () => [
    {
      title: 'Edit Configuration',
      onClick: () => console.log('Edit VM:', id),
      icon: <EditIcon />,
    },
    { isSeparator: true },
    {
      title: 'Delete VM',
      onClick: () => console.log('Delete VM:', id),
      isDanger: true,
      icon: <TrashIcon />,
    },
  ];

  const handleAddTag = () => {
    if (newTag.trim()) {
      // In real app, would call API to add tag
      console.log('Adding tag:', newTag.trim());
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    // In real app, would call API to remove tag
    console.log('Removing tag:', tag);
  };

  const handleConfigurationChange = (updatedVM: VM) => {
    // Update the local VM state to reflect changes immediately
    setLocalVM(updatedVM);
    console.log('VM configuration updated:', updatedVM);
    // In a real implementation, you might also trigger a data refetch here
    // or show a success notification to the user
  };

  if (isLoading) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner size="xl" />
        </Bullseye>
      </PageSection>
    );
  }

  if (error || !vm) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title={error ? 'Error loading VM' : 'VM not found'}
          isInline
        >
          {error?.message || `VM with ID "${id}" could not be found.`}
        </Alert>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to={ROUTES.VMS}>Virtual Machines</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{vm.name}</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Stack>
                <StackItem>
                  <Title headingLevel="h1" size="xl">
                    {vm.name}
                  </Title>
                </StackItem>
                <StackItem>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <StateChangeIndicator
                        isChanged={changedFields.has('status')}
                      >
                        {getStatusBadge(vm.status)}
                      </StateChangeIndicator>
                    </FlexItem>
                    <FlexItem>
                      <span className="pf-v6-u-color-200">VM ID: {vm.id}</span>
                    </FlexItem>
                  </Flex>
                </StackItem>
              </Stack>
            </SplitItem>
            <SplitItem>
              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <VMPowerActions vm={vm} variant="buttons" size="sm" />
                </FlexItem>
                <FlexItem>
                  <Dropdown
                    isOpen={isActionsOpen}
                    onOpenChange={setIsActionsOpen}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsActionsOpen(!isActionsOpen)}
                        isExpanded={isActionsOpen}
                        icon={<EllipsisVIcon />}
                      >
                        Other Actions
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      {getVMActions().map((action, index) =>
                        action.isSeparator ? (
                          <DropdownItem key={`separator-${index}`} />
                        ) : (
                          <DropdownItem
                            key={action.title}
                            onClick={action.onClick}
                            isDanger={action.isDanger}
                            icon={action.icon}
                          >
                            {action.title}
                          </DropdownItem>
                        )
                      )}
                    </DropdownList>
                  </Dropdown>
                </FlexItem>
              </Flex>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Auto-refresh Controls */}
        <StackItem>
          <AutoRefreshControls
            isEnabled={autoRefreshEnabled}
            onToggle={setAutoRefreshEnabled}
            onManualRefresh={() => manualRefresh()}
            isLoading={isLoading}
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
          />
        </StackItem>

        {/* Main Content */}
        <StackItem>
          <Tabs
            activeKey={activeTabKey}
            onSelect={handleTabClick}
            aria-label="VM details tabs"
          >
            <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
              <TabContent eventKey={0} id="overview-tab">
                <TabContentBody>
                  <Grid hasGutter>
                    {/* VM Specifications */}
                    <GridItem span={6}>
                      <Card>
                        <CardBody>
                          <Title headingLevel="h3" size="lg">
                            <CpuIcon className="pf-v6-u-mr-sm" />
                            Specifications
                          </Title>
                          <Divider className="pf-v6-u-my-md" />
                          <DescriptionList>
                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                CPU Cores
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                <Badge>{vm.cpu_count} cores</Badge>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Memory</DescriptionListTerm>
                              <DescriptionListDescription>
                                <Badge>{formatMemory(vm.memory_mb)}</Badge>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>VDC</DescriptionListTerm>
                              <DescriptionListDescription>
                                <Link
                                  to={ROUTES.VDC_DETAIL.replace(
                                    ':id',
                                    vm.vdc_id
                                  )}
                                  className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                                >
                                  {vm.vdc_name}
                                </Link>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                Organization
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                <Link
                                  to={ROUTES.ORGANIZATION_DETAIL.replace(
                                    ':id',
                                    vm.org_id
                                  )}
                                  className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                                >
                                  {vm.org_name}
                                </Link>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Created</DescriptionListTerm>
                              <DescriptionListDescription>
                                {vm.created_at
                                  ? formatDate(vm.created_at)
                                  : 'N/A'}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                Last Updated
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                {vm.updated_at
                                  ? formatDate(vm.updated_at)
                                  : 'N/A'}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                          </DescriptionList>
                        </CardBody>
                      </Card>
                    </GridItem>

                    {/* Resource Usage */}
                    <GridItem span={6}>
                      <Card>
                        <CardBody>
                          <Title headingLevel="h3" size="lg">
                            <MonitoringIcon className="pf-v6-u-mr-sm" />
                            Resource Usage
                          </Title>
                          <Divider className="pf-v6-u-my-md" />
                          <Stack hasGutter>
                            <StackItem>
                              <div>
                                <span className="pf-v6-u-font-weight-bold">
                                  CPU Usage
                                </span>
                                <Progress
                                  value={45}
                                  title="CPU Usage"
                                  size={ProgressSize.sm}
                                  variant={ProgressVariant.success}
                                />
                                <span className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                                  45% of {vm.cpu_count} cores
                                </span>
                              </div>
                            </StackItem>
                            <StackItem>
                              <div>
                                <span className="pf-v6-u-font-weight-bold">
                                  Memory Usage
                                </span>
                                <Progress
                                  value={62}
                                  title="Memory Usage"
                                  size={ProgressSize.sm}
                                  variant={ProgressVariant.warning}
                                />
                                <span className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                                  62% of {formatMemory(vm.memory_mb)}
                                </span>
                              </div>
                            </StackItem>
                            <StackItem>
                              <div>
                                <span className="pf-v6-u-font-weight-bold">
                                  Storage Usage
                                </span>
                                <Progress
                                  value={78}
                                  title="Storage Usage"
                                  size={ProgressSize.sm}
                                  variant={ProgressVariant.danger}
                                />
                                <span className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                                  78% of allocated storage
                                </span>
                              </div>
                            </StackItem>
                          </Stack>
                        </CardBody>
                      </Card>
                    </GridItem>

                    {/* Tags and Labels */}
                    <GridItem span={12}>
                      <Card>
                        <CardBody>
                          <Stack hasGutter>
                            <StackItem>
                              <Split hasGutter>
                                <SplitItem isFilled>
                                  <Title headingLevel="h3" size="lg">
                                    <TagIcon className="pf-v6-u-mr-sm" />
                                    Tags & Labels
                                  </Title>
                                </SplitItem>
                                <SplitItem>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsAddingTag(true)}
                                  >
                                    Add Tag
                                  </Button>
                                </SplitItem>
                              </Split>
                            </StackItem>
                            <StackItem>
                              <Flex
                                spaceItems={{ default: 'spaceItemsSm' }}
                                flexWrap={{ default: 'wrap' }}
                              >
                                {mockVMTags.map((tag) => (
                                  <FlexItem key={tag}>
                                    <Label
                                      color="blue"
                                      onClose={() => handleRemoveTag(tag)}
                                      closeBtnAriaLabel={`Remove ${tag} tag`}
                                    >
                                      {tag}
                                    </Label>
                                  </FlexItem>
                                ))}
                                {isAddingTag && (
                                  <FlexItem>
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) =>
                                          setNewTag(e.target.value)
                                        }
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') handleAddTag();
                                          if (e.key === 'Escape')
                                            setIsAddingTag(false);
                                        }}
                                        placeholder="New tag..."
                                        className="pf-v6-c-form-control"
                                        style={{
                                          width: '120px',
                                          marginRight: '8px',
                                        }}
                                      />
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleAddTag}
                                      >
                                        Add
                                      </Button>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => setIsAddingTag(false)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </FlexItem>
                                )}
                              </Flex>
                            </StackItem>
                          </Stack>
                        </CardBody>
                      </Card>
                    </GridItem>
                  </Grid>
                </TabContentBody>
              </TabContent>
            </Tab>

            <Tab eventKey={1} title={<TabTitleText>Network</TabTitleText>}>
              <TabContent eventKey={1} id="network-tab">
                <TabContentBody>
                  <Card>
                    <CardBody>
                      <Title headingLevel="h3" size="lg">
                        <NetworkIcon className="pf-v6-u-mr-sm" />
                        Network Interfaces
                      </Title>
                      <Divider className="pf-v6-u-my-md" />
                      <Grid hasGutter>
                        {mockNetworkInterfaces.map((nic) => (
                          <GridItem key={nic.id} span={6}>
                            <Card isCompact>
                              <CardBody>
                                <Stack hasGutter>
                                  <StackItem>
                                    <Split hasGutter>
                                      <SplitItem isFilled>
                                        <Title headingLevel="h4" size="md">
                                          {nic.name}
                                        </Title>
                                      </SplitItem>
                                      <SplitItem>
                                        <Label
                                          color={
                                            nic.connected ? 'green' : 'red'
                                          }
                                        >
                                          {nic.connected
                                            ? 'Connected'
                                            : 'Disconnected'}
                                        </Label>
                                      </SplitItem>
                                    </Split>
                                  </StackItem>
                                  <StackItem>
                                    <DescriptionList isCompact>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          IP Address
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          {nic.ipAddress}
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          MAC Address
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          {nic.macAddress}
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          Network
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          {nic.networkName}
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                    </DescriptionList>
                                  </StackItem>
                                </Stack>
                              </CardBody>
                            </Card>
                          </GridItem>
                        ))}
                      </Grid>
                    </CardBody>
                  </Card>
                </TabContentBody>
              </TabContent>
            </Tab>

            <Tab eventKey={2} title={<TabTitleText>Storage</TabTitleText>}>
              <TabContent eventKey={2} id="storage-tab">
                <TabContentBody>
                  <Card>
                    <CardBody>
                      <Title headingLevel="h3" size="lg">
                        <ServerIcon className="pf-v6-u-mr-sm" />
                        Storage Disks
                      </Title>
                      <Divider className="pf-v6-u-my-md" />
                      <Grid hasGutter>
                        {mockStorageDisks.map((disk) => (
                          <GridItem key={disk.id} span={6}>
                            <Card isCompact>
                              <CardBody>
                                <Stack hasGutter>
                                  <StackItem>
                                    <Title headingLevel="h4" size="md">
                                      {disk.name}
                                    </Title>
                                  </StackItem>
                                  <StackItem>
                                    <DescriptionList isCompact>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          Size
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          {disk.size}
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          Type
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          {disk.type}
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          Used
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          {disk.used}
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                    </DescriptionList>
                                  </StackItem>
                                  <StackItem>
                                    <Progress
                                      value={disk.usage}
                                      title={`${disk.name} usage`}
                                      size={ProgressSize.sm}
                                      variant={
                                        disk.usage > 80
                                          ? ProgressVariant.danger
                                          : disk.usage > 60
                                            ? ProgressVariant.warning
                                            : ProgressVariant.success
                                      }
                                    />
                                    <span className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                                      {disk.usage}% used
                                    </span>
                                  </StackItem>
                                </Stack>
                              </CardBody>
                            </Card>
                          </GridItem>
                        ))}
                      </Grid>
                    </CardBody>
                  </Card>
                </TabContentBody>
              </TabContent>
            </Tab>

            <Tab
              eventKey={3}
              title={<TabTitleText>Configuration</TabTitleText>}
            >
              <TabContent eventKey={3} id="configuration-tab">
                <TabContentBody>
                  <VMConfigurationTab
                    vm={vm}
                    onConfigurationChange={handleConfigurationChange}
                  />
                </TabContentBody>
              </TabContent>
            </Tab>

            <Tab eventKey={4} title={<TabTitleText>Activity</TabTitleText>}>
              <TabContent eventKey={4} id="activity-tab">
                <TabContentBody>
                  <Card>
                    <CardBody>
                      <Title headingLevel="h3" size="lg">
                        <HistoryIcon className="pf-v6-u-mr-sm" />
                        Recent Activity
                      </Title>
                      <Divider className="pf-v6-u-my-md" />
                      <Stack hasGutter>
                        {mockVMActivity.map((activity) => (
                          <StackItem key={activity.id}>
                            <Card isCompact>
                              <CardBody>
                                <Stack>
                                  <StackItem>
                                    <Content>
                                      <strong>{activity.action}</strong>
                                    </Content>
                                  </StackItem>
                                  <StackItem>
                                    <span className="pf-v6-u-color-200">
                                      by {activity.user} •{' '}
                                      {formatDate(activity.timestamp)}
                                    </span>
                                  </StackItem>
                                </Stack>
                              </CardBody>
                            </Card>
                          </StackItem>
                        ))}
                      </Stack>
                    </CardBody>
                  </Card>
                </TabContentBody>
              </TabContent>
            </Tab>
          </Tabs>
        </StackItem>
      </Stack>

      {/* Power Operation Status */}
      <PowerOperationStatus operations={powerOperations} />
    </PageSection>
  );
};

export default VMDetail;
