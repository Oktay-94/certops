"""Auflösung von Kurznamen auf die gevendorten AWS-Architecture-Icons.

Kurznamen sind stabil, Dateinamen nicht: AWS benennt Icons zwischen den
Quartalsreleases gelegentlich um. Die Specs referenzieren deshalb nur
Kurznamen, und diese Datei ist die einzige Stelle, die Dateinamen kennt.
"""
import os
import re

ICON_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         "vendor", "aws-icons")

# Handverlesene Kurznamen für die Dienste, die in den Szenarien häufig vorkommen.
ALIASES = {
    # Compute
    "lambda": "architecture-service/AWSLambda.svg",
    "lambda-function": "resource/AWSLambdaLambdaFunction.svg",
    "ec2": "architecture-service/AmazonEC2.svg",
    "fargate": "architecture-service/AWSFargate.svg",
    "ecs": "architecture-service/AmazonElasticContainerService.svg",
    "eks": "architecture-service/AmazonElasticKubernetesService.svg",
    # Storage
    "s3": "architecture-service/AmazonSimpleStorageService.svg",
    "s3-bucket": "resource/AmazonSimpleStorageServiceBucket.svg",
    "efs": "architecture-service/AmazonEFS.svg",
    "ebs": "architecture-service/AmazonElasticBlockStore.svg",
    "snowball": "architecture-service/AWSSnowball.svg",
    "backup": "architecture-service/AWSBackup.svg",
    # Datenbanken
    "dynamodb": "architecture-service/AmazonDynamoDB.svg",
    "rds": "architecture-service/AmazonRDS.svg",
    "aurora": "architecture-service/AmazonAurora.svg",
    "elasticache": "architecture-service/AmazonElastiCache.svg",
    "redshift": "architecture-service/AmazonRedshift.svg",
    # Integration
    "sns": "architecture-service/AmazonSimpleNotificationService.svg",
    "sqs": "architecture-service/AmazonSimpleQueueService.svg",
    "sqs-queue": "resource/AmazonSimpleQueueServiceQueue.svg",
    "eventbridge": "architecture-service/AmazonEventBridge.svg",
    "stepfunctions": "architecture-service/AWSStepFunctions.svg",
    "apigateway": "architecture-service/AmazonAPIGateway.svg",
    "apigateway-endpoint": "resource/AmazonAPIGatewayEndpoint.svg",
    "kinesis": "architecture-service/AmazonKinesisDataStreams.svg",
    # Netzwerk
    "cloudfront": "architecture-service/AmazonCloudFront.svg",
    "route53": "architecture-service/AmazonRoute53.svg",
    "directconnect": "architecture-service/AWSDirectConnect.svg",
    "privatelink": "architecture-service/AWSPrivateLink.svg",
    "vpc": "architecture-service/AmazonVirtualPrivateCloud.svg",
    "vpc-endpoint": "resource/AmazonVPCEndpoints.svg",
    "nat-gateway": "resource/AmazonVPCNATGateway.svg",
    "internet-gateway": "resource/AmazonVPCInternetGateway.svg",
    "vpn-gateway": "resource/AmazonVPCVPNGateway.svg",
    "router": "resource/AmazonVPCRouter.svg",
    "nacl": "resource/AmazonVPCNetworkAccessControlList.svg",
    "nlb": "resource/ElasticLoadBalancingNetworkLoadBalancer.svg",
    "alb": "resource/ElasticLoadBalancingApplicationLoadBalancer.svg",
    # Sicherheit
    "iam": "architecture-service/AWSIdentityandAccessManagement.svg",
    "iam-identity-center": "architecture-service/AWSIAMIdentityCenter.svg",
    "kms": "architecture-service/AWSKeyManagementService.svg",
    "waf": "architecture-service/AWSWAF.svg",
    "shield": "architecture-service/AWSShield.svg",
    "cognito": "architecture-service/AmazonCognito.svg",
    "secretsmanager": "architecture-service/AWSSecretsManager.svg",
    "macie": "architecture-service/AmazonMacie.svg",
    "guardduty": "architecture-service/AmazonGuardDuty.svg",
    # Betrieb
    "cloudwatch": "architecture-service/AmazonCloudWatch.svg",
    "cloudtrail": "architecture-service/AWSCloudTrail.svg",
    "xray": "architecture-service/AWSXRay.svg",
    "config": "architecture-service/AWSConfig.svg",
    "cost-explorer": "architecture-service/AWSCostExplorer.svg",
    "budgets": "architecture-service/AWSBudgets.svg",
    "marketplace": "architecture-service/AWSMarketplace.svg",
    # KI und Analyse
    "kendra": "architecture-service/AmazonKendra.svg",
    "comprehend": "architecture-service/AmazonComprehend.svg",
    "textract": "architecture-service/AmazonTextract.svg",
    "rekognition": "architecture-service/AmazonRekognition.svg",
    "athena": "architecture-service/AmazonAthena.svg",
    "glue": "architecture-service/AWSGlue.svg",
    # Allgemeine Bausteine (nicht AWS)
    "users": "resource/Users.svg",
    "user": "resource/User.svg",
    "client": "resource/Client.svg",
    "server": "resource/Server.svg",
    "servers": "resource/Servers.svg",
    "firewall": "resource/Firewall.svg",
    "internet": "resource/Internet.svg",
    "documents": "resource/Documents.svg",
    "folders": "resource/Folders.svg",
    "disk": "resource/Disk.svg",
    "app": "resource/GenericApplication.svg",
    "question": "resource/Question.svg",
    "alert": "resource/Alert.svg",
    "office": "resource/Officebuilding.svg",
    # Rahmen
    "grp-cloud": "architecture-group/AWSCloud.svg",
    "grp-region": "architecture-group/Region.svg",
    "grp-vpc": "architecture-group/VirtualprivatecloudVPC.svg",
    "grp-private-subnet": "architecture-group/Privatesubnet.svg",
    "grp-public-subnet": "architecture-group/Publicsubnet.svg",
    "grp-datacenter": "architecture-group/Corporatedatacenter.svg",
    "grp-account": "architecture-group/AWSAccount.svg",
    "grp-asg": "architecture-group/AutoScalinggroup.svg",
}


