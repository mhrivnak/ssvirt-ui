import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Button,
  Alert,
  AlertVariant,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Label,
} from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom';
import { useCreateVApp, useVAppNameValidation } from '../../hooks/useVApps';
import VDCSelector from './VDCSelector';
import type { CatalogItem, CreateVAppFormData } from '../../types';

interface CreateVAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogItem: CatalogItem;
  onSuccess?: (vappId: string) => void;
}

const CreateVAppModal: React.FC<CreateVAppModalProps> = ({
  isOpen,
  onClose,
  catalogItem,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateVAppFormData>({
    name: '',
    description: '',
    vdcId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createVAppMutation = useCreateVApp();

  // Name validation with debouncing
  const { data: isNameValid, isLoading: isValidatingName } =
    useVAppNameValidation(formData.vdcId, formData.name);

  // Auto-generate vApp name based on template name
  useEffect(() => {
    if (isOpen && catalogItem && !formData.name) {
      // Create a suggested name based on template name
      const suggestedName = `${catalogItem.name}-vapp-${Date.now().toString().slice(-4)}`;
      setFormData((prev) => ({ ...prev, name: suggestedName }));
    }
  }, [isOpen, catalogItem, formData.name]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'vApp name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'vApp name must be at least 3 characters';
    } else if (formData.name.length > 128) {
      newErrors.name = 'vApp name must be 128 characters or less';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.name)) {
      newErrors.name =
        'vApp name can only contain letters, numbers, dots, underscores, and hyphens';
    } else if (isNameValid === false) {
      newErrors.name =
        'A vApp with this name already exists in the selected VDC';
    }

    // Description validation
    if (formData.description.length > 1024) {
      newErrors.description = 'Description must be 1024 characters or less';
    }

    // VDC validation
    if (!formData.vdcId) {
      newErrors.vdcId = 'Please select a target VDC';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isValidatingName) {
      // Wait for name validation to complete
      return;
    }

    try {
      const vapp = await createVAppMutation.mutateAsync({
        vdcId: formData.vdcId,
        request: {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          catalogItem: {
            id: catalogItem.id,
            name: catalogItem.name,
          },
        },
      });

      handleClose();

      if (onSuccess) {
        onSuccess(vapp.id);
      } else {
        // Navigate to vApp detail page
        navigate(`/vapps/${vapp.id}`);
      }
    } catch (error) {
      console.error('Failed to create vApp:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      vdcId: '',
    });
    setErrors({});
    onClose();
  };

  const handleFieldChange = (
    field: keyof CreateVAppFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const getNameValidation = () => {
    if (isValidatingName) return 'default';
    if (formData.name && isNameValid === false) return 'error';
    if (formData.name && isNameValid === true) return 'success';
    return errors.name ? 'error' : 'default';
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title="Create vApp from Template"
      isOpen={isOpen}
      onClose={handleClose}
    >
      <div style={{ padding: '24px' }}>
        <Stack hasGutter>
          {/* Template Context */}
          <StackItem>
            <Alert
              variant={AlertVariant.info}
              title="Template Information"
              isInline
            >
              <Split hasGutter>
                <SplitItem>
                  Creating vApp from template:{' '}
                  <strong>{catalogItem?.name}</strong>
                </SplitItem>
                {catalogItem?.versionNumber && (
                  <SplitItem>
                    <Label isCompact color="blue">
                      v{catalogItem.versionNumber}
                    </Label>
                  </SplitItem>
                )}
              </Split>
              {catalogItem?.description && (
                <p className="pf-v6-u-mt-sm">{catalogItem.description}</p>
              )}
            </Alert>
          </StackItem>

          {/* Error Display */}
          {createVAppMutation.error && (
            <StackItem>
              <Alert
                variant={AlertVariant.danger}
                title="Error creating vApp"
                isInline
              >
                {createVAppMutation.error instanceof Error
                  ? createVAppMutation.error.message
                  : 'An unexpected error occurred'}
              </Alert>
            </StackItem>
          )}

          {/* Form */}
          <StackItem>
            <Form onSubmit={handleSubmit}>
              <Stack hasGutter>
                {/* vApp Name */}
                <StackItem>
                  <FormGroup label="vApp Name" isRequired fieldId="vapp-name">
                    <TextInput
                      isRequired
                      type="text"
                      id="vapp-name"
                      value={formData.name}
                      onChange={(_, value) => handleFieldChange('name', value)}
                      validated={getNameValidation()}
                      placeholder="Enter vApp name"
                      maxLength={128}
                    />
                    {isValidatingName && (
                      <small className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                        Checking name availability...
                      </small>
                    )}
                    {isNameValid === true && (
                      <small className="pf-v6-u-color-success-300 pf-v6-u-font-size-sm">
                        Name is available
                      </small>
                    )}
                    {errors.name && (
                      <small className="pf-v6-u-color-danger-300 pf-v6-u-font-size-sm">
                        {errors.name}
                      </small>
                    )}
                  </FormGroup>
                </StackItem>

                {/* Description */}
                <StackItem>
                  <FormGroup label="Description" fieldId="vapp-description">
                    <TextArea
                      id="vapp-description"
                      value={formData.description}
                      onChange={(_, value) =>
                        handleFieldChange('description', value)
                      }
                      validated={errors.description ? 'error' : 'default'}
                      placeholder="Enter vApp description (optional)"
                      rows={3}
                      maxLength={1024}
                    />
                    <small className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                      Optional description for the vApp (
                      {formData.description.length}/1024 characters)
                    </small>
                    {errors.description && (
                      <small className="pf-v6-u-color-danger-300 pf-v6-u-font-size-sm">
                        {errors.description}
                      </small>
                    )}
                  </FormGroup>
                </StackItem>

                {/* VDC Selection */}
                <StackItem>
                  <VDCSelector
                    value={formData.vdcId}
                    onChange={(vdcId) => handleFieldChange('vdcId', vdcId)}
                    isRequired
                    validated={errors.vdcId ? 'error' : 'default'}
                    helperTextInvalid={errors.vdcId}
                    isDisabled={createVAppMutation.isPending}
                  />
                </StackItem>
              </Stack>
            </Form>
          </StackItem>

          {/* Actions */}
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
                isDisabled={createVAppMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                onClick={handleSubmit}
                isLoading={createVAppMutation.isPending}
                isDisabled={
                  createVAppMutation.isPending ||
                  isValidatingName ||
                  !formData.name ||
                  !formData.vdcId ||
                  isNameValid === false
                }
              >
                Create vApp
              </Button>
            </div>
          </StackItem>
        </Stack>
      </div>
    </Modal>
  );
};

export default CreateVAppModal;
