import React, { useState, useEffect, createContext, useContext } from 'react';
import { AlertCircle } from 'lucide-react';

// Define access levels
const ACCESS_LEVELS = {
  ADMIN: {
    level: 'admin',
    canEdit: true,
    canView: true
  },
  VIEWER: {
    level: 'viewer',
    canEdit: false,
    canView: true
  }
};

// Create context for access control
export const AccessContext = createContext(null);

// Hook to use access control
export const useAccess = () => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
};

// Define authorized users and their access levels
const authorizedUsers = {
  'ashley@lfglending.com': ACCESS_LEVELS.ADMIN,
  'kaileigh@lfglending.com': ACCESS_LEVELS.ADMIN,
  'Lorena@lfglending.com': ACCESS_LEVELS.ADMIN,
  'Abbey@LFGlending.com': ACCESS_LEVELS.ADMIN,
  'liz@lfglending.com': ACCESS_LEVELS.ADMIN,
  'byron@teksupport.io': ACCESS_LEVELS.ADMIN,
  'mycrm@innostak.com': ACCESS_LEVELS.ADMIN,
  'jeff@innostak.com': ACCESS_LEVELS.ADMIN,

  'nicole@lfglending.com': ACCESS_LEVELS.VIEWER,
  'Kat@lfglending.com': ACCESS_LEVELS.VIEWER,
  'kevin@lfglending.com': ACCESS_LEVELS.VIEWER,
  'adam@lfglending.com': ACCESS_LEVELS.VIEWER,
  'kate@lfglending.com': ACCESS_LEVELS.VIEWER,
  'brooke@lfglending.com': ACCESS_LEVELS.VIEWER,
  'Dan@lfglending.com': ACCESS_LEVELS.VIEWER,
  'david@lfglending.com': ACCESS_LEVELS.VIEWER,
  'Dawn@lfglending.com': ACCESS_LEVELS.VIEWER,
  'viewer2@example.com': ACCESS_LEVELS.VIEWER,
  // Add more users here
};

const AccessControl = ({ children }) => {
  const [accessState, setAccessState] = useState({
    isAuthorized: false,
    isLoading: true,
    email: null,
    permissions: null
  });

  useEffect(() => {
    const checkAccess = () => {
      // Get email from URL parameters
      const params = new URLSearchParams(window.location.search);
      const userEmail = params.get('email')?.toLowerCase();

      if (!userEmail) {
        setAccessState({
          isAuthorized: false,
          isLoading: false,
          email: null,
          permissions: null
        });
        return;
      }

      // Check user's access level
      const userPermissions = authorizedUsers[userEmail];
      
      setAccessState({
        isAuthorized: !!userPermissions,
        isLoading: false,
        email: userEmail,
        permissions: userPermissions || null
      });
    };

    checkAccess();
  }, []);

  if (accessState.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <div className="text-[var(--text-color)]">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin"></div>
          <div className="mt-4">Verifying access...</div>
        </div>
      </div>
    );
  }

  if (!accessState.email) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-color)] p-4">
        <div className="max-w-md p-4 border border-red-500 rounded-lg bg-red-100 text-red-900">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            <h3 className="font-semibold">Access Denied</h3>
          </div>
          <p>No email parameter provided. This dashboard must be accessed through the CRM system.</p>
        </div>
      </div>
    );
  }

  if (!accessState.isAuthorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-color)] p-4">
        <div className="max-w-md p-4 border border-red-500 rounded-lg bg-red-100 text-red-900">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            <h3 className="font-semibold">Access Denied</h3>
          </div>
          <p>
            The email address "{accessState.email}" does not have access to this page. 
            Please contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AccessContext.Provider value={accessState}>
      {children}
    </AccessContext.Provider>
  );
};

export default AccessControl;