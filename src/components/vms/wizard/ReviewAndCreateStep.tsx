import React from 'react';
import {
  Stack,
  StackItem,
  Title,
  Card,
  CardBody,
  Grid,
  GridItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Alert,
  AlertVariant,
  Badge,
  Label,
  Divider,
  CodeBlock,
  CodeBlockCode,
  ExpandableSection,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  VirtualMachineIcon,
  CpuIcon,
  ServerIcon,
  NetworkIcon,
  CogIcon,
} from '@patternfly/react-icons';
import type { WizardFormData } from '../VMCreationWizard';
import type { VDC, CatalogItem } from '../../../types';
import { formatMegabytes } from '../../../utils/formatters';

interface ReviewAndCreateStepProps {
  formData: WizardFormData;
  vdcs: VDC[];
  catalogItems: CatalogItem[];
}

const ReviewAndCreateStep: React.FC<ReviewAndCreateStepProps> = ({
  formData,
  vdcs,
  catalogItems,
}) => {
  const selectedVDC = vdcs.find((vdc) => vdc.id === formData.vdc_id);
  const selectedTemplate = catalogItems.find(
    (item) => item.id === formData.catalog_item_id
  );

  const getTotalStorage = () => {
    const primarySize = formData.storage_config.disk_size_gb || 0;
    const additionalSize = (
      formData.storage_config.additional_disks || []
    ).reduce((total, disk) => total + disk.size_gb, 0);
    return primarySize + additionalSize;
  };

  const customProperties = formData.advanced_config.custom_properties || {};
  const additionalDisks = formData.storage_config.additional_disks || [];
  const dnsServers = formData.network_config.dns_servers || [];

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="xl">
          <CheckCircleIcon className="pf-v6-u-mr-sm" />
          Review & Create
        </Title>
        <p className="pf-v6-u-color-200">
          Review your virtual machine configuration before creating. You can go
          back to any step to make changes.
        </p>
      </StackItem>

      {/* VM Overview */}
      <StackItem>
        <Card>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  <VirtualMachineIcon className="pf-v6-u-mr-sm" />
                  Virtual Machine Overview
                </Title>
              </StackItem>

              <StackItem>
                <Grid hasGutter>
                  <GridItem span={6}>
                    <DescriptionList>
                      <DescriptionListGroup>
                        <DescriptionListTerm>VM Name</DescriptionListTerm>
                        <DescriptionListDescription>
                          <strong>{formData.name}</strong>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Description</DescriptionListTerm>
                        <DescriptionListDescription>
                          {formData.description || (
                            <em>No description provided</em>
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          Virtual Data Center
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          <Badge color="blue">
                            {selectedVDC?.name || 'Unknown VDC'}
                          </Badge>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </GridItem>

                  <GridItem span={6}>
                    <DescriptionList>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Template</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Badge color="green">
                            {selectedTemplate?.name || 'Unknown Template'}
                          </Badge>
                          <br />
                          <span className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                            {selectedTemplate?.description}
                          </span>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          Operating System
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          {selectedTemplate?.os_type || 'Unknown OS'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </GridItem>
                </Grid>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </StackItem>

      {/* Resource Configuration */}
      <StackItem>
        <Grid hasGutter>
          <GridItem span={4}>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      <CpuIcon className="pf-v6-u-mr-sm" />
                      Compute Resources
                    </Title>
                  </StackItem>
                  <StackItem>
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>CPU Cores</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Badge>{formData.cpu_count} cores</Badge>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Memory</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Badge>{formatMegabytes(formData.memory_mb)}</Badge>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={4}>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      <ServerIcon className="pf-v6-u-mr-sm" />
                      Storage Configuration
                    </Title>
                  </StackItem>
                  <StackItem>
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Primary Disk</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Badge>
                            {formData.storage_config.disk_size_gb} GB
                          </Badge>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          Additional Disks
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          <Badge
                            color={additionalDisks.length > 0 ? 'blue' : 'grey'}
                          >
                            {additionalDisks.length} disk
                            {additionalDisks.length !== 1 ? 's' : ''}
                          </Badge>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Total Storage</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Badge color="green">{getTotalStorage()} GB</Badge>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      {formData.storage_config.storage_profile && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>
                            Storage Profile
                          </DescriptionListTerm>
                          <DescriptionListDescription>
                            <Label color="blue">
                              {formData.storage_config.storage_profile}
                            </Label>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                    </DescriptionList>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={4}>
            <Card>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="lg">
                      <NetworkIcon className="pf-v6-u-mr-sm" />
                      Network Configuration
                    </Title>
                  </StackItem>
                  <StackItem>
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>IP Allocation</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Badge
                            color={
                              formData.network_config.ip_allocation_mode ===
                              'STATIC'
                                ? 'orange'
                                : 'green'
                            }
                          >
                            {formData.network_config.ip_allocation_mode}
                          </Badge>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      {formData.network_config.ip_allocation_mode ===
                        'STATIC' && (
                        <>
                          <DescriptionListGroup>
                            <DescriptionListTerm>
                              IP Address
                            </DescriptionListTerm>
                            <DescriptionListDescription>
                              {formData.network_config.ip_address || 'Not set'}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Gateway</DescriptionListTerm>
                            <DescriptionListDescription>
                              {formData.network_config.gateway || 'Not set'}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </>
                      )}
                      <DescriptionListGroup>
                        <DescriptionListTerm>DNS Servers</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Badge
                            color={dnsServers.length > 0 ? 'blue' : 'grey'}
                          >
                            {dnsServers.length > 0
                              ? `${dnsServers.length} configured`
                              : 'Default'}
                          </Badge>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>

      {/* Advanced Configuration */}
      {(formData.advanced_config.cloud_init_enabled ||
        formData.advanced_config.guest_customization ||
        Object.keys(customProperties).length > 0) && (
        <StackItem>
          <Card>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <Title headingLevel="h3" size="lg">
                    <CogIcon className="pf-v6-u-mr-sm" />
                    Advanced Configuration
                  </Title>
                </StackItem>

                <StackItem>
                  <Grid hasGutter>
                    {/* Cloud-init */}
                    {formData.advanced_config.cloud_init_enabled && (
                      <GridItem span={6}>
                        <Card isCompact>
                          <CardBody>
                            <Stack hasGutter>
                              <StackItem>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  <Label color="green">
                                    Cloud-init Enabled
                                  </Label>
                                </div>
                              </StackItem>
                              {formData.advanced_config.cloud_init_script && (
                                <StackItem>
                                  <ExpandableSection toggleText="View cloud-init script">
                                    <CodeBlock>
                                      <CodeBlockCode>
                                        {formData.advanced_config
                                          .cloud_init_script.length > 200
                                          ? `${formData.advanced_config.cloud_init_script.substring(0, 200)}...`
                                          : formData.advanced_config
                                              .cloud_init_script}
                                      </CodeBlockCode>
                                    </CodeBlock>
                                  </ExpandableSection>
                                </StackItem>
                              )}
                            </Stack>
                          </CardBody>
                        </Card>
                      </GridItem>
                    )}

                    {/* Guest Customization */}
                    {formData.advanced_config.guest_customization && (
                      <GridItem span={6}>
                        <Card isCompact>
                          <CardBody>
                            <Stack hasGutter>
                              <StackItem>
                                <Label color="blue">
                                  Guest Customization Enabled
                                </Label>
                              </StackItem>
                              <StackItem>
                                <DescriptionList isCompact>
                                  {formData.advanced_config.computer_name && (
                                    <DescriptionListGroup>
                                      <DescriptionListTerm>
                                        Computer Name
                                      </DescriptionListTerm>
                                      <DescriptionListDescription>
                                        {formData.advanced_config.computer_name}
                                      </DescriptionListDescription>
                                    </DescriptionListGroup>
                                  )}
                                  {formData.advanced_config.time_zone && (
                                    <DescriptionListGroup>
                                      <DescriptionListTerm>
                                        Time Zone
                                      </DescriptionListTerm>
                                      <DescriptionListDescription>
                                        {formData.advanced_config.time_zone}
                                      </DescriptionListDescription>
                                    </DescriptionListGroup>
                                  )}
                                  <DescriptionListGroup>
                                    <DescriptionListTerm>
                                      Auto Logon
                                    </DescriptionListTerm>
                                    <DescriptionListDescription>
                                      {formData.advanced_config.auto_logon
                                        ? 'Enabled'
                                        : 'Disabled'}
                                    </DescriptionListDescription>
                                  </DescriptionListGroup>
                                </DescriptionList>
                              </StackItem>
                            </Stack>
                          </CardBody>
                        </Card>
                      </GridItem>
                    )}
                  </Grid>
                </StackItem>

                {/* Custom Properties */}
                {Object.keys(customProperties).length > 0 && (
                  <StackItem>
                    <Divider />
                    <div>
                      <strong>Custom Properties:</strong>
                      <div
                        style={{
                          marginTop: '8px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        {Object.entries(customProperties).map(
                          ([key, value]) => (
                            <Badge key={key} color="purple">
                              {key}: {value}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </StackItem>
                )}
              </Stack>
            </CardBody>
          </Card>
        </StackItem>
      )}

      {/* Additional Disk Details */}
      {additionalDisks.length > 0 && (
        <StackItem>
          <Card>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <Title headingLevel="h3" size="lg">
                    Additional Storage Details
                  </Title>
                </StackItem>
                <StackItem>
                  <Grid hasGutter>
                    {additionalDisks.map((disk, index) => (
                      <GridItem key={disk.id} span={6}>
                        <Card isCompact>
                          <CardBody>
                            <DescriptionList isCompact>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Disk Name
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  Hard disk {index + 2}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Size</DescriptionListTerm>
                                <DescriptionListDescription>
                                  <Badge>{disk.size_gb} GB</Badge>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Bus Type
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  {disk.bus_type}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              {disk.storage_profile && (
                                <DescriptionListGroup>
                                  <DescriptionListTerm>
                                    Storage Profile
                                  </DescriptionListTerm>
                                  <DescriptionListDescription>
                                    <Label color="blue">
                                      {disk.storage_profile}
                                    </Label>
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                              )}
                            </DescriptionList>
                          </CardBody>
                        </Card>
                      </GridItem>
                    ))}
                  </Grid>
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </StackItem>
      )}

      {/* Network Details */}
      {(formData.network_config.ip_allocation_mode === 'STATIC' ||
        dnsServers.length > 0) && (
        <StackItem>
          <Card>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <Title headingLevel="h3" size="lg">
                    Network Details
                  </Title>
                </StackItem>
                <StackItem>
                  <Grid hasGutter>
                    {formData.network_config.ip_allocation_mode ===
                      'STATIC' && (
                      <GridItem span={6}>
                        <Card isCompact>
                          <CardBody>
                            <Title headingLevel="h4" size="md">
                              Static IP Configuration
                            </Title>
                            <DescriptionList isCompact>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  IP Address
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  {formData.network_config.ip_address ||
                                    'Not set'}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Gateway
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  {formData.network_config.gateway || 'Not set'}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Subnet Mask
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  {formData.network_config.subnet_mask ||
                                    'Not set'}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            </DescriptionList>
                          </CardBody>
                        </Card>
                      </GridItem>
                    )}

                    {dnsServers.length > 0 && (
                      <GridItem span={6}>
                        <Card isCompact>
                          <CardBody>
                            <Title headingLevel="h4" size="md">
                              DNS Servers
                            </Title>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                marginTop: '8px',
                              }}
                            >
                              {dnsServers.map((server, index) => (
                                <Badge key={index} color="blue">
                                  {server}
                                </Badge>
                              ))}
                            </div>
                          </CardBody>
                        </Card>
                      </GridItem>
                    )}
                  </Grid>
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </StackItem>
      )}

      {/* Creation Notice */}
      <StackItem>
        <Alert
          variant={AlertVariant.info}
          isInline
          title="Ready to Create Virtual Machine"
        >
          Click "Create VM" to deploy your virtual machine with the
          configuration above. The VM will be created in the{' '}
          <strong>{selectedVDC?.name}</strong> VDC and may take a few minutes to
          fully initialize.
          {formData.advanced_config.cloud_init_enabled && (
            <>
              <br />
              Cloud-init scripts will run automatically on first boot.
            </>
          )}
          {formData.advanced_config.guest_customization && (
            <>
              <br />
              Guest OS customization will be applied during deployment.
            </>
          )}
        </Alert>
      </StackItem>
    </Stack>
  );
};

export default ReviewAndCreateStep;
