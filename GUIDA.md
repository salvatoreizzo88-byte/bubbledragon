# Guida Avvio Gioco Bubble Bobble

Questa guida ti aiuterà a far partire il gioco in locale.

## Requisiti
Il gioco richiede un server locale perché utilizza moduli JavaScript moderni.
Hai già **Python 3** installato, che useremo per creare il server.

## Come Avviare il Gioco

1. **Apri il Terminale**
   Apri l'applicazione Terminale sul tuo Mac.

2. **Vai nella cartella del gioco**
   Copia e incolla questo comando nel terminale e premi Invio:
   ```bash
   cd "/Users/salvatoreizzo/Desktop/gioco /programmazione/StackAndDash/web_game/"
   ```

3. **Avvia il Server**
   Copia e incolla questo comando e premi Invio:
   ```bash
   python3 -m http.server 8000
   ```
   *Se la porta 8000 è occupata, prova con 8080 o un altro numero.*

4. **Gioca!**
   Apri il tuo browser (Chrome, Safari, ecc.) e vai a questo indirizzo:
   [http://localhost:8000](http://localhost:8000)

## Come Chiudere
Quando hai finito di giocare, torna sul Terminale e premi `Ctrl + C` per spegnere il server.
