import React from 'react';
import {
  PageSection,
  Title,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Stack,
  StackItem,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Button,
} from '@patternfly/react-core';
import {
  AutomationIcon,
  LayerGroupIcon,
  ClockIcon,
  CodeBranchIcon,
  ListIcon,
  CubeIcon,
  ArrowRightIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

const Automation: React.FC = () => {
  const automationFeatures = [
    {
      title: 'Batch Operations',
      description:
        'Execute operations on multiple resources simultaneously with progress tracking and rollback capabilities.',
      icon: <LayerGroupIcon />,
      route: ROUTES.AUTOMATION_BATCH_OPERATIONS,
      color: 'blue',
      features: [
        'Bulk VM power management',
        'Mass configuration changes',
        'Progress monitoring',
        'Operation rollback',
      ],
    },
    {
      title: 'Deployment Templates',
      description:
        'Create reusable deployment templates for standardized VM and vApp provisioning.',
      icon: <CubeIcon />,
      route: ROUTES.AUTOMATION_DEPLOYMENT_TEMPLATES,
      color: 'green',
      features: [
        'VM template creation',
        'vApp templates',
        'Configuration sharing',
        'One-click deployment',
      ],
    },
    {
      title: 'Scheduled Operations',
      description:
        'Automate recurring tasks with cron-based scheduling and execution management.',
      icon: <ClockIcon />,
      route: ROUTES.AUTOMATION_SCHEDULED_OPERATIONS,
      color: 'orange',
      features: [
        'Cron scheduling',
        'Automated power management',
        'Backup scheduling',
        'Maintenance windows',
      ],
    },
    {
      title: 'Automation Workflows',
      description:
        'Design complex multi-step automation workflows with dependencies and error handling.',
      icon: <CodeBranchIcon />,
      route: ROUTES.AUTOMATION_WORKFLOWS,
      color: 'purple',
      features: [
        'Visual workflow builder',
        'Step dependencies',
        'Error handling',
        'Conditional logic',
      ],
    },
    {
      title: 'Operation Queues',
      description:
        'Monitor and manage operation execution queues with real-time status and control.',
      icon: <ListIcon />,
      route: ROUTES.AUTOMATION_QUEUES,
      color: 'cyan',
      features: [
        'Queue monitoring',
        'Execution control',
        'Performance metrics',
        'Resource management',
      ],
    },
  ];

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem component={Link} to={ROUTES.DASHBOARD}>
              Dashboard
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Automation</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h1" size="2xl">
                <AutomationIcon className="pf-v6-u-mr-sm" />
                Automation & Batch Operations
              </Title>
            </StackItem>
            <StackItem>
              <p className="pf-v6-u-color-200">
                Streamline your VMware Cloud Director operations with powerful
                automation tools. Create batch operations, deployment templates,
                scheduled tasks, and complex workflows to increase efficiency
                and reduce manual effort.
              </p>
            </StackItem>
          </Stack>
        </StackItem>

        {/* Feature Cards */}
        <StackItem>
          <Grid hasGutter>
            {automationFeatures.map((feature) => (
              <GridItem key={feature.title} md={6} lg={4}>
                <Card isFullHeight>
                  <CardHeader>
                    <CardTitle>
                      <Stack>
                        <StackItem>
                          <div className="pf-v6-u-display-flex pf-v6-u-align-items-center">
                            <Badge
                              color={
                                feature.color as
                                  | 'blue'
                                  | 'green'
                                  | 'orange'
                                  | 'purple'
                                  | 'cyan'
                              }
                              className="pf-v6-u-mr-sm"
                            >
                              {feature.icon}
                            </Badge>
                            <strong>{feature.title}</strong>
                          </div>
                        </StackItem>
                      </Stack>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Stack hasGutter>
                      <StackItem>
                        <p className="pf-v6-u-color-200">
                          {feature.description}
                        </p>
                      </StackItem>

                      <StackItem>
                        <DescriptionList isCompact>
                          <DescriptionListGroup>
                            <DescriptionListTerm>
                              Key Features
                            </DescriptionListTerm>
                            <DescriptionListDescription>
                              <ul className="pf-v6-u-pl-md">
                                {feature.features.map((item, index) => (
                                  <li key={index} className="pf-v6-u-color-200">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </StackItem>

                      <StackItem>
                        <Button
                          variant="primary"
                          component={Link}
                          to={feature.route}
                          className="pf-v6-u-w-100"
                        >
                          Open {feature.title}
                          <ArrowRightIcon className="pf-v6-u-ml-sm" />
                        </Button>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>
        </StackItem>

        {/* Getting Started Section */}
        <StackItem>
          <Card>
            <CardHeader>
              <CardTitle>
                <Title headingLevel="h3" size="lg">
                  Getting Started with Automation
                </Title>
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Grid hasGutter>
                <GridItem md={6}>
                  <Stack hasGutter>
                    <StackItem>
                      <Title headingLevel="h4" size="md">
                        1. Create Your First Batch Operation
                      </Title>
                      <p className="pf-v6-u-color-200">
                        Start by creating a batch operation to manage multiple
                        VMs simultaneously. Perfect for power management,
                        configuration updates, or maintenance tasks.
                      </p>
                      <Button
                        variant="secondary"
                        component={Link}
                        to={ROUTES.AUTOMATION_BATCH_OPERATIONS}
                      >
                        Create Batch Operation
                      </Button>
                    </StackItem>
                  </Stack>
                </GridItem>

                <GridItem md={6}>
                  <Stack hasGutter>
                    <StackItem>
                      <Title headingLevel="h4" size="md">
                        2. Build Deployment Templates
                      </Title>
                      <p className="pf-v6-u-color-200">
                        Create reusable deployment templates to standardize your
                        VM and vApp provisioning. Share templates across teams
                        for consistent deployments.
                      </p>
                      <Button
                        variant="secondary"
                        component={Link}
                        to={ROUTES.AUTOMATION_DEPLOYMENT_TEMPLATES}
                      >
                        Create Template
                      </Button>
                    </StackItem>
                  </Stack>
                </GridItem>

                <GridItem md={6}>
                  <Stack hasGutter>
                    <StackItem>
                      <Title headingLevel="h4" size="md">
                        3. Schedule Automated Tasks
                      </Title>
                      <p className="pf-v6-u-color-200">
                        Set up scheduled operations for recurring tasks like
                        backups, power management, or maintenance operations
                        using cron expressions.
                      </p>
                      <Button
                        variant="secondary"
                        component={Link}
                        to={ROUTES.AUTOMATION_SCHEDULED_OPERATIONS}
                      >
                        Schedule Operations
                      </Button>
                    </StackItem>
                  </Stack>
                </GridItem>

                <GridItem md={6}>
                  <Stack hasGutter>
                    <StackItem>
                      <Title headingLevel="h4" size="md">
                        4. Design Complex Workflows
                      </Title>
                      <p className="pf-v6-u-color-200">
                        Create sophisticated automation workflows with multiple
                        steps, dependencies, and conditional logic for advanced
                        use cases.
                      </p>
                      <Button
                        variant="secondary"
                        component={Link}
                        to={ROUTES.AUTOMATION_WORKFLOWS}
                      >
                        Build Workflow
                      </Button>
                    </StackItem>
                  </Stack>
                </GridItem>
              </Grid>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default Automation;
