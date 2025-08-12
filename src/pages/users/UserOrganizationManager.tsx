import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Form,
  FormGroup,
  Stack,
  StackItem,
  Title,
  Alert,
  AlertVariant,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { SaveIcon, TimesIcon } from '@patternfly/react-icons';
import { useUpdateUserOrganization } from '../../hooks/useUsers';
import { useOrganizations } from '../../hooks';
import type { User, Organization } from '../../types';

interface UserOrganizationManagerProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const UserOrganizationManager: React.FC<UserOrganizationManagerProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalOrgId, setOriginalOrgId] = useState<string>('');

  const updateOrgMutation = useUpdateUserOrganization();
  const { data: organizationsResponse } = useOrganizations();

  const organizations = organizationsResponse?.data || [];

  // Initialize organization when user changes or modal opens
  useEffect(() => {
    if (user && isOpen) {
      const currentOrgId = user.orgEntityRef?.id || '';
      setSelectedOrgId(currentOrgId);
      setOriginalOrgId(currentOrgId);
      setError('');
      setHasChanges(false);
    }
  }, [user, isOpen]);

  // Track changes
  useEffect(() => {
    setHasChanges(selectedOrgId !== originalOrgId);
  }, [selectedOrgId, originalOrgId]);

  const handleSave = async () => {
    if (!selectedOrgId) {
      setError('Please select an organization');
      return;
    }

    try {
      const selectedOrg = organizations.find((org) => org.id === selectedOrgId);
      if (!selectedOrg) {
        setError('Selected organization not found');
        return;
      }

      await updateOrgMutation.mutateAsync({
        userId: user.id,
        orgEntityRef: {
          id: selectedOrg.id,
          name: selectedOrg.displayName || selectedOrg.name,
        },
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update user organization'
      );
    }
  };

  const handleCancel = () => {
    setSelectedOrgId(originalOrgId);
    setError('');
    setHasChanges(false);
    onClose();
  };

  const getCurrentOrganization = (): Organization | undefined => {
    return organizations.find((org) => org.id === originalOrgId);
  };

  const getSelectedOrganization = (): Organization | undefined => {
    return organizations.find((org) => org.id === selectedOrgId);
  };

  const currentOrg = getCurrentOrganization();
  const selectedOrg = getSelectedOrganization();

  return (
    <Modal
      variant={ModalVariant.medium}
      title={`Change Organization for ${user.name || user.username}`}
      isOpen={isOpen}
      onClose={handleCancel}
    >
      <Stack hasGutter>
        {error && (
          <StackItem>
            <Alert variant={AlertVariant.danger} title="Error" isInline>
              {error}
            </Alert>
          </StackItem>
        )}

        {/* Current Organization */}
        <StackItem>
          <Title headingLevel="h3" size="lg">
            Current Organization
          </Title>
          {currentOrg ? (
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>
                  {currentOrg.displayName || currentOrg.name}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Description</DescriptionListTerm>
                <DescriptionListDescription>
                  {currentOrg.description || (
                    <span className="pf-v6-u-color-200">No description</span>
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                  <span
                    className={`pf-v6-c-badge ${currentOrg.isEnabled ? 'pf-m-green' : 'pf-m-red'}`}
                  >
                    {currentOrg.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : (
            <Alert
              variant={AlertVariant.warning}
              title="No Organization"
              isInline
            >
              This user is not currently assigned to any organization.
            </Alert>
          )}
        </StackItem>

        {/* New Organization Selection */}
        <StackItem>
          <Form>
            <FormGroup
              label="New Organization"
              isRequired
              fieldId="organization-select"
            >
              <FormSelect
                value={selectedOrgId}
                onChange={(_, value) => {
                  setSelectedOrgId(value);
                  if (error) setError('');
                }}
                id="organization-select"
                name="organization-select"
              >
                <FormSelectOption
                  key=""
                  value=""
                  label="Select an organization"
                />
                {organizations.map((org) => (
                  <FormSelectOption
                    key={org.id}
                    value={org.id}
                    label={`${org.displayName || org.name} ${!org.isEnabled ? '(Disabled)' : ''}`}
                    isDisabled={!org.isEnabled}
                  />
                ))}
              </FormSelect>
              {error && (
                <HelperText>
                  <HelperTextItem variant="error">{error}</HelperTextItem>
                </HelperText>
              )}
            </FormGroup>
          </Form>
        </StackItem>

        {/* Selected Organization Preview */}
        {selectedOrg && selectedOrgId !== originalOrgId && (
          <StackItem>
            <div className="pf-v6-u-border-top pf-v6-u-pt-md">
              <Title headingLevel="h4" size="md" className="pf-v6-u-mb-sm">
                New Organization Details
              </Title>
              <DescriptionList isHorizontal isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Name</DescriptionListTerm>
                  <DescriptionListDescription>
                    {selectedOrg.displayName || selectedOrg.name}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Description</DescriptionListTerm>
                  <DescriptionListDescription>
                    {selectedOrg.description || (
                      <span className="pf-v6-u-color-200">No description</span>
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Status</DescriptionListTerm>
                  <DescriptionListDescription>
                    <span
                      className={`pf-v6-c-badge ${selectedOrg.isEnabled ? 'pf-m-green' : 'pf-m-red'}`}
                    >
                      {selectedOrg.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </div>
          </StackItem>
        )}

        {/* Warning about organization change */}
        {hasChanges && (
          <StackItem>
            <Alert variant={AlertVariant.warning} title="Important" isInline>
              Changing the user's organization will affect their access to
              resources. Make sure the user has appropriate roles assigned for
              the new organization.
            </Alert>
          </StackItem>
        )}

        {/* Action Buttons */}
        <StackItem>
          <div className="pf-v6-u-display-flex pf-v6-u-gap-md">
            <Button
              variant="primary"
              onClick={handleSave}
              isDisabled={!hasChanges || updateOrgMutation.isPending}
              isLoading={updateOrgMutation.isPending}
              icon={<SaveIcon />}
            >
              Update Organization
            </Button>
            <Button variant="link" onClick={handleCancel} icon={<TimesIcon />}>
              Cancel
            </Button>
          </div>
        </StackItem>
      </Stack>
    </Modal>
  );
};

export default UserOrganizationManager;
