const questions = [
  {
    text: "Was bedeutet JeKits?",
    options: [
      "Jedem Kind Instrumente, Tanz und Schule",
      "Jedem Kind Instrumente, Tanzen, Singen",
      "Jede Klasse integriert Tanz und Stimme"
    ],
    correctIndex: 1
  },
  {
    text: "Seit wann wird das JeKits-Programm landesweit in NRW umgesetzt?",
    options: [
      "Seit dem Kulturhauptstadtjahr 2010",
      "Seit dem Schuljahr 2015/16",
      "Seit der Auflösung der JeKits-Stiftung 2021"
    ],
    correctIndex: 1
  },
  {
    text: "Welche der folgenden Schwerpunktkombinationen ist Teil des JeKits-Programms?",
    options: [
      "Theater, Musik und Bewegung",
      "Singen, Tanzen und Instrumente",
      "Sprache, Tanz und Rhythmus"
    ],
    correctIndex: 1
  },
  {
    text: "Wie ist der Unterricht in JeKits 1 typischerweise organisiert?",
    options: [
      "Im Klassenverband als verpflichtendes Angebot während der Unterrichtszeit",
      "Als zusätzliches Wahlangebot im Ganztag",
      "Als individueller Förderunterricht für interessierte Kinder"
    ],
    correctIndex: 0
  },
  {
    text: "Was gehört zu den JeKits-Bildungsdimensionen?",
    options: [
      "Forschen und Entwickeln",
      "Wahrnehmen, Empfinden, Erleben",
      "Strukturieren und Dokumentieren"
    ],
    correctIndex: 1
  },
  {
    text: "Was ist charakteristisch für das Tandemmodell in JeKits 1?",
    options: [
      "Eine Lehrkraft aus der Schule arbeitet mit einer Lehrkraft eines Bildungspartners zusammen",
      "Zwei externe Lehrkräfte gestalten den Unterricht gemeinsam",
      "Eine schulische Fachkraft wechselt sich mit der externen Lehrkraft ab"
    ],
    correctIndex: 0
  },
  {
    text: "Wer ist seit 2021 für die Qualitätsentwicklung zuständig?",
    options: [
      "Das Ministerium für Schule und Bildung NRW",
      "Die Bezirksregierungen",
      "Der Landesverband der Musikschulen NRW"
    ],
    correctIndex: 2
  },
  {
    text: "Welche Aussage entspricht nicht einem formulierten Ziel des JeKits-Programms?",
    options: [
      "Zugang zu kultureller Bildung unabhängig von Herkunft",
      "Aufbau musikalischer Grundlagen für spätere Studiengänge",
      "Künstlerisches Lernen als soziale Praxis"
    ],
    correctIndex: 1
  },
  {
    text: "Wie viele Bildungspartner sind im Schuljahr 2024/25 etwa beteiligt?",
    options: [
      "Rund 150",
      "Etwa 350",
      "Über 500"
    ],
    correctIndex: 2
  },
  {
    text: "Was zeichnet den Unterricht in JeKits 2-4 im Schwerpunkt Instrumente besonders aus?",
    options: [
      "Die Kinder musizieren gemeinsam in einem Ensemble und erhalten Gruppenunterricht",
      "Der Unterricht findet primär im Einzelsetting statt",
      "Das Musizieren erfolgt überwiegend digital unterstützt"
    ],
    correctIndex: 0
  },
  {
    text: "Welche Aussage zur Qualifikation von JeKits-Lehrkräften ist korrekt?",
    options: [
      "Lehrkräfte verfügen über eine musik-, tanz- oder vokalpädagogische Qualifikation",
      "Alle Lehrkräfte werden von den Bezirksregierungen zertifiziert",
      "Nur staatlich anerkannte Musikschulen dürfen Personal stellen"
    ],
    correctIndex: 0
  },
  {
    text: "Was ist bei der Organisation des Tandemunterrichts besonders wichtig?",
    options: [
      "Eine gemeinsame Konferenz vor dem Schuljahr",
      "Ein abgestimmtes Erstgespräch mit Rollenklärung",
      "Ein vorgegebener Unterrichtsplan für jede Woche"
    ],
    correctIndex: 1
  },
  {
    text: "Welche Funktion hat der RaDiv (Rat der Interessenvertretungen)?",
    options: [
      "Er entscheidet über die Schwerpunktwahl der Schulen",
      "Er bündelt Perspektiven aller beteiligten Gruppen im Programm",
      "Er erstellt einheitliche Unterrichtskonzepte"
    ],
    correctIndex: 1
  },
  {
    text: "Was ist ein zentrales Merkmal aller drei JeKits-Schwerpunkte ab dem zweiten Jahr?",
    options: [
      "Verbindlicher Unterricht mit Abschlussprüfung",
      "Freiwillige Teilnahme an Ensembles mit wöchentlichem Unterricht",
      "Teilnahme nur bei musikalischer Eignung"
    ],
    correctIndex: 1
  },
  {
    text: "Was änderte sich im Schuljahr 2021/22 am JeKits-Programm?",
    options: [
      "Einführung eines neuen Schwerpunkts „Theater“",
      "Auflösung der JeKits-Stiftung u. Übergang der Verantwortung an den LVDM NRW",
      "Zusammenlegung der drei Schwerpunkte zu einem Basisfach"
    ],
    correctIndex: 1
  },
  {
    text: "Was ist ein „Tandem“ im Kontext von JeKits 1?",
    options: [
      "Zwei externe Lehrkräfte im Team",
      "Eine schulische und eine externe Lehrkraft im gemeinsamen Unterricht",
      "Eine mobile Beratungseinheit für Lehrkräfte"
    ],
    correctIndex: 1
  },
  {
    text: "Was ist die Aufgabe des Kuratoriums im JeKits-System?",
    options: [
      "Koordination von Konzerten und Auftritten",
      "Wissenschaftliche Begleitung und Beratung des Programms",
      "Durchführung von Lehrkräftefortbildungen"
    ],
    correctIndex: 1
  },
  {
    text: "Welche Rolle spielen die Bezirksregierungen im JeKits-Programm?",
    options: [
      "Sie entwickeln die Unterrichtskonzepte",
      "Sie unterstützen die Umsetzung auf kommunaler Ebene",
      "Sie stellen die Lehrkräfte für Bildungspartner ein"
    ],
    correctIndex: 1
  },
  {
    text: "Wie viele Kinder nehmen aktuell (2024/25) am JeKits-Programm teil?",
    options: [
      "Rund 75.000",
      "Etwa 113.000",
      "Knapp 160.000"
    ],
    correctIndex: 1
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = questions;
}
