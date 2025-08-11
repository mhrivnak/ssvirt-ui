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
  Checkbox,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { SaveIcon, TimesIcon } from '@patternfly/react-icons';
import { useUpdateUserRoles } from '../../hooks/useUsers';
import type { User } from '../../types';

interface UserRoleManagerProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface RoleOption {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
}

const AVAILABLE_ROLES: RoleOption[] = [
  {
    id: 'system-admin',
    name: 'System Administrator',
    description: 'Full system access and organization management',
    isSystemRole: true,
  },
  {
    id: 'org-admin',
    name: 'Organization Administrator',
    description: 'Full access within assigned organization',
    isSystemRole: false,
  },
  {
    id: 'vapp-user',
    name: 'vApp User',
    description: 'Basic user access to assigned vApps',
    isSystemRole: false,
  },
];

const UserRoleManager: React.FC<UserRoleManagerProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalRoles, setOriginalRoles] = useState<string[]>([]);

  const updateRolesMutation = useUpdateUserRoles();

  // Initialize roles when user changes or modal opens
  useEffect(() => {
    if (user && isOpen) {
      const currentRoles = user.roleEntityRefs?.map((role) => role.name) || [];
      setSelectedRoles(currentRoles);
      setOriginalRoles(currentRoles);
      setError('');
      setHasChanges(false);
    }
  }, [user, isOpen]);

  // Track changes
  useEffect(() => {
    const rolesChanged =
      selectedRoles.length !== originalRoles.length ||
      selectedRoles.some((role) => !originalRoles.includes(role)) ||
      originalRoles.some((role) => !selectedRoles.includes(role));

    setHasChanges(rolesChanged);
  }, [selectedRoles, originalRoles]);

  const handleRoleChange = (roleName: string, checked: boolean) => {
    setSelectedRoles((prev) => {
      if (checked) {
        return [...prev, roleName];
      } else {
        return prev.filter((role) => role !== roleName);
      }
    });

    // Clear error when user makes changes
    if (error) {
      setError('');
    }
  };

  const handleSave = async () => {
    if (selectedRoles.length === 0) {
      setError('At least one role must be selected');
      return;
    }

    try {
      const roleEntityRefs = selectedRoles.map((roleName) => ({
        id: roleName.toLowerCase().replace(/\s+/g, '-'), // Create ID from name
        name: roleName,
      }));

      await updateRolesMutation.mutateAsync({
        userId: user.id,
        roleEntityRefs,
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update user roles'
      );
    }
  };

  const handleCancel = () => {
    setSelectedRoles(originalRoles);
    setError('');
    setHasChanges(false);
    onClose();
  };

  const getRoleLevel = (roleName: string): 'high' | 'medium' | 'low' => {
    if (roleName === 'System Administrator') return 'high';
    if (roleName === 'Organization Administrator') return 'medium';
    return 'low';
  };

  const getRoleBadgeColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'grey';
    }
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title={`Manage Roles for ${user.name || user.username}`}
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

        <StackItem>
          <Form>
            <FormGroup label="Assigned Roles" isRequired fieldId="user-roles">
              <Stack>
                <StackItem>
                  <HelperText>
                    <HelperTextItem>
                      Select the roles to assign to this user. Users can have
                      multiple roles.
                    </HelperTextItem>
                  </HelperText>
                </StackItem>

                {AVAILABLE_ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role.name);
                  getRoleLevel(role.name);

                  return (
                    <StackItem key={role.id}>
                      <Checkbox
                        label={
                          <div>
                            <div className="pf-v6-u-font-weight-bold">
                              {role.name}
                              {role.isSystemRole && (
                                <span className="pf-v6-u-ml-sm pf-v6-u-color-200">
                                  (System Role)
                                </span>
                              )}
                            </div>
                            <div className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                              {role.description}
                            </div>
                          </div>
                        }
                        id={`role-${role.id}`}
                        isChecked={isSelected}
                        onChange={(_, checked) =>
                          handleRoleChange(role.name, checked)
                        }
                      />
                    </StackItem>
                  );
                })}
              </Stack>

              {error && (
                <HelperText>
                  <HelperTextItem variant="error">{error}</HelperTextItem>
                </HelperText>
              )}
            </FormGroup>
          </Form>
        </StackItem>

        {/* Current Roles Summary */}
        {selectedRoles.length > 0 && (
          <StackItem>
            <div className="pf-v6-u-border-top pf-v6-u-pt-md">
              <Title headingLevel="h4" size="md" className="pf-v6-u-mb-sm">
                Selected Roles Summary
              </Title>
              <Stack>
                {selectedRoles.map((roleName) => {
                  const level = getRoleLevel(roleName);
                  return (
                    <StackItem key={roleName}>
                      <div className="pf-v6-u-display-flex pf-v6-u-align-items-center">
                        <span
                          className={`pf-v6-c-badge pf-m-${getRoleBadgeColor(level)} pf-v6-u-mr-sm`}
                        >
                          {level.toUpperCase()}
                        </span>
                        <span>{roleName}</span>
                      </div>
                    </StackItem>
                  );
                })}
              </Stack>
            </div>
          </StackItem>
        )}

        {/* Role Hierarchy Information */}
        <StackItem>
          <div className="pf-v6-u-border-top pf-v6-u-pt-md">
            <Title headingLevel="h4" size="md" className="pf-v6-u-mb-sm">
              Role Hierarchy
            </Title>
            <HelperText>
              <HelperTextItem>
                <strong>System Administrator:</strong> Highest level access. Can
                manage all organizations, users, and system settings.
              </HelperTextItem>
              <HelperTextItem>
                <strong>Organization Administrator:</strong> Can manage users
                and resources within their assigned organization.
              </HelperTextItem>
              <HelperTextItem>
                <strong>vApp User:</strong> Basic access to assigned virtual
                applications and resources.
              </HelperTextItem>
            </HelperText>
          </div>
        </StackItem>

        {/* Action Buttons */}
        <StackItem>
          <div className="pf-v6-u-display-flex pf-v6-u-gap-md">
            <Button
              variant="primary"
              onClick={handleSave}
              isDisabled={!hasChanges || updateRolesMutation.isPending}
              isLoading={updateRolesMutation.isPending}
              icon={<SaveIcon />}
            >
              Save Changes
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

export default UserRoleManager;
