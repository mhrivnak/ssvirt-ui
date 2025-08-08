import React, { useState, useEffect } from 'react';
import {
  Form,
  FormGroup,
  NumberInput,
  Stack,
  StackItem,
  Button,
  Alert,
  AlertVariant,
  Grid,
  GridItem,
  Card,
  CardBody,
  Title,
  Divider,
  Slider,
  Content,
} from '@patternfly/react-core';
import { CpuIcon, ServerIcon } from '@patternfly/react-icons';
import type { VM } from '../../types';

interface VMResourceEditorProps {
  vm: VM;
  onSave: (updatedVM: VM) => void;
  onCancel: () => void;
  onChangesDetected: (hasChanges: boolean) => void;
}

export const VMResourceEditor: React.FC<VMResourceEditorProps> = ({
  vm,
  onSave,
  onCancel,
  onChangesDetected,
}) => {
  const [cpuCores, setCpuCores] = useState(vm.cpu_count);
  const [memoryMb, setMemoryMb] = useState(vm.memory_mb);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // CPU and Memory limits (these would come from VDC quotas in real implementation)
  const maxCpuCores = 16;
  const minCpuCores = 1;
  const maxMemoryMb = 32768; // 32 GB
  const minMemoryMb = 512; // 512 MB

  const formatMemoryMb = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const formatMemoryGb = (gb: number) => {
    return gb.toFixed(1);
  };

  const convertMbToGb = (mb: number) => mb / 1024;
  const convertGbToMb = (gb: number) => Math.round(gb * 1024);

  useEffect(() => {
    const hasChanges = cpuCores !== vm.cpu_count || memoryMb !== vm.memory_mb;
    onChangesDetected(hasChanges);
  }, [cpuCores, memoryMb, vm.cpu_count, vm.memory_mb, onChangesDetected]);

  const validateConfiguration = (): string[] => {
    const errors: string[] = [];

    if (cpuCores < minCpuCores || cpuCores > maxCpuCores) {
      errors.push(
        `CPU cores must be between ${minCpuCores} and ${maxCpuCores}`
      );
    }

    if (memoryMb < minMemoryMb || memoryMb > maxMemoryMb) {
      errors.push(
        `Memory must be between ${formatMemoryMb(minMemoryMb)} and ${formatMemoryMb(maxMemoryMb)}`
      );
    }

    // Memory should be in reasonable increments
    if (memoryMb % 256 !== 0) {
      errors.push('Memory should be in 256 MB increments');
    }

    return errors;
  };

  const handleCpuChange = (value: number) => {
    setCpuCores(Math.max(minCpuCores, Math.min(maxCpuCores, value)));
  };

  const handleMemorySliderChange = (value: number) => {
    const mb = convertGbToMb(value);
    // Round to nearest 256 MB increment
    const roundedMb = Math.round(mb / 256) * 256;
    setMemoryMb(Math.max(minMemoryMb, Math.min(maxMemoryMb, roundedMb)));
  };

  const handleMemoryInputChange = (value: number) => {
    setMemoryMb(Math.max(minMemoryMb, Math.min(maxMemoryMb, value)));
  };

  const handleSave = async () => {
    const errors = validateConfiguration();
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedVM: VM = {
        ...vm,
        cpu_count: cpuCores,
        memory_mb: memoryMb,
        updated_at: new Date().toISOString(),
      };

      onSave(updatedVM);
    } catch {
      setValidationErrors([
        'Failed to update VM configuration. Please try again.',
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = cpuCores !== vm.cpu_count || memoryMb !== vm.memory_mb;

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
        <Alert
          variant={AlertVariant.warning}
          title="Configuration Changes"
          isInline
        >
          VM must be powered off to modify CPU and memory configuration. Changes
          will take effect on next power on.
        </Alert>
      </StackItem>

      <StackItem>
        <Form>
          <Grid hasGutter>
            {/* CPU Configuration */}
            <GridItem span={6}>
              <Card>
                <CardBody>
                  <Stack hasGutter>
                    <StackItem>
                      <Title headingLevel="h4" size="md">
                        <CpuIcon className="pf-v6-u-mr-sm" />
                        CPU Configuration
                      </Title>
                      <Divider className="pf-v6-u-my-sm" />
                    </StackItem>
                    <StackItem>
                      <FormGroup label="CPU Cores" fieldId="cpu-cores">
                        <NumberInput
                          value={cpuCores}
                          onMinus={() => handleCpuChange(cpuCores - 1)}
                          onPlus={() => handleCpuChange(cpuCores + 1)}
                          onChange={(event) => {
                            const target = event.target as HTMLInputElement;
                            const value = parseInt(target.value) || minCpuCores;
                            handleCpuChange(value);
                          }}
                          inputName="cpu-cores"
                          inputAriaLabel="CPU cores"
                          min={minCpuCores}
                          max={maxCpuCores}
                          unit="cores"
                        />
                      </FormGroup>
                    </StackItem>
                    <StackItem>
                      <Content>
                        <strong>Current:</strong> {vm.cpu_count} cores
                        {hasChanges && (
                          <>
                            <br />
                            <strong>New:</strong> {cpuCores} cores
                          </>
                        )}
                      </Content>
                    </StackItem>
                  </Stack>
                </CardBody>
              </Card>
            </GridItem>

            {/* Memory Configuration */}
            <GridItem span={6}>
              <Card>
                <CardBody>
                  <Stack hasGutter>
                    <StackItem>
                      <Title headingLevel="h4" size="md">
                        <ServerIcon className="pf-v6-u-mr-sm" />
                        Memory Configuration
                      </Title>
                      <Divider className="pf-v6-u-my-sm" />
                    </StackItem>
                    <StackItem>
                      <FormGroup label="Memory (GB)" fieldId="memory-slider">
                        <Slider
                          value={convertMbToGb(memoryMb)}
                          onChange={(_event, value) =>
                            handleMemorySliderChange(value)
                          }
                          min={convertMbToGb(minMemoryMb)}
                          max={convertMbToGb(maxMemoryMb)}
                          step={0.25}
                          showTicks
                          showBoundaries
                        />
                        <div className="pf-v6-u-mt-sm">
                          <strong>
                            {formatMemoryGb(convertMbToGb(memoryMb))} GB
                          </strong>
                          <span className="pf-v6-u-ml-sm pf-v6-u-color-200">
                            ({memoryMb} MB)
                          </span>
                        </div>
                      </FormGroup>
                    </StackItem>
                    <StackItem>
                      <FormGroup
                        label="Exact Memory (MB)"
                        fieldId="memory-input"
                      >
                        <NumberInput
                          value={memoryMb}
                          onMinus={() =>
                            handleMemoryInputChange(memoryMb - 256)
                          }
                          onPlus={() => handleMemoryInputChange(memoryMb + 256)}
                          onChange={(event) => {
                            const target = event.target as HTMLInputElement;
                            const value = parseInt(target.value) || minMemoryMb;
                            handleMemoryInputChange(value);
                          }}
                          inputName="memory-input"
                          inputAriaLabel="Memory in MB"
                          min={minMemoryMb}
                          max={maxMemoryMb}
                          unit="MB"
                          step={256}
                        />
                      </FormGroup>
                    </StackItem>
                    <StackItem>
                      <Content>
                        <strong>Current:</strong> {formatMemoryMb(vm.memory_mb)}
                        {hasChanges && (
                          <>
                            <br />
                            <strong>New:</strong> {formatMemoryMb(memoryMb)}
                          </>
                        )}
                      </Content>
                    </StackItem>
                  </Stack>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </Form>
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
            isDisabled={
              !hasChanges ||
              validationErrors.length > 0 ||
              vm.status === 'POWERED_ON'
            }
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </StackItem>
    </Stack>
  );
};

export default VMResourceEditor;
