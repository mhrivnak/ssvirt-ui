import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Button,
  Form,
  FormGroup,
  TextInput,
  Switch,
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbItem,
  ActionGroup,
  FormSelect,
  FormSelectOption,
  NumberInput,
  Grid,
  GridItem,
  Icon,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  SaveIcon,
  TimesIcon,
  CpuIcon,
  MemoryIcon,
  StorageDomainIcon,
} from '@patternfly/react-icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useVDC,
  useCreateVDC,
  useUpdateVDC,
  useOrganizations,
} from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { CreateVDCRequest, UpdateVDCRequest } from '../../types';
import { ROUTES } from '../../utils/constants';

interface FormData {
  name: string;
  organization_id: string;
  allocation_model: string;
  cpu_limit: number;
  memory_limit_mb: number;
  storage_limit_mb: number;
  enabled: boolean;
}

interface FormErrors {
  name?: string;
  organization_id?: string;
  allocation_model?: string;
  cpu_limit?: string;
  memory_limit_mb?: string;
  storage_limit_mb?: string;
  general?: string;
}

const VDCForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    organization_id: '',
    allocation_model: 'PayAsYouGo',
    cpu_limit: 10,
    memory_limit_mb: 8192,
    storage_limit_mb: 102400,
    enabled: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<FormData | null>(null);

  // Hooks
  const { data: vdcResponse, isLoading } = useVDC(id || '');
  const { data: orgsResponse } = useOrganizations();
  const createMutation = useCreateVDC();
  const updateMutation = useUpdateVDC();

  const vdc = vdcResponse?.data;
  const organizations = orgsResponse?.data || [];

  // Load VDC data for editing
  useEffect(() => {
    if (isEditing && vdc) {
      const data = {
        name: vdc.name,
        organization_id: vdc.organization_id,
        allocation_model: vdc.allocation_model,
        cpu_limit: vdc.cpu_limit,
        memory_limit_mb: vdc.memory_limit_mb,
        storage_limit_mb: vdc.storage_limit_mb,
        enabled: vdc.enabled,
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [isEditing, vdc]);

  // Track changes
  useEffect(() => {
    if (originalData) {
      const changed = Object.keys(formData).some(
        (key) =>
          formData[key as keyof FormData] !==
          originalData[key as keyof FormData]
      );
      setHasChanges(changed);
    } else if (!isEditing) {
      // For new VDCs, consider any non-empty fields as changes
      const hasData = formData.name || formData.organization_id;
      setHasChanges(Boolean(hasData));
    }
  }, [formData, originalData, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'VDC name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'VDC name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'VDC name must be less than 50 characters';
    } else if (!/^[a-z0-9-]+$/.test(formData.name)) {
      newErrors.name =
        'VDC name can only contain lowercase letters, numbers, and hyphens';
    }

    // Organization validation
    if (!formData.organization_id) {
      newErrors.organization_id = 'Organization is required';
    }

    // Allocation model validation
    if (!formData.allocation_model) {
      newErrors.allocation_model = 'Allocation model is required';
    }

    // CPU limit validation
    if (formData.cpu_limit < 1) {
      newErrors.cpu_limit = 'CPU limit must be at least 1 core';
    } else if (formData.cpu_limit > 1000) {
      newErrors.cpu_limit = 'CPU limit cannot exceed 1000 cores';
    }

    // Memory limit validation
    if (formData.memory_limit_mb < 512) {
      newErrors.memory_limit_mb = 'Memory limit must be at least 512 MB';
    } else if (formData.memory_limit_mb > 1048576) {
      // 1TB
      newErrors.memory_limit_mb = 'Memory limit cannot exceed 1 TB';
    }

    // Storage limit validation
    if (formData.storage_limit_mb < 1024) {
      // 1GB
      newErrors.storage_limit_mb = 'Storage limit must be at least 1 GB';
    } else if (formData.storage_limit_mb > 10485760) {
      // 10TB
      newErrors.storage_limit_mb = 'Storage limit cannot exceed 10 TB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific errors when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && id) {
        const updateData: UpdateVDCRequest = {
          id,
          name: formData.name,
          organization_id: formData.organization_id,
          allocation_model: formData.allocation_model,
          cpu_limit: formData.cpu_limit,
          memory_limit_mb: formData.memory_limit_mb,
          storage_limit_mb: formData.storage_limit_mb,
          enabled: formData.enabled,
        };

        await updateMutation.mutateAsync(updateData);
        navigate(ROUTES.VDC_DETAIL.replace(':id', id));
      } else {
        const createData: CreateVDCRequest = {
          name: formData.name,
          organization_id: formData.organization_id,
          allocation_model: formData.allocation_model,
          cpu_limit: formData.cpu_limit,
          memory_limit_mb: formData.memory_limit_mb,
          storage_limit_mb: formData.storage_limit_mb,
          enabled: formData.enabled,
        };

        const response = await createMutation.mutateAsync(createData);
        navigate(ROUTES.VDC_DETAIL.replace(':id', response.data.id));
      }
    } catch (error) {
      console.error('Failed to save VDC:', error);
      const errorMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setErrors({
        general: errorMessage || 'Failed to save VDC. Please try again.',
      });
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this page?'
      );
      if (!confirmed) return;
    }

    if (isEditing && id) {
      navigate(ROUTES.VDC_DETAIL.replace(':id', id));
    } else {
      navigate(ROUTES.VDCS);
    }
  };

  if (isEditing && isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (isEditing && !vdc) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="VDC not found" isInline>
          The VDC you're trying to edit doesn't exist or you don't have
          permission to edit it.
        </Alert>
        <br />
        <Button variant="primary" onClick={() => navigate(ROUTES.VDCS)}>
          Back to VDCs
        </Button>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to={ROUTES.VDCS}>Virtual Data Centers</Link>
            </BreadcrumbItem>
            {isEditing && vdc && (
              <BreadcrumbItem>
                <Link to={ROUTES.VDC_DETAIL.replace(':id', id!)}>
                  {vdc.name}
                </Link>
              </BreadcrumbItem>
            )}
            <BreadcrumbItem isActive>
              {isEditing ? 'Edit VDC' : 'Create VDC'}
            </BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                {isEditing
                  ? 'Edit Virtual Data Center'
                  : 'Create Virtual Data Center'}
              </Title>
              <p className="pf-v6-u-color-200">
                {isEditing
                  ? 'Update VDC settings and resource quotas'
                  : 'Create a new Virtual Data Center with resource quotas and allocation model'}
              </p>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Form */}
        <StackItem>
          <Card>
            <CardBody>
              <Form onSubmit={handleSubmit}>
                <Stack hasGutter>
                  {/* General Error */}
                  {errors.general && (
                    <StackItem>
                      <Alert
                        variant={AlertVariant.danger}
                        title="Error"
                        isInline
                      >
                        {errors.general}
                      </Alert>
                    </StackItem>
                  )}

                  {/* Basic Information */}
                  <StackItem>
                    <Title headingLevel="h2" size="lg">
                      Basic Information
                    </Title>
                  </StackItem>

                  <StackItem>
                    <Grid hasGutter>
                      <GridItem span={12} md={6}>
                        <FormGroup
                          label="VDC Name"
                          isRequired
                          fieldId="vdc-name"
                        >
                          <TextInput
                            isRequired
                            type="text"
                            id="vdc-name"
                            value={formData.name}
                            onChange={(_, value) =>
                              handleInputChange('name', value)
                            }
                            placeholder="my-vdc"
                            isDisabled={isEditing} // Name cannot be changed after creation
                            validated={errors.name ? 'error' : 'default'}
                            aria-describedby={
                              errors.name ? 'vdc-name-error' : undefined
                            }
                          />
                          {errors.name && (
                            <div
                              id="vdc-name-error"
                              style={{
                                color: 'var(--pf-v6-global--danger-color--100)',
                                fontSize: '0.875rem',
                                marginTop: '0.25rem',
                              }}
                            >
                              {errors.name}
                            </div>
                          )}
                          {isEditing && (
                            <small className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                              VDC name cannot be changed after creation
                            </small>
                          )}
                        </FormGroup>
                      </GridItem>

                      <GridItem span={12} md={6}>
                        <FormGroup
                          label="Organization"
                          isRequired
                          fieldId="vdc-organization"
                        >
                          <FormSelect
                            value={formData.organization_id}
                            onChange={(_, value) =>
                              handleInputChange('organization_id', value)
                            }
                            id="vdc-organization"
                            aria-label="Select organization"
                            validated={
                              errors.organization_id ? 'error' : 'default'
                            }
                            aria-describedby={
                              errors.organization_id
                                ? 'vdc-organization-error'
                                : undefined
                            }
                            isDisabled={isEditing} // Organization cannot be changed after creation
                          >
                            <FormSelectOption
                              value=""
                              label="Select an organization"
                            />
                            {organizations.map((org) => (
                              <FormSelectOption
                                key={org.id}
                                value={org.id}
                                label={org.display_name}
                              />
                            ))}
                          </FormSelect>
                          {errors.organization_id && (
                            <div
                              id="vdc-organization-error"
                              style={{
                                color: 'var(--pf-v6-global--danger-color--100)',
                                fontSize: '0.875rem',
                                marginTop: '0.25rem',
                              }}
                            >
                              {errors.organization_id}
                            </div>
                          )}
                          {isEditing && (
                            <small className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                              Organization cannot be changed after creation
                            </small>
                          )}
                        </FormGroup>
                      </GridItem>
                    </Grid>
                  </StackItem>

                  <StackItem>
                    <FormGroup
                      label="Allocation Model"
                      isRequired
                      fieldId="vdc-allocation-model"
                    >
                      <FormSelect
                        value={formData.allocation_model}
                        onChange={(_, value) =>
                          handleInputChange('allocation_model', value)
                        }
                        id="vdc-allocation-model"
                        aria-label="Select allocation model"
                        validated={
                          errors.allocation_model ? 'error' : 'default'
                        }
                        aria-describedby={
                          errors.allocation_model
                            ? 'vdc-allocation-model-error'
                            : undefined
                        }
                      >
                        <FormSelectOption
                          value="PayAsYouGo"
                          label="Pay As You Go - Dynamic resource allocation"
                        />
                        <FormSelectOption
                          value="AllocationPool"
                          label="Allocation Pool - Fixed resource pool"
                        />
                      </FormSelect>
                      {errors.allocation_model && (
                        <div
                          id="vdc-allocation-model-error"
                          style={{
                            color: 'var(--pf-v6-global--danger-color--100)',
                            fontSize: '0.875rem',
                            marginTop: '0.25rem',
                          }}
                        >
                          {errors.allocation_model}
                        </div>
                      )}
                    </FormGroup>
                  </StackItem>

                  {/* Resource Limits */}
                  <StackItem>
                    <Title headingLevel="h2" size="lg">
                      Resource Limits
                    </Title>
                  </StackItem>

                  <StackItem>
                    <Grid hasGutter>
                      <GridItem span={12} md={4}>
                        <FormGroup
                          label="CPU Limit"
                          isRequired
                          fieldId="vdc-cpu-limit"
                        >
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>
                              <Icon>
                                <CpuIcon />
                              </Icon>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <NumberInput
                                value={formData.cpu_limit}
                                onMinus={() =>
                                  handleInputChange(
                                    'cpu_limit',
                                    Math.max(1, formData.cpu_limit - 1)
                                  )
                                }
                                onChange={(event) => {
                                  const target =
                                    event.target as HTMLInputElement;
                                  const value = parseInt(target.value) || 1;
                                  handleInputChange(
                                    'cpu_limit',
                                    Math.max(1, value)
                                  );
                                }}
                                onPlus={() =>
                                  handleInputChange(
                                    'cpu_limit',
                                    formData.cpu_limit + 1
                                  )
                                }
                                inputName="cpu-limit"
                                inputAriaLabel="CPU limit"
                                minusBtnAriaLabel="Decrease CPU limit"
                                plusBtnAriaLabel="Increase CPU limit"
                                min={1}
                                max={1000}
                                validated={
                                  errors.cpu_limit ? 'error' : 'default'
                                }
                                aria-describedby={
                                  errors.cpu_limit
                                    ? 'vdc-cpu-limit-error'
                                    : undefined
                                }
                              />
                            </FlexItem>
                            <FlexItem>
                              <span className="pf-v6-u-color-200">cores</span>
                            </FlexItem>
                          </Flex>
                          {errors.cpu_limit && (
                            <div
                              id="vdc-cpu-limit-error"
                              style={{
                                color: 'var(--pf-v6-global--danger-color--100)',
                                fontSize: '0.875rem',
                                marginTop: '0.25rem',
                              }}
                            >
                              {errors.cpu_limit}
                            </div>
                          )}
                        </FormGroup>
                      </GridItem>

                      <GridItem span={12} md={4}>
                        <FormGroup
                          label="Memory Limit"
                          isRequired
                          fieldId="vdc-memory-limit"
                        >
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>
                              <Icon>
                                <MemoryIcon />
                              </Icon>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <NumberInput
                                value={formData.memory_limit_mb}
                                onMinus={() =>
                                  handleInputChange(
                                    'memory_limit_mb',
                                    Math.max(
                                      512,
                                      formData.memory_limit_mb - 512
                                    )
                                  )
                                }
                                onChange={(event) => {
                                  const target =
                                    event.target as HTMLInputElement;
                                  const value = parseInt(target.value) || 512;
                                  handleInputChange(
                                    'memory_limit_mb',
                                    Math.max(512, value)
                                  );
                                }}
                                onPlus={() =>
                                  handleInputChange(
                                    'memory_limit_mb',
                                    formData.memory_limit_mb + 512
                                  )
                                }
                                inputName="memory-limit"
                                inputAriaLabel="Memory limit"
                                minusBtnAriaLabel="Decrease memory limit"
                                plusBtnAriaLabel="Increase memory limit"
                                min={512}
                                max={1048576}
                                validated={
                                  errors.memory_limit_mb ? 'error' : 'default'
                                }
                                aria-describedby={
                                  errors.memory_limit_mb
                                    ? 'vdc-memory-limit-error'
                                    : undefined
                                }
                              />
                            </FlexItem>
                            <FlexItem>
                              <span className="pf-v6-u-color-200">
                                MB (
                                {formatBytes(
                                  formData.memory_limit_mb * 1024 * 1024
                                )}
                                )
                              </span>
                            </FlexItem>
                          </Flex>
                          {errors.memory_limit_mb && (
                            <div
                              id="vdc-memory-limit-error"
                              style={{
                                color: 'var(--pf-v6-global--danger-color--100)',
                                fontSize: '0.875rem',
                                marginTop: '0.25rem',
                              }}
                            >
                              {errors.memory_limit_mb}
                            </div>
                          )}
                        </FormGroup>
                      </GridItem>

                      <GridItem span={12} md={4}>
                        <FormGroup
                          label="Storage Limit"
                          isRequired
                          fieldId="vdc-storage-limit"
                        >
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>
                              <Icon>
                                <StorageDomainIcon />
                              </Icon>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <NumberInput
                                value={formData.storage_limit_mb}
                                onMinus={() =>
                                  handleInputChange(
                                    'storage_limit_mb',
                                    Math.max(
                                      1024,
                                      formData.storage_limit_mb - 1024
                                    )
                                  )
                                }
                                onChange={(event) => {
                                  const target =
                                    event.target as HTMLInputElement;
                                  const value = parseInt(target.value) || 1024;
                                  handleInputChange(
                                    'storage_limit_mb',
                                    Math.max(1024, value)
                                  );
                                }}
                                onPlus={() =>
                                  handleInputChange(
                                    'storage_limit_mb',
                                    formData.storage_limit_mb + 1024
                                  )
                                }
                                inputName="storage-limit"
                                inputAriaLabel="Storage limit"
                                minusBtnAriaLabel="Decrease storage limit"
                                plusBtnAriaLabel="Increase storage limit"
                                min={1024}
                                max={10485760}
                                validated={
                                  errors.storage_limit_mb ? 'error' : 'default'
                                }
                                aria-describedby={
                                  errors.storage_limit_mb
                                    ? 'vdc-storage-limit-error'
                                    : undefined
                                }
                              />
                            </FlexItem>
                            <FlexItem>
                              <span className="pf-v6-u-color-200">
                                MB (
                                {formatBytes(
                                  formData.storage_limit_mb * 1024 * 1024
                                )}
                                )
                              </span>
                            </FlexItem>
                          </Flex>
                          {errors.storage_limit_mb && (
                            <div
                              id="vdc-storage-limit-error"
                              style={{
                                color: 'var(--pf-v6-global--danger-color--100)',
                                fontSize: '0.875rem',
                                marginTop: '0.25rem',
                              }}
                            >
                              {errors.storage_limit_mb}
                            </div>
                          )}
                        </FormGroup>
                      </GridItem>
                    </Grid>
                  </StackItem>

                  {/* Settings */}
                  <StackItem>
                    <Title headingLevel="h2" size="lg">
                      Settings
                    </Title>
                  </StackItem>

                  <StackItem>
                    <FormGroup label="Status" fieldId="vdc-enabled">
                      <Switch
                        id="vdc-enabled"
                        label="Enabled"
                        isChecked={formData.enabled}
                        onChange={(_, checked) =>
                          handleInputChange('enabled', checked)
                        }
                        aria-label="VDC status"
                      />
                    </FormGroup>
                  </StackItem>

                  {/* Info Alert for New VDCs */}
                  {!isEditing && (
                    <StackItem>
                      <Alert
                        variant={AlertVariant.info}
                        title="VDC Setup"
                        isInline
                      >
                        After creating the VDC, you can:
                        <ul className="pf-v6-u-mt-sm">
                          <li>Assign users and manage access permissions</li>
                          <li>
                            Create virtual machines within the resource limits
                          </li>
                          <li>Monitor resource usage and performance</li>
                          <li>Adjust resource quotas as needed</li>
                        </ul>
                      </Alert>
                    </StackItem>
                  )}

                  {/* Change Warning for Editing */}
                  {isEditing && hasChanges && (
                    <StackItem>
                      <Alert
                        variant={AlertVariant.warning}
                        title="Unsaved Changes"
                        isInline
                      >
                        You have unsaved changes. Make sure to save your changes
                        before leaving this page.
                      </Alert>
                    </StackItem>
                  )}

                  {/* Form Actions */}
                  <StackItem>
                    <ActionGroup>
                      <Button
                        variant="primary"
                        type="submit"
                        icon={<SaveIcon />}
                        isLoading={
                          createMutation.isPending || updateMutation.isPending
                        }
                        isDisabled={!hasChanges && isEditing}
                      >
                        {isEditing ? 'Save Changes' : 'Create VDC'}
                      </Button>
                      <Button
                        variant="link"
                        onClick={handleCancel}
                        icon={<TimesIcon />}
                        isDisabled={
                          createMutation.isPending || updateMutation.isPending
                        }
                      >
                        Cancel
                      </Button>
                    </ActionGroup>
                  </StackItem>
                </Stack>
              </Form>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default VDCForm;
