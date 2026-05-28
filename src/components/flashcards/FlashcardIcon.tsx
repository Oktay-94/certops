"use client";

import { useState } from "react";
import { Cloud, DollarSign, Server, Shield } from "lucide-react";
import { AWS_SERVICES } from "@/lib/aws-services";
import {
  getDomainColor,
  type FallbackIconName,
} from "@/lib/domain-colors";

type Variant = "hero" | "compact";

type Props = {
  iconSlugs: string[] | null;
  domain: string;
  variant?: Variant;
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

type SizeSpec = {
  single: number;
  pair: number;
  lucide: number;
  gap: string;
};

const SIZES: Record<Variant, SizeSpec> = {
  hero: { single: 56, pair: 44, lucide: 32, gap: "gap-2" },
  compact: { single: 32, pair: 28, lucide: 19, gap: "gap-1" },
};

function ServiceIcon({
  slug,
  size,
  lucide,
  domain,
}: {
  slug: string;
  size: number;
  lucide: number;
  domain: string;
}) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return <DomainFallback domain={domain} size={size} lucide={lucide} />;
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

function DomainFallback({
  domain,
  size,
  lucide,
}: {
  domain: string;
  size: number;
  lucide: number;
}) {
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
      <Icon size={lucide} className="text-white" />
    </span>
  );
}

export function FlashcardIcon({ iconSlugs, domain, variant = "hero" }: Props) {
  const spec = SIZES[variant];
  const valid = (iconSlugs ?? [])
    .filter((s): s is string => typeof s === "string" && KNOWN_SLUGS.has(s))
    .slice(0, 2);

  if (valid.length === 0) {
    return (
      <DomainFallback
        domain={domain}
        size={spec.single}
        lucide={spec.lucide}
      />
    );
  }

  if (valid.length === 1) {
    return (
      <ServiceIcon
        slug={valid[0]}
        size={spec.single}
        lucide={spec.lucide}
        domain={domain}
      />
    );
  }

  return (
    <span className={`inline-flex items-center ${spec.gap}`} aria-hidden>
      <ServiceIcon
        slug={valid[0]}
        size={spec.pair}
        lucide={spec.lucide}
        domain={domain}
      />
      <ServiceIcon
        slug={valid[1]}
        size={spec.pair}
        lucide={spec.lucide}
        domain={domain}
      />
    </span>
  );
}
