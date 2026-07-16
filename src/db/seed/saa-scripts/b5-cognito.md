---
service: Amazon Cognito
seedKey: saa-c03-script-cognito
batch: B5
domains: [D1, D3]
sourceRef:
  - https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html
  - https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-scenarios.html
  - https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html
status: draft
---

# Amazon Cognito

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Cognito = das **fertige Login-System zum Mieten** für App-Nutzer. Zwei Bausteine: **User Pools** = das Nutzerverzeichnis (Registrierung, Login, MFA, Social Login) → „Wer bist du?". **Identity Pools** = temporäre AWS-Credentials für eingeloggte Nutzer → „Was darfst du in AWS?". Die Killer-Abgrenzung: **IAM = dein Team, Cognito = deine App-Endkunden.**

Der SAA vertieft das **Zusammenspiel der beiden Pools**, die **Integration mit ALB/API Gateway** — und schärft die Workforce-vs-Customer-Grenze.

---

## 🎯 SAA-Vertiefung

### Die zwei Pools: Authentifizierung ≠ AWS-Zugriff

**Das Problem:** Eine Foto-App hat Millionen Nutzer. Sie sollen sich einloggen können (auch „mit Google") **und** ihre Bilder direkt in einen S3-Bucket laden — ohne dass die Fotos erst durch einen eigenen Backend-Server müssen.

**Die Lösung:** Das sind **zwei verschiedene Jobs**, und Cognito trennt sie sauber:
- Der **User Pool** erledigt die **Authentifizierung**: Registrierung, Login, MFA, Passwort-Reset, Hosted UI, **Social/SAML/OIDC-Login**. Ergebnis ist ein **JWT-Token** — der Beweis „dieser Nutzer ist echt". Das reicht für den Login, gibt aber **keinen** AWS-Zugriff.
- Der **Identity Pool** erledigt die **Autorisierung für AWS**: Er nimmt das Token (vom User Pool, von Google, von einem SAML-IdP) und tauscht es über **STS** gegen **temporäre AWS-Credentials**. Erst damit darf die App direkt auf S3/DynamoDB.

Der Ablauf: **User Pool authentifiziert → Identity Pool gibt AWS-Credentials → App schreibt nach S3.** Das ist die klassische Frage: „Mobile App braucht **direkten** Zugriff auf AWS-Ressourcen" → **Identity Pool** (der User Pool allein kann das nicht). Ein Identity Pool kann außerdem **Gast-Zugriff** (unauthenticated) vergeben — für „ausprobieren ohne Anmeldung".

> **💡 Merksatz:** **User Pool = Login (JWT), Identity Pool = AWS-Credentials via STS.** Direkter S3/DynamoDB-Zugriff aus der App → **Identity Pool**. User Pool allein authentifiziert nur.

### Cognito als Auth-Schicht: ALB und API Gateway

**Das Problem:** Eine interne Web-App und eine REST-API sollen nur eingeloggten Nutzern offenstehen — aber niemand will die Token-Prüfung in jeden Microservice einbauen.

**Die Lösung:** Cognito lässt sich **vor** die Anwendung schalten:
- **ALB + Cognito**: Der Application Load Balancer übernimmt den kompletten Login-Flow (`authenticate-cognito` am HTTPS-Listener) und reicht die geprüften Nutzer-Claims per Header ans Backend weiter. Die App bekommt nur noch authentifizierte Requests — Auth ist „offgeloadet".
- **API Gateway + Cognito User Pool Authorizer**: Das User-Pool-Token wird von API Gateway verifiziert, bevor der Request überhaupt an die Integration geht.

Das ist das Muster für „Authentifizierung zentral erzwingen, ohne App-Code anzufassen".

> **💡 Merksatz:** Auth vor die App: **ALB `authenticate-cognito`** (Web-App, HTTPS-Listener) oder **API Gateway Cognito Authorizer** (REST-API) — kein Token-Handling im Backend nötig.

### Die Abgrenzung: Customer, nicht Workforce

**Das Problem:** „Login-Verwaltung" — und schon stehen Cognito, IAM und Identity Center nebeneinander in den Antworten.

**Die Lösung:** Die Grenze ist die **Zielgruppe**:
- **Cognito** = **App-Endkunden** (Consumer/Customer). Millionen Menschen, die von AWS nichts wissen, die sich in *deiner* App registrieren.
- **IAM Identity Center** = **Mitarbeiter** (Workforce), SSO über AWS-Konten.
- **IAM** = Maschinen/AWS-interne Prinzipale.

Der eindeutige Reflex: „Web-/Mobile-App", „Sign-up/Sign-in", „Social Login", „Endnutzer" → **Cognito**. „Mitarbeiter greifen auf die AWS-Konsole zu" → **Identity Center**, niemals Cognito.

🛑 Aktualität, die neu ist: Cognito hat seit **November 2024** Feature-Tiers (**Lite / Essentials / Plus**), **Managed Login** (anpassbare Login-Seiten) und **Passkeys** (passwordless). Für die Prüfung genügt: neue User Pools starten im **Essentials**-Tier, **Plus** bringt Threat Protection.

> **💡 Merksatz:** **Cognito = App-Kunden (Customer), Identity Center = Mitarbeiter (Workforce).** „Sign-up/Sign-in/Social Login" ist immer Cognito.

---

## ⚠️ Prüfungs-Knackpunkte

- **User Pool = Authentifizierung** (Login, MFA, Social/SAML/OIDC, JWT-Token) → „Wer bist du?".
- **Identity Pool = temporäre AWS-Credentials via STS** → „Was darfst du in AWS?"; auch **Gast-Zugriff**.
- Ablauf: User Pool → Identity Pool → AWS. **Direkter S3/DynamoDB-Zugriff aus App → Identity Pool.**
- **ALB `authenticate-cognito`** (HTTPS-Listener) und **API Gateway Cognito Authorizer** offloaden Auth.
- Abgrenzung: **Cognito (App-Kunden) ≠ Identity Center (Mitarbeiter) ≠ IAM (Maschinen)**.
- 🛑 Tiers Lite/Essentials/Plus, Managed Login, Passkeys (Nov 2024) — Essentials = Default für neue Pools.

## 💡 Der eine Satz zum Mitnehmen

**Cognito trennt zwei Fragen, die Prüflinge gern verwechseln: „Wer bist du?" beantwortet der User Pool (Login), „Was darfst du in AWS?" der Identity Pool (temporäre Credentials) — und beide gelten den App-Kunden, nicht den Mitarbeitern.**
