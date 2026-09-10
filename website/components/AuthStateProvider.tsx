"use client";

import { createContext, useContext } from "react";

const AuthStateContext = createContext(false);

export function AuthStateProvider({
  authenticated,
  children
}: {
  authenticated: boolean;
  children: React.ReactNode;
}) {
  return (
    <AuthStateContext.Provider value={authenticated}>
      {children}
    </AuthStateContext.Provider>
  );
}

export function useAuthenticated() {
  return useContext(AuthStateContext);
}
