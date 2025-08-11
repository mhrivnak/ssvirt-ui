import React, { useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Alert,
  AlertVariant,
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
} from '../../hooks';
import PowerConfirmationModal from './PowerConfirmationModal';
import type { VM } from '../../types';

interface VMPowerActionsProps {
  vm: VM; // Made required since we removed bulk operations
  variant?: 'dropdown' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
}

type PowerAction = 'POWER_ON' | 'POWER_OFF' | 'SUSPEND' | 'RESET' | 'REBOOT';

const VMPowerActions: React.FC<VMPowerActionsProps> = ({
  vm,
  variant = 'dropdown',
  size = 'md',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] =
    useState<PowerAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Single VM hooks
  const powerOnMutation = usePowerOnVM();
  const powerOffMutation = usePowerOffVM();
  const rebootMutation = useRebootVM();
  const suspendMutation = useSuspendVM();
  const resetMutation = useResetVM();

  const handlePowerAction = async (action: PowerAction) => {
    if (!vm?.id) return;

    try {
      switch (action) {
        case 'POWER_ON':
          await powerOnMutation.mutateAsync(vm.id);
          break;
        case 'POWER_OFF':
          await powerOffMutation.mutateAsync(vm.id);
          break;
        case 'REBOOT':
          await rebootMutation.mutateAsync(vm.id);
          break;
        case 'SUSPEND':
          await suspendMutation.mutateAsync(vm.id);
          break;
        case 'RESET':
          await resetMutation.mutateAsync(vm.id);
          break;
      }
      setConfirmationAction(null);
      setError(null); // Clear any previous errors on success
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} VM:`, error);
      const actionLabel = getActionLabel(action).toLowerCase();
      setError(
        `Failed to ${actionLabel} VM ${vm.name || 'Unknown'}. Please try again.`
      );
    }
  };

  const getActionIcon = (action: PowerAction) => {
    switch (action) {
      case 'POWER_ON':
        return <PlayIcon />;
      case 'POWER_OFF':
        return <PowerOffIcon />;
      case 'REBOOT':
      case 'RESET':
        return <RedoIcon />;
      case 'SUSPEND':
        return <PauseIcon />;
      default:
        return null;
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
    return labels[action];
  };

  const isActionDisabled = (action: PowerAction) => {
    if (!vm) return true;

    // Check status compatibility
    if (vm) {
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
    return (
      powerOnMutation.isPending ||
      powerOffMutation.isPending ||
      rebootMutation.isPending ||
      suspendMutation.isPending ||
      resetMutation.isPending
    );
  };

  const actions: PowerAction[] = [
    'POWER_ON',
    'POWER_OFF',
    'REBOOT',
    'SUSPEND',
    'RESET',
  ];

  if (variant === 'buttons') {
    return (
      <>
        {error && (
          <Alert
            variant={AlertVariant.danger}
            title="Power Operation Failed"
            isInline
            actionClose={
              <Button variant="plain" onClick={() => setError(null)} />
            }
            style={{ marginBottom: '8px' }}
          >
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {actions.map((action) => (
            <Button
              key={action}
              variant={
                action === 'POWER_OFF' || action === 'RESET'
                  ? 'danger'
                  : 'secondary'
              }
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
          onConfirm={() =>
            confirmationAction && handlePowerAction(confirmationAction)
          }
          action={confirmationAction!}
          vm={vm}
          isLoading={isLoading()}
        />
      </>
    );
  }

  return (
    <>
      {error && (
        <Alert
          variant={AlertVariant.danger}
          title="Power Operation Failed"
          isInline
          actionClose={
            <Button variant="plain" onClick={() => setError(null)} />
          }
          style={{ marginBottom: '8px' }}
        >
          {error}
        </Alert>
      )}

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
            Actions
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
        onConfirm={() =>
          confirmationAction && handlePowerAction(confirmationAction)
        }
        action={confirmationAction!}
        vm={vm}
        isLoading={isLoading()}
      />
    </>
  );
};

export default VMPowerActions;
