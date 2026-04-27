"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ApiError } from "@/core/api/errors";
import { apiClient, authUnauthorizedEventName } from "@/core/api/api-client";
import type {
  AuthSession,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
} from "@/core/auth/types";

type AuthContextValue = {
  session: AuthSession | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<LoginResponse>;
  changePassword: (request: ChangePasswordRequest) => Promise<void>;
  enterOrganizationContext: (organizationId: string) => Promise<AuthSession>;
  exitOrganizationContext: () => Promise<AuthSession>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  const preservePasswordChangeState = (
    currentSession: AuthSession | null,
    nextSession: AuthSession,
  ) => {
    if (
      currentSession &&
      currentSession.userId === nextSession.userId &&
      !currentSession.mustChangePassword &&
      nextSession.mustChangePassword
    ) {
      return {
        ...nextSession,
        mustChangePassword: false,
      };
    }

    return nextSession;
  };

  const refreshSession = async () => {
    try {
      const response = await apiClient<AuthSession>("/api/auth/session");
      let resolvedResponse = response;
      setSession((current) => {
        const next = preservePasswordChangeState(current, response);
        resolvedResponse = next;
        return next;
      });
      return resolvedResponse;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSession(null);
        return null;
      }

      setSession(null);
      throw error;
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    let isDisposed = false;

    const loadSession = async () => {
      try {
        const response = await apiClient<AuthSession>("/api/auth/session");
        if (!isDisposed) {
          setSession((current) =>
            preservePasswordChangeState(current, response),
          );
        }
      } catch (error) {
        if (!isDisposed) {
          setSession(null);
        }

        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }
      } finally {
        if (!isDisposed) {
          setIsReady(true);
        }
      }
    };

    void loadSession().catch(() => undefined);

    const handleUnauthorized = () => {
      if (!isDisposed) {
        setSession(null);
        setIsReady(true);
      }
    };

    window.addEventListener(authUnauthorizedEventName, handleUnauthorized);

    return () => {
      isDisposed = true;
      window.removeEventListener(authUnauthorizedEventName, handleUnauthorized);
    };
  }, []);

  const login = async (request: LoginRequest) => {
    const response = await apiClient<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(request),
    });

    setSession((current) => preservePasswordChangeState(current, response));
    return response;
  };

  const logout = async () => {
    try {
      await apiClient<void>("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }
    } finally {
      setSession(null);
    }
  };

  const changePassword = async (request: ChangePasswordRequest) => {
    await apiClient<void>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(request),
    });

    setSession((current) =>
      current
        ? {
            ...current,
            mustChangePassword: false,
          }
        : current,
    );
  };

  const enterOrganizationContext = async (organizationId: string) => {
    const response = await apiClient<AuthSession>(
      "/api/auth/organization-context",
      {
        method: "POST",
        body: JSON.stringify({ organizationId }),
      },
    );

    setSession(response);
    return response;
  };

  const exitOrganizationContext = async () => {
    const response = await apiClient<AuthSession>(
      "/api/auth/organization-context",
      {
        method: "DELETE",
      },
    );

    setSession(response);
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isReady,
        isAuthenticated: session !== null,
        login,
        changePassword,
        enterOrganizationContext,
        exitOrganizationContext,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
