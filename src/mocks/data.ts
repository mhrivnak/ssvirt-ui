import type {
  Organization,
  VDC,
  VM,
  VApp,
  VMCloudAPI,
  Catalog,
  CatalogItem,
  DashboardStats,
  RecentActivity,
  User,
  Role,
  VMStatus,
  VAppStatus,
  UserPermissions,
} from '../types';

// Mock data generators
export const generateMockUser = (): User => ({
  id: 'urn:vcloud:user:1',
  username: 'john.doe@example.com',
  fullName: 'John Doe',
  description: 'Mock User',
  email: 'john.doe@example.com',
  roleEntityRefs: [
    { name: 'Organization Administrator', id: 'urn:vcloud:role:org-admin' },
  ],
  orgEntityRef: { name: 'Organization', id: 'urn:vcloud:org:1' },
  deployedVmQuota: 10,
  storedVmQuota: 20,
  nameInSource: 'john.doe@example.com',
  enabled: true,
  isGroupRole: false,
  providerType: 'INTEGRATED',
  locked: false,
  stranded: false,
});

export const generateMockRoles = (): Role[] => [
  {
    id: 'urn:vcloud:role:system-admin',
    name: 'System Administrator',
    description: 'Full system administration privileges',
    bundleKey: 'role.system.admin',
    readOnly: true,
  },
  {
    id: 'urn:vcloud:role:org-admin',
    name: 'Organization Administrator',
    description: 'Organization administration privileges',
    bundleKey: 'role.org.admin',
    readOnly: true,
  },
  {
    id: 'urn:vcloud:role:vapp-user',
    name: 'vApp User',
    description: 'Virtual application user privileges',
    bundleKey: 'role.vapp.user',
    readOnly: true,
  },
];

export const generateMockOrganizations = (): Organization[] => [
  {
    id: 'urn:vcloud:org:1',
    name: 'engineering',
    displayName: 'Engineering',
    description: 'Engineering department organization',
    isEnabled: true,
    orgVdcCount: 2,
    catalogCount: 1,
    vappCount: 3,
    runningVMCount: 5,
    userCount: 8,
    diskCount: 10,
    managedBy: { name: 'System', id: 'urn:vcloud:org:system' },
    canManageOrgs: true,
    canPublish: true,
    maskedEventTaskUsername: 'admin',
    directlyManagedOrgCount: 1,
  },
  {
    id: 'urn:vcloud:org:2',
    name: 'qa',
    displayName: 'Quality Assurance',
    description: 'QA testing environment',
    isEnabled: true,
    orgVdcCount: 1,
    catalogCount: 1,
    vappCount: 2,
    runningVMCount: 3,
    userCount: 4,
    diskCount: 6,
    managedBy: { name: 'System', id: 'urn:vcloud:org:system' },
    canManageOrgs: false,
    canPublish: false,
    maskedEventTaskUsername: 'qa-admin',
    directlyManagedOrgCount: 0,
  },
  {
    id: 'urn:vcloud:org:3',
    name: 'staging',
    displayName: 'Staging Environment',
    description: 'Pre-production staging',
    isEnabled: false,
    orgVdcCount: 0,
    catalogCount: 0,
    vappCount: 0,
    runningVMCount: 0,
    userCount: 2,
    diskCount: 0,
    managedBy: { name: 'System', id: 'urn:vcloud:org:system' },
    canManageOrgs: false,
    canPublish: false,
    maskedEventTaskUsername: 'staging-admin',
    directlyManagedOrgCount: 0,
  },
];

