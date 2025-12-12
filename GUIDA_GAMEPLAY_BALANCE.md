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

### 2. Sistema Vite - Opzione "Stile Sonic" 💰
- **Problema:** 3 vite e poi game over immediato può frustrare
- **Soluzione:** Quando perdi tutte le vite, puoi "continuare" spendendo monete
- **Meccanica:** Ogni continue costa 15 monete e ripristina 1 vita
- **Game Over:** Arriva solo se non hai abbastanza monete
- **Come:** Modificare logica in `Game.js` funzione game over (riga ~160)
- **Nota:** I checkpoint non servono perché il gioco è già a livelli sbloccabili

### 3. Progressione XP Troppo Lenta
- **Problema:** 500 XP fissi per livello, scoraggia nuovi giocatori
- **Soluzione:** Curva progressiva (100 → 200 → 300 → ecc.)
- **Come:** Modificare `xpPerLevel` in `GameConfig.js` o calcolo dinamico

### 4. Primi Livelli Troppo Difficili
- **Problema:** Stesso numero nemici dal livello 1
- **Soluzione:** Meno nemici nei primi 10 livelli
- **Come:** Modificare `LevelGenerator.js` funzione generazione nemici

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
3. Se ha ≥15 monete → può continuare (perde 15 monete, torna a 1 vita)
4. Se ha <15 monete → GAME OVER definitivo

### Implementazione
```javascript
// In Game.js, quando player.lives <= 0:
if (this.player.lives <= 0) {
    // Prima di game over, controlla se può continuare
    if (this.gameState.coins >= 15) {
        // Mostra schermata "CONTINUE? Costa 15 monete"
        this.showContinueScreen();
    } else {
        // Non ha abbastanza monete = game over
        this.gameOver = true;
        document.getElementById('game-over-screen').style.display = 'flex';
    }
}

// Funzione continue:
continueGame() {
    this.gameState.spendCoins(15);
    this.player.lives = 1;
    this.restartLevel();
}
```

### Vantaggi
- ✅ Mantiene la sfida del game over
- ✅ Dà una seconda chance a chi ha giocato bene (ha monete)
- ✅ Incentiva raccogliere monete durante il gioco
- ✅ Non snatura il gameplay originale

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
