---
nr: 48
title: "IAM Identity Center · Permission Sets über 30 Accounts"
services:
  - AWS IAM Identity Center
  - AWS Organizations (SCP)
  - AWS STS
  - Externer IdP (Entra ID / Okta) via SCIM
domains:
  - D1
signalwords:
  - "centrally manage access across multiple accounts"
  - "single sign-on for workforce users"
  - "existing corporate identity provider"
  - "deprovision immediately when an employee leaves"
  - "no long-term credentials"
  - "least privilege across the organization"
  - "restrict regions even for administrators"
assets:
  - battle_card_48.svg
  - battle_card_48.png
  - battle_card_48.pdf
status_note: |
  QC (qc.py): 0 Befunde. 8 Boxen, 42 Texte, 18 Segmente, 5 Badges.
  Segmente aufgeschlüsselt (R5): 18 gemeldet − 10 Phantom-Segmente aus
  5 Marker-Definitionen (je 2) = 8 echte Segmente: 5 Ablaufpfeile +
  1 verworfener Pfad + 2 Striche des roten X.
  Badges aufgeschlüsselt (R6): 5 gezählt. Das rote X (r=20, weiß gefüllt,
  roter Rand) wurde von Prüfung (d) korrekt ausgenommen.

  Korrekturrunden: keine. Alle 40 gemessenen Texte lagen beim ersten
  Durchlauf innerhalb ihrer Boxgrenzen, der Geometrieplan meldete
  0 Kollisionen im ersten Durchgang. Zwei Titel- und zwei
  Untertitel-Varianten wurden gemessen und die jeweils passendere gewählt
  (Titel B 1239,0 px, Untertitel A 951,3 px).

  Render-Sanity (R7): neun geometrisch abgeleitete Freizonen, am Ende alle
  rein weiß. Eine Zone musste nachgeschnitten werden, und die Ursache ist
  für künftige Batches wichtig:
    Zone C (x800..1070, y368..466) meldete 1418 nicht-weiße Pixel bei
    x 884,7..914,7. Erste Annahme "der Pfad bei x=900 mit stroke-width 3"
    erklärt nur 3 px Breite, gemessen waren 30 px. Nachgerechnet:
    **Marker skalieren mit stroke-width.** markerWidth=10 bei
    stroke-width=3 ergibt 30 px Markerbreite im Nutzerraum, zentriert auf
    die Pfadachse — also x 885..915. Berechnet und gemessen stimmen exakt
    überein; kein Grafikfehler. Zone in C1/C2/C3 mit 20 px Abstand zur
    Pfadachse neu geschnitten, danach 0 nicht-weiße Pixel.
    Diese Marker-Geometrie wurde in den Karten 46 und 47 beim Zonenschnitt
    nicht mitgerechnet. Dort fiel es nicht auf, weil die betroffenen Zonen
    weiter von Pfadenden entfernt lagen. Für Batch 11 gehört sie in die
    Zonenplanung.
  Alle sechzehn geprüften Palettenfarben im PNG nachweisbar (Teal 9866 px,
  Navy 9219 px, Blau 4285 px, Rot-Pink 5513 px, Rot 5688 px, Füllungen und
  dunkle Textfarben je > 0). Fünf Rahmenfarben sind sauber getrennt.

  Schwarz-Prüfung (R13): reines Schwarz (0,0,0) = 0 px.

  Footer von Hand gemessen (R3): 1252,1 px. Unter Stil-Guide (~1420 px)
  und unter der R3-Warnschwelle (~1400 px).

  Sichtprüfung (R8): versucht. Zurück kam ein Bildobjekt ohne für mich
  lesbaren Inhalt — dasselbe Muster wie bei den Karten 46 und 47 sowie in
  Batch 8 und 9. Rechnerisch geprüft ist nicht gesehen. Die Karte ist
  visuell unbestätigt.

  Offener Punkt zur Farbkonvention: siehe Abschnitt "Farbkonventionen
  dieser Karte" — Rot-Pink #B0084D ist doppelt belegt.
---

## Szenario

