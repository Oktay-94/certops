#!/usr/bin/env python3
"""Guard-Tests nach NARRATIVE-SPEC v1 §7, plus Laengenpruefung.
Reine Dateipruefung, keine Mocks."""
import re
import sys
import pathlib

PFLICHT_H2 = [
    "Die Grundidee zuerst",
    "Was es eigentlich ist",
    "Der Weg durch die Karte",
    "Die ehrliche Feinheit",
    "Was du dadurch nicht baust",
    "Wenn du dir eine Sache merkst",
    "Prüfungsknackpunkte",
]
KANON = [
    "Die Grundidee zuerst",
    "Was es eigentlich ist",
    "Der Weg durch die Karte",
    "Die entscheidende Unterscheidung",
    "Die ehrliche Feinheit",
    "Syntax lesen",
    "Was du dadurch nicht baust",
    "Wenn du dir eine Sache merkst",
    "Prüfungsknackpunkte",
]
# correctAnswer bewusst ausgelassen (kein Aufgaben-Track), Batch-Entscheidung 28.07.
PFLICHTFELDER = ["cardNumber", "slug", "title", "services", "domains",
                 "badgeCount", "narrativeVersion", "factCheckedAt", "sources"]

# Slugs aus Narrativ-Batch 01
BELEGTE_SLUGS = {
    # Batch 01
    "serverless-rest-api-ticketwave",
    "ecs-fargate-shopflow-container",
    "ec2-auto-scaling-dailydeals-tageszyklus",
    # Batch 02 (nachgetragen 28.07., HANDOFF-NARRATIVE-02 §3)
    "lambda-snapstart-payfast-coldstart",
    "app-runner-ecr-container-ohne-infra",
    "eks-karpenter-spot-nodepools",
    # Batch 03 (nachgetragen 29.07., HANDOFF-NARRATIVE-03 §3)
    "lambda-sqs-dlq-bestellungen-entkoppeln",
    "elastic-beanstalk-rds-lebenszyklus-trennen",
    "outposts-local-zones-werkslatenz",
    # Batch 04 (nachgetragen 29.07., HANDOFF-NARRATIVE-04 §3)
    "batch-ec2-gpu-spot-naechtliches-rendering",
    "s3-lifecycle-glacier-deep-archive-rechnungsarchiv",
    "s3-intelligent-tiering-unbekanntes-zugriffsmuster",
    # Batch 05 (nachgetragen 29.07., HANDOFF-NARRATIVE-05 §3)
    "efs-mount-targets-nordpresse-cms-multi-az",
    "fsx-windows-active-directory-bergmann-fileserver",
    "s3-object-lock-compliance-mfa-delete-ransomware",
    # Batch 06 (nachgetragen 29.07. in Batch 08, aus HANDOFF-NARRATIVE-06 §3)
    "s3-file-gateway-nordwerk-cad-netzlaufwerk",
    "snowball-edge-landesmedienarchiv-500tb-migration",
    "s3-transfer-acceleration-multipart-cinelab-upload",
    # Batch 07 (nachgetragen 29.07., HANDOFF-NARRATIVE-07 §3)
    "ebs-gp3-io2-block-express-fsr-payflow",
    "s3-access-points-vpc-endpoints-helios-datalake",
    "dynamodb-dax-nova-arena-leaderboard",
    # Batch 08 (nachgetragen 29.07., HANDOFF-NARRATIVE-08 §3)
    "rds-multi-az-read-replica-nordlicht-schadenbearbeitung",
    "aurora-serverless-v2-scale-to-zero-helix-devtest",
    "elasticache-cache-aside-bergmann-produktkatalog",
    # Batch 09 (nachgetragen 30.07., HANDOFF-NARRATIVE-09 §3)
    "dynamodb-global-tables-kestrel-multi-active",
    "neptune-analytics-falkenbank-betrugsring-traversal",
    "timestream-liveanalytics-influxdb-nordwerk-zeitreihen",
    # Batch 10 (nachgetragen 30.07., HANDOFF-NARRATIVE-10 §3)
    "rds-proxy-lambda-almhof-verbindungspool",
    "documentdb-dms-wildbach-mongodb-lift-and-shift",
    "qldb-aurora-object-lock-rheinkontor-verifizierbare-historie",
    # Batch 11 (nachgetragen 30.07., HANDOFF-NARRATIVE-11 §3)
    "vpc-peering-transit-gateway-hansa-fracht-full-mesh",
    "site-to-site-vpn-direct-connect-hansa-fracht-nachtreplikation",
    "privatelink-endpoint-service-telemetrik24-saas-multi-tenant",
    # Batch 12 (nachgetragen 30.07., HANDOFF-NARRATIVE-12 §3)
    "nat-gateway-vpc-endpoints-nordlicht-analytics-kostenschwelle",
    "global-accelerator-cloudfront-kartenwerk-udp-anycast-backbone",
    "route53-routing-policies-vermeer-legal-vier-record-ebenen",
    # Batch 13 (nachgetragen 11.08. in Batch 14, HANDOFF-13 §3)
    "cloudfront-s3-oac-nordwind-robotics-privater-bucket",
    "network-firewall-egress-halden-pharma-domain-allowlist",
    "aurora-global-database-kestrel-payments-switchover-failover",
    # Batch 14 (nachgetragen 11.08. in Batch 15, HANDOFF-14 §3)
    "athena-glue-s3-data-lake-falkendorf-telematik-speicherlayout",
    "iam-roles-sts-instance-profile-talheim-spedition-ohne-access-keys",
    "cognito-user-pool-identity-pool-formkurve-eigener-prefix",
    # Batch 15 (nachgetragen 11.08. in Batch 16, HANDOFF-15 §3)
    "kms-envelope-encryption-sse-kms-dreiburg-klinikverbund-patientenakten",
    "secrets-manager-parameter-store-ankerstein-rotation-gegen-konfiguration",
    "guardduty-security-hub-cspm-eventbridge-skontro-zentrale-erkennung",
    # Batch 16 (nachgetragen 11.08. in Batch 17, HANDOFF-16 §3)
    "inspector-ecr-enhanced-scanning-weissdorn-finanz-cve-nach-dem-push",
    "macie-automated-discovery-targeted-job-immenried-versicherung-sampling-vor-vollscan",
    "iam-identity-center-permission-sets-uhlenbrook-maschinenbau-eine-identitaet-dreissig-accounts",
    # Batch 17 Teil 1 (nachgetragen 11.08. in Batch 17 Teil 2, HANDOFF-17 §3)
    "cloudtrail-organization-trail-athena-partition-projection-eichkamp-energie-forensik-nach-vier-monaten",
    # Batch 17 Teil 2 (nachgetragen 11.08. in Batch 18, HANDOFF-18 §3)
    "waf-bot-control-challenge-captcha-ostwall-sneaker-drop-scalper",
    "kinesis-data-streams-sqs-replay-kirnau-clickstream-drei-konsumenten",
    # Karten 52, 54-100 (nachgetragen 12.08. bei der Narrative-Integration).
    # Diese 48 Narrative entstanden in Chats ohne eigenen HANDOFF im Repo -
    # HANDOFF-19 war ein Pruef-Chat und hat kein Narrativ geschrieben. Darum
    # ein Sammel-Label statt erfundener Batch-Nummern.
    "firehose-s3-athena-logistik-datalake",
    "opensearch-dashboards-bank-correlation-id",
    "msk-kafka-zulieferer-bestehende-clients",
    "quicksight-spice-rls-embedding",
    "glue-etl-job-bookmark-parquet",
    "lake-formation-lf-tags-data-filters",
    "flink-sliding-window-betrugsmuster",
    "redshift-serverless-rpu-quartalslast",
    "rekognition-a2i-bildmoderation-marktplatz",
    "textract-callback-task-token-rechnungspruefung",
    "comprehend-sentiment-custom-classification-tickets",
    "transcribe-call-analytics-translate-polly-callcenter",
    "personalize-domain-recommender-event-tracker",
    "sagemaker-canvas-timeseries-forecast-nachfolge",
    "sagemaker-training-realtime-endpoint-autoscaling",
    "bedrock-knowledge-bases-rag-chatbot",
    "kendra-maintenance-bmkb-migration",
    "waf-fraud-control-acfp-signup",
    "mgn-lift-and-shift-cutover-minuten",
    "dms-homogen-ohne-sct",
    "datasync-nfs-nach-s3-inkrementell",
    "migration-hub-application-discovery-portfolio",
    "vmware-cloud-on-aws-sddc-heben",
    "mainframe-modernization-replatform-refactor",
    "ecs-anywhere-eks-hybrid-nodes-control-plane",
    "drs-elastic-disaster-recovery-pilot-light",
    "storage-gateway-tape-volume-vtl",
    "sieben-r-migrationsstrategien",
    "multi-az-gegen-multi-region",
    "aws-backup-vault-lock-zentral",
    "dr-muster-pilot-light-warm-standby-active-active",
    "route53-health-checks-dns-failover",
    "savings-plans-reserved-instances-spot-kaufoptionen",
    "cost-explorer-budgets-anomaly-detection",
    "compute-optimizer-rightsizing",
    "fis-chaos-engineering-az-ausfall",
    "sqs-idempotenz-retry-patterns",
    "well-architected-review-milestones",
    "iot-core-rules-engine-dynamodb",
    "greengrass-v2-inferenz-am-edge",
    "mediaconvert-vod-kette-cloudfront",
    "ivs-live-streaming-ohne-eigene-infra",
    "appsync-graphql-viele-ansichten",
    "step-functions-express-gegen-standard",
    "eventbridge-scheduler-einmal-timer",
    "amplify-hosting-pr-preview",
    "device-farm-echte-geraete",
    "ram-shared-subnets-multi-account",
}
BELEGTE_NUMMERN = {1: "Batch 01", 2: "Batch 01", 3: "Batch 01",
                   4: "Batch 02", 5: "Batch 02", 6: "Batch 02",
                   7: "Batch 03", 8: "Batch 03", 9: "Batch 03",
                   10: "Batch 04", 11: "Batch 04", 12: "Batch 04",
                   13: "Batch 05", 14: "Batch 05", 15: "Batch 05",
                   16: "Batch 06", 17: "Batch 06", 18: "Batch 06",
                   # nachgetragen 29.07. in Batch 08: Batch 07 hatte die
                   # eigenen Nummern nicht ergaenzt (HANDOFF-07 §3 nennt nur 16-18)
                   19: "Batch 07", 20: "Batch 07", 21: "Batch 07",
                   # nachgetragen 29.07. in Batch 09 (HANDOFF-08 §2.4:
                   # Slugs UND Nummern des Vorbatches, beides, immer)
                   22: "Batch 08", 23: "Batch 08", 24: "Batch 08",
                   # nachgetragen 30.07. in Batch 10 (HANDOFF-09 §3)
                   25: "Batch 09", 26: "Batch 09", 27: "Batch 09",
                   # nachgetragen 30.07. in Batch 11 (HANDOFF-10 §3)
                   28: "Batch 10", 29: "Batch 10", 30: "Batch 10",
                   # nachgetragen 30.07. in Batch 12 (HANDOFF-11 §3)
                   31: "Batch 11", 32: "Batch 11", 33: "Batch 11",
                   # nachgetragen 30.07. in Batch 13 (HANDOFF-12 §3)
                   34: "Batch 12", 35: "Batch 12", 36: "Batch 12",
                   # nachgetragen 11.08. in Batch 14 (HANDOFF-13 §3)
                   37: "Batch 13", 38: "Batch 13", 39: "Batch 13",
                   # nachgetragen 11.08. in Batch 15 (HANDOFF-14 §3)
                   40: "Batch 14", 41: "Batch 14", 42: "Batch 14",
                   # nachgetragen 11.08. in Batch 16 (HANDOFF-15 §3)
                   43: "Batch 15", 44: "Batch 15", 45: "Batch 15",
                   # nachgetragen 11.08. in Batch 17 (HANDOFF-16 §3)
                   46: "Batch 16", 47: "Batch 16", 48: "Batch 16",
                   # nachgetragen 11.08. in Batch 17 Teil 2 (HANDOFF-17 §3)
                   49: "Batch 17",
                   # nachgetragen 11.08. in Batch 18 (HANDOFF-18 §3)
                   50: "Batch 17", 51: "Batch 17",
                   # nachgetragen 12.08. bei der Narrative-Integration.
                   # 53 bleibt bewusst frei: die Karte ist geplant (IPv6,
                   # Egress-only IGW), aber nicht gezeichnet.
                   **{n: "Narrative-Integration"
                      for n in [52] + list(range(54, 101))}}

