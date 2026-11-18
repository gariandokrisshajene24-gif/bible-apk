# WordPath — upgraded installable Bible web app

## Included project files
- `index.html` — login screen and all existing application views
- `styles.css` — original styles plus responsive login/account enhancements
- `app.js` — existing WordPath functionality plus email-only access gate and multilingual Bible loading
- `manifest.webmanifest` — PWA metadata and launcher icons
- `service-worker.js` — updated app-shell cache (`wordpath-shell-v6`)
- `icons/` — WordPath launcher and Apple touch icons

## Run locally with VS Code Live Server
1. Extract the ZIP file.
2. Open the extracted `WordPath_Upgraded` folder in Visual Studio Code.
3. Install the **Live Server** extension by Ritwick Dey if it is not installed.
4. Right-click `index.html` and choose **Open with Live Server**.
5. WordPath opens at a local address similar to `http://127.0.0.1:5500/index.html`.

You can also use Python's local server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy
Upload the contents of this folder to an HTTPS static host such as Netlify, Vercel, or GitHub Pages. Keep the files and `icons` folder together.

## Sign-in behavior and privacy
The email-only sign-in is a **local device access gate**. It validates the email format and remembers the email and sign-in state in this browser's local storage. It does not verify ownership of the email address and is not secure account authentication. Anyone with access to the same browser profile can clear local storage or bypass a client-side gate. Do not use it to protect confidential or sensitive data. A true verified sign-in system requires a trusted authentication provider or backend.

Signing out hides the app and retains the last email for convenience. It does not delete bookmarks, journal entries, reading progress, or other app data.

## Bible translations
- English continues to use the existing KJV / WEB / ASV selection and existing Bible source logic.
- Bisaya (Cebuano), Tagalog (Filipino), and Spanish use the Free Use Bible API translation catalogue at https://bible.helloao.org. The app checks the live catalogue and book list rather than guessing translation IDs.
- Waray-Waray is the Samarenyo Meaning-Based Bible (1984), MBBSAM, published by the Philippine Bible Society. It is verified as available on YouVersion/Bible.com, but the current in-app JSON provider does not expose its chapter text. When Waray is selected, WordPath now gives a direct link to that real edition for the selected book/chapter instead of incorrectly claiming no Waray Bible exists or showing fabricated text. Source: https://www.bible.com/versions/2198.
- Bible text is retrieved online. An unavailable source or chapter produces an explanatory message rather than guessed Scripture.
- Translation licences and attribution differ by edition. The reader displays available attribution/license information returned by the provider. Review each edition's licence before redistributing Scripture text.
- Bible chapters are online-only and require an internet connection.

## Existing data
Existing localStorage keys for bookmarks, reading-plan progress, prayer journal, theme, and font size are retained. The new language preference and sign-in state use separate keys.

## PWA notes
The service worker cache was bumped to `wordpath-shell-v6` so installed users receive the updated app shell. Bible text is not cached for offline reading. The interface can reopen offline, but Scripture content still requires internet access.
