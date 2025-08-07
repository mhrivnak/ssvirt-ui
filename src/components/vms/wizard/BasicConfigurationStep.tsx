import React, { useState } from 'react';
import {
  Stack,
  StackItem,
  Title,
  Card,
  CardBody,
  Grid,
  GridItem,
  TextInput,
  TextArea,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  FormGroup,
  Alert,
  AlertVariant,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import {
  EditIcon,
  InfoCircleIcon,
  VirtualMachineIcon,
} from '@patternfly/react-icons';
import type { MenuToggleElement } from '@patternfly/react-core';
import type { WizardFormData } from '../VMCreationWizard';
import type { VDC } from '../../../types';
import { formatMegabytes } from '../../../utils/formatters';

interface BasicConfigurationStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  vdcs: VDC[];
}

const BasicConfigurationStep: React.FC<BasicConfigurationStepProps> = ({
  formData,
  updateFormData,
  vdcs,
}) => {
  const [isVDCSelectOpen, setIsVDCSelectOpen] = useState(false);
  const [nameError, setNameError] = useState('');
  const [vdcError, setVDCError] = useState('');

  const validateVMName = (name: string) => {
    if (!name.trim()) {
      setNameError('VM name is required');
      return false;
    }
    if (name.length < 3) {
      setNameError('VM name must be at least 3 characters');
      return false;
    }
    if (name.length > 63) {
      setNameError('VM name must be 63 characters or less');
      return false;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(name) && name.length > 1) {
      setNameError(
        'VM name must start with a letter, end with alphanumeric, and contain only letters, numbers, and hyphens'
      );
      return false;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)) {
      setNameError(
        'VM name must start with a letter and contain only letters, numbers, and hyphens'
      );
      return false;
    }
    setNameError('');
    return true;
  };

  const validateVDC = (vdcId: string) => {
    if (!vdcId) {
      setVDCError('VDC selection is required');
      return false;
    }
    setVDCError('');
    return true;
  };

  const handleNameChange = (value: string) => {
    updateFormData({ name: value });
    validateVMName(value);
  };

  const handleVDCChange = (vdcId: string) => {
    updateFormData({ vdc_id: vdcId });
    validateVDC(vdcId);
    setIsVDCSelectOpen(false);
  };

  const selectedVDC = vdcs.find((vdc) => vdc.id === formData.vdc_id);

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="xl">
          <EditIcon className="pf-v6-u-mr-sm" />
          Basic Configuration
        </Title>
        <p className="pf-v6-u-color-200">
          Configure the basic settings for your virtual machine including name,
          description, and target VDC.
        </p>
      </StackItem>

      <StackItem>
        <Grid hasGutter>
          {/* VM Name and Description */}
          <GridItem span={8}>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      VM Details
                    </Title>
                  </StackItem>

                  <StackItem>
                    <FormGroup label="VM Name" isRequired fieldId="vm-name">
                      <TextInput
                        id="vm-name"
                        value={formData.name}
                        onChange={(_, value) => handleNameChange(value)}
                        placeholder="Enter VM name (e.g., web-server-01)"
                        validated={nameError ? 'error' : 'default'}
                      />
                      {!nameError && (
                        <HelperText>
                          <HelperTextItem icon={<InfoCircleIcon />}>
                            Must start with a letter, contain only letters,
                            numbers, and hyphens, and be 3-63 characters long
                          </HelperTextItem>
                        </HelperText>
                      )}
                      {nameError && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {nameError}
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>

                  <StackItem>
                    <FormGroup label="Description" fieldId="vm-description">
                      <TextArea
                        id="vm-description"
                        value={formData.description}
                        onChange={(_, value) =>
                          updateFormData({ description: value })
                        }
                        placeholder="Enter optional description..."
                        rows={3}
                        resizeOrientation="vertical"
                      />
                      <HelperText>
                        <HelperTextItem>
                          Optional description to help identify this VM's
                          purpose
                        </HelperTextItem>
                      </HelperText>
                    </FormGroup>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          {/* VDC Selection */}
          <GridItem span={4}>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      Target VDC
                    </Title>
                  </StackItem>

                  <StackItem>
                    <FormGroup
                      label="Virtual Data Center"
                      isRequired
                      fieldId="vdc-select"
                    >
                      <Select
                        id="vdc-select"
                        isOpen={isVDCSelectOpen}
                        selected={formData.vdc_id}
                        onSelect={(_, selection) =>
                          handleVDCChange(selection as string)
                        }
                        onOpenChange={setIsVDCSelectOpen}
                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                          <MenuToggle
                            ref={toggleRef}
                            onClick={() => setIsVDCSelectOpen(!isVDCSelectOpen)}
                            isExpanded={isVDCSelectOpen}
                            style={{ width: '100%' }}
                          >
                            {selectedVDC ? selectedVDC.name : 'Select VDC...'}
                          </MenuToggle>
                        )}
                      >
                        <SelectList>
                          {vdcs.map((vdc) => (
                            <SelectOption key={vdc.id} value={vdc.id}>
                              {vdc.name}
                            </SelectOption>
                          ))}
                        </SelectList>
                      </Select>
                      {!vdcError && (
                        <HelperText>
                          <HelperTextItem>
                            Select the VDC where this VM will be created
                          </HelperTextItem>
                        </HelperText>
                      )}
                      {vdcError && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {vdcError}
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>

                  {/* VDC Resource Information */}
                  {selectedVDC && (
                    <StackItem>
                      <Alert
                        variant={AlertVariant.info}
                        isInline
                        isPlain
                        title="VDC Resource Limits"
                      >
                        <Stack>
                          <StackItem>
                            <strong>CPU Limit:</strong> {selectedVDC.cpu_limit}{' '}
                            cores
                          </StackItem>
                          <StackItem>
                            <strong>Memory Limit:</strong>{' '}
                            {formatMegabytes(selectedVDC.memory_limit_mb)}
                          </StackItem>
                          <StackItem>
                            <strong>Storage Limit:</strong>{' '}
                            {formatMegabytes(selectedVDC.storage_limit_mb)}
                          </StackItem>
                          <StackItem>
                            <strong>Allocation Model:</strong>{' '}
                            {selectedVDC.allocation_model}
                          </StackItem>
                        </Stack>
                      </Alert>
                    </StackItem>
                  )}
                </Stack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>

      {/* Selected Template Summary */}
      {formData.selectedTemplate && (
        <StackItem>
          <Card>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <Title headingLevel="h3" size="lg">
                    <VirtualMachineIcon className="pf-v6-u-mr-sm" />
                    Selected Template
                  </Title>
                </StackItem>
                <StackItem>
                  <Alert
                    variant={AlertVariant.info}
                    isInline
                    isPlain
                    title={formData.selectedTemplate.name}
                  >
                    {formData.selectedTemplate.description}
                    <br />
                    <strong>Default specs:</strong>{' '}
                    {formData.selectedTemplate.cpu_count} CPU,{' '}
                    {formatMegabytes(formData.selectedTemplate.memory_mb)},{' '}
                    {formData.selectedTemplate.disk_size_gb} GB storage
                  </Alert>
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </StackItem>
      )}
    </Stack>
  );
};

export default BasicConfigurationStep;
