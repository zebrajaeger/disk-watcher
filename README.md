# Disk Monitor

## Beschreibung

Disk Monitor ist ein Node.js-basiertes Tool, um die Füllgrade von Laufwerken auf einem Linux-Server zu überwachen. Es prüft periodisch den Speicherverbrauch und sendet bei Grenzwertüberschreitungen Warnmeldungen per E-Mail.

## Features

- Konfigurierbare Laufwerksüberwachung (Pfad, maximale Füllung, minimaler freier Speicherplatz).
- Flexible Prüfintervalle per Cron-Ausdruck.
- E-Mail-Warnungen bei Grenzwertüberschreitungen.
- Zeitstempel und Priorität im Logging.
- Anpassbare Konfigurations- und Logdateien per Kommandozeilenparameter.

---

## Installation

1. **Voraussetzungen:**

   - Node.js (mindestens v14).
   - Ein Linux-System mit `df`-Befehl.

2. **Installation:**

   ```bash
   npm install -g .
   ```

   Das Tool ist danach global verfügbar und kann über den Befehl `disk-monitor` aufgerufen werden.

---

## Benutzung

### Kommandozeilenparameter

- ``** / **``**:** Pfad zur Konfigurationsdatei. Standard: `config.json` im Arbeitsverzeichnis.
- ``** / **``**:** Pfad zur Logdatei. Standard: `disk-monitor.log` im Arbeitsverzeichnis.

Beispiel:

```bash
   disk-monitor --config /pfad/zur/config.json --logfile /pfad/zur/logdatei.log
```

---

## Konfigurationsdatei

Die Konfigurationsdatei (z. B. `config.json`) enthält Einstellungen im JSON-Format.

### Beispiel `config.json`

```json
{
  "laufwerke": [
    {
      "laufwerkspfad": "/",
      "maxFuellgrad": 80,
      "minFreierSpeicher": "2GB",
      "cronIntervall": "0 * * * *",  
      "alarmIntervall": "1h"
    }
  ],
  "mail": {
    "host": "localhost",
    "port": 25,
    "security": false,
    "username": "",
    "password": "",
    "from": "monitor@example.com",
    "to": "admin@example.com"
  }
}
```

### Beschreibung der Felder

- ``**:**

  - `laufwerkspfad`: Pfad des zu überwachenden Laufwerks.
  - `maxFuellgrad`: Maximal erlaubter Füllstand in Prozent.
  - `minFreierSpeicher`: Minimal erforderlicher freier Speicherplatz (z. B. `500MB`, `10GB`).
  - `cronIntervall`: Prüfintervall als Cron-Ausdruck.
  - `alarmIntervall`: Mindestzeit zwischen zwei E-Mail-Warnungen (z. B. `1h`, `30m`).

- ``**:**

  - `host`: SMTP-Host (Standard: `localhost`).
  - `port`: SMTP-Port (Standard: `25`).
  - `security`: SMTP-Verbindungssicherheit (true/false, Standard: `false`).
  - `username`: Benutzername (Standard: leer).
  - `password`: Passwort (Standard: leer).
  - `from`: Absender-Adresse der E-Mail.
  - `to`: Empf�nger-Adresse der E-Mail.

---

## Logdatei

Das Tool schreibt Logs mit Zeitstempel und Priorität in die angegebene Logdatei.

### Beispiel Log-Einträge:

```plaintext
[2025-01-27 15:30:00] [INFO] Starting disk monitoring...
[2025-01-27 15:31:00] [INFO] Alert sent: Disk Alert: /
[2025-01-27 15:32:00] [ERROR] Failed to send email: Connection refused
```

---

## Lizenz

MIT License

---

## Autor

Lars Brandt

