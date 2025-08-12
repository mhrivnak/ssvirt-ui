import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Button,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  Stack,
  StackItem,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Label,
  LabelGroup,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';
import { FilterIcon, TimesIcon } from '@patternfly/react-icons';
import type { UserQueryParams, Organization } from '../../types';

interface UserFiltersProps {
  searchTerm: string;
  filters: UserQueryParams;
  organizations: Organization[];
  onSearchChange: (value: string) => void;
  onFilterChange: (filters: Partial<UserQueryParams>) => void;
  onClearFilters: () => void;
}

interface FilterDropdownState {
  status: boolean;
  role: boolean;
  organization: boolean;
  advanced: boolean;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  filters,
  organizations,
  onSearchChange,
  onFilterChange,
  onClearFilters,
}) => {
  const [dropdownStates, setDropdownStates] = useState<FilterDropdownState>({
    status: false,
    role: false,
    organization: false,
    advanced: false,
  });

  const toggleDropdown = (
    dropdown: keyof FilterDropdownState,
    isOpen?: boolean
  ) => {
    setDropdownStates((prev) => ({
      ...prev,
      [dropdown]: isOpen ?? !prev[dropdown],
    }));
  };

  const closeAllDropdowns = () => {
    setDropdownStates({
      status: false,
      role: false,
      organization: false,
      advanced: false,
    });
  };

  const getStatusFilterLabel = (enabled?: boolean) => {
    if (enabled === true) return 'Enabled Only';
    if (enabled === false) return 'Disabled Only';
    return 'All Statuses';
  };

  const getRoleFilterLabel = (role?: string) => {
    switch (role) {
      case 'System Administrator':
        return 'System Admins';
      case 'Organization Administrator':
        return 'Org Admins';
      case 'vApp User':
        return 'vApp Users';
      default:
        return 'All Roles';
    }
  };

  const getOrgFilterLabel = (orgId?: string) => {
    if (!orgId) return 'All Organizations';
    const org = organizations.find((o) => o.id === orgId);
    return org ? org.displayName || org.name : 'Unknown Organization';
  };

  const handleFilterSelect = (
    filterType: string,
    value: string | boolean | undefined
  ) => {
    onFilterChange({ [filterType]: value });
    closeAllDropdowns();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.enabled !== undefined) count++;
    if (filters.role) count++;
    if (filters.organization_id) count++;
    if (filters.sort_by && filters.sort_by !== 'name') count++;
    return count;
  };

  const getActiveFilterChips = () => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> =
      [];

    if (filters.enabled !== undefined) {
      chips.push({
        key: 'status',
        label: `Status: ${filters.enabled ? 'Enabled' : 'Disabled'}`,
        onRemove: () => onFilterChange({ enabled: undefined }),
      });
    }

    if (filters.role) {
      chips.push({
        key: 'role',
        label: `Role: ${filters.role}`,
        onRemove: () => onFilterChange({ role: undefined }),
      });
    }

    if (filters.organization_id) {
      const org = organizations.find((o) => o.id === filters.organization_id);
      chips.push({
        key: 'organization',
        label: `Organization: ${org ? org.displayName || org.name : 'Unknown'}`,
        onRemove: () => onFilterChange({ organization_id: undefined }),
      });
    }

    return chips;
  };

  const activeFiltersCount = getActiveFiltersCount();
  const activeFilterChips = getActiveFilterChips();

  return (
    <Card>
      <CardTitle>Search & Filter</CardTitle>
      <CardBody>
        <Stack hasGutter>
          {/* Main Toolbar */}
          <StackItem>
            <Toolbar clearAllFilters={onClearFilters}>
              <ToolbarContent>
                {/* Search Input */}
                <ToolbarItem width="300px">
                  <SearchInput
                    placeholder="Search users by name, email, or username..."
                    value={searchTerm}
                    onChange={(_, value) => onSearchChange(value)}
                    onClear={() => onSearchChange('')}
                    aria-label="Search users"
                  />
                </ToolbarItem>

                {/* Status Filter */}
                <ToolbarItem>
                  <Dropdown
                    isOpen={dropdownStates.status}
                    onSelect={() => toggleDropdown('status', false)}
                    onOpenChange={(isOpen) => toggleDropdown('status', isOpen)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => toggleDropdown('status')}
                        isExpanded={dropdownStates.status}
                        icon={<FilterIcon />}
                      >
                        {getStatusFilterLabel(filters.enabled)}
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem
                        key="all"
                        onClick={() => handleFilterSelect('enabled', undefined)}
                      >
                        All Statuses
                      </DropdownItem>
                      <DropdownItem
                        key="enabled"
                        onClick={() => handleFilterSelect('enabled', true)}
                      >
                        Enabled Only
                      </DropdownItem>
                      <DropdownItem
                        key="disabled"
                        onClick={() => handleFilterSelect('enabled', false)}
                      >
                        Disabled Only
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>

                {/* Role Filter */}
                <ToolbarItem>
                  <Dropdown
                    isOpen={dropdownStates.role}
                    onSelect={() => toggleDropdown('role', false)}
                    onOpenChange={(isOpen) => toggleDropdown('role', isOpen)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => toggleDropdown('role')}
                        isExpanded={dropdownStates.role}
                        icon={<FilterIcon />}
                      >
                        {getRoleFilterLabel(filters.role)}
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem
                        key="all"
                        onClick={() => handleFilterSelect('role', undefined)}
                      >
                        All Roles
                      </DropdownItem>
                      <DropdownItem
                        key="system-admin"
                        onClick={() =>
                          handleFilterSelect('role', 'System Administrator')
                        }
                      >
                        System Administrators
                      </DropdownItem>
                      <DropdownItem
                        key="org-admin"
                        onClick={() =>
                          handleFilterSelect(
                            'role',
                            'Organization Administrator'
                          )
                        }
                      >
                        Organization Administrators
                      </DropdownItem>
                      <DropdownItem
                        key="vapp-user"
                        onClick={() => handleFilterSelect('role', 'vApp User')}
                      >
                        vApp Users
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>

                {/* Organization Filter */}
                <ToolbarItem>
                  <Dropdown
                    isOpen={dropdownStates.organization}
                    onSelect={() => toggleDropdown('organization', false)}
                    onOpenChange={(isOpen) =>
                      toggleDropdown('organization', isOpen)
                    }
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => toggleDropdown('organization')}
                        isExpanded={dropdownStates.organization}
                        icon={<FilterIcon />}
                      >
                        {getOrgFilterLabel(filters.organization_id)}
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem
                        key="all"
                        onClick={() =>
                          handleFilterSelect('organization_id', undefined)
                        }
                      >
                        All Organizations
                      </DropdownItem>
                      {organizations.map((org) => (
                        <DropdownItem
                          key={org.id}
                          onClick={() =>
                            handleFilterSelect('organization_id', org.id)
                          }
                        >
                          {org.displayName || org.name}
                        </DropdownItem>
                      ))}
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>

                {/* Advanced Filters Toggle */}
                <ToolbarItem>
                  <Button
                    variant="secondary"
                    onClick={() => toggleDropdown('advanced')}
                    icon={<FilterIcon />}
                  >
                    Advanced {dropdownStates.advanced ? '▲' : '▼'}
                  </Button>
                </ToolbarItem>

                {/* Clear All Filters */}
                {activeFiltersCount > 0 && (
                  <ToolbarItem>
                    <Button
                      variant="link"
                      onClick={onClearFilters}
                      icon={<TimesIcon />}
                    >
                      Clear all filters ({activeFiltersCount})
                    </Button>
                  </ToolbarItem>
                )}
              </ToolbarContent>
            </Toolbar>
          </StackItem>

          {/* Active Filter Labels */}
          {activeFilterChips.length > 0 && (
            <StackItem>
              <LabelGroup categoryName="Active filters">
                {activeFilterChips.map((chip) => (
                  <Label
                    key={chip.key}
                    onClose={chip.onRemove}
                    closeBtnAriaLabel="Remove filter"
                  >
                    {chip.label}
                  </Label>
                ))}
              </LabelGroup>
            </StackItem>
          )}

          {/* Advanced Filters */}
          {dropdownStates.advanced && (
            <StackItem>
              <Card>
                <CardTitle>Advanced Filters</CardTitle>
                <CardBody>
                  <Form>
                    <Flex>
                      <FlexItem flex={{ default: 'flex_1' }}>
                        <FormGroup label="Sort By" fieldId="sort-by">
                          <FormSelect
                            value={filters.sort_by || 'name'}
                            onChange={(_, value) =>
                              onFilterChange({ sort_by: value })
                            }
                            id="sort-by"
                          >
                            <FormSelectOption value="name" label="Name" />
                            <FormSelectOption
                              value="username"
                              label="Username"
                            />
                            <FormSelectOption value="email" label="Email" />
                            <FormSelectOption
                              value="createdDate"
                              label="Created Date"
                            />
                            <FormSelectOption
                              value="lastLogin"
                              label="Last Login"
                            />
                          </FormSelect>
                        </FormGroup>
                      </FlexItem>
                      <FlexItem flex={{ default: 'flex_1' }}>
                        <FormGroup label="Sort Order" fieldId="sort-order">
                          <FormSelect
                            value={filters.sort_order || 'asc'}
                            onChange={(_, value) =>
                              onFilterChange({
                                sort_order: value as 'asc' | 'desc',
                              })
                            }
                            id="sort-order"
                          >
                            <FormSelectOption value="asc" label="Ascending" />
                            <FormSelectOption value="desc" label="Descending" />
                          </FormSelect>
                        </FormGroup>
                      </FlexItem>
                    </Flex>
                  </Form>
                </CardBody>
              </Card>
            </StackItem>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default UserFilters;
