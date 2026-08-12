---
cardNumber: 100
slug: ram-shared-subnets-multi-account
title: "Ein Netz für viele Accounts"
services: ["AWS Resource Access Manager", "Amazon VPC", "AWS Organizations"]
domains: ["D1", "D4"]
correctAnswer: "D"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/ram/latest/userguide/what-is.html"
  - "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-sharing.html"
  - "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-share-limitations.html"
  - "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-share-billing.html"
  - "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-sharing-share-subnet-working-with.html"
  - "https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html"
  - "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-share-prerequisites.html"
  - "https://docs.aws.amazon.com/cli/latest/reference/ram/create-resource-share.html"
---

## Die Grundidee zuerst

Fünf Teams brauchen Platz zum Arbeiten. Zwei Arten, ihnen den zu geben.

**Weg eins:** Fünf freistehende Häuser. Jedes bekommt einen eigenen Stromanschluss, eine eigene Zufahrt, eine eigene Mülltonne und einen eigenen Briefkasten. Klingt sauber — bis die Bewohner miteinander zu tun haben. Dann braucht Haus A eine Verbindungstür zu B, zu C, zu D, zu E, und B zu C, zu D, zu E, und so weiter. Bei fünf Häusern sind das **zehn Türen**, die jemand bauen, beschriften und pflegen muss. Und weil die Häuser unabhängig gebaut wurden, hat die Hälfte davon dieselbe Hausnummer.

**Weg zwei:** Ein Bürogebäude. Ein Stromanschluss, eine Tiefgarage, eine Zufahrt. Jedes Team mietet eine Etage, stellt seine eigenen Möbel hinein, schließt seine eigene Tür ab und darf die Möbel der Nachbarn weder sehen noch anfassen. Die Hausverwaltung bleibt für Aufzug, Strom und Zufahrt zuständig — und nur für die.

AWS RAM baut das Bürogebäude.

Der entscheidende Satz steht schon in der Metapher: **Geteilt wird die Fläche, nicht die Kontrolle.** Wer eine Etage mietet, wird dadurch nicht Hausverwalter. Und wer das Gebäude besitzt, darf nicht in fremde Schreibtische schauen.

Halte für den Rest des Textes fünf Team-Accounts in einer Organization im Kopf, dazu einen sechsten: den Netzwerk-Account.

## Was es eigentlich ist — der Resource Share

Kein Netzwerkkonstrukt. Kein Tunnel, keine Verbindung, kein Peering. Ein **Resource Share** ist ein Datensatz mit drei Angaben: was, an wen, mit welchem Recht.

```bash
aws ram create-resource-share \
  --region eu-central-1 \
  --name netz-shared-subnets \
  --resource-arns \
      arn:aws:ec2:eu-central-1:111122223333:subnet/subnet-0a1b2c3d \
      arn:aws:ec2:eu-central-1:111122223333:subnet/subnet-4e5f6a7b \
  --principals arn:aws:organizations::111122223333:ou/o-exampleorgid/ou-root1-teams42 \
  --no-allow-external-principals
```

Lies das von oben nach unten. `--region` legt fest, wo der Share lebt; er kann nur regionale Ressourcen aus derselben Region enthalten. `--resource-arns` sind die Subnetze. `--principals` ist die Zeile, um die es geht: Dort steht **eine Organisationseinheit**, keine Liste von Konto-IDs. Kommt nächsten Monat ein sechstes Team in diese OU, hat es das Netz, ohne dass jemand den Share anfasst.

`--no-allow-external-principals` schließt Konten außerhalb der Organization aus. Für Subnetze ist das ohnehin die einzig mögliche Einstellung — dazu gleich mehr.

Was fehlt, ist die Berechtigung. Gibst du keine `--permission-arns` an, hängt RAM automatisch die Standardversion der Managed Permission für jeden enthaltenen Ressourcentyp an. Je Ressourcentyp genau eine.

Nimm dir einen Moment für das, was dieser Befehl **nicht** ist. Er legt keine Ressource an, er kopiert nichts und er verändert die Subnetze nicht. Er ändert auch nicht die Kontingente oder Rechte im Konto, das die Subnetze besitzt. Der Owner behält die Ressourcen vollständig — der Share ist eine Aussage über Sichtbarkeit und Nutzbarkeit, nichts weiter. Deshalb ist er auch in Sekunden wieder aufgehoben, ohne dass irgendwo etwas abgebaut werden müsste.

## Der Weg durch die Karte

### Netzwerk-Account — einmal bauen

Ein Konto besitzt die VPC. Dort liegen die Subnetze, das NAT Gateway, die Route Tables, die Network ACLs, die Gateway- und Interface-Endpoints, die Route-53-Resolver-Endpunkte, das Internet Gateway und die Direct-Connect-Anbindung. Die Dokumentation zählt genau diese Liste als Verantwortung des Owners auf.

