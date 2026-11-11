import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { PlatformShell } from "@/app/(app)/platform/_components/platform-shell";
import { PlatformDashboardHeading } from "@/app/(app)/platform/_components/platform-dashboard-heading";
import { PlatformAppLauncher } from "@/app/(app)/platform/_components/platform-app-launcher";
createRoot(document.getElementById("fixture")!).render(<ThemeProvider><PlatformShell fullName="Test operator" isSuperAdmin pendingProviderCount={2} pendingDemoCount={3}><PlatformDashboardHeading /><PlatformAppLauncher /></PlatformShell></ThemeProvider>);
