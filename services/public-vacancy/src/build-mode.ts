export function isDatabaseIndependentBuild() {
  return (
    process.env.ESTATEDESK_BUILD_WITHOUT_DATABASE === "true" &&
    process.env.npm_lifecycle_event === "build"
  );
}
