/**
 * One-off setup script: downloads the AWS Architecture Icon package,
 * extracts it, and copies the 64px Architecture-Service-Icon SVGs for our
 * curated CLF-C02 service list into public/icons/aws/{slug}.svg.
 *
 * Run: pnpm tsx scripts/fetch-icons.ts
 *
 * The package URL and release date are pinned — bump them when AWS ships
 * a new quarterly release.
 */
import { execSync } from "node:child_process";
import { mkdirSync, copyFileSync, existsSync, readdirSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ICON_ZIP_URL =
  "https://d1.awsstatic.com/onedam/marketing-channels/website/aws/en_US/architecture/approved/architecture-icons/Icon-package_04302026.4705b90f5aa45b019271a2699e9ce9b97b941ee1.zip";

const TMP_DIR = "/tmp/aws-icons-extracted";
const ZIP_PATH = "/tmp/aws-icons.zip";
const ARCH_ROOT = join(TMP_DIR, "Architecture-Service-Icons_04302026");
const OUT_DIR = resolve(process.cwd(), "public/icons/aws");

// slug → relative SVG path inside Architecture-Service-Icons_04302026/
const ICON_MAP: Record<string, string> = {
  // Compute
  ec2: "Arch_Compute/64/Arch_Amazon-EC2_64.svg",
  lambda: "Arch_Compute/64/Arch_AWS-Lambda_64.svg",
  "elastic-beanstalk": "Arch_Compute/64/Arch_AWS-Elastic-Beanstalk_64.svg",
  lightsail: "Arch_Compute/64/Arch_Amazon-Lightsail_64.svg",
  fargate: "Arch_Containers/64/Arch_AWS-Fargate_64.svg",
  batch: "Arch_Compute/64/Arch_AWS-Batch_64.svg",
  // Container
  ecs: "Arch_Containers/64/Arch_Amazon-Elastic-Container-Service_64.svg",
  eks: "Arch_Containers/64/Arch_Amazon-Elastic-Kubernetes-Service_64.svg",
  // Storage
  s3: "Arch_Storage/64/Arch_Amazon-Simple-Storage-Service_64.svg",
  "s3-glacier": "Arch_Storage/64/Arch_Amazon-Simple-Storage-Service-Glacier_64.svg",
  ebs: "Arch_Storage/64/Arch_Amazon-Elastic-Block-Store_64.svg",
  efs: "Arch_Storage/64/Arch_Amazon-EFS_64.svg",
  "storage-gateway": "Arch_Storage/64/Arch_AWS-Storage-Gateway_64.svg",
  // Database
  rds: "Arch_Databases/64/Arch_Amazon-RDS_64.svg",
  dynamodb: "Arch_Databases/64/Arch_Amazon-DynamoDB_64.svg",
  aurora: "Arch_Databases/64/Arch_Amazon-Aurora_64.svg",
  elasticache: "Arch_Databases/64/Arch_Amazon-ElastiCache_64.svg",
  redshift: "Arch_Analytics/64/Arch_Amazon-Redshift_64.svg",
  // Networking
  vpc: "Arch_Networking-Content-Delivery/64/Arch_Amazon-Virtual-Private-Cloud_64.svg",
  cloudfront: "Arch_Networking-Content-Delivery/64/Arch_Amazon-CloudFront_64.svg",
  route53: "Arch_Networking-Content-Delivery/64/Arch_Amazon-Route-53_64.svg",
  "api-gateway": "Arch_Networking-Content-Delivery/64/Arch_Amazon-API-Gateway_64.svg",
  elb: "Arch_Networking-Content-Delivery/64/Arch_Elastic-Load-Balancing_64.svg",
  "direct-connect": "Arch_Networking-Content-Delivery/64/Arch_AWS-Direct-Connect_64.svg",
  "global-accelerator":
    "Arch_Networking-Content-Delivery/64/Arch_AWS-Global-Accelerator_64.svg",
  // Security & Identity
  iam: "Arch_Security-Identity/64/Arch_AWS-Identity-and-Access-Management_64.svg",
  cognito: "Arch_Security-Identity/64/Arch_Amazon-Cognito_64.svg",
  kms: "Arch_Security-Identity/64/Arch_AWS-Key-Management-Service_64.svg",
  "secrets-manager":
    "Arch_Security-Identity/64/Arch_AWS-Secrets-Manager_64.svg",
  guardduty: "Arch_Security-Identity/64/Arch_Amazon-GuardDuty_64.svg",
  shield: "Arch_Security-Identity/64/Arch_AWS-Shield_64.svg",
  waf: "Arch_Security-Identity/64/Arch_AWS-WAF_64.svg",
  inspector: "Arch_Security-Identity/64/Arch_Amazon-Inspector_64.svg",
  macie: "Arch_Security-Identity/64/Arch_Amazon-Macie_64.svg",
  // Monitoring & Management
  cloudwatch: "Arch_Management-Tools/64/Arch_Amazon-CloudWatch_64.svg",
  cloudtrail: "Arch_Management-Tools/64/Arch_AWS-CloudTrail_64.svg",
  config: "Arch_Management-Tools/64/Arch_AWS-Config_64.svg",
  "systems-manager": "Arch_Management-Tools/64/Arch_AWS-Systems-Manager_64.svg",
  "trusted-advisor": "Arch_Management-Tools/64/Arch_AWS-Trusted-Advisor_64.svg",
  organizations: "Arch_Management-Tools/64/Arch_AWS-Organizations_64.svg",
  "control-tower": "Arch_Management-Tools/64/Arch_AWS-Control-Tower_64.svg",
  "health-dashboard": "Arch_Management-Tools/64/Arch_AWS-Health-Dashboard_64.svg",
  // Application Integration
  sns: "Arch_Application-Integration/64/Arch_Amazon-Simple-Notification-Service_64.svg",
  sqs: "Arch_Application-Integration/64/Arch_Amazon-Simple-Queue-Service_64.svg",
  eventbridge: "Arch_Application-Integration/64/Arch_Amazon-EventBridge_64.svg",
  "step-functions": "Arch_Application-Integration/64/Arch_AWS-Step-Functions_64.svg",
  // Analytics & AI
  athena: "Arch_Analytics/64/Arch_Amazon-Athena_64.svg",
  // Q1 2026 package ships QuickSight as "Arch_Amazon-Quick_64.svg" (filename
  // appears truncated upstream; verified by category + size).
  quicksight: "Arch_Business-Applications/64/Arch_Amazon-Quick_64.svg",
  kinesis: "Arch_Analytics/64/Arch_Amazon-Kinesis_64.svg",
  glue: "Arch_Analytics/64/Arch_AWS-Glue_64.svg",
  sagemaker: "Arch_Analytics/64/Arch_Amazon-SageMaker_64.svg",
  // Developer Tools / IaC
  cloudformation: "Arch_Management-Tools/64/Arch_AWS-CloudFormation_64.svg",
  codepipeline: "Arch_Developer-Tools/64/Arch_AWS-CodePipeline_64.svg",
  // Migration — Snow Family represented by Snowball icon
  "snow-family": "Arch_Storage/64/Arch_AWS-Snowball_64.svg",
  // Billing & Support
  "cost-explorer": "Arch_Cloud-Financial-Management/64/Arch_AWS-Cost-Explorer_64.svg",
  budgets: "Arch_Cloud-Financial-Management/64/Arch_AWS-Budgets_64.svg",
  // pricing-calculator: not shipped in Q1 2026 package; UI fallback only
  support: "Arch_Customer-Enablement/64/Arch_AWS-Support_64.svg",
};

function download() {
  if (existsSync(ZIP_PATH)) {
    console.log(`✓ ZIP already at ${ZIP_PATH}`);
    return;
  }
  console.log(`↓ Downloading ${ICON_ZIP_URL}`);
  execSync(`curl -sL -o ${ZIP_PATH} "${ICON_ZIP_URL}"`, { stdio: "inherit" });
}

function unzip() {
  if (existsSync(ARCH_ROOT)) {
    console.log(`✓ Already extracted at ${TMP_DIR}`);
    return;
  }
  mkdirSync(TMP_DIR, { recursive: true });
  console.log(`↻ Unzipping to ${TMP_DIR}`);
  execSync(`unzip -q -o ${ZIP_PATH} -d ${TMP_DIR}`, { stdio: "inherit" });
}

function resolveArchRoot(): string {
  // Pick the Architecture-Service-Icons_* folder regardless of date suffix
  // (only one such folder exists in the package).
  if (existsSync(ARCH_ROOT)) return ARCH_ROOT;
  const dir = readdirSync(TMP_DIR).find((d) =>
    d.startsWith("Architecture-Service-Icons_"),
  );
  if (!dir) throw new Error("Architecture-Service-Icons_ folder not found");
  return join(TMP_DIR, dir);
}

function copyIcons() {
  mkdirSync(OUT_DIR, { recursive: true });
  const root = resolveArchRoot();
  const missing: string[] = [];
  let copied = 0;
  for (const [slug, rel] of Object.entries(ICON_MAP)) {
    const src = join(root, rel);
    const dst = join(OUT_DIR, `${slug}.svg`);
    if (!existsSync(src)) {
      missing.push(`${slug} ← ${rel}`);
      continue;
    }
    copyFileSync(src, dst);
    copied++;
  }
  const manifest = Object.keys(ICON_MAP).sort();
  writeFileSync(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    `✓ Copied ${copied}/${Object.keys(ICON_MAP).length} icons to ${OUT_DIR}`,
  );
  if (missing.length) {
    console.warn(`✗ Missing (${missing.length}):`);
    for (const m of missing) console.warn(`  - ${m}`);
  }
}

download();
unzip();
copyIcons();
