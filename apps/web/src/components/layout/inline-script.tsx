"use client";

type InlineScriptProps = {
  html: string;
  id?: string;
  scriptType?: string;
};

export function InlineScript({
  html,
  id,
  scriptType = "text/javascript",
}: InlineScriptProps) {
  return (
    <script
      id={id}
      type={typeof window === "undefined" ? scriptType : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}