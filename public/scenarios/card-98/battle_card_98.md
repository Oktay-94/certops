---
nr: 98
title: Git-Push wird Preview
services: [AWS Amplify Hosting, Amazon S3, Amazon CloudFront]
domains: [D2, D3]
signalwords:
  - "frontend team deploys on every git push"
  - "preview environment per pull request"
  - "torn down automatically when the PR is merged"
  - "custom domain and atomic deployment"
assets: [battle_card_98.svg, battle_card_98.png, battle_card_98.pdf]
status_note: |
  qc.py 0 Befunde. Gemeldet: 8 Boxen, 24 Texte, 16 Segmente, 3 Badges,
  1 X-Kreis. Aufschlüsselung Boxen: 3 Boxen der Hauptreihe + 2 Boxen der
  Gabelung + 1 graue Kontextbox + 1 verworfene Box + 1 Footer-Rect = 8;
  keine Zonen. Segmente: 2 Kettenpfeile + 2 Gabelpfade mit je 3 Segmenten
  + 2 Segmente des Bypass + 2 X-Diagonalen = 12 gezeichnete, dazu 4
  Phantomsegmente aus zwei Marker-IDs ("kette", "verworfen") = 16.
  Das Stammstück zwischen x=1147 und x=1225 gehört zu beiden Gabelpfaden
  und ist deshalb doppelt vorhanden; deckungsgleich, im Bild nicht sichtbar.
  Korrekturrunden: keine. Der Untertitel wurde VOR dem Zeichnen gegen den
  echten CairoSVG-Render gemessen (Reserve 10,2 px) — direkte Lehre aus dem
  zones.py-Befund an Karte 97.
  precheck.py vor dem Zeichnen: 18 Texte, 0 Befunde, engste Reserve 41,2 px
  ("Feature-Branch und Pull Request" 245/286 px).
  render.py: R13 reine Schwarzpixel 0, Titelband-Kanaldivergenz 0.
  zones.py (R7): 0 Befunde. R12-Gegencheck: 0 Verstöße.
  r16.py: 99,4 px, engster Wert am Untertitel; das Bypass-Label liegt bei
  104 px. Badge 3 sitzt 35 px hinter dem Stammanfang, Außenkante x=1197,
  28 px vor dem Knick bei x=1225 — derselbe Wert wie auf Karte 94.
  Footer von Hand gemessen: 991 px.
  Sichtprüfung: AUSSTEHEND, erfolgt lokal durch Oktay. Bildbetrachter
  lieferte einen leeren Platzhalter.
---

## Szenario

Ein Frontend-Team entwickelt eine React-Anwendung und will bei jedem Push
deployen: Feature-Branches sollen eine eigene Vorschau bekommen, damit
Reviewer den Stand anklicken können, ohne lokal auszuchecken; der
main-Branch geht in die Produktion.

## Ablauf

1. **Git-Push.** Das Repository ist mit Amplify Hosting verbunden. Ein Push
   auf einen Feature-Branch und ein Pull Request gegen `main` lösen jeweils
   einen Build aus.
2. **Amplify Build.** Amplify baut je Branch nach der Build-Spezifikation.
   Bei GitHub-Repositories kommentiert die Amplify-App die Vorschau-URL
   direkt am Pull Request.
3. **Amplify Hosting liefert aus** und verzweigt in zwei Ziele.
4. **Preview-URL.** Jeder Pull Request bekommt eine eigene, von der
   Produktions-URL verschiedene Adresse. Wird der PR gemergt oder
   geschlossen, verschwinden Vorschau-URL und zugehörige temporäre Umgebung
   wieder. Genau dieser automatische Abbau ist der Punkt, den Bastellösungen
   nicht mitliefern.
5. **Produktion.** Der main-Branch geht atomar live: die Anwendung wird erst
   umgeschaltet, wenn das komplette Deployment durch ist. Damit entfällt der
   Zustand, in dem halb hochgeladene Dateien ausgeliefert werden.

## Prüfungs-Kernsatz

