# JeKits Live Quiz

Eine interaktive, leichtgewichtige Live-Quiz-Webanwendung, optimiert für Workshops und Präsentationen. Keine Installation, kein Server-Setup erforderlich.

## Setup-Anleitung

1. **Öffnen der App:** Doppelklicke einfach auf die `index.html` in diesem Ordner, um die App im Browser zu starten. Das ist schon alles!
2. **Hosting (Online für Jedermann):** Damit echte Smartphones ausgedruckte QR-Codes scannen können, muss dieser Ordner auf einen Webserver geladen werden. Eine kostenlose und sehr einfache Methode ist **Netlify** (siehe Anleitung unten).

---

## Hosting-Anleitung (Kostenlos via Netlify)

Es gibt den ganz schnellen Weg (Drag & Drop) oder den professionellen Weg (über GitHub).

### Methode 1: Der superschnelle Weg (Netlify Drop)
Wenn du das Quiz nur schnell für einen Workshop online stellen willst und momentan keine Änderungen mehr an den Fragen machst:
1. Gehe auf [https://app.netlify.com/drop](https://app.netlify.com/drop).
2. Ziehe den gesamten **JeKits-Quiz** Ordner von deinem PC per Drag & Drop in das Feld auf der Website.
3. Netlify lädt den Ordner hoch und generiert sofort eine fertige Internetadresse (z.B. `https://lustiger-name-1234.netlify.app`).
4. **Fertig!** Wenn du diese Seite am Beamer aufrufst und "Quiz starten" klickst, generiert sich der richtige QR-Code, den alle Smartphones überall auf der Welt abscannen können.

### Methode 2: Der Update-freundliche Weg (GitHub + Netlify)
Wenn du die Fragen (`questions.js`) ab und zu noch anpassen willst, ist dieser Weg besser:
1. Erstelle einen kostenlosen Account bei [GitHub](https://github.com/).
2. Klicke in GitHub oben rechts auf das `+` Icon und wähle **"New repository"**. Nenne es z.B. `jekits-quiz` und klicke auf "Create repository".
3. Auf der Seite, die nun erscheint, scrolle ein kleines Stück nach unten. Du siehst dort die Überschrift "…or create a new repository on the command line". Darüber (oder darunter) steht oft klein der Link **"uploading an existing file"**.
*(Tipp: Alternativ kannst du auch oben rechts neben dem grünen 'Code' Button auf **"Add file"** klicken und dann **"Upload files"** wählen).*
4. Markiere alle Dateien und Ordner in deinem `JeKits-Quiz` Ordner (`css`, `js`, `index.html`, etc.) und ziehe sie ins Browserfenster zu GitHub. Klicke unten auf den grünen Button "Commit changes".
5. Gehe nun zu [Netlify](https://www.netlify.com/) und logge dich dort ein (am besten mit "Log in with GitHub" oder "Sign up").
6. Klicke in Netlify auf **"Add new site"** -> **"Import an existing project"** -> **"Deploy with GitHub"**.
7. Wähle dein frisch erstelltes `jekits-quiz` Repository aus der Liste.
8. Scrolle auf der nächsten Seite ganz nach unten und klicke auf den Button **"Deploy site"**.
9. **Fertig!** Netlify gibt dir eine Web-Adresse. Das Geniale: Wenn du in Zukunft bei GitHub in der Datei `js/questions.js` eine Frage änderst, aktualisiert Netlify das Quiz innerhalb von Sekunden automatisch!

*(Du kannst die etwas wirre URL in Netlify unter "Site configuration" -> "Change site name" auch zu so etwas wie `https://jekits-quiz-nrw.netlify.app` ändern).*

---

## User-Guide für Workshop-Leitende

### Live-Modus (Mit Teilnehmer-Smartphones)
1. **Host Starten:** Öffne die `index.html` auf dem Präsentationsrechner (dieser sollte bestenfalls am Beamer angeschlossen sein) und klicke auf **"Quiz starten (Host)"**.
2. **Teilnehmer einladen:** Es erscheint ein QR-Code und ein Game-Pin auf dem Bildschirm. Die Teilnehmer können entweder:
   - Den QR-Code scannen (öffnet direkt die Seite und trägt den PIN automatisch ein)
   - Oder die Seite aufrufen und manuell den PIN eingeben.
3. **Spiel Starten:** Sobald sich alle mit Namen angemeldet haben, tauchen sie in der Lobby auf. Klicke auf "Quiz starten".
4. **Durchführung:** 
   - Die Fragen werden am Beamer angezeigt, die Teilnehmer sehen auf ihren Smartphones die Tasten A, B, C.
   - Der Timer (20 Sekunden) läuft. Wer schneller richtig antwortet, bekommt mehr Punkte (bis zu 1.000 Punkte).
   - Nach Ablauf der Zeit (oder wenn alle geantwortet haben) wird die Frage am Beamer aufgelöst und ein Zwischenranking gezeigt.
   - Die Teilnehmer sehen auf ihrem Handy "Richtig" oder "Falsch".
5. **Ende:** Nach 19 Fragen wird ein finales Siegertreppchen präsentiert.

### Lokaler Modus (Ohne Smartphones)
1. Klicke auf der Startseite auf **"Lokal spielen (Ohne WLAN)"**.
2. Du bist Host und Spieler in einem: Du siehst die Fragen und die drei Antworten direkt auf dem Bildschirm.
3. Dieser Modus eignet sich für Workshops, in denen Teilnehmer auf Zuruf antworten oder wenn aus technischen Gründen das WLAN nicht mitspielt.

### Was passiert, wenn nicht alle im selben WLAN sind?
**Kein Problem!** Die App nutzt PeerJS (WebRTC) über einen öffentlichen Vermittlungsserver. Das bedeutet, solange der Host-Rechner und die Smartphones irgendeine Internetverbindung haben (z.B. der Host ist im Schul-WLAN und die Smartphones nutzen LTE/5G Mobile Daten), können sie sich trotzdem problemlos verbinden. Sie müssen **nicht** im selben Netzwerk sein!

## Design-Implementierungs-Notes

- **Typografie:** Die Marken-Schriftarten (*Zilla Slab* für Überschriften und *Montserrat* für den Text) wurden als Google Fonts eingebunden.
- **Farbschema:** Das markante Dunkelblau (`#193264`), Rot und Gelb wurden aus den hochgeladenen Bildern extrahiert und als CSS-Variablen hinterlegt.
- **Layout & Responsiveness:** 
  - Die Host-Ansicht ist für Querformat (Beamer, 16:9) mit großen Schriften optimiert.
  - Die Teilnehmer-Ansicht ist als Mobile-First-Design konzipiert, mit riesigen A/B/C-Schaltflächen, die sich perfekt einhändig bedienen lassen.
- **Wellenmuster-Ersatz:** Damit die App autark (und leicht) bleibt, wurde der Hintergrund mit einem leichten CSS-Pattern versehen, anstatt riesige Grafiken zu laden. Das Hauptaugenmerk liegt auf der Lesbarkeit im großen Präsentationsscreen (`.app-container`).

## Fragen / Inhalt anpassen
Die Fragen liegen als normales Array in der Datei `js/questions.js`. Um Fragen oder Antworten zu ändern, muss lediglich der Text in dieser Datei (in einem normalen Texteditor) angepasst werden.

```javascript
{
    text: "Deine neue Frage?",
    options: ["Antwort A", "Antwort B", "Antwort C"],
    correctIndex: 1 // 0 = A, 1 = B, 2 = C
}
```
