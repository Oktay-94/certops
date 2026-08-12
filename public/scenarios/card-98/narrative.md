---
cardNumber: 98
slug: amplify-hosting-pr-preview
title: "Git-Push wird Preview"
services: ["AWS Amplify Hosting", "Amazon S3", "Amazon CloudFront"]
domains: ["D2", "D3"]
correctAnswer: "C"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html"
  - "https://docs.aws.amazon.com/amplify/latest/userguide/pr-previews.html"
  - "https://docs.aws.amazon.com/amplify/latest/userguide/quotas-chapter.html"
  - "https://docs.aws.amazon.com/amplify/latest/userguide/yml-specification-syntax.html"
  - "https://docs.aws.amazon.com/amplify/latest/userguide/custom-build-instance.html"
  - "https://docs.amplify.aws/gen1/"
  - "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-out-of-scope-services.html"
---

## Die Grundidee zuerst

Stell dir vor, du hast in einer Wohnung eine Wand versetzt und willst, dass drei Kolleginnen den neuen Grundriss beurteilen, bevor er endgültig wird.

**Weg eins:** Du schickst jeder einen Bauplan, eine Materialliste und die Anweisung „bau das bei dir im Wohnzimmer nach". Drei Leute, drei Nachbauten, drei Gelegenheiten, etwas falsch zu verstehen. Ändert sich morgen etwas, fängt jede von vorn an. Das ist die Bitte „zieh dir mal den Branch und starte ihn lokal".

**Weg zwei:** Es gibt eine Musterwohnung mit eigener Hausnummer. Ein Hausmeister baut sie in dem Moment auf, in dem du den Änderungsantrag einreichst, und hängt die Adresse an den Antrag. Die Kolleginnen gehen hin, schauen, gehen wieder. Und wenn der Antrag genehmigt ist, reißt der Hausmeister die Musterwohnung ab — ohne dass ihn jemand daran erinnert.

Amplify Hosting ist der Hausmeister.

Der Aufbau ist dabei der leichte Teil. Eine Vorschau irgendwie zu bauen, schafft jedes Team; es gibt zwei Dutzend Skripte im Internet, die genau das tun. Was diese Skripte nicht liefern, ist der **Abriss**. Niemand vergisst, eine Vorschau anzulegen — sie wird ja gebraucht. Alle vergessen, sie wegzuräumen. Genau darauf zeigt das Szenario mit dem Satz „torn down automatically when the PR is merged".

Halte für den Rest des Textes ein konkretes Team im Kopf: vier Leute, eine React-Anwendung, Branch `feature/checkout-v2`, Pull Request #147 gegen `main`. Die Frage, um die es geht, lautet nicht „wie kommt der Code ins Netz". Sie lautet: **Wer räumt #147 weg, wenn es gemergt ist?**

## Was es eigentlich ist — die Verbindung zwischen Branch und App

