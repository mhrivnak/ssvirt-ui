import React, { useState, useCallback } from 'react';
import {
  Modal,
  ModalVariant,
  Wizard,
  Button,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';
import {
  useCreateVM,
  useCatalogs,
  useAllCatalogItems,
} from '../../hooks';
import type {
  CreateVMRequest,
  VMNetworkConfig,
  VMStorageConfig,
  VMAdvancedConfig,
  VDC,
  CatalogItem,
} from '../../types';

// Step components
import TemplateSelectionStep from './wizard/TemplateSelectionStep';
import BasicConfigurationStep from './wizard/BasicConfigurationStep';
import ResourceSpecificationStep from './wizard/ResourceSpecificationStep';
import NetworkConfigurationStep from './wizard/NetworkConfigurationStep';
import StorageConfigurationStep from './wizard/StorageConfigurationStep';
import AdvancedOptionsStep from './wizard/AdvancedOptionsStep';
import ReviewAndCreateStep from './wizard/ReviewAndCreateStep';
import VMTemplateManager from './wizard/VMTemplateManager';
import * as VMCreationProgressModule from './VMCreationProgress';

interface VMCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVDC?: string;
  preselectedTemplate?: string;
}

export interface WizardFormData {
  // Basic Configuration
  name: string;
  description: string;
  vdc_id: string;

  // Template Selection
  catalog_item_id: string;
  selectedTemplate?: CatalogItem;

  // Resource Specification
  cpu_count: number;
  memory_mb: number;

  // Network Configuration
  network_config: VMNetworkConfig;

  // Storage Configuration
  storage_config: VMStorageConfig;

  // Advanced Options
  advanced_config: VMAdvancedConfig;
}

