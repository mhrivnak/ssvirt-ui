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
  TextArea,
  Switch,
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbItem,
  ActionGroup,
} from '@patternfly/react-core';
import { SaveIcon, TimesIcon } from '@patternfly/react-icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useOrganization,
  useCreateOrganization,
  useUpdateOrganization,
} from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from '../../types';
import { ROUTES } from '../../utils/constants';

interface FormData {
  name: string;
  display_name: string;
  description: string;
  enabled: boolean;
}

interface FormErrors {
  name?: string;
  display_name?: string;
  description?: string;
  general?: string;
}

const OrganizationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    display_name: '',
    description: '',
    enabled: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<FormData | null>(null);

  // Hooks
  const { data: orgResponse, isLoading } = useOrganization(id!);
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();

  const organization = orgResponse?.data;

  // Load organization data for editing
  useEffect(() => {
    if (isEditing && organization) {
      const data = {
        name: organization.name,
        display_name: organization.display_name,
        description: organization.description || '',
        enabled: organization.enabled,
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [isEditing, organization]);

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
      // For new organizations, consider any non-empty fields as changes
      const hasData =
        formData.name || formData.display_name || formData.description;
      setHasChanges(Boolean(hasData));
    }
  }, [formData, originalData, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Organization name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Organization name must be less than 50 characters';
    } else if (!/^[a-z0-9-]+$/.test(formData.name)) {
      newErrors.name =
        'Organization name can only contain lowercase letters, numbers, and hyphens';
    }

    // Display name validation
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    } else if (formData.display_name.length < 3) {
      newErrors.display_name = 'Display name must be at least 3 characters';
    } else if (formData.display_name.length > 100) {
      newErrors.display_name = 'Display name must be less than 100 characters';
    }

    // Description validation (optional but with limits)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific errors when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && id) {
        const updateData: UpdateOrganizationRequest = {
          id,
          name: formData.name,
          display_name: formData.display_name,
          description: formData.description || undefined,
          enabled: formData.enabled,
        };

        await updateMutation.mutateAsync(updateData);
        navigate(ROUTES.ORGANIZATION_DETAIL.replace(':id', id));
      } else {
        const createData: CreateOrganizationRequest = {
          name: formData.name,
          display_name: formData.display_name,
          description: formData.description || undefined,
          enabled: formData.enabled,
        };

        const response = await createMutation.mutateAsync(createData);
        navigate(ROUTES.ORGANIZATION_DETAIL.replace(':id', response.data.id));
      }
    } catch (error) {
      console.error('Failed to save organization:', error);
      const errorMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setErrors({
        general:
          errorMessage || 'Failed to save organization. Please try again.',
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
      navigate(ROUTES.ORGANIZATION_DETAIL.replace(':id', id));
    } else {
      navigate(ROUTES.ORGANIZATIONS);
    }
  };

  if (isEditing && isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (isEditing && !organization) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Organization not found"
          isInline
        >
          The organization you're trying to edit doesn't exist or you don't have
          permission to edit it.
        </Alert>
        <br />
        <Button
          variant="primary"
          onClick={() => navigate(ROUTES.ORGANIZATIONS)}
        >
          Back to Organizations
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
              <Link to={ROUTES.ORGANIZATIONS}>Organizations</Link>
            </BreadcrumbItem>
            {isEditing && organization && (
              <BreadcrumbItem>
                <Link to={ROUTES.ORGANIZATION_DETAIL.replace(':id', id!)}>
                  {organization.display_name}
                </Link>
              </BreadcrumbItem>
            )}
            <BreadcrumbItem isActive>
              {isEditing ? 'Edit Organization' : 'Create Organization'}
            </BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                {isEditing ? 'Edit Organization' : 'Create Organization'}
              </Title>
              <p className="pf-v6-u-color-200">
                {isEditing
                  ? 'Update organization settings and configuration'
                  : 'Create a new organization to manage users and resources'}
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

                  {/* Organization Name */}
                  <StackItem>
                    <FormGroup
                      label="Organization Name"
                      isRequired
                      fieldId="org-name"
                    >
                      <TextInput
                        isRequired
                        type="text"
                        id="org-name"
                        value={formData.name}
                        onChange={(_, value) =>
                          handleInputChange('name', value)
                        }
                        placeholder="my-organization"
                        isDisabled={isEditing} // Name cannot be changed after creation
                      />
                      {isEditing && (
                        <small className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                          Organization name cannot be changed after creation
                        </small>
                      )}
                    </FormGroup>
                  </StackItem>

                  {/* Display Name */}
                  <StackItem>
                    <FormGroup
                      label="Display Name"
                      isRequired
                      fieldId="org-display-name"
                    >
                      <TextInput
                        isRequired
                        type="text"
                        id="org-display-name"
                        value={formData.display_name}
                        onChange={(_, value) =>
                          handleInputChange('display_name', value)
                        }
                        placeholder="My Organization"
                      />
                    </FormGroup>
                  </StackItem>

                  {/* Description */}
                  <StackItem>
                    <FormGroup label="Description" fieldId="org-description">
                      <TextArea
                        id="org-description"
                        value={formData.description}
                        onChange={(_, value) =>
                          handleInputChange('description', value)
                        }
                        placeholder="Enter a description for this organization..."
                        rows={4}
                        resizeOrientation="vertical"
                      />
                      <small className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                        {formData.description.length}/500 characters
                      </small>
                    </FormGroup>
                  </StackItem>

                  {/* Status */}
                  <StackItem>
                    <FormGroup label="Status" fieldId="org-enabled">
                      <Switch
                        id="org-enabled"
                        label="Enabled"
                        isChecked={formData.enabled}
                        onChange={(_, checked) =>
                          handleInputChange('enabled', checked)
                        }
                        aria-label="Organization status"
                      />
                    </FormGroup>
                  </StackItem>

                  {/* Info Alert for New Organizations */}
                  {!isEditing && (
                    <StackItem>
                      <Alert
                        variant={AlertVariant.info}
                        title="Organization Setup"
                        isInline
                      >
                        After creating the organization, you can:
                        <ul className="pf-v6-u-mt-sm">
                          <li>Invite users and assign roles</li>
                          <li>Create Virtual Data Centers (VDCs)</li>
                          <li>Configure organization-specific catalogs</li>
                          <li>Set up resource quotas and limits</li>
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
                        {isEditing ? 'Save Changes' : 'Create Organization'}
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

export default OrganizationForm;
