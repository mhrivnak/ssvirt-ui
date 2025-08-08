import React, { useState, useEffect } from 'react';
import {
  Stack,
  StackItem,
  Button,
  Alert,
  AlertVariant,
  Card,
  CardBody,
  Title,
  Divider,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  NumberInput,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Progress,
  ProgressSize,
  ProgressVariant,
  Badge,
  Split,
  SplitItem,
  Grid,
  GridItem,
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
import { PlusIcon, ServerIcon } from '@patternfly/react-icons';
import type { VM } from '../../types';
import type { MenuToggleElement } from '@patternfly/react-core';

interface VMDisk {
  id: string;
  name: string;
  size_gb: number;
  type: 'System' | 'Data';
  provisioning: 'Thin' | 'Thick';
  used_gb: number;
  usage_percent: number;
  bus_type: 'SCSI' | 'IDE' | 'SATA';
  removable: boolean;
}

interface VMDiskManagerProps {
  vm: VM;
  onSave: (updatedVM: VM) => void;
  onCancel: () => void;
  onChangesDetected: (hasChanges: boolean) => void;
}

// Mock disk data - in real implementation this would come from API
const mockDisks: VMDisk[] = [
  {
    id: 'disk-1',
    name: 'Hard disk 1',
    size_gb: 40,
    type: 'System',
    provisioning: 'Thin',
    used_gb: 15.2,
    usage_percent: 38,
    bus_type: 'SCSI',
    removable: false,
  },
  {
    id: 'disk-2',
    name: 'Hard disk 2',
    size_gb: 20,
    type: 'Data',
    provisioning: 'Thick',
    used_gb: 8.7,
    usage_percent: 44,
    bus_type: 'SCSI',
    removable: true,
  },
];

export const VMDiskManager: React.FC<VMDiskManagerProps> = ({
  vm,
  onSave,
  onCancel,
  onChangesDetected,
}) => {
  const [disks, setDisks] = useState<VMDisk[]>(mockDisks);
  const [showAddDiskModal, setShowAddDiskModal] = useState(false);
  const [editingDisk, setEditingDisk] = useState<VMDisk | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [diskToRemove, setDiskToRemove] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // New disk form state
  const [newDiskName, setNewDiskName] = useState('');
  const [newDiskSize, setNewDiskSize] = useState(10);
  const [newDiskProvisioning, setNewDiskProvisioning] = useState<
    'Thin' | 'Thick'
  >('Thin');
  const [newDiskBusType, setNewDiskBusType] = useState<'SCSI' | 'IDE' | 'SATA'>(
    'SCSI'
  );
  const [isProvisioningSelectOpen, setIsProvisioningSelectOpen] =
    useState(false);
  const [isBusTypeSelectOpen, setIsBusTypeSelectOpen] = useState(false);

  useEffect(() => {
    // Check if there are changes compared to original state
    const changesDetected = JSON.stringify(disks) !== JSON.stringify(mockDisks);
    setHasChanges(changesDetected);
    onChangesDetected(changesDetected);
  }, [disks, onChangesDetected]);

  const validateDiskConfiguration = (): string[] => {
    const errors: string[] = [];

    if (newDiskName.trim().length === 0) {
      errors.push('Disk name is required');
    }

    if (newDiskSize < 1 || newDiskSize > 1000) {
      errors.push('Disk size must be between 1 GB and 1000 GB');
    }

    // Check for duplicate names
    if (
      disks.some(
        (disk) =>
          disk.name === newDiskName.trim() && disk.id !== editingDisk?.id
      )
    ) {
      errors.push('A disk with this name already exists');
    }

    return errors;
  };

  const handleAddDisk = () => {
    const errors = validateDiskConfiguration();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const newDisk: VMDisk = {
      id: `disk-${Date.now()}`,
      name: newDiskName.trim(),
      size_gb: newDiskSize,
      type: 'Data',
      provisioning: newDiskProvisioning,
      used_gb: 0,
      usage_percent: 0,
      bus_type: newDiskBusType,
      removable: true,
    };

    setDisks([...disks, newDisk]);
    resetDiskForm();
    setShowAddDiskModal(false);
  };

  const handleEditDisk = (disk: VMDisk) => {
    setEditingDisk(disk);
    setNewDiskName(disk.name);
    setNewDiskSize(disk.size_gb);
    setNewDiskProvisioning(disk.provisioning);
    setNewDiskBusType(disk.bus_type);
    setShowAddDiskModal(true);
  };

  const handleUpdateDisk = () => {
    if (!editingDisk) return;

    const errors = validateDiskConfiguration();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const updatedDisks = disks.map((disk) =>
      disk.id === editingDisk.id
        ? {
            ...disk,
            name: newDiskName.trim(),
            size_gb: newDiskSize,
            provisioning: newDiskProvisioning,
            bus_type: newDiskBusType,
          }
        : disk
    );

    setDisks(updatedDisks);
    resetDiskForm();
    setShowAddDiskModal(false);
    setEditingDisk(null);
  };

  const handleRemoveDisk = (diskId: string) => {
    setDiskToRemove(diskId);
  };

  const confirmRemoveDisk = () => {
    if (diskToRemove) {
      setDisks(disks.filter((disk) => disk.id !== diskToRemove));
      setDiskToRemove(null);
    }
  };

  const cancelRemoveDisk = () => {
    setDiskToRemove(null);
  };

  const resetDiskForm = () => {
    setNewDiskName('');
    setNewDiskSize(10);
    setNewDiskProvisioning('Thin');
    setNewDiskBusType('SCSI');
    setValidationErrors([]);
    setEditingDisk(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real implementation, we would update the VM with new disk configuration
      const updatedVM: VM = {
        ...vm,
        updated_at: new Date().toISOString(),
      };

      onSave(updatedVM);
    } catch (error) {
      console.error('Failed to update disk configuration:', error);
      setValidationErrors([
        'Failed to update disk configuration. Please try again.',
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getUsageVariant = (usage: number): ProgressVariant => {
    if (usage > 80) return ProgressVariant.danger;
    if (usage > 60) return ProgressVariant.warning;
    return ProgressVariant.success;
  };

  const getDiskActions = (disk: VMDisk) => [
    {
      title: 'Edit',
      onClick: () => handleEditDisk(disk),
      isDisabled: vm.status === 'POWERED_ON' && disk.type === 'System',
    },
    {
      title: 'Remove',
      onClick: () => handleRemoveDisk(disk.id),
      isDanger: true,
      isDisabled: !disk.removable || vm.status === 'POWERED_ON',
    },
  ];

  return (
    <Stack hasGutter>
      {validationErrors.length > 0 && (
        <StackItem>
          <Alert
            variant={AlertVariant.danger}
            title="Validation Errors"
            isInline
          >
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        </StackItem>
      )}

      <StackItem>
        <Alert variant={AlertVariant.info} title="Disk Management" isInline>
          System disks cannot be removed. Data disks can be added or removed
          when the VM is powered off. Disk size changes require VM restart.
        </Alert>
      </StackItem>

      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Split hasGutter>
                  <SplitItem isFilled>
                    <Title headingLevel="h3" size="lg">
                      <ServerIcon className="pf-v6-u-mr-sm" />
                      Attached Disks
                    </Title>
                  </SplitItem>
                  <SplitItem>
                    <Button
                      variant="primary"
                      icon={<PlusIcon />}
                      onClick={() => setShowAddDiskModal(true)}
                      isDisabled={vm.status === 'POWERED_ON'}
                    >
                      Add Disk
                    </Button>
                  </SplitItem>
                </Split>
              </StackItem>
              <StackItem>
                <Divider />
              </StackItem>
              <StackItem>
                <Table variant="compact">
                  <Thead>
                    <Tr>
                      <Th>Disk Name</Th>
                      <Th>Type</Th>
                      <Th>Size</Th>
                      <Th>Usage</Th>
                      <Th>Provisioning</Th>
                      <Th>Bus Type</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {disks.map((disk) => (
                      <Tr key={disk.id}>
                        <Td>
                          <div>
                            <strong>{disk.name}</strong>
                            {!disk.removable && (
                              <Badge className="pf-v6-u-ml-sm" color="blue">
                                System
                              </Badge>
                            )}
                          </div>
                        </Td>
                        <Td>{disk.type}</Td>
                        <Td>{disk.size_gb} GB</Td>
                        <Td>
                          <Stack>
                            <StackItem>
                              <Progress
                                value={disk.usage_percent}
                                title={`${disk.name} usage`}
                                size={ProgressSize.sm}
                                variant={getUsageVariant(disk.usage_percent)}
                              />
                            </StackItem>
                            <StackItem>
                              <span className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                                {disk.used_gb} GB of {disk.size_gb} GB
                              </span>
                            </StackItem>
                          </Stack>
                        </Td>
                        <Td>{disk.provisioning}</Td>
                        <Td>{disk.bus_type}</Td>
                        <Td>
                          <ActionsColumn items={getDiskActions(disk)} />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Action Buttons */}
      <StackItem>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--pf-v6-global--BorderColor--100)',
          }}
        >
          <Button variant="link" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isDisabled={!hasChanges}
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </StackItem>

      {/* Add/Edit Disk Modal */}
      <Modal
        variant={ModalVariant.medium}
        title={editingDisk ? 'Edit Disk' : 'Add New Disk'}
        isOpen={showAddDiskModal}
        onClose={() => {
          resetDiskForm();
          setShowAddDiskModal(false);
        }}
      >
        <Form>
          <Grid hasGutter>
            <GridItem span={12}>
              <FormGroup label="Disk Name" isRequired fieldId="disk-name">
                <TextInput
                  value={newDiskName}
                  type="text"
                  id="disk-name"
                  name="disk-name"
                  onChange={(_event, value) => setNewDiskName(value)}
                  placeholder="e.g., Data Disk 1"
                />
              </FormGroup>
            </GridItem>

            <GridItem span={6}>
              <FormGroup label="Size (GB)" isRequired fieldId="disk-size">
                <NumberInput
                  value={newDiskSize}
                  onMinus={() => setNewDiskSize(Math.max(1, newDiskSize - 1))}
                  onPlus={() => setNewDiskSize(Math.min(1000, newDiskSize + 1))}
                  onChange={(event) => {
                    const target = event.target as HTMLInputElement;
                    const value = parseInt(target.value) || 1;
                    setNewDiskSize(Math.max(1, Math.min(1000, value)));
                  }}
                  inputName="disk-size"
                  inputAriaLabel="Disk size"
                  min={1}
                  max={1000}
                  unit="GB"
                />
              </FormGroup>
            </GridItem>

            <GridItem span={6}>
              <FormGroup label="Provisioning Type" fieldId="disk-provisioning">
                <Select
                  isOpen={isProvisioningSelectOpen}
                  selected={newDiskProvisioning}
                  onSelect={(_, selection) => {
                    setNewDiskProvisioning(selection as 'Thin' | 'Thick');
                    setIsProvisioningSelectOpen(false);
                  }}
                  onOpenChange={setIsProvisioningSelectOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() =>
                        setIsProvisioningSelectOpen(!isProvisioningSelectOpen)
                      }
                      isExpanded={isProvisioningSelectOpen}
                    >
                      {newDiskProvisioning}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    <SelectOption value="Thin">Thin Provisioned</SelectOption>
                    <SelectOption value="Thick">Thick Provisioned</SelectOption>
                  </SelectList>
                </Select>
              </FormGroup>
            </GridItem>

            <GridItem span={6}>
              <FormGroup label="Bus Type" fieldId="disk-bus-type">
                <Select
                  isOpen={isBusTypeSelectOpen}
                  selected={newDiskBusType}
                  onSelect={(_, selection) => {
                    setNewDiskBusType(selection as 'SCSI' | 'IDE' | 'SATA');
                    setIsBusTypeSelectOpen(false);
                  }}
                  onOpenChange={setIsBusTypeSelectOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() =>
                        setIsBusTypeSelectOpen(!isBusTypeSelectOpen)
                      }
                      isExpanded={isBusTypeSelectOpen}
                    >
                      {newDiskBusType}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    <SelectOption value="SCSI">SCSI</SelectOption>
                    <SelectOption value="IDE">IDE</SelectOption>
                    <SelectOption value="SATA">SATA</SelectOption>
                  </SelectList>
                </Select>
              </FormGroup>
            </GridItem>
          </Grid>
        </Form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--pf-v6-global--BorderColor--100)',
          }}
        >
          <Button
            variant="link"
            onClick={() => {
              resetDiskForm();
              setShowAddDiskModal(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={editingDisk ? handleUpdateDisk : handleAddDisk}
            isDisabled={validationErrors.length > 0}
          >
            {editingDisk ? 'Update Disk' : 'Add Disk'}
          </Button>
        </div>
      </Modal>

      {/* Remove Disk Confirmation Modal */}
      <Modal
        variant={ModalVariant.small}
        title="Remove Disk"
        isOpen={diskToRemove !== null}
        onClose={cancelRemoveDisk}
      >
        <p>
          Are you sure you want to remove this disk? This action cannot be
          undone.
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--pf-v6-global--BorderColor--100)',
          }}
        >
          <Button variant="link" onClick={cancelRemoveDisk}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmRemoveDisk}>
            Remove
          </Button>
        </div>
      </Modal>
    </Stack>
  );
};

export default VMDiskManager;
