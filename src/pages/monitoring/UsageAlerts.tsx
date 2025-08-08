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
  TextInput,
  TextArea,
  NumberInput,
  Switch,
  Bullseye,
  Breadcrumb,
  BreadcrumbItem,
  Tabs,
  Tab,
  TabTitleText,
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
  BellIcon,
  PlusIcon,
  FilterIcon,
  CheckCircleIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import {
  useUsageAlerts,
  useAlertRules,
  useResolveAlert,
  useSuppressAlert,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
} from '../../hooks/useMonitoring';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { MenuToggleElement } from '@patternfly/react-core';
import type { UsageAlert, AlertRule } from '../../types';

const UsageAlerts: React.FC = () => {
  // Tab state
  const [activeTabKey, setActiveTabKey] = useState<string | number>('alerts');

  // Search and filter state for alerts
  const [alertSearchValue, setAlertSearchValue] = useState('');
  const [alertStatusFilter, setAlertStatusFilter] = useState<string>('');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<string>('');
  const [alertCurrentPage, setAlertCurrentPage] = useState(1);
  const [alertPerPage, setAlertPerPage] = useState(20);

  // Search and filter state for rules
  const [ruleSearchValue, setRuleSearchValue] = useState('');
  const [ruleEnabledFilter, setRuleEnabledFilter] = useState<string>('');

  // UI state
  const [isAlertStatusOpen, setIsAlertStatusOpen] = useState(false);
  const [isAlertSeverityOpen, setIsAlertSeverityOpen] = useState(false);
  const [isRuleEnabledOpen, setIsRuleEnabledOpen] = useState(false);
  const [isRuleResourceTypeOpen, setIsRuleResourceTypeOpen] = useState(false);
  const [isRuleSeverityOpen, setIsRuleSeverityOpen] = useState(false);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  // Create/edit rule form state
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleEnabled, setRuleEnabled] = useState(true);
  const [ruleAlertType, setRuleAlertType] = useState<
    'threshold' | 'anomaly' | 'trend'
  >('threshold');
  const [ruleSeverity, setRuleSeverity] = useState<
    'info' | 'warning' | 'error' | 'critical'
  >('warning');
  const [ruleResourceType, setRuleResourceType] = useState<
    'cpu' | 'memory' | 'storage' | 'network' | 'cost'
  >('cpu');
  const [ruleScope, setRuleScope] = useState<
    'global' | 'organization' | 'vdc' | 'vm'
  >('global');
  const [ruleThresholdValue, setRuleThresholdValue] = useState<number>(80);
  const [ruleThresholdOperator, setRuleThresholdOperator] = useState<
    'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  >('gte');
  const [ruleThresholdDuration, setRuleThresholdDuration] = useState<number>(5);

  // Build query parameters
  const alertQueryParams = {
    page: alertCurrentPage,
    per_page: alertPerPage,
    search: alertSearchValue || undefined,
    status:
      (alertStatusFilter as 'active' | 'resolved' | 'suppressed') || undefined,
    severity:
      (alertSeverityFilter as 'info' | 'warning' | 'error' | 'critical') ||
      undefined,
  };

  const ruleQueryParams = {
    search: ruleSearchValue || undefined,
    enabled: ruleEnabledFilter ? ruleEnabledFilter === 'true' : undefined,
  };

  const {
    data: alertsResponse,
    isLoading: alertsLoading,
    error: alertsError,
  } = useUsageAlerts(alertQueryParams);
  const {
    data: rulesResponse,
    isLoading: rulesLoading,
    error: rulesError,
  } = useAlertRules(ruleQueryParams);

  const resolveAlertMutation = useResolveAlert();
  const suppressAlertMutation = useSuppressAlert();
  const createRuleMutation = useCreateAlertRule();
  const updateRuleMutation = useUpdateAlertRule();
  const deleteRuleMutation = useDeleteAlertRule();

  const handleAlertSearch = (value: string) => {
    setAlertSearchValue(value);
    setAlertCurrentPage(1);
  };

  const handleRuleSearch = (value: string) => {
    setRuleSearchValue(value);
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlertMutation.mutateAsync({ alertId });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleSuppressAlert = async (alertId: string) => {
    try {
      await suppressAlertMutation.mutateAsync({
        alertId,
        duration_minutes: 60,
      });
    } catch (error) {
      console.error('Failed to suppress alert:', error);
    }
  };

  const handleCreateRule = async () => {
    if (!ruleName) return;

    try {
      await createRuleMutation.mutateAsync({
        name: ruleName,
        description: ruleDescription,
        enabled: ruleEnabled,
        alert_type: ruleAlertType,
        severity: ruleSeverity,
        resource_type: ruleResourceType,
        scope: ruleScope,
        threshold_config: {
          metric: `${ruleResourceType}_usage_percent`,
          operator: ruleThresholdOperator,
          value: ruleThresholdValue,
          duration_minutes: ruleThresholdDuration,
        },
        notification_config: {
          email_enabled: true,
          email_recipients: [],
          webhook_enabled: false,
        },
      });

      resetRuleForm();
      setShowCreateRuleModal(false);
    } catch (error) {
      console.error('Failed to create alert rule:', error);
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule || !ruleName) return;

    try {
      await updateRuleMutation.mutateAsync({
        ruleId: editingRule.id,
        updates: {
          name: ruleName,
          description: ruleDescription,
          enabled: ruleEnabled,
          alert_type: ruleAlertType,
          severity: ruleSeverity,
          resource_type: ruleResourceType,
          scope: ruleScope,
          threshold_config: {
            metric: `${ruleResourceType}_usage_percent`,
            operator: ruleThresholdOperator,
            value: ruleThresholdValue,
            duration_minutes: ruleThresholdDuration,
          },
        },
      });

      resetRuleForm();
      setEditingRule(null);
    } catch (error) {
      console.error('Failed to update alert rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this alert rule?')) {
      try {
        await deleteRuleMutation.mutateAsync(ruleId);
      } catch (error) {
        console.error('Failed to delete alert rule:', error);
      }
    }
  };

  const resetRuleForm = () => {
    setRuleName('');
    setRuleDescription('');
    setRuleEnabled(true);
    setRuleAlertType('threshold');
    setRuleSeverity('warning');
    setRuleResourceType('cpu');
    setRuleScope('global');
    setRuleThresholdValue(80);
    setRuleThresholdOperator('gte');
    setRuleThresholdDuration(5);
  };

  const openEditRuleModal = (rule: AlertRule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setRuleDescription(rule.description);
    setRuleEnabled(rule.enabled);
    setRuleAlertType(rule.alert_type);
    setRuleSeverity(rule.severity);
    setRuleResourceType(rule.resource_type);
    setRuleScope(rule.scope);
    setRuleThresholdValue(rule.threshold_config?.value || 80);
    setRuleThresholdOperator(rule.threshold_config?.operator || 'gte');
    setRuleThresholdDuration(rule.threshold_config?.duration_minutes || 5);
    setShowCreateRuleModal(true);
  };

  if (alertsError || rulesError) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading alerts data"
          isInline
        >
          {alertsError?.message ||
            rulesError?.message ||
            'Failed to load alerts data. Please try again.'}
        </Alert>
      </PageSection>
    );
  }

  const alerts = alertsResponse?.data || [];
  const alertsPagination = alertsResponse?.pagination;
  const rules = rulesResponse?.data || [];

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
            <BreadcrumbItem isActive>Usage Alerts</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                <BellIcon className="pf-v6-u-mr-sm" />
                Usage Alerts & Notifications
              </Title>
              <p>
                Monitor resource usage alerts and manage notification rules.
                Configure thresholds and receive notifications when resources
                exceed defined limits.
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                icon={<PlusIcon />}
                onClick={() => setShowCreateRuleModal(true)}
              >
                Create Alert Rule
              </Button>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Tabs */}
        <StackItem>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}
          >
            <Tab
              eventKey="alerts"
              title={
                <TabTitleText>Active Alerts ({alerts.length})</TabTitleText>
              }
            >
              <Stack hasGutter style={{ marginTop: '1rem' }}>
                {/* Alert Filters */}
                <StackItem>
                  <Card>
                    <CardBody>
                      <Toolbar>
                        <ToolbarContent>
                          <ToolbarItem width="300px">
                            <SearchInput
                              placeholder="Search alerts..."
                              value={alertSearchValue}
                              onChange={(_event, value) =>
                                handleAlertSearch(value)
                              }
                              onClear={() => handleAlertSearch('')}
                            />
                          </ToolbarItem>

                          <ToolbarItem>
                            <Select
                              isOpen={isAlertStatusOpen}
                              selected={alertStatusFilter}
                              onSelect={(_, selection) => {
                                setAlertStatusFilter(selection as string);
                                setIsAlertStatusOpen(false);
                              }}
                              onOpenChange={setIsAlertStatusOpen}
                              toggle={(
                                toggleRef: React.Ref<MenuToggleElement>
                              ) => (
                                <MenuToggle
                                  ref={toggleRef}
                                  onClick={() =>
                                    setIsAlertStatusOpen(!isAlertStatusOpen)
                                  }
                                  isExpanded={isAlertStatusOpen}
                                  icon={<FilterIcon />}
                                >
                                  {alertStatusFilter
                                    ? `Status: ${alertStatusFilter}`
                                    : 'All Statuses'}
                                </MenuToggle>
                              )}
                            >
                              <SelectList>
                                <SelectOption value="">
                                  All Statuses
                                </SelectOption>
                                <SelectOption value="active">
                                  Active
                                </SelectOption>
                                <SelectOption value="resolved">
                                  Resolved
                                </SelectOption>
                                <SelectOption value="suppressed">
                                  Suppressed
                                </SelectOption>
                              </SelectList>
                            </Select>
                          </ToolbarItem>

                          <ToolbarItem>
                            <Select
                              isOpen={isAlertSeverityOpen}
                              selected={alertSeverityFilter}
                              onSelect={(_, selection) => {
                                setAlertSeverityFilter(selection as string);
                                setIsAlertSeverityOpen(false);
                              }}
                              onOpenChange={setIsAlertSeverityOpen}
                              toggle={(
                                toggleRef: React.Ref<MenuToggleElement>
                              ) => (
                                <MenuToggle
                                  ref={toggleRef}
                                  onClick={() =>
                                    setIsAlertSeverityOpen(!isAlertSeverityOpen)
                                  }
                                  isExpanded={isAlertSeverityOpen}
                                  icon={<FilterIcon />}
                                >
                                  {alertSeverityFilter
                                    ? `Severity: ${alertSeverityFilter}`
                                    : 'All Severities'}
                                </MenuToggle>
                              )}
                            >
                              <SelectList>
                                <SelectOption value="">
                                  All Severities
                                </SelectOption>
                                <SelectOption value="critical">
                                  Critical
                                </SelectOption>
                                <SelectOption value="error">Error</SelectOption>
                                <SelectOption value="warning">
                                  Warning
                                </SelectOption>
                                <SelectOption value="info">Info</SelectOption>
                              </SelectList>
                            </Select>
                          </ToolbarItem>

                          <ToolbarItem align={{ default: 'alignEnd' }}>
                            {alertsPagination && (
                              <Pagination
                                itemCount={alertsPagination.total}
                                perPage={alertPerPage}
                                page={alertCurrentPage}
                                onSetPage={(_, page) =>
                                  setAlertCurrentPage(page)
                                }
                                onPerPageSelect={(_, newPerPage) => {
                                  setAlertPerPage(newPerPage);
                                  setAlertCurrentPage(1);
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

                {/* Alerts Table */}
                <StackItem>
                  {alertsLoading ? (
                    <LoadingSpinner message="Loading alerts..." />
                  ) : alerts.length === 0 ? (
                    <Card>
                      <CardBody>
                        <EmptyState>
                          <Bullseye>
                            <CheckCircleIcon
                              style={{
                                fontSize: '64px',
                                color:
                                  'var(--pf-v6-global--success-color--100)',
                              }}
                            />
                          </Bullseye>
                          <Title headingLevel="h4" size="lg">
                            No alerts found
                          </Title>
                          <EmptyStateBody>
                            {alertSearchValue ||
                            alertStatusFilter ||
                            alertSeverityFilter
                              ? 'No alerts match your current filters.'
                              : 'Great! No active alerts at this time.'}
                          </EmptyStateBody>
                        </EmptyState>
                      </CardBody>
                    </Card>
                  ) : (
                    <Card>
                      <Table>
                        <Thead>
                          <Tr>
                            <Th>Alert</Th>
                            <Th>Severity</Th>
                            <Th>Resource</Th>
                            <Th>Status</Th>
                            <Th>Triggered</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {alerts.map((alert: UsageAlert) => (
                            <Tr key={alert.id}>
                              <Td>
                                <Stack>
                                  <StackItem>
                                    <strong>{alert.name}</strong>
                                  </StackItem>
                                  <StackItem>
                                    <small className="pf-v6-u-color-200">
                                      {alert.message}
                                    </small>
                                  </StackItem>
                                </Stack>
                              </Td>
                              <Td>
                                <Badge color={getSeverityColor(alert.severity)}>
                                  {alert.severity.toUpperCase()}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge>
                                  {alert.resource_type.toUpperCase()}
                                </Badge>
                                {alert.scope_name && (
                                  <div>
                                    <small className="pf-v6-u-color-200">
                                      {alert.scope}: {alert.scope_name}
                                    </small>
                                  </div>
                                )}
                              </Td>
                              <Td>
                                <Badge color={getStatusColor(alert.status)}>
                                  {alert.status.toUpperCase()}
                                </Badge>
                              </Td>
                              <Td>
                                <small>
                                  {new Date(
                                    alert.triggered_at
                                  ).toLocaleString()}
                                </small>
                              </Td>
                              <Td>
                                <ActionsColumn
                                  items={[
                                    {
                                      title: 'Resolve',
                                      onClick: () =>
                                        handleResolveAlert(alert.id),
                                      isDisabled: alert.status !== 'active',
                                    },
                                    {
                                      title: 'Suppress',
                                      onClick: () =>
                                        handleSuppressAlert(alert.id),
                                      isDisabled: alert.status !== 'active',
                                    },
                                  ]}
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Card>
                  )}
                </StackItem>
              </Stack>
            </Tab>

            <Tab
              eventKey="rules"
              title={<TabTitleText>Alert Rules ({rules.length})</TabTitleText>}
            >
              <Stack hasGutter style={{ marginTop: '1rem' }}>
                {/* Rule Filters */}
                <StackItem>
                  <Card>
                    <CardBody>
                      <Toolbar>
                        <ToolbarContent>
                          <ToolbarItem width="300px">
                            <SearchInput
                              placeholder="Search alert rules..."
                              value={ruleSearchValue}
                              onChange={(_event, value) =>
                                handleRuleSearch(value)
                              }
                              onClear={() => handleRuleSearch('')}
                            />
                          </ToolbarItem>

                          <ToolbarItem>
                            <Select
                              isOpen={isRuleEnabledOpen}
                              selected={ruleEnabledFilter}
                              onSelect={(_, selection) => {
                                setRuleEnabledFilter(selection as string);
                                setIsRuleEnabledOpen(false);
                              }}
                              onOpenChange={setIsRuleEnabledOpen}
                              toggle={(
                                toggleRef: React.Ref<MenuToggleElement>
                              ) => (
                                <MenuToggle
                                  ref={toggleRef}
                                  onClick={() =>
                                    setIsRuleEnabledOpen(!isRuleEnabledOpen)
                                  }
                                  isExpanded={isRuleEnabledOpen}
                                  icon={<FilterIcon />}
                                >
                                  {ruleEnabledFilter
                                    ? `Status: ${ruleEnabledFilter === 'true' ? 'Enabled' : 'Disabled'}`
                                    : 'All Rules'}
                                </MenuToggle>
                              )}
                            >
                              <SelectList>
                                <SelectOption value="">All Rules</SelectOption>
                                <SelectOption value="true">
                                  Enabled
                                </SelectOption>
                                <SelectOption value="false">
                                  Disabled
                                </SelectOption>
                              </SelectList>
                            </Select>
                          </ToolbarItem>
                        </ToolbarContent>
                      </Toolbar>
                    </CardBody>
                  </Card>
                </StackItem>

                {/* Rules Table */}
                <StackItem>
                  {rulesLoading ? (
                    <LoadingSpinner message="Loading alert rules..." />
                  ) : rules.length === 0 ? (
                    <Card>
                      <CardBody>
                        <EmptyState>
                          <Bullseye>
                            <BellIcon style={{ fontSize: '64px' }} />
                          </Bullseye>
                          <Title headingLevel="h4" size="lg">
                            No alert rules found
                          </Title>
                          <EmptyStateBody>
                            Create alert rules to monitor resource usage and
                            receive notifications when thresholds are exceeded.
                          </EmptyStateBody>
                          <EmptyStateActions>
                            <Button
                              variant="primary"
                              onClick={() => setShowCreateRuleModal(true)}
                            >
                              Create Alert Rule
                            </Button>
                          </EmptyStateActions>
                        </EmptyState>
                      </CardBody>
                    </Card>
                  ) : (
                    <Card>
                      <Table>
                        <Thead>
                          <Tr>
                            <Th>Rule Name</Th>
                            <Th>Resource Type</Th>
                            <Th>Severity</Th>
                            <Th>Scope</Th>
                            <Th>Status</Th>
                            <Th>Created</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {rules.map((rule: AlertRule) => (
                            <Tr key={rule.id}>
                              <Td>
                                <Stack>
                                  <StackItem>
                                    <strong>{rule.name}</strong>
                                  </StackItem>
                                  <StackItem>
                                    <small className="pf-v6-u-color-200">
                                      {rule.description}
                                    </small>
                                  </StackItem>
                                </Stack>
                              </Td>
                              <Td>
                                <Badge>
                                  {rule.resource_type.toUpperCase()}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge color={getSeverityColor(rule.severity)}>
                                  {rule.severity.toUpperCase()}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge color="grey">
                                  {rule.scope.toUpperCase()}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge color={rule.enabled ? 'green' : 'grey'}>
                                  {rule.enabled ? 'ENABLED' : 'DISABLED'}
                                </Badge>
                              </Td>
                              <Td>
                                <small>
                                  {new Date(
                                    rule.created_at
                                  ).toLocaleDateString()}
                                </small>
                              </Td>
                              <Td>
                                <ActionsColumn
                                  items={[
                                    {
                                      title: 'Edit',
                                      onClick: () => openEditRuleModal(rule),
                                    },
                                    {
                                      title: 'Delete',
                                      onClick: () => handleDeleteRule(rule.id),
                                    },
                                  ]}
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Card>
                  )}
                </StackItem>
              </Stack>
            </Tab>
          </Tabs>
        </StackItem>
      </Stack>

      {/* Create/Edit Alert Rule Modal */}
      <Modal
        variant={ModalVariant.medium}
        title={editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
        isOpen={showCreateRuleModal}
        onClose={() => {
          setShowCreateRuleModal(false);
          setEditingRule(null);
          resetRuleForm();
        }}
      >
        <Form>
          <FormGroup label="Rule Name" isRequired fieldId="rule-name">
            <TextInput
              isRequired
              id="rule-name"
              value={ruleName}
              onChange={(_event, value) => setRuleName(value)}
              placeholder="Enter rule name"
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="rule-description">
            <TextArea
              id="rule-description"
              value={ruleDescription}
              onChange={(_event, value) => setRuleDescription(value)}
              placeholder="Enter rule description"
              rows={3}
            />
          </FormGroup>

          <FormGroup label="Enabled" fieldId="rule-enabled">
            <Switch
              id="rule-enabled"
              isChecked={ruleEnabled}
              onChange={(_event, checked) => setRuleEnabled(checked)}
            />
          </FormGroup>

          <FormGroup
            label="Resource Type"
            isRequired
            fieldId="rule-resource-type"
          >
            <Select
              isOpen={isRuleResourceTypeOpen}
              selected={ruleResourceType}
              onSelect={(_, selection) => {
                setRuleResourceType(
                  selection as 'cpu' | 'memory' | 'storage' | 'network' | 'cost'
                );
                setIsRuleResourceTypeOpen(false);
              }}
              onOpenChange={setIsRuleResourceTypeOpen}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsRuleResourceTypeOpen(!isRuleResourceTypeOpen)}
                  isExpanded={isRuleResourceTypeOpen}
                >
                  {ruleResourceType.toUpperCase()}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="cpu">CPU</SelectOption>
                <SelectOption value="memory">Memory</SelectOption>
                <SelectOption value="storage">Storage</SelectOption>
                <SelectOption value="network">Network</SelectOption>
                <SelectOption value="cost">Cost</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="Severity" isRequired fieldId="rule-severity">
            <Select
              isOpen={isRuleSeverityOpen}
              selected={ruleSeverity}
              onSelect={(_, selection) => {
                setRuleSeverity(
                  selection as 'info' | 'warning' | 'error' | 'critical'
                );
                setIsRuleSeverityOpen(false);
              }}
              onOpenChange={setIsRuleSeverityOpen}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsRuleSeverityOpen(!isRuleSeverityOpen)}
                  isExpanded={isRuleSeverityOpen}
                >
                  {ruleSeverity.toUpperCase()}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="info">Info</SelectOption>
                <SelectOption value="warning">Warning</SelectOption>
                <SelectOption value="error">Error</SelectOption>
                <SelectOption value="critical">Critical</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup
            label="Threshold Value (%)"
            isRequired
            fieldId="rule-threshold"
          >
            <NumberInput
              value={ruleThresholdValue}
              onMinus={() =>
                setRuleThresholdValue(Math.max(0, ruleThresholdValue - 5))
              }
              onPlus={() =>
                setRuleThresholdValue(Math.min(100, ruleThresholdValue + 5))
              }
              onChange={(event) => {
                const value = parseInt(
                  (event.target as HTMLInputElement).value,
                  10
                );
                if (!isNaN(value)) {
                  setRuleThresholdValue(Math.max(0, Math.min(100, value)));
                }
              }}
              inputProps={{
                min: 0,
                max: 100,
              }}
            />
          </FormGroup>

          <FormGroup
            label="Duration (minutes)"
            isRequired
            fieldId="rule-duration"
          >
            <NumberInput
              value={ruleThresholdDuration}
              onMinus={() =>
                setRuleThresholdDuration(Math.max(1, ruleThresholdDuration - 1))
              }
              onPlus={() => setRuleThresholdDuration(ruleThresholdDuration + 1)}
              onChange={(event) => {
                const value = parseInt(
                  (event.target as HTMLInputElement).value,
                  10
                );
                if (!isNaN(value)) {
                  setRuleThresholdDuration(Math.max(1, value));
                }
              }}
              inputProps={{
                min: 1,
              }}
            />
          </FormGroup>

          <div className="pf-v6-u-mt-lg">
            <Button
              variant="primary"
              onClick={editingRule ? handleUpdateRule : handleCreateRule}
              isLoading={
                createRuleMutation.isPending || updateRuleMutation.isPending
              }
              isDisabled={!ruleName}
              className="pf-v6-u-mr-sm"
            >
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
            <Button
              variant="link"
              onClick={() => {
                setShowCreateRuleModal(false);
                setEditingRule(null);
                resetRuleForm();
              }}
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
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'red';
    case 'error':
      return 'orange';
    case 'warning':
      return 'gold';
    case 'info':
    default:
      return 'blue';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'red';
    case 'resolved':
      return 'green';
    case 'suppressed':
      return 'grey';
    default:
      return 'blue';
  }
}

export default UsageAlerts;
