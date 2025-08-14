import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Title,
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbItem,
  Stack,
  StackItem,
  Card,
  CardBody,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  FormSelect,
  FormSelectOption,
  NumberInput,
  Switch,
  Button,
  ActionGroup,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { useCreateVDC, useUpdateVDC, useVDC } from '../../hooks/useVDC';
import { ROUTES } from '../../utils/constants';
import type { CreateVDCRequest } from '../../types';

const VDCForm: React.FC = () => {
  const { id: vdcId } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { capabilities } = useRole();
  const isEditing = !!vdcId;

  // Get organization ID from navigation state or show error if missing
  const organizationId = location.state?.organizationId;

  // Hooks for VDC operations
  const createVDCMutation = useCreateVDC();
  const updateVDCMutation = useUpdateVDC();
  const { data: existingVDC, isLoading: isLoadingVDC } = useVDC(vdcId || '');

  // Form state
  const [formData, setFormData] = useState<CreateVDCRequest>({
    name: '',
    description: '',
    allocationModel: 'PayAsYouGo',
    computeCapacity: {
      cpu: {
        allocated: 1000,
        limit: 10000,
        units: 'MHz',
      },
      memory: {
        allocated: 1024,
        limit: 10240,
        units: 'MB',
      },
    },
    providerVdc: {
      id: 'provider-vdc-placeholder-001', // Placeholder for demo purposes
    },
    nicQuota: 100,
    networkQuota: 50,
    vdcStorageProfiles: [],
    isThinProvision: true,
    isEnabled: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing VDC data for editing
  useEffect(() => {
    if (!isEditing || !existingVDC) {
      return;
    }

    setFormData({
      name: existingVDC.name || '',
      description: existingVDC.description || '',
      allocationModel: existingVDC.allocationModel || 'PayAsYouGo',
      computeCapacity: existingVDC.computeCapacity || {
        cpu: { allocated: 1000, limit: 10000, units: 'MHz' },
        memory: { allocated: 1024, limit: 10240, units: 'MB' },
      },
      providerVdc: existingVDC.providerVdc || {
        id: 'provider-vdc-placeholder-001',
      },
      nicQuota: existingVDC.nicQuota || 100,
      networkQuota: existingVDC.networkQuota || 50,
      vdcStorageProfiles: existingVDC.vdcStorageProfiles || [],
      isThinProvision: existingVDC.isThinProvision ?? true,
      isEnabled: existingVDC.isEnabled ?? true,
    });
  }, [isEditing, existingVDC]);

  // For creation, organization ID is required
  if (!isEditing && !organizationId) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Invalid Parameters"
          isInline
        >
          Organization ID is required to create a VDC.
        </Alert>
      </PageSection>
    );
  }

  // Check if user has system admin privileges
  if (!capabilities.canManageSystem) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.warning} title="Access Denied" isInline>
          Only System Administrators can manage Virtual Data Centers.
        </Alert>
      </PageSection>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'VDC name is required';
    }

    if (!formData.providerVdc?.id || formData.providerVdc.id.trim() === '') {
      newErrors.providerVdc = 'Provider VDC selection is required';
    }

    if (
      formData.computeCapacity.cpu.allocated >
      formData.computeCapacity.cpu.limit
    ) {
      newErrors.cpuAllocated = 'CPU allocated cannot exceed CPU limit';
    }

    if (
      formData.computeCapacity.memory.allocated >
      formData.computeCapacity.memory.limit
    ) {
      newErrors.memoryAllocated = 'Memory allocated cannot exceed memory limit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('VDC Form submitted with data:', formData);

    if (!validateForm()) {
      console.log('Form validation failed, errors:', errors);
      return;
    }

    console.log('Form validation passed, submitting VDC creation request');
    setIsSubmitting(true);

    try {
      if (isEditing) {
        if (!organizationId) {
          console.error('Organization ID is required for VDC updates');
          setErrors({
            organizationId:
              'Organization context is missing. Cannot update VDC.',
          });
          return;
        }
        await updateVDCMutation.mutateAsync({
          orgId: organizationId,
          vdcId: vdcId!,
          data: formData,
        });
      } else {
        console.log(
          'Creating VDC with orgId:',
          organizationId,
          'and data:',
          formData
        );
        await createVDCMutation.mutateAsync({
          orgId: organizationId!,
          data: formData,
        });
        console.log('VDC creation request completed successfully');
      }

      // Navigate back to organization detail page where VDCs are displayed
      console.log('Navigating after successful VDC operation');
      if (organizationId) {
        navigate(ROUTES.ORGANIZATION_DETAIL.replace(':id', organizationId));
      } else {
        navigate(ROUTES.VDCS);
      }
    } catch (error) {
      console.error('Failed to save VDC:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to organization detail page, or VDCS if no organization context
    if (organizationId) {
      navigate(ROUTES.ORGANIZATION_DETAIL.replace(':id', organizationId));
    } else {
      navigate(ROUTES.ORGANIZATIONS);
    }
  };

  if (isEditing && isLoadingVDC) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.info}
          title="Loading VDC details..."
          isInline
        />
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
              <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to={ROUTES.ORGANIZATIONS}>Organizations</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to={ROUTES.VDCS}>Virtual Data Centers</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              {isEditing ? 'Edit VDC' : 'Create VDC'}
            </BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Title headingLevel="h1" size="xl">
            {isEditing
              ? 'Edit Virtual Data Center'
              : 'Create Virtual Data Center'}
          </Title>
        </StackItem>

        {/* Warning for Provider VDC requirement */}
        <StackItem>
          <Alert
            variant={AlertVariant.warning}
            title="Provider VDC Required"
            isInline
          >
            This form uses a placeholder Provider VDC for demonstration
            purposes. The Provider VDC is automatically set to
            'provider-vdc-placeholder-001'. In a production environment, this
            would be populated from available Provider VDCs in your vCloud
            Director setup.
          </Alert>
        </StackItem>

        {/* VDC Form */}
        <StackItem>
          <Card>
            <CardBody>
              <Form onSubmit={handleSubmit}>
                <Grid hasGutter>
                  {/* Basic Information */}
                  <GridItem span={12}>
                    <Title headingLevel="h2" size="lg">
                      Basic Information
                    </Title>
                  </GridItem>

                  <GridItem span={6}>
                    <FormGroup label="VDC Name" fieldId="vdc-name" isRequired>
                      <TextInput
                        id="vdc-name"
                        value={formData.name}
                        onChange={(_, value) =>
                          setFormData({ ...formData, name: value })
                        }
                        validated={errors.name ? 'error' : 'default'}
                        placeholder="Enter VDC name"
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem span={6}>
                    <FormGroup
                      label="Allocation Model"
                      fieldId="allocation-model"
                      isRequired
                    >
                      <FormSelect
                        id="allocation-model"
                        value={formData.allocationModel}
                        onChange={(_, value) =>
                          setFormData({
                            ...formData,
                            allocationModel:
                              value as CreateVDCRequest['allocationModel'],
                          })
                        }
                      >
                        <FormSelectOption
                          value="PayAsYouGo"
                          label="Pay As You Go"
                        />
                        <FormSelectOption
                          value="AllocationPool"
                          label="Allocation Pool"
                        />
                        <FormSelectOption
                          value="ReservationPool"
                          label="Reservation Pool"
                        />
                        <FormSelectOption value="Flex" label="Flex" />
                      </FormSelect>
                    </FormGroup>
                  </GridItem>

                  <GridItem span={12}>
                    <FormGroup label="Description" fieldId="vdc-description">
                      <TextArea
                        id="vdc-description"
                        value={formData.description}
                        onChange={(_, value) =>
                          setFormData({ ...formData, description: value })
                        }
                        placeholder="Enter VDC description (optional)"
                        rows={3}
                      />
                    </FormGroup>
                  </GridItem>

                  {/* Compute Capacity */}
                  <GridItem span={12}>
                    <Title headingLevel="h2" size="lg">
                      Compute Capacity
                    </Title>
                  </GridItem>

                  <GridItem span={6}>
                    <FormGroup
                      label="CPU Allocated (MHz)"
                      fieldId="cpu-allocated"
                    >
                      <NumberInput
                        id="cpu-allocated"
                        value={formData.computeCapacity.cpu.allocated}
                        onMinus={() =>
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              cpu: {
                                ...formData.computeCapacity.cpu,
                                allocated: Math.max(
                                  0,
                                  formData.computeCapacity.cpu.allocated - 100
                                ),
                              },
                            },
                          })
                        }
                        onPlus={() =>
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              cpu: {
                                ...formData.computeCapacity.cpu,
                                allocated:
                                  formData.computeCapacity.cpu.allocated + 100,
                              },
                            },
                          })
                        }
                        onChange={(event) => {
                          const value =
                            parseInt(
                              (event.target as HTMLInputElement).value
                            ) || 0;
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              cpu: {
                                ...formData.computeCapacity.cpu,
                                allocated: value,
                              },
                            },
                          });
                        }}
                        min={0}
                        step={100}
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem span={6}>
                    <FormGroup label="CPU Limit (MHz)" fieldId="cpu-limit">
                      <NumberInput
                        id="cpu-limit"
                        value={formData.computeCapacity.cpu.limit}
                        onMinus={() =>
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              cpu: {
                                ...formData.computeCapacity.cpu,
                                limit: Math.max(
                                  0,
                                  formData.computeCapacity.cpu.limit - 100
                                ),
                              },
                            },
                          })
                        }
                        onPlus={() =>
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              cpu: {
                                ...formData.computeCapacity.cpu,
                                limit: formData.computeCapacity.cpu.limit + 100,
                              },
                            },
                          })
                        }
                        onChange={(event) => {
                          const value =
                            parseInt(
                              (event.target as HTMLInputElement).value
                            ) || 0;
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              cpu: {
                                ...formData.computeCapacity.cpu,
                                limit: value,
                              },
                            },
                          });
                        }}
                        min={0}
                        step={100}
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem span={6}>
                    <FormGroup
                      label="Memory Allocated (MB)"
                      fieldId="memory-allocated"
                    >
                      <NumberInput
                        id="memory-allocated"
                        value={formData.computeCapacity.memory.allocated}
                        onMinus={() =>
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              memory: {
                                ...formData.computeCapacity.memory,
                                allocated: Math.max(
                                  0,
                                  formData.computeCapacity.memory.allocated -
                                    512
                                ),
                              },
                            },
                          })
                        }
                        onPlus={() =>
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              memory: {
                                ...formData.computeCapacity.memory,
                                allocated:
                                  formData.computeCapacity.memory.allocated +
                                  512,
                              },
                            },
                          })
                        }
                        onChange={(event) => {
                          const value =
                            parseInt(
                              (event.target as HTMLInputElement).value
                            ) || 0;
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              memory: {
                                ...formData.computeCapacity.memory,
                                allocated: value,
                              },
                            },
                          });
                        }}
                        min={0}
                        step={512}
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem span={6}>
                    <FormGroup label="Memory Limit (MB)" fieldId="memory-limit">
                      <NumberInput
                        id="memory-limit"
                        value={formData.computeCapacity.memory.limit}
                        onMinus={() =>
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              memory: {
                                ...formData.computeCapacity.memory,
                                limit: Math.max(
                                  0,
                                  formData.computeCapacity.memory.limit - 512
                                ),
                              },
                            },
                          })
                        }
                        onPlus={() =>
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              memory: {
                                ...formData.computeCapacity.memory,
                                limit:
                                  formData.computeCapacity.memory.limit + 512,
                              },
                            },
                          })
                        }
                        onChange={(event) => {
                          const value =
                            parseInt(
                              (event.target as HTMLInputElement).value
                            ) || 0;
                          setFormData({
                            ...formData,
                            computeCapacity: {
                              ...formData.computeCapacity,
                              memory: {
                                ...formData.computeCapacity.memory,
                                limit: value,
                              },
                            },
                          });
                        }}
                        min={0}
                        step={512}
                      />
                    </FormGroup>
                  </GridItem>

                  {/* Network Configuration */}
                  <GridItem span={12}>
                    <Title headingLevel="h2" size="lg">
                      Network Configuration
                    </Title>
                  </GridItem>

                  <GridItem span={6}>
                    <FormGroup label="NIC Quota" fieldId="nic-quota">
                      <NumberInput
                        id="nic-quota"
                        value={formData.nicQuota}
                        onMinus={() =>
                          setFormData({
                            ...formData,
                            nicQuota: Math.max(
                              1,
                              (formData.nicQuota || 100) - 10
                            ),
                          })
                        }
                        onPlus={() =>
                          setFormData({
                            ...formData,
                            nicQuota: (formData.nicQuota || 100) + 10,
                          })
                        }
                        onChange={(event) => {
                          const value =
                            parseInt(
                              (event.target as HTMLInputElement).value
                            ) || 100;
                          setFormData({ ...formData, nicQuota: value });
                        }}
                        min={1}
                        step={10}
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem span={6}>
                    <FormGroup label="Network Quota" fieldId="network-quota">
                      <NumberInput
                        id="network-quota"
                        value={formData.networkQuota}
                        onMinus={() =>
                          setFormData({
                            ...formData,
                            networkQuota: Math.max(
                              1,
                              (formData.networkQuota || 50) - 5
                            ),
                          })
                        }
                        onPlus={() =>
                          setFormData({
                            ...formData,
                            networkQuota: (formData.networkQuota || 50) + 5,
                          })
                        }
                        onChange={(event) => {
                          const value =
                            parseInt(
                              (event.target as HTMLInputElement).value
                            ) || 50;
                          setFormData({ ...formData, networkQuota: value });
                        }}
                        min={1}
                        step={5}
                      />
                    </FormGroup>
                  </GridItem>

                  {/* Options */}
                  <GridItem span={12}>
                    <Title headingLevel="h2" size="lg">
                      Options
                    </Title>
                  </GridItem>

                  <GridItem span={6}>
                    <FormGroup label="Thin Provision" fieldId="thin-provision">
                      <Switch
                        id="thin-provision"
                        isChecked={formData.isThinProvision}
                        onChange={(_, checked) =>
                          setFormData({
                            ...formData,
                            isThinProvision: checked,
                          })
                        }
                        label="Enabled"
                      />
                    </FormGroup>
                  </GridItem>

                  <GridItem span={6}>
                    <FormGroup label="VDC Status" fieldId="vdc-enabled">
                      <Switch
                        id="vdc-enabled"
                        isChecked={formData.isEnabled}
                        onChange={(_, checked) =>
                          setFormData({
                            ...formData,
                            isEnabled: checked,
                          })
                        }
                        label="Enabled"
                      />
                    </FormGroup>
                  </GridItem>

                  {/* Action Buttons */}
                  <GridItem span={12}>
                    <ActionGroup>
                      <Button
                        variant="primary"
                        type="submit"
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting}
                      >
                        {isEditing ? 'Update VDC' : 'Create VDC'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleCancel}
                        isDisabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </ActionGroup>
                  </GridItem>
                </Grid>
              </Form>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default VDCForm;
