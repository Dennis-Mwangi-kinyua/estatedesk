import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Path-relative id stays same-origin in local dev and production.
    id: "/",
    name: `${SITE_NAME} Property Management`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "en-KE",
    dir: "ltr",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    prefer_related_applications: false,
    // Neutral launch chrome hands off cleanly to the in-app loading screen.
    background_color: "#f8fafc",
    theme_color: "#f8fafc",
    orientation: "any",
    categories: ["business", "productivity", "finance"],
    icons: [
      {
        src: "/icons/icon-144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Install-store screenshots improve “Add to Home Screen” conversion.
    screenshots: [
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "narrow",
        label: "EstateDesk dashboard",
      },
      {
        src: "/icons/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "wide",
        label: "EstateDesk property operations",
      },
    ],
    launch_handler: {
      client_mode: "navigate-existing",
    },
    handle_links: "preferred",
    share_target: {
      action: "/share",
      method: "GET",
      enctype: "application/x-www-form-urlencoded",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Open your EstateDesk dashboard.",
        url: "/dashboard?source=pwa",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Report issue",
        short_name: "Issue",
        description: "Capture a maintenance issue from your device.",
        url: "/share",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Vacancies",
        short_name: "Vacancies",
        description: "Browse public vacancy listings.",
        url: "/vacancies",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Pay rent",
        short_name: "Pay",
        description: "Open tenant invoice and pay.",
        url: "/dashboard/tenant/invoice",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  } as MetadataRoute.Manifest;
}
