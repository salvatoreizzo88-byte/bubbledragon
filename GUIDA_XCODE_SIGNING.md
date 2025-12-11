# 📱 Guida Configurazione Xcode per iPhone

## Problema
L'errore "Signing for App requires a development team" significa che Xcode non sa CHI sta creando l'app.

---

## PASSO 1: Apri il Progetto Giusto

1. In Xcode, guarda la **barra laterale sinistra**
2. Clicca sulla **cartella blu** in alto che si chiama **"App"**

```
📁 App          ← CLICCA QUI (icona blu del progetto)
  📁 App
  📁 Pods
```

---

## PASSO 2: Seleziona il Target

Dopo aver cliccato sul progetto blu:

1. Al **centro dello schermo** vedrai due colonne
2. Nella colonna di sinistra ci sono:
   - **PROJECT** → App
   - **TARGETS** → App ← **CLICCA SU QUESTO**

---

## PASSO 3: Vai a Signing & Capabilities

1. Ora guarda le **tab in alto** (General, Signing & Capabilities, Resource Tags...)
2. Clicca su **"Signing & Capabilities"**

---

## PASSO 4: Configura il Team

Ora vedrai questa sezione:

```
☑️ Automatically manage signing    ← DEVE ESSERE SPUNTATO

Team: None                         ← CLICCA QUI PER CAMBIARE
      ⌄
```

### Cosa fare:
1. **Clicca sul menu dropdown "Team"**
2. Se vedi il tuo nome/Apple ID → **Selezionalo**
3. Se vedi solo "None" o "Add an Account...":
   - Clicca **"Add an Account..."**
   - Inserisci la tua **email Apple ID** (quella che usi per iPhone/App Store)
   - Inserisci la **password**
   - Torna qui e seleziona il tuo account

---

## PASSO 5: Cambia Bundle Identifier (se necessario)

Se vedi un errore rosso sotto "Bundle Identifier":

1. Trova il campo **Bundle Identifier**
2. Cambialo da `com.example.app` a qualcosa di unico:
   ```
   com.salvatoreizzo.bubblebobble
   ```
3. Usa il tuo nome + nome del gioco per renderlo unico

---

## PASSO 6: Pulisci e Ricompila

1. Menu **Product → Clean Build Folder** (o premi `Cmd + Shift + K`)
2. Aspetta qualche secondo
3. Clicca il **pulsante Play ▶️** in alto a sinistra

---

## PASSO 7: Autorizza sul Telefono (Prima volta)

La prima volta che installi, l'iPhone bloccherà l'app.

Sul tuo **iPhone**:
1. Vai in **Impostazioni**
2. Vai in **Generali**
3. Scorri fino a **VPN e gestione dispositivo** (o "Gestione dispositivo")
4. Troverai il tuo profilo sviluppatore
5. **Clicca su "Autorizza"**

---

## Risoluzione Problemi Comuni

### "Failed to register bundle identifier"
→ Cambia il Bundle Identifier con un nome diverso

### "Device is not available"
→ Sblocca l'iPhone e clicca "Autorizza questo computer" se appare

### "Untrusted Developer"
→ Segui il PASSO 7 per autorizzare l'app sul telefono

---

## Riepilogo Veloce

1. ✅ Clicca progetto blu "App"
2. ✅ Seleziona target "App" sotto TARGETS
3. ✅ Tab "Signing & Capabilities"
4. ✅ Spunta "Automatically manage signing"
5. ✅ Seleziona il tuo Apple ID nel Team
6. ✅ Cambia Bundle ID se serve
7. ✅ Clean + Run
8. ✅ Autorizza sul telefono
