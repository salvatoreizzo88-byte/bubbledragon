# 📖 Guida di Riferimento - Bubble Bobble Nostalgie

> **Manuale Utente & Sviluppatore**
>
> Questa guida contiene tutto ciò che devi sapere per giocare, sviluppare e gestire il progetto.

---

## 📑 Indice

1. [Per chi vuole GIOCARE](#per-chi-vuole-giocare)
   - Comandi
   - Obiettivi
   - Shop & Progressione
2. [Per chi vuole SVILUPPARE](#per-chi-vuole-sviluppare)
   - Installazione
   - Struttura Codice
   - Firebase & Backend
   - Mobile Build
3. [Troubleshooting](#troubleshooting)

---

## 🎮 Per chi vuole GIOCARE

### ⌨️ I Comandi

| Azione | Tastiera (PC) | Controller / Touch |
| :--- | :--- | :--- |
| **Muovi** | Frecce `←` `→` | Pad Sinistro |
| **Salta** | Freccia `↑` | Tasto `A` |
| **Spara** | `Z`, `X` o `Barra Spaziatrice` | Tasto `B` |
| **Menu** | Mouse Click | Touch |

### 🏆 Obiettivi del Gioco

Il gioco è diviso in **Livelli**. Per superare un livello devi:
1. **Intrappolare** i nemici nelle bolle sparandogli.
2. **Scoppiare** le bolle coi nemici dentro (toccandole o saltandoci sopra).
3. Raccogliere i **Frutti** per punti extra.
4. Una volta sconfitti tutti i nemici, hai 15 secondi per raccogliere tutto prima di passare al prossimo livello.

### 🏪 Shop & Progressione

- **Monete**: Guadagnale giocando (attualmente raccogliendo frutti e completando livelli).
- **Shop**: Dal menu principale, usa le monete per comprare potenziamenti come le "Long Range Bubbles".
- **Salvataggio**: Il gioco salva automaticamente progressi e inventario. Se ti registri, salvi anche nel cloud!

---

## 👨‍💻 Per chi vuole SVILUPPARE

### 🚀 Installazione & Avvio

1. **Requisiti**:
   - Python 3 (per server locale)
   - Node.js (per build mobile)

2. **Avvio Web (Rapido)**:
   ```bash
   cd web_game
   python3 -m http.server 8000
   # Apri http://localhost:8000
   ```

3. **Deploy Mobile (iOS/Android)**:
   ```bash
   npm run build        # Compila nella cartella www/
   npm run sync:ios     # Sincronizza con Xcode
   ```

4. **Simulazione iPhone**:
   - Esegui `npx cap open ios` per aprire Xcode.
   - Scegli un simulatore (es. iPhone 15) in alto.
   - Premi ▶️ Play.
   - *Vedi `GUIDA_IOS.md` per dettagli completi.*

### 📂 Struttura del Codice

Il cuore del gioco è nella cartella `js/`. Ecco i file vitali:

- **`main.js`**: Il direttore d'orchestra. Gestisce menu, UI e inizializza il gioco.
- **`Game.js`**: Il motore. Contiene il loop `update()` e `draw()`.
- **`Level.js`**: Gestisce la mappa e le collisioni con i muri.
- **`Entity.js`**: Classe genitore per tutto ciò che si muove.
- **`Database.js`**: Tutta la logica di connessione a Firebase.

### 🔥 Firebase & Backend

Il gioco usa Firebase per:
- **Auth**: Gestione utenti (Email/Password).
- **Firestore**: Database per salvare monete, livelli e inventario.

**Nota Importante**: La configurazione è in `js/FirebaseConfig.js`. Non committare mai le chiavi private se il progetto diventa pubblico (anche se le API key Firebase sono generalmente safe per client-side se protette da regole).

### 📱 Mobile Build (Capacitor)

Il progetto usa **Capacitor** per trasformare il sito web in app.
- File di config: `capacitor.config.json`
- Asset nativi: Cartelle `ios/` e `android/`

**Per aggiornare l'icona o splash screen**:
Usa il comando `npx capacitor-assets generate` (richiede installazione plugin assets).

---

## 🔧 Troubleshooting

### "Il gioco non parte / Schermo nero"
1. Controlla la console del browser (F12).
2. Se vedi errori CORS, assicurati di usare `python3 -m http.server`, non aprire direttamente il file html.
3. Se mancano immagini, controlla che la cartella `assets/` sia presente.

### "Non riesco a fare Login"
1. Controlla la connessione internet.
2. Verifica che Firebase sia raggiungibile (no firewall aziendali).
3. Controlla `authStatus` nel modal per messaggi di errore specifici.

### "Il joystick non funziona su mobile"
1. Assicurati di non toccare con troppe dita insieme (il browser potrebbe intercettare gestures).
2. Ricarica la pagina.

---

**Bubble Bobble Nostalgie** - *Documentazione Ufficiale v1.0*
