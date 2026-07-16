---
service: AWS CloudHSM
seedKey: saa-c03-script-cloudhsm
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/cloudhsm/latest/userguide/introduction.html
  - https://aws.amazon.com/cloudhsm/faqs/
status: draft
---

# AWS CloudHSM

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> CloudHSM = der **physische Hardware-Tresor, den nur du besitzt**. Anders als KMS (multi-tenant, AWS verwaltet mit) ist CloudHSM **single-tenant** — dedizierte Hardware, **AWS hat keinerlei Zugriff** auf die Keys. Erfüllt strengste Standards (**FIPS 140-2 Level 3**). Merkbild: KMS = Tresor in der Gemeinschaftsbank, CloudHSM = eigener Tresor im eigenen Keller.

Der SAA vertieft: **wann CloudHSM statt KMS zwingend ist, die Custom-Key-Store-Brücke — und die HA-Architektur.**

---

## 🎯 SAA-Vertiefung

### Wann es CloudHSM sein muss — und die Kehrseite

**Das Problem:** Eine Bank hat eine Compliance-Vorgabe: Kryptografische Keys müssen in **dediziertem, single-tenant FIPS-140-Level-3-HSM** liegen, auf das **der Cloud-Provider keinen Zugriff** hat. KMS ist hervorragend — aber multi-tenant und AWS-verwaltet. Reicht nicht.

**Die Lösung:** **CloudHSM** liefert genau das: dedizierte HSM-Hardware in der eigenen VPC, **Single-Tenant**, volle Alleinkontrolle, kein AWS-Zugriff. Die typischen Auslöser in Szenarien:
- Compliance verlangt **dediziertes HSM** / „AWS darf die Keys nicht sehen" / **FIPS 140-2 Level 3**.
- **SQL Server / Oracle TDE** mit eigener Key-Hoheit.
- **Eigene PKI / Certificate Authority** betreiben.
- Zugriff über Standard-Krypto-APIs **PKCS #11, JCE, CNG**.
- **Portable Keys** (Export/Import), die AWS-unabhängig bleiben sollen.

Die Kehrseite gehört zur Prüfung: **Volle Kontrolle heißt volle Verantwortung.** Verliert der Kunde den Zugang zu seinen Keys, kann **auch AWS nicht helfen** — die Daten sind verloren. Das ist der bewusste Preis für „AWS hat keinen Zugriff".

> **💡 Merksatz:** **Dediziert / single-tenant / FIPS 140-2 L3 / AWS ohne Zugriff / eigene PKI / SQL-TDE → CloudHSM.** Kehrseite: Key-Verlust ist unrettbar (auch für AWS).

### Custom Key Store: Das Beste aus beiden Welten

**Das Problem:** Ein Team will die **bequeme KMS-Integration** (S3, EBS, RDS nutzen KMS nahtlos) — aber die Compliance verlangt, dass die kryptografischen Operationen auf **eigener HSM-Hardware** laufen, nicht auf AWS-verwalteter.

**Die Lösung:** Der **CloudHSM Custom Key Store** ist die Brücke: Ein KMS Key wird angelegt, aber sein Material liegt im **eigenen CloudHSM-Cluster**, und alle kryptografischen Operationen laufen dort. Nach außen verhält er sich wie ein normaler KMS Key — die ganze Service-Integration bleibt erhalten. So bekommt man KMS-Komfort mit CloudHSM-Kontrolle. Einschränkung mit Punktwert: nur **symmetrische** Keys, Material wird von KMS **im** CloudHSM generiert (kein Import fremden Materials in den Custom Key Store).

> **💡 Merksatz:** **Custom Key Store = KMS-Integration + CloudHSM-Kontrolle.** KMS-Key, dessen Operationen auf eigener HSM-Hardware laufen — für „KMS-Komfort, aber Keys in eigenem HSM".

### Hochverfügbarkeit

Ein einzelnes HSM ist ein Single Point of Failure. AWS empfiehlt einen **Cluster mit mindestens zwei HSMs in mindestens zwei AZs** (für geschäftskritische PKI eher drei HSMs über zwei AZs). Der CloudHSM-Client verteilt kryptografische Operationen automatisch über die HSMs und synchronisiert Keys clusterweit — fällt ein HSM aus, übernehmen die anderen. Das ist die gleiche AZ-Logik wie überall in AWS: Verfügbarkeit entsteht durch Verteilung über AZs.

> **💡 Merksatz:** HA = **Cluster mit ≥2 HSMs über ≥2 AZs** (Client balanciert automatisch, Keys clusterweit synchronisiert).

---

## ⚠️ Prüfungs-Knackpunkte

- **Signalwörter → CloudHSM:** dediziert, single-tenant, FIPS 140-2 Level 3, „AWS ohne Zugriff", eigene PKI/CA, SQL/Oracle TDE, PKCS#11/JCE/CNG, portable Keys.
- **Kehrseite:** Key-Verlust ist unrettbar — auch AWS kann nicht helfen.
- **Custom Key Store**: KMS-Key mit Operationen im eigenen CloudHSM (KMS-Integration + eigene Hardware); nur symmetrisch.
- HA: **≥2 HSMs über ≥2 AZs**, Client balanciert automatisch.
- Abgrenzung: **KMS = multi-tenant, AWS-managed, Standard** · **CloudHSM = single-tenant, customer-managed, strengste Compliance**.

## 💡 Der eine Satz zum Mitnehmen

**CloudHSM ist die Antwort, sobald „dediziert", „single-tenant", „FIPS 140-2 Level 3" oder „AWS darf die Keys nicht sehen" im Szenario steht — für den Sonderfall „KMS-Komfort trotzdem behalten" gibt es den Custom Key Store.**
