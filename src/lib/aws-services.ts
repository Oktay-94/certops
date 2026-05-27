export type AwsService = {
  slug: string;
  displayName: string;
  aliases: string[];
};

// Aliases are matched case-sensitive with word boundaries (\bALIAS\b).
// At match-time aliases across all services are sorted longest-first
// so "S3 Glacier" wins over "S3" inside "S3 Glacier".
// Be conservative with generic English words (Config, Support, Shield, …):
// require the "AWS"/"Amazon" prefix for those.
export const AWS_SERVICES: AwsService[] = [
  // ── Compute
  { slug: "ec2", displayName: "Amazon EC2",
    aliases: ["Elastic Compute Cloud", "Amazon EC2", "EC2"] },
  { slug: "lambda", displayName: "AWS Lambda",
    aliases: ["AWS Lambda", "Lambda"] },
  { slug: "elastic-beanstalk", displayName: "AWS Elastic Beanstalk",
    aliases: ["Elastic Beanstalk", "Beanstalk"] },
  { slug: "lightsail", displayName: "Amazon Lightsail",
    aliases: ["Amazon Lightsail", "Lightsail"] },
  { slug: "batch", displayName: "AWS Batch",
    aliases: ["AWS Batch"] },
  { slug: "auto-scaling", displayName: "AWS Auto Scaling",
    aliases: ["EC2 Auto Scaling", "Auto Scaling Group", "Auto Scaling"] },
  { slug: "outposts", displayName: "AWS Outposts",
    aliases: ["AWS Outposts", "Outposts"] },

  // ── Container
  { slug: "ecs", displayName: "Amazon ECS",
    aliases: ["Elastic Container Service", "Amazon ECS", "ECS"] },
  { slug: "eks", displayName: "Amazon EKS",
    aliases: ["Elastic Kubernetes Service", "Amazon EKS", "EKS"] },
  { slug: "fargate", displayName: "AWS Fargate",
    aliases: ["AWS Fargate", "Fargate"] },

  // ── Storage
  { slug: "s3-glacier", displayName: "Amazon S3 Glacier",
    aliases: ["S3 Glacier", "Glacier"] },
  { slug: "s3", displayName: "Amazon S3",
    aliases: ["Amazon S3", "S3"] },
  { slug: "ebs", displayName: "Amazon EBS",
    aliases: ["Elastic Block Store", "Amazon EBS", "EBS"] },
  { slug: "efs", displayName: "Amazon EFS",
    aliases: ["Elastic File System", "Amazon EFS", "EFS"] },
  { slug: "storage-gateway", displayName: "AWS Storage Gateway",
    aliases: ["Storage Gateway"] },

  // ── Database
  { slug: "rds", displayName: "Amazon RDS",
    aliases: ["Relational Database Service", "Amazon RDS", "RDS"] },
  { slug: "dynamodb", displayName: "Amazon DynamoDB",
    aliases: ["Amazon DynamoDB", "DynamoDB"] },
  { slug: "aurora", displayName: "Amazon Aurora",
    aliases: ["Amazon Aurora", "Aurora"] },
  { slug: "elasticache", displayName: "Amazon ElastiCache",
    aliases: ["Amazon ElastiCache", "ElastiCache"] },
  { slug: "redshift", displayName: "Amazon Redshift",
    aliases: ["Amazon Redshift", "Redshift"] },

  // ── Networking
  { slug: "vpc", displayName: "Amazon VPC",
    aliases: ["Virtual Private Cloud", "Amazon VPC", "VPC"] },
  { slug: "cloudfront", displayName: "Amazon CloudFront",
    aliases: ["Amazon CloudFront", "CloudFront"] },
  { slug: "route53", displayName: "Amazon Route 53",
    aliases: ["Amazon Route 53", "Route 53", "Route53"] },
  { slug: "api-gateway", displayName: "Amazon API Gateway",
    aliases: ["Amazon API Gateway", "API Gateway"] },
  { slug: "elb", displayName: "Elastic Load Balancing",
    aliases: ["Elastic Load Balancing", "Elastic Load Balancer", "ELB"] },
  { slug: "direct-connect", displayName: "AWS Direct Connect",
    aliases: ["Direct Connect"] },
  { slug: "global-accelerator", displayName: "AWS Global Accelerator",
    aliases: ["Global Accelerator"] },

  // ── Security & Identity
  { slug: "iam", displayName: "AWS IAM",
    aliases: ["Identity and Access Management", "AWS IAM", "IAM"] },
  { slug: "cognito", displayName: "Amazon Cognito",
    aliases: ["Amazon Cognito", "Cognito"] },
  { slug: "kms", displayName: "AWS KMS",
    aliases: ["Key Management Service", "AWS KMS", "KMS"] },
  { slug: "secrets-manager", displayName: "AWS Secrets Manager",
    aliases: ["Secrets Manager"] },
  { slug: "guardduty", displayName: "Amazon GuardDuty",
    aliases: ["Amazon GuardDuty", "GuardDuty"] },
  { slug: "shield", displayName: "AWS Shield",
    aliases: ["AWS Shield"] },
  { slug: "waf", displayName: "AWS WAF",
    aliases: ["AWS WAF", "WAF"] },
  { slug: "inspector", displayName: "Amazon Inspector",
    aliases: ["Amazon Inspector"] },
  { slug: "macie", displayName: "Amazon Macie",
    aliases: ["Amazon Macie", "Macie"] },
  { slug: "artifact", displayName: "AWS Artifact",
    aliases: ["AWS Artifact"] },

  // ── Monitoring & Management
  { slug: "cloudwatch", displayName: "Amazon CloudWatch",
    aliases: ["Amazon CloudWatch", "CloudWatch"] },
  { slug: "cloudtrail", displayName: "AWS CloudTrail",
    aliases: ["AWS CloudTrail", "CloudTrail"] },
  { slug: "config", displayName: "AWS Config",
    aliases: ["AWS Config"] },
  { slug: "systems-manager", displayName: "AWS Systems Manager",
    aliases: ["Systems Manager", "SSM"] },
  { slug: "trusted-advisor", displayName: "AWS Trusted Advisor",
    aliases: ["Trusted Advisor"] },
  { slug: "organizations", displayName: "AWS Organizations",
    aliases: ["AWS Organizations"] },
  { slug: "control-tower", displayName: "AWS Control Tower",
    aliases: ["Control Tower"] },
  { slug: "health-dashboard", displayName: "AWS Health Dashboard",
    aliases: ["Personal Health Dashboard", "AWS Health Dashboard", "Health Dashboard"] },

  // ── Application Integration
  { slug: "sns", displayName: "Amazon SNS",
    aliases: ["Simple Notification Service", "Amazon SNS", "SNS"] },
  { slug: "sqs", displayName: "Amazon SQS",
    aliases: ["Simple Queue Service", "Amazon SQS", "SQS"] },
  { slug: "eventbridge", displayName: "Amazon EventBridge",
    aliases: ["Amazon EventBridge", "EventBridge"] },
  { slug: "step-functions", displayName: "AWS Step Functions",
    aliases: ["Step Functions"] },

  // ── Analytics & AI
  { slug: "athena", displayName: "Amazon Athena",
    aliases: ["Amazon Athena", "Athena"] },
  { slug: "quicksight", displayName: "Amazon QuickSight",
    aliases: ["Amazon QuickSight", "QuickSight"] },
  { slug: "kinesis", displayName: "Amazon Kinesis",
    aliases: ["Amazon Kinesis", "Kinesis"] },
  { slug: "glue", displayName: "AWS Glue",
    aliases: ["AWS Glue"] },
  { slug: "sagemaker", displayName: "Amazon SageMaker",
    aliases: ["Amazon SageMaker", "SageMaker"] },

  // ── Developer Tools / IaC
  { slug: "cloudformation", displayName: "AWS CloudFormation",
    aliases: ["AWS CloudFormation", "CloudFormation"] },
  { slug: "codepipeline", displayName: "AWS CodePipeline",
    aliases: ["AWS CodePipeline", "CodePipeline"] },

  // ── Migration
  { slug: "snow-family", displayName: "AWS Snow Family",
    aliases: ["Snow Family", "Snowball", "Snowmobile", "Snowcone"] },

  // ── Billing & Support
  { slug: "cost-explorer", displayName: "AWS Cost Explorer",
    aliases: ["Cost Explorer"] },
  { slug: "budgets", displayName: "AWS Budgets",
    aliases: ["AWS Budgets"] },
  { slug: "pricing-calculator", displayName: "AWS Pricing Calculator",
    aliases: ["Pricing Calculator"] },
  { slug: "support", displayName: "AWS Support",
    aliases: ["AWS Support"] },
];

