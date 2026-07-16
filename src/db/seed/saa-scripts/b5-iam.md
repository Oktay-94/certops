---
service: AWS IAM (Policy-Vertiefung)
seedKey: saa-c03-script-iam
batch: B5
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html
  - https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html
  - https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html
status: draft
---

# AWS IAM (Policy-Vertiefung)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> IAM = die **zentrale Schließanlage**: wer (Authentifizierung) darf was (Autorisierung). Global und kostenlos. Policies sind **JSON** mit Allow/Deny — **ein Deny überschreibt immer ein Allow**. **Rollen sind temporär** (für Maschinen und Menschen), Access Keys im Code sind das Anti-Pattern. Grundprinzip: **Least Privilege**.

Der SAA verlässt die CLF-Ebene komplett: Hier geht es um die **exakte Evaluationslogik** (mehrere Policy-Typen treffen aufeinander), um **Permissions Boundaries**, **ABAC** und die Frage, **welcher Policy-Typ wen begrenzt**.

---

## 🎯 SAA-Vertiefung

### Die Evaluationslogik: Wie AWS „Ja" oder „Nein" entscheidet

**Das Problem:** Ein Request trifft ein. Es gibt eine Identity-Policy (Allow), eine SCP (schweigt), eine Bucket-Policy (Deny) und eine Permissions Boundary (Allow). Darf der Zugriff? Wer im Kopf nur „Deny schlägt Allow" hat, rät.

**Die Lösung:** AWS wertet in einer **festen Reihenfolge** aus — und der Startpunkt ist entscheidend: **Alles ist per Default verboten** (impliziter Deny). Ein Allow muss den Zugriff aktiv freischalten, und ein **expliziter Deny in *irgendeiner* Policy** killt ihn sofort. Die Kette:

1. **Expliziter Deny** irgendwo → **sofort abgelehnt**, Ende. (Gewinnt immer.)
2. **SCP/RCP** (Organizations): Erlaubt die Guardrail es nicht → abgelehnt.
3. **Resource-based Policy**: Ein Allow hier kann allein genügen (Sonderregeln bei Rollen/KMS).
4. **Identity-based Policy** + **Permissions Boundary**: Beide müssen erlauben (Schnittmenge).
5. **Session Policy**: verengt zusätzlich.
6. Kein einziges Allow → impliziter Deny → abgelehnt.

Zwei Denkregeln, die die kniffligen Fragen lösen:
- **Innerhalb eines Accounts** gilt zwischen Identity- und Resource-Policy die **Union** (Vereinigung): Erlaubt *eine* von beiden und verbietet keine explizit, ist es erlaubt.
- Bei **Permissions Boundary und SCP** gilt die **Intersection** (Schnittmenge): Was beide *nicht* erlauben, ist verboten — sie können nur einschränken, nie erweitern.

Im Beispiel oben: Die Bucket-Policy sagt explizit Deny → abgelehnt, egal was der Rest erlaubt.

> **💡 Merksatz:** **Default = impliziter Deny. Expliziter Deny gewinnt immer.** Im Account: Identity + Resource = **Union**. Mit Boundary/SCP = **Intersection** (schränken nur ein).

### Identity- vs. Resource-based: Der Cross-Account-Unterschied

**Das Problem:** Konto B soll auf einen S3-Bucket in Konto A zugreifen. Zwei Wege stehen im Raum — Rolle oder Bucket Policy. Was unterscheidet sie wirklich?

**Die Lösung:** Beide funktionieren, aber sie verhalten sich fundamental verschieden:
- **Resource-based Policy** (Bucket Policy, SQS/SNS/Lambda/KMS Policy): hat ein **Principal-Element** und erlaubt Cross-Account-Zugriff **ohne Rolle im Zielkonto**. Der Nutzer aus Konto B **behält seine eigenen Rechte** und greift zusätzlich auf die fremde Ressource zu. Ideal, wenn *eine einzelne Ressource* geteilt wird.
- **IAM-Rolle mit Trust Policy**: Der Nutzer aus Konto B **nimmt die Rolle an** und gibt dabei seine ursprünglichen Rechte für die Session **auf** (er ist jetzt die Rolle). Ideal, wenn *ein ganzes Set an Aktionen* im Zielkonto nötig ist.

Der Merksatz für die Prüfung: **Eine Ressource cross-account teilen → Resource-based Policy** (kein Role-Switch). **Handeln *als* das andere Konto → Rolle annehmen.**

Und die Zwei-Teile-Struktur jeder Rolle, die dauernd gefragt wird: **Trust Policy** = *wer* darf die Rolle annehmen (Resource-based, das Principal-Element). **Permissions Policy** = *was* die Rolle darf (Identity-based). Ein **Instance Profile** ist bloß der Behälter, der eine Rolle an eine EC2 klebt.

> **💡 Merksatz:** **Resource-based = fremder Principal greift zu, behält eigene Rechte** (eine Ressource). **Rolle = man schlüpft hinein, gibt eigene Rechte auf** (ganzes Konto). Rolle = **Trust (wer) + Permissions (was)**.

### Permissions Boundaries: Delegation ohne Privilege Escalation

**Das Problem:** Entwickler sollen ihre eigenen IAM-Rollen für Lambda-Funktionen erstellen dürfen — Self-Service. Aber wer `iam:CreateRole` hat, könnte sich eine Rolle mit `AdministratorAccess` bauen und annehmen. Das ist eine offene Tür zur Rechte-Eskalation.

