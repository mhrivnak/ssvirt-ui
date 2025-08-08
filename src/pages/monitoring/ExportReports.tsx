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
  DatePicker,
  Switch,
  Progress,
  Bullseye,
  Breadcrumb,
  BreadcrumbItem,
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ActionsColumn,
} from '@patternfly/react-table';
import {
  ExportIcon,
  DownloadIcon,
  FilterIcon,
  TimesIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import {
  useExportJobs,
  useRequestExport,
  useCancelExportJob,
  useDownloadExportFile,
} from '../../hooks/useMonitoring';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { MenuToggleElement } from '@patternfly/react-core';
import type { ExportJob } from '../../types';

const ExportReports: React.FC = () => {
  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // UI state
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [showCreateExportModal, setShowCreateExportModal] = useState(false);
  const [isDataTypeSelectOpen, setIsDataTypeSelectOpen] = useState(false);
  const [isFormatSelectOpen, setIsFormatSelectOpen] = useState(false);

  // Create export form state
  const [exportFormat, setExportFormat] = useState<
    'csv' | 'xlsx' | 'pdf' | 'json'
  >('csv');
  const [exportDataType, setExportDataType] = useState<
    | 'resource_usage'
    | 'cost_report'
    | 'capacity_planning'
    | 'alerts'
    | 'dashboard'
  >('resource_usage');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeCharts, setIncludeCharts] = useState(false);
  const [includeRawData, setIncludeRawData] = useState(true);

  // Build query parameters
  const queryParams = {
    search: searchValue || undefined,
    status: statusFilter || undefined,
    limit: perPage,
    page: currentPage,
  };

  const { data: jobsResponse, isLoading, error } = useExportJobs(queryParams);
  const requestExportMutation = useRequestExport();
  const cancelJobMutation = useCancelExportJob();
  const downloadFileMutation = useDownloadExportFile();

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setIsStatusFilterOpen(false);
  };

  const clearFilters = () => {
    setSearchValue('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const handleCreateExport = async () => {
    if (!startDate || !endDate) return;

    try {
      await requestExportMutation.mutateAsync({
        format: exportFormat,
        data_type: exportDataType,
        filters: {},
        time_range: {
          from: startDate,
          to: endDate,
        },
        include_charts: includeCharts,
        include_raw_data: includeRawData,
      });

      // Reset form and close modal
      setStartDate('');
      setEndDate('');
      setIncludeCharts(false);
      setIncludeRawData(true);
      setShowCreateExportModal(false);
    } catch (error) {
      console.error('Failed to create export:', error);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to cancel this export job?')) {
      try {
        await cancelJobMutation.mutateAsync(jobId);
      } catch (error) {
        console.error('Failed to cancel export job:', error);
      }
    }
  };

  const handleDownloadFile = async (job: ExportJob) => {
    try {
      const blob = await downloadFileMutation.mutateAsync(job.id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `export-${job.id}.${job.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download export file:', error);
    }
  };

  if (error) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading export jobs"
          isInline
        >
          {error.message || 'Failed to load export jobs. Please try again.'}
        </Alert>
      </PageSection>
    );
  }

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner message="Loading export jobs..." />
      </PageSection>
    );
  }

  const jobs = jobsResponse?.data || [];
  const pagination = jobsResponse?.pagination;

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
            <BreadcrumbItem isActive>Export Reports</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                <ExportIcon className="pf-v6-u-mr-sm" />
                Export Reports & Data
              </Title>
              <p>
                Export monitoring data, reports, and analytics in various
                formats. Schedule exports and download files when processing is
                complete.
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                icon={<ExportIcon />}
                onClick={() => setShowCreateExportModal(true)}
              >
                Create Export
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
                      placeholder="Search export jobs..."
                      value={searchValue}
                      onChange={(_event, value) => handleSearch(value)}
                      onClear={() => handleSearch('')}
                    />
                  </ToolbarItem>

                  <ToolbarItem>
                    <Select
                      isOpen={isStatusFilterOpen}
                      selected={statusFilter}
                      onSelect={(_, selection) =>
                        handleStatusFilterChange(selection as string)
                      }
                      onOpenChange={setIsStatusFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsStatusFilterOpen(!isStatusFilterOpen)
                          }
                          isExpanded={isStatusFilterOpen}
                          icon={<FilterIcon />}
                        >
                          {statusFilter
                            ? `Status: ${statusFilter}`
                            : 'All Statuses'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="">All Statuses</SelectOption>
                        <SelectOption value="pending">Pending</SelectOption>
                        <SelectOption value="processing">
                          Processing
                        </SelectOption>
                        <SelectOption value="completed">Completed</SelectOption>
                        <SelectOption value="failed">Failed</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  {(searchValue || statusFilter) && (
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

        {/* Export Jobs Table */}
        <StackItem>
          {jobs.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState>
                  <Bullseye>
                    <ExportIcon style={{ fontSize: '64px' }} />
                  </Bullseye>
                  <Title headingLevel="h4" size="lg">
                    No export jobs found
                  </Title>
                  <EmptyStateBody>
                    {searchValue || statusFilter
                      ? 'No export jobs match your current filters.'
                      : 'No export jobs have been created yet. Create your first export to download monitoring data.'}
                  </EmptyStateBody>
                  {searchValue || statusFilter ? (
                    <EmptyStateActions>
                      <Button variant="primary" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </EmptyStateActions>
                  ) : (
                    <EmptyStateActions>
                      <Button
                        variant="primary"
                        onClick={() => setShowCreateExportModal(true)}
                      >
                        Create Export
                      </Button>
                    </EmptyStateActions>
                  )}
                </EmptyState>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Export Job</Th>
                    <Th>Status</Th>
                    <Th>Progress</Th>
                    <Th>File Size</Th>
                    <Th>Created</Th>
                    <Th>Expires</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {jobs.map((job: ExportJob) => (
                    <Tr key={job.id}>
                      <Td>
                        <Stack>
                          <StackItem>
                            <strong>Export #{job.id.slice(-8)}</strong>
                          </StackItem>
                          <StackItem>
                            <small className="pf-v6-u-color-200">
                              {/* Data type would come from job metadata */}
                              Data export
                            </small>
                          </StackItem>
                        </Stack>
                      </Td>
                      <Td>
                        <Badge color={getStatusColor(job.status)}>
                          {job.status.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td>
                        {job.status === 'processing' ? (
                          <Progress
                            value={job.progress_percent}
                            title={`${job.progress_percent}%`}
                            size="sm"
                          />
                        ) : (
                          <span>{job.progress_percent}%</span>
                        )}
                      </Td>
                      <Td>
                        {job.file_size_bytes ? (
                          <span>{formatFileSize(job.file_size_bytes)}</span>
                        ) : (
                          <span className="pf-v6-u-color-200">-</span>
                        )}
                      </Td>
                      <Td>
                        <small>
                          {new Date(job.created_at).toLocaleString()}
                        </small>
                      </Td>
                      <Td>
                        {job.expires_at ? (
                          <small>
                            {new Date(job.expires_at).toLocaleDateString()}
                          </small>
                        ) : (
                          <span className="pf-v6-u-color-200">-</span>
                        )}
                      </Td>
                      <Td>
                        <ActionsColumn
                          items={[
                            {
                              title: 'Download',
                              icon: <DownloadIcon />,
                              onClick: () => handleDownloadFile(job),
                              isDisabled:
                                job.status !== 'completed' || !job.file_url,
                            },
                            {
                              title: 'Cancel',
                              icon: <TimesIcon />,
                              onClick: () => handleCancelJob(job.id),
                              isDisabled:
                                job.status === 'completed' ||
                                job.status === 'failed',
                            },
                          ].filter((item) =>
                            job.status === 'completed'
                              ? item.title === 'Download'
                              : job.status === 'pending' ||
                                  job.status === 'processing'
                                ? item.title === 'Cancel'
                                : false
                          )}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
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

      {/* Create Export Modal */}
      <Modal
        variant={ModalVariant.medium}
        title="Create Data Export"
        isOpen={showCreateExportModal}
        onClose={() => setShowCreateExportModal(false)}
      >
        <Form>
          <FormGroup label="Data Type" isRequired fieldId="export-data-type">
            <Select
              isOpen={isDataTypeSelectOpen}
              selected={exportDataType}
              onSelect={(_, selection) => {
                setExportDataType(
                  selection as
                    | 'resource_usage'
                    | 'cost_report'
                    | 'capacity_planning'
                    | 'alerts'
                    | 'dashboard'
                );
                setIsDataTypeSelectOpen(false);
              }}
              onOpenChange={(isOpen) => setIsDataTypeSelectOpen(isOpen)}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef}>
                  {getDataTypeLabel(exportDataType)}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="resource_usage">
                  Resource Usage
                </SelectOption>
                <SelectOption value="cost_report">Cost Reports</SelectOption>
                <SelectOption value="capacity_planning">
                  Capacity Planning
                </SelectOption>
                <SelectOption value="alerts">Usage Alerts</SelectOption>
                <SelectOption value="dashboard">Dashboard Data</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="Export Format" isRequired fieldId="export-format">
            <Select
              isOpen={isFormatSelectOpen}
              selected={exportFormat}
              onSelect={(_, selection) => {
                setExportFormat(selection as 'csv' | 'xlsx' | 'pdf' | 'json');
                setIsFormatSelectOpen(false);
              }}
              onOpenChange={(isOpen) => setIsFormatSelectOpen(isOpen)}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef}>
                  {exportFormat.toUpperCase()}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="csv">CSV</SelectOption>
                <SelectOption value="xlsx">Excel (XLSX)</SelectOption>
                <SelectOption value="pdf">PDF</SelectOption>
                <SelectOption value="json">JSON</SelectOption>
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

          <FormGroup label="Include Charts" fieldId="include-charts">
            <Switch
              id="include-charts"
              isChecked={includeCharts}
              onChange={(_event, checked) => setIncludeCharts(checked)}
              label="Include charts and visualizations"
            />
          </FormGroup>

          <FormGroup label="Include Raw Data" fieldId="include-raw-data">
            <Switch
              id="include-raw-data"
              isChecked={includeRawData}
              onChange={(_event, checked) => setIncludeRawData(checked)}
              label="Include raw data points"
            />
          </FormGroup>

          <div className="pf-v6-u-mt-lg">
            <Button
              variant="primary"
              onClick={handleCreateExport}
              isLoading={requestExportMutation.isPending}
              isDisabled={!startDate || !endDate}
              className="pf-v6-u-mr-sm"
            >
              Create Export
            </Button>
            <Button
              variant="link"
              onClick={() => setShowCreateExportModal(false)}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Modal>
    </PageSection>
  );
};

// Helper functions
function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'green';
    case 'processing':
      return 'blue';
    case 'pending':
      return 'grey';
    case 'failed':
      return 'red';
    default:
      return 'grey';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getDataTypeLabel(dataType: string): string {
  switch (dataType) {
    case 'resource_usage':
      return 'Resource Usage';
    case 'cost_report':
      return 'Cost Reports';
    case 'capacity_planning':
      return 'Capacity Planning';
    case 'alerts':
      return 'Usage Alerts';
    case 'dashboard':
      return 'Dashboard Data';
    default:
      return dataType;
  }
}

export default ExportReports;
