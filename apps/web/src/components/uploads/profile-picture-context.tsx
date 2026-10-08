"use client";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";
const PictureContext = createContext<string | null>(null);
export function ProfilePictureProvider({ url, children }: { url: string | null; children: ReactNode }) {
  return <PictureContext.Provider value={url}>{children}</PictureContext.Provider>;
}
export function useProfilePicture() { return useContext(PictureContext); }
