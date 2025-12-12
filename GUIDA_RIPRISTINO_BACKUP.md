# 🔄 Guida Ripristino Backup Versione 2D

Questa guida spiega come ripristinare la versione 2D del gioco (Bubble Bobble) se qualcosa va storto con la migrazione 3D.

## 📅 Data Backup: 12 Dicembre 2024

**Versione salvata**: v1.0-2d-complete
- Gioco 2D funzionante
- Firebase integrato
- Shop e progressione
- AI nemici con pathfinding EasyStar.js

---

## ⚡ Ripristino Rapido (Metodo Consigliato)

### Opzione 1: Usando Git Tag

```bash
# Vai nella cartella del progetto
cd "/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash/web_game"

# Ripristina alla versione 2D
git checkout v1.0-2d-complete

# Se vuoi tornare a lavorare sul main dopo
git checkout main
```

### Opzione 2: Usando Git Branch

```bash
cd "/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash/web_game"

# Passa al branch backup
git checkout backup-2d-version

# Per tornare al main
git checkout main
```

---

## 🗂️ Ripristino Completo (se Git non funziona)

Se Git è corrotto o hai problemi:

### Passo 1: Rinomina la cartella corrente
```bash
mv "/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash" "/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash_BROKEN"
```

### Passo 2: Rinomina il backup
```bash
mv "/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash_BACKUP_2D" "/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash"
```

### Passo 3: Sincronizza iOS
```bash
cd "/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash/web_game"
./sync-ios.sh
```

---

## 🌐 Ripristino da GitHub (ultima risorsa)

Se hai perso tutto localmente:

```bash
# Clona il repository
git clone https://github.com/salvatoreizzo88-byte/bubbledragon.git

# Vai al tag backup
cd bubbledragon
git checkout v1.0-2d-complete
```

---

## ✅ Verifica Ripristino

Dopo il ripristino, verifica che funzioni:

1. **Apri Xcode**:
   ```bash
   cd web_game && npx cap open ios
   ```

2. **Testa sul simulatore**:
   - Il gioco dovrebbe mostrare il menu principale
   - Prova a iniziare una partita
   - Verifica che i nemici si muovano

3. **Controlla i log**:
   - Non dovrebbero esserci errori JavaScript
   - Dovresti vedere "WebView loaded"

---

## 📞 Problemi?

Se hai problemi con il ripristino:

1. Verifica di essere nella cartella giusta
2. Controlla che il backup esista: `ls -la ../StackAndDash_BACKUP_2D`
3. Controlla i tag Git: `git tag -l`
4. Controlla i branch: `git branch -a`

---

## 📝 Note

- Il backup include **tutto**: codice, assets, configurazioni
- Firebase rimane configurato (non serve riconfigurare)
- Le credenziali iOS/Android sono nel backup
