"use client";

import { track } from "./track";

type Params = Record<string, string | number | boolean | undefined>;

export function TrackedLink({
  href,
  event,
  params,
  className,
  target,
  rel,
  ariaLabel,
  children,
}: {
  href: string;
  event: string;
  params?: Params;
  className?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      className={className}
      onClick={() => track(event, { link_url: href, ...params })}
    >
      {children}
    </a>
  );
}
