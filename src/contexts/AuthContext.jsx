// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, checkSupabaseConnection, handleSupabaseError } from '../lib/supabase';
import { useNotification } from './NotificationContext';

// DEV MODE: Set to true to bypass authentication during development
const DEV_BYPASS_AUTH = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true' || false;

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const { addNotification } = useNotification();

  // DEV MODE: Skip authentication checks
  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      const mockUser = {
        id: 'dev-user-id',
        email: 'dev@nava-ops.local',
        user_metadata: { full_name: 'Dev User' }
      };
      const mockProfile = {
        id: 'dev-user-id',
        email: 'dev@nava-ops.local',
        role: 'admin',
        full_name: 'Dev User',
        is_active: true
      };

      setUser(mockUser);
      setUserProfile(mockProfile);
      setConnectionStatus('connected');
      setLoading(false);

      addNotification({
        type: 'info',
        title: 'Development Mode',
        message: 'Authentication bypassed for development',
        duration: 3000
      });

      return;
    }

    initializeAuth();
  }, []);

  // Check session expiry
  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    const checkSessionExpiry = () => {
      if (sessionExpiry && new Date() > new Date(sessionExpiry)) {
        addNotification({
          type: 'warning',
          title: 'انتهت الجلسة',
          message: 'لقد انتهت جلستك، يرجى تسجيل الدخول مرة أخرى',
          duration: 5000
        });
        logout();
      }
    };

    const interval = setInterval(checkSessionExpiry, 60000);
    return () => clearInterval(interval);
  }, [sessionExpiry, addNotification]);

  // Initialize authentication
  const initializeAuth = async () => {
    try {
      setLoading(true);
      const connection = await checkSupabaseConnection();
      setConnectionStatus(connection.connected ? 'connected' : 'disconnected');

      if (connection.connected) {
        await setupAuthListener();
      } else {
        addNotification({
          type: 'warning',
          title: 'Connection Warning',
          message: 'Cannot connect to authentication server. Running in offline mode.',
          duration: 5000
        });
        setLoading(false);
      }
    } catch (error) {
      setConnectionStatus('error');
      setLoading(false);
    }
  };

  const setupAuthListener = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setLoading(false);
        return;
      }

      if (session?.user) {
        await handleUserSession(session.user, session.expires_at);
      } else {
        setLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          switch (event) {
            case 'SIGNED_IN':
              if (session?.user) {
                await handleUserSession(session.user, session.expires_at);
                addNotification({
                  type: 'success',
                  title: 'تم تسجيل الدخول بنجاح',
                  message: 'مرحباً بعودتك!',
                  duration: 3000
                });
              }
              break;

            case 'SIGNED_OUT':
              setUser(null);
              setUserProfile(null);
              setSessionExpiry(null);
              addNotification({
                type: 'info',
                title: 'تم تسجيل الخروج',
                message: 'تم تسجيل خروجك بنجاح',
                duration: 3000
              });
              break;

            case 'TOKEN_REFRESHED':
              if (session?.expires_at) {
                setSessionExpiry(new Date(session.expires_at * 1000));
              }
              break;

            case 'USER_UPDATED':
              if (session?.user) {
                setUser(session.user);
              }
              break;
          }

          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      setLoading(false);
    }
  };

  const handleUserSession = async (user, expiresAt = null) => {
    setUser(user);

    if (expiresAt) {
      setSessionExpiry(new Date(expiresAt * 1000));
    }

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          brand:brands (
            id,
            name,
            logo_url,
            status
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        await createDefaultUserProfile(user);
      } else {
        setUserProfile(profile);
        await logUserActivity(user.id, 'login');
      }
    } catch (error) {
      await createDefaultUserProfile(user);
    }
  };

  const createDefaultUserProfile = async (user) => {
    try {
      const defaultProfile = {
        id: user.id,
        email: user.email,
        role: 'viewer',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        phone: user.user_metadata?.phone || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        is_active: true,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .insert([defaultProfile])
        .select()
        .single();

      if (error) throw error;

      setUserProfile(defaultProfile);
      return defaultProfile;
    } catch (error) {
      const fallbackProfile = {
        id: user.id,
        email: user.email,
        role: 'viewer',
        full_name: 'User',
        is_active: true
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  const logUserActivity = async (userId, activityType, metadata = {}) => {
    try {
      await supabase
        .from('user_activities')
        .insert([
          {
            user_id: userId,
            activity_type: activityType,
            metadata,
            ip_address: metadata.ipAddress || 'unknown',
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString()
          }
        ]);
    } catch (error) {
      // Silently fail for activity logging
    }
  };

  const login = async (email, password, rememberMe = false) => {
    if (DEV_BYPASS_AUTH) {
      return { success: true, error: null, user: user };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      await logUserActivity(data.user.id, 'login', {
        ipAddress: await getClientIP(),
        rememberMe
      });

      return {
        success: true,
        error: null,
        user: data.user
      };
    } catch (error) {
      const handledError = handleSupabaseError(error);

      await logUserActivity(null, 'login_failed', {
        email: email.trim().toLowerCase(),
        error: handledError.message,
        ipAddress: await getClientIP()
      });

      return {
        success: false,
        error: handledError.message
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    if (DEV_BYPASS_AUTH) {
      return { success: true, error: null, user: user };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            ...userData,
            signup_ip: await getClientIP()
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await logUserActivity(data.user.id, 'signup', {
          ipAddress: await getClientIP()
        });
      }

      return {
        success: true,
        error: null,
        user: data.user,
        requiresConfirmation: !data.session
      };
    } catch (error) {
      const handledError = handleSupabaseError(error);

      return {
        success: false,
        error: handledError.message
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (DEV_BYPASS_AUTH) {
      return;
    }

    try {
      if (user) {
        await logUserActivity(user.id, 'logout', {
          ipAddress: await getClientIP()
        });
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserProfile(null);
      setSessionExpiry(null);

    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      await logUserActivity(user?.id, 'password_reset_requested', {
        email: email.trim().toLowerCase()
      });

      return { success: true, error: null };
    } catch (error) {
      const handledError = handleSupabaseError(error);
      return { success: false, error: handledError.message };
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);

      addNotification({
        type: 'success',
        title: 'تم التحديث',
        message: 'تم تحديث الملف الشخصي بنجاح',
        duration: 3000
      });

      return { success: true, error: null, profile: data };
    } catch (error) {
      const handledError = handleSupabaseError(error);

      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: handledError.message,
        duration: 5000
      });

      return { success: false, error: handledError.message };
    }
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const hasPermission = useCallback((permissions) => {
    if (!userProfile) return false;

    if (Array.isArray(permissions)) {
      return permissions.some(permission => checkPermission(permission));
    }

    return checkPermission(permissions);
  }, [userProfile]);

  const checkPermission = (permission) => {
    const rolePermissions = {
      viewer: ['dashboard:view', 'reports:view'],
      ops: ['dashboard:view', 'reports:view', 'restaurants:view', 'restaurants:edit', 'team:view'],
      admin: ['dashboard:view', 'reports:view', 'restaurants:view', 'restaurants:edit', 'restaurants:delete', 'team:view', 'team:manage', 'financial:view', 'settings:manage', 'users:manage']
    };

    const userPermissions = rolePermissions[userProfile?.role] || [];
    return userPermissions.includes(permission);
  };

  const getSessionTimeLeft = useCallback(() => {
    if (!sessionExpiry) return null;
    return Math.max(0, sessionExpiry - new Date());
  }, [sessionExpiry]);

  const value = useMemo(() => ({
    user,
    userProfile,
    loading,
    connectionStatus,
    sessionExpiry,

    isAuthenticated: DEV_BYPASS_AUTH ? true : !!user,
    isAdmin: userProfile?.role === 'admin',
    isOps: userProfile?.role === 'ops' || userProfile?.role === 'admin',
    isViewer: userProfile?.role === 'viewer',

    login,
    signUp,
    logout,
    resetPassword,
    updateProfile,

    hasPermission,
    checkPermission,

    getSessionTimeLeft
  }), [user, userProfile, loading, connectionStatus, sessionExpiry, login, signUp, logout, resetPassword, updateProfile, hasPermission, getSessionTimeLeft]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