**Die Lösung:** Eine **Permissions Boundary** ist eine **Obergrenze** für eine einzelne Identität. Sie **gewährt selbst nichts** — sie deckelt, was die Identity-Policy maximal erreichen kann (Schnittmenge). Der Trick bei der Delegation: Man erlaubt den Entwicklern `CreateRole` **nur unter der Bedingung, dass sie jeder neuen Rolle dieselbe Boundary anhängen**. So kann keine erzeugte Rolle je mehr als die Boundary — Privilege Escalation ist strukturell unmöglich, und die Entwickler bleiben trotzdem autonom.

Abgrenzung, die geprüft wird: **SCP** wirkt auf den **ganzen Account**, **Permissions Boundary** auf **eine einzelne Identität**, die **IAM-Policy** definiert die tatsächlichen Rechte. Die Leitplanken-Hierarchie: SCP > Boundary > Policy.

> **💡 Merksatz:** **Permissions Boundary = Obergrenze für eine Identität, gewährt nichts.** Delegation: `CreateRole` nur mit erzwungener Boundary → keine Eskalation.

### ABAC: Zugriff über Tags statt über hundert Policies

**Das Problem:** Ein Unternehmen hat 40 Projektteams, ständig kommen neue dazu. Jedes Team darf nur seine eigenen Ressourcen sehen. Mit klassischem RBAC bräuchte man für jedes neue Team neue Rollen und Policy-Änderungen — Verwaltungslast, die linear mitwächst.

**Die Lösung:** **ABAC (Attribute-Based Access Control)** steuert Zugriff über **Tags** statt über explizite Policies. Eine einzige Policy sagt sinngemäß: „Ein Principal mit `team=X` darf Ressourcen mit `team=X`" — umgesetzt über die Condition `aws:PrincipalTag` = `aws:ResourceTag`. Kommt ein neues Team dazu, legt man nur den Tag an — **keine neue Policy, kein Deployment**. Das ist das Signalwort-Muster: „viele Teams, dynamisch skalieren, ohne für jeden neuen Nutzer die Policies anzufassen" → **ABAC**.

Dazu die wichtigsten **Condition Keys**, die als Bausteine in Szenarien auftauchen: `aws:SourceIp` (IP-Beschränkung), `aws:RequestedRegion` (Region-Lockdown), `aws:SecureTransport` (nur HTTPS/TLS), `aws:MultiFactorAuthPresent` (MFA erzwingen), `aws:PrincipalOrgID` (nur eigene Organisation), `sts:ExternalId` (Confused Deputy — siehe STS-Skript).

> **💡 Merksatz:** Viele Teams, dynamisch, ohne Policy-Updates skalieren → **ABAC** (`aws:PrincipalTag` = `aws:ResourceTag`). MFA erzwingen → Condition `aws:MultiFactorAuthPresent`.

### Least Privilege im Betrieb: Access Analyzer & Co.

Drei Werkzeuge, die für die Verfeinerung und Prüfung von Rechten stehen — sauber abzugrenzen:
- **IAM Access Analyzer**: findet **externen Zugriff** (Ressourcen offen für andere Konten/Internet/Orgs), **ungenutzten Zugriff** (tote Rollen, alte Access Keys, nie genutzte Permissions), validiert Policies und **generiert Policies aus CloudTrail-Logs** (tatsächliche Nutzung → passgenaue Least-Privilege-Policy).
- **Credential Report**: kontoweite CSV — Status aller User-Credentials (MFA aktiv? Access Keys wie alt?).
- **Access Advisor** (Last Accessed Data): zeigt pro Identität, **welche Services zuletzt wann** genutzt wurden → ungenutzte Rechte streichen.

Merkregel: „Ist etwas extern offen / ungenutzt?" → **Access Analyzer**. „Wie alt sind Credentials kontoweit?" → **Credential Report**. „Welche Services nutzt *diese* Rolle wirklich?" → **Access Advisor**.

> **💡 Merksatz:** Extern/ungenutzt/Policy generieren → **Access Analyzer**. Credential-Status kontoweit → **Credential Report**. Service-Nutzung pro Identität → **Access Advisor**.

---

## ⚠️ Prüfungs-Knackpunkte

- **Default impliziter Deny; expliziter Deny gewinnt immer.** Reihenfolge: expliziter Deny → SCP/RCP → Resource → Identity+Boundary → Session.
- **Union** von Identity + Resource innerhalb eines Accounts; **Intersection** bei Boundary/SCP (schränken nur ein).
- **Resource-based Policy** = Cross-Account ohne Rolle, Nutzer behält Rechte; **Rolle** = Nutzer gibt Rechte auf, wird zur Rolle.
- Rolle = **Trust Policy (wer)** + **Permissions Policy (was)**; Instance Profile klebt Rolle an EC2.
- **Permissions Boundary** = Obergrenze für eine Identität (gewährt nichts) → Delegation ohne Escalation.
- **ABAC** via Tags (`aws:PrincipalTag`/`aws:ResourceTag`) für dynamische Skalierung; wichtige Condition Keys (SourceIp, RequestedRegion, SecureTransport, MultiFactorAuthPresent, PrincipalOrgID, ExternalId).
- **Access Analyzer** (extern/ungenutzt/Policy-Gen) vs. **Credential Report** (Credential-Status) vs. **Access Advisor** (Service-Nutzung).
- 🛑 Aktuell: AWS empfiehlt **keine IAM Users mehr für Menschen** → IAM Identity Center; IAM Users nur für Service-Accounts.

## 💡 Der eine Satz zum Mitnehmen

**IAM-Fragen auf SAA-Niveau sind Kollisionsfragen: mehrere Policy-Typen treffen aufeinander, und die Antwort ergibt sich aus der Reihenfolge (Deny gewinnt), der Mengenlehre (Union im Account, Intersection bei Guardrails) und der Frage, ob man eine Ressource teilt (Resource-Policy) oder zum anderen Konto wird (Rolle).**
