import React, { useState, useMemo } from 'react';
import {
  Stack,
  StackItem,
  Title,
  Card,
  CardBody,
  Grid,
  GridItem,
  SearchInput,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Label,
  Badge,
  Radio,
  Alert,
  AlertVariant,
  EmptyState,
  EmptyStateVariant,
  EmptyStateBody,
  Spinner,
  Bullseye,
} from '@patternfly/react-core';
import {
  VirtualMachineIcon,
  CatalogIcon,
  CpuIcon,
  ServerIcon,
} from '@patternfly/react-icons';
import type { MenuToggleElement } from '@patternfly/react-core';
import type { WizardFormData } from '../VMCreationWizard';
import type { CatalogItem, Catalog } from '../../../types';

interface TemplateSelectionStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  catalogItems: CatalogItem[];
  catalogs: Catalog[];
}

const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  formData,
  updateFormData,
  catalogItems,
  catalogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [isCatalogSelectOpen, setIsCatalogSelectOpen] = useState(false);

  const filteredCatalogItems = useMemo(() => {
    return catalogItems.filter((item) => {
      const matchesSearch = searchTerm
        ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.os_type.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchesCatalog = selectedCatalogId
        ? item.catalog_id === selectedCatalogId
        : true;

      return matchesSearch && matchesCatalog;
    });
  }, [catalogItems, searchTerm, selectedCatalogId]);

  const handleTemplateSelect = (catalogItem: CatalogItem) => {
    updateFormData({
      catalog_item_id: catalogItem.id,
      selectedTemplate: catalogItem,
      cpu_count: catalogItem.cpu_count || 2,
      memory_mb: catalogItem.memory_mb || 4096,
      storage_config: {
        ...formData.storage_config,
        disk_size_gb: catalogItem.disk_size_gb || 50,
      },
    });
  };

  const formatMemory = (memoryMb: number) => {
    if (memoryMb >= 1024) {
      return `${(memoryMb / 1024).toFixed(1)} GB`;
    }
    return `${memoryMb} MB`;
  };

  const getOSIcon = (osType: string) => {
    if (osType.toLowerCase().includes('windows')) {
      return '🪟';
    } else if (osType.toLowerCase().includes('ubuntu')) {
      return '🐧';
    } else if (
      osType.toLowerCase().includes('centos') ||
      osType.toLowerCase().includes('rhel')
    ) {
      return '🎩';
    }
    return '💿';
  };

  if (!catalogItems.length) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="xl">
          <VirtualMachineIcon className="pf-v6-u-mr-sm" />
          Select Template
        </Title>
        <p className="pf-v6-u-color-200">
          Choose a template to use as the base for your virtual machine.
          Templates define the operating system and initial configuration.
        </p>
      </StackItem>

      {/* Search and Filter Controls */}
      <StackItem>
        <Card>
          <CardBody>
            <Grid hasGutter>
              <GridItem span={8}>
                <SearchInput
                  placeholder="Search templates by name, description, or OS type..."
                  value={searchTerm}
                  onChange={(_, value) => setSearchTerm(value)}
                  onClear={() => setSearchTerm('')}
                />
              </GridItem>
              <GridItem span={4}>
                <Select
                  id="catalog-filter"
                  isOpen={isCatalogSelectOpen}
                  selected={selectedCatalogId}
                  onSelect={(_, selection) => {
                    setSelectedCatalogId(selection as string);
                    setIsCatalogSelectOpen(false);
                  }}
                  onOpenChange={setIsCatalogSelectOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() =>
                        setIsCatalogSelectOpen(!isCatalogSelectOpen)
                      }
                      isExpanded={isCatalogSelectOpen}
                      icon={<CatalogIcon />}
                    >
                      {selectedCatalogId
                        ? catalogs.find(
                            (catalog) => catalog.id === selectedCatalogId
                          )?.name || 'Unknown Catalog'
                        : 'All Catalogs'}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    <SelectOption value="">All Catalogs</SelectOption>
                    {catalogs.map((catalog) => (
                      <SelectOption key={catalog.id} value={catalog.id}>
                        {catalog.name}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>
      </StackItem>

      {/* Template Selection */}
      <StackItem>
        {filteredCatalogItems.length === 0 ? (
          <EmptyState variant={EmptyStateVariant.lg}>
            <VirtualMachineIcon />
            <Title headingLevel="h4" size="lg">
              No templates found
            </Title>
            <EmptyStateBody>
              {searchTerm || selectedCatalogId
                ? 'Try adjusting your search criteria or clear the filters.'
                : 'No templates are available in the selected catalogs.'}
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <Grid hasGutter>
            {filteredCatalogItems.map((catalogItem) => (
              <GridItem key={catalogItem.id} span={6}>
                <Card
                  isSelectable
                  isSelected={formData.catalog_item_id === catalogItem.id}
                  onClick={() => handleTemplateSelect(catalogItem)}
                  style={{ cursor: 'pointer' }}
                >
                  <CardBody>
                    <Stack hasGutter>
                      <StackItem>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                          }}
                        >
                          <Radio
                            id={`template-${catalogItem.id}`}
                            name="template-selection"
                            isChecked={
                              formData.catalog_item_id === catalogItem.id
                            }
                            onChange={() => handleTemplateSelect(catalogItem)}
                            aria-label={`Select ${catalogItem.name} template`}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px',
                              }}
                            >
                              <span style={{ fontSize: '1.2em' }}>
                                {getOSIcon(catalogItem.os_type)}
                              </span>
                              <Title headingLevel="h4" size="md">
                                {catalogItem.name}
                              </Title>
                            </div>
                            <p className="pf-v6-u-color-200 pf-v6-u-mb-sm">
                              {catalogItem.description}
                            </p>
                            <div
                              style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <Badge>
                                <CpuIcon className="pf-v6-u-mr-xs" />
                                {catalogItem.cpu_count} CPU
                              </Badge>
                              <Badge>
                                <ServerIcon className="pf-v6-u-mr-xs" />
                                {formatMemory(catalogItem.memory_mb)}
                              </Badge>
                              <Badge>
                                {catalogItem.disk_size_gb} GB Storage
                              </Badge>
                              <Label color="blue">
                                {catalogItem.vm_instance_type}
                              </Label>
                            </div>
                          </div>
                        </div>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>
        )}
      </StackItem>

      {/* Selected Template Summary */}
      {formData.selectedTemplate && (
        <StackItem>
          <Alert variant={AlertVariant.info} isInline title="Template Selected">
            <strong>{formData.selectedTemplate.name}</strong> -{' '}
            {formData.selectedTemplate.description}
            <br />
            Default configuration: {
              formData.selectedTemplate.cpu_count
            } CPU, {formatMemory(formData.selectedTemplate.memory_mb)},{' '}
            {formData.selectedTemplate.disk_size_gb} GB storage
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};

export default TemplateSelectionStep;
