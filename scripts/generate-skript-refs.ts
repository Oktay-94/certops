// One-shot generator: writes `skriptRef` into src/lib/aws-services-172.json.
//
// Matching order per service: explicit OVERRIDES first, then exact match of
// the normalised service name against the normalised chapter headings
// (parentheticals and nickname suffixes stripped). Fails loudly if any of the
// 172 services ends up without a target or an override points to a
// non-existent anchor — the committed result is additionally frozen by
// src/lib/skript-anchors.test.ts.
//
// Run: pnpm tsx scripts/generate-skript-refs.ts
import fs from "node:fs";
import path from "node:path";
import { SKRIPT_CHAPTERS, normalizeName, type SkriptRef } from "../src/lib/skript";
import { parseHeadings, readChapterMarkdown } from "../src/lib/skript-content";

const JSON_PATH = path.join(process.cwd(), "src", "lib", "aws-services-172.json");

type RawService = { id: number; service: string; skriptRef?: SkriptRef };
type RawSource = { count: number; categories: string[]; services: RawService[] };

// Manual targets for everything the name match cannot resolve — reviewed
// case-by-case (see PR description). anchor omitted = chapter-level fallback.
const OVERRIDES: Record<number, SkriptRef> = {
  // Container bundle card covers all three services.
  3: { chapter: 2, anchor: "container-grundlagen-docker-kubernetes-ecs-eks-fargate" }, // Fargate
  4: { chapter: 2, anchor: "container-grundlagen-docker-kubernetes-ecs-eks-fargate" }, // ECS
  5: { chapter: 2, anchor: "container-grundlagen-docker-kubernetes-ecs-eks-fargate" }, // EKS
  9: { chapter: 2, anchor: "hybrid-edge-local-zones-wavelength-outposts" }, // Outposts
  // Aurora is covered inside the RDS section (engines + 🛑 SAA deep-dive).
  20: { chapter: 4, anchor: "amazon-rds-relational-database-service" },
  // IoT: Core only appears in K13's Mini-Merkkasten; Greengrass/FreeRTOS/
  // SiteWise land on K2's Hybrid & Edge section (Greengrass is discussed
  // there as the software-edge counterpart) — Oktay's call.
  73: { chapter: 13 }, // IoT Core
  74: { chapter: 2, anchor: "hybrid-edge-local-zones-wavelength-outposts" }, // Greengrass
  75: { chapter: 2, anchor: "hybrid-edge-local-zones-wavelength-outposts" }, // FreeRTOS
  107: { chapter: 2, anchor: "hybrid-edge-local-zones-wavelength-outposts" }, // IoT SiteWise
  // Not covered in the script at all — chapter fallback (category: Migration).
  106: { chapter: 11 }, // Transfer Family
  // Only mentioned in passing inside these sections.
  121: { chapter: 10, anchor: "aws-codecommit" }, // CodeArtifact
  122: { chapter: 6, anchor: "aws-audit-manager" }, // AWS Artifact
  // Detail cards → the section that holds the detail content.
  123: { chapter: 5, anchor: "elastic-load-balancing-elb" }, // ELB – ALB/NLB/GWLB
  124: { chapter: 5, anchor: "amazon-route-53" }, // Route 53 – Routing-Arten
  132: { chapter: 5, anchor: "cloudfront-oac-oai-lambda-edge-functions-sni" }, // CloudFront Details
  136: { chapter: 2, anchor: "container-ecs-ecr-im-detail" }, // Container, ECS & ECR Details
  139: { chapter: 2, anchor: "hybrid-edge-local-zones-wavelength-outposts" }, // Hybrid & Edge card
  // Card spans two K1 sections (deployment models + shared responsibility).
  146: { chapter: 1 },
};

// normalizeName lives in src/lib/skript.ts — single source, shared with the
// h2 emoji resolver so service→anchor and heading→metaphor agree exactly.
const source = JSON.parse(fs.readFileSync(JSON_PATH, "utf8")) as RawSource;

// Index: normalised heading name → ref. First occurrence wins, so main cards
// ("Amazon S3 …") take precedence over later detail sections.
const headingIndex = new Map<string, SkriptRef>();
const anchorsByChapter = new Map<number, Set<string>>();
for (const chapter of SKRIPT_CHAPTERS) {
  const headings = parseHeadings(readChapterMarkdown(chapter));
  anchorsByChapter.set(chapter.num, new Set(headings.map((h) => h.slug)));
  for (const h of headings) {
    const key = normalizeName(h.text);
    if (!headingIndex.has(key)) {
      headingIndex.set(key, { chapter: chapter.num, anchor: h.slug });
    }
  }
}

function anchorExists(ref: SkriptRef): boolean {
  if (!anchorsByChapter.has(ref.chapter)) return false;
  if (ref.anchor === undefined) return true;
  return anchorsByChapter.get(ref.chapter)!.has(ref.anchor);
}

const unmatched: string[] = [];
let overridden = 0;
let matched = 0;
for (const svc of source.services) {
  const override = OVERRIDES[svc.id];
  const ref = override ?? headingIndex.get(normalizeName(svc.service));
  if (!ref) {
    unmatched.push(`[${svc.id}] ${svc.service}`);
    continue;
  }
  if (!anchorExists(ref)) {
    throw new Error(
      `skriptRef for [${svc.id}] ${svc.service} points to missing target: ${JSON.stringify(ref)}`,
    );
  }
  svc.skriptRef = ref;
  if (override) overridden += 1;
  else matched += 1;
}

if (unmatched.length > 0) {
  throw new Error(
    `No skriptRef target for ${unmatched.length} service(s):\n${unmatched.join("\n")}`,
  );
}

fs.writeFileSync(JSON_PATH, `${JSON.stringify(source, null, 2)}\n`, "utf8");
console.log(
  `skriptRef written for ${source.services.length} services (${matched} name-matched, ${overridden} overrides).`,
);
