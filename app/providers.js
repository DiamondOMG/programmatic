"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

export default function Providers({ children, userData }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Navbar userData={userData} />
      <main>{children}</main>
    </QueryClientProvider>
  );
}
