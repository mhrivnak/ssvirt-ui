import React, { useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';
import {
  PlayIcon,
  PowerOffIcon,
  PauseIcon,
  RedoIcon,
  EllipsisVIcon,
} from '@patternfly/react-icons';
import {
  usePowerOnVM,
  usePowerOffVM,
  useRebootVM,
  useSuspendVM,
  useResetVM,
  useBulkPowerOnVMs,
  useBulkPowerOffVMs,
  useBulkRebootVMs,
  useBulkSuspendVMs,
  useBulkResetVMs,
} from '../../hooks';
import PowerConfirmationModal from './PowerConfirmationModal';
import type { VM } from '../../types';

interface VMPowerActionsProps {
  vm?: VM;
  vmIds?: string[];
  variant?: 'dropdown' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
}

type PowerAction = 'POWER_ON' | 'POWER_OFF' | 'SUSPEND' | 'RESET' | 'REBOOT';

const VMPowerActions: React.FC<VMPowerActionsProps> = ({
  vm,
  vmIds,
  variant = 'dropdown',
  size = 'md',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<PowerAction | null>(null);

  const isBulkOperation = vmIds && vmIds.length > 0;
  const targetVmIds = isBulkOperation ? vmIds : vm ? [vm.id] : [];

  // Single VM hooks
  const powerOnMutation = usePowerOnVM();
  const powerOffMutation = usePowerOffVM();
  const rebootMutation = useRebootVM();
  const suspendMutation = useSuspendVM();
  const resetMutation = useResetVM();

  // Bulk operation hooks
  const bulkPowerOnMutation = useBulkPowerOnVMs();
  const bulkPowerOffMutation = useBulkPowerOffVMs();
  const bulkRebootMutation = useBulkRebootVMs();
  const bulkSuspendMutation = useBulkSuspendVMs();
  const bulkResetMutation = useBulkResetVMs();

  const handlePowerAction = async (action: PowerAction) => {
    if (targetVmIds.length === 0) return;

    try {
      if (isBulkOperation) {
        switch (action) {
          case 'POWER_ON':
            await bulkPowerOnMutation.mutateAsync(targetVmIds);
            break;
          case 'POWER_OFF':
            await bulkPowerOffMutation.mutateAsync(targetVmIds);
            break;
          case 'REBOOT':
            await bulkRebootMutation.mutateAsync(targetVmIds);
            break;
          case 'SUSPEND':
            await bulkSuspendMutation.mutateAsync(targetVmIds);
            break;
          case 'RESET':
            await bulkResetMutation.mutateAsync(targetVmIds);
            break;
        }
      } else {
        const vmId = targetVmIds[0];
        switch (action) {
          case 'POWER_ON':
            await powerOnMutation.mutateAsync(vmId);
            break;
          case 'POWER_OFF':
            await powerOffMutation.mutateAsync(vmId);
            break;
          case 'REBOOT':
            await rebootMutation.mutateAsync(vmId);
            break;
          case 'SUSPEND':
            await suspendMutation.mutateAsync(vmId);
            break;
          case 'RESET':
            await resetMutation.mutateAsync(vmId);
            break;
        }
      }
      setConfirmationAction(null);
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} VM(s):`, error);
    }
  };

  const getActionIcon = (action: PowerAction) => {
    switch (action) {
      case 'POWER_ON': return <PlayIcon />;
      case 'POWER_OFF': return <PowerOffIcon />;
      case 'REBOOT':
      case 'RESET': return <RedoIcon />;
      case 'SUSPEND': return <PauseIcon />;
      default: return null;
    }
  };

  const getActionLabel = (action: PowerAction) => {
    const labels = {
      POWER_ON: 'Power On',
      POWER_OFF: 'Power Off',
      REBOOT: 'Reboot',
      SUSPEND: 'Suspend',
      RESET: 'Reset',
    };
    return isBulkOperation ? `${labels[action]} All` : labels[action];
  };

  const isActionDisabled = (action: PowerAction) => {
    if (!vm && !isBulkOperation) return true;
    
    // For single VM, check status compatibility
    if (vm && !isBulkOperation) {
      const status = vm.status;
      switch (action) {
        case 'POWER_ON':
          return status === 'POWERED_ON';
        case 'POWER_OFF':
        case 'SUSPEND':
        case 'REBOOT':
        case 'RESET':
          return status !== 'POWERED_ON';
        default:
          return false;
      }
    }
    
    return false;
  };

  const isLoading = () => {
    if (isBulkOperation) {
      return bulkPowerOnMutation.isPending || 
             bulkPowerOffMutation.isPending || 
             bulkRebootMutation.isPending || 
             bulkSuspendMutation.isPending || 
             bulkResetMutation.isPending;
    }
    return powerOnMutation.isPending || 
           powerOffMutation.isPending || 
           rebootMutation.isPending || 
           suspendMutation.isPending || 
           resetMutation.isPending;
  };

  const actions: PowerAction[] = ['POWER_ON', 'POWER_OFF', 'REBOOT', 'SUSPEND', 'RESET'];

  if (variant === 'buttons') {
    return (
      <>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {actions.map((action) => (
            <Button
              key={action}
              variant={action === 'POWER_OFF' || action === 'RESET' ? 'danger' : 'secondary'}
              size={size === 'md' ? 'default' : size}
              icon={getActionIcon(action)}
              isDisabled={isActionDisabled(action) || isLoading()}
              onClick={() => setConfirmationAction(action)}
            >
              {getActionLabel(action)}
            </Button>
          ))}
        </div>
        
        <PowerConfirmationModal
          isOpen={confirmationAction !== null}
          onClose={() => setConfirmationAction(null)}
          onConfirm={() => confirmationAction && handlePowerAction(confirmationAction)}
          action={confirmationAction!}
          vm={vm}
          vmIds={vmIds}
          isLoading={isLoading()}
        />
      </>
    );
  }

  return (
    <>
      <Dropdown
        isOpen={isDropdownOpen}
        onSelect={() => setIsDropdownOpen(false)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle 
            ref={toggleRef} 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            isExpanded={isDropdownOpen}
            isDisabled={isLoading()}
            variant="primary"
          >
            {isBulkOperation ? 'Power Actions' : 'Actions'}
            <EllipsisVIcon />
          </MenuToggle>
        )}
      >
        <DropdownList>
          {actions.map((action) => (
            <DropdownItem
              key={action}
              icon={getActionIcon(action)}
              isDisabled={isActionDisabled(action)}
              onClick={() => setConfirmationAction(action)}
            >
              {getActionLabel(action)}
            </DropdownItem>
          ))}
        </DropdownList>
      </Dropdown>

      <PowerConfirmationModal
        isOpen={confirmationAction !== null}
        onClose={() => setConfirmationAction(null)}
        onConfirm={() => confirmationAction && handlePowerAction(confirmationAction)}
        action={confirmationAction!}
        vm={vm}
        vmIds={vmIds}
        isLoading={isLoading()}
      />
    </>
  );
};

export default VMPowerActions;