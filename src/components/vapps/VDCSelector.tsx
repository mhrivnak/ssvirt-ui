import React from 'react';
import {
  FormGroup,
  FormSelect,
  FormSelectOption,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';
import { useAccessibleVDCs } from '../../hooks/useVDC';
import LoadingSpinner from '../common/LoadingSpinner';

interface VDCSelectorProps {
  value: string;
  onChange: (vdcId: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  validated?: 'success' | 'error' | 'warning' | 'default';
  helperTextInvalid?: string;
}

const VDCSelector: React.FC<VDCSelectorProps> = ({
  value,
  onChange,
  isRequired = true,
  isDisabled = false,
  validated = 'default',
  helperTextInvalid,
}) => {
  const {
    data: vdcsResponse,
    isLoading,
    error,
  } = useAccessibleVDCs(!isDisabled);

  const vdcs = vdcsResponse?.values || [];

  if (isLoading) {
    return (
      <FormGroup
        label="Target VDC"
        isRequired={isRequired}
        fieldId="vdc-selector"
      >
        <LoadingSpinner message="Loading VDCs..." />
      </FormGroup>
    );
  }

  if (error) {
    return (
      <FormGroup
        label="Target VDC"
        isRequired={isRequired}
        fieldId="vdc-selector"
      >
        <Alert
          variant={AlertVariant.danger}
          title="Error loading VDCs"
          isInline
        >
          {error instanceof Error
            ? error.message
            : 'Failed to load available VDCs. Please try again.'}
        </Alert>
      </FormGroup>
    );
  }

  if (vdcs.length === 0) {
    return (
      <FormGroup
        label="Target VDC"
        isRequired={isRequired}
        fieldId="vdc-selector"
      >
        <Alert
          variant={AlertVariant.warning}
          title="No VDCs available"
          isInline
        >
          You don't have access to any VDCs where you can create vApps. Please
          contact your administrator.
        </Alert>
      </FormGroup>
    );
  }

  return (
    <FormGroup
      label="Target VDC"
      isRequired={isRequired}
      fieldId="vdc-selector"
    >
      <FormSelect
        value={value}
        onChange={(_, selectedValue) => onChange(selectedValue)}
        aria-label="Select VDC"
        isDisabled={isDisabled}
        validated={validated}
        isRequired={isRequired}
      >
        <FormSelectOption key="" value="" label="Select a VDC..." />
        {vdcs.map((vdc) => (
          <FormSelectOption
            key={vdc.id}
            value={vdc.id}
            label={`${vdc.name}${vdc.description ? ` - ${vdc.description}` : ''}`}
          />
        ))}
      </FormSelect>
      {validated === 'default' && (
        <small className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
          Select the Virtual Data Center where your vApp will be created
        </small>
      )}
      {helperTextInvalid && validated === 'error' && (
        <small className="pf-v6-u-color-danger-300 pf-v6-u-font-size-sm">
          {helperTextInvalid}
        </small>
      )}
    </FormGroup>
  );
};

export default VDCSelector;
