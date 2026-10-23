import { build as bundle, type BuildOptions, type BuildResult, type Plugin } from "esbuild";
export type { Plugin } from "esbuild";

// WorkspaceLink now uses the app router for directory restoration. Fixture
// documents have no Next router provider; retain each fixture's other mocks.
const workspaceRouter: Plugin = {
  name: "workspace-link-router",
  setup(builder) {
    builder.onResolve({ filter: /^next\/navigation$/ }, args => {
      if (args.importer.replaceAll("\\", "/").endsWith("/components/navigation/workspace-link.tsx")) return { path: "router", namespace: "workspace-link-router" };
    });
    builder.onLoad({ filter: /.*/, namespace: "workspace-link-router" }, () => ({
      contents: "export const useRouter=()=>({push(url){window.location.assign(url)},replace(url){window.location.replace(url)},refresh(){},prefetch(){}});", loader: "js",
    }));
  },
};

export function build<T extends BuildOptions>(options: T): Promise<BuildResult<T>>;
export function build(options: BuildOptions): Promise<BuildResult> {
  return bundle({ ...options, plugins: [workspaceRouter, ...(options.plugins ?? [])] });
}
