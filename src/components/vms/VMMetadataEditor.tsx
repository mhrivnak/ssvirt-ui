import React, { useState, useEffect, useRef } from 'react';
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
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Grid,
  GridItem,
  Label,
  Flex,
  FlexItem,
  Modal,
  ModalVariant,
  Switch,
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
  CogIcon,
  EditIcon,
  TrashIcon,
  TagIcon,
} from '@patternfly/react-icons';
import type { VM } from '../../types';

interface VMMetadata {
  [key: string]: string;
}

interface VMAnnotation {
  key: string;
  value: string;
  editable: boolean;
}

interface VMMetadataEditorProps {
  vm: VM;
  onSave: (updatedVM: VM) => void;
  onCancel: () => void;
  onChangesDetected: (hasChanges: boolean) => void;
}

// Mock metadata - in real implementation this would come from API
const mockMetadata: VMMetadata = {
  'environment': 'production',
  'team': 'platform',
  'project': 'web-services',
  'cost-center': '12345',
  'backup-policy': 'daily',
};

const mockAnnotations: VMAnnotation[] = [
  { key: 'description', value: 'Web server for production workloads', editable: true },
  { key: 'created-by', value: 'terraform', editable: false },
  { key: 'last-updated', value: '2024-01-15T10:30:00Z', editable: false },
  { key: 'maintainer', value: 'platform-team@company.com', editable: true },
  { key: 'documentation', value: 'https://wiki.company.com/vm-web-01', editable: true },
];

