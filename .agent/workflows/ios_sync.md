---
description: Workflow for iOS development to ensure changes are synced
---

When making any changes to the web code (`js/`, `css/`, `index.html`) while working on the iOS version:

1. Perform the code edits.
2. IMMEDIATELY run the synchronization command:
   ```bash
   npm run sync:ios
   ```
   // turbo

This ensures the iOS simulator picks up the latest web assets.
