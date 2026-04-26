"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useRouter } from "next/navigation";
import apiClient, {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
} from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { ROLES } from "@/constants/roles";

// Auth Context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Load user from localStorage and fetch fresh data
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (token) {
          setAccessToken(token);

          // Fetch current user
          const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);

          if (response.user) {
            setUser(response.user);
          } else {
            // Token invalid, clear it
            clearAccessToken();
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
        clearAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Redirect to appropriate dashboard based on role
   */
  const redirectToDashboard = useCallback(
    (role) => {
      console.log("Redirecting user with role:", role);
      const dashboards = {
        [ROLES.SUPER_ADMIN]: "/super-admin",
        [ROLES.BRANCH_ADMIN]: "/branch-admin",
        [ROLES.TEACHER]: "/teacher",
        [ROLES.PARENT]: "/parent",
        [ROLES.STUDENT]: "/student",
      };

      const dashboard = dashboards[role] || "/dashboard";
      console.log("Redirecting to:", dashboard);
      router.push(dashboard);
    },
    [router]
  );

  /**
   * Login user
   */
  const login = useCallback(
    async (login, password) => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
          login,
          password,
        });

        // Our new API returns { success: true, user, accessToken }
        if (response.success) {
          const { user, accessToken } = response;

          // Save token
          localStorage.setItem("accessToken", accessToken);
          setAccessToken(accessToken);

          // Set user
          setUser(user);

          // Small delay to ensure state update
          setTimeout(() => {
            redirectToDashboard(user.role);
          }, 100);

          return { success: true };
        } else {
          setError(response.error || "Login failed");
          return { success: false, message: response.error };
        }
      } catch (error) {
        const message = error.message || "Login failed";
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [redirectToDashboard]
  );

  /**
   * Register user
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.REGISTER,
        userData
      );

      if (response.success) {
        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint - this now always succeeds
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Silently ignore - we'll clear local data anyway
    } finally {
      // Clear local data
      localStorage.removeItem("accessToken");
      clearAccessToken();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  /**
   * Change password
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        {
          currentPassword,
          newPassword,
        }
      );

      if (response.success) {
        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to change password";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Request password reset
   */
  const forgotPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email }
      );

      if (response.success) {
        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to send reset email";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (resetToken, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        resetToken,
        newPassword,
      });

      if (response.success) {
        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to reset password";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.put(API_ENDPOINTS.AUTH.ME, updates);

      if (response.success) {
        setUser(response.data);
        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update profile";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);

      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role) => {
      if (!user) return false;

      if (Array.isArray(role)) {
        return role.includes(user.role);
      }

      return user.role === role;
    },
    [user]
  );

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false;

      // Super admin has all permissions
      if (user.role === ROLES.SUPER_ADMIN) return true;

      if (Array.isArray(permission)) {
        return permission.some((p) => user.permissions?.includes(p));
      }

      return user.permissions?.includes(permission);
    },
    [user]
  );

  /**
   * Check if user belongs to a specific branch
   */
  const hasBranch = useCallback(
    (branchId) => {
      if (!user) return false;

      // Super admin has access to all branches
      if (user.role === ROLES.SUPER_ADMIN) return true;

      return user.branchId === branchId;
    },
    [user]
  );

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshUser,
    hasRole,
    hasPermission,
    hasBranch,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

/**
 * Protected Route HOC
 */
export function withAuth(Component, options = {}) {
  return function ProtectedRoute(props) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { requiredRole, requiredPermission, redirectTo = "/login" } = options;

    useEffect(() => {
      if (!loading && !user) {
        router.push(redirectTo);
      } else if (user) {
        // Check role
        if (requiredRole) {
          const hasRequiredRole = Array.isArray(requiredRole)
            ? requiredRole.includes(user.role)
            : user.role === requiredRole;

          if (!hasRequiredRole) {
            router.push("/unauthorized");
            return;
          }
        }

        // Check permission
        if (requiredPermission) {
          const hasRequiredPermission =
            user.role === ROLES.SUPER_ADMIN ||
            (Array.isArray(requiredPermission)
              ? requiredPermission.some((p) => user.permissions?.includes(p))
              : user.permissions?.includes(requiredPermission));

          if (!hasRequiredPermission) {
            router.push("/unauthorized");
            return;
          }
        }
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}

export default useAuth;
