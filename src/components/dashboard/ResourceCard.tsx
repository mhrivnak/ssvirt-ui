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
  Badge,
  Flex,
  FlexItem,
  Icon,
} from '@patternfly/react-core';
import type { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';

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
  color: 'success' | 'info' | 'warning' | 'danger' | 'custom';
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
            <h3>{title}</h3>
          </SplitItem>
        </Split>
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Split>
              <SplitItem isFilled>
                <h1 className="pf-v6-u-font-size-2xl">{total}</h1>
                <small className="pf-v6-u-color-200">Total</small>
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