const SLUG_BY_ALIAS: { alias: string; slug: string; regex: RegExp }[] =
  AWS_SERVICES.flatMap((s) =>
    s.aliases.map((alias) => ({
      alias,
      slug: s.slug,
      regex: new RegExp(`\\b${escapeRegex(alias)}\\b`, "g"),
    })),
  ).sort((a, b) => b.alias.length - a.alias.length);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find AWS service slugs mentioned in `text`. Returns at most `max` slugs,
 * deduplicated, in order of first occurrence in the text. Longest alias wins
 * when multiple aliases overlap (e.g. "S3 Glacier" → s3-glacier, not s3).
 */
export function matchServices(text: string, max = 2): string[] {
  if (!text) return [];

  // Track [position, slug] for each first hit; longest-first iteration means
  // a longer alias claims its span before a shorter one can match it.
  const claimed: Array<{ start: number; end: number; slug: string }> = [];

  for (const { regex, slug } of SLUG_BY_ALIAS) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      const overlaps = claimed.some((c) => start < c.end && end > c.start);
      if (!overlaps) claimed.push({ start, end, slug });
    }
  }

  claimed.sort((a, b) => a.start - b.start);
  const out: string[] = [];
  for (const c of claimed) {
    if (!out.includes(c.slug)) out.push(c.slug);
    if (out.length >= max) break;
  }
  return out;
}