Ein Maschinenbauer mit 200 Mitarbeitern betreibt 30 AWS-Accounts. Der
gewachsene Zustand: IAM-User in jedem Account, geteilte Zugangsdaten für
Teamkonten, Access Keys in Konfigurationsdateien auf Entwicklerrechnern.

Beim letzten Austritt fiel auf, dass das Konto der Person drei Wochen später
in mehreren Accounts noch aktiv war — niemand hatte eine Liste, in welchen.
Die interne Revision fordert: eine Identität pro Person, ein Entzug, überall
sofort wirksam. Zusätzlich soll in den Produktions-Accounts niemand
Ressourcen außerhalb der freigegebenen Regionen anlegen können — auch kein
Administrator und auch nicht der Root-User.

## Ablauf

**1 — Der externe IdP bleibt führend.** Entra ID (oder Okta, Ping,
JumpCloud, Google Workspace) bleibt das System, in dem Personalprozesse
laufen. SCIM synchronisiert Nutzer und Gruppen nach Identity Center;
deaktiviert die Personalabteilung jemanden im IdP, verschwindet der Zugang
automatisch. Das ist die Antwort auf die Drei-Wochen-Lücke: Es gibt nur noch
eine Stelle, an der ein Austritt eingetragen werden muss.

**2 — Organization Instance im Management Account.** Identity Center gibt es
in zwei Ausprägungen, und die Unterscheidung ist prüfungsentscheidend. Eine
**Organization Instance** wird im Management Account der Organization
aktiviert, unterstützt alle Funktionen und ist die einzige, die
Multi-Account Permissions kann. Eine **Account Instance** ist an einen
einzelnen Account und eine Region gebunden und dient ausschließlich dazu,
unterstützte AWS-Anwendungen für einen isolierten Nutzerkreis
bereitzustellen. Wer vor dem 15.11.2023 aktiviert hat, hat automatisch eine
Organization Instance. Der laufende Betrieb kann per Delegated
Administration an einen Member Account (typisch: ein Identity- oder
Shared-Services-Account) übergeben werden, damit niemand für Alltagsaufgaben
den Management Account betreten muss.

**3 — Ein Permission Set, auf 30 Accounts zugewiesen.** Ein Permission Set
ist eine Vorlage aus IAM-Policies: bis zu zehn AWS-managed oder
customer-managed Policies plus eine Inline-Policy, optional mit einer
Permissions Boundary. Das Limit von zehn ist über Service Quotas anpassbar.
Statt dieselbe Rolle 30-mal von Hand anzulegen, entsteht sie einmal als
Vorlage und wird in einer Operation auf alle Accounts verteilt.

**4 — Im Zielaccount entsteht eine echte IAM-Rolle.** Das ist der Punkt, an
dem die meisten Erklärungen zu vage werden: Identity Center legt bei der
Zuweisung eine IAM-Rolle im Zielaccount an, benannt nach dem Muster
`AWSReservedSSO_<PermissionSetName>_<Suffix>` unterhalb von
`aws-reserved/sso.amazonaws.com/<region>/`. Der Nutzer nimmt diese Rolle über
Identity Center an und bekommt temporäre Credentials von STS — er muss die
Rollen-ARN nie kennen. Es gibt keine Access Keys mehr, die in einer
Konfigurationsdatei liegen könnten.

**5 — Der SCP ist der Deckel, nicht das Werkzeug.** Die Region-Sperre gehört
nicht ins Permission Set, sondern in eine Service Control Policy an der
Produktions-OU. SCPs definieren die maximal verfügbaren Rechte für alle
IAM-Identitäten eines Accounts — einschließlich der von Identity Center
erzeugten Rollen und einschließlich des Root-Users des Member Accounts. Ein
SCP **gewährt niemals** Rechte, er begrenzt nur.

Die effektiven Rechte sind der Schnitt aus Identity-Policy, Permissions
Boundary und SCP; ein expliziter Deny an einer beliebigen Stelle gewinnt
immer. Ein Permission Set kann also nie mehr erlauben, als der SCP durchlässt
— und genau deshalb ist die Region-Sperre dort robust, wo eine Policy im
Permission Set von einem Administrator umgeschrieben werden könnte.

