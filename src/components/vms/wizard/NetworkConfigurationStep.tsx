import React, { useState } from 'react';
import {
  Stack,
  StackItem,
  Title,
  Card,
  CardBody,
  Grid,
  GridItem,
  Radio,
  TextInput,
  FormGroup,
  HelperText,
  HelperTextItem,
  Alert,
  AlertVariant,
  Badge,
  Button,
  InputGroup,
  InputGroupItem,
} from '@patternfly/react-core';
import {
  NetworkIcon,
  InfoCircleIcon,
  PlusIcon,
  TrashIcon,
} from '@patternfly/react-icons';
import type { WizardFormData } from '../VMCreationWizard';
import type { VDC } from '../../../types';

interface NetworkConfigurationStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  selectedVDC?: VDC;
}

const NetworkConfigurationStep: React.FC<NetworkConfigurationStepProps> = ({
  formData,
  updateFormData,
  selectedVDC,
}) => {
  const [ipError, setIpError] = useState('');
  const [gatewayError, setGatewayError] = useState('');
  const [subnetError, setSubnetError] = useState('');
  const [dnsError, setDnsError] = useState('');
  const [newDnsServer, setNewDnsServer] = useState('');

  const validateIP = (ip: string) => {
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const validateSubnetMask = (mask: string) => {
    const validMasks = [
      // /8 to /15
      '255.0.0.0', // /8
      '255.128.0.0', // /9
      '255.192.0.0', // /10
      '255.224.0.0', // /11
      '255.240.0.0', // /12
      '255.248.0.0', // /13
      '255.252.0.0', // /14
      '255.254.0.0', // /15
      // /16 to /23
      '255.255.0.0', // /16
      '255.255.128.0', // /17
      '255.255.192.0', // /18
      '255.255.224.0', // /19
      '255.255.240.0', // /20
      '255.255.248.0', // /21
      '255.255.252.0', // /22
      '255.255.254.0', // /23
      // /24 to /30 (most common)
      '255.255.255.0', // /24
      '255.255.255.128', // /25
      '255.255.255.192', // /26
      '255.255.255.224', // /27
      '255.255.255.240', // /28
      '255.255.255.248', // /29
      '255.255.255.252', // /30
      // Legacy class-based masks
      '128.0.0.0', // /1
      '192.0.0.0', // /2
      '224.0.0.0', // /3
      '240.0.0.0', // /4
      '248.0.0.0', // /5
      '252.0.0.0', // /6
      '254.0.0.0', // /7
    ];
    return validMasks.includes(mask);
  };

  const handleAllocationModeChange = (mode: 'DHCP' | 'STATIC' | 'POOL') => {
    const updatedNetworkConfig = {
      ...formData.network_config,
      ip_allocation_mode: mode,
    };

    if (mode === 'DHCP') {
      // Clear static IP fields when switching to DHCP
      updatedNetworkConfig.ip_address = undefined;
      updatedNetworkConfig.gateway = undefined;
      updatedNetworkConfig.subnet_mask = undefined;
      setIpError('');
      setGatewayError('');
      setSubnetError('');
    }

    updateFormData({ network_config: updatedNetworkConfig });
  };

  const handleStaticIPChange = (field: string, value: string) => {
    const updatedNetworkConfig = {
      ...formData.network_config,
      [field]: value,
    };

    updateFormData({ network_config: updatedNetworkConfig });

    // Validate specific fields
    if (field === 'ip_address') {
      if (value && !validateIP(value)) {
        setIpError('Please enter a valid IP address');
      } else {
        setIpError('');
      }
    } else if (field === 'gateway') {
      if (value && !validateIP(value)) {
        setGatewayError('Please enter a valid gateway IP address');
      } else {
        setGatewayError('');
      }
    } else if (field === 'subnet_mask') {
      if (value && !validateSubnetMask(value)) {
        setSubnetError('Please enter a valid subnet mask');
      } else {
        setSubnetError('');
      }
    }
  };

  const handleAddDnsServer = () => {
    if (!newDnsServer.trim()) return;

    if (!validateIP(newDnsServer.trim())) {
      setDnsError('Please enter a valid DNS server IP address');
      return;
    }

    const currentDnsServers = formData.network_config.dns_servers || [];
    if (currentDnsServers.includes(newDnsServer.trim())) {
      setDnsError('This DNS server is already added');
      return;
    }

    const updatedNetworkConfig = {
      ...formData.network_config,
      dns_servers: [...currentDnsServers, newDnsServer.trim()],
    };

    updateFormData({ network_config: updatedNetworkConfig });
    setNewDnsServer('');
    setDnsError('');
  };

  const handleRemoveDnsServer = (serverToRemove: string) => {
    const updatedDnsServers = (
      formData.network_config.dns_servers || []
    ).filter((server) => server !== serverToRemove);

    const updatedNetworkConfig = {
      ...formData.network_config,
      dns_servers: updatedDnsServers,
    };

    updateFormData({ network_config: updatedNetworkConfig });
  };

  const isStaticMode = formData.network_config.ip_allocation_mode === 'STATIC';
  const dnsServers = formData.network_config.dns_servers || [];

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="xl">
          <NetworkIcon className="pf-v6-u-mr-sm" />
          Network Configuration
        </Title>
        <p className="pf-v6-u-color-200">
          Configure network settings for your virtual machine including IP
          allocation and DNS settings.
        </p>
      </StackItem>

      {/* VDC Network Info */}
      {selectedVDC && (
        <StackItem>
          <Alert
            variant={AlertVariant.info}
            isInline
            title="VDC Network Information"
          >
            This VM will be deployed in the <strong>{selectedVDC.name}</strong>{' '}
            VDC with ID: <code>{selectedVDC.id}</code>
          </Alert>
        </StackItem>
      )}

      {/* IP Allocation Mode */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  IP Address Assignment
                </Title>
                <p className="pf-v6-u-color-200">
                  Choose how the VM should obtain its IP address
                </p>
              </StackItem>

              <StackItem>
                <Grid hasGutter>
                  <GridItem span={4}>
                    <Card
                      isSelectable
                      isSelected={
                        formData.network_config.ip_allocation_mode === 'DHCP'
                      }
                      onClick={() => handleAllocationModeChange('DHCP')}
                      style={{ cursor: 'pointer' }}
                    >
                      <CardBody>
                        <Stack>
                          <StackItem>
                            <Radio
                              id="dhcp-mode"
                              name="ip-allocation"
                              isChecked={
                                formData.network_config.ip_allocation_mode ===
                                'DHCP'
                              }
                              onChange={() =>
                                handleAllocationModeChange('DHCP')
                              }
                              label="DHCP (Automatic)"
                            />
                          </StackItem>
                          <StackItem>
                            <p className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                              Automatically obtain IP address from the network
                              DHCP server
                            </p>
                            <Badge color="green">Recommended</Badge>
                          </StackItem>
                        </Stack>
                      </CardBody>
                    </Card>
                  </GridItem>

                  <GridItem span={4}>
                    <Card
                      isSelectable
                      isSelected={
                        formData.network_config.ip_allocation_mode === 'STATIC'
                      }
                      onClick={() => handleAllocationModeChange('STATIC')}
                      style={{ cursor: 'pointer' }}
                    >
                      <CardBody>
                        <Stack>
                          <StackItem>
                            <Radio
                              id="static-mode"
                              name="ip-allocation"
                              isChecked={
                                formData.network_config.ip_allocation_mode ===
                                'STATIC'
                              }
                              onChange={() =>
                                handleAllocationModeChange('STATIC')
                              }
                              label="Static IP"
                            />
                          </StackItem>
                          <StackItem>
                            <p className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                              Manually configure IP address and network settings
                            </p>
                            <Badge color="orange">Advanced</Badge>
                          </StackItem>
                        </Stack>
                      </CardBody>
                    </Card>
                  </GridItem>

                  <GridItem span={4}>
                    <Card
                      isSelectable
                      isSelected={
                        formData.network_config.ip_allocation_mode === 'POOL'
                      }
                      onClick={() => handleAllocationModeChange('POOL')}
                      style={{ cursor: 'pointer' }}
                    >
                      <CardBody>
                        <Stack>
                          <StackItem>
                            <Radio
                              id="pool-mode"
                              name="ip-allocation"
                              isChecked={
                                formData.network_config.ip_allocation_mode ===
                                'POOL'
                              }
                              onChange={() =>
                                handleAllocationModeChange('POOL')
                              }
                              label="IP Pool"
                            />
                          </StackItem>
                          <StackItem>
                            <p className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                              Assign IP from a predefined pool of addresses
                            </p>
                            <Badge color="blue">Managed</Badge>
                          </StackItem>
                        </Stack>
                      </CardBody>
                    </Card>
                  </GridItem>
                </Grid>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Static IP Configuration */}
      {isStaticMode && (
        <StackItem>
          <Card>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <Title headingLevel="h3" size="lg">
                    Static IP Configuration
                  </Title>
                  <Alert
                    variant={AlertVariant.warning}
                    isInline
                    title="Static IP Configuration"
                  >
                    Ensure the IP address is available and doesn't conflict with
                    other systems on the network.
                  </Alert>
                </StackItem>

                <StackItem>
                  <Grid hasGutter>
                    <GridItem span={6}>
                      <FormGroup
                        label="IP Address"
                        isRequired
                        fieldId="static-ip"
                      >
                        <TextInput
                          id="static-ip"
                          value={formData.network_config.ip_address || ''}
                          onChange={(_, value) =>
                            handleStaticIPChange('ip_address', value)
                          }
                          placeholder="192.168.1.100"
                          validated={ipError ? 'error' : 'default'}
                        />
                        {!ipError && (
                          <HelperText>
                            <HelperTextItem icon={<InfoCircleIcon />}>
                              Enter the static IP address for this VM
                            </HelperTextItem>
                          </HelperText>
                        )}
                        {ipError && (
                          <HelperText>
                            <HelperTextItem variant="error">
                              {ipError}
                            </HelperTextItem>
                          </HelperText>
                        )}
                      </FormGroup>
                    </GridItem>

                    <GridItem span={6}>
                      <FormGroup
                        label="Subnet Mask"
                        isRequired
                        fieldId="subnet-mask"
                      >
                        <TextInput
                          id="subnet-mask"
                          value={formData.network_config.subnet_mask || ''}
                          onChange={(_, value) =>
                            handleStaticIPChange('subnet_mask', value)
                          }
                          placeholder="255.255.255.0"
                          validated={subnetError ? 'error' : 'default'}
                        />
                        {!subnetError && (
                          <HelperText>
                            <HelperTextItem icon={<InfoCircleIcon />}>
                              Network subnet mask (e.g., 255.255.255.0)
                            </HelperTextItem>
                          </HelperText>
                        )}
                        {subnetError && (
                          <HelperText>
                            <HelperTextItem variant="error">
                              {subnetError}
                            </HelperTextItem>
                          </HelperText>
                        )}
                      </FormGroup>
                    </GridItem>

                    <GridItem span={6}>
                      <FormGroup label="Gateway" isRequired fieldId="gateway">
                        <TextInput
                          id="gateway"
                          value={formData.network_config.gateway || ''}
                          onChange={(_, value) =>
                            handleStaticIPChange('gateway', value)
                          }
                          placeholder="192.168.1.1"
                          validated={gatewayError ? 'error' : 'default'}
                        />
                        {!gatewayError && (
                          <HelperText>
                            <HelperTextItem icon={<InfoCircleIcon />}>
                              Default gateway IP address
                            </HelperTextItem>
                          </HelperText>
                        )}
                        {gatewayError && (
                          <HelperText>
                            <HelperTextItem variant="error">
                              {gatewayError}
                            </HelperTextItem>
                          </HelperText>
                        )}
                      </FormGroup>
                    </GridItem>
                  </Grid>
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </StackItem>
      )}

      {/* DNS Configuration */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  DNS Configuration
                </Title>
                <p className="pf-v6-u-color-200">
                  Configure DNS servers for domain name resolution (optional)
                </p>
              </StackItem>

              <StackItem>
                <FormGroup label="DNS Servers" fieldId="dns-servers">
                  <Stack hasGutter>
                    {dnsServers.length > 0 && (
                      <StackItem>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          {dnsServers.map((server, index) => (
                            <Badge key={index} color="blue">
                              {server}
                              <Button
                                variant="plain"
                                size="sm"
                                onClick={() => handleRemoveDnsServer(server)}
                                style={{ marginLeft: '8px', padding: '0' }}
                                aria-label={`Remove DNS server ${server}`}
                              >
                                <TrashIcon style={{ fontSize: '12px' }} />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </StackItem>
                    )}

                    <StackItem>
                      <InputGroup>
                        <InputGroupItem isFill>
                          <TextInput
                            id="new-dns-server"
                            value={newDnsServer}
                            onChange={(_, value) => {
                              setNewDnsServer(value);
                              setDnsError('');
                            }}
                            placeholder="8.8.8.8"
                            validated={dnsError ? 'error' : 'default'}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddDnsServer();
                              }
                            }}
                          />
                        </InputGroupItem>
                        <InputGroupItem>
                          <Button
                            variant="secondary"
                            onClick={handleAddDnsServer}
                            icon={<PlusIcon />}
                            isDisabled={!newDnsServer.trim()}
                          >
                            Add DNS Server
                          </Button>
                        </InputGroupItem>
                      </InputGroup>
                    </StackItem>
                  </Stack>
                  {!dnsError && (
                    <HelperText>
                      <HelperTextItem icon={<InfoCircleIcon />}>
                        Add DNS server IP addresses. If not specified, default
                        system DNS will be used.
                      </HelperTextItem>
                    </HelperText>
                  )}
                  {dnsError && (
                    <HelperText>
                      <HelperTextItem variant="error">
                        {dnsError}
                      </HelperTextItem>
                    </HelperText>
                  )}
                </FormGroup>
              </StackItem>

              {/* Common DNS Servers */}
              <StackItem>
                <div>
                  <p className="pf-v6-u-font-size-sm pf-v6-u-color-200 pf-v6-u-mb-sm">
                    Common DNS servers:
                  </p>
                  <div
                    style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                  >
                    {['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1'].map(
                      (server) => (
                        <Button
                          key={server}
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setNewDnsServer(server);
                            setDnsError('');
                          }}
                          isDisabled={dnsServers.includes(server)}
                        >
                          {server}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Network Summary */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  Network Summary
                </Title>
              </StackItem>
              <StackItem>
                <Grid hasGutter>
                  <GridItem span={6}>
                    <div>
                      <strong>IP Allocation:</strong>{' '}
                      {formData.network_config.ip_allocation_mode}
                      {isStaticMode && formData.network_config.ip_address && (
                        <div className="pf-v6-u-mt-sm">
                          <strong>Static IP:</strong>{' '}
                          {formData.network_config.ip_address}
                          <br />
                          <strong>Gateway:</strong>{' '}
                          {formData.network_config.gateway || 'Not set'}
                          <br />
                          <strong>Subnet Mask:</strong>{' '}
                          {formData.network_config.subnet_mask || 'Not set'}
                        </div>
                      )}
                    </div>
                  </GridItem>
                  <GridItem span={6}>
                    <div>
                      <strong>DNS Servers:</strong>{' '}
                      {dnsServers.length === 0
                        ? 'Default system DNS'
                        : `${dnsServers.length} configured`}
                      {dnsServers.length > 0 && (
                        <div className="pf-v6-u-mt-sm">
                          {dnsServers.join(', ')}
                        </div>
                      )}
                    </div>
                  </GridItem>
                </Grid>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>
    </Stack>
  );
};

export default NetworkConfigurationStep;
