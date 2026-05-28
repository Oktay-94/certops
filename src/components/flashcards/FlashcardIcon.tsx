"use client";

import { useState } from "react";
import { Cloud, DollarSign, Server, Shield } from "lucide-react";
import { AWS_SERVICES } from "@/lib/aws-services";
import {
  getDomainColor,
  type FallbackIconName,
} from "@/lib/domain-colors";

type Props = {
  iconSlugs: string[] | null;
  domain: string;
};

const KNOWN_SLUGS: Set<string> = new Set(
  AWS_SERVICES.filter((s) => s.hasIcon !== false).map((s) => s.slug),
);

const FALLBACK_ICONS: Record<FallbackIconName, typeof Cloud> = {
  Cloud,
  Shield,
  Server,
  DollarSign,
};

function ServiceIcon({
  slug,
  size,
  domain,
}: {
  slug: string;
  size: number;
  domain: string;
}) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return <DomainFallback domain={domain} size={size} />;
  }
  return (
    <span
      aria-hidden
      data-icon="service"
      data-slug={slug}
      className="inline-flex items-center justify-center overflow-hidden rounded-[5px] bg-white"
      style={{ width: size, height: size }}
    >
      <img
        src={`/icons/aws/${slug}.svg`}
        alt=""
        width={size}
        height={size}
        onError={() => setErrored(true)}
      />
    </span>
  );
}

function DomainFallback({ domain, size }: { domain: string; size: number }) {
  const color = getDomainColor(domain);
  const Icon = FALLBACK_ICONS[color.fallbackIconName];
  return (
    <span
      aria-hidden
      data-icon="fallback"
      data-fallback-name={color.fallbackIconName}
      className={`inline-flex items-center justify-center rounded-[5px] ${color.iconBg}`}
      style={{ width: size, height: size }}
    >
      <Icon size={19} className="text-white" />
    </span>
  );
}

export function FlashcardIcon({ iconSlugs, domain }: Props) {
  const valid = (iconSlugs ?? [])
    .filter((s): s is string => typeof s === "string" && KNOWN_SLUGS.has(s))
    .slice(0, 2);

  if (valid.length === 0) {
    return <DomainFallback domain={domain} size={32} />;
  }

  if (valid.length === 1) {
    return <ServiceIcon slug={valid[0]} size={32} domain={domain} />;
  }

  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      <ServiceIcon slug={valid[0]} size={28} domain={domain} />
      <ServiceIcon slug={valid[1]} size={28} domain={domain} />
    </span>
  );
}
