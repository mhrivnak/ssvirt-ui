import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertVariant,
  AlertGroup,
  Stack,
  StackItem,
  Button,
  Progress,
  ProgressSize,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  TimesCircleIcon,
  InProgressIcon,
} from '@patternfly/react-icons';
import type { VMPowerOperation } from '../../types';

interface PowerOperationStatusProps {
  operations: VMPowerOperation[];
  onDismiss?: () => void;
  autoHideDelay?: number; // Auto-hide successful operations after this many milliseconds
}

interface OperationStatus {
  id: string;
  vmId: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  progress?: number;
  error?: string;
}

const PowerOperationStatus: React.FC<PowerOperationStatusProps> = ({
  operations,
  onDismiss,
  autoHideDelay = 5000,
}) => {
  const [operationStatuses, setOperationStatuses] = useState<OperationStatus[]>(
    []
  );
  const [dismissedOperations, setDismissedOperations] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const newStatuses: OperationStatus[] = operations.map((op) => {
      // Map task status to our operation status
      let operationStatus: 'pending' | 'running' | 'completed' | 'failed';
      let progress: number | undefined;

      switch (op.task?.status) {
        case 'running':
          operationStatus = 'running';
          progress = 50;
          break;
        case 'failed':
          operationStatus = 'failed';
          progress = 100;
          break;
        case 'pending':
          operationStatus = 'pending';
          progress = 0;
          break;
        case 'completed':
        default:
          operationStatus = 'completed';
          progress = 100;
          break;
      }

      return {
        id: `${op.vm_id}-${op.action}-${op.timestamp}`,
        vmId: op.vm_id,
        action: op.action,
        status: operationStatus,
        message: op.message,
        progress,
      };
    });

    setOperationStatuses(newStatuses);

    // Auto-hide successful operations after delay
    if (autoHideDelay > 0) {
      const timer = setTimeout(() => {
        const successfulOps = newStatuses
          .filter((status) => status.status === 'completed')
          .map((status) => status.id);

        setDismissedOperations((prev) => new Set([...prev, ...successfulOps]));
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [operations, autoHideDelay]);

  const getAlertVariant = (status: OperationStatus['status']): AlertVariant => {
    switch (status) {
      case 'completed':
        return AlertVariant.success;
      case 'failed':
        return AlertVariant.danger;
      case 'running':
        return AlertVariant.info;
      case 'pending':
        return AlertVariant.warning;
      default:
        return AlertVariant.info;
    }
  };

  const getAlertIcon = (status: OperationStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'failed':
        return <TimesCircleIcon />;
      case 'running':
        return <InProgressIcon />;
      case 'pending':
        return <ExclamationCircleIcon />;
      default:
        return <ExclamationCircleIcon />;
    }
  };

  const getActionLabel = (action: string): string => {
    switch (action.toLowerCase()) {
      case 'power_on':
      case 'poweron':
        return 'Power On';
      case 'power_off':
      case 'poweroff':
        return 'Power Off';
      case 'reboot':
        return 'Reboot';
      case 'suspend':
        return 'Suspend';
      case 'reset':
        return 'Reset';
      default:
        return action
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const handleDismissOperation = (operationId: string) => {
    setDismissedOperations((prev) => new Set([...prev, operationId]));
  };

  const handleDismissAll = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      const allOperationIds = operationStatuses.map((status) => status.id);
      setDismissedOperations(new Set(allOperationIds));
    }
  };

  const visibleOperations = operationStatuses.filter(
    (status) => !dismissedOperations.has(status.id)
  );

  if (visibleOperations.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 1000,
        maxWidth: '400px',
      }}
    >
      <AlertGroup>
        {visibleOperations.map((status) => (
          <Alert
            key={status.id}
            variant={getAlertVariant(status.status)}
            title={`${getActionLabel(status.action)} - VM ${status.vmId}`}
            isInline
            customIcon={getAlertIcon(status.status)}
            actionClose={
              <Button
                variant="plain"
                onClick={() => handleDismissOperation(status.id)}
              />
            }
          >
            <Stack hasGutter>
              <StackItem>{status.message}</StackItem>
              {status.status === 'running' && status.progress !== undefined && (
                <StackItem>
                  <Progress
                    value={status.progress}
                    title="Operation progress"
                    size={ProgressSize.sm}
                  />
                </StackItem>
              )}
              {status.error && (
                <StackItem>
                  <div
                    style={{ color: 'var(--pf-v6-global--danger-color--100)' }}
                  >
                    Error: {status.error}
                  </div>
                </StackItem>
              )}
            </Stack>
          </Alert>
        ))}
        {visibleOperations.length > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '8px',
            }}
          >
            <Button variant="link" size="sm" onClick={handleDismissAll}>
              Dismiss All
            </Button>
          </div>
        )}
      </AlertGroup>
    </div>
  );
};

export default PowerOperationStatus;
