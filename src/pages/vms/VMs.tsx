import React, { useState, useEffect, useMemo } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  SearchInput,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Label,
  Checkbox,
  Dropdown,
  DropdownList,
  DropdownItem,
  Breadcrumb,
  BreadcrumbItem,
  EmptyState,
  EmptyStateVariant,
  EmptyStateBody,
  EmptyStateActions,
  Bullseye,
  Spinner,
  Alert,
  AlertVariant,
  Modal,
  ModalVariant,
  Flex,
  FlexItem,
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
  FilterIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  PowerOffIcon,
  TrashIcon,
  VirtualMachineIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import { Link, useNavigate } from 'react-router-dom';
import {
  useVApps,
  useVDCs,
  useOrganizationVDCs,
  useOrganizations,
  usePowerOperationTracking,
  useDeleteVApp,
  useUserPermissions,
  useVAppsSessionFilters,
} from '../../hooks';
import {
  VMPowerActions,
  PowerOperationStatus,
  VMCreationWizard,
} from '../../components/vms';
import { transformVMData } from '../../utils/vmTransformers';
import type { VM, VMStatus, VMQueryParams, VApp } from '../../types';
import type { MenuToggleElement } from '@patternfly/react-core';
import { ROUTES, VM_STATUS_LABELS } from '../../utils/constants';

interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<VMQueryParams>;
}

interface VAppFilters {
  search: string;
  status: VMStatus | '';
  org_id: string;
  vdc_id: string;
}

// Default filter presets (moved outside component to avoid dependency issues)
const defaultPresets: FilterPreset[] = [
  {
    id: 'running',
    name: 'Running vApps',
    filters: { vm_status: 'POWERED_ON' },
  },
  {
    id: 'stopped',
    name: 'Stopped vApps',
    filters: { vm_status: 'POWERED_OFF' },
  },
  {
    id: 'suspended',
    name: 'Suspended vApps',
    filters: { vm_status: 'SUSPENDED' },
  },
];