export const VMMetadataEditor: React.FC<VMMetadataEditorProps> = ({
  vm,
  onSave,
  onCancel,
  onChangesDetected,
}) => {
  const [metadata, setMetadata] = useState<VMMetadata>(mockMetadata);
  const [annotations, setAnnotations] = useState<VMAnnotation[]>(mockAnnotations);
  const [vmName, setVmName] = useState(vm.name);
  const [vmDescription, setVmDescription] = useState(vm.vm_name || '');
  const [enableMonitoring, setEnableMonitoring] = useState(true);
  const [enableBackup, setEnableBackup] = useState(true);
  
  const [showAddMetadataModal, setShowAddMetadataModal] = useState(false);
  const [showAddAnnotationModal, setShowAddAnnotationModal] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<VMAnnotation | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for new metadata/annotations
  const [newMetadataKey, setNewMetadataKey] = useState('');
  const [newMetadataValue, setNewMetadataValue] = useState('');
  const [newAnnotationKey, setNewAnnotationKey] = useState('');
  const [newAnnotationValue, setNewAnnotationValue] = useState('');

  const originalStateRef = useRef({
    metadata: mockMetadata,
    annotations: mockAnnotations,
    vmName: vm.name,
    vmDescription: vm.vm_name || '',
    enableMonitoring: true,
    enableBackup: true,
  });

  useEffect(() => {
    // Check if there are changes compared to original state
    const hasChanges = 
      JSON.stringify(metadata) !== JSON.stringify(originalStateRef.current.metadata) ||
      JSON.stringify(annotations) !== JSON.stringify(originalStateRef.current.annotations) ||
      vmName !== originalStateRef.current.vmName ||
      vmDescription !== originalStateRef.current.vmDescription ||
      enableMonitoring !== originalStateRef.current.enableMonitoring ||
      enableBackup !== originalStateRef.current.enableBackup;
    
    onChangesDetected(hasChanges);
  }, [metadata, annotations, vmName, vmDescription, enableMonitoring, enableBackup, onChangesDetected]);

  const validateMetadata = (key: string, value: string): string[] => {
    const errors: string[] = [];
    
    if (!key.trim()) {
      errors.push('Key is required');
    }
    
    if (!value.trim()) {
      errors.push('Value is required');
    }

    // Check for reserved keys
    const reservedKeys = ['name', 'id', 'namespace', 'uid'];
    if (reservedKeys.includes(key.toLowerCase())) {
      errors.push('This key is reserved and cannot be used');
    }

    // Check for duplicate keys
    if (Object.prototype.hasOwnProperty.call(metadata, key) && !editingAnnotation) {
      errors.push('A metadata entry with this key already exists');
    }

    // Key format validation (lowercase, alphanumeric, dashes, dots)
    if (!/^[a-z0-9.-]+$/.test(key)) {
      errors.push('Key must contain only lowercase letters, numbers, dots, and dashes');
    }

    return errors;
  };

  const validateAnnotation = (key: string, value: string): string[] => {
    const errors: string[] = [];
    
    if (!key.trim()) {
      errors.push('Key is required');
    }
    
    if (!value.trim()) {
      errors.push('Value is required');
    }

    // Check for duplicate keys
    if (annotations.some(ann => ann.key === key && (!editingAnnotation || editingAnnotation.key !== key))) {
      errors.push('An annotation with this key already exists');
    }

    return errors;
  };

  const handleAddMetadata = () => {
    const errors = validateMetadata(newMetadataKey, newMetadataValue);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setMetadata({
      ...metadata,
      [newMetadataKey]: newMetadataValue,
    });

    setNewMetadataKey('');
    setNewMetadataValue('');
    setShowAddMetadataModal(false);
    setValidationErrors([]);
  };

  const handleRemoveMetadata = (key: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove the metadata "${key}"?`
    );
    if (confirmed) {
      const newMetadata = { ...metadata };
      delete newMetadata[key];
      setMetadata(newMetadata);
    }
  };

  const handleAddAnnotation = () => {
    const errors = validateAnnotation(newAnnotationKey, newAnnotationValue);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const newAnnotation: VMAnnotation = {
      key: newAnnotationKey,
      value: newAnnotationValue,
      editable: true,
    };

    setAnnotations([...annotations, newAnnotation]);
    setNewAnnotationKey('');
    setNewAnnotationValue('');
    setShowAddAnnotationModal(false);
    setValidationErrors([]);
  };

  const handleEditAnnotation = (annotation: VMAnnotation) => {
    setEditingAnnotation(annotation);
    setNewAnnotationKey(annotation.key);
    setNewAnnotationValue(annotation.value);
    setShowAddAnnotationModal(true);
  };

  const handleUpdateAnnotation = () => {
    if (!editingAnnotation) return;

    const errors = validateAnnotation(newAnnotationKey, newAnnotationValue);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const updatedAnnotations = annotations.map(ann =>
      ann.key === editingAnnotation.key
        ? { ...ann, key: newAnnotationKey, value: newAnnotationValue }
        : ann
    );

    setAnnotations(updatedAnnotations);
    setNewAnnotationKey('');
    setNewAnnotationValue('');
    setShowAddAnnotationModal(false);
    setEditingAnnotation(null);
    setValidationErrors([]);
  };

  const handleRemoveAnnotation = (key: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove the annotation "${key}"?`
    );
    if (confirmed) {
      setAnnotations(annotations.filter(ann => ann.key !== key));
    }
  };

  const resetMetadataForm = () => {
    setNewMetadataKey('');
    setNewMetadataValue('');
    setValidationErrors([]);
  };

  const resetAnnotationForm = () => {
    setNewAnnotationKey('');
    setNewAnnotationValue('');
    setEditingAnnotation(null);
    setValidationErrors([]);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const updatedVM: VM = {
        ...vm,
        name: vmName,
        vm_name: vmDescription,
        updated_at: new Date().toISOString(),
      };

      onSave(updatedVM);
    } catch {
      setValidationErrors(['Failed to update VM metadata. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetadataActions = (key: string) => [
    {
      title: 'Remove',
      onClick: () => handleRemoveMetadata(key),
      isDanger: true,
      icon: <TrashIcon />,
    },
  ];

  const getAnnotationActions = (annotation: VMAnnotation) => {
    const actions = [];
    
    if (annotation.editable) {
      actions.push({
        title: 'Edit',
        onClick: () => handleEditAnnotation(annotation),
        icon: <EditIcon />,
      });
      actions.push({
        title: 'Remove',
        onClick: () => handleRemoveAnnotation(annotation.key),
        isDanger: true,
        icon: <TrashIcon />,
      });
    }
    
    return actions;
  };

  const hasChanges = 
    JSON.stringify(metadata) !== JSON.stringify(originalStateRef.current.metadata) ||
    JSON.stringify(annotations) !== JSON.stringify(originalStateRef.current.annotations) ||
    vmName !== originalStateRef.current.vmName ||
    vmDescription !== originalStateRef.current.vmDescription ||
    enableMonitoring !== originalStateRef.current.enableMonitoring ||
    enableBackup !== originalStateRef.current.enableBackup;

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
          title="Metadata and Annotations"
          isInline
        >
          Metadata and annotations provide additional information about the VM.
          Metadata is used for organization and automation, while annotations
          store descriptive information.
        </Alert>
      </StackItem>

      {/* Basic VM Information */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  <CogIcon className="pf-v6-u-mr-sm" />
                  Basic Information
                </Title>
                <Divider className="pf-v6-u-my-sm" />
              </StackItem>
              <StackItem>
                <Form>
                  <Grid hasGutter>
                    <GridItem span={6}>
                      <FormGroup
                        label="VM Name"
                        isRequired
                        fieldId="vm-name"
                      >
                        <TextInput
                          value={vmName}
                          type="text"
                          id="vm-name"
                          name="vm-name"
                          onChange={(_event, value) => setVmName(value)}
                        />
                      </FormGroup>
                    </GridItem>
                    <GridItem span={6}>
                      <FormGroup
                        label="Description"
                        fieldId="vm-description"
                      >
                        <TextInput
                          value={vmDescription}
                          type="text"
                          id="vm-description"
                          name="vm-description"
                          onChange={(_event, value) => setVmDescription(value)}
                          placeholder="e.g., Production web server"
                        />
                      </FormGroup>
                    </GridItem>
                    <GridItem span={6}>
                      <FormGroup
                        label="Enable Monitoring"
                        fieldId="enable-monitoring"
                      >
                        <Switch
                          id="enable-monitoring"
                          label="Enabled"
                          isChecked={enableMonitoring}
                          onChange={(_event, checked) => setEnableMonitoring(checked)}
                        />
                      </FormGroup>
                    </GridItem>
                    <GridItem span={6}>
                      <FormGroup
                        label="Enable Backup"
                        fieldId="enable-backup"
                      >
                        <Switch
                          id="enable-backup"
                          label="Enabled"
                          isChecked={enableBackup}
                          onChange={(_event, checked) => setEnableBackup(checked)}
                        />
                      </FormGroup>
                    </GridItem>
                  </Grid>
                </Form>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Metadata Section */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Flex>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <Title headingLevel="h3" size="lg">
                      <TagIcon className="pf-v6-u-mr-sm" />
                      Metadata Labels
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      icon={<PlusIcon />}
                      onClick={() => setShowAddMetadataModal(true)}
                    >
                      Add Metadata
                    </Button>
                  </FlexItem>
                </Flex>
                <Divider className="pf-v6-u-my-sm" />
              </StackItem>
              <StackItem>
                {Object.keys(metadata).length === 0 ? (
                  <div className="pf-v6-u-text-align-center pf-v6-u-color-200">
                    No metadata labels defined
                  </div>
                ) : (
                  <Table variant="compact">
                    <Thead>
                      <Tr>
                        <Th>Key</Th>
                        <Th>Value</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Object.entries(metadata).map(([key, value]) => (
                        <Tr key={key}>
                          <Td>
                            <code className="pf-v6-u-font-family-monospace">
                              {key}
                            </code>
                          </Td>
                          <Td>{value}</Td>
                          <Td>
                            <ActionsColumn items={getMetadataActions(key)} />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Annotations Section */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Flex>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <Title headingLevel="h3" size="lg">
                      <EditIcon className="pf-v6-u-mr-sm" />
                      Annotations
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      icon={<PlusIcon />}
                      onClick={() => setShowAddAnnotationModal(true)}
                    >
                      Add Annotation
                    </Button>
                  </FlexItem>
                </Flex>
                <Divider className="pf-v6-u-my-sm" />
              </StackItem>
              <StackItem>
                {annotations.length === 0 ? (
                  <div className="pf-v6-u-text-align-center pf-v6-u-color-200">
                    No annotations defined
                  </div>
                ) : (
                  <Table variant="compact">
                    <Thead>
                      <Tr>
                        <Th>Key</Th>
                        <Th>Value</Th>
                        <Th>Editable</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {annotations.map((annotation) => (
                        <Tr key={annotation.key}>
                          <Td>
                            <code className="pf-v6-u-font-family-monospace">
                              {annotation.key}
                            </code>
                          </Td>
                          <Td>{annotation.value}</Td>
                          <Td>
                            <Label color={annotation.editable ? 'green' : 'grey'}>
                              {annotation.editable ? 'Yes' : 'No'}
                            </Label>
                          </Td>
                          <Td>
                            <ActionsColumn items={getAnnotationActions(annotation)} />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
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

      {/* Add Metadata Modal */}
      <Modal
        variant={ModalVariant.small}
        title="Add Metadata Label"
        isOpen={showAddMetadataModal}
        onClose={() => {
          resetMetadataForm();
          setShowAddMetadataModal(false);
        }}
      >
        <Form>
          <FormGroup
            label="Key"
            isRequired
            fieldId="metadata-key"
          >
            <TextInput
              value={newMetadataKey}
              type="text"
              id="metadata-key"
              name="metadata-key"
              onChange={(_event, value) => setNewMetadataKey(value)}
              placeholder="e.g., environment"
            />
          </FormGroup>
          <FormGroup
            label="Value"
            isRequired
            fieldId="metadata-value"
          >
            <TextInput
              value={newMetadataValue}
              type="text"
              id="metadata-value"
              name="metadata-value"
              onChange={(_event, value) => setNewMetadataValue(value)}
              placeholder="e.g., production"
            />
          </FormGroup>
        </Form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
          }}
        >
          <Button
            variant="link"
            onClick={() => {
              resetMetadataForm();
              setShowAddMetadataModal(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddMetadata}
            isDisabled={!newMetadataKey.trim() || !newMetadataValue.trim()}
          >
            Add Metadata
          </Button>
        </div>
      </Modal>

      {/* Add/Edit Annotation Modal */}
      <Modal
        variant={ModalVariant.medium}
        title={editingAnnotation ? 'Edit Annotation' : 'Add Annotation'}
        isOpen={showAddAnnotationModal}
        onClose={() => {
          resetAnnotationForm();
          setShowAddAnnotationModal(false);
        }}
      >
        <Form>
          <FormGroup
            label="Key"
            isRequired
            fieldId="annotation-key"
          >
            <TextInput
              value={newAnnotationKey}
              type="text"
              id="annotation-key"
              name="annotation-key"
              onChange={(_event, value) => setNewAnnotationKey(value)}
              placeholder="e.g., description"
            />
          </FormGroup>
          <FormGroup
            label="Value"
            isRequired
            fieldId="annotation-value"
          >
            <TextArea
              value={newAnnotationValue}
              id="annotation-value"
              name="annotation-value"
              onChange={(_event, value) => setNewAnnotationValue(value)}
              placeholder="e.g., This VM hosts the main company website"
              rows={3}
            />
          </FormGroup>
        </Form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
          }}
        >
          <Button
            variant="link"
            onClick={() => {
              resetAnnotationForm();
              setShowAddAnnotationModal(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={editingAnnotation ? handleUpdateAnnotation : handleAddAnnotation}
            isDisabled={!newAnnotationKey.trim() || !newAnnotationValue.trim()}
          >
            {editingAnnotation ? 'Update Annotation' : 'Add Annotation'}
          </Button>
        </div>
      </Modal>
    </Stack>
  );
};

export default VMMetadataEditor;