import React, { useState } from 'react';
import {
  Stack,
  StackItem,
  Title,
  Card,
  CardBody,
  Grid,
  GridItem,
  Switch,
  TextArea,
  TextInput,
  FormGroup,
  HelperText,
  HelperTextItem,
  Alert,
  AlertVariant,
  Button,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Divider,
  Badge,
  CodeBlock,
  CodeBlockCode,
  ExpandableSection,
} from '@patternfly/react-core';
import {
  CogIcon,
  InfoCircleIcon,
  PlusIcon,
  TrashIcon,
  CodeIcon,
  DesktopIcon,
} from '@patternfly/react-icons';
import type { MenuToggleElement } from '@patternfly/react-core';
import type { WizardFormData } from '../VMCreationWizard';

interface AdvancedOptionsStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

// Common time zones
const TIME_ZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (London)' },
  { value: 'Europe/Paris', label: 'Central European Time (Paris)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (Shanghai)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney)' },
];

// Sample cloud-init script
const SAMPLE_CLOUD_INIT = `#cloud-config
# Sample cloud-init configuration
# This script will run when the VM first boots

# Update packages
package_update: true
package_upgrade: true

# Install packages
packages:
  - curl
  - wget
  - git
  - htop

# Create users
users:
  - name: admin
    groups: [sudo]
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ssh-rsa YOUR_SSH_PUBLIC_KEY_HERE

# Run commands
runcmd:
  - echo "VM initialization complete" > /tmp/cloud-init-done
  - systemctl enable sshd
  - systemctl start sshd

# Configure timezone
timezone: UTC

# Reboot after setup
power_state:
  mode: reboot
  delay: "+1"
  message: "Rebooting after cloud-init"`;

