import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Button,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Alert,
  AlertVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  Badge,
  Split,
  SplitItem,
  Progress,
  Bullseye,
  Breadcrumb,
  BreadcrumbItem,
} from '@patternfly/react-core';
import {
  ChartLineIcon,
  MonitoringIcon,
  ExportIcon,
  FilterIcon,
  InfoCircleIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { useGlobalResourceUsage } from '../../hooks/useMonitoring';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { MenuToggleElement } from '@patternfly/react-core';

const ResourceMonitoring: React.FC = () => {
  // Filter and time range state
  const [timePeriod, setTimePeriod] = useState<
    'hourly' | 'daily' | 'weekly' | 'monthly'
  >('daily');
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [isTimePeriodOpen, setIsTimePeriodOpen] = useState(false);
  const [isOrgFilterOpen, setIsOrgFilterOpen] = useState(false);

  // Build query parameters
  const queryParams = {
    period: timePeriod,
    organization_id: selectedOrg || undefined,
    start_date: getStartDate(timePeriod),
    end_date: new Date().toISOString(),
  };

  const {
    data: resourceData,
    isLoading,
    error,
  } = useGlobalResourceUsage(queryParams);

  const handleTimePeriodChange = (value: string) => {
    setTimePeriod(value as 'hourly' | 'daily' | 'weekly' | 'monthly');
    setIsTimePeriodOpen(false);
  };

  const handleOrgFilterChange = (value: string) => {
    setSelectedOrg(value);
    setIsOrgFilterOpen(false);
  };

  const clearFilters = () => {
    setSelectedOrg('');
    setTimePeriod('daily');
  };

  if (error) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading resource monitoring data"
          isInline
        >
          {error.message || 'Failed to load monitoring data. Please try again.'}
        </Alert>
      </PageSection>
    );
  }

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner message="Loading resource monitoring data..." />
      </PageSection>
    );
  }

  if (!resourceData?.data) {
    return (
      <PageSection>
        <EmptyState>
          <Bullseye>
            <MonitoringIcon style={{ fontSize: '64px' }} />
          </Bullseye>
          <Title headingLevel="h4" size="lg">
            No monitoring data available
          </Title>
          <EmptyStateBody>
            Resource monitoring data is not available yet. Please check back
            later or contact your administrator.
          </EmptyStateBody>
          <EmptyStateActions>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </EmptyStateActions>
        </EmptyState>
      </PageSection>
    );
  }

  const { organizations, total_usage } = resourceData.data;

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem component={Link} to="/dashboard">
              Dashboard
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Resource Monitoring</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                <MonitoringIcon className="pf-v6-u-mr-sm" />
                Resource Monitoring & Analytics
              </Title>
              <p>
                Monitor resource usage, track costs, and analyze capacity across
                your infrastructure. View real-time metrics and historical
                trends for organizations, VDCs, and virtual machines.
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="secondary"
                icon={<ExportIcon />}
                onClick={() => (window.location.href = '/monitoring/exports')}
              >
                Export Reports
              </Button>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Filters and Controls */}
        <StackItem>
          <Card>
            <CardBody>
              <Toolbar>
                <ToolbarContent>
                  <ToolbarItem>
                    <Select
                      isOpen={isTimePeriodOpen}
                      selected={timePeriod}
                      onSelect={(_, selection) =>
                        handleTimePeriodChange(selection as string)
                      }
                      onOpenChange={setIsTimePeriodOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsTimePeriodOpen(!isTimePeriodOpen)}
                          isExpanded={isTimePeriodOpen}
                        >
                          Time Period: {getTimePeriodLabel(timePeriod)}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="hourly">
                          Last 24 Hours
                        </SelectOption>
                        <SelectOption value="daily">Last 7 Days</SelectOption>
                        <SelectOption value="weekly">Last 4 Weeks</SelectOption>
                        <SelectOption value="monthly">
                          Last 12 Months
                        </SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  <ToolbarItem>
                    <Select
                      isOpen={isOrgFilterOpen}
                      selected={selectedOrg}
                      onSelect={(_, selection) =>
                        handleOrgFilterChange(selection as string)
                      }
                      onOpenChange={setIsOrgFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsOrgFilterOpen(!isOrgFilterOpen)}
                          isExpanded={isOrgFilterOpen}
                          icon={<FilterIcon />}
                        >
                          {selectedOrg
                            ? `Organization: ${getOrgName(organizations, selectedOrg)}`
                            : 'All Organizations'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="">All Organizations</SelectOption>
                        {organizations.map((org) => (
                          <SelectOption
                            key={org.organization_id}
                            value={org.organization_id}
                          >
                            {org.organization_name}
                          </SelectOption>
                        ))}
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  {(selectedOrg || timePeriod !== 'daily') && (
                    <ToolbarItem>
                      <Button variant="link" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </ToolbarItem>
                  )}

                  <ToolbarItem align={{ default: 'alignEnd' }}>
                    <Button
                      variant="primary"
                      icon={<ChartLineIcon />}
                      onClick={() =>
                        (window.location.href = '/monitoring/capacity-planning')
                      }
                    >
                      Capacity Planning
                    </Button>
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
            </CardBody>
          </Card>
        </StackItem>

        {/* Global Usage Summary */}
        <StackItem>
          <Card>
            <CardBody>
              <Title headingLevel="h3" size="lg" className="pf-v6-u-mb-md">
                Global Resource Usage
              </Title>
              <Grid hasGutter>
                <GridItem span={3}>
                  <div className="pf-v6-u-text-align-center">
                    <Title
                      headingLevel="h4"
                      size="2xl"
                      className="pf-v6-u-primary-color-100"
                    >
                      {total_usage.cpu_cores_used}
                    </Title>
                    <p className="pf-v6-u-color-200">CPU Cores Used</p>
                  </div>
                </GridItem>
                <GridItem span={3}>
                  <div className="pf-v6-u-text-align-center">
                    <Title
                      headingLevel="h4"
                      size="2xl"
                      className="pf-v6-u-primary-color-100"
                    >
                      {Math.round(total_usage.memory_gb_used)}
                    </Title>
                    <p className="pf-v6-u-color-200">GB Memory Used</p>
                  </div>
                </GridItem>
                <GridItem span={3}>
                  <div className="pf-v6-u-text-align-center">
                    <Title
                      headingLevel="h4"
                      size="2xl"
                      className="pf-v6-u-primary-color-100"
                    >
                      {Math.round(total_usage.storage_gb_used)}
                    </Title>
                    <p className="pf-v6-u-color-200">GB Storage Used</p>
                  </div>
                </GridItem>
                <GridItem span={3}>
                  <div className="pf-v6-u-text-align-center">
                    <Title
                      headingLevel="h4"
                      size="2xl"
                      className="pf-v6-u-primary-color-100"
                    >
                      {total_usage.vm_count}
                    </Title>
                    <p className="pf-v6-u-color-200">Total VMs</p>
                  </div>
                </GridItem>
              </Grid>
            </CardBody>
          </Card>
        </StackItem>

        {/* Organization Resource Usage */}
        <StackItem>
          <Card>
            <CardBody>
              <Split hasGutter className="pf-v6-u-mb-md">
                <SplitItem isFilled>
                  <Title headingLevel="h3" size="lg">
                    Organization Resource Usage
                  </Title>
                </SplitItem>
                <SplitItem>
                  <Button
                    variant="link"
                    icon={<InfoCircleIcon />}
                    onClick={() =>
                      (window.location.href = '/monitoring/cost-reports')
                    }
                  >
                    View Cost Reports
                  </Button>
                </SplitItem>
              </Split>

              {organizations.length === 0 ? (
                <EmptyState variant="xs">
                  <Title headingLevel="h4" size="md">
                    No organizations found
                  </Title>
                  <EmptyStateBody>
                    No organizations match your current filters.
                  </EmptyStateBody>
                </EmptyState>
              ) : (
                <Stack hasGutter>
                  {organizations.map((org) => (
                    <StackItem key={org.organization_id}>
                      <Card>
                        <CardBody>
                          <Split hasGutter>
                            <SplitItem isFilled>
                              <Title headingLevel="h4" size="md">
                                <Link
                                  to={`/monitoring/organizations/${org.organization_id}`}
                                  className="pf-v6-c-link"
                                >
                                  {org.organization_name}
                                </Link>
                              </Title>
                              <p className="pf-v6-u-color-200">
                                {org.vdcs.length} VDCs •{' '}
                                {org.vdcs.reduce(
                                  (sum, vdc) =>
                                    sum + vdc.current_usage.vm_count,
                                  0
                                )}{' '}
                                VMs
                              </p>
                            </SplitItem>
                            <SplitItem>
                              <Grid hasGutter>
                                <GridItem span={4}>
                                  <div>
                                    <small className="pf-v6-u-color-200">
                                      CPU Usage
                                    </small>
                                    <Progress
                                      value={org.current_usage.cpu_cores_used}
                                      max={org.quota_limits.cpu_cores_limit}
                                      title={`${org.current_usage.cpu_cores_used}/${org.quota_limits.cpu_cores_limit} cores`}
                                      variant={getUsageVariant(
                                        org.current_usage.cpu_cores_used,
                                        org.quota_limits.cpu_cores_limit
                                      )}
                                    />
                                  </div>
                                </GridItem>
                                <GridItem span={4}>
                                  <div>
                                    <small className="pf-v6-u-color-200">
                                      Memory Usage
                                    </small>
                                    <Progress
                                      value={org.current_usage.memory_gb_used}
                                      max={org.quota_limits.memory_gb_limit}
                                      title={`${Math.round(org.current_usage.memory_gb_used)}/${org.quota_limits.memory_gb_limit} GB`}
                                      variant={getUsageVariant(
                                        org.current_usage.memory_gb_used,
                                        org.quota_limits.memory_gb_limit
                                      )}
                                    />
                                  </div>
                                </GridItem>
                                <GridItem span={4}>
                                  <div>
                                    <small className="pf-v6-u-color-200">
                                      Storage Usage
                                    </small>
                                    <Progress
                                      value={org.current_usage.storage_gb_used}
                                      max={org.quota_limits.storage_gb_limit}
                                      title={`${Math.round(org.current_usage.storage_gb_used)}/${org.quota_limits.storage_gb_limit} GB`}
                                      variant={getUsageVariant(
                                        org.current_usage.storage_gb_used,
                                        org.quota_limits.storage_gb_limit
                                      )}
                                    />
                                  </div>
                                </GridItem>
                              </Grid>
                            </SplitItem>
                          </Split>
                        </CardBody>
                      </Card>
                    </StackItem>
                  ))}
                </Stack>
              )}
            </CardBody>
          </Card>
        </StackItem>

        {/* Quick Actions */}
        <StackItem>
          <Grid hasGutter>
            <GridItem span={4}>
              <Link
                to="/monitoring/alerts"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Card isClickable>
                  <CardBody>
                    <Split hasGutter>
                      <SplitItem>
                        <Badge color="orange">Active Alerts</Badge>
                      </SplitItem>
                      <SplitItem isFilled>
                        <Title headingLevel="h4" size="md">
                          Usage Alerts & Notifications
                        </Title>
                        <p className="pf-v6-u-color-200">
                          Monitor and manage resource usage alerts and
                          thresholds.
                        </p>
                      </SplitItem>
                    </Split>
                  </CardBody>
                </Card>
              </Link>
            </GridItem>
            <GridItem span={4}>
              <Link
                to="/monitoring/dashboards"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Card isClickable>
                  <CardBody>
                    <Split hasGutter>
                      <SplitItem>
                        <Badge color="blue">Customize</Badge>
                      </SplitItem>
                      <SplitItem isFilled>
                        <Title headingLevel="h4" size="md">
                          Custom Dashboards
                        </Title>
                        <p className="pf-v6-u-color-200">
                          Create and manage personalized monitoring dashboards.
                        </p>
                      </SplitItem>
                    </Split>
                  </CardBody>
                </Card>
              </Link>
            </GridItem>
            <GridItem span={4}>
              <Link
                to="/monitoring/exports"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Card isClickable>
                  <CardBody>
                    <Split hasGutter>
                      <SplitItem>
                        <Badge color="green">Export</Badge>
                      </SplitItem>
                      <SplitItem isFilled>
                        <Title headingLevel="h4" size="md">
                          Export Reports
                        </Title>
                        <p className="pf-v6-u-color-200">
                          Export monitoring data and reports in various formats.
                        </p>
                      </SplitItem>
                    </Split>
                  </CardBody>
                </Card>
              </Link>
            </GridItem>
          </Grid>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

// Helper functions
function getStartDate(
  period: 'hourly' | 'daily' | 'weekly' | 'monthly'
): string {
  const now = new Date();
  switch (period) {
    case 'hourly':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case 'daily':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'weekly':
      return new Date(
        now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000
      ).toISOString();
    case 'monthly':
      return new Date(
        now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000
      ).toISOString();
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}

function getTimePeriodLabel(
  period: 'hourly' | 'daily' | 'weekly' | 'monthly'
): string {
  switch (period) {
    case 'hourly':
      return 'Last 24 Hours';
    case 'daily':
      return 'Last 7 Days';
    case 'weekly':
      return 'Last 4 Weeks';
    case 'monthly':
      return 'Last 12 Months';
    default:
      return 'Last 7 Days';
  }
}

function getOrgName(
  organizations: { organization_id: string; organization_name: string }[],
  orgId: string
): string {
  const org = organizations.find((o) => o.organization_id === orgId);
  return org?.organization_name || orgId;
}

function getUsageVariant(
  used: number,
  limit: number
): 'success' | 'warning' | 'danger' {
  const percentage = (used / limit) * 100;
  if (percentage >= 90) return 'danger';
  if (percentage >= 75) return 'warning';
  return 'success';
}

export default ResourceMonitoring;
