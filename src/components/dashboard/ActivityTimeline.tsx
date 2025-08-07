import React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Button,
  Text,
  TextVariants,
  List,
  ListItem,
  Flex,
  FlexItem,
  Icon,
  Timestamp,
  TimestampTooltipVariant,
} from '@patternfly/react-core';
import {
  PlusCircleIcon,
  PlayIcon,
  StopIcon,
  BuildingIcon,
  NetworkIcon,
  CubeIcon,
} from '@patternfly/react-icons';
import { RecentActivity } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ActivityTimelineProps {
  activities?: RecentActivity[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities = [],
  isLoading = false,
  onViewAll,
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vm_created':
        return (
          <Icon status="success">
            <PlusCircleIcon />
          </Icon>
        );
      case 'vm_powered_on':
        return (
          <Icon status="success">
            <PlayIcon />
          </Icon>
        );
      case 'vm_powered_off':
        return (
          <Icon status="warning">
            <StopIcon />
          </Icon>
        );
      case 'org_created':
        return (
          <Icon status="info">
            <BuildingIcon />
          </Icon>
        );
      case 'vdc_created':
        return (
          <Icon status="info">
            <NetworkIcon />
          </Icon>
        );
      default:
        return (
          <Icon>
            <CubeIcon />
          </Icon>
        );
    }
  };

  return (
    <Card isFullHeight>
      <CardTitle>
        <Split>
          <SplitItem isFilled>
            <Text component={TextVariants.h2}>Recent Activity</Text>
          </SplitItem>
          {onViewAll && (
            <SplitItem>
              <Button variant="link" onClick={onViewAll}>
                View All Activity
              </Button>
            </SplitItem>
          )}
        </Split>
      </CardTitle>
      <CardBody>
        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : activities.length > 0 ? (
          <List isPlain>
            {activities.map((activity) => (
              <ListItem key={activity.id}>
                <Flex
                  spaceItems={{ default: 'spaceItemsSm' }}
                  alignItems={{ default: 'alignItemsCenter' }}
                >
                  <FlexItem>{getActivityIcon(activity.type)}</FlexItem>
                  <FlexItem isFilled>
                    <Stack>
                      <StackItem>
                        <Text component={TextVariants.p}>
                          {activity.description}
                        </Text>
                      </StackItem>
                      <StackItem>
                        <Text
                          component={TextVariants.small}
                          className="pf-v6-u-color-200"
                        >
                          by {activity.user} •{' '}
                          <Timestamp
                            date={new Date(activity.timestamp)}
                            tooltip={{
                              variant: TimestampTooltipVariant.default,
                            }}
                          />
                        </Text>
                      </StackItem>
                    </Stack>
                  </FlexItem>
                </Flex>
              </ListItem>
            ))}
          </List>
        ) : (
          <Text component={TextVariants.p} className="pf-v6-u-color-200">
            No recent activity to display
          </Text>
        )}
      </CardBody>
    </Card>
  );
};