export const generateMockVDCs = (): VDC[] => [
  {
    id: 'urn:vcloud:vdc:eng-dev-vdc',
    name: 'eng-dev-vdc',
    description: 'Engineering development environment',
    allocationModel: 'AllocationPool',
    computeCapacity: {
      cpu: {
        allocated: 8000,
        limit: 16000,
        units: 'MHz',
      },
      memory: {
        allocated: 8192,
        limit: 16384,
        units: 'MB',
      },
    },
    providerVdc: {
      id: 'urn:vcloud:providervdc:provider-1',
    },
    nicQuota: 100,
    networkQuota: 50,
    vdcStorageProfiles: [
      {
        id: 'urn:vcloud:storageprofile:standard',
        limit: 1048576,
        units: 'MB',
        default: true,
      },
    ],
    isThinProvision: true,
    isEnabled: true,
    org: {
      name: 'Engineering',
      id: 'urn:vcloud:org:engineering',
    },
    creationDate: '2024-01-15T10:30:00Z',
    lastModified: '2024-01-15T10:30:00Z',
  },
  {
    id: 'urn:vcloud:vdc:qa-test-vdc',
    name: 'qa-test-vdc',
    description: 'QA testing environment',
    allocationModel: 'Flex',
    computeCapacity: {
      cpu: {
        allocated: 4000,
        limit: 8000,
        units: 'MHz',
      },
      memory: {
        allocated: 4096,
        limit: 8192,
        units: 'MB',
      },
    },
    providerVdc: {
      id: 'urn:vcloud:providervdc:provider-1',
    },
    nicQuota: 75,
    networkQuota: 25,
    vdcStorageProfiles: [
      {
        id: 'urn:vcloud:storageprofile:standard',
        limit: 524288,
        units: 'MB',
        default: true,
      },
    ],
    isThinProvision: false,
    isEnabled: true,
    org: {
      name: 'QA',
      id: 'urn:vcloud:org:qa',
    },
    creationDate: '2024-01-16T11:30:00Z',
    lastModified: '2024-01-16T11:30:00Z',
  },
];

export const generateMockVMs = (): VM[] => [
  {
    id: 'vm-1',
    name: 'web-server-01',
    vapp_id: 'vapp-1',
    vapp_name: 'Web Servers',
    vm_name: 'web-server-01',
    namespace: 'engineering-dev',
    status: 'POWERED_ON' as VMStatus,
    cpu_count: 4,
    memory_mb: 8192,
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
    vdc_id: 'vdc-1',
    vdc_name: 'eng-dev-vdc',
    org_id: 'org-1',
    org_name: 'Engineering',
  },
  {
    id: 'vm-2',
    name: 'database-01',
    vapp_id: 'vapp-2',
    vapp_name: 'Database Servers',
    vm_name: 'database-01',
    namespace: 'engineering-dev',
    status: 'POWERED_ON' as VMStatus,
    cpu_count: 8,
    memory_mb: 16384,
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
    vdc_id: 'vdc-1',
    vdc_name: 'eng-dev-vdc',
    org_id: 'org-1',
    org_name: 'Engineering',
  },
  {
    id: 'vm-3',
    name: 'test-runner-01',
    vapp_id: 'vapp-3',
    vapp_name: 'Test Environment',
    vm_name: 'test-runner-01',
    namespace: 'qa-testing',
    status: 'POWERED_OFF' as VMStatus,
    cpu_count: 2,
    memory_mb: 4096,
    created_at: '2024-01-16T13:00:00Z',
    updated_at: '2024-01-16T13:00:00Z',
    vdc_id: 'vdc-2',
    vdc_name: 'qa-test-vdc',
    org_id: 'org-2',
    org_name: 'Quality Assurance',
  },
];

