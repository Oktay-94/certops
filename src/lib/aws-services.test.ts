import { describe, expect, it } from "vitest";
import { AWS_SERVICES, matchServices } from "./aws-services";

describe("matchServices", () => {
  it("returns empty array for empty/no-match text", () => {
    expect(matchServices("")).toEqual([]);
    expect(matchServices("nothing relevant here")).toEqual([]);
  });

  it("matches a single service", () => {
    expect(matchServices("Was ist EC2?")).toEqual(["ec2"]);
  });

  it("prefers the longest alias: 'S3 Glacier' wins over 'S3'", () => {
    expect(matchServices("S3 Glacier ist günstig.")).toEqual(["s3-glacier"]);
  });

  it("returns multiple services in first-occurrence order", () => {
    expect(matchServices("Lambda kann SNS triggern.")).toEqual([
      "lambda",
      "sns",
    ]);
    expect(matchServices("SNS und Lambda zusammen.")).toEqual([
      "sns",
      "lambda",
    ]);
  });

  it("caps at max=2 even when more match", () => {
    const slugs = matchServices("EC2, Lambda und S3 zusammen.");
    expect(slugs).toHaveLength(2);
    expect(slugs).toEqual(["ec2", "lambda"]);
  });

  it("respects custom max", () => {
    expect(matchServices("EC2, Lambda, S3", 3)).toEqual([
      "ec2",
      "lambda",
      "s3",
    ]);
  });

  it("deduplicates repeated matches", () => {
    expect(matchServices("S3 und nochmal S3 und EC2")).toEqual(["s3", "ec2"]);
  });

  it("uses word boundaries: 'S3-Bucket' matches, 'EC22' does not", () => {
    expect(matchServices("Ein S3-Bucket")).toEqual(["s3"]);
    expect(matchServices("EC22 is not a service")).toEqual([]);
  });

  it("case-sensitive — lowercase 's3' does not match", () => {
    expect(matchServices("kleines s3 ohne Großbuchstaben")).toEqual([]);
  });

  it("requires AWS/Amazon prefix for generic words", () => {
    // "Config" alone is too generic; only "AWS Config" maps to config slug
    expect(matchServices("server config is wrong")).toEqual([]);
    expect(matchServices("AWS Config Rules")).toEqual(["config"]);
  });

  it("matches both 'Route 53' and 'Route53'", () => {
    expect(matchServices("DNS via Route 53")).toEqual(["route53"]);
    expect(matchServices("DNS via Route53")).toEqual(["route53"]);
  });
});

describe("AWS_SERVICES registry", () => {
  it("has unique slugs", () => {
    const slugs = AWS_SERVICES.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses lowercase-kebab slugs without aws-/amazon- prefix", () => {
    for (const s of AWS_SERVICES) {
      expect(s.slug).toMatch(/^[a-z0-9-]+$/);
      expect(s.slug.startsWith("aws-")).toBe(false);
      expect(s.slug.startsWith("amazon-")).toBe(false);
    }
  });
});
