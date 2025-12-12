# 🎮 Guida Bilanciamento Gioco - Bubble Dragon

Questa guida contiene tutti i parametri di gioco e suggerimenti per migliorare la giocabilità.

---

## 📊 Parametri Attuali (GameConfig.js)

### Player
| Parametro | Valore | File | Descrizione |
|-----------|--------|------|-------------|
| `baseSpeed` | 3 | GameConfig.js:11 | Velocità movimento |
| `baseJumpForce` | 10 | GameConfig.js:12 | Forza salto |
| `baseGravity` | 0.35 | GameConfig.js:13 | Gravità (basso = più fluttuante) |
| `invulnerabilityDuration` | 180 frames (3s) | GameConfig.js:15 | Invulnerabilità dopo danno |

### Nemici
| Parametro | Valore | File | Descrizione |
|-----------|--------|------|-------------|
| `baseSpeed` | 1.2 | GameConfig.js:24 | Velocità nemici |
| `trappedDuration` | 300 frames (5s) | GameConfig.js:26 | Tempo prima che si liberino |
| `angrySpeedMultiplier` | 1.5x | GameConfig.js:27 | Velocità dopo liberazione |

### Livelli
| Parametro | Valore | File | Descrizione |
|-----------|--------|------|-------------|
| `transitionDuration` | 900 frames (15s) | GameConfig.js:42 | ⚠️ TROPPO LUNGO |
| `maxLevels` | 100 | GameConfig.js:43 | Livelli totali |

### Progressione XP
| Parametro | Valore | File | Descrizione |
|-----------|--------|------|-------------|
| `xpPerLevel` | 500 | GameConfig.js:49 | XP per salire di livello |
| `xpFromFruit` | 25 | GameConfig.js:51 | XP per frutto |
| `xpFromEnemy` | 50 | GameConfig.js:52 | XP per nemico |

---

## 🔴 Problemi di Giocabilità Identificati

### 1. ~~Transizione Livello Troppo Lunga~~ ✅ OK
- **Nota:** I 15 secondi servono per raccogliere i frutti caduti dopo aver sconfitto i nemici
- **Status:** Valore corretto, NON modificare

### 2. Sistema Vite - Opzione "Continue" �🎬
- **Problema:** 3 vite e poi game over immediato può frustrare
- **Soluzione:** Quando perdi tutte le vite, puoi "continuare" con 2 opzioni:
  - **Opzione 1:** Spendi **5 Dragocoin** → riprendi con 1 vita
  - **Opzione 2:** Guarda **pubblicità** → riprendi con 1 vita (GRATIS) max 5 volte in un giorno
- **Game Over:** Arriva solo se rifiuti entrambe le opzioni
- **Come:** Modificare logica in `Game.js` + creare UI schermata continue
- **Nota:** I checkpoint non servono perché il gioco è già a livelli sbloccabili

### 3. Progressione XP - Sistema "Hook" 🎣
- **Strategia:** Dare sensazione di crescita rapida all'inizio, poi rallentare
- **Effetto:** Utente si "aggancia", poi è incentivato a comprare Dragocoin per accelerare
- **Curva XP consigliata:**

| Livello | XP Richiesti | Tempo Stimato | Note |
|---------|-------------|---------------|------|
| 1-5 | 100 XP | ~5 min | Velocissimo, gratificazione immediata |
| 6-10 | 200 XP | ~10 min | Ancora veloce |
| 11-20 | 350 XP | ~15 min | Inizia a rallentare |
| 21-40 | 500 XP | ~25 min | Rallentamento evidente |
| 41-60 | 750 XP | ~40 min | Lento, spinge a comprare boost |
| 61-80 | 1000 XP | ~1 ora | Molto lento |
| 81-100 | 1500 XP | ~2 ore | Hardcore/premium only |

- **Obiettivi:** Stessa logica - facili all'inizio, poi più difficili
- **Boost XP:** Dragocoin per +500 XP → diventa molto attraente dopo livello 20
- **Come:** Modificare calcolo XP dinamico in `GameState.js`

### 4. Difficoltà Livelli - Sistema "Hook" 🎣
- **Strategia:** Primi livelli facilissimi, poi difficoltà crescente
- **Effetto:** Utente si sente capace → si aggancia → poi sfida cresce

| Livelli | Nemici | Velocità | Note |
|---------|--------|----------|------|
| 1-3 | 1 | 0.6x | Tutorial, impossibile perdere |
| 4-10 | 2 | 0.8x | Facile, costruisce confidenza |
| 11-20 | 3 | 1.0x | Normale |
| 21-35 | 4 | 1.1x | Inizia la sfida |
| 36-50 | 5 | 1.2x | Difficile |
| 51-70 | 6 | 1.4x | Molto difficile |
| 71-100 | 7-8 | 1.6x | Hardcore |