export const generateMockCatalogs = (): Catalog[] => [
  {
    id: 'urn:vcloud:catalog:12345678-1234-1234-1234-123456789012',
    name: 'Development Catalog',
    description: 'Templates for development environments',
    org: {
      id: 'urn:vcloud:org:87654321-4321-4321-4321-210987654321',
    },
    isPublished: false,
    isSubscribed: false,
    creationDate: '2024-01-15T10:30:00.000Z',
    numberOfVAppTemplates: 5,
    numberOfMedia: 0,
    catalogStorageProfiles: [],
    publishConfig: {
      isPublished: false,
    },
    subscriptionConfig: {
      isSubscribed: false,
    },
    distributedCatalogConfig: {},
    owner: {
      id: '',
    },
    isLocal: true,
    version: 1,
  },
  {
    id: 'urn:vcloud:catalog:87654321-4321-4321-4321-210987654321',
    name: 'Production Templates',
    description: 'Production-ready VM templates',
    org: {
      id: 'urn:vcloud:org:87654321-4321-4321-4321-210987654321',
    },
    isPublished: true,
    isSubscribed: false,
    creationDate: '2024-01-10T09:00:00.000Z',
    numberOfVAppTemplates: 12,
    numberOfMedia: 0,
    catalogStorageProfiles: [],
    publishConfig: {
      isPublished: true,
    },
    subscriptionConfig: {
      isSubscribed: false,
    },
    distributedCatalogConfig: {},
    owner: {
      id: '',
    },
    isLocal: true,
    version: 1,
  },
  {
    id: 'urn:vcloud:catalog:11111111-2222-3333-4444-555555555555',
    name: 'Testing Environment',
    description: 'Catalog for QA and testing teams',
    org: {
      id: 'urn:vcloud:org:87654321-4321-4321-4321-210987654321',
    },
    isPublished: false,
    isSubscribed: false,
    creationDate: '2024-01-20T14:15:00.000Z',
    numberOfVAppTemplates: 8,
    numberOfMedia: 0,
    catalogStorageProfiles: [],
    publishConfig: {
      isPublished: false,
    },
    subscriptionConfig: {
      isSubscribed: false,
    },
    distributedCatalogConfig: {},
    owner: {
      id: '',
    },
    isLocal: true,
    version: 1,
  },
];

