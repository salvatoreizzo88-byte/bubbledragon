# Guida: Come Avviare il Gioco su Simulatore iPhone

Questa guida ti spiega passo dopo passo come aprire il progetto in Xcode e avviare la simulazione del tuo gioco su un iPhone virtuale.

## 1. Aprire il Progetto in Xcode

Il modo corretto per aprire il progetto è usare il file **Workspace**.

1.  Apri il **Finder** (l'icona del volto sorridente nel Dock).
2.  Vai nella cartella del tuo progetto:
    `/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash/web_game/ios/App`
3.  Cerca il file chiamato **`App.xcworkspace`** (icona bianca).
4.  **Doppio click** su quel file. Si aprirà Xcode.

> **NOTA:** Non aprire il file `.xcodeproj`. Usa sempre `.xcworkspace`.
>
> **Scorciatoia Terminale:**
> Copia e incolla questo comando nel terminale per aprire subito Xcode:
> ```bash
> cd "/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash/web_game" && npx cap open ios
> ```
> Questo aprirà automaticamente il progetto corretto.

## 2. Preparare Xcode

Una volta aperto Xcode:

1.  Attendi che la barra di stato in alto finisca di caricare (Index processing, etc.).
2.  Guarda la **barra degli strumenti in alto** (quella grigia scuro).
3.  Sulla sinistra, vicino al pulsante ▶️ (Play), c'è un menu a tendina che indica il dispositivo attuale (es. "My Mac" o "Generic iOS Device").
4.  Clicca su quel menu e seleziona un simulatore, ad esempio **"iPhone 15"** o **"iPhone 15 Pro"**.

## 3. Avviare la Simulazione

1.  Clicca il pulsante **Play ▶️** (il triangolo) in alto a sinistra nella barra degli strumenti.
2.  Attendi qualche secondo.
    *   Xcode compilerà il progetto ("Building...").
    *   Se tutto va bene, vedrai "Build Succeeded".
3.  Si aprirà automaticamente l'applicazione **Simulator** con un iPhone virtuale.
4.  Il gioco si avvierà da solo sullo schermo dell'iPhone simulato.

## 4. Risoluzione Problemi Comuni

### Errore "Signing for 'App' requires a development team"
Se vedi un errore rosso che parla di "Signing" o "Team":

1.  In Xcode, nella colonna di sinistra (Navigator), clicca sulla prima icona (cartella blu) chiamata **App**.
2.  Nella parte centrale della finestra, sotto "PROJECT" e "TARGETS", clicca su **App** (sotto TARGETS).
3.  Nella barra orizzontale al centro, clicca su **Signing & Capabilities**.
4.  Nella sezione "Signing", cerca la voce **Team**.
5.  Se c'è scritto "None", clicca e seleziona il tuo **Personal Team** (il tuo nome).
6.  Riprova a premere Play.

### Il gioco non si aggiorna
Se hai modificato il codice web (HTML/JS/CSS) ma il simulatore mostra la versione vecchia:

1.  Chiudi il simulatore.
2.  Apri il Terminale.
3.  Esegui il comando: `npx cap sync ios`
4.  Torna su Xcode e premi Play di nuovo.
