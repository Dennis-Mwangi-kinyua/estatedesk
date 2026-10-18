import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import type { WebView } from "react-native-webview";
import { tenantDocumentPath, tenantNavigation, tenantWorkspaceLinks, type MobileWorkspaceKind } from "@estatedesk/contracts/mobile";
import { ApiError, openTenantWebDocument, tenantWorkspaceSource, workspaceSource, websiteUrl } from "../api";
import { Button, styles } from "./ui";

// Android's download attribute can bypass navigation callbacks. Catch document
// clicks before the browser hands private PDFs to the OS download manager.
const documentClicks = `(() => {
  if (window.__estateDeskDocuments) return;
  window.__estateDeskDocuments = true;
  document.addEventListener('click', event => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (/^\\/dashboard\\/tenant\\/(lease|inspections|invoice)\\/[^/]+\\/download$|^\\/dashboard\\/tenant\\/receipts\\/[^/]+$|^\\/dashboard\\/tenant\\/payments\\/statement$|^\\/api\\/receipts\\/[^/]+$|^\\/api\\/move-outs\\/[^/]+\\/report$/.test(url.pathname)) {
      event.preventDefault(); event.stopPropagation();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'document', url: url.href }));
    }
  }, true);
})(); true;`;

/** A full-height, isolated browser for the same tenant workflows as the web. */
export function TenantWorkspace({ close, onError, initialPath = "/dashboard/tenant", kind = "tenant" }: { close: () => void; onError: (error: unknown) => void; initialPath?: string; kind?: MobileWorkspaceKind | "tenant" }) {
  const browser = useRef<WebView<unknown>>(null);
  const [Browser, setBrowser] = useState<typeof import("react-native-webview").WebView | null>(null);
  const canGoBack = useRef(false);
  const downloading = useRef(false);
  const [source, setSource] = useState<Awaited<ReturnType<typeof tenantWorkspaceSource>> | null>(null);
  const [path, setPath] = useState(initialPath);
  const [attempt, setAttempt] = useState(0);
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const links = tenantWorkspaceLinks;
  const title = kind === "tenant" ? "Tenant workspace" : kind === "platform" ? "Platform workspace" : "Organization workspace";
  const origin = websiteUrl();

  useEffect(() => {
    let active = true;
    // Load optional native integration only when opening a web workflow. An older
    // development binary must still be able to register and open the native app.
    void Promise.all([
      import("react-native-webview").catch(() => { throw new Error("This development build is missing WebView. Rebuild the iOS or Android app to open this workflow."); }),
      kind === "tenant" ? tenantWorkspaceSource(path) : workspaceSource(kind, path),
    ]).then(([module, value]) => {
      if (active) { setBrowser(() => module.WebView); setSource(value); }
    }).catch(cause => {
      if (active) { setError(cause instanceof Error ? cause.message : "Unable to open workspace."); setLoading(false); onError(cause); }
    });
    return () => { active = false; };
  }, [path, attempt, onError, kind]);


  function back() {
    if (menu) setMenu(false);
    else if (canGoBack.current) browser.current?.goBack();
    else close();
  }
  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => { back(); return true; });
    return () => listener.remove();
  });

  function navigate(url: string) {
    const action = tenantNavigation(url, origin);
    if (action === "exit") { close(); return false; }
    if (action === "external") { void Linking.openURL(url).catch(cause => setError(cause instanceof Error ? cause.message : "Unable to open link.")); return false; }
    if (action === "blocked") return false;
    if (tenantDocumentPath(url, origin)) {
      if (!downloading.current) {
        downloading.current = true;
        void openTenantWebDocument(url).catch(cause => {
          setError(cause instanceof Error ? cause.message : "Unable to download document.");
          if (cause instanceof ApiError && cause.status === 401) { onError(cause); close(); }
        }).finally(() => { downloading.current = false; });
      }
      return false;
    }
    return true;
  }

  return <Modal visible animationType="slide" onRequestClose={back} presentationStyle="fullScreen">
    <SafeAreaProvider><SafeAreaView style={{ flex: 1, backgroundColor: "#f3f6f3" }}>
      <View style={{ padding: 12, gap: 8 }}>
        {kind === "tenant" ? <Text style={styles.cardTitle}>{title}</Text> : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button label="Back" onPress={back} secondary />
          {kind === "tenant" ? <Button label={menu ? "Hide menu" : "All features"} onPress={() => setMenu(!menu)} secondary /> : null}
          <Button label="Close" onPress={close} secondary />
        </View>
        {loading ? <ActivityIndicator accessibilityLabel={`Loading ${title.toLowerCase()}`} color="#14634e" /> : null}
        {error ? <>
          <Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text>
          <Button label="Retry workspace" onPress={() => { setSource(null); setError(""); setLoading(true); canGoBack.current = false; setAttempt(value => value + 1); }} />
        </> : null}
      </View>
      {menu ? <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        <Text style={styles.subtitle}>Features depend on your account and workspace permissions.</Text>
        {links.map(([label, target]) => <Button key={target} label={label} secondary onPress={() => {
          setMenu(false); setError(""); setLoading(true); canGoBack.current = false; setSource(null); setPath(target); setAttempt(value => value + 1);
        }} />)}
      </ScrollView> : null}
      {source && Browser ? <Browser<unknown> ref={browser} key={`${path}:${attempt}`} source={source}
        style={{ flex: menu ? 0 : 1, height: menu ? 0 : undefined }}
        // Credentials are scoped to this view's session, never the OS browser.
        incognito sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} cacheEnabled={false}
        originWhitelist={["*"]} mixedContentMode="never" allowFileAccess={false}
        allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false}
        javaScriptCanOpenWindowsAutomatically={false} setSupportMultipleWindows
        injectedJavaScriptBeforeContentLoaded={documentClicks} injectedJavaScript={documentClicks}
        onMessage={event => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "document" && typeof data.url === "string" && tenantDocumentPath(data.url, origin)) navigate(data.url);
          } catch { /* Ignore unrelated messages from web content. */ }
        }}
        onFileDownload={event => {
          if (tenantDocumentPath(event.nativeEvent.downloadUrl, origin)) navigate(event.nativeEvent.downloadUrl);
        }}
        onShouldStartLoadWithRequest={request => navigate(request.url)}
        onOpenWindow={event => {
          const url = event.nativeEvent.targetUrl;
          if (navigate(url)) browser.current?.injectJavaScript(`window.location.assign(${JSON.stringify(url)}); true;`);
        }}
        onNavigationStateChange={state => { canGoBack.current = state.canGoBack; if (tenantNavigation(state.url, origin) === "exit") close(); }}
        onLoadStart={() => setLoading(true)} onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setError("Unable to load the workspace. Check your connection and retry."); }}
        onHttpError={event => {
          if (event.nativeEvent.statusCode === 401) { onError(new ApiError("Please sign in again.", 401)); close(); }
          else { setLoading(false); setError("This workspace could not be loaded. Retry or choose another feature."); }
        }}
        onContentProcessDidTerminate={() => { setLoading(false); setError("The workspace was interrupted. Retry to reopen it."); }}
        onRenderProcessGone={() => { setLoading(false); setError("The workspace was interrupted. Retry to reopen it."); }}
      /> : null}
    </SafeAreaView></SafeAreaProvider>
  </Modal>;
}