**Verworfen — IAM-User pro Account.** 200 Personen mal 30 Accounts ergibt
bis zu 6.000 Konten mit eigenen Passwörtern und Access Keys, ohne zentrale
Sicht darauf, wer wo Zugang hat. Der Austritt muss 30-mal nachvollzogen
werden. Das ist die Ausgangslage des Szenarios, nicht eine Alternative dazu.

## Prüfungs-Kernsatz

**Identity Center gewährt, der SCP begrenzt.** Ein Permission Set kann nie
mehr erlauben, als der SCP durchlässt — und ein SCP erlaubt für sich genommen
gar nichts.

## Abgrenzungen

**48 ↔ 41:** Auf 41 holt sich eine **Maschine** temporäre Credentials
(Instance Profile, IAM Roles Anywhere). Auf 48 holt sich ein **Mitarbeiter**
temporäre Credentials über den Identity Store. Beide enden bei STS — das ist
die Gemeinsamkeit, die in Prüfungsfragen als Ablenkung dient.

**48 ↔ 42:** Cognito Identity Pools sind für **Endnutzer einer Anwendung**
(Kunden einer App). Identity Center ist für die **eigene Belegschaft**
(Workforce). Steht in der Frage "employees", "workforce", "corporate
directory" → Identity Center. Steht dort "app users", "customers", "sign up"
→ Cognito.

**Permission Set ↔ SCP ↔ Permissions Boundary:** Das Permission Set
**gewährt**. Der SCP **begrenzt auf Account- oder OU-Ebene** und trifft alle
Identitäten inklusive Root. Die Permissions Boundary **begrenzt eine einzelne
Rolle oder einen einzelnen User** und ist das Mittel, wenn man Entwicklern
erlauben will, selbst Rollen zu erzeugen, aber nur innerhalb eines Rahmens.

**Organization Instance ↔ Account Instance:** Multi-Account Permissions gibt
es ausschließlich in der Organization Instance. Eine Account Instance kann
das nicht — siehe "Klassiker-Fallen".

## Klassiker-Fallen

**"Ich nehme eine Account Instance, das ist einfacher."** Account Instances
unterstützen keine Multi-Account Permissions. Sie sind für isolierte
Anwendungsfälle gedacht: ein zeitlich begrenzter Test einer AWS-Anwendung,
ein Anwendungsfall ohne organisationsweite Einführung, ein abgetrennter
Nutzerkreis neben einer bestehenden Organization Instance, oder eine Lage,
in der man die eigene Organization gar nicht kontrolliert. Für 30 Accounts
ist es schlicht die falsche Bauform.

**"Member Accounts dürfen sich einfach eigene Instances anlegen."** Das
Freischalten von Account Instances für Member Accounts ist eine **einmalige
und nicht umkehrbare** Operation. Danach lässt sich die Erzeugung nur noch
per SCP eingrenzen, nicht mehr abschalten. Diese Einbahnstraße ist ein
beliebtes Detail für Fragen nach Governance-Konsequenzen.

**"Der SCP gibt der Rolle die Rechte."** Nein. SCPs gewähren nie. Ohne
Identity-Policy passiert nichts, egal wie großzügig der SCP ist.

**"Delegated Administration löst das Management-Account-Problem
vollständig."** Sie reduziert es. Bestimmte Aufgaben, insbesondere die
Zuweisung von Permission Sets an den Management Account selbst, bleiben
dort.

**"Ich weise Rechte einzelnen Personen zu."** AWS empfiehlt ausdrücklich die
Zuweisung an **Gruppen**. Beim Wechsel einer Person in ein anderes Team
genügt dann ein Gruppenwechsel, statt Zuweisungen in 30 Accounts
nachzuziehen.

## Faktencheck — Divergenzen zu älterem Kursmaterial

**AWS SSO wurde am 26.07.2022 in IAM Identity Center umbenannt.** Es ist
derselbe Dienst; der Name signalisiert die Einordnung in die IAM-Familie
statt "nur ein SSO-Werkzeug". Kursmaterial vor Mitte 2022 spricht
durchgängig von AWS SSO.
*Quelle: cloudquery.io/blog/aws-identity-center-guide,
hidekazu-konishi.com/entry/aws_iam_identity_center_setup_guide.html*

