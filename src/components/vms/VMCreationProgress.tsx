import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalVariant,
  Title,
  Progress,
  ProgressSize,
  ProgressVariant,
  Stack,
  StackItem,
  Alert,
  AlertVariant,
  Button,
  Card,
  CardBody,
  List,
  ListItem,
  Divider,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  InProgressIcon,
  ExclamationCircleIcon,
  VirtualMachineIcon,
  ClockIcon,
} from '@patternfly/react-icons';
import type { VMCreationProgress } from '../../types';

interface VMCreationProgressProps {
  isOpen: boolean;
  onClose: () => void;
  vmName: string;
  vdcName: string;
  progress?: VMCreationProgress;
  error?: string;
}

// Mock progress steps for demonstration
const CREATION_STEPS = [
  {
    id: 'validate',
    name: 'Validating configuration',
    description: 'Checking resource availability and configuration',
  },
  {
    id: 'allocate',
    name: 'Allocating resources',
    description: 'Reserving CPU, memory, and storage resources',
  },
  {
    id: 'provision',
    name: 'Provisioning VM',
    description: 'Creating virtual machine from template',
  },
  {
    id: 'network',
    name: 'Configuring network',
    description: 'Setting up network interfaces and connectivity',
  },
  {
    id: 'storage',
    name: 'Configuring storage',
    description: 'Attaching and formatting storage devices',
  },
  {
    id: 'customize',
    name: 'Applying customization',
    description: 'Running cloud-init or guest customization',
  },
  {
    id: 'finalize',
    name: 'Finalizing deployment',
    description: 'Completing VM setup and registration',
  },
];