Es gibt keinen Build-Server, den du besitzt. Es gibt eine **App**, die an ein Git-Repository gebunden ist, und je Branch eine Build-Beschreibung. Die liegt als `amplify.yml` im Repository:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --cache .npm --prefer-offline
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - .npm/**/*
```

Lies das von oben nach unten. `preBuild` holt die Abhängigkeiten, `build` erzeugt die Dateien, `artifacts.baseDirectory` sagt, welcher Ordner danach ausgeliefert wird, `cache` behält den npm-Cache für den nächsten Lauf.

Wichtiger ist, was **nicht** drinsteht: kein Bucket-Name. Kein `aws s3 sync`. Keine Distribution-ID und kein Aufruf, der einen Cache invalidiert. Kein Zertifikat, kein DNS-Eintrag, kein Aufräumskript. Das ist der Unterschied zwischen einer Build-Beschreibung und einem Deploy-Skript: Die Beschreibung sagt, wie aus Quelltext Dateien werden. Wohin die Dateien danach gehen, ist nicht dein Problem.

Dass diese Datei im Repository liegt, ist kein Zufall, sondern die zweite Hälfte der Idee. Der Branch bringt seine eigene Bauanleitung mit. `feature/checkout-v2` kann eine Abhängigkeit hinzufügen und den Build ändern, ohne dass jemand eine zentrale Pipeline anfasst — und ohne dass diese Änderung `main` beeinflusst, solange nicht gemergt wurde. Das Bild dazu: Der Bauplan liegt in der Mappe, die mit dem Änderungsantrag mitwandert, nicht im Büro des Hausmeisters.

Was nicht ins Repository gehört, sind Geheimnisse. Umgebungsvariablen setzt du je App oder je Branch in der Konsole; im YAML stehen nur ihre Namen.

## Der Weg durch die Karte

### Git-Push — Feature-Branch und Pull Request

Zwei Auslöser, nicht einer. Ein Push auf einen verbundenen Branch löst einen Build für diesen Branch aus. Ein Pull Request gegen `main` löst zusätzlich den Vorschau-Build aus.

Bei GitHub läuft der Zugriff über die Amplify GitHub App, die du einmal im GitHub-Konto installierst und auf ausgewählte Repositories begrenzen kannst. Danach kommentiert Amplify die Vorschau-Adresse direkt am Pull Request.

Die Konsequenz ist unscheinbar und wichtig: **Der Auslöser ist kein Befehl, den jemand ausführt.** Es gibt niemanden, der „deployen" muss und es vergessen könnte.

### Badge 1 — ein Build je Branch

Amplify startet je Branch einen eigenen Lauf nach derselben Build-Spezifikation. Fünf Läufe können sich standardmäßig gleichzeitig bewegen — die Quota heißt „Concurrent jobs" und steht bei 5 je Region und Konto; sie ist erhöhbar.

Das Bild dazu: fünf Schalter an der Post. Der sechste Kunde steht in der Schlange, nicht vor verschlossener Tür.

Für unser Team heißt das: Wenn vormittags vier Leute gleichzeitig pushen und zusätzlich zwei Pull Requests offen sind, laufen fünf Builds, und der sechste wartet ein paar Minuten. Kein Fehler, keine verlorene Änderung — nur später fertig.

### Amplify Build — Build je Branch nach Buildspec

Hier entsteht das Artefakt. Es darf bis 5 GB groß sein, ebenso der Cache. Für ein React-Frontend ist das weit weg; für einen Monorepo-Build mit vielen Assets ist es die erste Grenze, an die man stößt.

Der Cache ist der Grund, warum der erste Build eines neuen Branches spürbar länger dauert als der zweite: Beim ersten Lauf wird `.npm` erst angelegt, danach wird er vor deinen Befehlen zurückgespielt. Wer das nicht weiß, misst einmal und zieht die falschen Schlüsse über die Geschwindigkeit des Dienstes.

### Badge 2 — vom Artefakt zur Auslieferung

Der Build endet, das Artefakt geht an das Hosting. Ab hier hat dein Quelltext nichts mehr zu sagen.

### Amplify Hosting — liefert das Frontend aus

Amplify stellt die Dateien in das globale Content-Delivery-Netz von AWS. Für dich ist das ein Schritt, kein Bauteil: Es gibt keine Distribution, die du konfigurierst, und keinen Bucket, dessen Policy du schreibst.

### Badge 3 — die Gabelung

Und jetzt der Punkt, an dem die Karte auseinanderläuft. Dieselbe Maschinerie, zwei Ziele. Der Unterschied zwischen ihnen ist nicht die Technik — es ist die **Lebensdauer**.

### Preview-URL — eigene URL je Pull Request

Jeder Pull Request bekommt eine eigene Adresse, die sich vollständig von der Adresse der Hauptseite unterscheidet. Wird der Pull Request geschlossen oder gemergt, wird diese Adresse gelöscht; eine temporäre Backend-Umgebung, falls eine angelegt wurde, verschwindet mit.

Für #147 sieht das so aus: Amplify baut, kommentiert die Adresse am Pull Request, und die Reviewerin klickt sie an, ohne etwas auszuchecken. Sie sieht denselben Build, den auch die Produktion bekäme — nicht eine lokale Nachbildung mit anderer Node-Version. Fällt ihr etwas auf, schreibt sie es an den Pull Request, es kommt ein Commit hinterher, und die Adresse zeigt danach den neuen Stand. Dieselbe Adresse, neuer Inhalt.

Ein Detail, das gern übersehen wird: **Jeder offene Pull Request zählt gegen das Kontingent von 50 Branches je App.** Diese Quota ist laut Dokumentation nicht anpassbar. Ein Team mit 20 langlebigen Feature-Branches und 30 offenen Pull Requests steht also vor einer Wand, die es sich selbst gebaut hat. Die Dokumentation formuliert die Gegenmaßnahme trocken: Schließt eure Pull Requests.

### Produktion — main geht atomar live

Auf dem Produktionszweig gilt: Die Anwendung wird erst umgestellt, wenn das komplette Deployment durch ist. Das nennt AWS **atomic deployment**, und es beseitigt genau den Zustand, in dem Dateien nur halb hochgeladen sind und ein Besucher eine neue HTML-Datei mit einem alten JavaScript-Bündel bekommt.

Wer schon einmal mitten in einem `s3 sync` eine Seite neu geladen hat, kennt das Ergebnis: eine weiße Seite und ein Fehler in der Konsole, der nach zwei Minuten von selbst verschwindet und deshalb nie reproduzierbar ist.

An `main` hängt zusätzlich die Custom Domain. Ist sie über Route 53 verwaltet, bekommen auch die Vorschauen Subdomains — und die werden beim Schließen des Pull Requests mitgelöscht.

### Der graue Kasten — Amplify Gen 1

Grau heißt auf diesen Karten: real, gültig, aber im Auslauf. Amplify Gen 1 ist im Maintenance Mode und erreicht am **1. Mai 2027** das Ende seiner Lebensdauer; für neue Projekte empfiehlt AWS Gen 2.

Der Kasten hängt bewusst an keinem Pfeil. Er ist kein Schritt im Ablauf, sondern eine Fußnote zu einer Verwechslung, die in Prüfungsfragen teuer ist.

Denn „Amplify" bezeichnet zwei Dinge. Das eine ist das Hosting-Produkt, um das es auf dieser Karte geht: Git-Anbindung, Build, Auslieferung, Vorschau. Das andere ist die Art, wie man ein Backend beschreibt — früher mit CLI und Studio (Gen 1), heute mit TypeScript (Gen 2). Der Auslauf betrifft die zweite Bedeutung. Ein Team, das gar kein Amplify-Backend hat, sondern nur ein Frontend hostet, ist von der Ankündigung schlicht nicht betroffen.

### Der rote Pfad — S3 und CloudFront von Hand

Zähl durch, was du selbst schreiben müsstest, um dieselbe Karte nachzubauen: einen Webhook-Empfänger für PR-Ereignisse, je Pull Request ein Präfix oder einen eigenen Bucket, ein Deploy-Skript, eine Cache-Invalidierung, einen Eintrag im DNS, ein Zertifikat, und zum Schluss eine Funktion, die beim Schließen des Pull Requests alles davon wieder entfernt.

Das ist baubar. Es ist nur nichts, was jemand pflegt.

Und es ist auch nicht der Punkt, an dem die Eigenbaulösung kippt. Sie kippt später: wenn die Person, die das Skript geschrieben hat, das Team verlässt; wenn der Webhook drei Wochen lang still ausfällt und niemand es merkt, weil ein fehlender Abriss keinen Fehler wirft, sondern nur Reste hinterlässt. Die Karte zeichnet den roten Pfad deshalb bewusst zu einer grünen Storage-Box: S3 und CloudFront sind nicht falsch. Sie sind für diese Aufgabe nur die halbe Lösung, und die fehlende Hälfte ist die, die niemand sieht.

## Die entscheidende Unterscheidung

Auf dieser Karte stehen zwei Dinge, die beide „Amplify" heißen und nichts miteinander zu tun haben:

| | Amplify Hosting | Amplify Gen 1 / Gen 2 |
|---|---|---|
| Was ist es? | Hosting für Frontends samt Git-Workflow | Generation des Backend-Werkzeugs (CLI, Studio bzw. TypeScript) |
| Wo dokumentiert? | Amplify Hosting User Guide | Amplify-Dokumentation für Backends |
| Betrifft der Maintenance-Status? | nein | ja, Gen 1: End of Life 01.05.2027 |
| Was liefert es im Szenario? | Build, Preview-URL, Teardown, atomares Deployment | nichts davon |

Wer diese Achse nicht sieht, liest „Amplify läuft aus" und streicht die richtige Antwort durch.

## Die ehrliche Feinheit

Die interessanteste Grenze steht nicht auf der Karte, sondern in der Sicherheitsauflage der Dokumentation: **Vorschauen lassen sich nicht für jede App mit öffentlichem Repository aktivieren.**

Der Grund ist keine Willkür. Eine Vorschau baut fremden Code — jeder darf gegen ein öffentliches Repository einen Pull Request stellen. Braucht die App eine IAM-Service-Rolle, etwa weil sie ein Backend hat oder auf der `WEB_COMPUTE`-Plattform läuft, liefe dieser fremde Code mit den Rechten deiner Anwendung. Genau das verhindert AWS, indem es die Kombination gar nicht erst zulässt. Wo eine Compute-Rolle nötig ist, empfiehlt die Dokumentation, sie nicht auf App-Ebene zu hängen, sondern je Branch.

Zweite Feinheit: Die temporäre **Backend**-Umgebung je Pull Request gibt es nur bei privaten Repositories und nur für Backends, die mit CLI oder Studio bereitgestellt wurden. Deshalb sagt die Karte „eigene URL je Pull Request" und schweigt über das Backend. Das ist keine Auslassung, sondern die einzige Formulierung, die in allen Konstellationen stimmt.

Dritte Feinheit: Atomar heißt „alle Dateien gleichzeitig", nicht „ohne Folgen". Wenn dein Frontend zu einer Datenbank spricht, deren Schema sich mit demselben Merge ändert, rettet dich das atomare Umschalten der statischen Dateien nicht.

Vierte Feinheit, und die trifft Teams in der Praxis am häufigsten: Eine Vorschau ist standardmäßig **öffentlich erreichbar**. Sie hat eine schwer zu erratende Adresse, aber keine Tür mit Schloss. Wer eine unfertige Preisliste oder ein noch nicht angekündigtes Feature zeigt, braucht den Passwortschutz je Branch — das ist ein eigener Schalter und keine Folge davon, dass das Repository privat ist. Die beiden Dinge werden regelmäßig verwechselt: Ein privates Repository schützt den Quelltext, nicht die gebaute Seite.

## Syntax lesen — `amplify.yml`

Drei Phasen, in fester Reihenfolge, und ein Feld, an dem die meisten ersten Deployments scheitern:

```
frontend:
  phases:
    preBuild:   ── läuft, nachdem Amplify die Abhängigkeiten installiert hat
    build:      ── deine Build-Befehle
    postBuild:  ── läuft, nachdem die Artefakte kopiert wurden
  artifacts:
    baseDirectory: build   ── DIESER Ordner wird ausgeliefert
    files: '**/*'          ── daraus diese Dateien