const AdvancedOptionsStep: React.FC<AdvancedOptionsStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [isTimeZoneSelectOpen, setIsTimeZoneSelectOpen] = useState(false);
  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');
  const [cloudInitError, setCloudInitError] = useState('');
  const [isExpandedCloudInit, setIsExpandedCloudInit] = useState(false);

  const updateAdvancedConfig = (
    updates: Partial<typeof formData.advanced_config>
  ) => {
    const updatedAdvancedConfig = {
      ...formData.advanced_config,
      ...updates,
    };
    updateFormData({ advanced_config: updatedAdvancedConfig });
  };

  const handleCloudInitToggle = (enabled: boolean) => {
    updateAdvancedConfig({ cloud_init_enabled: enabled });
    if (!enabled) {
      updateAdvancedConfig({ cloud_init_script: undefined });
      setCloudInitError('');
    }
  };

  const handleCloudInitScriptChange = (script: string) => {
    updateAdvancedConfig({ cloud_init_script: script });

    // Basic validation
    if (script.trim() && !script.trim().startsWith('#cloud-config')) {
      setCloudInitError(
        'Cloud-init script should typically start with "#cloud-config"'
      );
    } else {
      setCloudInitError('');
    }
  };

  const handleGuestCustomizationToggle = (enabled: boolean) => {
    updateAdvancedConfig({ guest_customization: enabled });
    if (!enabled) {
      updateAdvancedConfig({
        computer_name: undefined,
        admin_password: undefined,
        auto_logon: false,
        time_zone: undefined,
      });
    }
  };

  const handleTimeZoneChange = (timeZone: string) => {
    updateAdvancedConfig({ time_zone: timeZone });
    setIsTimeZoneSelectOpen(false);
  };

  const handleAddCustomProperty = () => {
    if (!newPropertyKey.trim() || !newPropertyValue.trim()) return;

    const currentProperties = formData.advanced_config.custom_properties || {};
    const updatedProperties = {
      ...currentProperties,
      [newPropertyKey.trim()]: newPropertyValue.trim(),
    };

    updateAdvancedConfig({ custom_properties: updatedProperties });
    setNewPropertyKey('');
    setNewPropertyValue('');
  };

  const handleRemoveCustomProperty = (key: string) => {
    const currentProperties = formData.advanced_config.custom_properties || {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: _, ...updatedProperties } = currentProperties;
    updateAdvancedConfig({ custom_properties: updatedProperties });
  };

  const handleUseSampleCloudInit = () => {
    updateAdvancedConfig({ cloud_init_script: SAMPLE_CLOUD_INIT });
    setCloudInitError('');
  };

  const customProperties = formData.advanced_config.custom_properties || {};
  const selectedTimeZone = TIME_ZONES.find(
    (tz) => tz.value === formData.advanced_config.time_zone
  );

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="xl">
          <CogIcon className="pf-v6-u-mr-sm" />
          Advanced Options
        </Title>
        <p className="pf-v6-u-color-200">
          Configure advanced VM settings including cloud-init, guest
          customization, and custom properties.
        </p>
      </StackItem>

      {/* Cloud-init Configuration */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Title headingLevel="h3" size="lg">
                      <CodeIcon className="pf-v6-u-mr-sm" />
                      Cloud-init Configuration
                    </Title>
                    <p className="pf-v6-u-color-200">
                      Automate VM initialization with cloud-init scripts
                    </p>
                  </div>
                  <Switch
                    id="cloud-init-toggle"
                    label="Enable cloud-init"
                    isChecked={
                      formData.advanced_config.cloud_init_enabled || false
                    }
                    onChange={(_, checked) => handleCloudInitToggle(checked)}
                  />
                </div>
              </StackItem>

              {formData.advanced_config.cloud_init_enabled && (
                <>
                  <StackItem>
                    <Divider />
                  </StackItem>

                  <StackItem>
                    <Alert
                      variant={AlertVariant.info}
                      isInline
                      title="Cloud-init Information"
                    >
                      Cloud-init allows you to configure your VM automatically
                      on first boot. This includes setting up users, installing
                      packages, and running custom commands.
                    </Alert>
                  </StackItem>

                  <StackItem>
                    <FormGroup
                      label="Cloud-init Script"
                      fieldId="cloud-init-script"
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <Button
                          variant="link"
                          onClick={handleUseSampleCloudInit}
                          icon={<CodeIcon />}
                          size="sm"
                        >
                          Use sample cloud-init script
                        </Button>
                        <Button
                          variant="link"
                          onClick={() =>
                            setIsExpandedCloudInit(!isExpandedCloudInit)
                          }
                          size="sm"
                        >
                          {isExpandedCloudInit ? 'Hide' : 'Show'} sample script
                        </Button>
                      </div>

                      {isExpandedCloudInit && (
                        <ExpandableSection isExpanded>
                          <CodeBlock>
                            <CodeBlockCode>{SAMPLE_CLOUD_INIT}</CodeBlockCode>
                          </CodeBlock>
                        </ExpandableSection>
                      )}

                      <TextArea
                        id="cloud-init-script"
                        value={formData.advanced_config.cloud_init_script || ''}
                        onChange={(_, value) =>
                          handleCloudInitScriptChange(value)
                        }
                        placeholder="Enter cloud-init configuration..."
                        rows={12}
                        resizeOrientation="vertical"
                        validated={cloudInitError ? 'error' : 'default'}
                      />
                      {!cloudInitError && (
                        <HelperText>
                          <HelperTextItem icon={<InfoCircleIcon />}>
                            Enter your cloud-init configuration in YAML format
                          </HelperTextItem>
                        </HelperText>
                      )}
                      {cloudInitError && (
                        <HelperText>
                          <HelperTextItem variant="error">
                            {cloudInitError}
                          </HelperTextItem>
                        </HelperText>
                      )}
                    </FormGroup>
                  </StackItem>
                </>
              )}
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Guest Customization */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Title headingLevel="h3" size="lg">
                      <DesktopIcon className="pf-v6-u-mr-sm" />
                      Guest OS Customization
                    </Title>
                    <p className="pf-v6-u-color-200">
                      Configure guest operating system settings (Windows VMs)
                    </p>
                  </div>
                  <Switch
                    id="guest-customization-toggle"
                    label="Enable guest customization"
                    isChecked={
                      formData.advanced_config.guest_customization || false
                    }
                    onChange={(_, checked) =>
                      handleGuestCustomizationToggle(checked)
                    }
                  />
                </div>
              </StackItem>

              {formData.advanced_config.guest_customization && (
                <>
                  <StackItem>
                    <Divider />
                  </StackItem>

                  <StackItem>
                    <Alert
                      variant={AlertVariant.warning}
                      isInline
                      title="Guest Customization Notice"
                    >
                      Guest customization is primarily for Windows VMs and
                      requires VMware Tools to be installed. For Linux VMs,
                      consider using cloud-init instead.
                    </Alert>
                  </StackItem>

                  <StackItem>
                    <Grid hasGutter>
                      <GridItem span={6}>
                        <FormGroup
                          label="Computer Name"
                          fieldId="computer-name"
                        >
                          <TextInput
                            id="computer-name"
                            value={formData.advanced_config.computer_name || ''}
                            onChange={(_, value) =>
                              updateAdvancedConfig({ computer_name: value })
                            }
                            placeholder="Enter computer name..."
                          />
                          <HelperText>
                            <HelperTextItem icon={<InfoCircleIcon />}>
                              Set the hostname for the VM (leave empty to use
                              default)
                            </HelperTextItem>
                          </HelperText>
                        </FormGroup>
                      </GridItem>

                      <GridItem span={6}>
                        <FormGroup
                          label="Administrator Password"
                          fieldId="admin-password"
                        >
                          <TextInput
                            id="admin-password"
                            type="password"
                            value={
                              formData.advanced_config.admin_password || ''
                            }
                            onChange={(_, value) =>
                              updateAdvancedConfig({ admin_password: value })
                            }
                            placeholder="Enter password..."
                          />
                          <HelperText>
                            <HelperTextItem icon={<InfoCircleIcon />}>
                              Set password for the administrator account
                              (Windows only)
                            </HelperTextItem>
                          </HelperText>
                        </FormGroup>
                      </GridItem>

                      <GridItem span={6}>
                        <FormGroup label="Time Zone" fieldId="time-zone">
                          <Select
                            id="time-zone"
                            isOpen={isTimeZoneSelectOpen}
                            selected={formData.advanced_config.time_zone || ''}
                            onSelect={(_, selection) =>
                              handleTimeZoneChange(selection as string)
                            }
                            onOpenChange={setIsTimeZoneSelectOpen}
                            toggle={(
                              toggleRef: React.Ref<MenuToggleElement>
                            ) => (
                              <MenuToggle
                                ref={toggleRef}
                                onClick={() =>
                                  setIsTimeZoneSelectOpen(!isTimeZoneSelectOpen)
                                }
                                isExpanded={isTimeZoneSelectOpen}
                                style={{ width: '100%' }}
                              >
                                {selectedTimeZone
                                  ? selectedTimeZone.label
                                  : 'Select time zone...'}
                              </MenuToggle>
                            )}
                          >
                            <SelectList>
                              {TIME_ZONES.map((timeZone) => (
                                <SelectOption
                                  key={timeZone.value}
                                  value={timeZone.value}
                                >
                                  {timeZone.label}
                                </SelectOption>
                              ))}
                            </SelectList>
                          </Select>
                          <HelperText>
                            <HelperTextItem icon={<InfoCircleIcon />}>
                              Set the time zone for the guest OS
                            </HelperTextItem>
                          </HelperText>
                        </FormGroup>
                      </GridItem>

                      <GridItem span={6}>
                        <FormGroup fieldId="auto-logon">
                          <Switch
                            id="auto-logon"
                            label="Enable automatic logon"
                            isChecked={
                              formData.advanced_config.auto_logon || false
                            }
                            onChange={(_, checked) =>
                              updateAdvancedConfig({ auto_logon: checked })
                            }
                          />
                          <HelperText>
                            <HelperTextItem icon={<InfoCircleIcon />}>
                              Automatically log in the administrator account on
                              boot
                            </HelperTextItem>
                          </HelperText>
                        </FormGroup>
                      </GridItem>
                    </Grid>
                  </StackItem>
                </>
              )}
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Custom Properties */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  Custom Properties
                </Title>
                <p className="pf-v6-u-color-200">
                  Add custom metadata properties to the VM for identification or
                  automation
                </p>
              </StackItem>

              <StackItem>
                <Grid hasGutter>
                  <GridItem span={4}>
                    <FormGroup label="Property Name" fieldId="property-key">
                      <TextInput
                        id="property-key"
                        value={newPropertyKey}
                        onChange={(_, value) => setNewPropertyKey(value)}
                        placeholder="e.g., environment"
                      />
                    </FormGroup>
                  </GridItem>
                  <GridItem span={4}>
                    <FormGroup label="Property Value" fieldId="property-value">
                      <TextInput
                        id="property-value"
                        value={newPropertyValue}
                        onChange={(_, value) => setNewPropertyValue(value)}
                        placeholder="e.g., production"
                      />
                    </FormGroup>
                  </GridItem>
                  <GridItem span={4}>
                    <FormGroup label=" " fieldId="add-property">
                      <Button
                        variant="secondary"
                        icon={<PlusIcon />}
                        onClick={handleAddCustomProperty}
                        isDisabled={
                          !newPropertyKey.trim() || !newPropertyValue.trim()
                        }
                        style={{ width: '100%' }}
                      >
                        Add Property
                      </Button>
                    </FormGroup>
                  </GridItem>
                </Grid>
              </StackItem>

              {Object.keys(customProperties).length > 0 && (
                <StackItem>
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                  >
                    {Object.entries(customProperties).map(([key, value]) => (
                      <Badge key={key} color="blue">
                        {key}: {value}
                        <Button
                          variant="plain"
                          size="sm"
                          onClick={() => handleRemoveCustomProperty(key)}
                          style={{ marginLeft: '8px', padding: '0' }}
                          aria-label={`Remove property ${key}`}
                        >
                          <TrashIcon style={{ fontSize: '12px' }} />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </StackItem>
              )}
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Configuration Summary */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  Advanced Configuration Summary
                </Title>
              </StackItem>
              <StackItem>
                <Grid hasGutter>
                  <GridItem span={4}>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '2em', marginBottom: '8px' }}>
                        <CodeIcon />
                      </div>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                        {formData.advanced_config.cloud_init_enabled
                          ? 'Enabled'
                          : 'Disabled'}
                      </div>
                      <div className="pf-v6-u-color-200">Cloud-init</div>
                    </div>
                  </GridItem>
                  <GridItem span={4}>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '2em', marginBottom: '8px' }}>
                        <DesktopIcon />
                      </div>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                        {formData.advanced_config.guest_customization
                          ? 'Enabled'
                          : 'Disabled'}
                      </div>
                      <div className="pf-v6-u-color-200">
                        Guest Customization
                      </div>
                    </div>
                  </GridItem>
                  <GridItem span={4}>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '2em', marginBottom: '8px' }}>
                        🏷️
                      </div>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                        {Object.keys(customProperties).length}
                      </div>
                      <div className="pf-v6-u-color-200">Custom Properties</div>
                    </div>
                  </GridItem>
                </Grid>
              </StackItem>

              {(formData.advanced_config.cloud_init_enabled ||
                formData.advanced_config.guest_customization) && (
                <StackItem>
                  <Alert
                    variant={AlertVariant.info}
                    isInline
                    isPlain
                    title="Initialization Configuration"
                  >
                    {formData.advanced_config.cloud_init_enabled &&
                      'Cloud-init script will run on first boot. '}
                    {formData.advanced_config.guest_customization &&
                      'Guest OS customization will be applied during deployment.'}
                  </Alert>
                </StackItem>
              )}
            </Stack>
          </CardBody>
        </Card>
      </StackItem>
    </Stack>
  );
};

export default AdvancedOptionsStep;
