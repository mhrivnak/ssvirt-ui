import React, { useState } from 'react';
import {
  Stack,
  StackItem,
  Title,
  Card,
  CardBody,
  Grid,
  GridItem,
  Slider,
  TextInput,
  FormGroup,
  HelperText,
  HelperTextItem,
  Alert,
  AlertVariant,
  Button,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Divider,
  Badge,
  Switch,
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
  ServerIcon,
  InfoCircleIcon,
  PlusIcon,
} from '@patternfly/react-icons';
import type { MenuToggleElement } from '@patternfly/react-core';
import type { WizardFormData } from '../VMCreationWizard';
import type { AdditionalDisk } from '../../../types';

interface StorageConfigurationStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

// Storage profiles that might be available
const STORAGE_PROFILES = [
  { id: 'standard', name: 'Standard Storage', description: 'General purpose storage' },
  { id: 'fast', name: 'Fast Storage', description: 'High-performance SSD storage' },
  { id: 'archive', name: 'Archive Storage', description: 'Low-cost archival storage' },
];

// Bus types for additional disks
const BUS_TYPES = [
  { value: 'SCSI', label: 'SCSI (Recommended)' },
  { value: 'IDE', label: 'IDE' },
  { value: 'SATA', label: 'SATA' },
];

const StorageConfigurationStep: React.FC<StorageConfigurationStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [diskSizeError, setDiskSizeError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isProfileSelectOpen, setIsProfileSelectOpen] = useState(false);
  
  // Additional disk form state
  const [newDiskSize, setNewDiskSize] = useState(20);
  const [newDiskProfile, setNewDiskProfile] = useState('standard');
  const [newDiskBusType, setNewDiskBusType] = useState<'IDE' | 'SCSI' | 'SATA'>('SCSI');
  const [isBusTypeSelectOpen, setIsBusTypeSelectOpen] = useState(false);
  const [isNewDiskProfileSelectOpen, setIsNewDiskProfileSelectOpen] = useState(false);

  const validateDiskSize = (size: number) => {
    if (size < 10) {
      setDiskSizeError('Primary disk size must be at least 10 GB');
      return false;
    }
    if (size > 1000) {
      setDiskSizeError('Primary disk size cannot exceed 1000 GB');
      return false;
    }
    setDiskSizeError('');
    return true;
  };

  const handleDiskSizeChange = (value: number) => {
    const updatedStorageConfig = {
      ...formData.storage_config,
      disk_size_gb: value,
    };
    updateFormData({ storage_config: updatedStorageConfig });
    validateDiskSize(value);
  };

  const handleDiskSizeInputChange = (value: string) => {
    const diskSize = parseInt(value) || 10;
    handleDiskSizeChange(diskSize);
  };

  const handleStorageProfileChange = (profileId: string) => {
    const updatedStorageConfig = {
      ...formData.storage_config,
      storage_profile: profileId,
    };
    updateFormData({ storage_config: updatedStorageConfig });
    setIsProfileSelectOpen(false);
  };

  const handleAddDisk = () => {
    const newDisk: AdditionalDisk = {
      id: `disk-${Date.now()}`,
      size_gb: newDiskSize,
      storage_profile: newDiskProfile,
      bus_type: newDiskBusType,
    };

    const currentDisks = formData.storage_config.additional_disks || [];
    const updatedStorageConfig = {
      ...formData.storage_config,
      additional_disks: [...currentDisks, newDisk],
    };

    updateFormData({ storage_config: updatedStorageConfig });
    
    // Reset form
    setNewDiskSize(20);
    setNewDiskProfile('standard');
    setNewDiskBusType('SCSI');
  };

  const handleRemoveDisk = (diskId: string) => {
    const currentDisks = formData.storage_config.additional_disks || [];
    const updatedDisks = currentDisks.filter(disk => disk.id !== diskId);
    
    const updatedStorageConfig = {
      ...formData.storage_config,
      additional_disks: updatedDisks,
    };

    updateFormData({ storage_config: updatedStorageConfig });
  };

  const getTotalStorage = () => {
    const primarySize = formData.storage_config.disk_size_gb || 0;
    const additionalSize = (formData.storage_config.additional_disks || [])
      .reduce((total, disk) => total + disk.size_gb, 0);
    return primarySize + additionalSize;
  };

  const getStorageWarning = () => {
    const totalStorage = getTotalStorage();
    
    if (totalStorage > 500) {
      return {
        variant: 'warning' as const,
        title: 'Large Storage Configuration',
        message: `Total storage (${totalStorage} GB) is quite large. Ensure your VDC has sufficient storage quota.`,
      };
    }
    
    if (totalStorage < 20) {
      return {
        variant: 'info' as const,
        title: 'Minimal Storage',
        message: 'This is a minimal storage configuration. Consider if this will be sufficient for your workload.',
      };
    }
    
    return null;
  };

  const selectedProfile = STORAGE_PROFILES.find(p => p.id === formData.storage_config.storage_profile);
  const additionalDisks = formData.storage_config.additional_disks || [];
  const storageWarning = getStorageWarning();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="xl">
          <ServerIcon className="pf-v6-u-mr-sm" />
          Storage Configuration
        </Title>
        <p className="pf-v6-u-color-200">
          Configure storage settings for your virtual machine including disk size and additional storage.
        </p>
      </StackItem>

      {/* Primary Disk Configuration */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  Primary Disk
                </Title>
                <p className="pf-v6-u-color-200">
                  Configure the main system disk where the operating system will be installed
                </p>
              </StackItem>

              <StackItem>
                <Grid hasGutter>
                  <GridItem span={8}>
                    <FormGroup
                      label={`Disk Size (${formData.storage_config.disk_size_gb} GB)`}
                      fieldId="disk-size-slider"
                    >
                      <Slider
                        value={formData.storage_config.disk_size_gb || 50}
                        onChange={(_, value) => handleDiskSizeChange(value)}
                        min={10}
                        max={500}
                        step={10}
                        showTicks
                        showBoundaries
                      />
                      {!diskSizeError && (
                        <HelperText>
                          <HelperTextItem icon={<InfoCircleIcon />}>
                            Recommended: 40GB+ for most operating systems
                          </HelperTextItem>
                        </HelperText>
                      )}
                      {diskSizeError && (
                        <HelperText>
                          <HelperTextItem variant="error">{diskSizeError}</HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </GridItem>

                  <GridItem span={4}>
                    <FormGroup label="Or enter exact size (GB)" fieldId="disk-size-input">
                      <TextInput
                        id="disk-size-input"
                        type="number"
                        value={formData.storage_config.disk_size_gb || 50}
                        onChange={(_, value) => handleDiskSizeInputChange(value)}
                        min={10}
                        max={1000}
                        step={1}
                        validated={diskSizeError ? 'error' : 'default'}
                      />
                    </FormGroup>
                  </GridItem>
                </Grid>
              </StackItem>

              <StackItem>
                <FormGroup
                  label="Storage Profile"
                  fieldId="storage-profile"
                >
                  <Select
                    id="storage-profile"
                    isOpen={isProfileSelectOpen}
                    selected={formData.storage_config.storage_profile || 'standard'}
                    onSelect={(_, selection) => handleStorageProfileChange(selection as string)}
                    onOpenChange={setIsProfileSelectOpen}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsProfileSelectOpen(!isProfileSelectOpen)}
                        isExpanded={isProfileSelectOpen}
                        style={{ width: '300px' }}
                      >
                        {selectedProfile ? selectedProfile.name : 'Select storage profile...'}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {STORAGE_PROFILES.map((profile) => (
                        <SelectOption key={profile.id} value={profile.id} description={profile.description}>
                          {profile.name}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                  <HelperText>
                    <HelperTextItem icon={<InfoCircleIcon />}>
                      Storage profile determines performance and cost characteristics
                    </HelperTextItem>
                  </HelperText>
                </FormGroup>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Additional Disks */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title headingLevel="h3" size="lg">
                      Additional Disks
                    </Title>
                    <p className="pf-v6-u-color-200">
                      Add extra disks for data storage, databases, or application files
                    </p>
                  </div>
                  <Switch
                    id="show-additional-disks"
                    label="Add additional disks"
                    isChecked={showAdvanced}
                    onChange={(_, checked) => setShowAdvanced(checked)}
                  />
                </div>
              </StackItem>

              {showAdvanced && (
                <>
                  <StackItem>
                    <Divider />
                  </StackItem>

                  {/* Add New Disk Form */}
                  <StackItem>
                    <Card isCompact>
                      <CardBody>
                        <Stack hasGutter>
                          <StackItem>
                            <Title headingLevel="h4" size="md">
                              Add New Disk
                            </Title>
                          </StackItem>
                          <StackItem>
                            <Grid hasGutter>
                              <GridItem span={3}>
                                <FormGroup label="Size (GB)" fieldId="new-disk-size">
                                  <TextInput
                                    id="new-disk-size"
                                    type="number"
                                    value={newDiskSize}
                                    onChange={(_, value) => setNewDiskSize(parseInt(value) || 20)}
                                    min={1}
                                    max={1000}
                                  />
                                </FormGroup>
                              </GridItem>
                              <GridItem span={3}>
                                <FormGroup label="Storage Profile" fieldId="new-disk-profile">
                                  <Select
                                    id="new-disk-profile"
                                    isOpen={isNewDiskProfileSelectOpen}
                                    selected={newDiskProfile}
                                    onSelect={(_, selection) => {
                                      setNewDiskProfile(selection as string);
                                      setIsNewDiskProfileSelectOpen(false);
                                    }}
                                    onOpenChange={setIsNewDiskProfileSelectOpen}
                                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                                      <MenuToggle
                                        ref={toggleRef}
                                        onClick={() => setIsNewDiskProfileSelectOpen(!isNewDiskProfileSelectOpen)}
                                        isExpanded={isNewDiskProfileSelectOpen}
                                        style={{ width: '100%' }}
                                      >
                                        {STORAGE_PROFILES.find(p => p.id === newDiskProfile)?.name || 'Select...'}
                                      </MenuToggle>
                                    )}
                                  >
                                    <SelectList>
                                      {STORAGE_PROFILES.map((profile) => (
                                        <SelectOption key={profile.id} value={profile.id}>
                                          {profile.name}
                                        </SelectOption>
                                      ))}
                                    </SelectList>
                                  </Select>
                                </FormGroup>
                              </GridItem>
                              <GridItem span={3}>
                                <FormGroup label="Bus Type" fieldId="new-disk-bus-type">
                                  <Select
                                    id="new-disk-bus-type"
                                    isOpen={isBusTypeSelectOpen}
                                    selected={newDiskBusType}
                                    onSelect={(_, selection) => {
                                      setNewDiskBusType(selection as 'IDE' | 'SCSI' | 'SATA');
                                      setIsBusTypeSelectOpen(false);
                                    }}
                                    onOpenChange={setIsBusTypeSelectOpen}
                                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                                      <MenuToggle
                                        ref={toggleRef}
                                        onClick={() => setIsBusTypeSelectOpen(!isBusTypeSelectOpen)}
                                        isExpanded={isBusTypeSelectOpen}
                                        style={{ width: '100%' }}
                                      >
                                        {BUS_TYPES.find(t => t.value === newDiskBusType)?.label || 'Select...'}
                                      </MenuToggle>
                                    )}
                                  >
                                    <SelectList>
                                      {BUS_TYPES.map((busType) => (
                                        <SelectOption key={busType.value} value={busType.value}>
                                          {busType.label}
                                        </SelectOption>
                                      ))}
                                    </SelectList>
                                  </Select>
                                </FormGroup>
                              </GridItem>
                              <GridItem span={3}>
                                <FormGroup label=" " fieldId="add-disk-button">
                                  <Button
                                    variant="secondary"
                                    icon={<PlusIcon />}
                                    onClick={handleAddDisk}
                                    style={{ width: '100%' }}
                                  >
                                    Add Disk
                                  </Button>
                                </FormGroup>
                              </GridItem>
                            </Grid>
                          </StackItem>
                        </Stack>
                      </CardBody>
                    </Card>
                  </StackItem>

                  {/* Additional Disks Table */}
                  {additionalDisks.length > 0 && (
                    <StackItem>
                      <Table variant="compact">
                        <Thead>
                          <Tr>
                            <Th>Name</Th>
                            <Th>Size</Th>
                            <Th>Storage Profile</Th>
                            <Th>Bus Type</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {additionalDisks.map((disk, index) => (
                            <Tr key={disk.id}>
                              <Td>Hard disk {index + 2}</Td>
                              <Td>{disk.size_gb} GB</Td>
                              <Td>
                                <Badge>
                                  {STORAGE_PROFILES.find(p => p.id === disk.storage_profile)?.name || disk.storage_profile}
                                </Badge>
                              </Td>
                              <Td>{disk.bus_type}</Td>
                              <Td>
                                <ActionsColumn
                                  items={[
                                    {
                                      title: 'Remove',
                                      onClick: () => handleRemoveDisk(disk.id),
                                      isDanger: true,
                                    },
                                  ]}
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </StackItem>
                  )}
                </>
              )}
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Storage Warning */}
      {storageWarning && (
        <StackItem>
          <Alert
            variant={storageWarning.variant}
            isInline
            title={storageWarning.title}
          >
            {storageWarning.message}
          </Alert>
        </StackItem>
      )}

      {/* Storage Summary */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  Storage Summary
                </Title>
              </StackItem>
              <StackItem>
                <Grid hasGutter>
                  <GridItem span={4}>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '2em', marginBottom: '8px' }}>
                        💾
                      </div>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                        {formData.storage_config.disk_size_gb} GB
                      </div>
                      <div className="pf-v6-u-color-200">
                        Primary Disk
                      </div>
                    </div>
                  </GridItem>
                  <GridItem span={4}>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '2em', marginBottom: '8px' }}>
                        📁
                      </div>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                        {additionalDisks.length}
                      </div>
                      <div className="pf-v6-u-color-200">
                        Additional Disk{additionalDisks.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </GridItem>
                  <GridItem span={4}>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '2em', marginBottom: '8px' }}>
                        📊
                      </div>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                        {getTotalStorage()} GB
                      </div>
                      <div className="pf-v6-u-color-200">
                        Total Storage
                      </div>
                    </div>
                  </GridItem>
                </Grid>
              </StackItem>
              <StackItem>
                <Alert variant={AlertVariant.info} isInline isPlain title="Storage Profile">
                  {selectedProfile ? `${selectedProfile.name}: ${selectedProfile.description}` : 'Standard storage profile selected'}
                </Alert>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>
    </Stack>
  );
};

export default StorageConfigurationStep;