Gebaut wird das einmal. Von einem Team, das Netze kann.

Genau darin liegt der organisatorische Gewinn, der in Prüfungsfragen als „separation of duties" auftaucht: Die IP-Planung, das Routing, die Anbindung ans Rechenzentrum und die Firewall-Struktur sind Spezialwissen. Wenn jedes Anwendungsteam sein eigenes Netz baut, wird dieses Wissen fünfmal halb vorhanden sein. Hier ist es einmal ganz vorhanden — und die Anwendungsteams müssen es nicht haben, um arbeiten zu können.

### Badge 1 — Freigeben ist nicht Verbinden

Zwei Voraussetzungen, bevor überhaupt etwas geteilt werden kann: Owner und Participant müssen von AWS Organizations verwaltet werden, und im Management-Account muss das Teilen innerhalb der Organization eingeschaltet sein.

Ist das erledigt, entfällt der Einladungsprozess. Außerhalb der Organization verschickt RAM eine Einladung, die der Empfänger annehmen muss; innerhalb nicht. Das Subnetz ist einfach da.

**Und jetzt der Unterschied, der die halbe Karte trägt:** Peering und Transit Gateway *verbinden* zwei Netze. RAM verbindet nichts. Es macht ein bestehendes Netz in einem anderen Konto sichtbar und benutzbar. Es entsteht kein Pfad — es entsteht eine Sichtbarkeit.

### Resource Share — Principal ist die OU

Der goldene Kasten ist Governance, keine Datenleitung. Durch ihn fließt kein einziges Paket. Er beschreibt eine Erlaubnis.

Die Managed Permission legt fest, was die Principals mit den Ressourcen tun dürfen. Wichtig ist, wie das wirkt: Bei kontoübergreifender Freigabe sind die Rechte am Share die **Obergrenze** dessen, was im Empfängerkonto überhaupt vergeben werden kann. Die Administratorin dort muss ihren Rollen und Nutzern den Zugriff anschließend noch per identitätsbasierter Policy erteilen — und sie kann dabei nie mehr geben, als am Share steht.

Das Bild dazu: Der Hausverwalter gibt der Firma einen Generalschlüssel für ihre Etage. Wer davon eine Kopie bekommt, entscheidet die Firma. Türen, die der Generalschlüssel nicht öffnet, kann auch die Firma niemandem aufsperren.

### Badge 2 — was im Team-Account ankommt

Nichts, das nach Fremdbesitz aussieht. Genau das ist der Punkt.

Es gibt keine Benachrichtigung, keinen Annahmedialog, keinen zusätzlichen Menüpunkt. Ein Entwickler im Team-Account öffnet die VPC-Konsole und sieht Subnetze, in die er starten kann. Ob sie ihm gehören, ist für seinen Arbeitsalltag zunächst irrelevant — und das ist die Absicht hinter der Konstruktion.

### Team-Account — sieht die Subnetze wie eigene

Die geteilten Subnetze erscheinen in der VPC-Konsole des Participants und in den Antworten der VPC-API, als lägen sie dort. Es gibt keinen zweiten Ort zum Nachsehen, keinen ARN, den man sich merken muss, keine Rolle, in die jemand wechselt.

Genau hierin unterscheidet sich RAM von einer ressourcenbasierten Policy: Was per Policy freigegeben wurde, muss man kennen und explizit ansprechen. Was per RAM geteilt wurde, findet man dort, wo man es sowieso sucht.

Wer wirklich der Eigentümer ist, verrät die Spalte **Owner** in der Subnetzliste.

### Badge 3 — eigene Ressourcen, eigene Grenze

Der letzte Pfeil führt nicht zu einem weiteren Dienst, sondern zu einer Zuständigkeit. Ab hier hört der Netzwerk-Account auf, und das Team fängt an.

Das ist die Stelle, an der die Metapher vom Bürogebäude trägt: Der Aufzug gehört der Verwaltung, die Schreibtische gehören der Firma, und niemand muss darüber verhandeln, weil die Grenze zwischen beidem technisch gezogen ist und nicht durch eine Absprache.

### Eigene Ressourcen — EC2, RDS und Lambda, fremde bleiben unsichtbar

Das Team startet seine Instanzen, Datenbanken und Funktionen in den geteilten Subnetzen und verwaltet sie selbst. Ressourcen anderer Participants oder des Owners sieht und ändert es nicht.

Die Trennung ist beidseitig: Der Owner kann Netzwerkschnittstellen und Security Groups der Participants zwar *beschreiben*, aber nicht damit arbeiten — er kann keine Instanz mit einer Security Group der Participants starten. Und was ein Participant anlegt, zählt gegen die Kontingente **seines** Kontos, nicht gegen die des Owners.

### Das freie Label — Subnetze nur innerhalb der Organization

