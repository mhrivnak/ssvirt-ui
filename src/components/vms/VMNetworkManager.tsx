import React, { useState, useEffect } from 'react';
import {
  Stack,
  StackItem,
  Button,
  Alert,
  AlertVariant,
  Card,
  CardBody,
  Title,
  Divider,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Switch,
  Label,
  Badge,
  Split,
  SplitItem,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ActionsColumn,
} from '@patternfly/react-table';
import {
  PlusIcon,
  NetworkIcon,
  EditIcon,
  TrashIcon,
  ConnectedIcon,
  DisconnectedIcon,
} from '@patternfly/react-icons';
import type { VM } from '../../types';
import type { MenuToggleElement } from '@patternfly/react-core';

interface VMNetworkInterface {
  id: string;
  name: string;
  network_name: string;
  ip_address: string;
  mac_address: string;
  ip_allocation_mode: 'DHCP' | 'Static' | 'Pool';
  connected: boolean;
  adapter_type: 'VMXNET3' | 'E1000' | 'E1000E';
  removable: boolean;
}

interface VMNetworkManagerProps {
  vm: VM;
  onSave: (updatedVM: VM) => void;
  onCancel: () => void;
  onChangesDetected: (hasChanges: boolean) => void;
}

// Mock network data - in real implementation this would come from API
const mockNetworks: VMNetworkInterface[] = [
  {
    id: 'nic-1',
    name: 'Network Adapter 1',
    network_name: 'VM Network',
    ip_address: '192.168.1.100',
    mac_address: '00:50:56:9a:8b:7c',
    ip_allocation_mode: 'DHCP',
    connected: true,
    adapter_type: 'VMXNET3',
    removable: false,
  },
  {
    id: 'nic-2',
    name: 'Network Adapter 2',
    network_name: 'Internal Network',
    ip_address: '10.0.1.50',
    mac_address: '00:50:56:9a:8b:7d',
    ip_allocation_mode: 'Static',
    connected: true,
    adapter_type: 'E1000',
    removable: true,
  },
];

// Mock available networks
const availableNetworks = [
  { name: 'VM Network', id: 'net-1' },
  { name: 'Internal Network', id: 'net-2' },
  { name: 'DMZ Network', id: 'net-3' },
  { name: 'Management Network', id: 'net-4' },
];

