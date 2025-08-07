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
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';
import { handleFormError } from '../../utils/errorHandler';

interface UserProfileData {
  first_name: string;
  last_name: string;
  email: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications_email: boolean;
  notifications_browser: boolean;
  session_timeout: number;
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

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  last_used?: string;
}

const UserProfile: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTabKey, setActiveTabKey] = useState<string>('profile');

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
    notifications_email: true,
    notifications_browser: false,
    session_timeout: 30,
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
  const [securitySettings] = useState<SecuritySetting[]>([
    {
      id: 'two_factor',
      name: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      enabled: false,
    },
    {
      id: 'session_security',
      name: 'Enhanced Session Security',
      description: 'Require re-authentication for sensitive operations',
      enabled: true,
    },
    {
      id: 'login_alerts',
      name: 'Login Alerts',
      description: 'Get notified of new login attempts',
      enabled: true,
      last_used: '2024-01-15T10:30:00Z',
    },
  ]);

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

  // Initialize preferences (in real app, this would come from API)
  useEffect(() => {
    // Load user preferences from API/localStorage
    const savedPrefs = localStorage.getItem('user_preferences');
    if (savedPrefs) {
      const parsed = JSON.parse(savedPrefs);
      setPreferences(parsed);
      setOriginalPreferences(parsed);
    } else {
      const defaultPrefs = {
        theme: 'auto' as const,
        language: 'en',
        timezone: 'UTC',
        notifications_email: true,
        notifications_browser: false,
        session_timeout: 30,
      };
      setOriginalPreferences(defaultPrefs);
    }
  }, []);

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
    } else if (passwordData.new_password.length < 8) {
      errors.new_password = 'Password must be at least 8 characters';
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
      // TODO: Call API to update profile
      console.log('Updating profile:', profileData);

      // Simulate API success
      setOriginalProfileData({ ...profileData });
      setProfileHasChanges(false);

      // Show success message (would be handled by a notification system)
      alert('Profile updated successfully!');
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
      // TODO: Call API to update preferences
      console.log('Updating preferences:', preferences);

      // Save to localStorage as fallback
      localStorage.setItem('user_preferences', JSON.stringify(preferences));

      setOriginalPreferences({ ...preferences });
      setPreferencesHasChanges(false);

      alert('Preferences updated successfully!');
    } catch (error) {
      const errorMessage = handleFormError(
        error,
        'Preferences Update',
        'Failed to update preferences'
      );
      alert(errorMessage);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      // TODO: Call API to change password
      console.log('Changing password...');

      // Reset form and close modal
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setPasswordErrors({});
      setShowPasswordModal(false);

      alert('Password changed successfully!');
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
    if (password.length < 6)
      return { score: 25, label: 'Weak', variant: 'danger' };
    if (password.length < 8)
      return { score: 50, label: 'Fair', variant: 'warning' };
    if (password.length < 12)
      return { score: 75, label: 'Good', variant: 'warning' };
    return { score: 100, label: 'Strong', variant: 'success' };
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
              <TabContent id="profile-tab">
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
              <TabContent id="profile-tab">
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
                                  isChecked={preferences.notifications_email}
                                  onChange={(_, checked) =>
                                    setPreferences((prev) => ({
                                      ...prev,
                                      notifications_email: checked,
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
                                  isChecked={preferences.notifications_browser}
                                  onChange={(_, checked) =>
                                    setPreferences((prev) => ({
                                      ...prev,
                                      notifications_browser: checked,
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
              <TabContent id="profile-tab">
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
                                    onChange={(_, checked) => {
                                      // TODO: Update security setting
                                      console.log(
                                        `Toggle ${setting.id}:`,
                                        checked
                                      );
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
              <TabContent id="profile-tab">
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
                <Button
                  variant="primary"
                  onClick={handlePasswordSubmit}
                  icon={<SaveIcon />}
                >
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