befunde = []
gesehene_slugs = {s: "frueherer Batch" for s in BELEGTE_SLUGS}
gesehene_nummern = dict(BELEGTE_NUMMERN)


def frontmatter_und_body(text, datei):
    if not text.startswith("---\n"):
        befunde.append(f"{datei}: kein Frontmatter am Dateianfang")
        return {}, text
    ende = text.index("\n---\n", 3)
    roh = text[4:ende]
    body = text[ende + 5:]
    fm, key = {}, None
    for zeile in roh.split("\n"):
        if not zeile.strip():
            continue
        if zeile.startswith("  - "):
            fm.setdefault(key, [])
            if isinstance(fm[key], list):
                fm[key].append(zeile[4:].strip().strip('"'))
            continue
        m = re.match(r"^([A-Za-z]\w*):\s*(.*)$", zeile)
        if m:
            key, wert = m.group(1), m.group(2).strip()
            fm[key] = wert if wert else []
    return fm, body


for pfad in sorted(pathlib.Path(".").glob("card-*-narrative.md")):
    datei = pfad.name
    text = pfad.read_text(encoding="utf-8")
    fm, body = frontmatter_und_body(text, datei)

    # 1 Pflichtfelder
    for feld in PFLICHTFELDER:
        if feld not in fm or fm[feld] in ("", []):
            befunde.append(f"{datei}: Pflichtfeld '{feld}' fehlt oder leer")

    # 2 cardNumber 1-100, kollisionsfrei
    try:
        nr = int(fm.get("cardNumber", "0"))
    except ValueError:
        nr = 0
    if not 1 <= nr <= 100:
        befunde.append(f"{datei}: cardNumber {nr} nicht in 1..100")
    if nr in gesehene_nummern:
        befunde.append(f"{datei}: cardNumber {nr} kollidiert mit {gesehene_nummern[nr]}")
    gesehene_nummern[nr] = datei

    # 3 slug eindeutig
    slug = fm.get("slug", "")
    if slug in gesehene_slugs:
        befunde.append(f"{datei}: slug '{slug}' kollidiert mit {gesehene_slugs[slug]}")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug or ""):
        befunde.append(f"{datei}: slug '{slug}' nicht kleingeschrieben/kebab-case")
    gesehene_slugs[slug] = datei

    # 5 keine H1 im Body
    if re.search(r"^# ", body, re.M):
        befunde.append(f"{datei}: H1 im Body gefunden")

    # 4 Pflicht-H2 vorhanden, kanonische Reihenfolge
    h2_roh = re.findall(r"^## (.+)$", body, re.M)
    h2 = [h.split(" — ")[0].strip() for h in h2_roh]
    for pflicht in PFLICHT_H2:
        if pflicht not in h2:
            befunde.append(f"{datei}: Pflicht-H2 '{pflicht}' fehlt")
    idx = [KANON.index(h) for h in h2 if h in KANON]
    if idx != sorted(idx):
        befunde.append(f"{datei}: H2-Reihenfolge nicht kanonisch: {h2}")
    unbekannt = [h for h in h2 if h not in KANON]
    if unbekannt:
        befunde.append(f"{datei}: unbekannte H2: {unbekannt}")

    # 6 kein Abschnitt leer
    teile = re.split(r"^## .+$", body, flags=re.M)[1:]
    for name, inhalt in zip(h2, teile):
        if len(inhalt.strip()) < 40:
            befunde.append(f"{datei}: Abschnitt '{name}' faktisch leer")

    # 7 H3-Anzahl unter 'Der Weg durch die Karte' >= badgeCount
    try:
        badges = int(fm.get("badgeCount", "0"))
    except ValueError:
        badges = 0
    weg = teile[h2.index("Der Weg durch die Karte")] if "Der Weg durch die Karte" in h2 else ""
    h3 = re.findall(r"^### ", weg, re.M)
    if len(h3) < badges:
        befunde.append(f"{datei}: {len(h3)} H3 < badgeCount {badges}")

    # 8 factCheckedAt + sources mit AWS-Primaerquelle
    if not re.fullmatch(r'"?\d{4}-\d{2}-\d{2}"?', fm.get("factCheckedAt", "")):
        befunde.append(f"{datei}: factCheckedAt kein ISO-Datum")
    quellen = fm.get("sources", [])
    if not any("docs.aws.amazon.com" in q or "aws.amazon.com" in q for q in quellen):
        befunde.append(f"{datei}: keine AWS-Primaerquelle in sources")

    # Laenge
    # 9 Laenge: Spec v1.1 §4 setzt 2200-2500 verbindlich (Oktay, 29.07.)
    worte = len(re.findall(r"\S+", body))
    if not 2200 <= worte <= 2500:
        befunde.append(f"{datei}: {worte} Woerter ausserhalb 2200-2500 (Spec v1.1 §4)")
    marke = "im Korridor" if 2200 <= worte <= 2500 else "ausserhalb 2200-2500"
    print(f"{datei}: {worte} Woerter ({marke}) · H2 {len(h2)} · "
          f"H3 im Weg {len(h3)}/{badges} · sources {len(quellen)}")

print()
if befunde:
    print(f"BEFUNDE: {len(befunde)}")
    for b in befunde:
        print(" -", b)
    sys.exit(1)
print("Guard-Tests §7: 0 Befunde")
