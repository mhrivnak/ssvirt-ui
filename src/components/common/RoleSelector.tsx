import React, { useState } from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  Flex,
  FlexItem,
  Icon,
} from '@patternfly/react-core';
import {
  UserIcon,
  CheckIcon,
  CogIcon,
  BuildingIcon,
  VirtualMachineIcon,
} from '@patternfly/react-icons';
import type { MenuToggleElement } from '@patternfly/react-core';
import { useRole } from '../../hooks/useRole';
import { getRoleDescription } from '../../utils/roleDetection';
import { ROLE_NAMES } from '../../types';

const getRoleIcon = (role: string): React.ReactElement => {
  switch (role) {
    case ROLE_NAMES.SYSTEM_ADMIN:
      return <CogIcon />;
    case ROLE_NAMES.ORG_ADMIN:
      return <BuildingIcon />;
    case ROLE_NAMES.VAPP_USER:
      return <VirtualMachineIcon />;
    default:
      return <UserIcon />;
  }
};

export const RoleSelector: React.FC = () => {
  const { activeRole, availableRoles, switchRole, isMultiRole } = useRole();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMultiRole) {
    return null;
  }

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          variant="primary"
          icon={getRoleIcon(activeRole)}
        >
          Acting as: {activeRole}
        </MenuToggle>
      )}
    >
      <DropdownList>
        {availableRoles.map(role => (
          <DropdownItem
            key={role}
            onClick={() => {
              switchRole(role);
              setIsOpen(false);
            }}
            isDisabled={role === activeRole}
          >
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Icon>{getRoleIcon(role)}</Icon>
              </FlexItem>
              <FlexItem>
                <div>
                  <strong>{role}</strong>
                  <div className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                    {getRoleDescription(role)}
                  </div>
                </div>
              </FlexItem>
              {role === activeRole && (
                <FlexItem>
                  <CheckIcon color="var(--pf-v6-global--success-color--100)" />
                </FlexItem>
              )}
            </Flex>
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
};