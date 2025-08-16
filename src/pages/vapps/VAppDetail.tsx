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
import {
  useVAppWithAutoRefresh,
  usePowerOperationTracking,
  useStateChangeDetection,
  useAutoRefreshState,
} from '../../hooks';
import { VMPowerActions, PowerOperationStatus } from '../../components/vms';
import {
  AutoRefreshControls,
  StateChangeIndicator,
} from '../../components/common';
import { transformVMData } from '../../utils/vmTransformers';
import { VMService } from '../../services/cloudapi/VMService';
import { VDCService } from '../../services/cloudapi/VDCService';
import type { VMStatus, VMCloudAPI, VMHardwareSection, VDC } from '../../types';
import { ROUTES, VM_STATUS_LABELS } from '../../utils/constants';

interface VMDetailData {
  vm: VMCloudAPI;
  hardware?: VMHardwareSection;
  loading: boolean;
  error?: string;
}

const VAppDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [vmDetails, setVmDetails] = useState<Map<string, VMDetailData>>(
    new Map()
  );
  const [vdcData, setVdcData] = useState<VDC | null>(null);
  const [vdcLoading, setVdcLoading] = useState(false);

  // Auto-refresh state management
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useAutoRefreshState(
    'vapp-detail-auto-refresh',
    true
  );

  // Data fetching with auto-refresh
  const {
    data: vApp,
    isLoading,
    error,
    refetch: manualRefresh,
    dataUpdatedAt,
  } = useVAppWithAutoRefresh(id!, {
    autoRefresh: autoRefreshEnabled,
  });

  const { operations: powerOperations } = usePowerOperationTracking();

  // State change detection for visual indicators with derived fields
  const derivedVApp = vApp
    ? {
        ...vApp,
        vmsCount: vApp.vms?.length ?? 0,
      }
    : undefined;

  const { changedFields } = useStateChangeDetection(
    derivedVApp as Record<string, unknown> | undefined,
    ['status', 'powerState', 'deployed', 'vmsCount']
  );

  // Fetch VDC details when vApp data is available
  useEffect(() => {
    if (!vApp?.vdcId) return;

    const fetchVDCDetails = async () => {
      setVdcLoading(true);
      try {
        const vdc = await VDCService.getVDC(vApp.vdcId);
        setVdcData(vdc);
      } catch (error) {
        console.error('Failed to fetch VDC details:', error);
        setVdcData(null);
      } finally {
        setVdcLoading(false);
      }
    };

    fetchVDCDetails();
  }, [vApp?.vdcId]);

  // Fetch VM details for all VMs in the vApp
  useEffect(() => {
    if (!vApp?.vms || vApp.vms.length === 0) return;

    const fetchVMDetails = async () => {
      const newVmDetails = new Map<string, VMDetailData>();

      for (const vmCloudAPI of vApp.vms!) {
        const vmId = vmCloudAPI.href
          ? extractVMIdFromHref(vmCloudAPI.href) || vmCloudAPI.id
          : vmCloudAPI.id;

        // Initialize loading state
        newVmDetails.set(vmId, {
          vm: vmCloudAPI,
          loading: true,
        });

        try {
          // Fetch VM details and hardware in parallel
          const [vmDetail, vmHardware] = await Promise.all([
            VMService.getVM(vmId),
            VMService.getVMHardware(vmId).catch(() => undefined), // Hardware might not be available
          ]);

          newVmDetails.set(vmId, {
            vm: vmDetail,
            hardware: vmHardware,
            loading: false,
          });
        } catch (error) {
          console.error(`Failed to fetch details for VM ${vmId}:`, error);
          newVmDetails.set(vmId, {
            vm: vmCloudAPI, // Fallback to original data
            loading: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      setVmDetails(newVmDetails);
    };

    fetchVMDetails();
  }, [vApp?.vms]);

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

  const getVAppStatusBadge = (status: string) => {
    const statusConfig = {
      INSTANTIATING: { color: 'blue' as const, icon: ExclamationTriangleIcon },
      RESOLVED: { color: 'blue' as const, icon: ExclamationTriangleIcon },
      DEPLOYED: { color: 'green' as const, icon: PlayIcon },
      POWERED_ON: { color: 'green' as const, icon: PlayIcon },
      POWERED_OFF: { color: 'red' as const, icon: PowerOffIcon },
      MIXED: { color: 'orange' as const, icon: ExclamationTriangleIcon },
      FAILED: { color: 'red' as const, icon: ExclamationTriangleIcon },
      UNKNOWN: { color: 'grey' as const, icon: ExclamationTriangleIcon },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: 'grey' as const,
      icon: ExclamationTriangleIcon,
    };
    const IconComponent = config.icon;

    return (
      <Label color={config.color} icon={<IconComponent />}>
        {status}
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

  const getCPUFromHardware = (hardware?: VMHardwareSection): number => {
    if (!hardware?.items) return 0;
    const cpuItem = hardware.items.find((item) => item.resourceType === 3);
    return cpuItem?.virtualQuantity || 0;
  };

  const getMemoryFromHardware = (hardware?: VMHardwareSection): number => {
    if (!hardware?.items) return 0;
    const memoryItem = hardware.items.find((item) => item.resourceType === 4);
    return memoryItem?.virtualQuantity || 0;
  };

  const extractVMIdFromHref = (href: string): string | null => {
    // Extract VM ID from href like "https://vcd.example.com/cloudapi/1.0.0/vms/urn:vcloud:vm:..."
    const parts = href.split('/vms/');
    if (parts.length > 1) {
      return decodeURIComponent(parts[1]);
    }
    return null; // return null on parse failure
  };

  const getVMActions = (vmCloudAPI: VMCloudAPI) => {
    const vmId = vmCloudAPI.href
      ? extractVMIdFromHref(vmCloudAPI.href) || vmCloudAPI.id
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
                vApp in {vdcLoading ? 'Loading VDC...' : (vdcData?.name || vApp.vdc?.name || 'Unknown VDC')}
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
                        {vdcLoading ? (
                          <Spinner size="sm" />
                        ) : vdcData ? (
                          <Link
                            to={ROUTES.VDC_DETAIL.replace(':id', vdcData.id)}
                            className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                          >
                            {vdcData.name}
                          </Link>
                        ) : vApp.vdc?.id ? (
                          <Link
                            to={ROUTES.VDC_DETAIL.replace(':id', vApp.vdc.id)}
                            className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                          >
                            {vApp.vdc.name || vApp.vdc.id || 'Unknown VDC'}
                          </Link>
                        ) : (
                          'No VDC specified'
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Organization</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vdcLoading ? (
                          <Spinner size="sm" />
                        ) : vdcData?.org ? (
                          <Link
                            to={ROUTES.ORGANIZATION_DETAIL.replace(
                              ':id',
                              vdcData.org.id
                            )}
                            className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                          >
                            {vdcData.org.name}
                          </Link>
                        ) : vApp.org?.id ? (
                          <Link
                            to={ROUTES.ORGANIZATION_DETAIL.replace(
                              ':id',
                              vApp.org.id
                            )}
                            className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                          >
                            {vApp.org.name ||
                              vApp.org.id ||
                              'Unknown Organization'}
                          </Link>
                        ) : (
                          'No organization specified'
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
                        <StateChangeIndicator
                          isChanged={changedFields.has('status')}
                        >
                          {vApp.status
                            ? getVAppStatusBadge(vApp.status)
                            : 'Unknown'}
                        </StateChangeIndicator>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>VMs</DescriptionListTerm>
                      <DescriptionListDescription>
                        <StateChangeIndicator
                          isChanged={changedFields.has('vmsCount')}
                        >
                          <Badge>{vApp.vms?.length || 0} VMs</Badge>
                        </StateChangeIndicator>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Created</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vApp.createdAt || vApp.createdDate
                          ? formatDate(vApp.createdAt || vApp.createdDate)
                          : 'Unknown'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Modified</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vApp.updatedAt || vApp.lastModifiedDate
                          ? formatDate(vApp.updatedAt || vApp.lastModifiedDate)
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
                              const vmId = vmCloudAPI.href
                                ? extractVMIdFromHref(vmCloudAPI.href) ||
                                  vmCloudAPI.id
                                : vmCloudAPI.id;

                              const vmDetailData = vmDetails.get(vmId);
                              const vm = transformVMData(vmCloudAPI);

                              // Use detailed VM data if available, otherwise fallback to original
                              const detailedVM = vmDetailData?.vm || vmCloudAPI;
                              const hardware = vmDetailData?.hardware;
                              const isLoading = vmDetailData?.loading ?? true;

                              // Create effective hardware with fallbacks
                              const effectiveHardware =
                                hardware || detailedVM.virtualHardwareSection;

                              // Create VM for actions with most up-to-date data and hardware fallback
                              const vmForActions = {
                                ...vm,
                                ...transformVMData({
                                  ...detailedVM,
                                  virtualHardwareSection: effectiveHardware,
                                }),
                              };

                              // Add defensive check for VM data
                              if (!vm || !vm.id) {
                                console.warn(
                                  'Invalid VM data:',
                                  vm,
                                  'from CloudAPI VM:',
                                  vmCloudAPI
                                );
                                return null;
                              }

                              return (
                                <Tr key={vmCloudAPI.id}>
                                  <Td>
                                    <div>
                                      <Link
                                        to={`/vms/${encodeURIComponent(vmId)}`}
                                        className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                                      >
                                        <strong>{detailedVM.name}</strong>
                                      </Link>
                                    </div>
                                  </Td>
                                  <Td>{getStatusBadge(detailedVM.status)}</Td>
                                  <Td>
                                    {isLoading ? (
                                      <Spinner size="sm" />
                                    ) : (
                                      (() => {
                                        const cpuCount =
                                          getCPUFromHardware(effectiveHardware);
                                        return cpuCount > 0
                                          ? `${cpuCount} cores`
                                          : 'N/A';
                                      })()
                                    )}
                                  </Td>
                                  <Td>
                                    {isLoading ? (
                                      <Spinner size="sm" />
                                    ) : (
                                      (() => {
                                        const memoryMb =
                                          getMemoryFromHardware(
                                            effectiveHardware
                                          );
                                        return memoryMb > 0
                                          ? formatMemory(memoryMb)
                                          : 'N/A';
                                      })()
                                    )}
                                  </Td>
                                  <Td>
                                    {isLoading ? (
                                      <Spinner size="sm" />
                                    ) : detailedVM.createdDate ? (
                                      formatDate(detailedVM.createdDate)
                                    ) : (
                                      'Unknown'
                                    )}
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
                                        vm={vmForActions}
                                        variant="dropdown"
                                        size="sm"
                                      />
                                      <ActionsColumn
                                        items={getVMActions(detailedVM)}
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
