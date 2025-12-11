# 🗺️ Roadmap Migliorie - Bubble Bobble Nostalgie

> **Programma Operativo per il Miglioramento del Gioco**
> 
> Documento di pianificazione per feature future, bug fixes e ottimizzazioni.
> Aggiornato: Dicembre 2025

---

## 📋 Indice

1. [Priorità Alta - Essential](#priorità-alta---essential)
2. [Priorità Media - Enhancement](#priorità-media---enhancement)
3. [Priorità Bassa - Polish](#priorità-bassa---polish)
4. [Feature Future - Vision](#feature-future---vision)
5. [Ottimizzazioni Tecniche](#ottimizzazioni-tecniche)

---

## 🔴 Priorità Alta - Essential

### 1.1 Audio & Sound System ⭐⭐⭐

**Descrizione**: Il gioco attualmente non ha audio. Implementare sistema sonoro completo.

**Implementazione**:
- [ ] **Musica di Sottofondo**
  - File: `assets/music/theme.mp3`
  - Loop continuo durante gameplay
  - Volume regolabile (slider in settings)
  - Mute button rapido
  
- [ ] **Sound Effects**
  - Shooting bubble: `assets/sfx/shoot.wav`
  - Enemy trapped: `assets/sfx/trap.wav`
  - Enemy popped: `assets/sfx/pop.wav`
  - Collect fruit: `assets/sfx/coin.wav`
  - Jump: `assets/sfx/jump.wav`
  - Level complete: `assets/sfx/victory.wav`
  - Game over: `assets/sfx/gameover.wav`
  
- [ ] **Codice**
  ```javascript
  // Nuovo file: js/AudioManager.js
  class AudioManager {
    constructor() {
      this.sounds = {};
      this.music = null;
      this.volume = 0.7;
      this.muted = false;
    }
    
    loadSound(name, path) { /* ... */ }
    playSound(name) { /* ... */ }
    playMusic(path, loop = true) { /* ... */ }
    setVolume(vol) { /* ... */ }
    toggleMute() { /* ... */ }
  }
  ```

**Stima Tempo**: 4-6 ore  
**Dipendenze**: Nessuna

---

### 1.2 Bug Fixes & Stability

**Descrizione**: Risolvere problemi noti e potenziali race conditions.

- [ ] **Firebase Race Condition**
  - Problema: Module JS potrebbe caricarsi prima di Firebase SDK
  - Soluzione: Await Firebase init prima di usare Database
  - File: `main.js` linea 8-14
  
- [ ] **Collision Edge Cases**
  - Test wrapping verticale con piattaforme strette
  - Fix tunneling se player si muove troppo veloce
  - File: `Level.js` checkCollisionY()
  
- [ ] **Mobile Touch Responsiveness**
  - Joystick a volte non rileva rilascio tocco
  - Fix event listeners per touchend
  - File: `Input.js`

**Stima Tempo**: 3-4 ore

---

### 1.3 Pause Menu

**Descrizione**: Implementare pausa durante gameplay.

**Features**:
- [ ] Pulsante ESC o P per pause
- [ ] Overlay semi-trasparente
- [ ] Opzioni:
  - Resume Game
  - Settings (volume, controlli)
  - Quit to Main Menu
- [ ] Non permettere pause durante countdown finale

**UI Mockup**:
```
┌─────────────────────┐
│      PAUSED         │
├─────────────────────┤
│  [RESUME]           │
│  [SETTINGS]         │
│  [QUIT TO MENU]     │
└─────────────────────┘
```

**Stima Tempo**: 2-3 ore

---

## 🟡 Priorità Media - Enhancement

### 2.1 Animazioni Sprite

**Descrizione**: Aggiungere animazioni ai personaggi invece di sprite statici.

**Implementazione**:
- [ ] **Player Animations**
  - Idle: 4 frames
  - Walk: 6 frames
  - Jump: 3 frames
  - Shoot: 2 frames
  
- [ ] **Enemy Animations**
  - Walk: 4 frames
  - Trapped: 2 frames (wiggle)
  
- [ ] **Sprite Sheet Format**
  ```
  dragon_spritesheet.png
  - Row 1: Idle (0-3)
  - Row 2: Walk (0-5)
  - Row 3: Jump (0-2)
  - Row 4: Shoot (0-1)
  ```

- [ ] **Animation Class**
  ```javascript
  // Nuovo file: js/SpriteAnimation.js
  class SpriteAnimation {
    constructor(spriteSheet, frameWidth, frameHeight) {
      this.sheet = spriteSheet;
      this.frameW = frameWidth;
      this.frameH = frameHeight;
      this.currentFrame = 0;
      this.frameTimer = 0;
      this.fps = 10;
    }
    
    update() {
      this.frameTimer++;
      if (this.frameTimer >= 60 / this.fps) {
        this.currentFrame++;
        this.frameTimer = 0;
      }
    }
    
    draw(ctx, x, y, row) { /* ... */ }
  }
  ```

**Stima Tempo**: 6-8 ore (inclusa creazione sprite)

---

### 2.2 Espansione Shop

**Descrizione**: Aggiungere più power-ups acquistabili.

**Nuovi Items**:
- [ ] **Speed Boost** (150 coins)
  - Aumenta velocità movimento +50%
  - Permanente, stackabile fino a 3x
  
- [ ] **Double Jump** (200 coins)
  - Permette secondo salto in aria
  - Permanente
  
- [ ] **Rapid Fire** (250 coins)
  - Riduce shootInterval da 20 a 10 frames
  - Permanente
  
- [ ] **Shield** (300 coins)
  - 1 hit extra prima di perdere vita
  - Consumabile (dura 1 death)
  
- [ ] **Bubble Rain** (500 coins)
  - Power-up attivabile (tasto R)
  - Spara 5 bolle in direzioni random
  - 3 uses per acquisto

**UI Aggiornamento**:
- Mostrare item già acquistati con checkmark ✓
- Disabilitare bottoni se già comprati (se non stackable)
- Tooltip con descrizione dettagliata

**Stima Tempo**: 5-6 ore

---

### 2.3 Sistema di Achievements

**Descrizione**: Badge e obiettivi per aumentare replay value.

**Achievements**:
- [ ] **Beginner**
  - "First Steps" - Completa livello 1
  - "Bubble Master" - Cattura 10 nemici
  
- [ ] **Intermediate**
  - "Speedrunner" - Completa livello in < 60 sec
  - "Collector" - Raccogli 50 frutti
  - "No Death Run" - Completa 3 livelli senza morire
  
- [ ] **Advanced**
  - "Pacifist" - Completa livello senza catturare nemici (impossibile?)
  - "Rich" - Accumula 1000 coins
  - "Level 10 Master" - Raggiungi livello 10

**Implementazione**:
```javascript
// Nuovo file: js/AchievementManager.js
const ACHIEVEMENTS = {
  first_steps: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete Level 1',
    points: 10,
    icon: '🎯'
  },
  // ...
};

class AchievementManager {
  checkAchievements(gameState, game) { /* ... */ }
  unlockAchievement(id) { /* Show toast notification */ }
}
```

**UI**:
- Schermata "Achievements" accessibile da main menu
- Barra progresso per achievements parziali
- Toast notification quando sbloccato

**Stima Tempo**: 4-5 ore

---

### 2.4 Leaderboard Globale

**Descrizione**: Classifiche online per competitività.

**Features**:
- [ ] **Scoreboards**
  - Global High Score (all-time)
  - Weekly High Score
  - Per-Level Best Time
  
- [ ] **Firestore Structure**
  ```javascript
  leaderboards/
    global/
      - userId: string
      - username: string
      - score: number
      - timestamp: date
    
    weekly/
      - ... (con auto-reset ogni lunedì)
    
    level_times/
      level_1/
        - userId, time, timestamp
  ```

- [ ] **UI**
  - Tab "Leaderboard" in main menu
  - Top 100 players
  - Highlight posizione del player
  - Refresh button

**Stima Tempo**: 6-8 ore

---

## 🟢 Priorità Bassa - Polish

### 3.1 Particle Effects

**Descrizione**: Effetti visivi per aumentare juice.

**Effetti**:
- [ ] Bubble pop → particelle blu che si disperdono
- [ ] Enemy trapped → stelle gialle
- [ ] Fruit collected → sparkles
- [ ] Player death → esplosione
- [ ] Level complete → coriandoli

**Implementazione**:
```javascript
// Nuovo file: js/ParticleSystem.js
class Particle {
  constructor(x, y, color, velocityX, velocityY) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = velocityX;
    this.vy = velocityY;
    this.life = 60; // frames
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // gravity
    this.life--;
  }
  
  draw(ctx) { /* ... */ }
}

class ParticleSystem {
  emit(x, y, count, color) { /* Crea particelle */ }
  update() { /* Aggiorna tutte */ }
  draw(ctx) { /* Disegna tutte */ }
}
```

**Stima Tempo**: 3-4 ore

---

### 3.2 Tutorial Interattivo

**Descrizione**: Guida per nuovi giocatori.

**Flow**:
1. **Prima volta che giochi** → Mostra tutorial
2. **Step 1**: "Usa ← → per muoverti"
3. **Step 2**: "Premi ↑ per saltare"
4. **Step 3**: "Spara bolle con Z/X/Spazio"
5. **Step 4**: "Cattura tutti i nemici per vincere!"

**Implementazione**:
- Overlay con frecce che puntano ai controlli
- Nemici "dummy" che non attaccano
- Completamento automatico quando player esegue l'azione

**Stima Tempo**: 4 ore

---

### 3.3 Temi Visivi / Skins

**Descrizione**: Personalizzazione estetica.

**Temi**:
- [ ] **Classic** (attuale)
- [ ] **Neon** (colori fluorescenti, sfondo scuro)
- [ ] **Retro** (palette Game Boy)
- [ ] **Candy** (pastelli dolci)

**Implementazione**:
- CSS variables per colori
- Filtri canvas per effetti
- Salvataggio preferenza in GameState

**Stima Tempo**: 3-4 ore

---

### 3.4 Statistiche Giocatore

**Descrizione**: Tracciamento dettagliato performance.

**Stats da Tracciare**:
- Total play time
- Enemies trapped (lifetime)
- Fruits collected (lifetime)
- Deaths counter
- Highest level reached
- Average level completion time
- Accuracy (bubbles shot / enemies trapped)

**UI**:
- Tab "Stats" in profile/menu
- Grafici (chart.js?)
- Comparazione con media globale

**Stima Tempo**: 3-4 ore

---

## 🔮 Feature Future - Vision

### 4.1 Multiplayer Co-op

**Descrizione**: Due giocatori collaborano nel completare livelli.

**Requisiti**:
- WebSocket server (Firebase Realtime Database o Socket.io)
- Sincronizzazione posizione Player 2
- Collisioni tra players
- Lobby system (create room / join room)
- Chat testuale

**Complessità**: ⭐⭐⭐⭐⭐  
**Stima Tempo**: 20-30 ore

---

### 4.2 Level Editor

**Descrizione**: Permetti ai giocatori di creare e condividere livelli.

**Features**:
- Drag & drop tiles
- Placement nemici/frutti
- Test mode
- Upload su Firebase
- Browse community levels
- Rating system (stelle)

**Complessità**: ⭐⭐⭐⭐  
**Stima Tempo**: 15-20 ore

---

### 4.3 Boss Battles

**Descrizione**: Ogni 5 livelli, un boss battle.

**Boss Types**:
- **Boss 1 (Livello 5)**: Slime gigante che si divide
- **Boss 2 (Livello 10)**: Drago che sputa fuoco
- **Boss 3 (Livello 15)**: Robot con laser

**Meccaniche**:
- Pattern attacks
- Fasi multiple (health bars)
- Arena dedicata
- Ricompensa speciale (power-up unico)

**Complessità**: ⭐⭐⭐⭐  
**Stima Tempo**: 12-15 ore per boss

---

### 4.4 Story Mode

**Descrizione**: Aggiungere narrativa al gioco.

**Elementi**:
- Cutscenes tra livelli (dialoghi testuali)
- Personaggi NPC
- Missioni secondarie
- Finale multiplo (basato su achievements)

**Complessità**: ⭐⭐⭐⭐⭐  
**Stima Tempo**: 25+ ore

---

## ⚙️ Ottimizzazioni Tecniche

### 5.1 Performance

- [ ] **Object Pooling**
  - Riutilizza oggetti Bubble/Enemy invece di create/destroy
  - Riduce garbage collection
  
- [ ] **Offscreen Culling**
  - Non disegnare entità fuori schermo
  - Check boundary prima di draw()
  
- [ ] **Debounce Input**
  - Evita input spam (specialmente touch)
  
- [ ] **Lazy Load Assets**
  - Carica immagini solo quando necessarie
  - Preload screen iniziale

**Stima Tempo**: 4-5 ore

---

### 5.2 Code Quality

- [ ] **ESLint Setup**
  - Configurare linting per codice consistente
  - Fix warnings esistenti
  
- [ ] **JSDoc Comments**
  - Documentare tutte le classi e metodi pubblici
  
- [ ] **Unit Tests**
  - Jest per logica di gioco
  - Test collision detection, GameState, etc.
  
- [ ] **Refactoring**
  - Separare main.js (troppo grande)
  - Creare UIManager.js per gestire tutti i menu

**Stima Tempo**: 8-10 ore

---

### 5.3 Build & Deploy

- [ ] **Webpack/Vite Setup**
  - Bundle ottimizzato
  - Minificazione
  - Tree shaking
  
- [ ] **PWA (Progressive Web App)**
  - Manifest.json
  - Service Worker per offline play
  - Installabile su home screen
  
- [ ] **CI/CD Pipeline**
  - GitHub Actions per auto-deploy
  - Firebase Hosting per web version
  
- [ ] **Analytics**
  - Firebase Analytics per tracciare usage
  - Crash reporting (Sentry?)

**Stima Tempo**: 6-8 ore

---

## 📊 Timeline Suggerita

### Fase 1 - Foundation (2-3 settimane)
1. Audio System
2. Bug Fixes
3. Pause Menu
4. Performance Optimization

### Fase 2 - Content (3-4 settimane)
1. Animazioni Sprite
2. Espansione Shop
3. Achievements
4. Leaderboard

### Fase 3 - Polish (2 settimane)
1. Particle Effects
2. Tutorial
3. Stats Tracking
4. Code Quality

### Fase 4 - Vision (Futuro)
1. Multiplayer
2. Level Editor
3. Boss Battles
4. Story Mode

---

## 🎯 Quick Wins (Cose Facili da Implementare Subito)

1. **Mute Button** (30 min)
   - Anche senza audio, prepara l'infrastruttura
   
2. **FPS Counter** (15 min)
   - Debug tool utile
   
3. **Fullscreen Toggle** (20 min)
   - Button per andare fullscreen
   
4. **Credits Screen** (1 ora)
   - Tab "About" con crediti e versione
   
5. **Keyboard Shortcuts Overlay** (1 ora)
   - Mostra controlli con tasto "H" (help)

---

## 📝 Note Finali

- **Prioritizza sempre user feedback**: Testa con giocatori reali
- **Mantieni scope realistico**: Non implementare tutto subito
- **Itera rapidamente**: Meglio feature piccole e funzionanti
- **Documenta**: Aggiorna questa roadmap man mano

**Autore**: Bubble Bobble Nostalgie Team  
**Ultimo Aggiornamento**: 2025-12-09  
**Versione Documento**: 1.0