**Die alten Namespaces sind absichtlich unverändert geblieben — das ist
prüfungsrelevant.** Die CLI heißt weiterhin `aws sso`, `aws sso-admin`,
`sso-oidc` und `identitystore`; das CloudFormation-Präfix ist weiterhin
`AWS::SSO::*`; die Service-Linked Role heißt weiterhin
`AWSServiceRoleForSSO`. Bestehende Infrastruktur-als-Code funktioniert ohne
Umbenennung weiter. Wer aus dem neuen Namen auf neue API-Präfixe schließt,
liegt falsch.
*Quelle: hidekazu-konishi.com/entry/aws_iam_identity_center_setup_guide.html*

**AWS-managed Policy-Namen in diesem Bereich wurden mehrfach umgebaut.**
`AWSSSOMasterAccountAdministrator` wird nicht mehr veröffentlicht;
`AWSSSOMemberAccountAdministrator` existiert für delegierte
Admin-Operationen. Kursmaterial, das feste Policy-Namen nennt, altert hier
schnell — und produktiver IaC-Code sollte sie ohnehin nicht hart
verdrahten.
*Quelle: hidekazu-konishi.com/entry/aws_iam_identity_center_setup_guide.html*

**Die Unterscheidung Organization/Account Instance existiert erst seit dem
15.11.2023.** Wer davor aktiviert hat, hat eine Organization Instance.
Kursmaterial aus 2022 und früher kennt diese Zweiteilung gar nicht und
beschreibt Identity Center pauschal als "immer organisationsweit".
*Quelle: docs.aws.amazon.com/singlesignon/latest/userguide/organization-instances-identity-center.html*

