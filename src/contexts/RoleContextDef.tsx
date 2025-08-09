import { createContext } from 'react';
import type { SessionResponse, RoleCapabilities } from '../types';

export interface RoleContextValue {
  activeRole: string;
  availableRoles: string[];
  capabilities: RoleCapabilities;
  sessionData: SessionResponse | null;
  switchRole: (roleName: string) => void;
  isMultiRole: boolean;
  isLoading: boolean;
}

export const RoleContext = createContext<RoleContextValue | undefined>(undefined);