Frontend aus Git, Vorschau je Pull Request, Abbau automatisch beim Merge —
das ist Amplify Hosting. Wer nur einen Bucket hinter ein CDN hängt, baut
Previews und Teardown selbst.

## Abgrenzungen

- **S3 plus CloudFront von Hand.** Funktioniert für die reine Auslieferung,
  liefert aber keine Vorschauumgebungen, kein automatisches Aufräumen und
  keine atomaren Deployments.
- **Amplify Hosting gegen Amplify-Backend.** Hosting ist Frontend-Hosting
  samt CI/CD. Ob das Backend mit Gen 1 oder Gen 2 gebaut wurde, ist davon
  unabhängig. Diese Grenze ist wichtig, damit die Karte nicht mit Karte 95
  (AppSync) kollidiert.
- **Klassische Pipeline-Dienste.** CodeBuild, CodeCommit und CodeDeploy
  stehen im SAA-C03-Exam-Guide ausdrücklich auf der Out-of-Scope-Liste. Als
  Distraktor können sie in Fragen auftauchen, als erwartete Lösung nicht.

## Klassiker-Fallen

- Vorschauumgebungen für ein öffentliches Repository aktivieren, ohne die
  Rollenrechte je Branch zu begrenzen. Fremder Code liefe sonst mit den
  Rechten der Anwendung.
- Vorschau-URLs für öffentlich zugänglich halten, obwohl der Inhalt intern
  ist. Passwortschutz je Branch ist ein eigener Schalter.
- Annehmen, Amplify Hosting sei mit Amplify Gen 1 zusammen im Auslauf. Der
  Maintenance-Status betrifft die Backend-Generation, nicht das Hosting.

## Faktencheck-Notizen

- Vorschau je Pull Request mit eigener URL, temporäre Umgebung, Löschung
  beim Merge oder Schließen: AWS Amplify Hosting User Guide, „Web previews
  for pull requests", ergänzt durch die Gen-2-Dokumentation zu
  Fullstack-Previews.
- Atomare Deployments, Passwortschutz je Branch, Custom Domains, angebundene
  Git-Anbieter: „Welcome to AWS Amplify Hosting".
- Gen 1 im Maintenance Mode mit End of Life am 1. Mai 2027: Hinweisbanner der
  Amplify-Gen-1-Dokumentation.
- Amplify ist im SAA-C03-Exam-Guide unter „Front-End Web and Mobile" als
  in-scope gelistet; CodeBuild, CodeCommit und CodeDeploy stehen dort unter
  „Out-of-Scope AWS Services".

## Nicht bestätigt / bewusst weggelassen

- **Buildzeiten und Preisangaben** stehen nicht auf der Karte; sie sind
  regions- und tarifabhängig.
- **Der genaue Umfang der temporären Backend-Umgebung** unterscheidet sich
  zwischen Gen 1 und Gen 2 und zwischen öffentlichen und privaten
  Repositories. Die Karte sagt deshalb „eigene URL je Pull Request" und
  vermeidet eine Aussage über das Backend.

## Bewusste Vereinfachungen im Diagramm

- Die Gabelung zeigt Vorschau und Produktion als gleichrangige Ziele. In der
  Praxis hängt an `main` zusätzlich der Custom-Domain-Eintrag samt
  Zertifikat, der nicht gezeichnet ist.
- End-to-End-Tests und Redirect-Regeln sind Funktionen von Amplify Hosting,
  aber für die Kernaussage entbehrlich.

## Farbkonventionen dieser Karte

Pfeilfarbe blau, weil die Kette dem Weg der Codeänderung folgt. Die graue
Box ist die erste Anwendung der ab Batch 20 freigegebenen Konvention
„real gültig, aber im Auslauf"; sie hat zusätzlich einen gestrichelten Rand,
weil sie kein Ablaufschritt ist, und ist bewusst nicht an die Kette
angebunden. Die verworfene Box behält ihre Rollenfarbe (Storage, grün);
abgelehnt wird sie über X-Kreis und roten Pfad.