- **Come:** Modificare `LevelGenerator.js` per calcolo dinamico nemici/velocità

### 5. Nemici Poco Dinamici
- **Problema:** Pattern prevedibile, cambiano solo direzione
- **Soluzione:** Aggiungere salti casuali, inseguimento
- **Come:** Modificare `Enemy.js` funzione `update()`

---

## ✅ Quick Wins - Modifiche Facili

### Aumentare Invulnerabilità Iniziale
```javascript
// GameConfig.js linea 15
invulnerabilityDuration: 300, // Era 180 (3s) → Ora 300 (5s)
```

### Rendere Player Più Veloce
```javascript
// GameConfig.js linea 11
baseSpeed: 4, // Era 3 → Ora 4
```

### Nemici Intrappolati Più a Lungo
```javascript
// GameConfig.js linea 26
trappedDuration: 420, // Era 300 (5s) → Ora 420 (7s)
```

---

## 🎯 Sistema Vite "Stile Sonic" (Proposta)

### Come Funziona
1. Player ha 3 vite normali
2. Quando perde l'ultima vita, appare schermata "CONTINUE?"
3. **Opzione 1:** Spendi 5 Dragocoin → riprendi con 1 vita
4. **Opzione 2:** Guarda pubblicità → riprendi con 1 vita (GRATIS) max 5 volte al giorno
5. Se rifiuta entrambe → GAME OVER definitivo

### UI Schermata Continue
```
┌─────────────────────────────────────┐
│         💀 HAI PERSO!               │
│                                     │
│     Vuoi continuare?                │
│                                     │
│  ┌─────────────┐ ┌─────────────┐   │
│  │ 🎬 GUARDA   │ │ 💎 5        │   │
│  │ PUBBLICITÀ  │ │ DRAGOCOIN   │   │
│  │   (GRATIS)  │ │             │   │
│  └─────────────┘ └─────────────┘   │
│                                     │
│       [ ❌ NO, GAME OVER ]          │
└─────────────────────────────────────┘
```

### Implementazione
```javascript
// In Game.js, quando player.lives <= 0:
if (this.player.lives <= 0) {
    // Mostra schermata continue con 2 opzioni
    this.showContinueScreen();
}

// Opzione 1: Dragocoin
continuewithDragocoin() {
    if (this.gameState.dragocoin >= 5) {
        this.gameState.spendDragocoin(5);
        this.player.lives = 1;
        this.restartLevel();
    }
}

// Opzione 2: Pubblicità (placeholder - AdMob dopo pubblicazione)
continueWithAd() {
    // Mostra rewarded ad
    showRewardedAd().then(() => {
        this.player.lives = 1;
        this.restartLevel();
    });
}

// Opzione 3: Game Over
confirmGameOver() {
    this.gameOver = true;
    document.getElementById('game-over-screen').style.display = 'flex';
}
```

### Vantaggi
- ✅ Mantiene la sfida del game over
- ✅ Monetizza con pubblicità (gratis per utente)
- ✅ Dà valore ai Dragocoin
- ✅ Due opzioni = più scelta per l'utente
- ✅ Non obbliga mai a pagare

---

## 📈 Curva Difficoltà Consigliata

| Livelli | Nemici | Velocità Nemici | Note |
|---------|--------|-----------------|------|
| 1-5 | 2 | 0.8x | Tutorial, molto facile |
| 6-10 | 3 | 1.0x | Facile |
| 11-20 | 4 | 1.0x | Normale |
| 21-40 | 5 | 1.2x | Medio |
| 41-60 | 6 | 1.3x | Difficile |
| 61-80 | 7 | 1.5x | Molto difficile |
| 81-100 | 8 | 1.7x | Hardcore |

---

## 📁 File Principali per Modifiche

| File | Cosa Controlla |
|------|---------------|
| `GameConfig.js` | Tutti i parametri numerici |
| `Game.js` | Logica gioco, vite, collisioni |
| `Player.js` | Controlli, salto, velocità |
| `Enemy.js` | Comportamento nemici |
| `LevelGenerator.js` | Generazione livelli, numero nemici |
| `Level.js` | Layout piattaforme |

---

## 🔄 Come Testare Modifiche

1. Modifica i valori in `GameConfig.js`
2. Salva il file
3. Esegui:
```bash
cd web_game
./sync-ios.sh
```
4. Riavvia il simulatore
5. Testa la giocabilità

---

## 📝 Note per Future Modifiche

- Tutti i valori numerici sono in `GameConfig.js` per facile modifica
- I tempi sono in **frames** (60 frames = 1 secondo)
- Per cambiamenti grandi, modifica prima `GameConfig.js` poi i file specifici
- Testa sempre dopo ogni modifica!

---

*Ultimo aggiornamento: Dicembre 2024*
