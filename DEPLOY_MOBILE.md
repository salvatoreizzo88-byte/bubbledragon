# Guida Pubblicazione su iPhone e Android

Il tuo gioco è attualmente una "Web App" (HTML/JS). Per pubblicarlo sugli store (App Store e Google Play), devi "impacchettarlo" in un'app nativa.

Il metodo più semplice e moderno è usare **Capacitor** (di Ionic).

## Passo 1: Preparare il Gioco per Mobile

Prima di tutto, il gioco deve essere giocabile su un telefono. Attualmente si gioca con la tastiera, quindi **devi aggiungere i controlli touch** (frecce e pulsante salto sullo schermo).

### Cose da fare nel codice:
1.  Aggiungere tasti virtuali a schermo (Sinistra, Destra, Salto/Spara).
2.  Impedire lo zoom della pagina (viewport meta tag).
3.  Adattare la risoluzione allo schermo del telefono.

## Passo 2: Convertire in App con Capacitor

Ecco i passaggi tecnici (richiede Node.js installato):

1.  **Inizializza il progetto**:
    ```bash
    npm init -y
    npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
    npx cap init
    ```

2.  **Configura Capacitor**:
    Modifica `capacitor.config.json` per puntare alla cartella del tuo gioco (es. `web_game`).

3.  **Aggiungi le piattaforme**:
    ```bash
    npx cap add ios
    npx cap add android
    ```

4.  **Sincronizza**:
    ```bash
    npx cap sync
    ```

## Passo 3: Compilare e Pubblicare

### Per iPhone (iOS)
*   Ti serve un **Mac**.
*   Apri il progetto creato (`ios/App`) con **Xcode**.
*   Collega il tuo iPhone e premi "Play" per testarlo.
*   Per pubblicare, ti serve un **Apple Developer Account** (costa 99$/anno).

### Per Android
*   Apri il progetto (`android`) con **Android Studio**.
*   Collega il tuo telefono Android e premi "Run".
*   Per pubblicare, ti serve un **Google Play Developer Account** (costa 25$ una tantum).

---

**Vuoi che inizi ad aggiungere i controlli touch al gioco?** È il primo passo obbligatorio.
