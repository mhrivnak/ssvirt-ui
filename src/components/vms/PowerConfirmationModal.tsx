import React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Stack,
  StackItem,
  Content,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';
import {
  PlayIcon,
  PowerOffIcon,
  PauseIcon,
  RedoIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import type { VM } from '../../types';

interface PowerConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: 'POWER_ON' | 'POWER_OFF' | 'SUSPEND' | 'RESET' | 'REBOOT';
  vm: VM; // Made required since we removed bulk operations
  isLoading?: boolean;
}

const PowerConfirmationModal: React.FC<PowerConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  vm,
  isLoading = false,
}) => {
  const getActionConfig = () => {
    switch (action) {
      case 'POWER_ON':
        return {
          title: 'Power On VM',
          icon: <PlayIcon />,
          variant: 'primary' as const,
          description: 'This will start the virtual machine.',
          isDestructive: false,
        };
      case 'POWER_OFF':
        return {
          title: 'Power Off VM',
          icon: <PowerOffIcon />,
          variant: 'danger' as const,
          description:
            'This will forcefully shut down the virtual machine. Any unsaved data may be lost.',
          isDestructive: true,
        };
      case 'SUSPEND':
        return {
          title: 'Suspend VM',
          icon: <PauseIcon />,
          variant: 'primary' as const,
          description:
            'This will suspend the virtual machine, saving its current state.',
          isDestructive: false,
        };
      case 'RESET':
        return {
          title: 'Reset VM',
          icon: <RedoIcon />,
          variant: 'danger' as const,
          description:
            'This will forcefully restart the virtual machine. Any unsaved data may be lost.',
          isDestructive: true,
        };
      case 'REBOOT':
        return {
          title: 'Reboot VM',
          icon: <RedoIcon />,
          variant: 'warning' as const,
          description: 'This will gracefully restart the virtual machine.',
          isDestructive: false,
        };
    }
  };

  const config = getActionConfig();
  const targetDescription = vm.name || 'this virtual machine';
  const title = config.title;

  return (
    <Modal
      variant={ModalVariant.small}
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      aria-label={`${config.title} confirmation`}
    >
      <Stack hasGutter>
        <StackItem>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {config.icon}
            <Content>
              <strong>
                Are you sure you want to{' '}
                {action.toLowerCase().replace('_', ' ')} {targetDescription}?
              </strong>
            </Content>
          </div>
        </StackItem>

        <StackItem>
          <Content>{config.description}</Content>
        </StackItem>

        {config.isDestructive && (
          <StackItem>
            <Alert
              variant={AlertVariant.warning}
              title="Warning"
              isInline
              customIcon={<ExclamationTriangleIcon />}
            >
              This operation cannot be undone. Make sure you have saved any
              important work.
            </Alert>
          </StackItem>
        )}

        <StackItem>
          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
          >
            <Button variant="link" onClick={onClose} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant={config.variant}
              onClick={onConfirm}
              isLoading={isLoading}
              icon={config.icon}
            >
              {config.title}
            </Button>
          </div>
        </StackItem>
      </Stack>
    </Modal>
  );
};

export default PowerConfirmationModal;
