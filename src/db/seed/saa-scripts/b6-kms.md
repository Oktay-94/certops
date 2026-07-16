---
service: AWS KMS (Key Management Service)
seedKey: saa-c03-script-kms
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html
  - https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html
  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html
status: draft
---

# AWS KMS (Key Management Service)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> KMS = der **hochsichere Tresor für kryptografische Schlüssel**. Der Master Key bleibt eingesperrt; per **Envelope Encryption** verschlüsselt er einen kleinen **Data Key**, der die eigentlichen Terabytes verschlüsselt. **Jeder** Schlüssel-Aufruf landet in **CloudTrail** (Compliance). Man kann AWS die Keys generieren lassen oder eigenes Material hochladen.

Der SAA vertieft: **die 4-KB-Grenze und warum Envelope Encryption Pflicht ist, die Key-Policy-Besonderheit, Rotation im Detail — und die S3-Verschlüsselungsvarianten.**

---

## 🎯 SAA-Vertiefung

### Envelope Encryption und die 4-KB-Wand

**Das Problem:** Eine App will ein 100-MB-File verschlüsseln und ruft direkt `kms:Encrypt` auf. Der Call scheitert. Warum?

**Die Lösung:** Ein direkter KMS-`Encrypt`-Aufruf ist auf **4 KB (4.096 Bytes)** Plaintext begrenzt — KMS ist ein Key-Tresor, kein Datendurchlauf. Für alles Größere gilt **Envelope Encryption**: Die App ruft `GenerateDataKey`, bekommt einen **Data Key in zwei Formen** zurück — einmal Klartext (zum lokalen Verschlüsseln der 100 MB, danach sofort aus dem Speicher werfen) und einmal von einem KMS Key verschlüsselt (wird neben den Daten gespeichert). Zum Entschlüsseln schickt man den verschlüsselten Data Key an KMS, bekommt den Klartext-Key zurück, entschlüsselt lokal. Der Master Key verlässt KMS **nie**.

Das ist der Grund, warum S3, EBS, RDS das im Hintergrund alle so machen — und warum „großes File direkt mit KMS verschlüsseln" in Antwortoptionen immer der Distraktor ist.

> **💡 Merksatz:** Direkter `Encrypt` = **max. 4 KB**. Alles Größere → **Envelope Encryption** (`GenerateDataKey`, lokal verschlüsseln, verschlüsselten Data Key danebenlegen). Master Key verlässt KMS nie.

### Key Policy: Die Ressource, die IAM allein nicht öffnet

**Das Problem:** Ein Admin hat per IAM `kms:Decrypt` auf alle Keys — trotzdem verweigert ein bestimmter Key den Zugriff. Bei S3 oder SQS würde die IAM-Policy genügen. Bei KMS nicht.

**Die Lösung:** KMS Keys haben **immer** eine **Key Policy** (Resource-based) — und die ist **Pflicht**. Anders als bei fast allen anderen Ressourcen reicht eine IAM-Policy allein **nicht**: Der Zugriff funktioniert nur, wenn die Key Policy ihn zulässt (entweder direkt oder indem sie dem Konto-Root erlaubt, via IAM zu delegieren). Wer „Zugriff auf einen KMS Key erlauben" liest und nur an IAM denkt, übersieht die Key Policy — ein beliebter Fallstrick.

Für die feinere Steuerung gibt es **Grants** (temporäre, eng begrenzte Delegation an Services) und die Condition **`kms:ViaService`** (Key darf nur *über* einen bestimmten Dienst genutzt werden, z. B. nur via S3). Cross-Account-Nutzung braucht ein Zusammenspiel: Key Policy in Konto A **plus** IAM in Konto B.

> **💡 Merksatz:** **KMS Key Policy ist Pflicht** — IAM allein genügt nicht (anders als S3/SQS). Feinsteuerung über **Grants** und **`kms:ViaService`**.

### Rotation und Löschung: Zwei prüfbare Zeitfenster

**Das Problem:** Compliance verlangt jährliche Key-Rotation ohne Downtime — und will alte Keys „sofort löschen" können.

