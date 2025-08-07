import { useState, useEffect, useCallback } from 'react';
import { VMService } from '../services';
import type { VMPowerOperation } from '../types';

interface PowerOperationTracker {
  vmId: string;
  operationId: string;
  action: string;
  startTime: number;
}

interface TrackedOperation extends VMPowerOperation {
  isTracking: boolean;
  elapsed: number;
}

export const usePowerOperationTracking = () => {
  const [trackedOperations, setTrackedOperations] = useState<PowerOperationTracker[]>([]);
  const [operations, setOperations] = useState<TrackedOperation[]>([]);

  const startTracking = useCallback((vmId: string, operationId: string, action: string) => {
    const tracker: PowerOperationTracker = {
      vmId,
      operationId,
      action,
      startTime: Date.now(),
    };

    setTrackedOperations(prev => [...prev, tracker]);
  }, []);

  const stopTracking = useCallback((vmId: string, operationId?: string) => {
    setTrackedOperations(prev => 
      prev.filter(tracker => 
        tracker.vmId !== vmId || (operationId && tracker.operationId !== operationId)
      )
    );
  }, []);

  const clearAllTracking = useCallback(() => {
    setTrackedOperations([]);
    setOperations([]);
  }, []);

  useEffect(() => {
    if (trackedOperations.length === 0) {
      setOperations([]);
      return;
    }

    const pollOperations = async () => {
      const currentTime = Date.now();
      const updatedOperations: TrackedOperation[] = [];

      for (const tracker of trackedOperations) {
        try {
          const response = await VMService.getVMPowerOperation(tracker.vmId, tracker.operationId);
          const operation = response.data;
          
          updatedOperations.push({
            ...operation,
            isTracking: true,
            elapsed: currentTime - tracker.startTime,
          });

          // Stop tracking if operation is complete
          if (operation.task?.status === 'completed' || operation.task?.status === 'failed') {
            setTimeout(() => {
              stopTracking(tracker.vmId, tracker.operationId);
            }, 2000); // Give 2 seconds for user to see completion status
          }
        } catch (error) {
          console.error(`Failed to poll operation ${tracker.operationId}:`, error);
          
          // Create a failed operation status
          updatedOperations.push({
            vm_id: tracker.vmId,
            action: tracker.action,
            status: 'UNRESOLVED' as const,
            message: 'Failed to track operation status',
            timestamp: new Date().toISOString(),
            task: {
              id: tracker.operationId,
              status: 'failed',
              type: 'power_operation',
            },
            isTracking: false,
            elapsed: currentTime - tracker.startTime,
          });

          // Stop tracking failed operations
          setTimeout(() => {
            stopTracking(tracker.vmId, tracker.operationId);
          }, 2000);
        }
      }

      setOperations(updatedOperations);
    };

    // Poll immediately and then every 2 seconds
    pollOperations();
    const interval = setInterval(pollOperations, 2000);

    return () => clearInterval(interval);
  }, [trackedOperations, stopTracking]);

  // Auto-remove completed operations after 5 seconds
  useEffect(() => {
    const completedOps = operations.filter(op => 
      op.task?.status === 'completed' || op.task?.status === 'failed'
    );

    if (completedOps.length > 0) {
      const timer = setTimeout(() => {
        completedOps.forEach(op => {
          stopTracking(op.vm_id, op.task?.id);
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [operations, stopTracking]);

  return {
    operations,
    startTracking,
    stopTracking,
    clearAllTracking,
    isTracking: trackedOperations.length > 0,
  };
};