const VMCreationWizard: React.FC<VMCreationWizardProps> = ({
  isOpen,
  onClose,
  preselectedVDC,
  preselectedTemplate,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // Function to create initial form data
  const createInitialFormData = (): WizardFormData => ({
    name: '',
    description: '',
    vdc_id: preselectedVDC || '',
    catalog_item_id: preselectedTemplate || '',
    selectedTemplate: undefined,
    cpu_count: 2,
    memory_mb: 4096,
    network_config: {
      ip_allocation_mode: 'DHCP',
      dns_servers: [],
    },
    storage_config: {
      disk_size_gb: 50,
      additional_disks: [],
    },
    advanced_config: {
      cloud_init_enabled: false,
      guest_customization: false,
      auto_logon: false,
      custom_properties: {},
    },
  });

  // Initial form data
  const [formData, setFormData] = useState<WizardFormData>(
    createInitialFormData
  );

  // Hooks
  const createVMMutation = useCreateVM();
  // TODO: VDCs now require organization ID - this needs proper implementation
  const vdcs: VDC[] = [];
  const { data: catalogsResponse } = useCatalogs();
  const { data: catalogItemsResponse } = useAllCatalogItems();
  const catalogs = catalogsResponse?.data || [];
  const catalogItems = catalogItemsResponse?.data || [];

  const updateFormData = useCallback((updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setError(null); // Clear errors when form data changes
  }, []);

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Template Selection
        return !!formData.catalog_item_id;
      case 1: // Basic Configuration
        return !!formData.name.trim() && !!formData.vdc_id;
      case 2: // Resource Specification
        return formData.cpu_count > 0 && formData.memory_mb > 0;
      case 3: // Network Configuration
        if (formData.network_config.ip_allocation_mode === 'STATIC') {
          return !!(
            formData.network_config.ip_address &&
            formData.network_config.gateway &&
            formData.network_config.subnet_mask
          );
        }
        return true;
      case 4: // Storage Configuration
        return (formData.storage_config.disk_size_gb ?? 0) > 0;
      case 5: // Advanced Options
        if (formData.advanced_config.cloud_init_enabled) {
          return !!formData.advanced_config.cloud_init_script?.trim();
        }
        return true;
      case 6: // Review and Create
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStepIndex)) {
      const newIndex = activeStepIndex + 1;
      setActiveStepIndex(newIndex);
    } else {
      setError('Please complete all required fields before continuing.');
    }
  };

  const handleBack = () => {
    setActiveStepIndex(activeStepIndex - 1);
    setError(null);
  };

  const handleCreate = async () => {
    if (!validateStep(6)) {
      setError('Please review and correct any validation errors.');
      return;
    }

    setIsCreating(true);
    setError(null);
    setCreationError(null);

    try {
      const createRequest: CreateVMRequest = {
        name: formData.name,
        vdc_id: formData.vdc_id,
        catalog_item_id: formData.catalog_item_id,
        cpu_count: formData.cpu_count,
        memory_mb: formData.memory_mb,
        description: formData.description || undefined,
        network_config: formData.network_config,
        storage_config: formData.storage_config,
        advanced_config: formData.advanced_config,
      };

      // Start the VM creation
      await createVMMutation.mutateAsync(createRequest);

      setShowProgress(true);
      onClose();
    } catch (error) {
      console.error('Failed to create VM:', error);
      setError('Failed to create virtual machine. Please try again.');
      setCreationError('Failed to create virtual machine. Please try again.');
      setShowProgress(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setActiveStepIndex(0);
    setError(null);
    setIsCreating(false);
    setShowProgress(false);
    setCreationError(null);
    // Reset form data
    setFormData(createInitialFormData());
    onClose();
  };

  const handleProgressClose = () => {
    setShowProgress(false);
    setCreationError(null);
  };

  const handleLoadTemplate = (templateData: Partial<WizardFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...templateData,
    }));
    setShowTemplateManager(false);
  };

  const steps = [
    {
      name: 'Template Selection',
      component: (
        <TemplateSelectionStep
          formData={formData}
          updateFormData={updateFormData}
          catalogItems={catalogItems}
          catalogs={catalogs}
        />
      ),
    },
    {
      name: 'Basic Configuration',
      component: (
        <BasicConfigurationStep
          formData={formData}
          updateFormData={updateFormData}
          vdcs={vdcs}
        />
      ),
    },
    {
      name: 'Resource Specification',
      component: (
        <ResourceSpecificationStep
          formData={formData}
          updateFormData={updateFormData}
        />
      ),
    },
    {
      name: 'Network Configuration',
      component: (
        <NetworkConfigurationStep
          formData={formData}
          updateFormData={updateFormData}
          selectedVDC={vdcs.find((vdc: VDC) => vdc.id === formData.vdc_id)}
        />
      ),
    },
    {
      name: 'Storage Configuration',
      component: (
        <StorageConfigurationStep
          formData={formData}
          updateFormData={updateFormData}
        />
      ),
    },
    {
      name: 'Advanced Options',
      component: (
        <AdvancedOptionsStep
          formData={formData}
          updateFormData={updateFormData}
        />
      ),
    },
    {
      name: 'Review & Create',
      component: (
        <ReviewAndCreateStep
          formData={formData}
          vdcs={vdcs}
          catalogItems={catalogItems}
        />
      ),
    },
  ];

  return (
    <Modal
      variant={ModalVariant.large}
      title="Create Virtual Machine"
      isOpen={isOpen}
      onClose={handleClose}
    >
      {error && (
        <Alert
          variant={AlertVariant.danger}
          title="Validation Error"
          isInline
          style={{ margin: '0 0 16px 0' }}
        >
          {error}
        </Alert>
      )}

      <Wizard>
        {steps[activeStepIndex]?.component}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '24px',
            borderTop: '1px solid var(--pf-v6-global--BorderColor--100)',
            marginTop: '24px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="link" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="link"
              onClick={() => setShowTemplateManager(true)}
              isDisabled={isCreating}
            >
              Templates
            </Button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {activeStepIndex > 0 && (
              <Button
                variant="secondary"
                onClick={handleBack}
                isDisabled={isCreating}
              >
                Back
              </Button>
            )}
            {activeStepIndex < steps.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                isDisabled={!validateStep(activeStepIndex) || isCreating}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleCreate}
                isLoading={isCreating}
                isDisabled={!validateStep(activeStepIndex)}
              >
                Create VM
              </Button>
            )}
          </div>
        </div>
      </Wizard>

      <VMCreationProgressModule.default
        isOpen={showProgress}
        onClose={handleProgressClose}
        vmName={formData.name}
        vdcName={
          vdcs.find((vdc: VDC) => vdc.id === formData.vdc_id)?.name || 'Unknown VDC'
        }
        error={creationError || undefined}
      />

      {/* VM Template Manager Modal */}
      <VMTemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        onLoadTemplate={handleLoadTemplate}
        currentFormData={formData}
      />
    </Modal>
  );
};

export default VMCreationWizard;
