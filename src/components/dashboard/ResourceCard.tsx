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
  Badge,
  Flex,
  FlexItem,
  Icon,
} from '@patternfly/react-core';
import { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';

interface ResourceAction {
  label: string;
  icon: React.ComponentClass<SVGIconProps>;
  onClick: () => void;
}

interface ResourceCardProps {
  title: string;
  icon: React.ComponentClass<SVGIconProps>;
  total: number;
  running?: number;
  stopped?: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  actions: ResourceAction[];
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  title,
  icon: IconComponent,
  total,
  running,
  stopped,
  color,
  actions,
}) => {
  return (
    <Card isFullHeight>
      <CardTitle>
        <Split hasGutter>
          <SplitItem>
            <Icon size="lg" status={color}>
              <IconComponent />
            </Icon>
          </SplitItem>
          <SplitItem isFilled>
            <Text component={TextVariants.h3}>{title}</Text>
          </SplitItem>
        </Split>
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Split>
              <SplitItem isFilled>
                <Text
                  component={TextVariants.h1}
                  className="pf-v6-u-font-size-2xl"
                >
                  {total}
                </Text>
                <Text
                  component={TextVariants.small}
                  className="pf-v6-u-color-200"
                >
                  Total
                </Text>
              </SplitItem>
            </Split>
          </StackItem>

          {running !== undefined && stopped !== undefined && (
            <StackItem>
              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <Badge color="green">{running} Running</Badge>
                </FlexItem>
                <FlexItem>
                  <Badge color="red">{stopped} Stopped</Badge>
                </FlexItem>
              </Flex>
            </StackItem>
          )}

          <StackItem>
            <Flex
              direction={{ default: 'column' }}
              spaceItems={{ default: 'spaceItemsXs' }}
            >
              {actions.map((action, index) => (
                <FlexItem key={index}>
                  <Button
                    variant="link"
                    isInline
                    icon={<action.icon />}
                    onClick={action.onClick}
                    size="sm"
                  >
                    {action.label}
                  </Button>
                </FlexItem>
              ))}
            </Flex>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};
