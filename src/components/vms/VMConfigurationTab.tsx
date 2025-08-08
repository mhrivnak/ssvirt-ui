import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Title,
  Button,
  Divider,
  Modal,
  ModalVariant,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';
import {
  CpuIcon,
  ServerIcon,
  NetworkIcon,
  EditIcon,
  CogIcon,
} from '@patternfly/react-icons';
import type { VM } from '../../types';
import { VMResourceEditor } from './VMResourceEditor';
import { VMDiskManager } from './VMDiskManager';
import { VMNetworkManager } from './VMNetworkManager';
import { VMMetadataEditor } from './VMMetadataEditor';

interface VMConfigurationTabProps {
  vm: VM;
  onConfigurationChange?: (vm: VM) => void;
}

export const VMConfigurationTab: React.FC<VMConfigurationTabProps> = ({
  vm,
  onConfigurationChange,
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const formatMemory = (memoryMb: number) => {
    if (memoryMb >= 1024) {
      return `${(memoryMb / 1024).toFixed(1)} GB`;
    }
    return `${memoryMb} MB`;
  };

  const handleModalClose = () => {
    if (hasUnsavedChanges) {
      // Show confirmation dialog
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmed) return;
    }
    setActiveModal(null);
    setHasUnsavedChanges(false);
  };

  const handleConfigurationSave = (updatedVM: VM) => {
    onConfigurationChange?.(updatedVM);
    setActiveModal(null);
    setHasUnsavedChanges(false);
  };

  return (
    <Stack hasGutter>
      {/* Configuration Alert */}
      <StackItem>
        <Alert
          variant={AlertVariant.info}
          title="VM Configuration Management"
          isInline
        >
          Changes to VM configuration require the VM to be powered off. Some
          changes may require a restart to take effect.
        </Alert>
      </StackItem>

      <StackItem>
        <Grid hasGutter>
          {/* Resource Configuration */}
          <GridItem span={6}>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      <CpuIcon className="pf-v6-u-mr-sm" />
                      Resource Configuration
                    </Title>
                  </StackItem>
                  <StackItem>
                    <Divider />
                  </StackItem>
                  <StackItem>
                    <Grid hasGutter>
                      <GridItem span={6}>
                        <div>
                          <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-sm">
                            CPU Cores
                          </div>
                          <div className="pf-v6-u-font-size-xl">
                            {vm.cpu_count}
                          </div>
                        </div>
                      </GridItem>
                      <GridItem span={6}>
                        <div>
                          <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-sm">
                            Memory
                          </div>
                          <div className="pf-v6-u-font-size-xl">
                            {formatMemory(vm.memory_mb)}
                          </div>
                        </div>
                      </GridItem>
                    </Grid>
                  </StackItem>
                  <StackItem>
                    <Button
                      variant="secondary"
                      icon={<EditIcon />}
                      onClick={() => setActiveModal('resources')}
                      isDisabled={vm.status === 'POWERED_ON'}
                    >
                      Edit Resources
                    </Button>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Storage Configuration */}
          <GridItem span={6}>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      <ServerIcon className="pf-v6-u-mr-sm" />
                      Storage Configuration
                    </Title>
                  </StackItem>
                  <StackItem>
                    <Divider />
                  </StackItem>
                  <StackItem>
                    <div>
                      <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-sm">
                        Attached Disks
                      </div>
                      <div className="pf-v6-u-color-200">
                        Primary disk and additional storage volumes
                      </div>
                    </div>
                  </StackItem>
                  <StackItem>
                    <Button
                      variant="secondary"
                      icon={<EditIcon />}
                      onClick={() => setActiveModal('storage')}
                      isDisabled={vm.status === 'POWERED_ON'}
                    >
                      Manage Storage
                    </Button>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Network Configuration */}
          <GridItem span={6}>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      <NetworkIcon className="pf-v6-u-mr-sm" />
                      Network Configuration
                    </Title>
                  </StackItem>
                  <StackItem>
                    <Divider />
                  </StackItem>
                  <StackItem>
                    <div>
                      <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-sm">
                        Network Interfaces
                      </div>
                      <div className="pf-v6-u-color-200">
                        Network adapters and connectivity settings
                      </div>
                    </div>
                  </StackItem>
                  <StackItem>
                    <Button
                      variant="secondary"
                      icon={<EditIcon />}
                      onClick={() => setActiveModal('network')}
                      isDisabled={vm.status === 'POWERED_ON'}
                    >
                      Manage Networks
                    </Button>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Metadata Configuration */}
          <GridItem span={6}>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      <CogIcon className="pf-v6-u-mr-sm" />
                      Metadata & Annotations
                    </Title>
                  </StackItem>
                  <StackItem>
                    <Divider />
                  </StackItem>
                  <StackItem>
                    <div>
                      <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-sm">
                        Custom Properties
                      </div>
                      <div className="pf-v6-u-color-200">
                        VM metadata, labels, and custom annotations
                      </div>
                    </div>
                  </StackItem>
                  <StackItem>
                    <Button
                      variant="secondary"
                      icon={<EditIcon />}
                      onClick={() => setActiveModal('metadata')}
                    >
                      Edit Metadata
                    </Button>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>

      {/* Resource Editor Modal */}
      <Modal
        variant={ModalVariant.medium}
        title="Edit VM Resources"
        isOpen={activeModal === 'resources'}
        onClose={handleModalClose}
      >
        <VMResourceEditor
          vm={vm}
          onSave={handleConfigurationSave}
          onCancel={handleModalClose}
          onChangesDetected={setHasUnsavedChanges}
        />
      </Modal>

      {/* Storage Manager Modal */}
      <Modal
        variant={ModalVariant.large}
        title="Manage VM Storage"
        isOpen={activeModal === 'storage'}
        onClose={handleModalClose}
      >
        <VMDiskManager
          vm={vm}
          onSave={handleConfigurationSave}
          onCancel={handleModalClose}
          onChangesDetected={setHasUnsavedChanges}
        />
      </Modal>

      {/* Network Manager Modal */}
      <Modal
        variant={ModalVariant.large}
        title="Manage VM Networks"
        isOpen={activeModal === 'network'}
        onClose={handleModalClose}
      >
        <VMNetworkManager
          vm={vm}
          onSave={handleConfigurationSave}
          onCancel={handleModalClose}
          onChangesDetected={setHasUnsavedChanges}
        />
      </Modal>

      {/* Metadata Editor Modal */}
      <Modal
        variant={ModalVariant.medium}
        title="Edit VM Metadata"
        isOpen={activeModal === 'metadata'}
        onClose={handleModalClose}
      >
        <VMMetadataEditor
          vm={vm}
          onSave={handleConfigurationSave}
          onCancel={handleModalClose}
          onChangesDetected={setHasUnsavedChanges}
        />
      </Modal>
    </Stack>
  );
};

export default VMConfigurationTab;