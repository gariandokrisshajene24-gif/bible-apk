# WordPath — updated installable web app

## What's changed
- Bible verses are online-only. The app does not download or store Bible text for offline reading.
- The service worker caches the app interface only, so the interface can reopen offline but verse content still needs internet.
- Removed the in-app “Download Bible for offline use” control.
- The “Install app” button hides when running in installed mode and after the install prompt is accepted.
- Set the installed app name to **WordPath** and included launcher icons.
- Kept bookmarks, prayer journal, reading-plan progress, and preferences in local device/browser storage.

## Run locally
Use a local web server rather than opening `index.html` directly:
```bash
python -m http.server 8000
```
Then visit http://localhost:8000.

## Deploy
Upload the contents of this folder to an HTTPS static host such as Netlify, Vercel, or GitHub Pages. Keep all files and the `icons` folder together.

## Important
- Bible chapters require an internet connection.
- The install button is browser-dependent. If the browser does not support the install prompt, the button explains how to install through the browser menu.
- The app name shown under the icon is controlled by the operating system/browser and may take a reinstall or removal/re-add to the home screen to refresh after changing the manifest.
- Bookmarks and journal entries are stored on this device in the current browser profile; they are not synced or backed up.
