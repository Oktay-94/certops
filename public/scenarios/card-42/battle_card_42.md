---
nr: 42
title: "Cognito User Pools · Identity Pools — Login und direkter S3-Zugriff pro Nutzer"
services:
  - Amazon Cognito User Pools
  - Amazon Cognito Identity Pools
  - AWS STS
  - IAM Roles
  - Amazon S3
domains:
  - D1
signalwords:
  - "sign in with social identity providers"
  - "users must only access their own files"
  - "mobile application uploads directly to S3"
  - "without embedding credentials in the app"
  - "authenticate and then authorize"
  - "temporary AWS credentials for app users"
assets:
  svg: battle_card_42.svg
  png: battle_card_42.png
  pdf: battle_card_42.pdf
status_note: >
  QC 0 Befunde im ersten Durchgang, keine Korrekturrunde nötig.
  Gemeldet: 10 Boxen, 58 Texte, 25 Segmente, 7 Badges. Segmentzahl
  aufgeschlüsselt: 5 Marker-Definitionen in <defs> erzeugen 10
  Phantom-Segmente bei (0,0)-(8,4)-(0,8); real gezeichnet sind damit
  15 Segmente — 7 nummerierte Pfade mit zusammen 11 Teilstrecken,
  1 verworfener Pfad mit 1 Teilstrecke, 2 X-Striche, 1 weitere
  Teilstrecke. 7 Badges = 6 Nummern-Badges plus das rote X, das
  qc.py korrekt von Prüfung (d) ausnimmt.
  Render-Sanity: PNG 2400x1350. Fünf aus der Elementgeometrie
  abgeleitete Freizonen geprüft; zwei leer, drei belegt und einzeln
  aufgeklärt — (B) die User-Pool-Box selbst ragt in die zu weit
  geschnittene Zone, (C) der graue Zonenrand bei x=590, (E) das
  grüne Label "PutObject". Keine davon ist eine Kollision. Alle
  sieben Palettenfarben im PNG nachweisbar.
  Footer von Hand mit PIL gemessen: 1360.0 px (Stil-Guide ~1420).
  Eine erste Footer-Variante lag bei 1442.6 px und wurde verworfen —
  qc.py hätte sie bei ihrem Limit von 1542 px durchgewinkt, der
  blinde Fleck aus R3 hat also gegriffen.
  Sichtprüfung: versucht, unbrauchbar — die Bildansicht lieferte
  einen leeren Platzhalter. Anderes Fehlerbild als bei Karte 41
  (dort ein Bildobjekt ohne lesbaren Inhalt), gleiches Ergebnis.
  Die Karte ist rechnerisch geprüft, aber von niemandem gesehen.
---

## Szenario

Eine Fitness-App mit 200.000 Nutzern speichert Trainingsvideos, die direkt vom
Handy in einen S3-Bucket hochgeladen werden. Die Anmeldung soll per
E-Mail-Passwort **und** per Google möglich sein. Jeder Nutzer darf
ausschließlich seinen eigenen Ordner sehen und beschreiben.

Die erste Version der App enthielt einen fest eingebauten Access Key mit
Schreibrecht auf den gesamten Bucket. Ein Reverse Engineering der App hätte
jedem Zugriff auf die Videos aller Nutzer gegeben.

## Ablauf

**1 — Der Nutzer meldet sich am User Pool an.**
Der User Pool ist ein eigenes Nutzerverzeichnis: Registrierung, Anmeldung,
Passwort-Reset, MFA. Die Anmeldeseite muss nicht selbst gebaut werden — Managed
Login liefert fertige Seiten dafür. Zurück kommen JWT-Tokens: ID-Token
(wer der Nutzer ist), Access-Token (welche Scopes gelten), Refresh-Token.
Bis hierher ist noch kein einziges AWS-Recht vergeben.

**2 — Google kann als externer IdP föderiert werden.**
Der User Pool nimmt die Anmeldung bei Google entgegen und legt trotzdem ein
Verzeichnisprofil an. Das ist der Grund, warum "Login mit Google" und
"Login mit E-Mail" später gleich behandelt werden können: beide Wege enden im
selben User Pool und liefern dieselbe Art Token. Die App muss nicht zwei
Anmeldewege getrennt behandeln.

**3 — Die App reicht das ID-Token an den Identity Pool.**
Hier wechselt die Fragestellung von *wer bist du* zu *was darfst du in AWS*.
`GetId` tauscht das Token gegen eine **Identity ID** — eine im Identity Pool
vergebene Kennung, die stabil beim Nutzer bleibt. Danach liefert
`GetCredentialsForIdentity` die AWS-Credentials. Das sind zwei Aufrufe, nicht
drei: der Enhanced Flow erledigt den Rest intern.

