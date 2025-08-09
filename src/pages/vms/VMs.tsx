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
  Pagination,
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
  useVMs,
  useVDCs,
  useOrganizations,
  usePowerOperationTracking,
} from '../../hooks';
import {
  VMPowerActions,
  PowerOperationStatus,
  VMCreationWizard,
} from '../../components/vms';
import type { VM, VMStatus, VMQueryParams } from '../../types';
import type { MenuToggleElement } from '@patternfly/react-core';
import { ROUTES, VM_STATUS_LABELS } from '../../utils/constants';

interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<VMQueryParams>;
}

interface VMFilters {
  search: string;
  status: VMStatus | '';
  vdc_id: string;
  org_id: string;
}

// Default filter presets (moved outside component to avoid dependency issues)
const defaultPresets: FilterPreset[] = [
  {
    id: 'running',
    name: 'Running VMs',
    filters: { vm_status: 'POWERED_ON' },
  },
  {
    id: 'stopped',
    name: 'Stopped VMs',
    filters: { vm_status: 'POWERED_OFF' },
  },
  {
    id: 'suspended',
    name: 'Suspended VMs',
    filters: { vm_status: 'SUSPENDED' },
  },
];

const VMs: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [filters, setFilters] = useState<VMFilters>({
    search: '',
    status: '',
    vdc_id: '',
    org_id: '',
  });
  const [selectedVMs, setSelectedVMs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Dropdown states
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
  const [isVDCSelectOpen, setIsVDCSelectOpen] = useState(false);
  const [isOrgSelectOpen, setIsOrgSelectOpen] = useState(false);
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [isCreateVMWizardOpen, setIsCreateVMWizardOpen] = useState(false);

  // Filter presets
  const [filterPresets, setFilterPresets] =
    useState<FilterPreset[]>(defaultPresets);

  // Data fetching
  const queryParams: VMQueryParams = useMemo(
    () => ({
      search: filters.search || undefined,
      vm_status: filters.status || undefined,
      vdc_id: filters.vdc_id || undefined,
      organization_id: filters.org_id || undefined,
      sort_by: sortBy,
      sort_order: sortDirection,
      page: currentPage,
      per_page: perPage,
    }),
    [filters, sortBy, sortDirection, currentPage, perPage]
  );

  const { data: vmsResponse, isLoading, error } = useVMs(queryParams);
  const { data: vdcsResponse } = useVDCs();
  const { data: orgsResponse } = useOrganizations();
  const { operations: powerOperations } = usePowerOperationTracking();

  const vms = vmsResponse?.data || [];
  const vdcs = vdcsResponse?.data || [];
  const organizations = orgsResponse?.data || [];

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

  // Clear selections when filters change
  useEffect(() => {
    setSelectedVMs([]);
  }, [filters, sortBy, sortDirection, currentPage]);

  const handleFilterChange = (key: keyof VMFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      vdc_id: '',
      org_id: '',
    });
    setCurrentPage(1);
  };

  const handleSelectVM = (vmId: string, checked: boolean) => {
    if (checked) {
      setSelectedVMs((prev) => [...prev, vmId]);
    } else {
      setSelectedVMs((prev) => prev.filter((id) => id !== vmId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVMs(vms.map((vm) => vm.id));
    } else {
      setSelectedVMs([]);
    }
  };

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columnKey);
      setSortDirection('asc');
    }
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    setFilters({
      search: preset.filters.search || '',
      status: preset.filters.vm_status || '',
      vdc_id: preset.filters.vdc_id || '',
      org_id: preset.filters.organization_id || '',
    });
    setCurrentPage(1);
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
        vdc_id: filters.vdc_id || undefined,
        organization_id: filters.org_id || undefined,
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
      onClick: () => console.log('Bulk delete:', selectedVMs),
      icon: <TrashIcon />,
      isDanger: true,
    },
  ];

  const hasActiveFilters =
    filters.search || filters.status || filters.vdc_id || filters.org_id;
  const filteredCount = vms.length;
  const isAllSelected = vms.length > 0 && selectedVMs.length === vms.length;

  if (error) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Error loading VMs" isInline>
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
            <BreadcrumbItem isActive>Virtual Machines</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                Virtual Machines
              </Title>
              <p className="pf-v6-u-color-200">
                Manage and monitor your virtual machines across all VDCs
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                icon={<PlusIcon />}
                onClick={() => setIsCreateVMWizardOpen(true)}
              >
                Create VM
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
                      placeholder="Search VMs by name..."
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
                        >
                          {filters.vdc_id
                            ? vdcs.find((vdc) => vdc.id === filters.vdc_id)
                                ?.name || 'Unknown VDC'
                            : 'All VDCs'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="">All VDCs</SelectOption>
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

                  {/* Bulk Actions */}
                  {selectedVMs.length > 0 && (
                    <ToolbarGroup>
                      <ToolbarItem>
                        <VMPowerActions
                          vmIds={selectedVMs}
                          variant="dropdown"
                        />
                      </ToolbarItem>
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
                              Other Actions ({selectedVMs.length} selected)
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

                  {/* Pagination */}
                  <ToolbarItem
                    variant="pagination"
                    align={{ default: 'alignEnd' }}
                  >
                    <Pagination
                      itemCount={filteredCount}
                      perPage={perPage}
                      page={currentPage}
                      onSetPage={(_, page) => setCurrentPage(page)}
                      onPerPageSelect={(_, perPage) => {
                        setPerPage(perPage);
                        setCurrentPage(1);
                      }}
                      variant="top"
                    />
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
              title={`Showing ${filteredCount} filtered results`}
            >
              Active filters:{' '}
              {[
                filters.search && `search: "${filters.search}"`,
                filters.status &&
                  `status: ${VM_STATUS_LABELS[filters.status as VMStatus]}`,
                filters.vdc_id &&
                  `VDC: ${vdcs.find((v) => v.id === filters.vdc_id)?.name}`,
                filters.org_id &&
                  `org: ${organizations.find((o) => o.id === filters.org_id)?.displayName}`,
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
              ) : vms.length === 0 ? (
                <EmptyState variant={EmptyStateVariant.lg}>
                  <VirtualMachineIcon />
                  <Title headingLevel="h4" size="lg">
                    {hasActiveFilters
                      ? 'No VMs match your filters'
                      : 'No virtual machines found'}
                  </Title>
                  <EmptyStateBody>
                    {hasActiveFilters
                      ? 'Try adjusting your search criteria or clear the filters to see all VMs.'
                      : 'Get started by creating your first virtual machine.'}
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
                        Create Virtual Machine
                      </Button>
                    )}
                  </EmptyStateActions>
                </EmptyState>
              ) : (
                <Table variant={TableVariant.compact}>
                  <Thead>
                    <Tr>
                      <Th>
                        <Checkbox
                          id="select-all"
                          isChecked={isAllSelected}
                          onChange={(_, checked) => handleSelectAll(checked)}
                          aria-label="Select all VMs"
                        />
                      </Th>
                      <Th
                        sort={{
                          sortBy: {
                            index: sortBy === 'name' ? 0 : undefined,
                            direction: sortDirection,
                          },
                          onSort: () => handleSort('name'),
                          columnIndex: 0,
                        }}
                      >
                        Name
                      </Th>
                      <Th>Status</Th>
                      <Th>VDC</Th>
                      <Th>Organization</Th>
                      <Th
                        sort={{
                          sortBy: {
                            index: sortBy === 'cpu_count' ? 1 : undefined,
                            direction: sortDirection,
                          },
                          onSort: () => handleSort('cpu_count'),
                          columnIndex: 1,
                        }}
                      >
                        CPU
                      </Th>
                      <Th
                        sort={{
                          sortBy: {
                            index: sortBy === 'memory_mb' ? 2 : undefined,
                            direction: sortDirection,
                          },
                          onSort: () => handleSort('memory_mb'),
                          columnIndex: 2,
                        }}
                      >
                        Memory
                      </Th>
                      <Th
                        sort={{
                          sortBy: {
                            index: sortBy === 'created_at' ? 3 : undefined,
                            direction: sortDirection,
                          },
                          onSort: () => handleSort('created_at'),
                          columnIndex: 3,
                        }}
                      >
                        Created
                      </Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {vms.map((vm) => (
                      <Tr key={vm.id}>
                        <Td>
                          <Checkbox
                            id={`select-${vm.id}`}
                            isChecked={selectedVMs.includes(vm.id)}
                            onChange={(_, checked) =>
                              handleSelectVM(vm.id, checked)
                            }
                            aria-label={`Select VM ${vm.name}`}
                          />
                        </Td>
                        <Td>
                          <div>
                            <Link
                              to={`/vms/${vm.id}`}
                              className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                            >
                              <strong>{vm.name}</strong>
                            </Link>
                            <br />
                            <small className="pf-v6-u-color-200">
                              {vm.vm_name}
                            </small>
                          </div>
                        </Td>
                        <Td>{getStatusBadge(vm.status)}</Td>
                        <Td>
                          <Link
                            to={ROUTES.VDC_DETAIL.replace(':id', vm.vdc_id)}
                            className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                          >
                            {vm.vdc_name}
                          </Link>
                        </Td>
                        <Td>
                          <Link
                            to={ROUTES.ORGANIZATION_DETAIL.replace(
                              ':id',
                              vm.org_id
                            )}
                            className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                          >
                            {vm.org_name}
                          </Link>
                        </Td>
                        <Td>{vm.cpu_count} cores</Td>
                        <Td>{formatMemory(vm.memory_mb)}</Td>
                        <Td>{formatDate(vm.created_at)}</Td>
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
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </StackItem>

        {/* Bottom Pagination */}
        {vms.length > 0 && (
          <StackItem>
            <Pagination
              itemCount={filteredCount}
              perPage={perPage}
              page={currentPage}
              onSetPage={(_, page) => setCurrentPage(page)}
              onPerPageSelect={(_, perPage) => {
                setPerPage(perPage);
                setCurrentPage(1);
              }}
              variant="bottom"
            />
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
              {filters.vdc_id && (
                <li>VDC: {vdcs.find((v) => v.id === filters.vdc_id)?.name}</li>
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

      {/* VM Creation Wizard */}
      <VMCreationWizard
        isOpen={isCreateVMWizardOpen}
        onClose={() => setIsCreateVMWizardOpen(false)}
      />
    </PageSection>
  );
};

export default VMs;
