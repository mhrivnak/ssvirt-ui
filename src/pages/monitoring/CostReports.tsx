import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Button,
  Pagination,
  Stack,
  StackItem,
  Gallery,
  Badge,
  Split,
  SplitItem,
  Alert,
  AlertVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  DatePicker,
  Bullseye,
  Breadcrumb,
  BreadcrumbItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import {
  DollarSignIcon,
  PlusIcon,
  ExportIcon,
  FilterIcon,
  TrashIcon,
  EyeIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCostReports,
  useGenerateCostReport,
  useDeleteCostReport,
} from '../../hooks/useMonitoring';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { QUERY_KEYS } from '../../types';
import type { MenuToggleElement } from '@patternfly/react-core';

const CostReports: React.FC = () => {
  const queryClient = useQueryClient();

  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // UI state
  const [isSortSelectOpen, setIsSortSelectOpen] = useState(false);
  const [isPeriodFilterOpen, setIsPeriodFilterOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isReportPeriodSelectOpen, setIsReportPeriodSelectOpen] =
    useState(false);

  // Create report form state
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPeriod, setReportPeriod] = useState<
    'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  >('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Build query parameters
  const queryParams = {
    page: currentPage,
    per_page: perPage,
    sort_by: sortBy,
    sort_order: sortOrder,
    search: searchValue || undefined,
    period:
      (filterPeriod as
        | 'daily'
        | 'weekly'
        | 'monthly'
        | 'quarterly'
        | 'yearly') || undefined,
  };

  const {
    data: reportsResponse,
    isLoading,
    error,
  } = useCostReports(queryParams);
  const generateReportMutation = useGenerateCostReport();
  const deleteReportMutation = useDeleteCostReport();

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    const lastUnderscoreIndex = value.lastIndexOf('_');
    const newSortBy = value.slice(0, lastUnderscoreIndex);
    const newSortOrder = value.slice(lastUnderscoreIndex + 1);
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as 'asc' | 'desc');
    setCurrentPage(1);
    setIsSortSelectOpen(false);
  };

  const handlePeriodFilterChange = (value: string) => {
    setFilterPeriod(value);
    setCurrentPage(1);
    setIsPeriodFilterOpen(false);
  };

  const clearFilters = () => {
    setSearchValue('');
    setSortBy('created_at');
    setSortOrder('desc');
    setFilterPeriod('');
    setCurrentPage(1);
  };

  const handleCreateReport = async () => {
    if (!reportName || !startDate || !endDate) return;

    try {
      await generateReportMutation.mutateAsync({
        name: reportName,
        description: reportDescription,
        period: reportPeriod,
        start_date: startDate,
        end_date: endDate,
      });

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.costReports] });

      // Reset form and close modal
      setReportName('');
      setReportDescription('');
      setReportPeriod('monthly');
      setStartDate('');
      setEndDate('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to generate cost report:', error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this cost report?')) {
      try {
        await deleteReportMutation.mutateAsync(reportId);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.costReports] });
      } catch (error) {
        console.error('Failed to delete cost report:', error);
      }
    }
  };

  if (error) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading cost reports"
          isInline
        >
          {error.message || 'Failed to load cost reports. Please try again.'}
        </Alert>
      </PageSection>
    );
  }

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner message="Loading cost reports..." />
      </PageSection>
    );
  }

  const reports = reportsResponse?.data || [];
  const pagination = reportsResponse?.pagination;

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
            <BreadcrumbItem isActive>Cost Reports</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                <DollarSignIcon className="pf-v6-u-mr-sm" />
                Cost Reports & Analysis
              </Title>
              <p>
                Track and analyze costs across organizations, VDCs, and virtual
                machines. Generate detailed reports and monitor spending trends
                over time.
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                icon={<PlusIcon />}
                onClick={() => setShowCreateModal(true)}
              >
                Generate Report
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
                  <ToolbarItem width="300px">
                    <SearchInput
                      placeholder="Search reports..."
                      value={searchValue}
                      onChange={(_event, value) => handleSearch(value)}
                      onClear={() => handleSearch('')}
                    />
                  </ToolbarItem>

                  <ToolbarItem>
                    <Select
                      isOpen={isSortSelectOpen}
                      selected={`${sortBy}_${sortOrder}`}
                      onSelect={(_, selection) =>
                        handleSortChange(selection as string)
                      }
                      onOpenChange={setIsSortSelectOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsSortSelectOpen(!isSortSelectOpen)}
                          isExpanded={isSortSelectOpen}
                        >
                          Sort by{' '}
                          {sortBy === 'created_at'
                            ? 'Created'
                            : sortBy === 'total_cost'
                              ? 'Cost'
                              : 'Name'}{' '}
                          ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="name_asc">Name (A-Z)</SelectOption>
                        <SelectOption value="name_desc">
                          Name (Z-A)
                        </SelectOption>
                        <SelectOption value="created_at_desc">
                          Newest First
                        </SelectOption>
                        <SelectOption value="created_at_asc">
                          Oldest First
                        </SelectOption>
                        <SelectOption value="total_cost_desc">
                          Highest Cost
                        </SelectOption>
                        <SelectOption value="total_cost_asc">
                          Lowest Cost
                        </SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  <ToolbarItem>
                    <Select
                      isOpen={isPeriodFilterOpen}
                      selected={filterPeriod}
                      onSelect={(_, selection) =>
                        handlePeriodFilterChange(selection as string)
                      }
                      onOpenChange={setIsPeriodFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsPeriodFilterOpen(!isPeriodFilterOpen)
                          }
                          isExpanded={isPeriodFilterOpen}
                          icon={<FilterIcon />}
                        >
                          {filterPeriod
                            ? `Period: ${filterPeriod}`
                            : 'All Periods'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="">All Periods</SelectOption>
                        <SelectOption value="daily">Daily</SelectOption>
                        <SelectOption value="weekly">Weekly</SelectOption>
                        <SelectOption value="monthly">Monthly</SelectOption>
                        <SelectOption value="quarterly">Quarterly</SelectOption>
                        <SelectOption value="yearly">Yearly</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  {(searchValue || filterPeriod) && (
                    <ToolbarItem>
                      <Button variant="link" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </ToolbarItem>
                  )}

                  <ToolbarItem align={{ default: 'alignEnd' }}>
                    {pagination && (
                      <Pagination
                        itemCount={pagination.total}
                        perPage={perPage}
                        page={currentPage}
                        onSetPage={(_, page) => setCurrentPage(page)}
                        onPerPageSelect={(_, newPerPage) => {
                          setPerPage(newPerPage);
                          setCurrentPage(1);
                        }}
                        variant="top"
                        isCompact
                      />
                    )}
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
            </CardBody>
          </Card>
        </StackItem>

        {/* Reports List */}
        <StackItem>
          {reports.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState>
                  <Bullseye>
                    <DollarSignIcon style={{ fontSize: '64px' }} />
                  </Bullseye>
                  <Title headingLevel="h4" size="lg">
                    No cost reports found
                  </Title>
                  <EmptyStateBody>
                    {searchValue || filterPeriod
                      ? 'No cost reports match your current filters. Try adjusting your search criteria.'
                      : 'No cost reports have been generated yet. Create your first report to analyze spending.'}
                  </EmptyStateBody>
                  {searchValue || filterPeriod ? (
                    <EmptyStateActions>
                      <Button variant="primary" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </EmptyStateActions>
                  ) : (
                    <EmptyStateActions>
                      <Button
                        variant="primary"
                        onClick={() => setShowCreateModal(true)}
                      >
                        Generate Report
                      </Button>
                    </EmptyStateActions>
                  )}
                </EmptyState>
              </CardBody>
            </Card>
          ) : (
            <Gallery hasGutter minWidths={{ default: '400px' }}>
              {reports.map((report) => (
                <Card
                  key={report.id}
                  isSelectable
                  style={{ cursor: 'pointer' }}
                >
                  <CardBody>
                    <Stack hasGutter>
                      <StackItem>
                        <Split hasGutter>
                          <SplitItem isFilled>
                            <Title headingLevel="h3" size="lg">
                              {report.name}
                            </Title>
                          </SplitItem>
                          <SplitItem>
                            <Badge color="blue">{report.period}</Badge>
                          </SplitItem>
                        </Split>
                      </StackItem>

                      <StackItem>
                        <p>
                          {report.description || 'No description available.'}
                        </p>
                      </StackItem>

                      <StackItem>
                        <DescriptionList isHorizontal isCompact>
                          <DescriptionListGroup>
                            <DescriptionListTerm>
                              Total Cost
                            </DescriptionListTerm>
                            <DescriptionListDescription>
                              <strong>
                                ${report.total_cost.toLocaleString()}
                              </strong>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Period</DescriptionListTerm>
                            <DescriptionListDescription>
                              {new Date(report.start_date).toLocaleDateString()}{' '}
                              - {new Date(report.end_date).toLocaleDateString()}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </StackItem>

                      <StackItem>
                        <Split hasGutter>
                          <SplitItem>
                            <small>
                              Compute: $
                              {report.cost_breakdown.compute_cost.toLocaleString()}
                            </small>
                          </SplitItem>
                          <SplitItem>
                            <small>
                              Storage: $
                              {report.cost_breakdown.storage_cost.toLocaleString()}
                            </small>
                          </SplitItem>
                          <SplitItem>
                            <small>
                              Network: $
                              {report.cost_breakdown.network_cost.toLocaleString()}
                            </small>
                          </SplitItem>
                        </Split>
                      </StackItem>

                      <StackItem>
                        <Split hasGutter>
                          <SplitItem isFilled>
                            <small className="pf-v6-u-color-200">
                              Created:{' '}
                              {new Date(report.created_at).toLocaleDateString()}
                            </small>
                          </SplitItem>
                          <SplitItem>
                            <Button
                              variant="plain"
                              icon={<EyeIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                // View report details functionality would go here
                              }}
                              aria-label={`View ${report.name} details`}
                            />
                          </SplitItem>
                          <SplitItem>
                            <Button
                              variant="plain"
                              icon={<ExportIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement export functionality
                              }}
                              aria-label={`Export ${report.name}`}
                            />
                          </SplitItem>
                          <SplitItem>
                            <Button
                              variant="plain"
                              icon={<TrashIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReport(report.id);
                              }}
                              aria-label={`Delete ${report.name}`}
                              isDanger
                            />
                          </SplitItem>
                        </Split>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </Gallery>
          )}
        </StackItem>

        {/* Pagination */}
        {pagination && pagination.total > perPage && (
          <StackItem>
            <Pagination
              itemCount={pagination.total}
              perPage={perPage}
              page={currentPage}
              onSetPage={(_, page) => setCurrentPage(page)}
              onPerPageSelect={(_, newPerPage) => {
                setPerPage(newPerPage);
                setCurrentPage(1);
              }}
              variant="bottom"
            />
          </StackItem>
        )}
      </Stack>

      {/* Create Report Modal */}
      <Modal
        variant={ModalVariant.medium}
        title="Generate Cost Report"
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      >
        <Form>
          <FormGroup label="Report Name" isRequired fieldId="report-name">
            <TextInput
              isRequired
              id="report-name"
              value={reportName}
              onChange={(_event, value) => setReportName(value)}
              placeholder="Enter report name"
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="report-description">
            <TextArea
              id="report-description"
              value={reportDescription}
              onChange={(_event, value) => setReportDescription(value)}
              placeholder="Enter report description (optional)"
              rows={3}
            />
          </FormGroup>

          <FormGroup label="Report Period" isRequired fieldId="report-period">
            <Select
              isOpen={isReportPeriodSelectOpen}
              selected={reportPeriod}
              onSelect={(_, selection) => {
                setReportPeriod(
                  selection as
                    | 'daily'
                    | 'weekly'
                    | 'monthly'
                    | 'quarterly'
                    | 'yearly'
                );
                setIsReportPeriodSelectOpen(false);
              }}
              onOpenChange={(isOpen) => setIsReportPeriodSelectOpen(isOpen)}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef}>
                  {reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="daily">Daily</SelectOption>
                <SelectOption value="weekly">Weekly</SelectOption>
                <SelectOption value="monthly">Monthly</SelectOption>
                <SelectOption value="quarterly">Quarterly</SelectOption>
                <SelectOption value="yearly">Yearly</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="Start Date" isRequired fieldId="start-date">
            <DatePicker
              value={startDate}
              onChange={(_event, value) => setStartDate(value)}
              placeholder="Select start date"
            />
          </FormGroup>

          <FormGroup label="End Date" isRequired fieldId="end-date">
            <DatePicker
              value={endDate}
              onChange={(_event, value) => setEndDate(value)}
              placeholder="Select end date"
            />
          </FormGroup>

          <div className="pf-v6-u-mt-lg">
            <Button
              variant="primary"
              onClick={handleCreateReport}
              isLoading={generateReportMutation.isPending}
              isDisabled={!reportName || !startDate || !endDate}
              className="pf-v6-u-mr-sm"
            >
              Generate Report
            </Button>
            <Button variant="link" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
          </div>
        </Form>
      </Modal>
    </PageSection>
  );
};

export default CostReports;