Der Satz über der Kette ist keine Empfehlung, sondern eine Schranke des Ressourcentyps: VPC-Subnetze lassen sich ausschließlich mit Konten oder Organisationseinheiten derselben Organization teilen. Subnetze einer Default-VPC gar nicht.

Viele andere Ressourcentypen darf man an beliebige Konto-IDs freigeben. Dieser nicht.

### Der rote Pfad — VPC je Team plus Peering-Mesh

Fünf VPCs bedeuten fünf NAT Gateways, fünf Sätze Interface Endpoints, fünf Direct-Connect-Anbindungen und eine IP-Planung, die über fünf unabhängig gebaute Netze konfliktfrei bleiben muss. Dazu die zehn Peering-Verbindungen aus der Metapher.

Das ist kein Fehler. Es ist nur fünfmal dasselbe.

Und es skaliert schlecht in die falsche Richtung. Die Peering-Verbindungen wachsen quadratisch: fünf Konten brauchen zehn, zehn Konten schon fünfundvierzig. Die IP-Planung wird mit jedem neuen Team schwieriger, weil überlappende Adressbereiche ein Peering unmöglich machen — und niemand merkt den Konflikt beim Anlegen, sondern erst Monate später, wenn zwei Teams miteinander sprechen sollen. Der rote Pfad auf der Karte trägt deshalb die Rollenfarbe Quelle: Eine eigene VPC je Team ist eine legitime Bauform. Für dieses Szenario ist sie die teure.

## Die entscheidende Unterscheidung

Die Achse dieser Karte ist die Grenze zwischen Owner und Participant. Wer sie kennt, beantwortet die meisten RAM-Fragen ohne Nachdenken:

| | Owner (Netzwerk-Account) | Participant (Team-Account) |
|---|---|---|
| Subnetze, Route Tables, NACLs | anlegen, ändern, löschen | nur beschreiben |
| NAT Gateway, Internet Gateway | anlegen und verwalten | weder anlegen noch beschreiben |
| Transit Gateway anhängen | ja | nein |
| Eigene Instanzen, RDS, Lambda | ja | ja |
| Fremde Ressourcen | nur beschreiben | nicht einmal das |
| Flow Logs | für das Subnetz und alle ENIs | nur für eigene ENIs |
| Rechnung | NAT Gateway, Endpoints, öffentliche IPv4 | eigene Ressourcen, Transfer zwischen AZs |

Die letzte Zeile wird oft übersehen und entscheidet Kostenfragen: Der Owner zahlt die geteilte Infrastruktur, jeder Participant seine eigenen Ressourcen. Datenverkehr **innerhalb derselben Availability Zone** ist kostenlos, unabhängig davon, wem die beteiligten Ressourcen gehören.

## Die ehrliche Feinheit

Drei Dinge, die Tutorials weglassen.

**Erstens die Default Security Group.** Sie gehört dem Owner. Ein Participant kann damit keine Instanz starten — er muss eine eigene Security Group anlegen. Das ist die Überraschung des ersten Tages, und sie sieht aus wie ein Rechteproblem. Umgekehrt darf ein Participant in seinen eigenen Regeln durchaus auf fremde Gruppen verweisen.

**Zweitens die Availability Zones.** `eu-central-1a` bezeichnet in zwei Konten nicht zwangsläufig dasselbe Rechenzentrum — AWS verteilt die Namen je Konto unterschiedlich. Verbindlich ist allein die **AZ ID**, etwa `euc1-az1`. Wer die ignoriert, plant eine hochverfügbare Verteilung und landet mit allem in derselben Zone, ohne dass jemand einen Fehler sieht.

**Drittens die Reichweite der Owner-Kontrolle.** „Der Owner behält das Netz" stimmt — mit einer Einschränkung. Hebt er die Freigabe auf, laufen bestehende Ressourcen der Participants weiter. Neue dürfen sie nicht mehr anlegen, bestehende aber ändern und löschen. Und solange dort noch etwas steht, kann der Owner weder das Subnetz noch die VPC löschen. Er hat die Kontrolle über das Netz, nicht über den Zeitpunkt des Aufräumens.

Dazu die Zahlen, die in Kapazitätsfragen auftauchen: Standardmäßig lassen sich die Subnetze einer VPC mit **100** verschiedenen Participant-Accounts teilen, und mit einem einzelnen Konto **100** Subnetze. Beide Werte sind erhöhbar. Alle übrigen VPC-Kontingente gelten unverändert auch für geteilte Subnetze.