**Delegated Administration kam 2022 hinzu.** Älteres Material stellt es so
dar, als müsse jede Identity-Center-Verwaltung im Management Account
stattfinden.
*Quelle: aws.amazon.com/blogs/security/getting-started-with-aws-sso-delegated-administration/*

**Trusted Identity Propagation ist neuer als die meisten Kursunterlagen.**
Die Nutzeridentität lässt sich an nachgelagerte AWS-Dienste durchreichen, so
dass dort auf die Person statt auf eine technische Rolle autorisiert und
auditiert wird — relevant etwa bei Redshift oder Amazon Q.
*Quelle: towardsthecloud.com/blog/aws-iam-identity-center*

**Identity Center kostet nichts.** Es fallen nur Kosten für angebundene
Dienste an, etwa KMS bei kundenverwalteten Schlüsseln. Wer Identity Center
aus Kostengründen gegen IAM-User abwägt, wägt gegen null ab.
*Quelle: towardsthecloud.com/blog/aws-iam-identity-center,
cloudquery.io/blog/aws-identity-center-guide*

**Permission-Set-Suche nach Namen kam am 11.11.2024.** Ein kleines Detail,
aber ein Beleg dafür, dass der Dienst laufend erweitert wird.
*Quelle: aws.amazon.com/about-aws/whats-new/2024/11/aws-iam-identity-center-search-permission-name*

## Nicht bestätigt

**Die Aussage "IAM Identity Center ist in allen kommerziellen Regionen,
GovCloud und China verfügbar"** stammt aus einer Drittquelle
(towardsthecloud.com) und wurde nicht gegen die AWS-Regionstabelle
gegengeprüft. Sie steht deshalb nicht auf der Karte.

**Die Zahl "6.000 Konten"** (200 × 30) im Szenario ist eine rechnerische
Zuspitzung des Ausgangszustands, keine belegte Praxis. Auf der Karte steht
nur "200 × 30 Konten" als Szenario-Annahme.

**Die konkrete Quota-Grenze für Policies pro Permission Set** ist mit zehn
AWS-managed/customer-managed Policies plus einer Inline-Policy durch die
AWS-Dokumentation gedeckt. Ob und wie weit sich das per Service Quotas
tatsächlich anheben lässt, nennt die Dokumentation nicht in Zahlen — auf der
Karte steht deshalb "bis 10 Policies + 1 inline" ohne Zusatz.

**Die Wirksamkeit von SCPs gegenüber dem Root-User des Management Accounts**
ist ein bekannter Sonderfall: SCPs treffen den Root-User von *Member
Accounts*, der Management Account selbst ist historisch anders behandelt
worden. Die Karte sagt "gilt auch für Root" im Kontext der Produktions-OU,
also für Member Accounts. Wer den Management-Account-Sonderfall braucht,
prüft die Organizations-Dokumentation direkt.

## Bewusste Vereinfachungen im Diagramm

**Der Identity Store von Identity Center ist nicht als eigenes Element
gezeichnet.** Er steckt in der Identity-Center-Box. Fachlich sind
Identitätsquelle (IdP), Identity Store und Permission-Set-Verwaltung drei
Ebenen; die Karte zeigt zwei, weil die dritte den Prüfungskern nicht
schärft.

**"30 Accounts" steht als eine Box**, obwohl in jedem einzelnen Account eine
eigene Rolle entsteht. Dreißig Boxen wären unlesbar; die Zeile "IAM-Rolle je
Account" trägt die Information.

**Der SCP ist mit einem Pfeil nach oben zu Identity Center gezeichnet.** Das
ist eine didaktische Verkürzung: Ein SCP wirkt nicht auf Identity Center,
sondern auf die Accounts und die dort entstehenden Rollen. Der Pfeil mit dem
Label "deckelt alles" soll die Begrenzungsrichtung ausdrücken, nicht einen
Datenfluss. Fachlich präziser wäre ein Pfeil auf die Accounts-Box gewesen —
der hätte aber die Kette 3→4 gekreuzt.

**Delegated Administration fehlt im Bild.** Sie steht im Fließtext, weil sie
für die Praxis wichtig ist, hätte aber eine neunte Box gekostet.

**Die Account Instance ist nicht gezeichnet.** Nach Abstimmung mit Oktay
steht auf der Karte nur ein verworfener Pfad (IAM-User); die Account Instance
wird ausschließlich in dieser `.md` behandelt. Der Footer nennt sie trotzdem,
weil die Aussage "Account Instance kann kein Multi-Account" prüfungsrelevant
genug ist, um auf dem Bild zu erscheinen.

## Farbkonventionen dieser Karte

**Blau #1F5FA8** — externer IdP. Der Stil-Guide führt Blau für externe
Systeme und Clients; ein Unternehmens-IdP außerhalb von AWS passt dort
hinein.

**Teal #0F7C8C** — IAM Identity Center und Permission Set. Regel- und
Konfigurationsinstanz nach der Batch-9-Konvention.

**Navy #232F3E** — 30 Accounts (Account-Grenze) und STS
(Infrastruktur-Eintrittspunkt). Beide Bedeutungen sind in Batch 9 für Navy
festgeschrieben; STS steht dort namentlich.

**Rot-Pink #B0084D** — Service Control Policy. Auf Wunsch von Oktay nach dem
Stil-Guide gesetzt.

**⚠ Offener Punkt: Rot-Pink ist doppelt belegt.** Die Batch-9-Konvention
legt #B0084D auf **relationale Datenbank-Engines** fest (RDS, Aurora,
Redshift, Oracle); der Stil-Guide führt denselben Ton unter **SCP**. Auf
Karte 48 kollidiert nichts, weil keine Datenbank vorkommt. Sobald eine Karte
einen SCP und eine relationale Engine gemeinsam zeigt, braucht einer der
beiden einen eigenen Ton. Das reiht sich in die bereits offenen Fälle ein:
Athena gegen Redshift Spectrum (beide Lila) und Neptune gegen Teal.
Nicht stillschweigend umgedeutet, sondern hier dokumentiert.

**Rot #C7161D** — ausschließlich der verworfene Pfad: Box-Rand der
IAM-User-Option und das rote X.

**Kein Gold.** Die IAM-User-Option scheitert nicht an Kosten, sondern an
Betrieb und Nachvollziehbarkeit.

**Keine neue Farbkategorie eingeführt.**