def _slug(filename):
    name = os.path.splitext(os.path.basename(filename))[0]
    name = re.sub(r"(?<!^)(?=[A-Z])", "-", name)
    return re.sub(r"-+", "-", name).lower()


def _autoslugs():
    out = {}
    for folder in ("architecture-service", "resource", "architecture-group", "category"):
        d = os.path.join(ICON_ROOT, folder)
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if f.endswith(".svg"):
                out.setdefault(_slug(f), f"{folder}/{f}")
    return out


_AUTO = None


def resolve(name):
    """Kurzname -> absoluter Dateipfad. Wirft bei unbekanntem Namen."""
    global _AUTO
    rel = ALIASES.get(name)
    if rel is None:
        if _AUTO is None:
            _AUTO = _autoslugs()
        rel = _AUTO.get(name)
    if rel is None:
        raise KeyError(f"Unbekannter Icon-Kurzname: '{name}'. "
                       f"Siehe icons.ALIASES oder icons.search('teil-des-namens').")
    path = os.path.join(ICON_ROOT, rel)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Icon-Datei fehlt: {path} (Vendor-Verzeichnis aktualisieren?)")
    return path


def search(fragment):
    """Hilfsfunktion für die Konsole: alle Kurznamen, die das Fragment enthalten."""
    global _AUTO
    if _AUTO is None:
        _AUTO = _autoslugs()
    pool = dict(_AUTO)
    pool.update(ALIASES)
    return sorted(k for k in pool if fragment.lower() in k.lower())


def check_aliases():
    """QC beim Icon-Update: meldet Kurznamen, deren Datei verschwunden ist."""
    missing = []
    for k, rel in ALIASES.items():
        if not os.path.exists(os.path.join(ICON_ROOT, rel)):
            missing.append((k, rel))
    return missing
