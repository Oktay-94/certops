---
service: AWS Shield (Standard & Advanced)
seedKey: saa-c03-script-shield
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/waf/latest/developerguide/shield-chapter.html
  - https://aws.amazon.com/shield/pricing/
status: draft
---

# AWS Shield

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Shield = der **DDoS-Schutzschild**. Ein DDoS-Angriff bombardiert die Server mit Millionen sinnloser Anfragen bis zur Überlast — Shield fängt den Müll ab. **Standard** ist kostenlos und automatisch für alle (Layer 3/4). **Advanced** kostet, deckt auch Layer 7 (mit WAF), bringt das 24/7-Response-Team und DDoS-Kostenschutz. Die Kern-Abgrenzung: **Shield = DDoS (stumpfe Masse), WAF = SQLi/XSS (gezielte Anfragen)**.

Der SAA vertieft: **die genaue Trennung Standard/Advanced, was Advanced sich lohnt — und die Ebenen-Abgrenzung zu WAF.**

---

## 🎯 SAA-Vertiefung

### Standard vs. Advanced: Wann sich die $3.000 lohnen

**Das Problem:** Eine Finanz-Plattform fürchtet gezielte DDoS-Angriffe und will wissen, ob der kostenlose Standard-Schutz reicht oder Advanced nötig ist.

**Die Lösung — die Gegenüberstellung:**

| | **Shield Standard** | **Shield Advanced** |
|---|---|---|
| Kosten | **kostenlos**, automatisch für alle | 🔴 **~$3.000/Monat**, 1-Jahres-Bindung |
| Ebene | Layer 3/4 (SYN-Flood, UDP-Reflection) | **+ Layer 7** (mit WAF) |
| Response Team | — | **24/7 Shield Response Team (SRT/DRT)** |
| Kostenschutz | — | **Cost Protection** (Refund für DDoS-Scale-Out) |
| Reporting | — | detaillierte Angriffs-Diagnostik, Protection Groups |

Der Entscheidungsreflex: **Standard genügt** für den normalen Layer-3/4-Basisschutz (bekommt jeder ohnehin). **Advanced** lohnt sich, wenn im Szenario steht: „**Layer-7-DDoS**", „**Zugriff auf DDoS-Experten während des Angriffs**", „**keine Zusatzkosten durch Angriffs-bedingtes Skalieren**" oder „garantierte SLAs für kritische Anwendungen". Besonders das **Cost-Protection**-Argument ist beliebt: Bei einem Angriff skaliert die Infrastruktur hoch (mehr Requests, mehr Data Transfer) — Advanced erstattet diese angriffsbedingten Mehrkosten.

Geschützte Ressourcen bei Advanced: **CloudFront, Route 53, ELB, Global Accelerator, EC2 (via Elastic IP)**.

> **💡 Merksatz:** **Standard = gratis, L3/4, automatisch.** **Advanced = kostet, + L7, Response-Team, Cost Protection** — bei „L7-DDoS / Experten-Hilfe / keine Angriffs-Mehrkosten".

### Shield und WAF: Zwei Ebenen, ein Team

**Das Problem:** „Web-App vor Angriffen schützen" — Shield und WAF stehen beide in den Antworten. Was wofür?

**Die Lösung:** Die beiden arbeiten auf **verschiedenen Ebenen** und ergänzen sich:
- **Shield** wehrt **volumetrische DDoS-Angriffe** ab (Layer 3/4 — die schiere Masse). Bei Advanced kommt Layer-7-DDoS dazu (viele HTTP-Requests, die die App überlasten sollen).
- **WAF** filtert **inhaltliche Angriffe** in einzelnen HTTP-Requests (SQL-Injection, XSS — Layer 7, aber inhaltlich, nicht volumetrisch).

Der Merksatz: **Shield = stumpfe Masse (DDoS), WAF = gezielte, inhaltliche Anfrage (SQLi/XSS).** In der Praxis kombiniert man beide auf CloudFront/ALB. Shield Advanced enthält AWS WAF für die geschützten Ressourcen bereits im Preis — das ist ein häufiger Kostenvorteil-Punkt.

> **💡 Merksatz:** **Shield = DDoS-Volumen (L3/4, + L7-DDoS bei Advanced), WAF = inhaltliche Web-Exploits (SQLi/XSS).** Advanced bringt WAF inklusive.

---

## ⚠️ Prüfungs-Knackpunkte

- **Standard**: kostenlos, automatisch für alle, **Layer 3/4**.
- **Advanced**: 🔴 ~$3.000/Monat + 1-Jahres-Bindung, **+ Layer 7**, **SRT/DRT (24/7)**, **Cost Protection**, Protection Groups.
- Advanced-Ressourcen: **CloudFront, Route 53, ELB, Global Accelerator, EC2 (EIP)**.
- Advanced-Signalwörter: „L7-DDoS", „DDoS-Experten während Angriff", „keine Angriffs-Mehrkosten", „SLA".
- **Shield = DDoS-Masse**, **WAF = SQLi/XSS** — die wichtigste Abgrenzung; Advanced enthält WAF.

## 💡 Der eine Satz zum Mitnehmen

**Shield Standard hat jeder gratis für Layer-3/4-DDoS — Advanced kauft man für Layer-7-DDoS, das Response-Team und den Cost-Protection-Schutz vor angriffsbedingten Skalierungskosten; die inhaltlichen Angriffe (SQLi/XSS) bleiben Sache der WAF.**
