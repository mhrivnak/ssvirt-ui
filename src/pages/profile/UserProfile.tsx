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
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbItem,
  ActionGroup,
  Grid,
  GridItem,
  Divider,
  Icon,
  Flex,
  FlexItem,
  Tabs,
  Tab,
  TabTitleText,
  TabContent,
  Switch,
  FormSelect,
  FormSelectOption,
  Label,
  Progress,
  ProgressMeasureLocation,
  Modal,
  ModalVariant,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import {
  SaveIcon,
  EditIcon,
  UserIcon,
  CogIcon,
  ShieldAltIcon,
  HistoryIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  TimesIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import {
  useAuth,
  useUserPreferences,
  useUpdateUserPreferences,
  useChangePassword,
  useSecuritySettings,
  useUpdateSecuritySetting,
} from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';
import { handleFormError } from '../../utils/errorHandler';
import { AuthService } from '../../services/api';
import type {
  UserPreferences,
  UpdatePreferencesRequest,
  ChangePasswordRequest,
  SecuritySetting,
  UpdateSecuritySettingRequest,
} from '../../types';

interface UserProfileData {
  first_name: string;
  last_name: string;
  email: string;
}

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface ActivityItem {
  id: string;
  action: string;
  resource: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
}

interface Notification {
  id: string;
  variant: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: number;
}

const UserProfile: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // API hooks
  const { data: userPreferencesData } = useUserPreferences();
  const { data: securitySettingsData } = useSecuritySettings();
  const updatePreferencesMutation = useUpdateUserPreferences();
  const changePasswordMutation = useChangePassword();
  const updateSecuritySettingMutation = useUpdateSecuritySetting();
  
  const [activeTabKey, setActiveTabKey] = useState<string>('profile');

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Profile form state
  const [profileData, setProfileData] = useState<UserProfileData>({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
    {}
  );
  const [profileHasChanges, setProfileHasChanges] = useState(false);
  const [originalProfileData, setOriginalProfileData] =
    useState<UserProfileData | null>(null);

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'auto',
    language: 'en',
    timezone: 'UTC',
    date_format: 'MM/dd/yyyy',
    time_format: '12h',
    notifications: {
      email: true,
      browser: false,
      vm_state_changes: true,
      system_maintenance: true,
    },
    default_items_per_page: 20,
    auto_refresh_interval: 30000,
  });
  const [preferencesHasChanges, setPreferencesHasChanges] = useState(false);
  const [originalPreferences, setOriginalPreferences] =
    useState<UserPreferences | null>(null);

  // Password change state
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Activity state
  const [activityItems] = useState<ActivityItem[]>([
    {
      id: '1',
      action: 'Login',
      resource: 'Web Portal',
      timestamp: '2024-01-15T10:30:00Z',
      ip_address: '192.168.1.100',
      user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    {
      id: '2',
      action: 'Created VM',
      resource: 'test-vm-01',
      timestamp: '2024-01-15T09:15:00Z',
      ip_address: '192.168.1.100',
      user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    {
      id: '3',
      action: 'Updated Profile',
      resource: 'User Settings',
      timestamp: '2024-01-14T16:45:00Z',
      ip_address: '192.168.1.100',
      user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  ]);

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([]);

  // Initialize profile data when user loads
  useEffect(() => {
    if (user) {
      const data = {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      };
      setProfileData(data);
      setOriginalProfileData(data);
    }
  }, [user]);

  // Initialize preferences from API
  useEffect(() => {
    if (userPreferencesData) {
      setPreferences(userPreferencesData);
      setOriginalPreferences(userPreferencesData);
    }
  }, [userPreferencesData]);

  // Initialize security settings from API
  useEffect(() => {
    if (securitySettingsData) {
      setSecuritySettings(securitySettingsData);
    }
  }, [securitySettingsData]);

  // Track profile changes
  useEffect(() => {
    if (originalProfileData) {
      const changed = Object.keys(profileData).some(
        (key) =>
          profileData[key as keyof UserProfileData] !==
          originalProfileData[key as keyof UserProfileData]
      );
      setProfileHasChanges(changed);
    }
  }, [profileData, originalProfileData]);

  // Track preferences changes
  useEffect(() => {
    if (originalPreferences) {
      const changed = Object.keys(preferences).some(
        (key) =>
          preferences[key as keyof UserPreferences] !==
          originalPreferences[key as keyof UserPreferences]
      );
      setPreferencesHasChanges(changed);
    }
  }, [preferences, originalPreferences]);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications((prev) =>
        prev.filter(
          (notification) => Date.now() - notification.timestamp < 5000
        )
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const addNotification = (
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};

    if (!profileData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!profileData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!profileData.email.trim()) {
      errors.email = 'Email is required';
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
        profileData.email
      )
    ) {
      errors.email = 'Please enter a valid email address';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.current_password) {
      errors.current_password = 'Current password is required';
    }

    if (!passwordData.new_password) {
      errors.new_password = 'New password is required';
    } else {
      const passwordRequirements = [];

      if (passwordData.new_password.length < 8) {
        passwordRequirements.push('at least 8 characters');
      }
      if (!/[a-z]/.test(passwordData.new_password)) {
        passwordRequirements.push('one lowercase letter');
      }
      if (!/[A-Z]/.test(passwordData.new_password)) {
        passwordRequirements.push('one uppercase letter');
      }
      if (!/\d/.test(passwordData.new_password)) {
        passwordRequirements.push('one number');
      }
      if (
        !/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/.test(passwordData.new_password)
      ) {
        passwordRequirements.push('one special character');
      }

      if (passwordRequirements.length > 0) {
        errors.new_password = `Password must contain ${passwordRequirements.join(', ')}`;
      }
    }

    if (!passwordData.confirm_password) {
      errors.confirm_password = 'Please confirm your new password';
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }

    if (passwordData.current_password === passwordData.new_password) {
      errors.new_password =
        'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateProfile()) {
      return;
    }

    try {
      // Call API to update profile
      const updatedUser = await AuthService.updateUserProfile({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
      });

      // Update form state with successful response
      const updatedProfileData = {
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
      };

      setOriginalProfileData(updatedProfileData);
      setProfileData(updatedProfileData);
      setProfileHasChanges(false);

      // Show success notification
      addNotification({
        variant: 'success',
        title: 'Profile Updated',
        message: 'Your profile information has been updated successfully.',
      });
    } catch (error) {
      const errorMessage = handleFormError(
        error,
        'Profile Update',
        'Failed to update profile'
      );
      setProfileErrors({ general: errorMessage });
    }
  };

  const handlePreferencesSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const updateRequest: UpdatePreferencesRequest = {
        preferences: preferences,
      };

      await updatePreferencesMutation.mutateAsync(updateRequest);

      setOriginalPreferences({ ...preferences });
      setPreferencesHasChanges(false);

      addNotification({
        variant: 'success',
        title: 'Preferences Updated',
        message: 'Your preferences have been saved successfully.',
      });
    } catch (error) {
      const errorMessage = handleFormError(
        error,
        'Preferences Update',
        'Failed to update preferences'
      );
      addNotification({
        variant: 'danger',
        title: 'Preferences Update Failed',
        message: errorMessage,
      });
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      const changeRequest: ChangePasswordRequest = {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      };

      await changePasswordMutation.mutateAsync(changeRequest);

      // Reset form and close modal
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setPasswordErrors({});
      setShowPasswordModal(false);

      addNotification({
        variant: 'success',
        title: 'Password Changed',
        message: 'Your password has been changed successfully.',
      });
    } catch (error) {
      const errorMessage = handleFormError(
        error,
        'Password Change',
        'Failed to change password'
      );
      setPasswordErrors({ general: errorMessage });
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPasswordStrength = (
    password: string
  ): {
    score: number;
    label: string;
    variant: 'danger' | 'warning' | 'success';
  } => {
    if (password.length === 0)
      return { score: 0, label: '', variant: 'danger' };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/.test(password),
    };

    // Length scoring
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety scoring
    if (checks.lowercase) score += 15;
    if (checks.uppercase) score += 15;
    if (checks.numbers) score += 15;
    if (checks.symbols) score += 15;

    // Common patterns penalty
    const commonPatterns = [/123/, /abc/, /qwe/, /password/, /admin/, /user/];
    const hasCommonPattern = commonPatterns.some((pattern) =>
      pattern.test(password.toLowerCase())
    );
    if (hasCommonPattern) score -= 20;

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine label and variant based on score
    if (score < 30) return { score, label: 'Very Weak', variant: 'danger' };
    if (score < 50) return { score, label: 'Weak', variant: 'danger' };
    if (score < 70) return { score, label: 'Fair', variant: 'warning' };
    if (score < 90) return { score, label: 'Good', variant: 'warning' };
    return { score, label: 'Strong', variant: 'success' };
  };

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (!user) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Access Denied" isInline>
          You must be logged in to view your profile.
        </Alert>
      </PageSection>
    );
  }

  const passwordStrength = getPasswordStrength(passwordData.new_password);

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>User Profile</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                User Profile
              </Title>
              <p className="pf-v6-u-color-200">
                Manage your personal information, preferences, and account
                security
              </p>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Notifications */}
        {notifications.map((notification) => (
          <StackItem key={notification.id}>
            <Alert
              variant={notification.variant}
              title={notification.title}
              isInline
              actionClose={
                <Button
                  variant="plain"
                  onClick={() => removeNotification(notification.id)}
                  aria-label="Close notification"
                >
                  <Icon>
                    <TimesIcon />
                  </Icon>
                </Button>
              }
            >
              {notification.message}
            </Alert>
          </StackItem>
        ))}

        {/* User Info Card */}
        <StackItem>
          <Card>
            <CardBody>
              <Flex alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <Icon size="xl">
                    <UserIcon />
                  </Icon>
                </FlexItem>
                <FlexItem>
                  <Title headingLevel="h2" size="lg">
                    {user.first_name} {user.last_name}
                  </Title>
                  <p className="pf-v6-u-color-200">{user.email}</p>
                  <p className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                    User ID: {user.id}
                  </p>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        </StackItem>

        {/* Tabs */}
        <StackItem>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_, tabIndex) => setActiveTabKey(tabIndex as string)}
            aria-label="Profile tabs"
          >
            <Tab
              eventKey="profile"
              title={
                <TabTitleText>
                  <Icon>
                    <EditIcon />
                  </Icon>{' '}
                  Profile Information
                </TabTitleText>
              }
            >
              <TabContent id="profile-info-tab">
                <Card>
                  <CardBody>
                    <Form onSubmit={handleProfileSubmit}>
                      <Stack hasGutter>
                        {profileErrors.general && (
                          <StackItem>
                            <Alert
                              variant={AlertVariant.danger}
                              title="Error"
                              isInline
                            >
                              {profileErrors.general}
                            </Alert>
                          </StackItem>
                        )}

                        <StackItem>
                          <Grid hasGutter>
                            <GridItem span={12} md={6}>
                              <FormGroup
                                label="First Name"
                                isRequired
                                fieldId="first-name"
                              >
                                <TextInput
                                  isRequired
                                  type="text"
                                  id="first-name"
                                  value={profileData.first_name}
                                  onChange={(_, value) =>
                                    setProfileData((prev) => ({
                                      ...prev,
                                      first_name: value,
                                    }))
                                  }
                                  validated={
                                    profileErrors.first_name
                                      ? 'error'
                                      : 'default'
                                  }
                                />
                                {profileErrors.first_name && (
                                  <div
                                    style={{
                                      color:
                                        'var(--pf-v6-global--danger-color--100)',
                                      fontSize: '0.875rem',
                                      marginTop: '0.25rem',
                                    }}
                                  >
                                    {profileErrors.first_name}
                                  </div>
                                )}
                              </FormGroup>
                            </GridItem>

                            <GridItem span={12} md={6}>
                              <FormGroup
                                label="Last Name"
                                isRequired
                                fieldId="last-name"
                              >
                                <TextInput
                                  isRequired
                                  type="text"
                                  id="last-name"
                                  value={profileData.last_name}
                                  onChange={(_, value) =>
                                    setProfileData((prev) => ({
                                      ...prev,
                                      last_name: value,
                                    }))
                                  }
                                  validated={
                                    profileErrors.last_name
                                      ? 'error'
                                      : 'default'
                                  }
                                />
                                {profileErrors.last_name && (
                                  <div
                                    style={{
                                      color:
                                        'var(--pf-v6-global--danger-color--100)',
                                      fontSize: '0.875rem',
                                      marginTop: '0.25rem',
                                    }}
                                  >
                                    {profileErrors.last_name}
                                  </div>
                                )}
                              </FormGroup>
                            </GridItem>

                            <GridItem span={12}>
                              <FormGroup
                                label="Email Address"
                                isRequired
                                fieldId="email"
                              >
                                <TextInput
                                  isRequired
                                  type="email"
                                  id="email"
                                  value={profileData.email}
                                  onChange={(_, value) =>
                                    setProfileData((prev) => ({
                                      ...prev,
                                      email: value,
                                    }))
                                  }
                                  validated={
                                    profileErrors.email ? 'error' : 'default'
                                  }
                                />
                                {profileErrors.email && (
                                  <div
                                    style={{
                                      color:
                                        'var(--pf-v6-global--danger-color--100)',
                                      fontSize: '0.875rem',
                                      marginTop: '0.25rem',
                                    }}
                                  >
                                    {profileErrors.email}
                                  </div>
                                )}
                              </FormGroup>
                            </GridItem>
                          </Grid>
                        </StackItem>

                        <StackItem>
                          <ActionGroup>
                            <Button
                              variant="primary"
                              type="submit"
                              icon={<SaveIcon />}
                              isDisabled={!profileHasChanges}
                            >
                              Save Changes
                            </Button>
                          </ActionGroup>
                        </StackItem>
                      </Stack>
                    </Form>
                  </CardBody>
                </Card>
              </TabContent>
            </Tab>

            <Tab
              eventKey="preferences"
              title={
                <TabTitleText>
                  <Icon>
                    <CogIcon />
                  </Icon>{' '}
                  Preferences
                </TabTitleText>
              }
            >
              <TabContent id="preferences-tab">
                <Card>
                  <CardBody>
                    <Form onSubmit={handlePreferencesSubmit}>
                      <Stack hasGutter>
                        <StackItem>
                          <Title headingLevel="h3" size="md">
                            Display Settings
                          </Title>
                        </StackItem>

                        <StackItem>
                          <Grid hasGutter>
                            <GridItem span={12} md={4}>
                              <FormGroup label="Theme" fieldId="theme">
                                <FormSelect
                                  value={preferences.theme}
                                  onChange={(_, value) =>
                                    setPreferences((prev) => ({
                                      ...prev,
                                      theme: value as 'light' | 'dark' | 'auto',
                                    }))
                                  }
                                  id="theme"
                                  aria-label="Select theme"
                                >
                                  <FormSelectOption
                                    value="auto"
                                    label="Auto (System)"
                                  />
                                  <FormSelectOption
                                    value="light"
                                    label="Light"
                                  />
                                  <FormSelectOption value="dark" label="Dark" />
                                </FormSelect>
                              </FormGroup>
                            </GridItem>

                            <GridItem span={12} md={4}>
                              <FormGroup label="Language" fieldId="language">
                                <FormSelect
                                  value={preferences.language}
                                  onChange={(_, value) =>
                                    setPreferences((prev) => ({
                                      ...prev,
                                      language: value,
                                    }))
                                  }
                                  id="language"
                                  aria-label="Select language"
                                >
                                  <FormSelectOption
                                    value="en"
                                    label="English"
                                  />
                                  <FormSelectOption
                                    value="es"
                                    label="Español"
                                  />
                                  <FormSelectOption
                                    value="fr"
                                    label="Français"
                                  />
                                </FormSelect>
                              </FormGroup>
                            </GridItem>

                            <GridItem span={12} md={4}>
                              <FormGroup label="Timezone" fieldId="timezone">
                                <FormSelect
                                  value={preferences.timezone}
                                  onChange={(_, value) =>
                                    setPreferences((prev) => ({
                                      ...prev,
                                      timezone: value,
                                    }))
                                  }
                                  id="timezone"
                                  aria-label="Select timezone"
                                >
                                  <FormSelectOption value="UTC" label="UTC" />
                                  <FormSelectOption
                                    value="America/New_York"
                                    label="Eastern Time"
                                  />
                                  <FormSelectOption
                                    value="America/Chicago"
                                    label="Central Time"
                                  />
                                  <FormSelectOption
                                    value="America/Denver"
                                    label="Mountain Time"
                                  />
                                  <FormSelectOption
                                    value="America/Los_Angeles"
                                    label="Pacific Time"
                                  />
                                </FormSelect>
                              </FormGroup>
                            </GridItem>
                          </Grid>
                        </StackItem>

                        <StackItem>
                          <Divider />
                        </StackItem>

                        <StackItem>
                          <Title headingLevel="h3" size="md">
                            Notification Settings
                          </Title>
                        </StackItem>

                        <StackItem>
                          <Grid hasGutter>
                            <GridItem span={12} md={6}>
                              <FormGroup
                                label="Email Notifications"
                                fieldId="notifications-email"
                              >
                                <Switch
                                  id="notifications-email"
                                  label="Enabled"
                                  isChecked={preferences.notifications.email}
                                  onChange={(_, checked) =>
                                    setPreferences((prev) => ({
                                      ...prev,
                                      notifications: {
                                        ...prev.notifications,
                                        email: checked,
                                      },
                                    }))
                                  }
                                />
                              </FormGroup>
                            </GridItem>

                            <GridItem span={12} md={6}>
                              <FormGroup
                                label="Browser Notifications"
                                fieldId="notifications-browser"
                              >
                                <Switch
                                  id="notifications-browser"
                                  label="Enabled"
                                  isChecked={preferences.notifications.browser}
                                  onChange={(_, checked) =>
                                    setPreferences((prev) => ({
                                      ...prev,
                                      notifications: {
                                        ...prev.notifications,
                                        browser: checked,
                                      },
                                    }))
                                  }
                                />
                              </FormGroup>
                            </GridItem>
                          </Grid>
                        </StackItem>

                        <StackItem>
                          <ActionGroup>
                            <Button
                              variant="primary"
                              type="submit"
                              icon={<SaveIcon />}
                              isDisabled={!preferencesHasChanges}
                            >
                              Save Preferences
                            </Button>
                          </ActionGroup>
                        </StackItem>
                      </Stack>
                    </Form>
                  </CardBody>
                </Card>
              </TabContent>
            </Tab>

            <Tab
              eventKey="security"
              title={
                <TabTitleText>
                  <Icon>
                    <ShieldAltIcon />
                  </Icon>{' '}
                  Security
                </TabTitleText>
              }
            >
              <TabContent id="security-tab">
                <Stack hasGutter>
                  {/* Password Change */}
                  <StackItem>
                    <Card>
                      <CardBody>
                        <Split hasGutter>
                          <SplitItem isFilled>
                            <Title headingLevel="h3" size="md">
                              Password
                            </Title>
                            <p className="pf-v6-u-color-200">
                              Change your account password
                            </p>
                          </SplitItem>
                          <SplitItem>
                            <Button
                              variant="secondary"
                              icon={<KeyIcon />}
                              onClick={() => setShowPasswordModal(true)}
                            >
                              Change Password
                            </Button>
                          </SplitItem>
                        </Split>
                      </CardBody>
                    </Card>
                  </StackItem>

                  {/* Security Settings */}
                  <StackItem>
                    <Card>
                      <CardBody>
                        <Stack hasGutter>
                          <StackItem>
                            <Title headingLevel="h3" size="md">
                              Security Settings
                            </Title>
                          </StackItem>

                          {securitySettings.map((setting) => (
                            <StackItem key={setting.id}>
                              <Split hasGutter>
                                <SplitItem isFilled>
                                  <div>
                                    <strong>{setting.name}</strong>
                                    <p className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                                      {setting.description}
                                    </p>
                                    {setting.last_used && (
                                      <p className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                                        Last used:{' '}
                                        {formatDate(setting.last_used)}
                                      </p>
                                    )}
                                  </div>
                                </SplitItem>
                                <SplitItem>
                                  <Switch
                                    id={setting.id}
                                    label="Enabled"
                                    isChecked={setting.enabled}
                                    onChange={async (_, checked) => {
                                      try {
                                        const updateRequest: UpdateSecuritySettingRequest = {
                                          setting_id: setting.id,
                                          enabled: checked,
                                        };

                                        await updateSecuritySettingMutation.mutateAsync(updateRequest);

                                        addNotification({
                                          variant: 'success',
                                          title: 'Security Setting Updated',
                                          message: `${setting.name} has been ${checked ? 'enabled' : 'disabled'}.`,
                                        });
                                      } catch (error) {
                                        const errorMessage = handleFormError(
                                          error,
                                          'Security Setting Update',
                                          'Failed to update security setting'
                                        );
                                        addNotification({
                                          variant: 'danger',
                                          title: 'Security Setting Update Failed',
                                          message: errorMessage,
                                        });
                                      }
                                    }}
                                  />
                                </SplitItem>
                              </Split>
                              <Divider />
                            </StackItem>
                          ))}
                        </Stack>
                      </CardBody>
                    </Card>
                  </StackItem>
                </Stack>
              </TabContent>
            </Tab>

            <Tab
              eventKey="activity"
              title={
                <TabTitleText>
                  <Icon>
                    <HistoryIcon />
                  </Icon>{' '}
                  Activity History
                </TabTitleText>
              }
            >
              <TabContent id="activity-tab">
                <Card>
                  <CardBody>
                    <Stack hasGutter>
                      <StackItem>
                        <Title headingLevel="h3" size="md">
                          Recent Activity
                        </Title>
                        <p className="pf-v6-u-color-200">
                          Your recent account activity and login history
                        </p>
                      </StackItem>

                      {activityItems.map((item) => (
                        <StackItem key={item.id}>
                          <Card isPlain>
                            <CardBody>
                              <DescriptionList isHorizontal>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>
                                    Action
                                  </DescriptionListTerm>
                                  <DescriptionListDescription>
                                    <Label color="blue">{item.action}</Label>
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>
                                    Resource
                                  </DescriptionListTerm>
                                  <DescriptionListDescription>
                                    {item.resource}
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>
                                    Time
                                  </DescriptionListTerm>
                                  <DescriptionListDescription>
                                    {formatDate(item.timestamp)}
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>
                                    IP Address
                                  </DescriptionListTerm>
                                  <DescriptionListDescription>
                                    <code>{item.ip_address}</code>
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                              </DescriptionList>
                            </CardBody>
                          </Card>
                        </StackItem>
                      ))}
                    </Stack>
                  </CardBody>
                </Card>
              </TabContent>
            </Tab>
          </Tabs>
        </StackItem>
      </Stack>

      {/* Password Change Modal */}
      <Modal
        variant={ModalVariant.medium}
        title="Change Password"
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordData({
            current_password: '',
            new_password: '',
            confirm_password: '',
          });
          setPasswordErrors({});
        }}
      >
        <Form onSubmit={handlePasswordSubmit}>
          <Stack hasGutter>
            {passwordErrors.general && (
              <StackItem>
                <Alert variant={AlertVariant.danger} title="Error" isInline>
                  {passwordErrors.general}
                </Alert>
              </StackItem>
            )}

            <StackItem>
              <FormGroup
                label="Current Password"
                isRequired
                fieldId="current-password"
              >
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <TextInput
                      isRequired
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="current-password"
                      value={passwordData.current_password}
                      onChange={(_, value) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          current_password: value,
                        }))
                      }
                      validated={
                        passwordErrors.current_password ? 'error' : 'default'
                      }
                    />
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="plain"
                      aria-label={
                        showCurrentPassword ? 'Hide password' : 'Show password'
                      }
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      <Icon>
                        {showCurrentPassword ? <EyeSlashIcon /> : <EyeIcon />}
                      </Icon>
                    </Button>
                  </FlexItem>
                </Flex>
                {passwordErrors.current_password && (
                  <div
                    style={{
                      color: 'var(--pf-v6-global--danger-color--100)',
                      fontSize: '0.875rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    {passwordErrors.current_password}
                  </div>
                )}
              </FormGroup>
            </StackItem>

            <StackItem>
              <FormGroup label="New Password" isRequired fieldId="new-password">
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <TextInput
                      isRequired
                      type={showNewPassword ? 'text' : 'password'}
                      id="new-password"
                      value={passwordData.new_password}
                      onChange={(_, value) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          new_password: value,
                        }))
                      }
                      validated={
                        passwordErrors.new_password ? 'error' : 'default'
                      }
                    />
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="plain"
                      aria-label={
                        showNewPassword ? 'Hide password' : 'Show password'
                      }
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Icon>
                        {showNewPassword ? <EyeSlashIcon /> : <EyeIcon />}
                      </Icon>
                    </Button>
                  </FlexItem>
                </Flex>
                {passwordData.new_password && (
                  <Progress
                    value={passwordStrength.score}
                    title={passwordStrength.label}
                    size="sm"
                    variant={passwordStrength.variant}
                    measureLocation={ProgressMeasureLocation.outside}
                  />
                )}
                {passwordErrors.new_password && (
                  <div
                    style={{
                      color: 'var(--pf-v6-global--danger-color--100)',
                      fontSize: '0.875rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    {passwordErrors.new_password}
                  </div>
                )}
              </FormGroup>
            </StackItem>

            <StackItem>
              <FormGroup
                label="Confirm New Password"
                isRequired
                fieldId="confirm-password"
              >
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <TextInput
                      isRequired
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirm-password"
                      value={passwordData.confirm_password}
                      onChange={(_, value) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirm_password: value,
                        }))
                      }
                      validated={
                        passwordErrors.confirm_password ? 'error' : 'default'
                      }
                    />
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="plain"
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <Icon>
                        {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                      </Icon>
                    </Button>
                  </FlexItem>
                </Flex>
                {passwordErrors.confirm_password && (
                  <div
                    style={{
                      color: 'var(--pf-v6-global--danger-color--100)',
                      fontSize: '0.875rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    {passwordErrors.confirm_password}
                  </div>
                )}
              </FormGroup>
            </StackItem>

            <StackItem>
              <ActionGroup>
                <Button variant="primary" type="submit" icon={<SaveIcon />}>
                  Change Password
                </Button>
                <Button
                  variant="link"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </Button>
              </ActionGroup>
            </StackItem>
          </Stack>
        </Form>
      </Modal>
    </PageSection>
  );
};

export default UserProfile;
