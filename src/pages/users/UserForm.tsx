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
  Checkbox,
  HelperText,
  HelperTextItem,
  ValidatedOptions,
} from '@patternfly/react-core';
import {
  SaveIcon,
  TimesIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@patternfly/react-icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser, useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { useOrganizations, useAllRoles } from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { User, CreateUserRequest, UpdateUserRequest } from '../../types';

interface UserFormProps {
  initialData?: User;
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface FormData {
  username: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationId: string;
  roles: string[];
  enabled: boolean;
}

interface FormErrors {
  username?: string;
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  organizationId?: string;
  roles?: string;
  enabled?: string;
  general?: string;
}

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onCancel,
  onSuccess,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(initialData || (id && id !== 'create'));
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationId: '',
    roles: [],
    enabled: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<FormData | null>(null);

  // Hooks - only fetch user data if we're actually editing and don't have initial data
  const { data: userResponse, isLoading } = useUser(
    isEditing && !initialData && id && id !== 'create' ? id : ''
  );
  const { data: organizationsResponse } = useOrganizations();
  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError,
  } = useAllRoles();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const user = initialData || userResponse?.data;
  const organizations = organizationsResponse?.data || [];

  // Fallback roles if API fails
  const fallbackRoles = [
    {
      id: 'urn:vcloud:role:system-admin',
      name: 'System Administrator',
      description: 'Full system administration privileges',
      bundleKey: 'role.system.admin',
      readOnly: true,
    },
    {
      id: 'urn:vcloud:role:org-admin',
      name: 'Organization Administrator',
      description: 'Organization administration privileges',
      bundleKey: 'role.org.admin',
      readOnly: true,
    },
    {
      id: 'urn:vcloud:role:vapp-user',
      name: 'vApp User',
      description: 'Virtual application user privileges',
      bundleKey: 'role.vapp.user',
      readOnly: true,
    },
  ];

  const roles = rolesData || (rolesError ? fallbackRoles : []);

  // Load user data for editing
  useEffect(() => {
    if (isEditing && user) {
      const data = {
        username: user.username,
        name: user.name || user.fullName || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        organizationId: user.orgEntityRef?.id || '',
        roles: user.roleEntityRefs?.map((role) => role.name) || [],
        enabled: user.enabled,
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [isEditing, user]);

  // Track changes
  useEffect(() => {
    if (originalData) {
      const hasFormChanges = Object.keys(formData).some(
        (key) =>
          formData[key as keyof FormData] !==
          originalData[key as keyof FormData]
      );
      setHasChanges(hasFormChanges);
    } else if (!isEditing) {
      // For new users, check if any required fields are filled
      setHasChanges(
        formData.username !== '' ||
          formData.name !== '' ||
          formData.email !== '' ||
          formData.password !== ''
      );
    }
  }, [formData, originalData, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      newErrors.username =
        'Username can only contain letters, numbers, dots, underscores, and hyphens';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (required for new users)
    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Password is required for new users';
      } else if (formData.password.length < 7) {
        newErrors.password = 'Password must be at least 7 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (
      formData.password &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Organization validation
    if (!formData.organizationId) {
      newErrors.organizationId = 'Organization is required';
    }

    // Roles validation
    if (formData.roles.length === 0) {
      newErrors.roles = 'At least one role must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const organization = organizations.find(
        (org) => org.id === formData.organizationId
      );
      const roleEntityRefs = formData.roles.map((roleName) => {
        const role = roles.find((r) => r.name === roleName);
        if (!role) {
          throw new Error(`Role '${roleName}' not found`);
        }
        return {
          id: role.id, // Use the proper URN ID from the role data
          name: role.name,
        };
      });

      if (isEditing && user) {
        const updateData: UpdateUserRequest = {
          id: user.id,
          name: formData.name || undefined,
          email: formData.email || undefined,
          enabled: formData.enabled,
          orgEntityRef: organization
            ? {
                id: organization.id,
                name: organization.displayName || organization.name,
              }
            : undefined,
          roleEntityRefs,
        };

        // Only include password if it was changed
        if (formData.password) {
          updateData.password = formData.password;
        }

        await updateMutation.mutateAsync(updateData);

        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/admin/users/${user.id}`);
        }
      } else {
        const createData: CreateUserRequest = {
          username: formData.username,
          name: formData.name || undefined,
          email: formData.email || undefined,
          password: formData.password,
          enabled: formData.enabled,
          orgEntityRef: organization
            ? {
                id: organization.id,
                name: organization.displayName || organization.name,
              }
            : undefined,
          roleEntityRefs,
        };

        const result = await createMutation.mutateAsync(createData);

        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/admin/users/${result.data?.id || ''}`);
        }
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to save user',
      });
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (isEditing) {
      navigate(`/admin/users/${user?.id || ''}`);
    } else {
      navigate('/admin/users');
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRoleChange = (roleName: string, checked: boolean) => {
    const newRoles = checked
      ? [...formData.roles, roleName]
      : formData.roles.filter((role) => role !== roleName);
    handleInputChange('roles', newRoles);
  };

  if (isLoading || rolesLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  const pageTitle = isEditing ? 'Edit User' : 'Create User';
  const submitButtonText = isEditing ? 'Update User' : 'Create User';

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        {!onCancel && (
          <StackItem>
            <Breadcrumb>
              <BreadcrumbItem>
                <Link to="/admin">Administration</Link>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <Link to="/admin/users">Users</Link>
              </BreadcrumbItem>
              {isEditing && user && (
                <BreadcrumbItem>
                  <Link to={`/admin/users/${user.id}`}>
                    {user.name || user.username}
                  </Link>
                </BreadcrumbItem>
              )}
              <BreadcrumbItem isActive>
                {isEditing ? 'Edit' : 'Create'}
              </BreadcrumbItem>
            </Breadcrumb>
          </StackItem>
        )}

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                {pageTitle}
              </Title>
              <p className="pf-v6-u-color-200">
                {isEditing
                  ? 'Update user information, roles, and settings'
                  : 'Create a new user account with appropriate roles and organization assignment'}
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
                  {/* General Error Alert */}
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

                  {/* Basic Information Section */}
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      Basic Information
                    </Title>
                  </StackItem>

                  <StackItem>
                    <FormGroup label="Username" isRequired fieldId="username">
                      <TextInput
                        isRequired
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={(_, value) =>
                          handleInputChange('username', value)
                        }
                        isDisabled={isEditing} // Username cannot be changed after creation
                      />
                      {errors.username && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {errors.username}
                          </HelperTextItem>
                        </HelperText>
                      )}
                      {isEditing && (
                        <HelperText>
                          <HelperTextItem>
                            Username cannot be changed after creation
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>

                  <StackItem>
                    <FormGroup label="Full Name" fieldId="name">
                      <TextInput
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(_, value) =>
                          handleInputChange('name', value)
                        }
                        placeholder="Enter user's full name"
                      />
                      {errors.name && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {errors.name}
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>

                  <StackItem>
                    <FormGroup label="Email Address" fieldId="email">
                      <TextInput
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={(_, value) =>
                          handleInputChange('email', value)
                        }
                        validated={
                          errors.email
                            ? ValidatedOptions.error
                            : ValidatedOptions.default
                        }
                        placeholder="user@example.com"
                      />
                      {errors.email && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {errors.email}
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>

                  {/* Password Section */}
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      {isEditing ? 'Change Password' : 'Password'}
                    </Title>
                  </StackItem>

                  <StackItem>
                    <FormGroup
                      label="Password"
                      isRequired={!isEditing}
                      fieldId="password"
                    >
                      <div className="pf-v6-c-input-group">
                        <TextInput
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={(_, value) =>
                            handleInputChange('password', value)
                          }
                          validated={
                            errors.password
                              ? ValidatedOptions.error
                              : ValidatedOptions.default
                          }
                          placeholder={
                            isEditing
                              ? 'Leave blank to keep current password'
                              : 'Enter password'
                          }
                        />
                        <Button
                          variant="control"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                        >
                          {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </Button>
                      </div>
                      {errors.password && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {errors.password}
                          </HelperTextItem>
                        </HelperText>
                      )}
                      {!isEditing && (
                        <HelperText>
                          <HelperTextItem>
                            Password must be at least 7 characters
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>

                  <StackItem>
                    <FormGroup
                      label="Confirm Password"
                      isRequired={!isEditing && formData.password !== ''}
                      fieldId="confirmPassword"
                    >
                      <TextInput
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(_, value) =>
                          handleInputChange('confirmPassword', value)
                        }
                        validated={
                          errors.confirmPassword
                            ? ValidatedOptions.error
                            : ValidatedOptions.default
                        }
                        placeholder="Confirm password"
                      />
                      {errors.confirmPassword && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {errors.confirmPassword}
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>

                  {/* Organization & Roles Section */}
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      Organization & Roles
                    </Title>
                  </StackItem>

                  <StackItem>
                    <FormGroup
                      label="Organization"
                      isRequired
                      fieldId="organizationId"
                    >
                      <FormSelect
                        value={formData.organizationId}
                        onChange={(_, value) =>
                          handleInputChange('organizationId', value)
                        }
                        id="organizationId"
                        name="organizationId"
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
                            label={org.displayName || org.name}
                          />
                        ))}
                      </FormSelect>
                      {errors.organizationId && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {errors.organizationId}
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>

                  <StackItem>
                    <FormGroup label="Roles" isRequired fieldId="roles">
                      {rolesError && (
                        <Alert
                          variant={AlertVariant.warning}
                          title="Role Loading Error"
                          isInline
                        >
                          Unable to load roles from server. Using default roles.
                        </Alert>
                      )}
                      <Stack>
                        {roles.length === 0 ? (
                          <StackItem>
                            <Alert
                              variant={AlertVariant.info}
                              title="No Roles Available"
                              isInline
                            >
                              No roles are currently available. Please contact
                              your administrator.
                            </Alert>
                          </StackItem>
                        ) : (
                          roles.map((role) => (
                            <StackItem key={role.id}>
                              <Checkbox
                                label={role.name}
                                id={`role-${role.id}`}
                                isChecked={formData.roles.includes(role.name)}
                                onChange={(_, checked) =>
                                  handleRoleChange(role.name, checked)
                                }
                              />
                            </StackItem>
                          ))
                        )}
                      </Stack>
                      {errors.roles && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {errors.roles}
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>

                  {/* Account Settings Section */}
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      Account Settings
                    </Title>
                  </StackItem>

                  <StackItem>
                    <FormGroup label="Account Status" fieldId="enabled">
                      <Switch
                        id="enabled"
                        label="Enabled"
                        isChecked={formData.enabled}
                        onChange={(_, checked) =>
                          handleInputChange('enabled', checked)
                        }
                      />
                      <HelperText>
                        <HelperTextItem>
                          {formData.enabled
                            ? 'User can log in and access the system'
                            : 'User cannot log in (account is disabled)'}
                        </HelperTextItem>
                      </HelperText>
                    </FormGroup>
                  </StackItem>

                  {/* Action Buttons */}
                  <StackItem>
                    <ActionGroup>
                      <Button
                        variant="primary"
                        type="submit"
                        icon={<SaveIcon />}
                        isDisabled={
                          !hasChanges ||
                          createMutation.isPending ||
                          updateMutation.isPending
                        }
                        isLoading={
                          createMutation.isPending || updateMutation.isPending
                        }
                      >
                        {submitButtonText}
                      </Button>
                      <Button
                        variant="link"
                        onClick={handleCancel}
                        icon={<TimesIcon />}
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

export default UserForm;
