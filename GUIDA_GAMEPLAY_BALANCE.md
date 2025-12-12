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

### 1. Transizione Livello Troppo Lunga
- **Problema:** 15 secondi è troppo per i giocatori moderni
- **Soluzione:** Ridurre a 3-5 secondi
- **Come:** In `GameConfig.js` cambiare `transitionDuration: 900` → `180-300`

### 2. Sistema Vite Frustrante
- **Problema:** 3 vite e poi game over totale
- **Soluzione A:** Vite infinite + perdita monete/XP
- **Soluzione B:** Checkpoint ogni 5 livelli
- **Come:** Modificare logica in `Game.js` funzione `update()` (riga ~160)

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

### Ridurre Transizione Livello
```javascript
// GameConfig.js linea 42
transitionDuration: 180, // Era 900 (15s) → Ora 180 (3s)
```

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

## 🎯 Sistema Vite Moderno (Proposta)

### Opzione A: Vite Infinite con Penalità
```javascript
// In Game.js, quando player muore:
if (this.player.lives <= 0) {
    // Invece di game over:
    this.player.lives = 3; // Reset vite
    this.gameState.spendCoins(50); // Penalità in monete
    this.restartLevel(); // Riprova stesso livello
}
```

### Opzione B: Checkpoint System
```javascript
// Ogni 5 livelli = checkpoint
if (this.levelIndex % 5 === 0) {
    this.gameState.checkpoint = this.levelIndex;
}

// Quando muori, riparti dal checkpoint invece che dal livello 1
```

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
