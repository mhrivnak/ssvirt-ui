import { useContext } from 'react';
import { RoleContext, type RoleContextValue } from '../contexts/RoleContextDef';

export const useRole = (): RoleContextValue => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};