**4 — Der Identity Pool tauscht das Token bei STS gegen Credentials.**
Im Hintergrund läuft `AssumeRoleWithWebIdentity`, aber der Identity Pool ruft
es selbst auf. Genau darin liegt der Sicherheitsvorteil des Enhanced Flow: Die
Rollenauswahl liegt in der Pool-Konfiguration, nicht im App-Code. Die
Credentials gelten eine Stunde.

**5 — STS prüft die Trust Policy der authenticated Role.**
Der Identity Pool kennt zwei Rollen: eine für angemeldete Nutzer und eine für
Gäste. Die Gastrolle ist enger gefasst — das ist der Mechanismus, mit dem eine
App auch ohne Anmeldung eine begrenzte Funktion anbieten kann.

**6 und 7 — Die IAM Policy schneidet den Zugriff auf den eigenen Prefix zu.**
In der Policy steht `${cognito-identity.amazonaws.com:sub}` als Teil des
S3-Pfads. Beim Auswerten setzt IAM dort die Identity ID des aufrufenden Nutzers
ein — jeder Nutzer bekommt dieselbe Policy und trifft trotzdem einen anderen
Ordner. Die Trennung wird von S3 durchgesetzt, nicht von der App. Eine
manipulierte App-Version ändert daran nichts.

**Verworfen — der eingebettete Access Key.**
Ein Schlüssel in einer verteilten App ist kein Geheimnis. Er lässt sich aus dem
Binary extrahieren, gilt für alle Nutzer gleich und erlaubt keine Trennung
zwischen ihnen.

## Prüfungs-Kernsatz

**User Pool sagt, wer du bist; Identity Pool sagt, was du in AWS darfst — und
die Trennung der Nutzerordner steht in der IAM-Policy, nicht im App-Code.**

## Abgrenzungen

- **User Pool ↔ Identity Pool:** Authentifizierung gegen Autorisierung. Wer nur
  einen Login und eine eigene Backend-API braucht, kommt mit dem User Pool
  allein aus. Der Identity Pool wird erst nötig, wenn der Client **direkt**
  AWS-Dienste aufruft — S3, DynamoDB, IoT Core.
- **Karte 42 ↔ Karte 41:** Auf Karte 41 holt eine **Maschine** temporäre
  Credentials (Instance Profile, Roles Anywhere), hier ein **Endnutzer** über
  einen Identity Pool. Beide Wege enden bei STS. Der Unterschied liegt im
  Nachweis: Instanz-Metadaten oder Zertifikat gegen JWT eines Nutzers.
- **Identity Pool ↔ API Gateway Authorizer:** Beide verwerten User-Pool-Tokens.
  Der Cognito Authorizer schützt eine **eigene API**, der Identity Pool öffnet
  **AWS-Dienste direkt**. Wer eine API zwischen App und S3 hat, braucht keinen
  Identity Pool.
- **Cognito ↔ IAM Identity Center (Karte 48):** Cognito ist für App-Endnutzer
  ("Kunden"), Identity Center für Mitarbeiter mit Zugriff auf AWS-Accounts.

## Klassiker-Fallen

- **`sub` mit `sub` verwechseln.** Die häufigste Falle dieser Karte: Der Wert in
  `${cognito-identity.amazonaws.com:sub}` ist die Identity ID aus dem Identity
  Pool, **nicht** der `sub`-Claim des Nutzers im User Pool. Wer den
  User-Pool-`sub` im Bucket-Pfad verwendet, baut eine Policy, die nie zutrifft.
- **Identity Pool auch dann einsetzen, wenn eine API dazwischen liegt.** Läuft
  der Upload über API Gateway und Lambda, reicht das User-Pool-Token für die
  Autorisierung; die Lambda-Funktion hat ihre eigene Execution Role. Der
  Identity Pool ist dann überflüssige Komplexität.
- **Bucket Policy statt Rollen-Policy.** Der Zuschnitt pro Nutzer gehört in die
  Policy der authenticated Role. Eine Bucket Policy kennt die Identity ID des
  Aufrufers nicht in derselben Form und skaliert nicht auf 200.000 Nutzer.
- **Guest-Zugriff vergessen.** Ein Identity Pool kann unauthentifizierte
  Identitäten zulassen. Ist das versehentlich aktiv, gilt die Gastrolle für
  jeden — auch für den, der sich nie angemeldet hat.

## Faktencheck — Divergenzen zu älterem Kursmaterial

