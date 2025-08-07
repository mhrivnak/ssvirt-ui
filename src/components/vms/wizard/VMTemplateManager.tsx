import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalVariant,
  Title,
  Button,
  Card,
  CardBody,
  Stack,
  StackItem,
  Grid,
  GridItem,
  TextInput,
  TextArea,
  FormGroup,
  Alert,
  AlertVariant,
  Badge,
  Label,
  Switch,
  EmptyState,
  EmptyStateVariant,
  EmptyStateBody,
  EmptyStateActions,
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
import { PlusIcon, CatalogIcon, ImportIcon } from '@patternfly/react-icons';
import type { WizardFormData } from '../VMCreationWizard';
import type { VMCreationTemplate } from '../../../types';

interface VMTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (formData: Partial<WizardFormData>) => void;
  currentFormData?: WizardFormData;
}

interface TemplateFormData {
  name: string;
  description: string;
  isShared: boolean;
}

const VMTemplateManager: React.FC<VMTemplateManagerProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
  currentFormData,
}) => {
  const [templates, setTemplates] = useState<VMCreationTemplate[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<VMCreationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFormData>({
    name: '',
    description: '',
    isShared: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Load templates from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = () => {
    try {
      const savedTemplates = localStorage.getItem('vm_creation_templates');
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates);
        setTemplates(parsed);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setError('Failed to load saved templates');
    }
  };

  const saveTemplates = (updatedTemplates: VMCreationTemplate[]) => {
    try {
      localStorage.setItem(
        'vm_creation_templates',
        JSON.stringify(updatedTemplates)
      );
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Failed to save templates:', error);
      setError('Failed to save templates');
    }
  };

  const handleCreateTemplate = () => {
    if (!currentFormData || !templateForm.name.trim()) {
      setError('Template name is required');
      return;
    }

    const newTemplate: VMCreationTemplate = {
      id: `template-${Date.now()}`,
      name: templateForm.name.trim(),
      description: templateForm.description.trim(),
      catalog_item_id: currentFormData.catalog_item_id,
      cpu_count: currentFormData.cpu_count,
      memory_mb: currentFormData.memory_mb,
      network_config: currentFormData.network_config,
      storage_config: currentFormData.storage_config,
      advanced_config: currentFormData.advanced_config,
      created_by: 'anonymous', // TODO: Replace with actual user from auth context when available
      created_at: new Date().toISOString(),
      is_shared: templateForm.isShared,
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);
    resetForm();
  };

  const handleEditTemplate = (template: VMCreationTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      isShared: template.is_shared,
    });
    setShowCreateForm(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !templateForm.name.trim()) {
      setError('Template name is required');
      return;
    }

    const updatedTemplate: VMCreationTemplate = {
      ...editingTemplate,
      name: templateForm.name.trim(),
      description: templateForm.description.trim(),
      is_shared: templateForm.isShared,
    };

    const updatedTemplates = templates.map((t) =>
      t.id === editingTemplate.id ? updatedTemplate : t
    );
    saveTemplates(updatedTemplates);
    resetForm();
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter((t) => t.id !== templateId);
    saveTemplates(updatedTemplates);
  };

  const handleLoadTemplate = (template: VMCreationTemplate) => {
    const formData: Partial<WizardFormData> = {
      catalog_item_id: template.catalog_item_id,
      cpu_count: template.cpu_count,
      memory_mb: template.memory_mb,
      network_config: template.network_config,
      storage_config: template.storage_config,
      advanced_config: template.advanced_config,
    };

    onLoadTemplate(formData);
    onClose();
  };

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      isShared: false,
    });
    setShowCreateForm(false);
    setEditingTemplate(null);
    setError(null);
  };

  const handleExportTemplate = (template: VMCreationTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vm-template-${template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string);
        // Validate template structure
        if (!template.name || !template.catalog_item_id) {
          setError('Invalid template file format');
          return;
        }

        // Generate new ID and update metadata
        const importedTemplate: VMCreationTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          created_by: 'current-user',
          created_at: new Date().toISOString(),
          is_shared: false,
        };

        const updatedTemplates = [...templates, importedTemplate];
        saveTemplates(updatedTemplates);
      } catch (error) {
        console.error('Failed to import template:', error);
        setError('Failed to import template: Invalid JSON format');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const formatMemory = (memoryMb: number) => {
    if (memoryMb >= 1024) {
      return `${(memoryMb / 1024).toFixed(1)} GB`;
    }
    return `${memoryMb} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal
      variant={ModalVariant.large}
      title="VM Template Manager"
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
    >
      <Stack hasGutter>
        {error && (
          <StackItem>
            <Alert variant={AlertVariant.danger} title="Error" isInline>
              {error}
              <Button
                variant="plain"
                onClick={() => setError(null)}
                style={{ float: 'right' }}
              >
                ×
              </Button>
            </Alert>
          </StackItem>
        )}

        {/* Create/Edit Template Form */}
        {showCreateForm && (
          <StackItem>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      {editingTemplate
                        ? 'Edit Template'
                        : 'Create New Template'}
                    </Title>
                  </StackItem>

                  <StackItem>
                    <Grid hasGutter>
                      <GridItem span={6}>
                        <FormGroup
                          label="Template Name"
                          isRequired
                          fieldId="template-name"
                        >
                          <TextInput
                            id="template-name"
                            value={templateForm.name}
                            onChange={(_, value) =>
                              setTemplateForm((prev) => ({
                                ...prev,
                                name: value,
                              }))
                            }
                            placeholder="Enter template name..."
                          />
                        </FormGroup>
                      </GridItem>
                      <GridItem span={6}>
                        <FormGroup fieldId="template-shared">
                          <Switch
                            id="template-shared"
                            label="Make template shared"
                            isChecked={templateForm.isShared}
                            onChange={(_, checked) =>
                              setTemplateForm((prev) => ({
                                ...prev,
                                isShared: checked,
                              }))
                            }
                          />
                        </FormGroup>
                      </GridItem>
                    </Grid>
                  </StackItem>

                  <StackItem>
                    <FormGroup
                      label="Description"
                      fieldId="template-description"
                    >
                      <TextArea
                        id="template-description"
                        value={templateForm.description}
                        onChange={(_, value) =>
                          setTemplateForm((prev) => ({
                            ...prev,
                            description: value,
                          }))
                        }
                        placeholder="Optional description..."
                        rows={3}
                      />
                    </FormGroup>
                  </StackItem>

                  {currentFormData && (
                    <StackItem>
                      <Alert
                        variant={AlertVariant.info}
                        title="Template Configuration Preview"
                        isInline
                        isPlain
                      >
                        <strong>Resources:</strong> {currentFormData.cpu_count}{' '}
                        CPU, {formatMemory(currentFormData.memory_mb)}
                        <br />
                        <strong>Storage:</strong>{' '}
                        {currentFormData.storage_config.disk_size_gb} GB
                        <br />
                        <strong>Network:</strong>{' '}
                        {currentFormData.network_config.ip_allocation_mode}
                        {currentFormData.advanced_config.cloud_init_enabled && (
                          <>
                            <br />
                            <strong>Advanced:</strong> Cloud-init enabled
                          </>
                        )}
                      </Alert>
                    </StackItem>
                  )}

                  <StackItem>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Button
                        variant="primary"
                        onClick={
                          editingTemplate
                            ? handleUpdateTemplate
                            : handleCreateTemplate
                        }
                        isDisabled={
                          !templateForm.name.trim() || !currentFormData
                        }
                      >
                        {editingTemplate
                          ? 'Update Template'
                          : 'Create Template'}
                      </Button>
                      <Button variant="link" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </StackItem>
        )}

        {/* Template Actions */}
        {!showCreateForm && (
          <StackItem>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Title headingLevel="h3" size="lg">
                Saved Templates
              </Title>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportTemplate}
                    style={{ display: 'none' }}
                    id="import-template"
                  />
                  <Button
                    variant="secondary"
                    icon={<ImportIcon />}
                    onClick={() =>
                      document.getElementById('import-template')?.click()
                    }
                  >
                    Import
                  </Button>
                </div>
                <Button
                  variant="primary"
                  icon={<PlusIcon />}
                  onClick={() => setShowCreateForm(true)}
                  isDisabled={!currentFormData}
                >
                  Create from Current
                </Button>
              </div>
            </div>
          </StackItem>
        )}

        {/* Templates List */}
        {!showCreateForm && (
          <StackItem>
            {templates.length === 0 ? (
              <EmptyState variant={EmptyStateVariant.lg}>
                <CatalogIcon />
                <Title headingLevel="h4" size="lg">
                  No templates saved
                </Title>
                <EmptyStateBody>
                  Create your first VM template to reuse configurations for
                  future deployments.
                </EmptyStateBody>
                <EmptyStateActions>
                  <Button
                    variant="primary"
                    icon={<PlusIcon />}
                    onClick={() => setShowCreateForm(true)}
                    isDisabled={!currentFormData}
                  >
                    Create Template
                  </Button>
                </EmptyStateActions>
              </EmptyState>
            ) : (
              <Card>
                <CardBody className="pf-v6-u-p-0">
                  <Table variant="compact">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Resources</Th>
                        <Th>Network</Th>
                        <Th>Created</Th>
                        <Th>Shared</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {templates.map((template) => (
                        <Tr key={template.id}>
                          <Td>
                            <div>
                              <strong>{template.name}</strong>
                              {template.description && (
                                <div className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                                  {template.description}
                                </div>
                              )}
                            </div>
                          </Td>
                          <Td>
                            <div
                              style={{
                                display: 'flex',
                                gap: '4px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <Badge>{template.cpu_count} CPU</Badge>
                              <Badge>{formatMemory(template.memory_mb)}</Badge>
                              <Badge>
                                {template.storage_config?.disk_size_gb || 50} GB
                              </Badge>
                            </div>
                          </Td>
                          <Td>
                            <Badge color="blue">
                              {template.network_config?.ip_allocation_mode ||
                                'DHCP'}
                            </Badge>
                          </Td>
                          <Td>
                            <div className="pf-v6-u-font-size-sm">
                              {formatDate(template.created_at)}
                              <div className="pf-v6-u-color-200">
                                by {template.created_by}
                              </div>
                            </div>
                          </Td>
                          <Td>
                            {template.is_shared ? (
                              <Label color="green">Shared</Label>
                            ) : (
                              <Label color="grey">Private</Label>
                            )}
                          </Td>
                          <Td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleLoadTemplate(template)}
                              >
                                Load
                              </Button>
                              <ActionsColumn
                                items={[
                                  {
                                    title: 'Edit',
                                    onClick: () => handleEditTemplate(template),
                                  },
                                  {
                                    title: 'Export',
                                    onClick: () =>
                                      handleExportTemplate(template),
                                  },
                                  { isSeparator: true },
                                  {
                                    title: 'Delete',
                                    onClick: () =>
                                      handleDeleteTemplate(template.id),
                                    isDanger: true,
                                  },
                                ]}
                              />
                            </div>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            )}
          </StackItem>
        )}

        {!showCreateForm && currentFormData && (
          <StackItem>
            <Alert
              variant={AlertVariant.info}
              title="Current Configuration Available"
              isInline
            >
              You can create a template from your current wizard configuration
              to save and reuse these settings later.
            </Alert>
          </StackItem>
        )}

        {/* Modal Actions */}
        <StackItem>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '16px 0',
              borderTop: '1px solid var(--pf-v6-global--BorderColor--100)',
            }}
          >
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </StackItem>
      </Stack>
    </Modal>
  );
};

export default VMTemplateManager;
