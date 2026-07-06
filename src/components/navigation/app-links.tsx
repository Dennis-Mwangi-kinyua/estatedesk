"use client";

import Link, { type LinkProps } from "next/link";
import {
  useState,
  type AnchorHTMLAttributes,
  type FocusEvent,
  type MouseEvent,
  type TouchEvent,
} from "react";

type AppLinkProps = LinkProps &
  Pick<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "onMouseEnter" | "onFocus" | "onTouchStart"
  > & {
    children: React.ReactNode;
    className?: string;
  };

/**
 * Defers route prefetching until the user shows navigation intent.
 * Prevents dozens of sidebar links from injecting unused preload hints.
 */
export function HoverPrefetchLink({
  children,
  prefetch,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...rest
}: AppLinkProps) {
  const [prefetchEnabled, setPrefetchEnabled] = useState(false);

  const enablePrefetch = () => {
    setPrefetchEnabled(true);
  };

  const resolvedPrefetch =
    prefetch !== undefined ? prefetch : prefetchEnabled ? null : false;

  return (
    <Link
      {...rest}
      prefetch={resolvedPrefetch}
      onMouseEnter={(event: MouseEvent<HTMLAnchorElement>) => {
        enablePrefetch();
        onMouseEnter?.(event);
      }}
      onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
        enablePrefetch();
        onFocus?.(event);
      }}
      onTouchStart={(event: TouchEvent<HTMLAnchorElement>) => {
        enablePrefetch();
        onTouchStart?.(event);
      }}
    >
      {children}
    </Link>
  );
}

/**
 * For lists, pagination, and secondary actions where eager prefetch is wasteful.
 */
export function DeferredLink({ prefetch = false, ...rest }: AppLinkProps) {
  return <Link {...rest} prefetch={prefetch} />;
}