import React, { useState } from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Alert,
  AlertVariant,
  Stack,
  StackItem,
  TextInput,
  FormGroup,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { useDeleteCatalog } from '../../hooks';
import type { Catalog } from '../../types';

interface DeleteCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: Catalog | null;
}

const DeleteCatalogModal: React.FC<DeleteCatalogModalProps> = ({
  isOpen,
  onClose,
  catalog,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const deleteCatalogMutation = useDeleteCatalog();

  const isConfirmationValid = catalog && confirmationText === catalog.name;

  const handleDelete = async () => {
    if (!catalog || !isConfirmationValid) {
      return;
    }

    try {
      await deleteCatalogMutation.mutateAsync(catalog.id);
      handleClose();
    } catch (error) {
      // Error handling is done by the mutation hook
      console.error('Failed to delete catalog:', error);
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  if (!catalog) {
    return null;
  }

  return (
    <Modal
      variant={ModalVariant.medium}
      title="Delete Catalog"
      isOpen={isOpen}
      onClose={handleClose}
    >
      <Stack hasGutter>
        <StackItem>
          <Alert
            variant={AlertVariant.warning}
            title="This action cannot be undone"
            isInline
          >
            Deleting this catalog will permanently remove it and all of its
            catalog items. This action cannot be reversed.
          </Alert>
        </StackItem>

        {deleteCatalogMutation.error && (
          <StackItem>
            <Alert
              variant={AlertVariant.danger}
              title="Error deleting catalog"
              isInline
            >
              {deleteCatalogMutation.error instanceof Error
                ? deleteCatalogMutation.error.message
                : 'An unexpected error occurred'}
            </Alert>
          </StackItem>
        )}

        <StackItem>
          <p>
            You are about to delete the catalog{' '}
            <strong>&quot;{catalog.name}&quot;</strong>.
          </p>

          {catalog.description && (
            <p className="pf-v6-u-color-200 pf-v6-u-mt-sm">
              Description: {catalog.description}
            </p>
          )}

          <Split hasGutter className="pf-v6-u-mt-md">
            <SplitItem>
              <strong>Status:</strong>
            </SplitItem>
            <SplitItem>
              {catalog.isPublished ? 'Published' : 'Private'}
            </SplitItem>
          </Split>

          {catalog.creationDate && (
            <Split hasGutter className="pf-v6-u-mt-sm">
              <SplitItem>
                <strong>Created:</strong>
              </SplitItem>
              <SplitItem>
                {new Date(catalog.creationDate).toLocaleDateString()}
              </SplitItem>
            </Split>
          )}
        </StackItem>

        <StackItem>
          <FormGroup
            label={`Type "${catalog.name}" to confirm deletion`}
            fieldId="confirmation-text"
            isRequired
          >
            <TextInput
              id="confirmation-text"
              value={confirmationText}
              onChange={(_, value) => setConfirmationText(value)}
              placeholder={`Type "${catalog.name}" here`}
              validated={
                confirmationText && !isConfirmationValid ? 'error' : 'default'
              }
            />
          </FormGroup>
        </StackItem>

        <StackItem>
          <Alert
            variant={AlertVariant.info}
            title="What will be deleted?"
            isInline
          >
            <ul>
              <li>The catalog &quot;{catalog.name}&quot;</li>
              <li>All catalog items (templates) within this catalog</li>
              <li>All metadata associated with this catalog</li>
            </ul>
          </Alert>
        </StackItem>

        <StackItem>
          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
          >
            <Button
              variant="link"
              onClick={handleClose}
              isDisabled={deleteCatalogMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteCatalogMutation.isPending}
              isDisabled={
                !isConfirmationValid || deleteCatalogMutation.isPending
              }
            >
              Delete Catalog
            </Button>
          </div>
        </StackItem>
      </Stack>
    </Modal>
  );
};

export default DeleteCatalogModal;
