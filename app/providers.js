"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

// Create a context to pass userData down the component tree
import { createContext } from 'react';

export const UserContext = createContext();

export default function Providers({ children, userData }) {
  return (
    <QueryClientProvider client={queryClient}>
      <UserContext.Provider value={userData}>
        <Navbar userData={userData} />
        <main>{children}</main>
      </UserContext.Provider>
    </QueryClientProvider>
  );
}
