# 🚀 GUIDA: Pubblicare Stack & Dash su GitHub Pages

Questa guida ti spiega passo passo come pubblicare il gioco online gratuitamente.

---

## 📋 PREREQUISITI

- ✅ Account GitHub (gratis) - se non ce l'hai vai su [github.com](https://github.com) e registrati
- ✅ Il gioco è già pronto nel tuo Mac

---

## STEP 1: Crea un Account GitHub (se non ce l'hai)

1. Vai su **https://github.com**
2. Clicca **Sign up**
3. Inserisci:
   - Email
   - Password
   - Username (sarà parte del tuo link, es: `tuousername.github.io`)
4. Completa la verifica email

---

## STEP 2: Crea un Nuovo Repository

1. Vai su **https://github.com/new**
2. Compila:
   - **Repository name**: `stackanddash`
   - **Description**: "Stack & Dash - Platform Game PWA" (opzionale)
   - ✅ Seleziona **Public**
   - ⚠️ **NON selezionare** "Add a README file"
   - ⚠️ **NON selezionare** "Add .gitignore"
3. Clicca **Create repository**

---

## STEP 3: Collega il Tuo Progetto al Repository

Dopo aver creato il repository, GitHub ti mostra una pagina con dei comandi.

### Apri il Terminale sul Mac e esegui questi comandi:

```bash
cd "/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash/web_game"
```

Poi esegui (sostituisci `TUO_USERNAME` con il tuo username GitHub):

```bash
git remote add origin https://github.com/TUO_USERNAME/stackanddash.git
git branch -M main
git push -u origin main
```

### ⚠️ Se ti chiede le credenziali:
- **Username**: il tuo username GitHub
- **Password**: devi usare un **Personal Access Token** (non la password normale!)

#### Come creare un Personal Access Token:
1. Vai su **https://github.com/settings/tokens**
2. Clicca **Generate new token (classic)**
3. Note: "Mac push"
4. Expiration: 90 days
5. Seleziona ✅ **repo** (tutte le checkbox sotto repo)
6. Clicca **Generate token**
7. **COPIA IL TOKEN** (lo vedrai solo una volta!)
8. Usa questo token come password nel terminale

---

## STEP 4: Abilita GitHub Pages

1. Vai sul tuo repository: `https://github.com/TUO_USERNAME/stackanddash`
2. Clicca **Settings** (icona ingranaggio in alto a destra)
3. Nel menu laterale sinistro, clicca **Pages**
4. Nella sezione "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: seleziona `main`
   - **Folder**: seleziona `/ (root)`
5. Clicca **Save**

---

## STEP 5: Attendi il Deploy

1. Aspetta 2-3 minuti
2. Torna alla pagina **Settings → Pages**
3. Vedrai un banner verde con il link:
   
   ```
   Your site is live at https://TUO_USERNAME.github.io/stackanddash/
   ```

---

## 📱 STEP 6: Installa la PWA su iPhone

1. Apri **Safari** sul tuo iPhone (deve essere Safari!)
2. Vai al link: `https://TUO_USERNAME.github.io/stackanddash/`
3. Tocca l'icona **Condividi** (quadrato con freccia verso l'alto)
4. Scorri e tocca **"Aggiungi a Home"**
5. Modifica il nome se vuoi, poi tocca **Aggiungi**
6. L'app appare sulla tua Home Screen! 🎉

---

## 🔄 Aggiornare il Gioco

Quando fai modifiche al gioco, per pubblicarle online:

```bash
cd "/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash/web_game"
git add -A
git commit -m "Aggiornamento gioco"
git push
```

Le modifiche saranno online in 1-2 minuti.

---

## 🔗 Condividere con Amici

Manda ai tuoi amici il link:
```
https://TUO_USERNAME.github.io/stackanddash/
```

Loro dovranno:
1. Aprire il link su **Safari** (iPhone) o **Chrome** (Android)
2. Aggiungere alla Home Screen per l'esperienza app

---

## ❓ Risoluzione Problemi

### "Permission denied" quando fai push
→ Verifica che stai usando il Personal Access Token, non la password

### "Repository not found"
→ Verifica che l'URL sia corretto e che il repo sia pubblico

### La pagina non si carica
→ Aspetta 5 minuti, GitHub Pages può richiedere tempo

### L'app non si aggiorna su iPhone
→ Cancella la PWA dalla Home e aggiungila di nuovo

---

## ✅ Checklist Finale

- [ ] Account GitHub creato
- [ ] Repository `stackanddash` creato
- [ ] Codice pushato con `git push`
- [ ] GitHub Pages abilitato
- [ ] Link funzionante
- [ ] PWA installata su iPhone

---

**Il tuo link sarà:**
```
https://TUO_USERNAME.github.io/stackanddash/
```

Sostituisci `TUO_USERNAME` con il tuo username GitHub!
