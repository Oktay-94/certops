// Lernskript (reading mode) — pure, isomorphic helpers.
//
// slugifyHeading() is THE single slug source for the whole feature: the
// markdown h2 renderer (DOM ids), the skriptRef generator script and the
// anchor-consistency test all import this one function. Never add a parallel
// slugger (e.g. rehype-slug) — divergent rules would silently break deep links.
//
// Filesystem access (reading the chapter files) lives in skript-content.ts,
// so client components can import skriptUrl() without pulling in `fs`.
import {
  ArrowRightLeft,
  BarChart3,
  Brain,
  Cloud,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  HardDrive,
  MonitorSmartphone,
  Network,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/** Deep-link target of a service card: chapter page, optionally + heading anchor. */
export type SkriptRef = {
  chapter: number;
  /** Heading anchor on the chapter page; omitted = chapter-level fallback. */
  anchor?: string;
};

export type SkriptChapter = {
  num: number;
  slug: string;
  title: string;
  /** Filename inside src/content/skript/. */
  file: string;
  /** One-line topic summary for the chapter grid (from the Deckblatt TOC). */
  topics: string;
  color: string;
  Icon: LucideIcon;
};

// Chapter manifest — single source for routing (generateStaticParams), the
// /skript grid and skriptUrl(). Colours reuse CATEGORY_STYLE tones where the
// chapter maps 1:1 onto a card category; chapters without a category
// counterpart (1, 13) get their own.
export const SKRIPT_CHAPTERS: SkriptChapter[] = [
  {
    num: 1,
    slug: "01-grundlagen-cloud-konzepte",
    title: "Grundlagen & Cloud-Konzepte",
    file: "01-grundlagen-cloud-konzepte.md",
    topics: "Cloud-Modelle, Regionen/AZs, Shared Responsibility, Well-Architected",
    color: "#64748b",
    Icon: Cloud,
  },
  {
    num: 2,
    slug: "02-compute-container-edge",
    title: "Compute, Container & Edge",
    file: "02-compute-container-edge.md",
    topics: "EC2, Lambda, ECS/EKS/Fargate, Auto Scaling, Edge-Compute",
    color: "#2563eb",
    Icon: Cpu,
  },
  {
    num: 3,
    slug: "03-storage",
    title: "Storage",
    file: "03-storage.md",
    topics: "S3 (+ Storage-Klassen), EBS, EFS, FSx, Storage Gateway",
    color: "#0d9488",
    Icon: HardDrive,
  },
  {
    num: 4,
    slug: "04-datenbanken",
    title: "Datenbanken",
    file: "04-datenbanken.md",
    topics: "RDS, Aurora, DynamoDB, ElastiCache, Redshift, Spezialdatenbanken",
    color: "#4f46e5",
    Icon: Database,
  },
  {
    num: 5,
    slug: "05-netzwerk-content-delivery",
    title: "Netzwerk & Content Delivery",
    file: "05-netzwerk-content-delivery.md",
    topics: "VPC, Route 53, CloudFront, Direct Connect, Global Accelerator",
    color: "#0891b2",
    Icon: Network,
  },
  {
    num: 6,
    slug: "06-sicherheit-identitaet-compliance",
    title: "Sicherheit, Identität & Compliance",
    file: "06-sicherheit-identitaet-compliance.md",
    topics: "IAM, KMS, Cognito, GuardDuty, Shield, WAF, Inspector, Macie",
    color: "#e11d48",
    Icon: ShieldCheck,
  },
  {
    num: 7,
    slug: "07-analytik",
    title: "Analytik",
    file: "07-analytik.md",
    topics: "Athena, Glue, EMR, Kinesis, OpenSearch, QuickSight, MSK",
    color: "#7c3aed",
    Icon: BarChart3,
  },
  {
    num: 8,
    slug: "08-machine-learning-ki",
    title: "Machine Learning & KI",
    file: "08-machine-learning-ki.md",
    topics: "Bedrock, SageMaker, Rekognition, Comprehend, Kendra …",
    color: "#c026d3",
    Icon: Brain,
  },
  {
    num: 9,
    slug: "09-anwendungsintegration",
    title: "Anwendungsintegration",
    file: "09-anwendungsintegration.md",
    topics: "SQS, SNS, EventBridge, Step Functions, API Gateway, MQ",
    color: "#059669",
    Icon: Workflow,
  },
  {
    num: 10,
    slug: "10-entwickler-tools-devops",
    title: "Entwickler-Tools & DevOps",
    file: "10-entwickler-tools-devops.md",
    topics: "CloudFormation, CDK, Code-Familie (CI/CD), X-Ray",
    color: "#65a30d",
    Icon: GitBranch,
  },
  {
    num: 11,
    slug: "11-migration-disaster-recovery",
    title: "Migration & Disaster Recovery",
    file: "11-migration-disaster-recovery.md",
    topics: "DMS, MGN, Snow Family, DRS, DR-Strategien (RTO/RPO)",
    color: "#ea580c",
    Icon: ArrowRightLeft,
  },
  {
    num: 12,
    slug: "12-management-governance-kosten",
    title: "Management, Governance & Kosten",
    file: "12-management-governance-kosten.md",
    topics: "CloudWatch, CloudTrail, Config, Systems Manager, Kosten-Tools",
    color: "#d97706",
    Icon: Gauge,
  },
  {
    num: 13,
    slug: "13-front-end-end-user-business-apps",
    title: "Front-End, End-User & Business Apps",
    file: "13-front-end-end-user-business-apps.md",
    topics: "Amplify, AppSync, SES, Connect, WorkSpaces, AppStream",
    color: "#0ea5e9",
    Icon: MonitorSmartphone,
  },
];

export function chapterByNum(num: number): SkriptChapter | undefined {
  return SKRIPT_CHAPTERS.find((c) => c.num === num);
}

export function chapterBySlug(slug: string): SkriptChapter | undefined {
  return SKRIPT_CHAPTERS.find((c) => c.slug === slug);
}

// German umlauts/ß first, so "Schnellstraße" → "schnellstrasse" (not "schnellstra-e").
const UMLAUTS: Array<[RegExp, string]> = [
  [/ä/g, "ae"],
  [/ö/g, "oe"],
  [/ü/g, "ue"],
  [/ß/g, "ss"],
];

/**
 * Deterministic heading → anchor id. Works identically on the raw markdown
 * heading text ("Amazon Forecast 🛑 *(abgekündigt …)*") and on the rendered,
 * emphasis-stripped DOM text ("Amazon Forecast 🛑 (abgekündigt …)"):
 * everything from the first 🛑 on is cut, and leftover markdown characters
 * (*, `) fall to the non-alphanumeric rule anyway.
 */
export function slugifyHeading(heading: string): string {
  let s = heading;
  const stop = s.indexOf("🛑");
  if (stop !== -1) s = s.slice(0, stop);
  s = s.toLowerCase();
  for (const [re, repl] of UMLAUTS) s = s.replace(re, repl);
  return s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** URL for a skriptRef — chapter page, plus anchor when the ref has one. */
export function skriptUrl(ref: SkriptRef): string {
  const chapter = chapterByNum(ref.chapter);
  if (!chapter) return "/skript";
  return ref.anchor ? `/skript/${chapter.slug}#${ref.anchor}` : `/skript/${chapter.slug}`;
}