export const generateMockCatalogItems = (): CatalogItem[] => [
  // Development Catalog Items
  {
    id: 'urn:vcloud:catalogitem:ubuntu-20-dev',
    name: 'Ubuntu 20.04 Development',
    description: 'Ubuntu 20.04 LTS template configured for development work',
    catalogEntityRef: {
      id: 'urn:vcloud:catalog:12345678-1234-1234-1234-123456789012',
      name: 'Development Catalog',
    },
    entity: {
      name: 'Ubuntu 20.04 Development Template',
      description: 'Pre-configured Ubuntu development environment',
      templateSpec: {
        kind: 'Template',
        apiVersion: 'template.openshift.io/v1',
        metadata: {
          name: 'ubuntu-20-dev',
          labels: {
            'template-type': 'vm',
            'os-family': 'ubuntu',
            environment: 'development',
          },
          annotations: {
            description: 'Ubuntu 20.04 development template',
            version: '1.0',
          },
        },
        parameters: [
          {
            name: 'VM_NAME',
            displayName: 'Virtual Machine Name',
            description: 'Name for the new virtual machine',
            required: true,
          },
          {
            name: 'CPU_COUNT',
            displayName: 'CPU Count',
            description: 'Number of virtual CPUs',
            value: '2',
            required: false,
          },
          {
            name: 'MEMORY_SIZE',
            displayName: 'Memory Size (MB)',
            description: 'Amount of memory in megabytes',
            value: '4096',
            required: false,
          },
        ],
        objects: [],
      },
      deploymentLeases: [],
    },
    isVappTemplate: true,
    status: 'RESOLVED',
    owner: {
      id: 'urn:vcloud:user:admin',
      name: 'Administrator',
    },
    isPublished: false,
    creationDate: '2024-01-15T10:30:00.000Z',
    modificationDate: '2024-01-15T10:30:00.000Z',
    versionNumber: 1,
    // VM Creation compatibility properties
    os_type: 'Ubuntu 20.04 LTS',
    cpu_count: 2,
    memory_mb: 4096,
    disk_size_gb: 50,
    vm_instance_type: 'Development',
    catalog_id: 'urn:vcloud:catalog:12345678-1234-1234-1234-123456789012',
  },
  {
    id: 'urn:vcloud:catalogitem:centos-8-web',
    name: 'CentOS 8 Web Server',
    description: 'CentOS 8 with pre-installed web server components',
    catalogEntityRef: {
      id: 'urn:vcloud:catalog:12345678-1234-1234-1234-123456789012',
      name: 'Development Catalog',
    },
    entity: {
      name: 'CentOS 8 Web Server Template',
      description: 'CentOS 8 with Apache, PHP, and MySQL',
      templateSpec: {
        kind: 'Template',
        apiVersion: 'template.openshift.io/v1',
        metadata: {
          name: 'centos-8-web',
          labels: {
            'template-type': 'vm',
            'os-family': 'centos',
            environment: 'web',
          },
          annotations: {
            description: 'CentOS 8 web server template',
            version: '1.2',
          },
        },
        parameters: [
          {
            name: 'VM_NAME',
            displayName: 'Virtual Machine Name',
            description: 'Name for the new virtual machine',
            required: true,
          },
          {
            name: 'CPU_COUNT',
            displayName: 'CPU Count',
            description: 'Number of virtual CPUs',
            value: '4',
            required: false,
          },
          {
            name: 'MEMORY_SIZE',
            displayName: 'Memory Size (MB)',
            description: 'Amount of memory in megabytes',
            value: '8192',
            required: false,
          },
          {
            name: 'WEB_PORT',
            displayName: 'Web Server Port',
            description: 'Port for web server',
            value: '80',
            required: false,
          },
        ],
        objects: [],
      },
      deploymentLeases: [],
    },
    isVappTemplate: true,
    status: 'RESOLVED',
    owner: {
      id: 'urn:vcloud:user:admin',
      name: 'Administrator',
    },
    isPublished: false,
    creationDate: '2024-01-15T11:00:00.000Z',
    modificationDate: '2024-01-15T11:00:00.000Z',
    versionNumber: 2,
    // VM Creation compatibility properties
    os_type: 'CentOS 8',
    cpu_count: 4,
    memory_mb: 8192,
    disk_size_gb: 100,
    vm_instance_type: 'Web Server',
    catalog_id: 'urn:vcloud:catalog:12345678-1234-1234-1234-123456789012',
  },
  {
    id: 'urn:vcloud:catalogitem:windows-2019-server',
    name: 'Windows Server 2019',
    description: 'Windows Server 2019 Standard Edition',
    catalogEntityRef: {
      id: 'urn:vcloud:catalog:87654321-4321-4321-4321-210987654321',
      name: 'Production Templates',
    },
    entity: {
      name: 'Windows Server 2019 Template',
      description: 'Windows Server 2019 Standard Edition with IIS',
      templateSpec: {
        kind: 'Template',
        apiVersion: 'template.openshift.io/v1',
        metadata: {
          name: 'windows-2019-server',
          labels: {
            'template-type': 'vm',
            'os-family': 'windows',
            environment: 'production',
          },
          annotations: {
            description: 'Windows Server 2019 production template',
            version: '2.0',
          },
        },
        parameters: [
          {
            name: 'VM_NAME',
            displayName: 'Virtual Machine Name',
            description: 'Name for the new virtual machine',
            required: true,
          },
          {
            name: 'CPU_COUNT',
            displayName: 'CPU Count',
            description: 'Number of virtual CPUs',
            value: '4',
            required: false,
          },
          {
            name: 'MEMORY_SIZE',
            displayName: 'Memory Size (MB)',
            description: 'Amount of memory in megabytes',
            value: '8192',
            required: false,
          },
          {
            name: 'ADMIN_PASSWORD',
            displayName: 'Administrator Password',
            description: 'Password for the Administrator account',
            required: true,
          },
        ],
        objects: [],
      },
      deploymentLeases: [],
    },
    isVappTemplate: true,
    status: 'RESOLVED',
    owner: {
      id: 'urn:vcloud:user:admin',
      name: 'Administrator',
    },
    isPublished: true,
    creationDate: '2024-01-10T09:00:00.000Z',
    modificationDate: '2024-01-12T14:30:00.000Z',
    versionNumber: 2,
    // VM Creation compatibility properties
    os_type: 'Windows Server 2019',
    cpu_count: 4,
    memory_mb: 8192,
    disk_size_gb: 120,
    vm_instance_type: 'Server',
    catalog_id: 'urn:vcloud:catalog:87654321-4321-4321-4321-210987654321',
  },
  {
    id: 'urn:vcloud:catalogitem:rhel-8-minimal',
    name: 'RHEL 8 Minimal',
    description: 'Red Hat Enterprise Linux 8 minimal installation',
    catalogEntityRef: {
      id: 'urn:vcloud:catalog:11111111-2222-3333-4444-555555555555',
      name: 'Testing Environment',
    },
    entity: {
      name: 'RHEL 8 Minimal Template',
      description: 'Minimal Red Hat Enterprise Linux 8 installation',
      templateSpec: {
        kind: 'Template',
        apiVersion: 'template.openshift.io/v1',
        metadata: {
          name: 'rhel-8-minimal',
          labels: {
            'template-type': 'vm',
            'os-family': 'rhel',
            environment: 'testing',
          },
          annotations: {
            description: 'RHEL 8 minimal testing template',
            version: '1.0',
          },
        },
        parameters: [
          {
            name: 'VM_NAME',
            displayName: 'Virtual Machine Name',
            description: 'Name for the new virtual machine',
            required: true,
          },
          {
            name: 'CPU_COUNT',
            displayName: 'CPU Count',
            description: 'Number of virtual CPUs',
            value: '2',
            required: false,
          },
          {
            name: 'MEMORY_SIZE',
            displayName: 'Memory Size (MB)',
            description: 'Amount of memory in megabytes',
            value: '2048',
            required: false,
          },
        ],
        objects: [],
      },
      deploymentLeases: [],
    },
    isVappTemplate: true,
    status: 'RESOLVED',
    owner: {
      id: 'urn:vcloud:user:admin',
      name: 'Administrator',
    },
    isPublished: false,
    creationDate: '2024-01-20T14:15:00.000Z',
    modificationDate: '2024-01-20T14:15:00.000Z',
    versionNumber: 1,
    // VM Creation compatibility properties
    os_type: 'Red Hat Enterprise Linux 8',
    cpu_count: 2,
    memory_mb: 2048,
    disk_size_gb: 40,
    vm_instance_type: 'Minimal',
    catalog_id: 'urn:vcloud:catalog:11111111-2222-3333-4444-555555555555',
  },
];

