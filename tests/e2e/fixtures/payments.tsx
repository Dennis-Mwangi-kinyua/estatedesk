import React from "react";
import {createRoot} from "react-dom/client";
import Page from "@/app/(app)/platform/payments/page";
Page({searchParams:Promise.resolve({})}).then(content => createRoot(document.getElementById("fixture")!).render(content));
