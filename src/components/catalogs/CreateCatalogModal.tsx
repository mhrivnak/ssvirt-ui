import React, { useState } from 'react';
import {
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Switch,
  Button,
  Alert,
  AlertVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useCreateCatalog } from '../../hooks';
import type { CreateCatalogRequest } from '../../types';

interface CreateCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
}

interface FormData {
  name: string;
  description: string;
  isPublished: boolean;
}

const CreateCatalogModal: React.FC<CreateCatalogModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isPublished: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createCatalogMutation = useCreateCatalog();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Catalog name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Catalog name must be 255 characters or less';
    }

    if (formData.description.length > 1024) {
      newErrors.description = 'Description must be 1024 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    console.log('Create Catalog form submitted!');
    event.preventDefault();

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, creating catalog...');

    const createRequest: CreateCatalogRequest = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      orgId: organizationId,
      isPublished: formData.isPublished,
    };

    try {
      await createCatalogMutation.mutateAsync(createRequest);
      handleClose();
    } catch (error) {
      // Error handling is done by the mutation hook
      console.error('Failed to create catalog:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      isPublished: false,
    });
    setErrors({});
    onClose();
  };

  const handleFieldChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title="Create Catalog"
      isOpen={isOpen}
      onClose={handleClose}
    >
      <div style={{ padding: '24px' }}>
        <Stack hasGutter>
          <StackItem>
            <Alert
              variant={AlertVariant.info}
              title="Organization Context"
              isInline
            >
              This catalog will be created in the organization:{' '}
              <strong>{organizationName}</strong>
            </Alert>
          </StackItem>

          {createCatalogMutation.error && (
            <StackItem>
              <Alert
                variant={AlertVariant.danger}
                title="Error creating catalog"
                isInline
              >
                {createCatalogMutation.error instanceof Error
                  ? createCatalogMutation.error.message
                  : 'An unexpected error occurred'}
              </Alert>
            </StackItem>
          )}

          <StackItem>
            <Form onSubmit={handleSubmit}>
              <Stack hasGutter>
                {/* Catalog Name */}
                <StackItem>
                  <FormGroup
                    label="Catalog Name"
                    isRequired
                    fieldId="catalog-name"
                  >
                    <TextInput
                      isRequired
                      type="text"
                      id="catalog-name"
                      value={formData.name}
                      onChange={(_, value) => handleFieldChange('name', value)}
                      validated={errors.name ? 'error' : 'default'}
                      placeholder="Enter catalog name"
                      maxLength={255}
                    />
                    {errors.name && (
                      <small className="pf-v6-u-color-danger pf-v6-u-font-size-sm">
                        {errors.name}
                      </small>
                    )}
                  </FormGroup>
                </StackItem>

                {/* Description */}
                <StackItem>
                  <FormGroup label="Description" fieldId="catalog-description">
                    <TextArea
                      id="catalog-description"
                      value={formData.description}
                      onChange={(_, value) =>
                        handleFieldChange('description', value)
                      }
                      validated={errors.description ? 'error' : 'default'}
                      placeholder="Enter catalog description (optional)"
                      rows={3}
                      maxLength={1024}
                    />
                    <small className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                      Optional description for the catalog (
                      {formData.description.length}/1024 characters)
                    </small>
                    {errors.description && (
                      <small className="pf-v6-u-color-danger pf-v6-u-font-size-sm pf-v6-u-mt-xs">
                        {errors.description}
                      </small>
                    )}
                  </FormGroup>
                </StackItem>

                {/* Published Status */}
                <StackItem>
                  <FormGroup
                    label="Published Status"
                    fieldId="catalog-published"
                  >
                    <Switch
                      id="catalog-published"
                      label="Published"
                      isChecked={formData.isPublished}
                      onChange={(_, checked) =>
                        handleFieldChange('isPublished', checked)
                      }
                      aria-label="Catalog published status"
                    />
                    <small className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                      Published catalogs are visible to all organization members
                    </small>
                  </FormGroup>
                </StackItem>

                {/* Form Buttons */}
                <StackItem>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Button
                      variant="link"
                      onClick={handleClose}
                      isDisabled={createCatalogMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      isLoading={createCatalogMutation.isPending}
                      isDisabled={createCatalogMutation.isPending}
                    >
                      Create Catalog
                    </Button>
                  </div>
                </StackItem>
              </Stack>
            </Form>
          </StackItem>
        </Stack>
      </div>
    </Modal>
  );
};

export default CreateCatalogModal;