function VMCreationProgress({
  isOpen,
  onClose,
  vmName,
  vdcName,
  progress,
  error,
}: VMCreationProgressProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Simulate progress updates if no real progress is provided
  useEffect(() => {
    if (!isOpen || hasError || isComplete) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prevIndex) => {
        if (prevIndex < CREATION_STEPS.length - 1) {
          setCompletedSteps((prev) => [...prev, CREATION_STEPS[prevIndex].id]);
          return prevIndex + 1;
        } else {
          // Complete the last step
          setCompletedSteps((prev) => [...prev, CREATION_STEPS[prevIndex].id]);
          setIsComplete(true);
          clearInterval(interval);
          return prevIndex;
        }
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isOpen, hasError, isComplete]);

  // Handle real progress updates
  useEffect(() => {
    if (progress) {
      setCurrentStepIndex(
        Math.floor((progress.progress_percent / 100) * CREATION_STEPS.length)
      );
      setCompletedSteps(progress.steps_completed);
      setIsComplete(progress.status === 'completed');
      setHasError(progress.status === 'failed');
    }
  }, [progress]);

  // Handle error state
  useEffect(() => {
    if (error) {
      setHasError(true);
    }
  }, [error]);

  const getStepStatus = (stepId: string, stepIndex: number) => {
    if (hasError && stepIndex === currentStepIndex) {
      return 'error';
    }
    if (completedSteps.includes(stepId)) {
      return 'completed';
    }
    if (stepIndex === currentStepIndex && !isComplete) {
      return 'in-progress';
    }
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <CheckCircleIcon color="var(--pf-v6-global--success-color--100)" />
        );
      case 'in-progress':
        return <InProgressIcon color="var(--pf-v6-global--info-color--100)" />;
      case 'error':
        return (
          <ExclamationCircleIcon color="var(--pf-v6-global--danger-color--100)" />
        );
      default:
        return <ClockIcon color="var(--pf-v6-global--Color--200)" />;
    }
  };

  const getProgressPercentage = () => {
    if (progress) {
      return progress.progress_percent;
    }
    if (hasError) {
      return (currentStepIndex / CREATION_STEPS.length) * 100;
    }
    if (isComplete) {
      return 100;
    }
    return ((currentStepIndex + 0.5) / CREATION_STEPS.length) * 100;
  };

  const getProgressVariant = (): ProgressVariant => {
    if (hasError) return ProgressVariant.danger;
    if (isComplete) return ProgressVariant.success;
    return ProgressVariant.success; // PatternFly 6 doesn't have 'info' variant
  };

  const handleClose = () => {
    // Reset state when closing
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setIsComplete(false);
    setHasError(false);
    onClose();
  };

  const getEstimatedTime = () => {
    if (progress?.estimated_completion) {
      return new Date(progress.estimated_completion).toLocaleTimeString();
    }
    if (isComplete) {
      return 'Completed';
    }
    if (hasError) {
      return 'Failed';
    }
    const remainingSteps = CREATION_STEPS.length - currentStepIndex;
    const estimatedMinutes = remainingSteps * 0.5; // Rough estimate
    return `~${Math.ceil(estimatedMinutes)} minutes remaining`;
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title="Creating Virtual Machine"
      isOpen={isOpen}
      onClose={handleClose}
    >
      <Stack hasGutter>
        {/* VM Info */}
        <StackItem>
          <Card>
            <CardBody>
              <Stack>
                <StackItem>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <VirtualMachineIcon />
                    <div>
                      <Title headingLevel="h3" size="lg">
                        {vmName}
                      </Title>
                      <p className="pf-v6-u-color-200">
                        Creating in VDC: {vdcName}
                      </p>
                    </div>
                  </div>
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </StackItem>

        {/* Overall Progress */}
        <StackItem>
          <Stack hasGutter>
            <StackItem>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Title headingLevel="h4" size="md">
                  {hasError
                    ? 'Creation Failed'
                    : isComplete
                      ? 'Creation Complete'
                      : 'Creation Progress'}
                </Title>
                <span className="pf-v6-u-color-200">{getEstimatedTime()}</span>
              </div>
            </StackItem>
            <StackItem>
              <Progress
                value={getProgressPercentage()}
                title="VM Creation Progress"
                size={ProgressSize.lg}
                variant={getProgressVariant()}
              />
            </StackItem>
          </Stack>
        </StackItem>

        {/* Error Alert */}
        {hasError && (
          <StackItem>
            <Alert
              variant={AlertVariant.danger}
              title="VM Creation Failed"
              isInline
            >
              {error ||
                progress?.error_message ||
                'An error occurred during VM creation. Please try again or contact support.'}
            </Alert>
          </StackItem>
        )}

        {/* Success Alert */}
        {isComplete && !hasError && (
          <StackItem>
            <Alert
              variant={AlertVariant.success}
              title="VM Created Successfully"
              isInline
            >
              Your virtual machine "{vmName}" has been created successfully and
              is ready to use.
            </Alert>
          </StackItem>
        )}

        {/* Step Progress */}
        <StackItem>
          <Card>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <Title headingLevel="h4" size="md">
                    Creation Steps
                  </Title>
                </StackItem>
                <StackItem>
                  <List isPlain>
                    {CREATION_STEPS.map((step, index) => {
                      const status = getStepStatus(step.id, index);
                      const isCurrentStep =
                        index === currentStepIndex && !isComplete;

                      return (
                        <ListItem key={step.id}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              padding: '8px 0',
                              opacity: status === 'pending' ? 0.6 : 1,
                            }}
                          >
                            <div style={{ marginTop: '2px' }}>
                              {getStepIcon(status)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: isCurrentStep ? 'bold' : 'normal',
                                  marginBottom: '4px',
                                }}
                              >
                                {step.name}
                                {isCurrentStep && !hasError && !isComplete && (
                                  <span className="pf-v6-u-ml-sm pf-v6-u-color-100">
                                    (in progress...)
                                  </span>
                                )}
                              </div>
                              <div className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                                {step.description}
                              </div>
                            </div>
                          </div>
                          {index < CREATION_STEPS.length - 1 && (
                            <Divider style={{ margin: '4px 0' }} />
                          )}
                        </ListItem>
                      );
                    })}
                  </List>
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </StackItem>

        {/* Additional Info */}
        {progress && (
          <StackItem>
            <Alert
              variant={AlertVariant.info}
              title="Task Information"
              isInline
              isPlain
            >
              Task ID: {progress.task_id}
              <br />
              Current Step: {progress.current_step}
            </Alert>
          </StackItem>
        )}

        {/* Modal Actions */}
        <StackItem>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '16px 0',
              borderTop: '1px solid var(--pf-v6-global--BorderColor--100)',
            }}
          >
            <Button
              variant={isComplete ? 'primary' : 'secondary'}
              onClick={handleClose}
            >
              {isComplete ? 'Done' : hasError ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </StackItem>
      </Stack>
    </Modal>
  );
}

export default VMCreationProgress;
