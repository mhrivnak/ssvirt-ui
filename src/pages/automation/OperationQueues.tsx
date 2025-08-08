import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Stack,
  StackItem,
  Badge,
  Split,
  SplitItem,
  Progress,
  Alert,
  AlertVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  Breadcrumb,
  BreadcrumbItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Button,
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
} from '@patternfly/react-table';
import { PlayIcon, PauseIcon, TrashIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import {
  useOperationQueues,
  useOperationQueue,
  usePauseOperationQueue,
  useResumeOperationQueue,
  useClearCompletedOperations,
} from '../../hooks/useAutomation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';
import type { OperationQueue, QueuedOperation } from '../../types';

const OperationQueues: React.FC = () => {
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');

  const { data: queuesResponse, isLoading, error } = useOperationQueues();
  const { data: selectedQueueResponse, isLoading: isQueueLoading } =
    useOperationQueue(selectedQueueId);
  const pauseQueueMutation = usePauseOperationQueue();
  const resumeQueueMutation = useResumeOperationQueue();
  const clearCompletedMutation = useClearCompletedOperations();

  const queues = queuesResponse?.data?.queues || [];
  const selectedQueue = selectedQueueResponse?.data;

  const handlePauseQueue = async (queueId: string) => {
    if (
      window.confirm('Are you sure you want to pause this operation queue?')
    ) {
      try {
        await pauseQueueMutation.mutateAsync(queueId);
      } catch (error) {
        console.error('Failed to pause queue:', error);
      }
    }
  };

  const handleResumeQueue = async (queueId: string) => {
    try {
      await resumeQueueMutation.mutateAsync(queueId);
    } catch (error) {
      console.error('Failed to resume queue:', error);
    }
  };

  const handleClearCompleted = async (queueId: string) => {
    if (
      window.confirm(
        'Are you sure you want to clear all completed operations from this queue?'
      )
    ) {
      try {
        await clearCompletedMutation.mutateAsync(queueId);
      } catch (error) {
        console.error('Failed to clear completed operations:', error);
      }
    }
  };

  const getQueueStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'blue';
      case 'paused':
        return 'orange';
      case 'stopped':
        return 'grey';
      default:
        return 'grey';
    }
  };

  const getOperationStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'running':
        return 'blue';
      case 'failed':
        return 'red';
      case 'queued':
        return 'orange';
      case 'cancelled':
        return 'grey';
      default:
        return 'grey';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getQueueHealthStatus = (queue: OperationQueue) => {
    const errorRate =
      queue.current_operation_count +
        queue.pending_operation_count +
        queue.completed_operation_count +
        queue.failed_operation_count >
      0
        ? (queue.failed_operation_count /
            (queue.current_operation_count +
              queue.pending_operation_count +
              queue.completed_operation_count +
              queue.failed_operation_count)) *
          100
        : 0;
    if (errorRate > 20) return { status: 'error', message: 'High error rate' };
    if (queue.pending_operation_count > 100)
      return { status: 'warning', message: 'Queue backing up' };
    if (queue.status !== 'active')
      return { status: 'info', message: 'Queue paused' };
    return { status: 'success', message: 'Healthy' };
  };

  if (error) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading operation queues"
        >
          Failed to load operation queues. Please try again.
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
            <BreadcrumbItem component={Link} to={ROUTES.DASHBOARD}>
              Dashboard
            </BreadcrumbItem>
            <BreadcrumbItem component={Link} to={ROUTES.AUTOMATION}>
              Automation
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Operation Queues</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Title headingLevel="h1" size="2xl">
            Operation Queues
          </Title>
        </StackItem>

        {/* Queue Overview Cards */}
        <StackItem>
          {isLoading ? (
            <LoadingSpinner />
          ) : queues.length === 0 ? (
            <EmptyState variant="lg">
              <Title headingLevel="h4" size="lg">
                No operation queues found
              </Title>
              <EmptyStateBody>
                Operation queues are automatically created when batch operations
                are executed. They help manage and monitor the execution of
                multiple operations.
              </EmptyStateBody>
              <EmptyStateActions>
                <Link to={ROUTES.AUTOMATION_BATCH_OPERATIONS}>
                  <Button variant="primary">Create Batch Operation</Button>
                </Link>
              </EmptyStateActions>
            </EmptyState>
          ) : (
            <Flex
              direction={{ default: 'column' }}
              spaceItems={{ default: 'spaceItemsMd' }}
            >
              {queues.map((queue: OperationQueue) => {
                const health = getQueueHealthStatus(queue);
                return (
                  <FlexItem key={queue.id}>
                    <Card
                      isClickable
                      isSelected={selectedQueueId === queue.id}
                      onClick={() =>
                        setSelectedQueueId(
                          selectedQueueId === queue.id ? '' : queue.id
                        )
                      }
                    >
                      <CardBody>
                        <Stack hasGutter>
                          <StackItem>
                            <Split hasGutter>
                              <SplitItem isFilled>
                                <Stack>
                                  <StackItem>
                                    <Split hasGutter>
                                      <SplitItem>
                                        <strong>{queue.name}</strong>
                                      </SplitItem>
                                      <SplitItem>
                                        <Badge
                                          color={getQueueStatusColor(
                                            queue.status
                                          )}
                                        >
                                          {queue.status.toUpperCase()}
                                        </Badge>
                                      </SplitItem>
                                      <SplitItem>
                                        <Badge
                                          color={
                                            health.status === 'success'
                                              ? 'green'
                                              : health.status === 'warning'
                                                ? 'orange'
                                                : health.status === 'info'
                                                  ? 'grey'
                                                  : 'red'
                                          }
                                        >
                                          {health.message}
                                        </Badge>
                                      </SplitItem>
                                    </Split>
                                  </StackItem>
                                  <StackItem>
                                    <small className="pf-v6-u-color-200">
                                      Queue ID: {queue.id}
                                    </small>
                                  </StackItem>
                                </Stack>
                              </SplitItem>
                              <SplitItem>
                                <Stack>
                                  <StackItem>
                                    <DescriptionList isHorizontal isCompact>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          Pending
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          <Badge color="orange">
                                            {queue.pending_operation_count}
                                          </Badge>
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          Running
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          <Badge color="blue">
                                            {queue.current_operation_count}
                                          </Badge>
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          Completed
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          <Badge color="green">
                                            {queue.completed_operation_count}
                                          </Badge>
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          Failed
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          <Badge color="red">
                                            {queue.failed_operation_count}
                                          </Badge>
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                    </DescriptionList>
                                  </StackItem>
                                </Stack>
                              </SplitItem>
                              <SplitItem>
                                <ActionsColumn
                                  items={[
                                    {
                                      title:
                                        queue.status === 'active'
                                          ? 'Pause'
                                          : 'Resume',
                                      icon:
                                        queue.status === 'active' ? (
                                          <PauseIcon />
                                        ) : (
                                          <PlayIcon />
                                        ),
                                      onClick: () =>
                                        queue.status === 'active'
                                          ? handlePauseQueue(queue.id)
                                          : handleResumeQueue(queue.id),
                                    },
                                    {
                                      title: 'Clear Completed',
                                      icon: <TrashIcon />,
                                      onClick: () =>
                                        handleClearCompleted(queue.id),
                                      isDisabled:
                                        queue.completed_operation_count === 0,
                                    },
                                  ]}
                                />
                              </SplitItem>
                            </Split>
                          </StackItem>

                          {/* Progress bar */}
                          <StackItem>
                            <Progress
                              value={
                                queue.current_operation_count +
                                  queue.pending_operation_count +
                                  queue.completed_operation_count +
                                  queue.failed_operation_count >
                                0
                                  ? Math.round(
                                      (queue.completed_operation_count /
                                        (queue.current_operation_count +
                                          queue.pending_operation_count +
                                          queue.completed_operation_count +
                                          queue.failed_operation_count)) *
                                        100
                                    )
                                  : 0
                              }
                              title={`${queue.completed_operation_count}/${queue.current_operation_count + queue.pending_operation_count + queue.completed_operation_count + queue.failed_operation_count} operations completed`}
                              size="sm"
                              variant={
                                queue.failed_operation_count > 0
                                  ? 'warning'
                                  : 'success'
                              }
                            />
                          </StackItem>

                          {/* Queue details */}
                          <StackItem>
                            <DescriptionList isCompact>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Created
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  {new Date(queue.created_at).toLocaleString()}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Max Concurrent
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  {queue.max_concurrent_operations}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Average Duration
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  N/A
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            </DescriptionList>
                          </StackItem>
                        </Stack>
                      </CardBody>
                    </Card>
                  </FlexItem>
                );
              })}
            </Flex>
          )}
        </StackItem>

        {/* Selected Queue Operations */}
        {selectedQueueId && (
          <StackItem>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      Queue Operations: {selectedQueue?.name}
                    </Title>
                  </StackItem>

                  <StackItem>
                    {isQueueLoading ? (
                      <LoadingSpinner />
                    ) : selectedQueue?.operations?.length === 0 ? (
                      <EmptyState variant="sm">
                        <Title headingLevel="h4" size="md">
                          No operations in queue
                        </Title>
                        <EmptyStateBody>
                          This queue is currently empty.
                        </EmptyStateBody>
                      </EmptyState>
                    ) : (
                      <Table aria-label="Queue operations table">
                        <Thead>
                          <Tr>
                            <Th>Operation</Th>
                            <Th>Status</Th>
                            <Th>Type</Th>
                            <Th>Progress</Th>
                            <Th>Duration</Th>
                            <Th>Started</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {selectedQueue?.operations?.map(
                            (operation: QueuedOperation) => (
                              <Tr key={operation.id}>
                                <Td>
                                  <Stack>
                                    <StackItem>
                                      <strong>
                                        {operation.operation_type}
                                      </strong>
                                    </StackItem>
                                    <StackItem>
                                      <small className="pf-v6-u-color-200">
                                        {(operation.operation_data
                                          ?.target_count as number) || 0}{' '}
                                        targets
                                      </small>
                                    </StackItem>
                                  </Stack>
                                </Td>
                                <Td>
                                  <Badge
                                    color={getOperationStatusColor(
                                      operation.status
                                    )}
                                  >
                                    {operation.status.toUpperCase()}
                                  </Badge>
                                </Td>
                                <Td>{operation.operation_type}</Td>
                                <Td>
                                  <Progress
                                    value={
                                      operation.status === 'completed'
                                        ? 100
                                        : operation.status === 'running'
                                          ? 50
                                          : 0
                                    }
                                    title={`${operation.status === 'completed' ? 100 : operation.status === 'running' ? 50 : 0}%`}
                                    size="sm"
                                    variant={
                                      operation.status === 'failed'
                                        ? 'danger'
                                        : 'success'
                                    }
                                  />
                                </Td>
                                <Td>
                                  {operation.actual_duration_seconds
                                    ? formatDuration(
                                        operation.actual_duration_seconds
                                      )
                                    : 'N/A'}
                                </Td>
                                <Td>
                                  {operation.started_at
                                    ? new Date(
                                        operation.started_at
                                      ).toLocaleString()
                                    : 'Not started'}
                                </Td>
                              </Tr>
                            )
                          ) || []}
                        </Tbody>
                      </Table>
                    )}
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </StackItem>
        )}
      </Stack>
    </PageSection>
  );
};

export default OperationQueues;
