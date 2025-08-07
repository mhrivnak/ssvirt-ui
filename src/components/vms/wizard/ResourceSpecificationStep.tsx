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
  Badge,
  Switch,
  Divider,
} from '@patternfly/react-core';
import { CpuIcon, ServerIcon, InfoCircleIcon } from '@patternfly/react-icons';
import type { WizardFormData } from '../VMCreationWizard';

interface ResourceSpecificationStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

// Common VM configurations for quick selection
const COMMON_CONFIGS = [
  {
    name: 'Small',
    cpu: 1,
    memory: 2048,
    description: 'Light workloads, testing',
  },
  {
    name: 'Medium',
    cpu: 2,
    memory: 4096,
    description: 'Web servers, development',
  },
  {
    name: 'Large',
    cpu: 4,
    memory: 8192,
    description: 'Databases, heavy applications',
  },
  {
    name: 'Extra Large',
    cpu: 8,
    memory: 16384,
    description: 'High-performance workloads',
  },
];

const ResourceSpecificationStep: React.FC<ResourceSpecificationStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [cpuError, setCpuError] = useState('');
  const [memoryError, setMemoryError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const validateCpu = (cpuCount: number) => {
    if (cpuCount < 1) {
      setCpuError('CPU count must be at least 1');
      return false;
    }
    if (cpuCount > 32) {
      setCpuError('CPU count cannot exceed 32');
      return false;
    }
    setCpuError('');
    return true;
  };

  const validateMemory = (memoryMb: number) => {
    if (memoryMb < 512) {
      setMemoryError('Memory must be at least 512 MB');
      return false;
    }
    if (memoryMb > 65536) {
      setMemoryError('Memory cannot exceed 64 GB');
      return false;
    }
    setMemoryError('');
    return true;
  };

  const handleCpuChange = (value: number) => {
    updateFormData({ cpu_count: value });
    validateCpu(value);
  };

  const handleMemoryChange = (value: number) => {
    updateFormData({ memory_mb: value });
    validateMemory(value);
  };

  const handleCpuInputChange = (value: string) => {
    const cpuCount = parseInt(value) || 1;
    handleCpuChange(cpuCount);
  };

  const handleMemoryInputChange = (value: string) => {
    const memoryMb = parseInt(value) || 512;
    handleMemoryChange(memoryMb);
  };

  const handlePresetConfig = (config: (typeof COMMON_CONFIGS)[0]) => {
    updateFormData({
      cpu_count: config.cpu,
      memory_mb: config.memory,
    });
    validateCpu(config.cpu);
    validateMemory(config.memory);
  };

  const formatMemory = (memoryMb: number) => {
    if (memoryMb >= 1024) {
      return `${(memoryMb / 1024).toFixed(1)} GB`;
    }
    return `${memoryMb} MB`;
  };

  const getResourceWarning = () => {
    const totalMemoryGb = formData.memory_mb / 1024;

    if (formData.cpu_count >= 8 || totalMemoryGb >= 16) {
      return {
        variant: 'warning' as const,
        title: 'High Resource Configuration',
        message:
          'This configuration requires significant resources. Ensure your VDC has sufficient quota.',
      };
    }

    if (formData.cpu_count === 1 && formData.memory_mb < 2048) {
      return {
        variant: 'info' as const,
        title: 'Minimal Configuration',
        message:
          'This is a minimal configuration suitable for light workloads and testing.',
      };
    }

    return null;
  };

  const resourceWarning = getResourceWarning();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="xl">
          <CpuIcon className="pf-v6-u-mr-sm" />
          Resource Specification
        </Title>
        <p className="pf-v6-u-color-200">
          Configure the CPU, memory, and storage resources for your virtual
          machine.
        </p>
      </StackItem>

      {/* Quick Configuration Presets */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  Quick Configuration
                </Title>
                <p className="pf-v6-u-color-200">
                  Select a common configuration or customize resources below
                </p>
              </StackItem>
              <StackItem>
                <Grid hasGutter>
                  {COMMON_CONFIGS.map((config) => (
                    <GridItem key={config.name} span={3}>
                      <Card
                        isSelectable
                        isSelected={
                          formData.cpu_count === config.cpu &&
                          formData.memory_mb === config.memory
                        }
                        onClick={() => handlePresetConfig(config)}
                        style={{ cursor: 'pointer' }}
                      >
                        <CardBody>
                          <Stack>
                            <StackItem>
                              <Title headingLevel="h4" size="md">
                                {config.name}
                              </Title>
                            </StackItem>
                            <StackItem>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '8px',
                                  marginBottom: '8px',
                                }}
                              >
                                <Badge>
                                  <CpuIcon className="pf-v6-u-mr-xs" />
                                  {config.cpu} CPU
                                </Badge>
                                <Badge>
                                  <ServerIcon className="pf-v6-u-mr-xs" />
                                  {formatMemory(config.memory)}
                                </Badge>
                              </div>
                              <p className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                                {config.description}
                              </p>
                            </StackItem>
                          </Stack>
                        </CardBody>
                      </Card>
                    </GridItem>
                  ))}
                </Grid>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Resource Configuration */}
      <StackItem>
        <Grid hasGutter>
          {/* CPU Configuration */}
          <GridItem span={6}>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      <CpuIcon className="pf-v6-u-mr-sm" />
                      CPU Cores
                    </Title>
                  </StackItem>

                  <StackItem>
                    <FormGroup label="Number of CPU cores" fieldId="cpu-slider">
                      <Slider
                        value={formData.cpu_count}
                        onChange={(_, value) => handleCpuChange(value)}
                        min={1}
                        max={16}
                        step={1}
                        showTicks
                        showBoundaries
                      />
                      {!cpuError && (
                        <HelperText>
                          <HelperTextItem icon={<InfoCircleIcon />}>
                            Recommend starting with 1-2 cores for most workloads
                          </HelperTextItem>
                        </HelperText>
                      )}
                      {cpuError && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {cpuError}
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>

                  <StackItem>
                    <FormGroup label="Or enter exact value" fieldId="cpu-input">
                      <TextInput
                        id="cpu-input"
                        type="number"
                        value={formData.cpu_count}
                        onChange={(_, value) => handleCpuInputChange(value)}
                        min={1}
                        max={32}
                        validated={cpuError ? 'error' : 'default'}
                      />
                    </FormGroup>
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
                    <Title headingLevel="h3" size="lg">
                      <ServerIcon className="pf-v6-u-mr-sm" />
                      Memory
                    </Title>
                  </StackItem>

                  <StackItem>
                    <FormGroup
                      label={`Memory allocation (${formatMemory(formData.memory_mb)})`}
                      fieldId="memory-slider"
                    >
                      <Slider
                        value={formData.memory_mb}
                        onChange={(_, value) => handleMemoryChange(value)}
                        min={512}
                        max={32768}
                        step={512}
                        showTicks
                        showBoundaries
                      />
                      {!memoryError && (
                        <HelperText>
                          <HelperTextItem icon={<InfoCircleIcon />}>
                            Common values: 2GB (web servers), 4GB
                            (applications), 8GB+ (databases)
                          </HelperTextItem>
                        </HelperText>
                      )}
                      {memoryError && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {memoryError}
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>

                  <StackItem>
                    <FormGroup
                      label="Or enter exact value (MB)"
                      fieldId="memory-input"
                    >
                      <TextInput
                        id="memory-input"
                        type="number"
                        value={formData.memory_mb}
                        onChange={(_, value) => handleMemoryInputChange(value)}
                        min={512}
                        max={65536}
                        step={512}
                        validated={memoryError ? 'error' : 'default'}
                      />
                    </FormGroup>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>

      {/* Resource Warning */}
      {resourceWarning && (
        <StackItem>
          <Alert
            variant={resourceWarning.variant}
            isInline
            title={resourceWarning.title}
          >
            {resourceWarning.message}
          </Alert>
        </StackItem>
      )}

      {/* Advanced Options Toggle */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Switch
                  id="advanced-resources-toggle"
                  label="Show advanced resource options"
                  isChecked={showAdvanced}
                  onChange={(_, checked) => setShowAdvanced(checked)}
                />
              </StackItem>

              {showAdvanced && (
                <>
                  <StackItem>
                    <Divider />
                  </StackItem>
                  <StackItem>
                    <Alert
                      variant={AlertVariant.info}
                      isInline
                      title="Advanced Resource Options"
                    >
                      Advanced resource configuration options will be available
                      in a future update. Current configuration provides CPU and
                      memory settings suitable for most workloads.
                    </Alert>
                  </StackItem>
                </>
              )}
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Resource Summary */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  Resource Summary
                </Title>
              </StackItem>
              <StackItem>
                <Grid hasGutter>
                  <GridItem span={4}>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '2em', marginBottom: '8px' }}>
                        <CpuIcon />
                      </div>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                        {formData.cpu_count}
                      </div>
                      <div className="pf-v6-u-color-200">
                        CPU Core{formData.cpu_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </GridItem>
                  <GridItem span={4}>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '2em', marginBottom: '8px' }}>
                        <ServerIcon />
                      </div>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                        {formatMemory(formData.memory_mb)}
                      </div>
                      <div className="pf-v6-u-color-200">Memory</div>
                    </div>
                  </GridItem>
                  <GridItem span={4}>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '2em', marginBottom: '8px' }}>
                        💾
                      </div>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                        {formData.storage_config.disk_size_gb} GB
                      </div>
                      <div className="pf-v6-u-color-200">Storage</div>
                    </div>
                  </GridItem>
                </Grid>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>
    </Stack>
  );
};

export default ResourceSpecificationStep;