```

`postBuild` läuft **nach** dem Kopieren der Artefakte. Wer dort noch Dateien erzeugt, erzeugt sie ins Leere.

Und der Klassiker: `baseDirectory`. Vite schreibt nach `dist`, Create React App nach `build`, ein statischer Next.js-Export nach `out`. Steht dort der falsche Ordner, ist der Build grün und die Seite weiß. Der Fehler sieht aus wie ein Hosting-Problem und ist eine Zeile YAML.

## Was du dadurch nicht baust

- keinen Build-Server und kein Betriebssystem, das jemand patcht
- kein Deploy-Skript mit Bucket-Namen und Zugangsdaten
- keine CloudFront-Distribution und keine Invalidierung von Hand
- keinen Webhook-Empfänger für Pull-Request-Ereignisse
- **kein Aufräumskript** — und keinen Kalendereintrag, der daran erinnert
- keine Zertifikatsverlängerung, kein DNS-Eintrag je Vorschau

Übrig bleiben: ein verbundenes Repository, eine `amplify.yml` und ein Schalter je Branch.

## Wenn du dir eine Sache merkst

**Eine Vorschau zu bauen kann jeder. Amplify Hosting verkauft dir den Abriss.**

S3 mit CloudFront liefert statische Dateien schnell aus, kennt aber weder Pull Requests noch Lebensdauern. CodeBuild, CodeCommit und CodeDeploy stehen im SAA-C03-Exam-Guide ausdrücklich auf der Out-of-Scope-Liste — sie können als Distraktor auftauchen, nie als erwartete Lösung. Und eine EC2-Instanz mit einem Build-Werkzeug darauf löst genau das Problem, das die Frage loswerden will.

## Prüfungsknackpunkte

**Signalwörter:** „deploys on every git push" plus „preview environment per pull request" plus „torn down automatically when the PR is merged". Die ersten beiden Signale passen auf mehrere Lösungen. Das dritte passt nur auf eine. Kommt zusätzlich „custom domain" und „atomic deployment" vor, ist die Frage praktisch unterschrieben.

**Die Aufwandsfalle.** Distraktoren in dieser Kategorie sind selten technisch unmöglich. Sie sind nur teurer in der Pflege, und genau darauf zielt die Frage: Gesucht ist die Lösung mit dem geringsten operativen Aufwand, nicht die einzige, die funktioniert. Wenn eine Antwortoption die Wörter „custom script", „Lambda function to clean up" oder „scheduled job" enthält, beschreibt sie fast immer den Aufwand, den die richtige Antwort erspart.

**Die Generationenfalle.** Eine Frage erwähnt beiläufig, Amplify sei im Maintenance Mode. Das betrifft die Backend-Generation Gen 1 mit End of Life am 01.05.2027, nicht Amplify Hosting. Hosting ist im Exam-Guide unter „Front-End Web and Mobile" in-scope.

**Die Quota-Falle.** „50 Branches je App" klingt großzügig, bis man merkt, dass jeder offene Pull Request einer davon ist.

**A — S3 mit CloudFront:** Liefert aus, mehr nicht. Vorschauumgebung, automatischer Abbau und atomares Umschalten müsstest du selbst bauen.

**B — CodePipeline mit CodeBuild und CodeDeploy:** Baut Pipelines, kennt aber keine Vorschau je Pull Request von Haus aus — und steht für dieses Examen außerhalb des Prüfungsstoffs.

**D — EC2 mit einem Build-Werkzeug:** Genau der ständig laufende Server, den das Szenario vermeiden will, samt Patch- und Aufräumpflicht.

**E — Amplify Gen 1 sei abgekündigt, also scheide Amplify aus:** Verwechselt das Hosting-Produkt mit der Backend-Generation. Der Auslauf betrifft die zweite, nicht das erste.
