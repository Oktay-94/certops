---
service: Amazon CloudFront
seedKey: saa-c03-script-cloudfront
batch: B4
domains: [D1, D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html
  - https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions-choosing.html
  - https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-vpc-origins.html
status: draft
---

# Amazon CloudFront

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> CloudFront = das **weltweite Filialnetz** (CDN): Inhalte werden an hunderten **Edge Locations** zwischengelagert, Nutzer bekommen sie vom nächstgelegenen Standort — schneller, günstiger (weniger Origin-Traffic), mit DDoS-Grundschutz. Origins: S3, ALB, EC2, beliebige HTTP-Server.

Der SAA prüft fünf Baustellen: **OAC, private Inhalte (Signed URLs/Cookies), die Edge-Functions-Wahl, das us-east-1-Zertifikat — und die neuen VPC Origins.**

---

## 🎯 SAA-Vertiefung

### OAC: Der Bucket, den nur CloudFront kennt

**Das Problem:** Der S3-Bucket hinter CloudFront ist öffentlich — jeder, der die Bucket-URL errät, umgeht das CDN (und dessen WAF, Geo-Restriction, Signed URLs). Der Bucket muss privat werden, aber CloudFront muss weiter lesen dürfen.

**Die Lösung:** **Origin Access Control (OAC)**: CloudFront signiert seine Origin-Requests (SigV4), und die **Bucket Policy** erlaubt Zugriff **nur dem CloudFront-Service-Principal** dieser Distribution. Bucket privat, Auslieferung nur noch über das CDN.

Die Prüfungs-Nuance ist der Vorgänger: **OAI ist Legacy** — und zwar mit konkreten Lücken: OAI kann **kein SSE-KMS** (verschlüsselter Bucket → AccessDenied), **kein PUT/POST** und keine neueren Regionen. Steht im Szenario „KMS-verschlüsselter Bucket hinter CloudFront" oder „Uploads über CloudFront", ist **OAC die einzige richtige Antwort** und OAI der Distraktor.

> **💡 Merksatz:** Privater S3-Origin → **OAC** (Bucket Policy erlaubt nur den CloudFront-Principal). **OAI = Legacy: kein SSE-KMS, kein PUT** — der ewige Distraktor.

### Private Inhalte: Ein Ticket oder ein Festivalbändchen

**Das Problem:** Ein Streaming-Dienst liefert Videos über CloudFront — aber nur an zahlende Kunden. Die URLs dürfen nicht einfach weitergegeben werden können.

**Die Lösung:** Zwei Werkzeuge, ein Unterscheidungsmerkmal:
- **Signed URL** = das **Einzelticket**: eine signierte URL für **ein Objekt**, mit Ablaufzeit (und optional IP-Bindung). Für den einzelnen Download/das einzelne Video.
- **Signed Cookies** = das **Festivalbändchen**: ein Cookie, das Zugriff auf **viele Objekte** gewährt (z. B. alle HLS-Segmente eines Streams, den ganzen Mitgliederbereich) — ohne jede URL einzeln zu signieren.

Dazu die Standort-Schranke: **Geo Restriction** blockt Länder direkt an der Edge (Lizenzrecht: „Inhalt nur in DE/AT/CH"). Und für „nur ausgewählte Felder dürfen selbst unsere Systeme nicht im Klartext sehen" (Kreditkartennummern): **Field-Level Encryption** — Verschlüsselung einzelner POST-Felder schon an der Edge.

> **💡 Merksatz:** **Ein Objekt → Signed URL. Viele Objekte/Streams → Signed Cookies.** Länder sperren → Geo Restriction. Einzelne Formularfelder → Field-Level Encryption.

### CloudFront Functions vs. Lambda@Edge: Taschenrechner oder Laptop

**Das Problem:** „Bei jedem Request soll ein Header umgeschrieben werden" — und daneben: „Am Edge soll ein JWT gegen einen externen Auth-Dienst geprüft werden." Beides „Code am Edge", aber zwei verschiedene Werkzeuge.

**Die Lösung:**

| | **CloudFront Functions** | **Lambda@Edge** |
|---|---|---|
| Trigger | **nur Viewer** Request/Response | **alle vier** (auch Origin Request/Response) |
| Laufzeit | JavaScript, **Sub-Millisekunde** | Node.js/Python, bis 5 s (Viewer) / 30 s (Origin) |
| Netzwerk/externe Calls | **NEIN** (auch kein KMS) | **JA** |
| Läuft an | 225+ Edge Locations | Regional Edge Caches |
| Kosten | ~1/6 von Lambda@Edge | teurer |

Der Entscheidungsreflex: **Leichtgewichtig und bei jedem Request** (Header-Manipulation, URL-Rewrite/Redirect, Cache-Key-Normalisierung, simple Token-Prüfung) → **CloudFront Functions**. **Braucht Netzwerk, Secrets, mehr Zeit oder Origin-Trigger** (externer Auth-Call, Origin-Auswahl, A/B mit Datenzugriff) → **Lambda@Edge**.

> **💡 Merksatz:** **CloudFront Functions = Taschenrechner** (Viewer-only, sub-ms, kein Netzwerk). **Lambda@Edge = Laptop** (4 Trigger, Netzwerk, mehr Zeit). „Externer Call am Edge" disqualifiziert Functions sofort.

### Die us-east-1-Falle und der Cache-Alltag

**Das Problem:** Die Distribution soll `www.firma.de` mit eigenem TLS-Zertifikat ausliefern. Das ACM-Zertifikat liegt in eu-central-1 — und taucht in der CloudFront-Konsole schlicht nicht auf.

**Die Lösung:** **CloudFront akzeptiert ACM-Zertifikate ausschließlich aus us-east-1** (N. Virginia) — weil die Distribution global ist. Das Zertifikat dort (neu) ausstellen; für die Origins gilt das nicht. Einer der meistgeprüften Einzelfakten überhaupt.

Der Cache-Alltag in drei Punkten:
- **Cache Policies / Origin Request Policies** steuern den **Cache Key** (welche Header/Cookies/Query-Strings unterscheiden Objekte) — zu viele Variablen im Key = miserable Hit-Rate.
- **Aktualisierung:** **Invalidations** funktionieren, kosten aber ab Kontingent und dauern — **Best Practice sind versionierte Objektnamen** (`app.v2.js` statt `app.js` invalidieren). „Deployment soll sofort und günstig sichtbar sein" → Versionierung, nicht Invalidation.
- **Origin Groups** = Origin-**Failover** (Primary S3 down → Secondary), **Origin Shield** = zusätzliche zentrale Cache-Schicht vor dem Origin (schützt schwache Origins vor Request-Stürmen), **Price Classes** = Edge-Standorte auf günstigere Regionen begrenzen (D4).

> **💡 Merksatz:** **ACM für CloudFront: immer us-east-1.** Cache aktualisieren → **versionierte Namen** (Invalidation = teurer Plan B). Origin-Ausfall → **Origin Groups**, Origin-Schutz → **Origin Shield**.

### 🛑 VPC Origins: Der private ALB ohne Krücken

**Das Problem (bis 2024):** Ein ALB als CloudFront-Origin musste **öffentlich** erreichbar sein — und wurde mit Krücken „geschützt": geheime Custom-Header, die die Security Group prüfen sollte, IP-Allowlists der CloudFront-Ranges, ständige Pflege.

**Die Lösung:** 🛑 **CloudFront VPC Origins** (seit 11/2024): ALB, NLB oder EC2 dürfen in **privaten Subnetzen ohne öffentliche IP** liegen — CloudFront erreicht sie über eine service-managed ENI direkt in der VPC. Kein Header-Trick, keine IP-Listen, und obendrein entfallen public-IPv4-Kosten. In aktuellen Fragen ist die Header-Krücke damit der **veraltete** Lösungsweg — „ALB nur über CloudFront erreichbar" beantwortet man heute mit **VPC Origins**.

> **💡 Merksatz:** 🛑 „ALB/EC2 privat, nur via CloudFront erreichbar" → **VPC Origins** (11/2024). Custom-Header + IP-Allowlist = die alte Krücke, heute Distraktor.

---

## ⚠️ Prüfungs-Knackpunkte

- Privater S3-Origin → **OAC**; **OAI = Legacy (kein SSE-KMS, kein PUT)** — Distraktor.
- **Signed URL = 1 Objekt · Signed Cookies = viele Objekte/Streams**; Länder blocken → **Geo Restriction**; einzelne Felder → **Field-Level Encryption**.
- **CloudFront Functions**: nur Viewer, JS, sub-ms, **kein Netzwerk/KMS** · **Lambda@Edge**: 4 Trigger, Netzwerk, 5 s/30 s. Externer Call → immer Lambda@Edge.
- **ACM-Zertifikat für CloudFront zwingend in us-east-1.**
- Cache-Update: **versionierte Objektnamen** > Invalidations; Cache Key schlank halten (Cache Policies).
- **Origin Groups** = Failover · **Origin Shield** = Schutzschicht vor dem Origin · **Price Classes** = Kostenhebel.
- 🛑 **VPC Origins (11/2024)**: private ALB/NLB/EC2 als Origin — ersetzt die Custom-Header-Krücke.
- CloudFront + **WAF/Shield** kombinierbar; Ende der Kette: CloudFront cached **HTTP** — non-HTTP/statische IPs → Global Accelerator (nächstes Skript).

## 💡 Der eine Satz zum Mitnehmen

**CloudFront-Fragen entscheiden sich an fünf Fixpunkten: OAC (nie OAI), Signed URL vs. Cookies (eins vs. viele), Functions vs. Lambda@Edge (Taschenrechner vs. Laptop), das Zertifikat in us-east-1 — und seit 2024: private Origins heißen VPC Origins.**