**Viertens, und das trifft Betriebsteams:** Tags der VPC und der darin liegenden Ressourcen werden nicht mitgeteilt. Wer seine Kostenstellen oder seine Umgebungskennzeichnung über Tags führt, findet sie im Participant-Account nicht wieder. Auch die Sicht auf Flow Logs ist geteilt: Ein Participant kann Flow Logs für seine eigenen Netzwerkschnittstellen anlegen, aber nicht für das Subnetz — und der Owner sieht die Flow Logs des Participants seinerseits nicht. Für eine kontoübergreifende Netzanalyse braucht es also eine Absprache, nicht nur eine Freigabe. Das ist die Kehrseite der sauberen Trennung: Sie trennt auch dort, wo man gemeinsam hinschauen möchte.

## Syntax lesen — der kontoübergreifende Security-Group-Verweis

Ein Participant darf in seinen eigenen Regeln eine Security Group referenzieren, die einem anderen Konto gehört. Die Schreibweise sieht klein aus und ist der Beleg dafür, dass hier wirklich ein Netz geteilt wird und nicht zwei Netze verbunden sind:

```
123456789012 / sg-0a1b2c3d4e5f
│              │
│              └─ die Security Group im fremden Konto
└─ die Konto-ID des Eigentümers
```

In getrennten, gepeerten VPCs geht so ein Verweis nur unter zusätzlichen Bedingungen und nie über Regionsgrenzen. Hier ist es dieselbe VPC — deshalb funktioniert das implizite Routing zwischen den Subnetzen ohne jedes weitere Konstrukt.

Das ist der technische Kern des Szenarios: **Zwei Instanzen aus zwei verschiedenen Konten liegen im selben Subnetz und sprechen direkt miteinander.**

## Was du dadurch nicht baust

- kein NAT Gateway je Team, sondern eines
- keine fünf Sätze Interface Endpoints
- keine zehn Peering-Verbindungen und keine Route-Table-Pflege dafür
- kein Transit Gateway, nur um Teams desselben Unternehmens zu verbinden
- keine kontoübergreifende IP-Planung über fünf unabhängige VPCs
- keine Cross-Account-Rolle, in die jemand wechseln müsste, um ein Subnetz zu sehen
- keine Einladung, die jemand annehmen muss

Übrig bleiben: eine VPC, ein Resource Share und eine Organisationseinheit als Principal.

## Wenn du dir eine Sache merkst

**Der Owner behält das Netz, der Participant behält seine Ressourcen — RAM teilt eine Ressource, statt Netze zu verbinden.**

VPC Peering und Transit Gateway verbinden getrennte Netze; hier gibt es nur eines. Eine Cross-Account-IAM-Rolle gibt Zugriff über einen Rollenwechsel; RAM macht die Ressource im fremden Konto sichtbar, ohne dass jemand das Konto wechselt. Und AWS Organizations ist die Voraussetzung, nicht das Werkzeug: Es liefert die Kontenstruktur, RAM die Freigabe. Wer diese drei Sätze im Kopf hat, erkennt die richtige Antwort, bevor er die Optionen zu Ende gelesen hat.

## Prüfungsknackpunkte

**Signalwörter:** „multiple accounts share centrally managed subnets" plus „avoid duplicating network infrastructure per account". Kommt zusätzlich „resource share with an organizational unit" vor, ist die Frage eindeutig. Taucht „the owner keeps control of the VPC" auf, prüft die Frage die Owner-Participant-Tabelle.

**Die Isolationsfalle.** Eine Antwortoption behauptet, geteilte Subnetze hebelten die Kontotrennung aus. Falsch: Abrechnung, IAM-Grenze und die Sichtbarkeit eigener Ressourcen bleiben je Konto getrennt. Doppelte Infrastruktur ist nicht doppelte Isolation.

**Die Kostenfalle.** Wer nach den Einsparungen bei RAM selbst sucht, sucht falsch. Der Dienst kostet nichts extra. Gespart wird an den nicht mehrfach gebauten NAT Gateways, Endpoints und Anbindungen — und daran, dass Verkehr innerhalb derselben Availability Zone auch über Kontogrenzen hinweg kostenlos bleibt.

**A — VPC Peering zwischen allen Konten:** Verbindet getrennte Netze und wächst quadratisch. Bei fünf Konten sind das zehn Verbindungen, bei zehn Konten fünfundvierzig.

**B — Ein Transit Gateway als Sternverteiler:** Löst das Verbindungsproblem elegant, beseitigt aber nicht die fünf VPCs mit fünf NAT Gateways. Nebenbei: Das Transit Gateway selbst wird typischerweise ebenfalls per RAM geteilt.

**C — Cross-Account-IAM-Rollen:** Erlauben Zugriff auf fremde Ressourcen durch Rollenwechsel. Die Teams sollen aber in ihrem eigenen Konto arbeiten, nicht in einem fremden.

**E — Eine ressourcenbasierte Richtlinie am Subnetz:** Gibt es für diesen Ressourcentyp nicht, und selbst wo es sie gibt, fehlen das Teilen mit einer ganzen OU und die Sichtbarkeit in der Konsole des Ursprungsdienstes.