const VMs: React.FC = () => {
  const navigate = useNavigate();

  // Session storage for persistence
  const { persistedFilters, updateOrganization, updateVDC } =
    useVAppsSessionFilters();

  // State management - initialize with persisted values
  const [filters, setFilters] = useState<VAppFilters>({
    search: '',
    status: '',
    org_id: persistedFilters.org_id,
    vdc_id: persistedFilters.vdc_id,
  });
  const [selectedVApps, setSelectedVApps] = useState<string[]>([]);
  // Note: Sorting removed for vApp-centric view - could be re-implemented per VDC if needed
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Dropdown states
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
  const [isOrgSelectOpen, setIsOrgSelectOpen] = useState(false);
  const [isVDCSelectOpen, setIsVDCSelectOpen] = useState(false);
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [isCreateVMWizardOpen, setIsCreateVMWizardOpen] = useState(false);

  // Delete confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    vApp: VApp | null;
  }>({ isOpen: false, vApp: null });

  // Filter presets
  const [filterPresets, setFilterPresets] =
    useState<FilterPreset[]>(defaultPresets);

  // Data fetching
  const { data: userPermissions } = useUserPermissions();
  const { data: orgsResponse } = useOrganizations();

  // For VDCs, we need different approaches based on user role
  const isSystemAdmin = userPermissions?.canManageSystem;

  // For system admins: get VDCs for the selected organization only
  // For regular users: get VDCs from their accessible organizations
  const { data: adminVdcsResponse } = useVDCs(filters.org_id, undefined, {
    enabled: isSystemAdmin && !!filters.org_id,
  });

  const { data: userVdcsResponse } = useOrganizationVDCs(
    undefined,
    !isSystemAdmin
  );

  // Choose appropriate VDCs based on user role
  const vdcsResponse = isSystemAdmin ? adminVdcsResponse : userVdcsResponse;

  const { data: vAppsResponse, isLoading, error } = useVApps(filters.vdc_id);
  const { operations: powerOperations } = usePowerOperationTracking();

  // Mutations
  const deleteVAppMutation = useDeleteVApp();

  const organizations = orgsResponse?.data || [];
  const vdcs = useMemo(() => {
    return vdcsResponse?.values || [];
  }, [vdcsResponse]);
  const vApps = useMemo(() => {
    return vAppsResponse?.values || [];
  }, [vAppsResponse]);

  // Filter and search logic for vApps in selected VDC
  const filteredVApps = useMemo(() => {
    if (!filters.vdc_id) {
      return [];
    }

    return vApps.filter((vApp) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = vApp.name.toLowerCase().includes(searchLower);
        const matchesVM = vApp.vms?.some((vm) =>
          vm.name.toLowerCase().includes(searchLower)
        );
        if (!matchesName && !matchesVM) return false;
      }

      // Status filter - check if any VM in vApp matches status
      if (filters.status) {
        const hasMatchingStatus = vApp.vms?.some(
          (vm) => vm.status === filters.status
        );
        if (!hasMatchingStatus) return false;
      }

      // Note: Organization filter removed because the API endpoint
      // /vdcs/{vdcId}/vapps already returns vApps for the specific VDC,
      // and each VDC belongs to a specific organization, so this filter
      // is redundant and was causing vApps to be filtered out.

      return true;
    });
  }, [vApps, filters]);

  // Calculate totals
  const totalVApps = filteredVApps.length;
  const totalVMs = filteredVApps.reduce(
    (sum, vApp) => sum + (vApp.vms?.length || 0),
    0
  );

  // Load saved presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('vm_filter_presets');
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets);
        setFilterPresets([...defaultPresets, ...parsed]);
      } catch (error) {
        console.error('Failed to load saved filter presets:', error);
      }
    }
  }, []);

  // Auto-select VDC when organization has only one VDC
  useEffect(() => {
    if (filters.org_id && vdcs.length === 1 && !filters.vdc_id) {
      const singleVDC = vdcs[0];
      updateVDC(singleVDC.id);
      setFilters((prev) => ({ ...prev, vdc_id: singleVDC.id }));
    }
  }, [filters.org_id, vdcs, filters.vdc_id, updateVDC]);

  // Clear selections when filters change
  useEffect(() => {
    setSelectedVApps([]);
  }, [filters]);

  const handleFilterChange = (key: keyof VAppFilters, value: string) => {
    if (key === 'org_id') {
      updateOrganization(value);
      // Clear VDC when organization changes
      updateVDC('');
      setFilters((prev) => ({ ...prev, org_id: value, vdc_id: '' }));
    } else if (key === 'vdc_id') {
      updateVDC(value);
      setFilters((prev) => ({ ...prev, [key]: value }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleClearFilters = () => {
    updateOrganization('');
    updateVDC('');
    setFilters({
      search: '',
      status: '',
      org_id: '',
      vdc_id: '',
    });
  };

  const handleSelectVApp = (vAppId: string, checked: boolean) => {
    if (checked) {
      setSelectedVApps((prev) => [...prev, vAppId]);
    } else {
      setSelectedVApps((prev) => prev.filter((id) => id !== vAppId));
    }
  };

  // Note: Sorting functionality removed for vApp-centric view

  const handleApplyPreset = (preset: FilterPreset) => {
    setFilters({
      search: preset.filters.search || '',
      status: preset.filters.vm_status || '',
      org_id: preset.filters.organization_id || '',
      vdc_id: preset.filters.vdc_id || '',
    });
    setIsPresetDropdownOpen(false);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      filters: {
        search: filters.search || undefined,
        vm_status: filters.status || undefined,
        organization_id: filters.org_id || undefined,
        vdc_id: filters.vdc_id || undefined,
      },
    };

    const customPresets = filterPresets.filter((p) =>
      p.id.startsWith('preset-')
    );
    const updatedCustomPresets = [...customPresets, newPreset];

    localStorage.setItem(
      'vm_filter_presets',
      JSON.stringify(updatedCustomPresets)
    );
    setFilterPresets((prev) => [...prev, newPreset]);
    setPresetName('');
    setShowPresetModal(false);
  };

  const handleDeletePreset = (presetId: string) => {
    if (!presetId.startsWith('preset-')) return; // Don't delete built-in presets

    const updatedPresets = filterPresets.filter((p) => p.id !== presetId);
    const customPresets = updatedPresets.filter((p) =>
      p.id.startsWith('preset-')
    );

    localStorage.setItem('vm_filter_presets', JSON.stringify(customPresets));
    setFilterPresets(updatedPresets);
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

  const handleEditVApp = (vApp: VApp) => {
    navigate(ROUTES.VAPP_EDIT.replace(':id', vApp.id));
  };

  const handleDeleteVApp = (vApp: VApp) => {
    setDeleteConfirmation({ isOpen: true, vApp });
  };

  const confirmDeleteVApp = async () => {
    if (!deleteConfirmation.vApp) return;

    try {
      await deleteVAppMutation.mutateAsync(deleteConfirmation.vApp.id);
      setDeleteConfirmation({ isOpen: false, vApp: null });
      // The mutation will automatically invalidate queries and refresh the UI
    } catch (error) {
      console.error('Failed to delete vApp:', error);
      // The error will be displayed via the mutation's error handling
    }
  };

  const getVAppActions = (vApp: VApp) => [
    {
      title: 'View Details',
      onClick: () => navigate(`/vapps/${vApp.id}`),
    },
    {
      title: 'Edit',
      onClick: () => handleEditVApp(vApp),
    },
    { isSeparator: true },
    {
      title: 'Delete',
      onClick: () => handleDeleteVApp(vApp),
      isDanger: true,
    },
  ];

  const getVMActions = (vm: VM) => [
    {
      title: 'View Details',
      onClick: () => navigate(`/vms/${vm.id}`),
    },
    {
      title: 'Edit',
      onClick: () => console.log('Edit VM:', vm.id),
    },
    { isSeparator: true },
    {
      title: 'Delete',
      onClick: () => console.log('Delete VM:', vm.id),
      isDanger: true,
    },
  ];

  const getBulkActions = () => [
    {
      title: 'Delete Selected',
      onClick: () => console.log('Bulk delete:', selectedVApps),
      icon: <TrashIcon />,
      isDanger: true,
    },
  ];

  const hasActiveFilters =
    filters.search || filters.status || filters.org_id || filters.vdc_id;

  if (error) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading vApps"
          isInline
        >
          {error.message}
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
            <BreadcrumbItem isActive>Virtual Applications</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                Virtual Applications
              </Title>
              <p className="pf-v6-u-color-200">
                Manage and monitor your vApps and virtual machines grouped by
                VDC
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                icon={<PlusIcon />}
                onClick={() => setIsCreateVMWizardOpen(true)}
              >
                Create vApp
              </Button>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Toolbar */}
        <StackItem>
          <Card>
            <CardBody className="pf-v6-u-p-lg">
              <Toolbar id="vm-toolbar" clearAllFilters={handleClearFilters}>
                <ToolbarContent>
                  {/* Search */}
                  <ToolbarItem>
                    <SearchInput
                      placeholder="Search vApps and VMs..."
                      value={filters.search}
                      onChange={(_, value) =>
                        handleFilterChange('search', value)
                      }
                      onClear={() => handleFilterChange('search', '')}
                      style={{ width: '300px' }}
                    />
                  </ToolbarItem>

                  {/* Status Filter */}
                  <ToolbarItem>
                    <Select
                      id="status-select"
                      isOpen={isStatusSelectOpen}
                      selected={filters.status}
                      onSelect={(_, selection) => {
                        handleFilterChange('status', selection as string);
                        setIsStatusSelectOpen(false);
                      }}
                      onOpenChange={setIsStatusSelectOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsStatusSelectOpen(!isStatusSelectOpen)
                          }
                          isExpanded={isStatusSelectOpen}
                        >
                          {filters.status
                            ? VM_STATUS_LABELS[filters.status as VMStatus]
                            : 'All Statuses'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="">All Statuses</SelectOption>
                        <SelectOption value="POWERED_ON">Running</SelectOption>
                        <SelectOption value="POWERED_OFF">Stopped</SelectOption>
                        <SelectOption value="SUSPENDED">Suspended</SelectOption>
                        <SelectOption value="UNRESOLVED">
                          Unresolved
                        </SelectOption>
                        <SelectOption value="INSTANTIATING">
                          Instantiating
                        </SelectOption>
                        <SelectOption value="RESOLVED">Resolved</SelectOption>
                        <SelectOption value="DEPLOYED">Deployed</SelectOption>
                        <SelectOption value="FAILED">Failed</SelectOption>
                        <SelectOption value="UNKNOWN">Unknown</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  {/* VDC Filter */}
                  <ToolbarItem>
                    <Select
                      id="vdc-select"
                      isOpen={isVDCSelectOpen}
                      selected={filters.vdc_id}
                      onSelect={(_, selection) => {
                        handleFilterChange('vdc_id', selection as string);
                        setIsVDCSelectOpen(false);
                      }}
                      onOpenChange={setIsVDCSelectOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsVDCSelectOpen(!isVDCSelectOpen)}
                          isExpanded={isVDCSelectOpen}
                          isDisabled={isSystemAdmin && !filters.org_id}
                        >
                          {filters.vdc_id
                            ? vdcs.find((vdc) => vdc.id === filters.vdc_id)
                                ?.name || 'Unknown VDC'
                            : isSystemAdmin && !filters.org_id
                              ? 'Select Organization first'
                              : vdcs.length === 0
                                ? 'No VDCs available'
                                : 'Select VDC'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="">Select VDC</SelectOption>
                        {vdcs.map((vdc) => (
                          <SelectOption key={vdc.id} value={vdc.id}>
                            {vdc.name}
                          </SelectOption>
                        ))}
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  {/* Organization Filter */}
                  <ToolbarItem>
                    <Select
                      id="org-select"
                      isOpen={isOrgSelectOpen}
                      selected={filters.org_id}
                      onSelect={(_, selection) => {
                        handleFilterChange('org_id', selection as string);
                        setIsOrgSelectOpen(false);
                      }}
                      onOpenChange={setIsOrgSelectOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsOrgSelectOpen(!isOrgSelectOpen)}
                          isExpanded={isOrgSelectOpen}
                        >
                          {filters.org_id
                            ? organizations.find(
                                (org) => org.id === filters.org_id
                              )?.displayName || 'Unknown Org'
                            : 'All Organizations'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="">All Organizations</SelectOption>
                        {organizations.map((org) => (
                          <SelectOption key={org.id} value={org.id}>
                            {org.displayName}
                          </SelectOption>
                        ))}
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  {/* Filter Presets */}
                  <ToolbarGroup>
                    <ToolbarItem>
                      <Dropdown
                        isOpen={isPresetDropdownOpen}
                        onOpenChange={setIsPresetDropdownOpen}
                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                          <MenuToggle
                            ref={toggleRef}
                            onClick={() =>
                              setIsPresetDropdownOpen(!isPresetDropdownOpen)
                            }
                            isExpanded={isPresetDropdownOpen}
                            icon={<FilterIcon />}
                          >
                            Presets
                          </MenuToggle>
                        )}
                      >
                        <DropdownList>
                          {filterPresets.map((preset) => (
                            <DropdownItem
                              key={preset.id}
                              onClick={() => handleApplyPreset(preset)}
                            >
                              <Flex>
                                <FlexItem flex={{ default: 'flex_1' }}>
                                  {preset.name}
                                </FlexItem>
                                {preset.id.startsWith('preset-') && (
                                  <FlexItem>
                                    <Button
                                      variant="plain"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePreset(preset.id);
                                      }}
                                    >
                                      <TrashIcon />
                                    </Button>
                                  </FlexItem>
                                )}
                              </Flex>
                            </DropdownItem>
                          ))}
                          <DropdownItem
                            onClick={() => setShowPresetModal(true)}
                          >
                            Save Current Filters...
                          </DropdownItem>
                        </DropdownList>
                      </Dropdown>
                    </ToolbarItem>
                  </ToolbarGroup>

                  {/* Bulk Actions - Removed since CloudAPI doesn't support bulk operations */}
                  {selectedVApps.length > 0 && (
                    <ToolbarGroup>
                      <ToolbarItem>
                        <Dropdown
                          isOpen={isBulkActionsOpen}
                          onOpenChange={setIsBulkActionsOpen}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle
                              ref={toggleRef}
                              onClick={() =>
                                setIsBulkActionsOpen(!isBulkActionsOpen)
                              }
                              isExpanded={isBulkActionsOpen}
                            >
                              Actions ({selectedVApps.length} selected)
                            </MenuToggle>
                          )}
                        >
                          <DropdownList>
                            {getBulkActions().map((action, index) => (
                              <DropdownItem
                                key={action.title || `item-${index}`}
                                onClick={action.onClick}
                                isDanger={action.isDanger}
                                icon={action.icon}
                              >
                                {action.title}
                              </DropdownItem>
                            ))}
                          </DropdownList>
                        </Dropdown>
                      </ToolbarItem>
                    </ToolbarGroup>
                  )}

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <ToolbarItem>
                      <Button variant="link" onClick={handleClearFilters}>
                        Clear all filters
                      </Button>
                    </ToolbarItem>
                  )}

                  {/* Results Summary */}
                  <ToolbarItem align={{ default: 'alignEnd' }}>
                    <span className="pf-v6-u-color-200">
                      {filters.vdc_id
                        ? `${totalVApps} vApps, ${totalVMs} VMs in selected VDC`
                        : 'Select a VDC to view vApps'}
                    </span>
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
            </CardBody>
          </Card>
        </StackItem>

        {/* Results Summary */}
        {hasActiveFilters && (
          <StackItem>
            <Alert
              variant={AlertVariant.info}
              isInline
              title={`Showing ${totalVApps} vApps with ${totalVMs} VMs filtered results`}
            >
              Active filters:{' '}
              {[
                filters.search && `search: "${filters.search}"`,
                filters.status &&
                  `status: ${VM_STATUS_LABELS[filters.status as VMStatus]}`,
                filters.org_id &&
                  `org: ${organizations.find((o) => o.id === filters.org_id)?.displayName}`,
                filters.vdc_id &&
                  `vdc: ${vdcs.find((v) => v.id === filters.vdc_id)?.name}`,
              ]
                .filter(Boolean)
                .join(', ')}
            </Alert>
          </StackItem>
        )}

        {/* VM Table */}
        <StackItem>
          <Card>
            <CardBody className="pf-v6-u-p-0">
              {isLoading ? (
                <Bullseye>
                  <Spinner size="xl" />
                </Bullseye>
              ) : !filters.vdc_id ? (
                <EmptyState variant={EmptyStateVariant.lg}>
                  <VirtualMachineIcon />
                  <Title headingLevel="h4" size="lg">
                    {isSystemAdmin && !filters.org_id
                      ? 'Select an Organization and VDC'
                      : 'Select a VDC to view vApps'}
                  </Title>
                  <EmptyStateBody>
                    {isSystemAdmin && !filters.org_id
                      ? 'Virtual Applications are organized by Virtual Data Center within Organizations. As a System Administrator, please first select an Organization, then select a VDC to view its vApps.'
                      : 'Virtual Applications are organized by Virtual Data Center. Please select a VDC from the filter above to view its vApps.'}
                  </EmptyStateBody>
                </EmptyState>
              ) : filteredVApps.length === 0 ? (
                <EmptyState variant={EmptyStateVariant.lg}>
                  <VirtualMachineIcon />
                  <Title headingLevel="h4" size="lg">
                    {hasActiveFilters
                      ? 'No vApps match your filters'
                      : 'No virtual applications found'}
                  </Title>
                  <EmptyStateBody>
                    {hasActiveFilters
                      ? 'Try adjusting your search criteria or clear the filters to see all vApps.'
                      : 'Get started by creating your first virtual application.'}
                  </EmptyStateBody>
                  <EmptyStateActions>
                    {hasActiveFilters ? (
                      <Button variant="primary" onClick={handleClearFilters}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        icon={<PlusIcon />}
                        onClick={() => setIsCreateVMWizardOpen(true)}
                      >
                        Create Virtual Application
                      </Button>
                    )}
                  </EmptyStateActions>
                </EmptyState>
              ) : (
                <Table variant={TableVariant.compact}>
                  <Thead>
                    <Tr>
                      <Th>vApp Name</Th>
                      <Th>VMs</Th>
                      <Th>Status</Th>
                      <Th>Created</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredVApps.map((vApp) => (
                      <React.Fragment key={vApp.id}>
                        {/* vApp Row */}
                        <Tr style={{ backgroundColor: '#f8f9fa' }}>
                          <Td>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <Checkbox
                                id={`select-vapp-${vApp.id}`}
                                isChecked={selectedVApps.includes(vApp.id)}
                                onChange={(_, checked) =>
                                  handleSelectVApp(vApp.id, checked)
                                }
                                aria-label={`Select vApp ${vApp.name}`}
                              />
                              <Link
                                to={`/vapps/${vApp.id}`}
                                className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                              >
                                <strong>{vApp.name}</strong>
                              </Link>
                            </div>
                          </Td>
                          <Td>{vApp.vms?.length || 0} VMs</Td>
                          <Td>{getVAppStatusBadge(vApp.status)}</Td>
                          <Td>
                            {vApp.createdDate
                              ? formatDate(vApp.createdDate)
                              : 'Unknown'}
                          </Td>
                          <Td>
                            <ActionsColumn items={getVAppActions(vApp)} />
                          </Td>
                        </Tr>

                        {/* VM Rows (nested under vApp) */}
                        {vApp.vms?.map((vmCloudAPI) => {
                          const vm = transformVMData(vmCloudAPI);
                          return (
                            <Tr
                              key={`vm-${vm.id}`}
                              style={{
                                backgroundColor: '#fdfdfd',
                                borderLeft: '3px solid #0066cc',
                              }}
                            >
                              <Td style={{ paddingLeft: '2rem' }}>
                                <Link
                                  to={`/vms/${vm.id}`}
                                  className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                                >
                                  {vm.name}
                                </Link>
                              </Td>
                              <Td>
                                {vm.cpu_count} cores,{' '}
                                {formatMemory(vm.memory_mb)}
                              </Td>
                              <Td>{getStatusBadge(vm.status)}</Td>
                              <Td>—</Td>
                              <Td>
                                {vm.created_at
                                  ? formatDate(vm.created_at)
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
                                  <ActionsColumn items={getVMActions(vm)} />
                                </div>
                              </Td>
                            </Tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </StackItem>

        {/* Summary */}
        {totalVApps > 0 && filters.vdc_id && (
          <StackItem>
            <Alert variant={AlertVariant.info} isInline title="Summary">
              Total: {totalVApps} vApps with {totalVMs} VMs in{' '}
              {vdcs.find((v) => v.id === filters.vdc_id)?.name ||
                'selected VDC'}
            </Alert>
          </StackItem>
        )}
      </Stack>

      {/* Save Preset Modal */}
      <Modal
        variant={ModalVariant.small}
        title="Save Filter Preset"
        isOpen={showPresetModal}
        onClose={() => {
          setShowPresetModal(false);
          setPresetName('');
        }}
      >
        <Stack hasGutter>
          <StackItem>
            <p>
              Save your current filter settings as a preset for quick access
              later.
            </p>
          </StackItem>
          <StackItem>
            <label htmlFor="preset-name">Preset Name</label>
            <input
              id="preset-name"
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name..."
              className="pf-v6-c-form-control"
            />
          </StackItem>
          <StackItem>
            <p>
              <strong>Current filters:</strong>
            </p>
            <ul>
              {filters.search && <li>Search: "{filters.search}"</li>}
              {filters.status && (
                <li>Status: {VM_STATUS_LABELS[filters.status as VMStatus]}</li>
              )}
              {filters.org_id && (
                <li>
                  Organization:{' '}
                  {
                    organizations.find((o) => o.id === filters.org_id)
                      ?.displayName
                  }
                </li>
              )}
              {filters.vdc_id && (
                <li>
                  VDC:{' '}
                  {vdcs.find((v) => v.id === filters.vdc_id)?.name ||
                    'Unknown VDC'}
                </li>
              )}
              {!hasActiveFilters && <li>No filters applied</li>}
            </ul>
          </StackItem>
          <StackItem>
            <div>
              <Button
                variant="primary"
                onClick={handleSavePreset}
                isDisabled={!presetName.trim()}
              >
                Save Preset
              </Button>
              <Button
                variant="link"
                onClick={() => {
                  setShowPresetModal(false);
                  setPresetName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </StackItem>
        </Stack>
      </Modal>

      {/* Power Operation Status */}
      <PowerOperationStatus operations={powerOperations} />

      {/* vApp Creation Wizard */}
      <VMCreationWizard
        isOpen={isCreateVMWizardOpen}
        onClose={() => setIsCreateVMWizardOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        variant={ModalVariant.small}
        title="Delete vApp"
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, vApp: null })}
      >
        <Stack hasGutter>
          <StackItem>
            <p>
              Are you sure you want to delete the vApp{' '}
              <strong>{deleteConfirmation.vApp?.name}</strong>? This action
              cannot be undone.
            </p>
          </StackItem>
          {deleteConfirmation.vApp?.vms &&
            deleteConfirmation.vApp.vms.length > 0 && (
              <StackItem>
                <Alert variant={AlertVariant.warning} isInline title="Warning">
                  This vApp contains {deleteConfirmation.vApp.vms.length}{' '}
                  virtual machine(s) that will also be deleted.
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
                    setDeleteConfirmation({ isOpen: false, vApp: null })
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

export default VMs;