**Die Lösung:** Für **Customer Managed Keys** gibt es **automatische Rotation** (Standard 365 Tage, seit 2024 auf 90–2560 Tage einstellbar). Der Clou: Rotation tauscht nur das **Backing-Key-Material** — **Key-ID, ARN und Alias bleiben gleich**, und **alte Daten müssen nicht neu verschlüsselt werden** (KMS merkt sich, welches Material zu welchem Ciphertext gehört). Kein Downtime, keine Migration. 🛑 Seit 2024/2025 gibt es zusätzlich **On-Demand-Rotation** und Rotation für importiertes Material.

Beim Löschen die Falle: Ein KMS Key wird **nie sofort** gelöscht — es gibt eine **Waiting Period von 7 bis 30 Tagen** (Default 30), in der man es zurücknehmen kann. Danach ist es unwiderruflich, und **alle** damit verschlüsselten Daten sind für immer verloren. „Key sofort löschen" gibt es nicht — das ist bewusst so.

> **💡 Merksatz:** CMK-Rotation: neues Material, **gleiche Key-ID/ARN, kein Re-Encrypt, kein Downtime**. Löschen nur mit **7–30 Tagen Waiting Period** (nie sofort).

### S3-Verschlüsselung: SSE-S3 vs. SSE-KMS vs. SSE-C vs. Client-Side

**Das Problem:** „Objekte in S3 verschlüsseln" — vier Varianten stehen in den Antworten, jede passt zu einem anderen Anspruch.

**Die Lösung — die Zuordnung über die Kontrollfrage:**
- **SSE-S3**: AWS verwaltet alles (AES-256). Default für neue Objekte, einfachster Weg, **kein Key-Usage-Log**. „Einfach verschlüsselt, egal welcher Key" → SSE-S3.
- **SSE-KMS**: Verschlüsselung über einen KMS Key. Bringt **Key-Policy-Kontrolle**, **CloudTrail-Logging jeder Key-Nutzung** und **Role-Separation** (man braucht S3- *und* KMS-Rechte). „Audit-Trail, wer wann entschlüsselt" oder „Zugriff auf den Key separat steuern" → SSE-KMS. (Tipp: **S3 Bucket Keys** senken die KMS-Call-Kosten drastisch.)
- **SSE-C**: Der Kunde liefert den Key bei **jedem** Request mit; AWS speichert ihn nie. „Wir wollen die Keys selbst halten, aber S3 soll verschlüsseln" → SSE-C.
- **Client-Side**: Der Kunde verschlüsselt **vor** dem Upload; AWS sieht nie Klartext. Höchste Kontrolle, meiste Eigenverantwortung.

> **💡 Merksatz:** **SSE-S3** = einfach, kein Log · **SSE-KMS** = Key-Kontrolle + CloudTrail + Role-Separation · **SSE-C** = Kunde liefert Key pro Request · **Client-Side** = vor dem Upload verschlüsselt.

---

## ⚠️ Prüfungs-Knackpunkte

- Direkter `Encrypt` **max. 4 KB** → Größeres via **Envelope Encryption** (`GenerateDataKey`).
- **Key Policy ist Pflicht** (Resource-based); IAM allein genügt nicht. **Grants** + **`kms:ViaService`** für Feinsteuerung.
- CMK-**Rotation**: neues Material, **gleiche Key-ID/ARN, kein Re-Encrypt**; 🛑 On-Demand + importiertes Material seit 2024/2025.
- **Löschung: 7–30 Tage Waiting Period** — nie sofort.
- **Multi-Region Keys** für regionsübergreifende Verschlüsselung (gleiche Key-ID); Rotation nur am Primary.
- S3: **SSE-S3** (einfach) · **SSE-KMS** (Log+Kontrolle, Bucket Keys sparen Kosten) · **SSE-C** (Kunde liefert Key) · **Client-Side**.
- Abgrenzung: **KMS = at rest**, **ACM = in transit**.

## 💡 Der eine Satz zum Mitnehmen

**KMS ist der Tresor, nicht die Verschlüsselungsmaschine: Er schützt Data Keys per Envelope Encryption (die 4-KB-Wand erzwingt das), verlangt immer eine Key Policy, rotiert ohne Re-Encrypt — und die S3-Frage entscheidet sich daran, wie viel Kontrolle und Audit-Trail über die Keys verlangt wird.**
