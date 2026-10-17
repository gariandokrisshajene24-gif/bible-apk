const CACHE_NAME = 'wordpath-shell-v3';
const BIBLE_CACHE_NAME = 'wordpath-bible-kjv-v1';
const BIBLE_BASE_URL = 'https://raw.githubusercontent.com/nolanbaxter/kjv-bible/main/';
const BIBLE_FILES = [
  'genesis.json','exodus.json','leviticus.json','numbers.json','deuteronomy.json',
  'joshua.json','judges.json','ruth.json','1_samuel.json','2_samuel.json',
  '1_kings.json','2_kings.json','1_chronicles.json','2_chronicles.json','ezra.json',
  'nehemiah.json','esther.json','job.json','psalms.json','proverbs.json','ecclesiastes.json',
  'song_of_solomon.json','isaiah.json','jeremiah.json','lamentations.json','ezekiel.json',
  'daniel.json','hosea.json','joel.json','amos.json','obadiah.json','jonah.json','micah.json',
  'nahum.json','habakkuk.json','zephaniah.json','haggai.json','zechariah.json','malachi.json',
  'matthew.json','mark.json','luke.json','john.json','acts.json','romans.json',
  '1_corinthians.json','2_corinthians.json','galatians.json','ephesians.json','philippians.json',
  'colossians.json','1_thessalonians.json','2_thessalonians.json','1_timothy.json','2_timothy.json',
  'titus.json','philemon.json','hebrews.json','james.json','1_peter.json','2_peter.json',
  '1_john.json','2_john.json','3_john.json','jude.json','revelation.json'
];
const APP_SHELL = [
  './','./index.html','./styles.css','./app.js','./manifest.webmanifest',
  './icons/wordpath-192.png','./icons/wordpath-512.png',
  './icons/wordpath-512-maskable.png','./icons/wordpath-180.png'
];
let bibleDownloadPromise = null;

function localBibleUrl(filename) {
  return new URL(`./bible/kjv/${filename}`, self.registration.scope).href;
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach(client => client.postMessage(message));
}

async function countCachedBooks(cache) {
  let count = 0;
  for (const filename of BIBLE_FILES) {
    if (await cache.match(localBibleUrl(filename))) count++;
  }
  return count;
}

async function downloadBibleBooks() {
  if (bibleDownloadPromise) return bibleDownloadPromise;
  bibleDownloadPromise = (async () => {
    const cache = await caches.open(BIBLE_CACHE_NAME);
    let nextIndex = 0;
    let cached = await countCachedBooks(cache);
    await notifyClients({ type: 'BIBLE_CACHE_PROGRESS', cached, total: BIBLE_FILES.length });

    async function worker() {
      while (nextIndex < BIBLE_FILES.length) {
        const filename = BIBLE_FILES[nextIndex++];
        const key = localBibleUrl(filename);
        if (await cache.match(key)) continue;

        let saved = false;
        for (let attempt = 0; attempt < 2 && !saved; attempt++) {
          try {
            const response = await fetch(BIBLE_BASE_URL + filename, { mode: 'cors', cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            // Validate JSON and ensure the book has chapter data before caching it.
            const copy = response.clone();
            const data = await copy.json();
            if (!data || !data.chapters || typeof data.chapters !== 'object') throw new Error('Invalid Bible book data');
            await cache.put(key, response.clone());
            cached++;
            saved = true;
            await notifyClients({ type: 'BIBLE_CACHE_PROGRESS', cached, total: BIBLE_FILES.length, current: filename });
          } catch (error) {
            if (attempt === 1) console.warn('WordPath could not cache Bible book:', filename, error);
          }
        }
      }
    }

    // A small concurrency limit is friendlier to phones and public hosting.
    await Promise.all(Array.from({ length: 4 }, () => worker()));
    cached = await countCachedBooks(cache);
    const complete = cached === BIBLE_FILES.length;
    await notifyClients({ type: 'BIBLE_CACHE_COMPLETE', cached, total: BIBLE_FILES.length, complete });
    return { cached, total: BIBLE_FILES.length, complete };
  })().finally(() => { bibleDownloadPromise = null; });
  return bibleDownloadPromise;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('wordpath-shell-') && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
    // Attempt to save all 66 books during first setup. Failures are reported and can be retried in-app.
    await downloadBibleBooks();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'DOWNLOAD_BIBLE') {
    event.waitUntil(downloadBibleBooks());
  }
  if (event.data?.type === 'GET_BIBLE_STATUS') {
    event.waitUntil((async () => {
      const cache = await caches.open(BIBLE_CACHE_NAME);
      const cached = await countCachedBooks(cache);
      await notifyClients({ type: 'BIBLE_CACHE_COMPLETE', cached, total: BIBLE_FILES.length, complete: cached === BIBLE_FILES.length });
    })());
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Serve full KJV book JSON from this device's cache. If missing, fetch and cache it online.
  if (url.origin === self.location.origin && url.pathname.includes('/bible/kjv/')) {
    const filename = url.pathname.split('/').pop();
    if (!BIBLE_FILES.includes(filename)) return;
    event.respondWith((async () => {
      const cache = await caches.open(BIBLE_CACHE_NAME);
      const key = localBibleUrl(filename);
      const cached = await cache.match(key);
      if (cached) return cached;
      try {
        const response = await fetch(BIBLE_BASE_URL + filename, { mode: 'cors' });
        if (response.ok) await cache.put(key, response.clone());
        return response;
      } catch {
        return new Response(JSON.stringify({ error: 'This Bible book is not saved offline yet.' }), {
          status: 503, headers: { 'Content-Type': 'application/json' }
        });
      }
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        await cache.put('./index.html', response.clone());
        return response;
      } catch {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      throw error;
    }
  })());
});
