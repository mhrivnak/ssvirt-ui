import { createContext } from 'react';

export interface NavigationContextType {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
}

export const NavigationContext = createContext<
  NavigationContextType | undefined
>(undefined);