export const VMNetworkManager: React.FC<VMNetworkManagerProps> = ({
  vm,
  onSave,
  onCancel,
  onChangesDetected,
}) => {
  const [networks, setNetworks] = useState<VMNetworkInterface[]>(mockNetworks);
  const [showAddNetworkModal, setShowAddNetworkModal] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<VMNetworkInterface | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New network form state
  const [newNetworkName, setNewNetworkName] = useState('');
  const [selectedNetworkName, setSelectedNetworkName] = useState('VM Network');
  const [ipAllocationMode, setIpAllocationMode] = useState<'DHCP' | 'Static' | 'Pool'>('DHCP');
  const [staticIpAddress, setStaticIpAddress] = useState('');
  const [adapterType, setAdapterType] = useState<'VMXNET3' | 'E1000' | 'E1000E'>('VMXNET3');
  const [isConnected, setIsConnected] = useState(true);

  // Select states
  const [isNetworkSelectOpen, setIsNetworkSelectOpen] = useState(false);
  const [isIpModeSelectOpen, setIsIpModeSelectOpen] = useState(false);
  const [isAdapterTypeSelectOpen, setIsAdapterTypeSelectOpen] = useState(false);

  useEffect(() => {
    // Check if there are changes compared to original state
    const hasChanges = JSON.stringify(networks) !== JSON.stringify(mockNetworks);
    onChangesDetected(hasChanges);
  }, [networks, onChangesDetected]);

  const validateNetworkConfiguration = (): string[] => {
    const errors: string[] = [];
    
    if (newNetworkName.trim().length === 0) {
      errors.push('Network adapter name is required');
    }
    
    if (ipAllocationMode === 'Static' && !isValidIpAddress(staticIpAddress)) {
      errors.push('Valid IP address is required for static allocation');
    }

    // Check for duplicate names
    if (networks.some(net => net.name === newNetworkName.trim() && net.id !== editingNetwork?.id)) {
      errors.push('A network adapter with this name already exists');
    }

    return errors;
  };

  const isValidIpAddress = (ip: string): boolean => {
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipPattern.test(ip);
  };

  const generateMacAddress = (): string => {
    // Generate a random MAC address starting with VMware's OUI
    const oui = '00:50:56';
    const randomPart = Array.from({ length: 3 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':');
    return `${oui}:${randomPart}`;
  };

  const handleAddNetwork = () => {
    const errors = validateNetworkConfiguration();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const newNetwork: VMNetworkInterface = {
      id: `nic-${Date.now()}`,
      name: newNetworkName.trim(),
      network_name: selectedNetworkName,
      ip_address: ipAllocationMode === 'Static' ? staticIpAddress : 'Auto-assigned',
      mac_address: generateMacAddress(),
      ip_allocation_mode: ipAllocationMode,
      connected: isConnected,
      adapter_type: adapterType,
      removable: true,
    };

    setNetworks([...networks, newNetwork]);
    resetNetworkForm();
    setShowAddNetworkModal(false);
  };

  const handleEditNetwork = (network: VMNetworkInterface) => {
    setEditingNetwork(network);
    setNewNetworkName(network.name);
    setSelectedNetworkName(network.network_name);
    setIpAllocationMode(network.ip_allocation_mode);
    setStaticIpAddress(network.ip_allocation_mode === 'Static' ? network.ip_address : '');
    setAdapterType(network.adapter_type);
    setIsConnected(network.connected);
    setShowAddNetworkModal(true);
  };

  const handleUpdateNetwork = () => {
    if (!editingNetwork) return;

    const errors = validateNetworkConfiguration();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const updatedNetworks = networks.map(network =>
      network.id === editingNetwork.id
        ? {
            ...network,
            name: newNetworkName.trim(),
            network_name: selectedNetworkName,
            ip_address: ipAllocationMode === 'Static' ? staticIpAddress : 'Auto-assigned',
            ip_allocation_mode: ipAllocationMode,
            adapter_type: adapterType,
            connected: isConnected,
          }
        : network
    );

    setNetworks(updatedNetworks);
    resetNetworkForm();
    setShowAddNetworkModal(false);
    setEditingNetwork(null);
  };

  const handleRemoveNetwork = (networkId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to remove this network adapter? This action cannot be undone.'
    );
    if (confirmed) {
      setNetworks(networks.filter(network => network.id !== networkId));
    }
  };

  const handleToggleConnection = (networkId: string) => {
    const updatedNetworks = networks.map(network =>
      network.id === networkId
        ? { ...network, connected: !network.connected }
        : network
    );
    setNetworks(updatedNetworks);
  };

  const resetNetworkForm = () => {
    setNewNetworkName('');
    setSelectedNetworkName('VM Network');
    setIpAllocationMode('DHCP');
    setStaticIpAddress('');
    setAdapterType('VMXNET3');
    setIsConnected(true);
    setValidationErrors([]);
    setEditingNetwork(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // In real implementation, we would update the VM with new network configuration
      const updatedVM: VM = {
        ...vm,
        updated_at: new Date().toISOString(),
      };

      onSave(updatedVM);
    } catch {
      setValidationErrors(['Failed to update network configuration. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const getNetworkActions = (network: VMNetworkInterface) => [
    {
      title: network.connected ? 'Disconnect' : 'Connect',
      onClick: () => handleToggleConnection(network.id),
      icon: network.connected ? <DisconnectedIcon /> : <ConnectedIcon />,
    },
    {
      title: 'Edit',
      onClick: () => handleEditNetwork(network),
      icon: <EditIcon />,
      isDisabled: vm.status === 'POWERED_ON',
    },
    {
      title: 'Remove',
      onClick: () => handleRemoveNetwork(network.id),
      isDanger: true,
      icon: <TrashIcon />,
      isDisabled: !network.removable || vm.status === 'POWERED_ON',
    },
  ];

  const hasChanges = JSON.stringify(networks) !== JSON.stringify(mockNetworks);

  return (
    <Stack hasGutter>
      {validationErrors.length > 0 && (
        <StackItem>
          <Alert variant={AlertVariant.danger} title="Validation Errors" isInline>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        </StackItem>
      )}

      <StackItem>
        <Alert
          variant={AlertVariant.info}
          title="Network Management"
          isInline
        >
          Primary network adapters cannot be removed. Additional adapters can be
          added or removed when the VM is powered off. Connection state can be
          changed while VM is running.
        </Alert>
      </StackItem>

      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Split hasGutter>
                  <SplitItem isFilled>
                    <Title headingLevel="h3" size="lg">
                      <NetworkIcon className="pf-v6-u-mr-sm" />
                      Network Adapters
                    </Title>
                  </SplitItem>
                  <SplitItem>
                    <Button
                      variant="primary"
                      icon={<PlusIcon />}
                      onClick={() => setShowAddNetworkModal(true)}
                      isDisabled={vm.status === 'POWERED_ON'}
                    >
                      Add Network Adapter
                    </Button>
                  </SplitItem>
                </Split>
              </StackItem>
              <StackItem>
                <Divider />
              </StackItem>
              <StackItem>
                <Table variant="compact">
                  <Thead>
                    <Tr>
                      <Th>Adapter Name</Th>
                      <Th>Network</Th>
                      <Th>IP Address</Th>
                      <Th>MAC Address</Th>
                      <Th>Type</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {networks.map((network) => (
                      <Tr key={network.id}>
                        <Td>
                          <div>
                            <strong>{network.name}</strong>
                            {!network.removable && (
                              <Badge className="pf-v6-u-ml-sm" color="blue">
                                Primary
                              </Badge>
                            )}
                          </div>
                        </Td>
                        <Td>{network.network_name}</Td>
                        <Td>
                          <div>
                            {network.ip_address}
                            <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                              {network.ip_allocation_mode}
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <code className="pf-v6-u-font-family-monospace">
                            {network.mac_address}
                          </code>
                        </Td>
                        <Td>{network.adapter_type}</Td>
                        <Td>
                          <Label
                            color={network.connected ? 'green' : 'red'}
                            icon={network.connected ? <ConnectedIcon /> : <DisconnectedIcon />}
                          >
                            {network.connected ? 'Connected' : 'Disconnected'}
                          </Label>
                        </Td>
                        <Td>
                          <ActionsColumn items={getNetworkActions(network)} />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Action Buttons */}
      <StackItem>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--pf-v6-global--BorderColor--100)',
          }}
        >
          <Button variant="link" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isDisabled={!hasChanges}
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </StackItem>

      {/* Add/Edit Network Modal */}
      <Modal
        variant={ModalVariant.medium}
        title={editingNetwork ? 'Edit Network Adapter' : 'Add Network Adapter'}
        isOpen={showAddNetworkModal}
        onClose={() => {
          resetNetworkForm();
          setShowAddNetworkModal(false);
        }}
      >
        <Form>
          <Grid hasGutter>
            <GridItem span={12}>
              <FormGroup
                label="Adapter Name"
                isRequired
                fieldId="adapter-name"
              >
                <TextInput
                  value={newNetworkName}
                  type="text"
                  id="adapter-name"
                  name="adapter-name"
                  onChange={(_event, value) => setNewNetworkName(value)}
                  placeholder="e.g., Network Adapter 1"
                />
              </FormGroup>
            </GridItem>
            
            <GridItem span={6}>
              <FormGroup
                label="Network"
                isRequired
                fieldId="network-select"
              >
                <Select
                  isOpen={isNetworkSelectOpen}
                  selected={selectedNetworkName}
                  onSelect={(_, selection) => {
                    setSelectedNetworkName(selection as string);
                    setIsNetworkSelectOpen(false);
                  }}
                  onOpenChange={setIsNetworkSelectOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsNetworkSelectOpen(!isNetworkSelectOpen)}
                      isExpanded={isNetworkSelectOpen}
                    >
                      {selectedNetworkName}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {availableNetworks.map((network) => (
                      <SelectOption key={network.id} value={network.name}>
                        {network.name}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </FormGroup>
            </GridItem>

            <GridItem span={6}>
              <FormGroup
                label="IP Allocation"
                fieldId="ip-allocation"
              >
                <Select
                  isOpen={isIpModeSelectOpen}
                  selected={ipAllocationMode}
                  onSelect={(_, selection) => {
                    setIpAllocationMode(selection as 'DHCP' | 'Static' | 'Pool');
                    setIsIpModeSelectOpen(false);
                  }}
                  onOpenChange={setIsIpModeSelectOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsIpModeSelectOpen(!isIpModeSelectOpen)}
                      isExpanded={isIpModeSelectOpen}
                    >
                      {ipAllocationMode}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    <SelectOption value="DHCP">DHCP</SelectOption>
                    <SelectOption value="Static">Static IP</SelectOption>
                    <SelectOption value="Pool">IP Pool</SelectOption>
                  </SelectList>
                </Select>
              </FormGroup>
            </GridItem>

            {ipAllocationMode === 'Static' && (
              <GridItem span={12}>
                <FormGroup
                  label="Static IP Address"
                  isRequired
                  fieldId="static-ip"
                >
                  <TextInput
                    value={staticIpAddress}
                    type="text"
                    id="static-ip"
                    name="static-ip"
                    onChange={(_event, value) => setStaticIpAddress(value)}
                    placeholder="e.g., 192.168.1.100"
                  />
                </FormGroup>
              </GridItem>
            )}

            <GridItem span={6}>
              <FormGroup
                label="Adapter Type"
                fieldId="adapter-type"
              >
                <Select
                  isOpen={isAdapterTypeSelectOpen}
                  selected={adapterType}
                  onSelect={(_, selection) => {
                    setAdapterType(selection as 'VMXNET3' | 'E1000' | 'E1000E');
                    setIsAdapterTypeSelectOpen(false);
                  }}
                  onOpenChange={setIsAdapterTypeSelectOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsAdapterTypeSelectOpen(!isAdapterTypeSelectOpen)}
                      isExpanded={isAdapterTypeSelectOpen}
                    >
                      {adapterType}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    <SelectOption value="VMXNET3">VMXNET3 (Recommended)</SelectOption>
                    <SelectOption value="E1000">E1000</SelectOption>
                    <SelectOption value="E1000E">E1000E</SelectOption>
                  </SelectList>
                </Select>
              </FormGroup>
            </GridItem>

            <GridItem span={6}>
              <FormGroup
                label="Connection State"
                fieldId="connection-state"
              >
                <Switch
                  id="connection-state"
                  label="Connected"
                  isChecked={isConnected}
                  onChange={(_event, checked) => setIsConnected(checked)}
                />
              </FormGroup>
            </GridItem>
          </Grid>
        </Form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--pf-v6-global--BorderColor--100)',
          }}
        >
          <Button
            variant="link"
            onClick={() => {
              resetNetworkForm();
              setShowAddNetworkModal(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={editingNetwork ? handleUpdateNetwork : handleAddNetwork}
            isDisabled={validationErrors.length > 0}
          >
            {editingNetwork ? 'Update Adapter' : 'Add Adapter'}
          </Button>
        </div>
      </Modal>
    </Stack>
  );
};

export default VMNetworkManager;