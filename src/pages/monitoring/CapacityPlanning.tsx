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
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Panel,
  PanelMain,
  PanelMainBody,
  PanelHeader,
} from '@patternfly/react-core';
import {
  ChartLineIcon,
  TrendUpIcon,
  CheckCircleIcon,
  FilterIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { useCapacityPlanningData, useCapacityRecommendations } from '../../hooks/useMonitoring';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { MenuToggleElement } from '@patternfly/react-core';
import type { CapacityRecommendation } from '../../types';

const CapacityPlanning: React.FC = () => {
  // Filter state
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedVdc, setSelectedVdc] = useState<string>('');
  const [forecastDays, setForecastDays] = useState<number>(90);
  const [isOrgFilterOpen, setIsOrgFilterOpen] = useState(false);
  const [isVdcFilterOpen, setIsVdcFilterOpen] = useState(false);
  const [isForecastOpen, setIsForecastOpen] = useState(false);

  // Build query parameters
  const capacityParams = {
    organization_id: selectedOrg || undefined,
    vdc_id: selectedVdc || undefined,
    forecast_days: forecastDays,
  };

  const recommendationParams = {
    organization_id: selectedOrg || undefined,
    vdc_id: selectedVdc || undefined,
  };

  const { data: capacityData, isLoading: capacityLoading, error: capacityError } = useCapacityPlanningData(capacityParams);
  const { data: recommendationsData, isLoading: recommendationsLoading, error: recommendationsError } = useCapacityRecommendations(recommendationParams);

  const handleOrgFilterChange = (value: string) => {
    setSelectedOrg(value);
    setSelectedVdc(''); // Reset VDC filter when org changes
    setIsOrgFilterOpen(false);
  };

  const handleVdcFilterChange = (value: string) => {
    setSelectedVdc(value);
    setIsVdcFilterOpen(false);
  };

  const handleForecastChange = (value: string) => {
    setForecastDays(parseInt(value, 10));
    setIsForecastOpen(false);
  };

  const clearFilters = () => {
    setSelectedOrg('');
    setSelectedVdc('');
    setForecastDays(90);
  };

  if (capacityError || recommendationsError) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading capacity planning data"
          isInline
        >
          {capacityError?.message || recommendationsError?.message || 'Failed to load capacity planning data. Please try again.'}
        </Alert>
      </PageSection>
    );
  }

  if (capacityLoading || recommendationsLoading) {
    return (
      <PageSection>
        <LoadingSpinner message="Loading capacity planning data..." />
      </PageSection>
    );
  }

  if (!capacityData?.data || !recommendationsData?.data) {
    return (
      <PageSection>
        <EmptyState>
          <Bullseye>
            <ChartLineIcon style={{ fontSize: '64px' }} />
          </Bullseye>
          <Title headingLevel="h4" size="lg">
            No capacity planning data available
          </Title>
          <EmptyStateBody>
            Capacity planning data is not available yet. Please check back later
            or contact your administrator.
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

  const capacity = capacityData.data;
  const recommendations = recommendationsData.data.recommendations;

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem component={Link} to="/dashboard">
              Dashboard
            </BreadcrumbItem>
            <BreadcrumbItem component={Link} to="/monitoring">
              Resource Monitoring
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Capacity Planning</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                <ChartLineIcon className="pf-v6-u-mr-sm" />
                Capacity Planning & Forecasting
              </Title>
              <p>
                Analyze current capacity utilization, forecast future needs, and receive
                recommendations for optimal resource planning and scaling decisions.
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="secondary"
                icon={<TrendUpIcon />}
                onClick={() => window.location.href = '/monitoring/alerts'}
              >
                Usage Alerts
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
                          {selectedOrg ? `Organization: ${selectedOrg}` : 'All Organizations'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="">All Organizations</SelectOption>
                        {/* TODO: Add organization options from data */}
                        <SelectOption value="org-1">Example Organization 1</SelectOption>
                        <SelectOption value="org-2">Example Organization 2</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  <ToolbarItem>
                    <Select
                      isOpen={isVdcFilterOpen}
                      selected={selectedVdc}
                      onSelect={(_, selection) =>
                        handleVdcFilterChange(selection as string)
                      }
                      onOpenChange={setIsVdcFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsVdcFilterOpen(!isVdcFilterOpen)}
                          isExpanded={isVdcFilterOpen}
                          icon={<FilterIcon />}
                        >
                          {selectedVdc ? `VDC: ${selectedVdc}` : 'All VDCs'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="">All VDCs</SelectOption>
                        {/* TODO: Add VDC options based on selected organization */}
                        <SelectOption value="vdc-1">Example VDC 1</SelectOption>
                        <SelectOption value="vdc-2">Example VDC 2</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  <ToolbarItem>
                    <Select
                      isOpen={isForecastOpen}
                      selected={forecastDays.toString()}
                      onSelect={(_, selection) =>
                        handleForecastChange(selection as string)
                      }
                      onOpenChange={setIsForecastOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsForecastOpen(!isForecastOpen)}
                          isExpanded={isForecastOpen}
                        >
                          Forecast: {forecastDays} days
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="30">30 days</SelectOption>
                        <SelectOption value="60">60 days</SelectOption>
                        <SelectOption value="90">90 days</SelectOption>
                        <SelectOption value="180">180 days</SelectOption>
                        <SelectOption value="365">1 year</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  {(selectedOrg || selectedVdc || forecastDays !== 90) && (
                    <ToolbarItem>
                      <Button variant="link" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </ToolbarItem>
                  )}
                </ToolbarContent>
              </Toolbar>
            </CardBody>
          </Card>
        </StackItem>

        {/* Current Capacity Overview */}
        <StackItem>
          <Card>
            <CardBody>
              <Title headingLevel="h3" size="lg" className="pf-v6-u-mb-md">
                Current Capacity Utilization
              </Title>
              <Grid hasGutter>
                <GridItem span={4}>
                  <Panel>
                    <PanelHeader>
                      <Title headingLevel="h4" size="md">CPU Capacity</Title>
                    </PanelHeader>
                    <PanelMain>
                      <PanelMainBody>
                        <Stack hasGutter>
                          <StackItem>
                            <Progress
                              value={capacity.current_capacity.used_cpu_cores}
                              max={capacity.current_capacity.total_cpu_cores}
                              title={`${capacity.current_capacity.used_cpu_cores}/${capacity.current_capacity.total_cpu_cores} cores`}
                              variant={getCapacityVariant(capacity.current_capacity.used_cpu_cores, capacity.current_capacity.total_cpu_cores)}
                              size="lg"
                            />
                          </StackItem>
                          <StackItem>
                            <DescriptionList isCompact>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Available</DescriptionListTerm>
                                <DescriptionListDescription>
                                  {capacity.current_capacity.total_cpu_cores - capacity.current_capacity.used_cpu_cores} cores
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Utilization</DescriptionListTerm>
                                <DescriptionListDescription>
                                  {Math.round((capacity.current_capacity.used_cpu_cores / capacity.current_capacity.total_cpu_cores) * 100)}%
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            </DescriptionList>
                          </StackItem>
                        </Stack>
                      </PanelMainBody>
                    </PanelMain>
                  </Panel>
                </GridItem>

                <GridItem span={4}>
                  <Panel>
                    <PanelHeader>
                      <Title headingLevel="h4" size="md">Memory Capacity</Title>
                    </PanelHeader>
                    <PanelMain>
                      <PanelMainBody>
                        <Stack hasGutter>
                          <StackItem>
                            <Progress
                              value={capacity.current_capacity.used_memory_gb}
                              max={capacity.current_capacity.total_memory_gb}
                              title={`${Math.round(capacity.current_capacity.used_memory_gb)}/${capacity.current_capacity.total_memory_gb} GB`}
                              variant={getCapacityVariant(capacity.current_capacity.used_memory_gb, capacity.current_capacity.total_memory_gb)}
                              size="lg"
                            />
                          </StackItem>
                          <StackItem>
                            <DescriptionList isCompact>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Available</DescriptionListTerm>
                                <DescriptionListDescription>
                                  {Math.round(capacity.current_capacity.total_memory_gb - capacity.current_capacity.used_memory_gb)} GB
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Utilization</DescriptionListTerm>
                                <DescriptionListDescription>
                                  {Math.round((capacity.current_capacity.used_memory_gb / capacity.current_capacity.total_memory_gb) * 100)}%
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            </DescriptionList>
                          </StackItem>
                        </Stack>
                      </PanelMainBody>
                    </PanelMain>
                  </Panel>
                </GridItem>

                <GridItem span={4}>
                  <Panel>
                    <PanelHeader>
                      <Title headingLevel="h4" size="md">Storage Capacity</Title>
                    </PanelHeader>
                    <PanelMain>
                      <PanelMainBody>
                        <Stack hasGutter>
                          <StackItem>
                            <Progress
                              value={capacity.current_capacity.used_storage_gb}
                              max={capacity.current_capacity.total_storage_gb}
                              title={`${Math.round(capacity.current_capacity.used_storage_gb)}/${capacity.current_capacity.total_storage_gb} GB`}
                              variant={getCapacityVariant(capacity.current_capacity.used_storage_gb, capacity.current_capacity.total_storage_gb)}
                              size="lg"
                            />
                          </StackItem>
                          <StackItem>
                            <DescriptionList isCompact>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Available</DescriptionListTerm>
                                <DescriptionListDescription>
                                  {Math.round(capacity.current_capacity.total_storage_gb - capacity.current_capacity.used_storage_gb)} GB
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Utilization</DescriptionListTerm>
                                <DescriptionListDescription>
                                  {Math.round((capacity.current_capacity.used_storage_gb / capacity.current_capacity.total_storage_gb) * 100)}%
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            </DescriptionList>
                          </StackItem>
                        </Stack>
                      </PanelMainBody>
                    </PanelMain>
                  </Panel>
                </GridItem>
              </Grid>
            </CardBody>
          </Card>
        </StackItem>

        {/* Capacity Recommendations */}
        <StackItem>
          <Card>
            <CardBody>
              <Title headingLevel="h3" size="lg" className="pf-v6-u-mb-md">
                Capacity Recommendations
              </Title>
              {recommendations.length === 0 ? (
                <EmptyState variant="xs">
                  <Bullseye>
                    <CheckCircleIcon style={{ fontSize: '48px', color: 'var(--pf-v6-global--success-color--100)' }} />
                  </Bullseye>
                  <Title headingLevel="h4" size="md">
                    No recommendations at this time
                  </Title>
                  <EmptyStateBody>
                    Your current capacity utilization is within optimal ranges.
                    We'll notify you when recommendations become available.
                  </EmptyStateBody>
                </EmptyState>
              ) : (
                <Stack hasGutter>
                  {recommendations.map((recommendation: CapacityRecommendation) => (
                    <StackItem key={recommendation.id}>
                      <Alert
                        variant={getRecommendationVariant(recommendation.priority)}
                        title={recommendation.title}
                        isInline
                      >
                        <Stack hasGutter>
                          <StackItem>
                            <p>{recommendation.description}</p>
                          </StackItem>
                          <StackItem>
                            <DescriptionList isHorizontal isCompact>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Resource Type</DescriptionListTerm>
                                <DescriptionListDescription>
                                  <Badge>{recommendation.resource_type.toUpperCase()}</Badge>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Priority</DescriptionListTerm>
                                <DescriptionListDescription>
                                  <Badge color={getPriorityColor(recommendation.priority)}>
                                    {recommendation.priority.toUpperCase()}
                                  </Badge>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Cost Impact</DescriptionListTerm>
                                <DescriptionListDescription>
                                  ${recommendation.estimated_cost_impact.toLocaleString()}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Deadline</DescriptionListTerm>
                                <DescriptionListDescription>
                                  {new Date(recommendation.deadline).toLocaleDateString()}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            </DescriptionList>
                          </StackItem>
                          <StackItem>
                            <p><strong>Recommended Action:</strong> {recommendation.recommended_action}</p>
                          </StackItem>
                        </Stack>
                      </Alert>
                    </StackItem>
                  ))}
                </Stack>
              )}
            </CardBody>
          </Card>
        </StackItem>

        {/* Growth Projections Placeholder */}
        <StackItem>
          <Card>
            <CardBody>
              <Title headingLevel="h3" size="lg" className="pf-v6-u-mb-md">
                Growth Projections ({forecastDays} days)
              </Title>
              <Alert
                variant={AlertVariant.info}
                title="Growth projection charts"
                isInline
              >
                Interactive charts showing projected CPU, memory, and storage usage
                trends would be displayed here. These charts would visualize the
                growth_projections data from the API with confidence intervals.
              </Alert>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

// Helper functions
function getCapacityVariant(used: number, total: number): 'success' | 'warning' | 'danger' {
  const percentage = (used / total) * 100;
  if (percentage >= 90) return 'danger';
  if (percentage >= 75) return 'warning';
  return 'success';
}

function getRecommendationVariant(priority: string): 'success' | 'info' | 'warning' | 'danger' {
  switch (priority) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
    default:
      return 'success';
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'red';
    case 'high':
      return 'orange';
    case 'medium':
      return 'blue';
    case 'low':
    default:
      return 'grey';
  }
}

export default CapacityPlanning;