// ./menutraining-mantine/src/services/auth/auth-provider.tsx
"use client";
import { User } from "@/services/api/types/user";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthActionsContext,
  AuthContext,
  AuthTokensContext,
  TokensInfo,
} from "./auth-context";
import useFetch from "@/services/api/use-fetch";
import { AUTH_LOGOUT_URL, AUTH_ME_URL } from "@/services/api/config";
import HTTP_CODES_ENUM from "../api/types/http-codes";
import {
  getTokensInfo,
  setTokensInfo as setTokensInfoToStorage,
} from "./auth-tokens-info";
import { useRouter } from "next/navigation";
import useLanguage from "../i18n/use-language";

function AuthProvider(props: PropsWithChildren<{}>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const fetchBase = useFetch();
  const router = useRouter();
  const language = useLanguage();

  const setTokensInfo = useCallback((tokensInfo: TokensInfo) => {
    setTokensInfoToStorage(tokensInfo);
    if (!tokensInfo) {
      setUser(null);
    }
  }, []);

  const logOut = useCallback(async () => {
    const tokens = getTokensInfo();
    if (tokens?.token) {
      await fetchBase(AUTH_LOGOUT_URL, {
        method: "POST",
      });
    }
    setTokensInfo(null);

    // Route to home page after logout
    router.push(`/${language}`);
  }, [setTokensInfo, fetchBase, router, language]);

  // Load user data once at initialization
  const loadData = useCallback(async () => {
    const tokens = getTokensInfo();
    try {
      if (tokens?.token) {
        const response = await fetchBase(AUTH_ME_URL, {
          method: "GET",
        });
        if (response.status === HTTP_CODES_ENUM.UNAUTHORIZED) {
          logOut();
          return;
        }
        const data = await response.json();
        setUser(data);
      }
    } finally {
      // Mark auth as loaded regardless of outcome
      setIsLoaded(true);
    }
  }, [fetchBase, logOut]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const contextValue = useMemo(
    () => ({
      isLoaded,
      user,
    }),
    [isLoaded, user]
  );

  const contextActionsValue = useMemo(
    () => ({
      setUser,
      logOut,
    }),
    [logOut]
  );

  const contextTokensValue = useMemo(
    () => ({
      setTokensInfo,
    }),
    [setTokensInfo]
  );

  // Show nothing until auth is loaded to prevent flashing
  if (!isLoaded) {
    return null;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      <AuthActionsContext.Provider value={contextActionsValue}>
        <AuthTokensContext.Provider value={contextTokensValue}>
          {props.children}
        </AuthTokensContext.Provider>
      </AuthActionsContext.Provider>
    </AuthContext.Provider>
  );
}

export default AuthProvider;
