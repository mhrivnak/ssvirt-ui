import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  ModalVariant,
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
  useIsSystemAdmin,
  useDeleteVApp,
} from '../../hooks';
import { VMPowerActions, PowerOperationStatus } from '../../components/vms';
import {
  AutoRefreshControls,
  StateChangeIndicator,
} from '../../components/common';
import { transformVMData } from '../../utils/vmTransformers';
import { VMService } from '../../services/cloudapi/VMService';
import { VDCPublicService } from '../../services/cloudapi/VDCPublicService';
import { VDCAdminService } from '../../services/cloudapi/VDCAdminService';
import { OrganizationService } from '../../services/cloudapi/OrganizationService';
import type { VMStatus, VMCloudAPI, VDC } from '../../types';
import { ROUTES, VM_STATUS_LABELS } from '../../utils/constants';

interface VMDetailData {
  vm: VMCloudAPI;
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
  const [orgData, setOrgData] = useState<{
    id: string;
    name: string;
    displayName: string;
  } | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    vAppId: string;
    vAppName: string;
  }>({ isOpen: false, vAppId: '', vAppName: '' });

  // Track attempted fetches to prevent hot loops
  const attemptedFetches = useRef<Set<string>>(new Set());

  // Get user permissions to determine if they are System Admin
  const { isSystemAdmin } = useIsSystemAdmin();

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

  // Mutations
  const deleteVAppMutation = useDeleteVApp();

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
    if (!vApp) {
      setVdcData(null);
      setOrgData(null);
      return;
    }

    // Try to get VDC ID from either vdcId field or vdc.id field
    const vdcId = vApp.vdcId || vApp.vdc?.id;

    if (!vdcId) {
      setVdcData(null);
      setOrgData(null);
      return;
    }

    // Create a unique key for this fetch attempt to prevent retries
    const fetchKey = `${vApp.id}-${vdcId}-${isSystemAdmin}`;

    // Check if we've already attempted this fetch
    if (attemptedFetches.current.has(fetchKey)) {
      return;
    }

    // Mark this fetch as attempted
    attemptedFetches.current.add(fetchKey);

    let isCancelled = false;

    const fetchVDCDetails = async () => {
      if (isCancelled) return;

      setVdcLoading(true);
      try {
        if (isSystemAdmin) {
          // For system admins, try to get organization information through admin API
          // But fall back to public API if it fails
          try {
            const orgsResponse = await OrganizationService.getOrganizations();

            if (
              !isCancelled &&
              orgsResponse.values &&
              orgsResponse.values.length > 0
            ) {
              // Store the organization data separately since VDC response doesn't include it
              const firstOrg = orgsResponse.values[0];
              setOrgData({
                id: firstOrg.id,
                name: firstOrg.name,
                displayName: firstOrg.displayName,
              });

              // Try to get VDC details from admin API for the first organization
              try {
                const vdc = await VDCAdminService.getVDC(
                  orgsResponse.values[0].id,
                  vdcId
                );
                if (!isCancelled) {
                  setVdcData(vdc);
                }
              } catch (adminError) {
                console.warn(
                  'Admin VDC API failed, falling back to public API:',
                  adminError
                );
                // Fallback to public API
                if (!isCancelled) {
                  const vdc = await VDCPublicService.getVDC(vdcId);
                  setVdcData(vdc);
                }
              }
            } else if (!isCancelled) {
              // No organizations found, use public API
              const vdc = await VDCPublicService.getVDC(vdcId);
              setVdcData(vdc);
            }
          } catch (orgError) {
            console.warn(
              'Failed to fetch organizations, falling back to public VDC API:',
              orgError
            );
            // If organizations API fails, fall back to public VDC API
            if (!isCancelled) {
              const vdc = await VDCPublicService.getVDC(vdcId);
              setVdcData(vdc);
            }
          }
        } else {
          // For regular users, use public API
          const vdc = await VDCPublicService.getVDC(vdcId);
          if (!isCancelled) {
            setVdcData(vdc);
          }
        }
      } catch (error) {
        console.error('Failed to fetch VDC details:', error);
        if (!isCancelled) {
          setVdcData(null);
        }
      } finally {
        if (!isCancelled) {
          setVdcLoading(false);
        }
      }
    };

    fetchVDCDetails();

    // Cleanup function to prevent state updates if component unmounts or effect re-runs
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vApp?.id, vApp?.vdcId, vApp?.vdc?.id, isSystemAdmin]);

  // Clear attempted fetches cache when vApp changes
  useEffect(() => {
    attemptedFetches.current.clear();
    setOrgData(null);
  }, [vApp?.id]);

  // Fetch VM details for all VMs in the vApp
  useEffect(() => {
    if (!vApp?.vms || vApp.vms.length === 0) return;

    const fetchVMDetails = async () => {
      const newVmDetails = new Map<string, VMDetailData>();

      for (const vmCloudAPI of vApp.vms!) {
        const vmId = vmCloudAPI.href
          ? extractVMIdFromHref(vmCloudAPI.href) || vmCloudAPI.id
          : vmCloudAPI.id;

        // Check if VM already has the necessary data
        const hasHardwareData =
          !!vmCloudAPI.hardware?.numCpus && !!vmCloudAPI.hardware?.memoryMB;
        const hasCreatedDate =
          !!vmCloudAPI.createdAt || !!vmCloudAPI.createdDate;

        // If VM already has all necessary data, use it directly
        if (hasHardwareData && hasCreatedDate) {
          newVmDetails.set(vmId, {
            vm: vmCloudAPI,
            loading: false,
          });
          continue;
        }

        // Initialize loading state for VMs that need additional data
        newVmDetails.set(vmId, {
          vm: vmCloudAPI,
          loading: true,
        });

        try {
          // Fetch VM details
          const vmDetail = await VMService.getVM(vmId);

          newVmDetails.set(vmId, {
            vm: vmDetail,
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

  const getCPUFromVM = (vm: VMCloudAPI): number => {
    return vm.hardware?.numCpus || 0;
  };

  const getMemoryFromVM = (vm: VMCloudAPI): number => {
    return vm.hardware?.memoryMB || 0;
  };

  const extractVMIdFromHref = (href: string): string | null => {
    // Extract VM ID from href like "https://vcd.example.com/cloudapi/1.0.0/vms/urn:vcloud:vm:..."
    const parts = href.split('/vms/');
    if (parts.length > 1) {
      return decodeURIComponent(parts[1]);
    }
    return null; // return null on parse failure
  };

  const confirmDeleteVApp = async () => {
    if (!deleteConfirmation.vAppId) return;

    try {
      await deleteVAppMutation.mutateAsync(deleteConfirmation.vAppId);
      setDeleteConfirmation({ isOpen: false, vAppId: '', vAppName: '' });
      // Navigate back to VMs list after successful deletion
      window.location.href = ROUTES.VMS;
    } catch (error) {
      console.error('Failed to delete vApp:', error);
      // The error will be displayed via the mutation's error handling
    }
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
                vApp in{' '}
                {vdcLoading
                  ? 'Loading VDC...'
                  : vdcData?.name || vApp.vdc?.name || 'Unknown VDC'}
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
                  <Button
                    variant="danger"
                    icon={<TrashIcon />}
                    onClick={() =>
                      setDeleteConfirmation({
                        isOpen: true,
                        vAppId: vApp.id,
                        vAppName: vApp.name,
                      })
                    }
                  >
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
                    {/* Only show Organization field for System Administrators */}
                    {isSystemAdmin && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Organization</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vdcLoading ? (
                            <Spinner size="sm" />
                          ) : orgData ? (
                            <Link
                              to={ROUTES.ORGANIZATION_DETAIL.replace(
                                ':id',
                                orgData.id
                              )}
                              className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                            >
                              {orgData.displayName}
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
                            'Organization not available'
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
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
                              const isLoading = vmDetailData?.loading ?? true;

                              // Use the detailed VM data which should have hardware info embedded

                              // Create VM for actions with most up-to-date data
                              const vmForActions = {
                                ...vm,
                                ...transformVMData(detailedVM),
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
                                          getCPUFromVM(detailedVM);
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
                                          getMemoryFromVM(detailedVM);
                                        return memoryMb > 0
                                          ? formatMemory(memoryMb)
                                          : 'N/A';
                                      })()
                                    )}
                                  </Td>
                                  <Td>
                                    {isLoading ? (
                                      <Spinner size="sm" />
                                    ) : detailedVM.createdAt ||
                                      detailedVM.createdDate ? (
                                      formatDate(
                                        (detailedVM.createdAt ||
                                          detailedVM.createdDate)!
                                      )
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

      {/* Delete Confirmation Modal */}
      <Modal
        variant={ModalVariant.small}
        title="Delete vApp"
        isOpen={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation({ isOpen: false, vAppId: '', vAppName: '' })
        }
      >
        <Stack hasGutter>
          <StackItem>
            <p>
              Are you sure you want to delete the vApp{' '}
              <strong>{deleteConfirmation.vAppName}</strong>? This action cannot
              be undone.
            </p>
          </StackItem>
          {vApp?.vms && vApp.vms.length > 0 && (
            <StackItem>
              <Alert variant={AlertVariant.warning} isInline title="Warning">
                This vApp contains {vApp.vms.length} virtual machine(s) that
                will also be deleted.
              </Alert>
            </StackItem>
          )}
          {deleteVAppMutation.error && (
            <StackItem>
              <Alert
                variant={AlertVariant.danger}
                isInline
                title="Error deleting vApp"
              >
                {deleteVAppMutation.error instanceof Error
                  ? deleteVAppMutation.error.message
                  : String(deleteVAppMutation.error)}
              </Alert>
            </StackItem>
          )}
          <StackItem>
            <Split hasGutter>
              <SplitItem isFilled />
              <SplitItem>
                <Button
                  variant="link"
                  onClick={() =>
                    setDeleteConfirmation({
                      isOpen: false,
                      vAppId: '',
                      vAppName: '',
                    })
                  }
                  isDisabled={deleteVAppMutation.isPending}
                >
                  Cancel
                </Button>
              </SplitItem>
              <SplitItem>
                <Button
                  variant="danger"
                  onClick={confirmDeleteVApp}
                  isLoading={deleteVAppMutation.isPending}
                  isDisabled={deleteVAppMutation.isPending}
                >
                  Delete
                </Button>
              </SplitItem>
            </Split>
          </StackItem>
        </Stack>
      </Modal>
    </PageSection>
  );
};

export default VAppDetail;
