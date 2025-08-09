import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  determineUserCapabilities,
  getHighestPriorityRole,
} from '../utils/roleDetection';
import { getSessionData } from '../services/api';
import { RoleContext, type RoleContextValue } from './RoleContextDef';
import type { SessionResponse } from '../types';

export interface RoleProviderProps {
  children: React.ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null);
  const [activeRole, setActiveRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load session data on mount
  useEffect(() => {
    const loadSessionData = () => {
      const session = getSessionData();
      setSessionData(session);

      if (session && session.roles.length > 0 && !activeRole) {
        const highestRole = getHighestPriorityRole(session.roles);
        setActiveRole(highestRole);
      }

      setIsLoading(false);
    };

    loadSessionData();
  }, [activeRole]);

  const availableRoles = useMemo(
    () => sessionData?.roles || [],
    [sessionData?.roles]
  );
  const isMultiRole = availableRoles.length > 1;

  const capabilities = useMemo(() => {
    if (!sessionData) {
      return {
        canManageSystem: false,
        canManageOrganizations: false,
        canCreateOrganizations: false,
        canManageUsers: false,
        canManageVMs: false,
        canViewReports: false,
        primaryOrganization: '',
        operatingOrganization: undefined,
      };
    }
    return determineUserCapabilities(sessionData);
  }, [sessionData]);

  const switchRole = useCallback(
    (roleName: string) => {
      if (availableRoles.includes(roleName)) {
        setActiveRole(roleName);
        // Store the active role preference
        localStorage.setItem('active-role', roleName);
      }
    },
    [availableRoles]
  );

  // Load active role preference from localStorage
  useEffect(() => {
    if (availableRoles.length > 0) {
      const savedRole = localStorage.getItem('active-role');
      if (savedRole && availableRoles.includes(savedRole)) {
        setActiveRole(savedRole);
      } else if (!activeRole) {
        const highestRole = getHighestPriorityRole(availableRoles);
        setActiveRole(highestRole);
      }
    }
  }, [availableRoles, activeRole]);

  const value: RoleContextValue = {
    activeRole,
    availableRoles,
    capabilities,
    sessionData,
    switchRole,
    isMultiRole,
    isLoading,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};
