import React, { useState } from 'react';
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
  Flex,
  FlexItem,
  Spinner,
  Bullseye,
  Badge,
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ActionsColumn,
  TableVariant,
} from '@patternfly/react-table';
import {
  PlayIcon,
  PauseIcon,
  PowerOffIcon,
  ExclamationTriangleIcon,
  EditIcon,
  TrashIcon,
} from '@patternfly/react-icons';
import { useVApp, usePowerOperationTracking } from '../../hooks';
import { VMPowerActions, PowerOperationStatus } from '../../components/vms';
import { transformVMData } from '../../utils/vmTransformers';
import type { VMStatus, VMCloudAPI } from '../../types';
import { ROUTES, VM_STATUS_LABELS } from '../../utils/constants';

const VAppDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);

  // Data fetching
  const { data: vApp, isLoading, error } = useVApp(id!);
  const { operations: powerOperations } = usePowerOperationTracking();

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

    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <Label color={config.color} icon={<IconComponent />}>
        {VM_STATUS_LABELS[status]}
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

  const extractVMIdFromHref = (href: string): string => {
    // Extract VM ID from href like "https://vcd.example.com/cloudapi/1.0.0/vms/urn:vcloud:vm:..."
    const parts = href.split('/vms/');
    if (parts.length > 1) {
      return decodeURIComponent(parts[1]);
    }
    return href; // fallback to the full href if parsing fails
  };

  const getVMActions = (vmCloudAPI: VMCloudAPI) => {
    const vmId = vmCloudAPI.href
      ? extractVMIdFromHref(vmCloudAPI.href)
      : vmCloudAPI.id;
    return [
      {
        title: 'View Details',
        onClick: () =>
          window.open(`/vms/${encodeURIComponent(vmId)}`, '_blank'),
      },
      { isSeparator: true },
      {
        title: 'Delete',
        onClick: () => console.log('Delete VM:', vmId),
        isDanger: true,
      },
    ];
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

  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading vApp"
          isInline
        >
          {errorMessage}
        </Alert>
      </PageSection>
    );
  }

  if (!vApp) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.warning} title="vApp not found" isInline>
          The requested vApp could not be found.
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
              <Link to={ROUTES.VMS}>Virtual Applications</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{vApp.name}</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                {vApp.name}
              </Title>
              <p className="pf-v6-u-color-200">
                vApp in {vApp.vdc?.name || 'Unknown VDC'}
              </p>
            </SplitItem>
            <SplitItem>
              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <Button variant="secondary" icon={<EditIcon />}>
                    Edit vApp
                  </Button>
                </FlexItem>
                <FlexItem>
                  <Button variant="danger" icon={<TrashIcon />}>
                    Delete vApp
                  </Button>
                </FlexItem>
              </Flex>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Basic Info Card */}
        <StackItem>
          <Card>
            <CardBody>
              <Grid hasGutter>
                <GridItem span={6}>
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>
                        <strong>{vApp.name}</strong>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Description</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vApp.description || 'No description'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>VDC</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vApp.vdc?.id ? (
                          <Link
                            to={ROUTES.VDC_DETAIL.replace(':id', vApp.vdc.id)}
                            className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                          >
                            {vApp.vdc.name || 'Unknown'}
                          </Link>
                        ) : (
                          vApp.vdc?.name || 'Unknown'
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Organization</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vApp.org?.id ? (
                          <Link
                            to={ROUTES.ORGANIZATION_DETAIL.replace(
                              ':id',
                              vApp.org.id
                            )}
                            className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                          >
                            {vApp.org.name || 'Unknown'}
                          </Link>
                        ) : (
                          vApp.org?.name || 'Unknown'
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
                <GridItem span={6}>
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Status</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vApp.status ? (
                          <Label color="blue">{vApp.status}</Label>
                        ) : (
                          'Unknown'
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>VMs</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Badge>{vApp.vms?.length || 0} VMs</Badge>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Created</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vApp.createdDate
                          ? formatDate(vApp.createdDate)
                          : 'Unknown'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Modified</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vApp.lastModifiedDate
                          ? formatDate(vApp.lastModifiedDate)
                          : 'Unknown'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
              </Grid>
            </CardBody>
          </Card>
        </StackItem>

        {/* Tabbed Content */}
        <StackItem>
          <Card>
            <CardBody>
              <Tabs
                activeKey={activeTabKey}
                onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}
                aria-label="vApp details tabs"
              >
                <Tab
                  eventKey={0}
                  title={<TabTitleText>Virtual Machines</TabTitleText>}
                  aria-label="Virtual machines tab"
                >
                  <TabContent
                    eventKey={0}
                    id="refTab1Section"
                    aria-label="Virtual machines section"
                  >
                    <TabContentBody>
                      {vApp.vms && vApp.vms.length > 0 ? (
                        <Table variant={TableVariant.compact}>
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
                            {vApp.vms.map((vmCloudAPI) => {
                              const vm = transformVMData(vmCloudAPI);
                              const vmId = vmCloudAPI.href
                                ? extractVMIdFromHref(vmCloudAPI.href)
                                : vmCloudAPI.id;
                              return (
                                <Tr key={vmCloudAPI.id}>
                                  <Td>
                                    <div>
                                      <Link
                                        to={`/vms/${encodeURIComponent(vmId)}`}
                                        className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                                      >
                                        <strong>{vmCloudAPI.name}</strong>
                                      </Link>
                                    </div>
                                  </Td>
                                  <Td>{getStatusBadge(vmCloudAPI.status)}</Td>
                                  <Td>
                                    {vm.cpu_count
                                      ? `${vm.cpu_count} cores`
                                      : 'N/A'}
                                  </Td>
                                  <Td>
                                    {vm.memory_mb
                                      ? formatMemory(vm.memory_mb)
                                      : 'N/A'}
                                  </Td>
                                  <Td>
                                    {vmCloudAPI.createdDate
                                      ? formatDate(vmCloudAPI.createdDate)
                                      : 'Unknown'}
                                  </Td>
                                  <Td>
                                    <div
                                      style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <VMPowerActions
                                        vm={vm}
                                        variant="dropdown"
                                        size="sm"
                                      />
                                      <ActionsColumn
                                        items={getVMActions(vmCloudAPI)}
                                      />
                                    </div>
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      ) : (
                        <Alert
                          variant={AlertVariant.info}
                          isInline
                          title="No virtual machines"
                        >
                          This vApp does not contain any virtual machines.
                        </Alert>
                      )}
                    </TabContentBody>
                  </TabContent>
                </Tab>

                <Tab
                  eventKey={1}
                  title={<TabTitleText>Network</TabTitleText>}
                  aria-label="Network tab"
                >
                  <TabContent
                    eventKey={1}
                    id="refTab2Section"
                    aria-label="Network section"
                  >
                    <TabContentBody>
                      <Alert
                        variant={AlertVariant.info}
                        isInline
                        title="Network configuration"
                      >
                        Network details will be implemented in a future update.
                      </Alert>
                    </TabContentBody>
                  </TabContent>
                </Tab>

                <Tab
                  eventKey={2}
                  title={<TabTitleText>Configuration</TabTitleText>}
                  aria-label="Configuration tab"
                >
                  <TabContent
                    eventKey={2}
                    id="refTab3Section"
                    aria-label="Configuration section"
                  >
                    <TabContentBody>
                      <Alert
                        variant={AlertVariant.info}
                        isInline
                        title="Configuration details"
                      >
                        Configuration details will be implemented in a future
                        update.
                      </Alert>
                    </TabContentBody>
                  </TabContent>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>

      {/* Power Operation Status */}
      <PowerOperationStatus operations={powerOperations} />
    </PageSection>
  );
};

export default VAppDetail;