**"Hosted UI" heißt heute "Managed Login".** Der AWS Security Blog zum Thema
wurde am 08.10.2025 auf die neue Bezeichnung umgestellt; die Doku beschreibt
Managed Login als den Satz gehosteter Seiten für Sign-up, Sign-in, MFA und
Passwort-Reset. "Hosted UI" existiert noch als Branding-Variante innerhalb von
Managed Login, ist aber nicht mehr der Oberbegriff. Kursmaterial verwendet
durchgehend die alte Bezeichnung.
Quelle: AWS Security Blog "Should I use managed login or create a custom UI in
Amazon Cognito?" (Stand 08.10.2025), Cognito Developer Guide.

**Die Identity ID ist nicht der User-Pool-`sub`.** Die AWS-Doku hebt das eigens
in einem Hinweiskasten hervor: Der im Objektschlüssel verwendete `sub`-Wert ist
die Identity ID aus dem Identity Pool, nicht der `sub`-Wert des Nutzers im User
Pool. Weil beide Werte "sub" heißen, ist die Verwechslung schwer zu sehen — die
Policy ist syntaktisch gültig und greift trotzdem nie.
Quelle: IAM User Guide, "Amazon S3: Allows Amazon Cognito users to access
objects in their bucket"; Cognito Developer Guide, "IAM roles".

**Der Enhanced Flow ist der Standard, der Basic Flow gilt als Risiko.** Enhanced:
`GetId` → `GetCredentialsForIdentity`, die Rollenauswahl liegt zentral im
Identity Pool. Basic (auch "classic"): `GetId` → `GetOpenIdToken` →
`AssumeRoleWithWebIdentity`, die Rollenauswahl liegt in der App. AWS bezeichnet
Enhanced als die sicherste Wahl mit dem geringsten Entwicklungsaufwand und
weist darauf hin, dass der Basic Flow die clientseitige Logik der Rollenauswahl
offenlegen kann. Älteres Material zeigt oft noch den dreistufigen Ablauf als
Normalfall.
Quelle: Cognito Developer Guide, "Identity pools authentication flow" und
"Security best practices for Amazon Cognito identity pools".

## Nicht bestätigt

Nichts auf dieser Karte stützt sich auf eine einzelne Drittquelle.

Nicht auf die Karte genommen: eine Aussage darüber, ob der Basic Flow
mittlerweile für neue Identity Pools abgeschaltet ist. Die AWS-Doku beschreibt
ihn weiterhin und rät lediglich davon ab; ein Abkündigungsdatum ließ sich nicht
finden. Auf der Karte steht deshalb "Enhanced Flow: zwei Aufrufe" als Aussage
über den empfohlenen Weg, nicht über den einzig möglichen.

## Bewusste Vereinfachungen im Diagramm

- **Der Rückfluss der Credentials ist nicht eigens gezeichnet.** Die Pfeile 3
  und 4 zeigen die Anforderung; dass Tokens und Credentials zurückkommen, ist
  darin implizit.
- **Die App ruft S3 direkt auf, nicht "über" die Policy.** Im Diagramm führt der
  Weg von der Policy zu S3, weil die Karte erklärt, *wodurch* der Zugriff
  begrenzt wird. Tatsächlich signiert die App den S3-Aufruf selbst mit den
  erhaltenen Credentials; die Policy wird bei der Auswertung herangezogen.
- **`GetId` und `GetCredentialsForIdentity` sind als eine Beziehung
  dargestellt**, obwohl es zwei API-Aufrufe sind. Beide stehen als Zeilen in der
  Identity-Pool-Box, um die Reihenfolge sichtbar zu halten, ohne einen zweiten
  Pfeil zwischen denselben Boxen zu zeichnen.
- **Die guest Role ist nur als Zeile erwähnt, nicht als Box.** Sie gehört zum
  Mechanismus, spielt im Szenario aber keine aktive Rolle.

## Farbkonventionen dieser Karte

Zweite Karte nach der festgeschriebenen Konvention, keine Neuvergabe:

- **Teal #0F7C8C** — Regel- und Konfigurationsinstanz: User Pool, Identity Pool,
  IAM Policy. Die drei Teal-Boxen sind genau die Stellen, an denen konfiguriert
  wird, wer was darf.
- **Navy #232F3E** — Eintrittspunkt und Account-Grenze: STS und die
  authenticated Role.
- **Blau #2E6BE6** — die Mobile App als User/Client, nach Stil-Guide.
- **Grün #3F8624** — S3 als Ziel.
- **Grau #9A9A9A gestrichelt** — Google als externer IdP. Gestrichelt nach
  Stil-Guide-Regel "extern".
- **Rot #C7161D** — verworfener Pfad: der eingebettete Access Key, mit rotem X.
- **Gold** kommt nicht vor: keine Kostendimension im Szenario.
