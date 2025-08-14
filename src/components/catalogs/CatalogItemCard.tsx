import React from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  Button,
  Badge,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  InfoCircleIcon,
  PlayIcon,
  PlusCircleIcon,
} from '@patternfly/react-icons';
import type { CatalogItem } from '../../types';

interface CatalogItemCardProps {
  catalogItem: CatalogItem;
  onSelect?: (item: CatalogItem) => void;
  onViewDetails?: (item: CatalogItem) => void;
  onCreateVApp?: (item: CatalogItem) => void;
  showActions?: boolean;
}

const CatalogItemCard: React.FC<CatalogItemCardProps> = ({
  catalogItem,
  onSelect,
  onViewDetails,
  onCreateVApp,
  showActions = true,
}) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'ready':
        return 'green';
      case 'unresolved':
      case 'pending':
        return 'orange';
      case 'failed':
      case 'error':
        return 'red';
      default:
        return 'grey';
    }
  };

  return (
    <Card isCompact>
      <CardTitle>
        <Split hasGutter>
          <SplitItem isFilled>
            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
              {catalogItem.name}
            </div>
          </SplitItem>
          {catalogItem.status && (
            <SplitItem>
              <Badge color={getStatusColor(catalogItem.status)}>
                {catalogItem.status}
              </Badge>
            </SplitItem>
          )}
        </Split>
      </CardTitle>

      <CardBody>
        <Stack hasGutter>
          {catalogItem.description && (
            <StackItem>
              <p className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                {catalogItem.description}
              </p>
            </StackItem>
          )}

          <StackItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              {catalogItem.entity?.name && (
                <FlexItem>
                  <div>
                    <strong>Template:</strong>{' '}
                    <span className="pf-v6-u-font-size-sm">
                      {catalogItem.entity.name}
                    </span>
                  </div>
                </FlexItem>
              )}
            </Flex>
          </StackItem>

          {catalogItem.entity?.description && (
            <StackItem>
              <div>
                <strong>Template Description:</strong>{' '}
                <span className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                  {catalogItem.entity.description}
                </span>
              </div>
            </StackItem>
          )}

          <StackItem>
            <Split hasGutter>
              <SplitItem>
                <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                  <strong>Created:</strong>{' '}
                  {formatDate(catalogItem.creationDate)}
                </div>
              </SplitItem>
              {catalogItem.catalog_name && (
                <SplitItem>
                  <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                    <strong>Catalog:</strong> {catalogItem.catalog_name}
                  </div>
                </SplitItem>
              )}
            </Split>
          </StackItem>
        </Stack>
      </CardBody>

      {showActions && (
        <CardFooter>
          <Split hasGutter>
            {onViewDetails && (
              <SplitItem>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<InfoCircleIcon />}
                  onClick={() => onViewDetails(catalogItem)}
                >
                  View Details
                </Button>
              </SplitItem>
            )}
            {onCreateVApp && (
              <SplitItem>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusCircleIcon />}
                  onClick={() => onCreateVApp(catalogItem)}
                >
                  Create vApp
                </Button>
              </SplitItem>
            )}
            {onSelect && (
              <SplitItem>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<PlayIcon />}
                  onClick={() => onSelect(catalogItem)}
                >
                  Deploy
                </Button>
              </SplitItem>
            )}
          </Split>
        </CardFooter>
      )}
    </Card>
  );
};

export default CatalogItemCard;
