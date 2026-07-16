// SAA script categories — Schema B (approved 2026-07-16): the /saa/skript
// index navigates by CLF-style category chapters; the exam domains (D1–D4)
// stay as chips ON the service rows. Deliberate departure from the blueprint
// note "CLF-Kategorienstruktur nicht kopieren" — documented in CLAUDE.md.
//
// Static navigation metadata, NOT a DB column: nothing filters by category on
// the DB side (YAGNI). Mapping curated once from aws-services-172.json CLF
// categories (12 → 10 fold) plus manual assignment for SAA-new services and
// the decision matrices; the partition invariant (every script in exactly one
// category) is enforced by saa-script-categories.test.ts.
//
// Colours = approved mockup palette (design/mockups/saa-skript-kategorien-
// mockup.html), accent/bg verbatim. Icons reuse the CLF chapter icons; new:
// Integration=GitBranch, Migration=Truck, Kosten=PiggyBank.
import {
  BarChart3,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  HardDrive,
  Network,
  PiggyBank,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

export type SaaScriptCategoryKey =
  | "compute"
  | "storage"
  | "db"
  | "net"
  | "sec"
  | "int"
  | "ana"
  | "mgmt"
  | "mig"
  | "cost";

export type SaaScriptCategory = {
  key: SaaScriptCategoryKey;
  title: string;
  /** One-line service teaser on the category card (mockup copy). */
  summary: string;
  Icon: LucideIcon;
  /** Mockup palette, verbatim. */
  accent: string;
  bg: string;
};

export const SAA_SCRIPT_CATEGORIES: SaaScriptCategory[] = [
  {
    key: "compute",
    title: "Compute, Container & Edge",
    summary: "EC2, Lambda, ECS/EKS/Fargate, Auto Scaling, Batch",
    Icon: Cpu,
    accent: "#7c3aed",
    bg: "#f3effe",
  },
  {
    key: "storage",
    title: "Storage",
    summary: "S3, EBS, EFS, FSx, Storage Gateway",
    Icon: HardDrive,
    accent: "#059669",
    bg: "#e7f6f0",
  },
  {
    key: "db",
    title: "Datenbanken",
    summary: "RDS, Aurora, DynamoDB, ElastiCache, Redshift",
    Icon: Database,
    accent: "#4f46e5",
    bg: "#ecebfb",
  },
  {
    key: "net",
    title: "Netzwerk & Content Delivery",
    summary: "VPC, Route 53, CloudFront, Global Accelerator, Direct Connect",
    Icon: Network,
    accent: "#2563eb",
    bg: "#e6effd",
  },
  {
    key: "sec",
    title: "Sicherheit, Identität & Compliance",
    summary: "IAM, KMS, Cognito, GuardDuty, WAF, Shield, Macie",
    Icon: ShieldCheck,
    accent: "#dc2626",
    bg: "#fdeaea",
  },
  {
    key: "int",
    title: "Integration & Entkopplung",
    summary: "SQS, SNS, EventBridge, Step Functions, API Gateway, MQ",
    Icon: GitBranch,
    accent: "#db2777",
    bg: "#fce8f1",
  },
  {
    key: "ana",
    title: "Analytik",
    summary: "Athena, Glue, Kinesis, EMR, OpenSearch, MSK",
    Icon: BarChart3,
    accent: "#0d9488",
    bg: "#e4f4f2",
  },
  {
    key: "mgmt",
    title: "Management & Governance",
    summary: "CloudFormation, CloudWatch, Config, Organizations, Systems Manager",
    Icon: Gauge,
    accent: "#d97706",
    bg: "#fdf0e0",
  },
  {
    key: "mig",
    title: "Migration & Transfer",
    summary: "DMS, DataSync, Snow Family, Transfer Family",
    Icon: Truck,
    accent: "#0891b2",
    bg: "#e3f3f8",
  },
  {
    key: "cost",
    title: "Kosten-Management",
    summary: "Budgets, Cost Explorer, Kaufoptionen, Compute Optimizer",
    Icon: PiggyBank,
    accent: "#65a30d",
    bg: "#eef6e2",
  },
];

export function scriptCategoryByKey(
  key: string,
): SaaScriptCategory | undefined {
  return SAA_SCRIPT_CATEGORIES.find((c) => c.key === key);
}

// Script slugs (= slugifyHeading(service), see db/seed/saa-scripts) per
// category. Alphabetical within each group. Partition over all 137 scripts —
// guard-tested; extend this map whenever a script is added upstream.
export const SCRIPT_SLUGS_BY_CATEGORY: Record<
  SaaScriptCategoryKey,
  readonly string[]
> = {
  compute: [
    "amazon-appstream-2-0-jetzt-workspaces-applications",
    "amazon-ec2-inkl-kaufoptionen-placement-groups",
    "amazon-ecr",
    "amazon-ecs-ecs-anywhere",
    "amazon-eks-eks-anywhere-distro-hybrid-nodes",
    "amazon-workdocs-abgekuendigt",
    "amazon-workmail",
    "amazon-workspaces",
    "amazon-workspaces-secure-browser-frueher-workspaces-web",
    "aws-amplify",
    "aws-batch",
    "aws-device-farm",
    "aws-elastic-beanstalk",
    "aws-fargate",
    "aws-lambda",
    "aws-outposts",
    "aws-serverless-application-repository-sar",
    "aws-wavelength-local-zones",
    "compute-entscheidungsmatrix-uebergreifend",
    "ec2-auto-scaling-aws-auto-scaling",
    "front-end-business-apps-entscheidungsmatrix-uebergreifend",
    "vmware-cloud-on-aws",
  ],
  storage: [
    "amazon-ebs",
    "amazon-efs",
    "amazon-fsx-alle-typen",
    "amazon-s3",
    "aws-backup",
    "aws-storage-gateway",
  ],
  db: [
    "amazon-aurora-aurora-serverless",
    "amazon-documentdb",
    "amazon-dynamodb-inkl-dax-global-tables",
    "amazon-elasticache",
    "amazon-keyspaces-for-apache-cassandra",
    "amazon-neptune",
    "amazon-rds",
    "amazon-rds-proxy",
    "amazon-redshift",
    "amazon-redshift-analytics-vertiefung",
  ],
  net: [
    "amazon-cloudfront",
    "amazon-route-53",
    "amazon-vpc",
    "aws-client-vpn",
    "aws-direct-connect",
    "aws-global-accelerator",
    "aws-network-firewall",
    "aws-privatelink",
    "aws-site-to-site-vpn",
    "aws-transit-gateway",
    "elastic-load-balancing-alb-nlb-gwlb",
    "nat-gateway-nat-instance",
    "netzwerk-entscheidungsmatrix-uebergreifend",
    "vpc-endpoints-gateway-interface",
    "vpc-flow-logs",
  ],
  sec: [
    "amazon-cognito",
    "amazon-detective",
    "amazon-guardduty",
    "amazon-inspector",
    "amazon-macie",
    "aws-certificate-manager-acm",
    "aws-cloudhsm",
    "aws-directory-service",
    "aws-firewall-manager",
    "aws-iam-identity-center",
    "aws-iam-policy-vertiefung",
    "aws-kms-key-management-service",
    "aws-secrets-manager",
    "aws-security-hub",
    "aws-shield-standard-advanced",
    "aws-sts-federation",
    "aws-waf",
    "security-entscheidungsmatrix-uebergreifend",
  ],
  int: [
    "amazon-api-gateway",
    "amazon-connect",
    "amazon-eventbridge",
    "amazon-mq",
    "amazon-pinpoint",
    "amazon-ses-simple-email-service",
    "amazon-sns",
    "amazon-sqs",
    "aws-appsync",
    "aws-step-functions",
    "integration-entscheidungsmatrix-uebergreifend",
  ],
  ana: [
    "amazon-athena",
    "amazon-bedrock-orientierung-nicht-im-guide-appendix",
    "amazon-comprehend",
    "amazon-emr",
    "amazon-forecast",
    "amazon-fraud-detector",
    "amazon-kendra",
    "amazon-kinesis-data-streams-data-firehose",
    "amazon-kinesis-managed-service-for-apache-flink-analytics",
    "amazon-lex",
    "amazon-msk-managed-streaming-for-apache-kafka",
    "amazon-opensearch-service",
    "amazon-polly",
    "amazon-quicksight",
    "amazon-rekognition",
    "amazon-sagemaker-ai",
    "amazon-textract",
    "amazon-transcribe",
    "amazon-translate",
    "analytics-entscheidungsmatrix-uebergreifend",
    "aws-data-exchange",
    "aws-glue",
    "aws-lake-formation",
    "media-services-kinesis-video-streams-elastic-transcoder",
    "ml-ki-ueberblick-entscheidungsmatrix-uebergreifend",
  ],
  mgmt: [
    "amazon-cloudwatch",
    "aws-appconfig",
    "aws-artifact",
    "aws-audit-manager",
    "aws-cloudformation",
    "aws-cloudtrail",
    "aws-config",
    "aws-control-tower",
    "aws-health-dashboard",
    "aws-license-manager",
    "aws-organizations-scps-rcps-control-tower",
    "aws-resilience-hub",
    "aws-resource-access-manager-ram",
    "aws-service-catalog",
    "aws-systems-manager-ssm",
    "aws-trusted-advisor",
    "aws-well-architected-tool",
  ],
  mig: [
    "aws-application-migration-service-mgn",
    "aws-datasync",
    "aws-dms-database-migration-service",
    "aws-elastic-disaster-recovery-drs",
    "aws-snow-family-migrations-perspektive",
    "aws-transfer-family",
    "disaster-recovery-strategien-rto-rpo",
    "migration-dr-entscheidungsmatrix-uebergreifend",
  ],
  cost: [
    "aws-budgets",
    "aws-compute-optimizer",
    "aws-cost-explorer",
    "ec2-kaufoptionen-savings-plans-ris-spot-on-demand",
    "management-governance-kosten-entscheidungsmatrix-uebergreifend",
  ],
};