export const generateMockDashboardStats = (): DashboardStats => ({
  total_vms: 12,
  running_vms: 8,
  stopped_vms: 4,
  total_organizations: 3,
  total_vdcs: 5,
  total_catalogs: 2,
});

export const generateMockRecentActivity = (): RecentActivity[] => [
  {
    id: 'activity-1',
    type: 'vm_created',
    description: 'Created VM web-server-01',
    user: 'john.doe@example.com',
    timestamp: '2024-01-15T11:00:00Z',
    resource_id: 'vm-1',
    resource_name: 'web-server-01',
  },
  {
    id: 'activity-2',
    type: 'vm_powered_on',
    description: 'Powered on VM database-01',
    user: 'jane.smith@example.com',
    timestamp: '2024-01-15T12:00:00Z',
    resource_id: 'vm-2',
    resource_name: 'database-01',
  },
  {
    id: 'activity-3',
    type: 'org_created',
    description: 'Created organization Quality Assurance',
    user: 'admin@example.com',
    timestamp: '2024-01-16T11:00:00Z',
    resource_id: 'org-2',
    resource_name: 'Quality Assurance',
  },
  {
    id: 'activity-4',
    type: 'vdc_created',
    description: 'Created VDC qa-test-vdc',
    user: 'admin@example.com',
    timestamp: '2024-01-16T11:30:00Z',
    resource_id: 'vdc-2',
    resource_name: 'qa-test-vdc',
  },
  {
    id: 'activity-5',
    type: 'vm_powered_off',
    description: 'Powered off VM test-runner-01',
    user: 'tester@example.com',
    timestamp: '2024-01-16T16:00:00Z',
    resource_id: 'vm-3',
    resource_name: 'test-runner-01',
  },
];

