#!/bin/bash
# sync-ios.sh - Script per sincronizzare l'app iOS con il codice web aggiornato

echo "🔄 Sincronizzazione iOS in corso..."

# Vai alla directory del progetto
cd "$(dirname "$0")"

# Rimuovi la vecchia cartella www
echo "🗑️  Rimuovendo vecchia cartella www..."
rm -rf www

# Crea nuova cartella www
mkdir -p www

# Copia tutti i file necessari
echo "📁 Copiando file aggiornati..."
cp -r index.html game3d.html style.css js assets manifest.json sw.js www/

# Esegui cap sync
echo "⚡ Eseguendo cap sync ios..."
npx cap sync ios

echo ""
echo "✅ Sincronizzazione completata!"
echo ""
echo "Ora puoi:"
echo "  1. Aprire Xcode con: npx cap open ios"
echo "  2. Eseguire l'app sul simulatore"
