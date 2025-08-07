import React from 'react';
import {
  PageSection,
  Title,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Button,
  Split,
  SplitItem,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  CubeIcon,
  BuildingIcon,
  NetworkIcon,
  CatalogIcon,
  PlusCircleIcon,
  PlayIcon,
  StopIcon,
  SyncAltIcon,
  ExternalLinkAltIcon,
} from '@patternfly/react-icons';
import {
  useDashboardStats,
  useRecentActivity,
  useVMs,
  useBulkPowerOnVMs,
  useBulkPowerOffVMs,
} from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ResourceCard,
  ActivityTimeline,
  QuickStatsCard,
  ResourceUsageChart,
} from '../../components/dashboard';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading } =
    useRecentActivity(5);
  const { data: vmsData } = useVMs();
  const bulkPowerOnMutation = useBulkPowerOnVMs();
  const bulkPowerOffMutation = useBulkPowerOffVMs();

  const resourceCards = [
    {
      title: 'Virtual Machines',
      icon: CubeIcon,
      total: stats?.data.total_vms ?? 0,
      running: stats?.data.running_vms ?? 0,
      stopped: stats?.data.stopped_vms ?? 0,
      color: 'info' as const,
      actions: [
        {
          label: 'Create VM',
          icon: PlusCircleIcon,
          onClick: () => navigate('/vms/create'),
        },
        {
          label: 'View All VMs',
          icon: ExternalLinkAltIcon,
          onClick: () => navigate('/vms'),
        },
      ],
    },
    {
      title: 'Organizations',
      icon: BuildingIcon,
      total: stats?.data.total_organizations ?? 0,
      color: 'success' as const,
      actions: [
        {
          label: 'View Organizations',
          icon: ExternalLinkAltIcon,
          onClick: () => navigate('/organizations'),
        },
      ],
    },
    {
      title: 'Virtual Data Centers',
      icon: NetworkIcon,
      total: stats?.data.total_vdcs ?? 0,
      color: 'custom' as const,
      actions: [
        {
          label: 'Create VDC',
          icon: PlusCircleIcon,
          onClick: () => navigate('/vdcs/create'),
        },
        {
          label: 'View All VDCs',
          icon: ExternalLinkAltIcon,
          onClick: () => navigate('/vdcs'),
        },
      ],
    },
    {
      title: 'Catalogs',
      icon: CatalogIcon,
      total: stats?.data.total_catalogs ?? 0,
      color: 'warning' as const,
      actions: [
        {
          label: 'Browse Catalogs',
          icon: ExternalLinkAltIcon,
          onClick: () => navigate('/catalogs'),
        },
      ],
    },
  ];

  const quickActions = [
    {
      label: 'Create Virtual Machine',
      icon: PlusCircleIcon,
      variant: 'primary' as const,
      onClick: () => navigate('/vms/create'),
    },
    {
      label: 'Power On All VMs',
      icon: PlayIcon,
      variant: 'secondary' as const,
      onClick: () => {
        if (vmsData?.data) {
          const vmIds = vmsData.data.map((vm) => vm.id);
          if (vmIds.length > 0) {
            bulkPowerOnMutation.mutate(vmIds);
          }
        }
      },
    },
    {
      label: 'Power Off All VMs',
      icon: StopIcon,
      variant: 'secondary' as const,
      onClick: () => {
        if (vmsData?.data) {
          const vmIds = vmsData.data.map((vm) => vm.id);
          if (vmIds.length > 0) {
            bulkPowerOffMutation.mutate(vmIds);
          }
        }
      },
    },
    {
      label: 'Refresh Data',
      icon: SyncAltIcon,
      variant: 'link' as const,
      onClick: () => {
        window.location.reload();
      },
    },
  ];

  if (statsLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Header Section */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                Dashboard
              </Title>
              <p className="pf-v6-u-color-200">
                Overview of your virtual infrastructure resources
              </p>
            </SplitItem>
            <SplitItem>
              <Flex
                spaceItems={{ default: 'spaceItemsSm' }}
                direction={{ default: 'row', sm: 'column', md: 'row' }}
              >
                {quickActions.map((action, index) => (
                  <FlexItem key={index}>
                    <Button
                      variant={action.variant}
                      icon={<action.icon />}
                      onClick={action.onClick}
                      size="sm"
                    >
                      {action.label}
                    </Button>
                  </FlexItem>
                ))}
              </Flex>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Resource Cards Section */}
        <StackItem>
          <Grid hasGutter span={12}>
            {resourceCards.map((card, index) => (
              <GridItem key={index} span={12} sm={6} md={6} lg={3} xl={3}>
                <ResourceCard
                  title={card.title}
                  icon={card.icon}
                  total={card.total}
                  running={card.running}
                  stopped={card.stopped}
                  color={card.color}
                  actions={card.actions}
                />
              </GridItem>
            ))}
          </Grid>
        </StackItem>

        {/* Activity and Stats Section */}
        <StackItem>
          <Grid hasGutter>
            <GridItem span={12} md={12} lg={6} xl={6}>
              <ActivityTimeline
                activities={activities?.data}
                isLoading={activitiesLoading}
                onViewAll={() => navigate('/activity')}
              />
            </GridItem>

            <GridItem span={12} md={6} lg={3} xl={3}>
              <QuickStatsCard
                stats={stats?.data}
                onViewSystemHealth={() => navigate('/system/health')}
              />
            </GridItem>

            <GridItem span={12} md={6} lg={3} xl={3}>
              <ResourceUsageChart stats={stats?.data} />
            </GridItem>
          </Grid>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default Dashboard;