// Mock user permissions
export const generateMockUserPermissions = (): UserPermissions => ({
  canCreateOrganizations: false,
  canManageUsers: false,
  canManageSystem: false, // Regular user by default
  canManageOrganizations: false,
  canViewVDCs: true,
  canManageVDCs: false,
  accessibleOrganizations: [{ id: 'urn:vcloud:org:1', name: 'Engineering' }],
});

export const generateMockAdminPermissions = (): UserPermissions => ({
  canCreateOrganizations: true,
  canManageUsers: true,
  canManageSystem: true, // System admin
  canManageOrganizations: true,
  canViewVDCs: true,
  canManageVDCs: true,
  accessibleOrganizations: [
    { id: 'urn:vcloud:org:1', name: 'Engineering' },
    { id: 'urn:vcloud:org:2', name: 'Quality Assurance' },
    { id: 'urn:vcloud:org:3', name: 'Operations' },
  ],
});

// Mock CloudAPI vApp generator
export const generateMockVApp = (
  name?: string,
  description?: string
): VApp => ({
  id: `urn:vcloud:vapp:${Math.random().toString(36).slice(2, 11)}`,
  name: name || 'test-vapp',
  description: description || 'Mock vApp for testing',
  status: 'INSTANTIATING' as VAppStatus,
  href: 'https://vcd.example.com/cloudapi/1.0.0/vapps/mock-vapp-id',
  type: 'application/json',
  createdDate: new Date().toISOString(),
  lastModifiedDate: new Date().toISOString(),
  vms: [],
  networks: [],
  owner: { id: 'urn:vcloud:user:1', name: 'john.doe@example.com' },
  org: { id: 'urn:vcloud:org:1', name: 'Engineering' },
  vdc: { id: 'urn:vcloud:vdc:1', name: 'eng-dev-vdc' },
});

// Mock CloudAPI VM generator
export const generateMockCloudApiVM = (name?: string): VMCloudAPI => ({
  id: `urn:vcloud:vm:${Math.random().toString(36).slice(2, 11)}`,
  name: name || 'test-vm',
  description: 'Mock VM for testing',
  status: 'INSTANTIATING' as VMStatus,
  href: 'https://vcd.example.com/cloudapi/1.0.0/vms/mock-vm-id',
  type: 'application/json',
  createdDate: new Date().toISOString(),
  lastModifiedDate: new Date().toISOString(),
  vapp: { id: 'urn:vcloud:vapp:1', name: 'test-vapp' },
  vdc: { id: 'urn:vcloud:vdc:1', name: 'eng-dev-vdc' },
  org: { id: 'urn:vcloud:org:1', name: 'Engineering' },
});

// Mock CloudAPI VMs collection
export const generateMockCloudApiVMs = (): VMCloudAPI[] => [
  generateMockCloudApiVM('web-server-01'),
  generateMockCloudApiVM('database-01'),
  generateMockCloudApiVM('api-server-01'),
];

// Mock CloudAPI vApps collection
export const generateMockVApps = (): VApp[] => [
  {
    ...generateMockVApp('web-tier', 'Web application tier'),
    vdc: { id: 'urn:vcloud:vdc:eng-dev-vdc', name: 'eng-dev-vdc' },
    org: { id: 'urn:vcloud:org:engineering', name: 'Engineering' },
  },
  {
    ...generateMockVApp('data-tier', 'Database tier'),
    vdc: { id: 'urn:vcloud:vdc:eng-dev-vdc', name: 'eng-dev-vdc' },
    org: { id: 'urn:vcloud:org:engineering', name: 'Engineering' },
  },
  {
    ...generateMockVApp('api-tier', 'API services tier'),
    vdc: { id: 'urn:vcloud:vdc:qa-test-vdc', name: 'qa-test-vdc' },
    org: { id: 'urn:vcloud:org:qa', name: 'QA' },
  },
];
