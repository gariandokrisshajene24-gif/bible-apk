/* =========================================================
   WORDPATH — Bible Reader & Reflection Companion
   Improved JavaScript
   ========================================================= */

'use strict';

/* -------------------- BIBLE DATA -------------------- */

const BOOKS = [
    ['Genesis',50,'OT','genesis'],['Exodus',40,'OT','exodus'],
    ['Leviticus',27,'OT','leviticus'],['Numbers',36,'OT','numbers'],
    ['Deuteronomy',34,'OT','deuteronomy'],['Joshua',24,'OT','joshua'],
    ['Judges',21,'OT','judges'],['Ruth',4,'OT','ruth'],
    ['1 Samuel',31,'OT','1-samuel'],['2 Samuel',24,'OT','2-samuel'],
    ['1 Kings',22,'OT','1-kings'],['2 Kings',25,'OT','2-kings'],
    ['1 Chronicles',29,'OT','1-chronicles'],['2 Chronicles',36,'OT','2-chronicles'],
    ['Ezra',10,'OT','ezra'],['Nehemiah',13,'OT','nehemiah'],
    ['Esther',10,'OT','esther'],['Job',42,'OT','job'],
    ['Psalms',150,'OT','psalms'],['Proverbs',31,'OT','proverbs'],
    ['Ecclesiastes',12,'OT','ecclesiastes'],['Song of Solomon',8,'OT','song-of-solomon'],
    ['Isaiah',66,'OT','isaiah'],['Jeremiah',52,'OT','jeremiah'],
    ['Lamentations',5,'OT','lamentations'],['Ezekiel',48,'OT','ezekiel'],
    ['Daniel',12,'OT','daniel'],['Hosea',14,'OT','hosea'],['Joel',3,'OT','joel'],
    ['Amos',9,'OT','amos'],['Obadiah',1,'OT','obadiah'],['Jonah',4,'OT','jonah'],
    ['Micah',7,'OT','micah'],['Nahum',3,'OT','nahum'],['Habakkuk',3,'OT','habakkuk'],
    ['Zephaniah',3,'OT','zephaniah'],['Haggai',2,'OT','haggai'],
    ['Zechariah',14,'OT','zechariah'],['Malachi',4,'OT','malachi'],
    ['Matthew',28,'NT','matthew'],['Mark',16,'NT','mark'],['Luke',24,'NT','luke'],
    ['John',21,'NT','john'],['Acts',28,'NT','acts'],['Romans',16,'NT','romans'],
    ['1 Corinthians',16,'NT','1-corinthians'],['2 Corinthians',13,'NT','2-corinthians'],
    ['Galatians',6,'NT','galatians'],['Ephesians',6,'NT','ephesians'],
    ['Philippians',4,'NT','philippians'],['Colossians',4,'NT','colossians'],
    ['1 Thessalonians',5,'NT','1-thessalonians'],['2 Thessalonians',3,'NT','2-thessalonians'],
    ['1 Timothy',6,'NT','1-timothy'],['2 Timothy',4,'NT','2-timothy'],
    ['Titus',3,'NT','titus'],['Philemon',1,'NT','philemon'],
    ['Hebrews',13,'NT','hebrews'],['James',5,'NT','james'],
    ['1 Peter',5,'NT','1-peter'],['2 Peter',3,'NT','2-peter'],
    ['1 John',5,'NT','1-john'],['2 John',1,'NT','2-john'],
    ['3 John',1,'NT','3-john'],['Jude',1,'NT','jude'],
    ['Revelation',22,'NT','revelation']
];

const VERSION_NAMES = {
    kjv: 'King James Version',
    web: 'World English Bible',
    asv: 'American Standard Version'
};

/* -------------------- MULTILINGUAL BIBLE SOURCE -------------------- */
/* Translation IDs are discovered from the provider catalogue at runtime.
   This avoids guessing IDs or silently substituting a different language. */
const LANGUAGE_OPTIONS = {
    english: { label: 'English', codes: ['eng'], defaultVersion: 'kjv' },
    bisaya: { label: 'Bisaya (Cebuano)', codes: ['ceb'] },
    waray: { label: 'Waray-Waray', codes: ['war'] },
    tagalog: { label: 'Tagalog (Filipino)', codes: ['tgl', 'fil'] },
    spanish: { label: 'Spanish', codes: ['spa'] }
};
const HELLOAO_API = 'https://bible.helloao.org/api';
const localizedCatalogue = { translations: null, books: new Map() };

function currentTranslationKey() {
    return state.language === 'english' ? state.version : `lang:${state.language}`;
}
function currentTranslationName() {
    return state.language === 'english'
        ? (VERSION_NAMES[state.version] || 'English Bible')
        : LANGUAGE_OPTIONS[state.language]?.label || 'Bible translation';
}
// Waray's Samarenyo Meaning-Based Bible (MBBSAM, Philippine Bible Society)
// is verifiably available on YouVersion, but is not exposed by the current
// in-app JSON provider. Offer the real edition rather than inventing verses.
const WARAY_YOUVERSION_BOOKS = [
    'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI',
    '1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER',
    'LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP',
    'HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL',
    'EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE',
    '2PE','1JN','2JN','3JN','JUD','REV'
];
function warayBibleOnlineUrl() {
    const bookCode = WARAY_YOUVERSION_BOOKS[state.book] || 'GEN';
    return `https://www.bible.com/versions/2198?returnTo=${encodeURIComponent(`${bookCode}.${state.chapter}`)}`;
}
async function getTranslationCatalogue() {
    if (!localizedCatalogue.translations) {
        const data = await fetchJSON(`${HELLOAO_API}/available_translations.json`);
        if (!Array.isArray(data.translations)) {
            throw new Error('The Bible translation catalogue is unavailable.');
        }
        localizedCatalogue.translations = data.translations;
    }
    return localizedCatalogue.translations;
}
function translationLanguageCode(item) {
    return String(item.language || item.languageCode || '').toLowerCase();
}
async function findLocalizedTranslation(language) {
    const config = LANGUAGE_OPTIONS[language];
    if (!config || language === 'english') return null;
    const catalogue = await getTranslationCatalogue();
    const matches = catalogue.filter(item =>
        config.codes.includes(translationLanguageCode(item)) &&
        item.id && Number(item.numberOfBooks || 0) >= 1
    );
    if (!matches.length) {
        throw new Error(`No verified ${config.label} Bible translation is currently listed by the Bible provider.`);
    }
    // Prefer a complete 66-book edition, then a known permissive/public-domain licence.
    matches.sort((left, right) => {
        const fullBookDiff = Number(Number(right.numberOfBooks) >= 66) - Number(Number(left.numberOfBooks) >= 66);
        if (fullBookDiff) return fullBookDiff;
        const score = item => {
            const license = item.license || {};
            return (license.copy === 'allowed' ? 2 : 0) +
                (license.distribute === 'allowed' ? 2 : 0) +
                (license.commercialUse === 'allowed' ? 1 : 0);
        };
        return score(right) - score(left) || String(left.id).localeCompare(String(right.id));
    });
    return matches[0];
}
function normalizedBookName(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
async function findProviderBook(translation, bookIndex, chapterNumber) {
    const cacheKey = translation.id;
    if (!localizedCatalogue.books.has(cacheKey)) {
        const data = await fetchJSON(`${HELLOAO_API}/${encodeURIComponent(translation.id)}/books.json`);
        if (!Array.isArray(data.books)) {
            throw new Error('The selected translation does not provide a usable book list.');
        }
        localizedCatalogue.books.set(cacheKey, data.books);
    }
    const providerBooks = localizedCatalogue.books.get(cacheKey);
    const expected = BOOKS[bookIndex];
    const expectedNames = new Set([
        normalizedBookName(expected[0]),
        normalizedBookName(expected[3].replace(/-/g, ' '))
    ]);
    let match = providerBooks.find(item =>
        [item.commonName, item.englishName, item.name, item.title, item.shortName, item.id]
            .some(name => expectedNames.has(normalizedBookName(name)))
    );
    // Use canonical order only when the source advertises the complete 66-book canon.
    if (!match && providerBooks.length === 66 && Number(providerBooks[bookIndex]?.order) === bookIndex + 1) {
        match = providerBooks[bookIndex];
    }
    if (!match) {
        throw new Error(`${expected[0]} is not available in the selected translation.`);
    }
    if (Number(match.numberOfChapters || 0) < Number(chapterNumber)) {
        throw new Error(`${expected[0]} ${chapterNumber} is not available in this translation.`);
    }
    return match;
}
function extractHelloAOVerses(payload) {
    const content = payload?.chapter?.content || payload?.content || [];
    const verses = [];
    for (const item of content) {
        if (item?.type !== 'verse' || !Number.isInteger(Number(item.number))) continue;
        const text = typeof item.text === 'string'
            ? item.text
            : Array.isArray(item.content)
                ? item.content.map(part => typeof part === 'string' ? part : (part?.text || '')).join('')
                : '';
        if (text.trim()) verses.push({ number: Number(item.number), text: text.trim() });
    }
    return verses;
}
async function fetchLocalizedChapter(bookIndex, chapter, language) {
    const translation = await findLocalizedTranslation(language);
    if (!translation) throw new Error('This Bible language is not available.');
    const providerBook = await findProviderBook(translation, bookIndex, chapter);
    const payload = await fetchJSON(
        `${HELLOAO_API}/${encodeURIComponent(translation.id)}/${encodeURIComponent(providerBook.id)}/${Number(chapter)}.simple.json`
    );
    const verses = extractHelloAOVerses(payload);
    if (!verses.length) {
        throw new Error(`The provider has no verified text for ${selectedBook()[0]} ${chapter} in ${LANGUAGE_OPTIONS[language].label}.`);
    }
    return {
        verses,
        version: translation.name || translation.englishName || translation.id,
        attribution: translation.licenseNotice || translation.licenseUrl
            ? `${translation.name || translation.id}${translation.licenseNotice ? ` · ${translation.licenseNotice}` : ''}${translation.licenseUrl ? ` · License: ${translation.licenseUrl}` : ''}`
            : `${translation.name || translation.id} · Check the provider's translation licence before redistribution.`,
        translationId: translation.id
    };
}
async function fetchCurrentChapter(bookIndex, chapter) {
    if (state.language === 'english') return fetchChapter(bookIndex, chapter, state.version);
    return fetchLocalizedChapter(bookIndex, chapter, state.language);
}

const STORAGE = {
    bookmarks: 'wordpath-bookmarks',
    completed: 'wordpath-completed',
    journal: 'wordpath-journal',
    theme: 'wordpath-dark',
    fontSize: 'wordpath-font-size',
    language: 'wordpath-language',
    authEmail: 'wordpath-auth-email',
    authenticated: 'wordpath-authenticated'
};

const state = {
    book: 0,
    chapter: 1,
    version: 'kjv',
    language: loadJSON('wordpath-language', 'english'),
    verses: [],
    fontSize: 17,
    currentView: 'reader',
    bookmarks: loadJSON('wordpath-bookmarks', []),
    plan: null,
    completed: loadJSON('wordpath-completed', {}),
    chapterRequest: 0,
    quiz: {
        index: 0,
        score: 0,
        answered: false,
        questions: []
    }
};

const $ = id => document.getElementById(id);

/* -------------------- STORAGE & UTILITIES -------------------- */

function loadJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : (JSON.parse(value) ?? fallback);
    } catch (error) {
        console.warn(`WordPath could not read ${key}.`, error);
        return fallback;
    }
}

function persist(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`WordPath could not save ${key}.`, error);
        toast('Could not save on this device. Check browser storage settings.');
        return false;
    }
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function toast(message) {
    const element = $('toast');
    if (!element) return;

    element.textContent = message;
    element.classList.add('show');

    clearTimeout(toast.timer);

    toast.timer = setTimeout(
        () => element.classList.remove('show'),
        2600
    );
}

function selectedBook() {
    return BOOKS[state.book] || BOOKS[0];
}

function normalizeBook(value) {
    const query = String(value).toLowerCase().replace(/[^a-z0-9]/g, '');

    if (query === 'psalm') {
        return BOOKS.findIndex(book => book[0] === 'Psalms');
    }

    return BOOKS.findIndex(book =>
        book[0].toLowerCase().replace(/[^a-z0-9]/g, '') === query ||
        book[3].replace(/[^a-z0-9]/g, '') === query
    );
}

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

/* -------------------- BOOK & CHAPTER SELECTORS -------------------- */

function populateBooks() {
    const select = $('book-select');
    if (!select) return;

    select.innerHTML = '';

    [
        [
            'Old Testament',
            BOOKS.map((book, index) => ({ book, index }))
                .filter(item => item.book[2] === 'OT')
        ],
        [
            'New Testament',
            BOOKS.map((book, index) => ({ book, index }))
                .filter(item => item.book[2] === 'NT')
        ]
    ].forEach(([label, items]) => {
        const group = document.createElement('optgroup');
        group.label = label;

        items.forEach(item => {
            const option = document.createElement('option');
            option.value = String(item.index);
            option.textContent = item.book[0];
            group.appendChild(option);
        });

        select.appendChild(group);
    });

    select.value = String(state.book);
}

function populateChapters() {
    const select = $('chapter-select');
    if (!select) return;

    const total = selectedBook()[1];

    state.chapter = Math.max(
        1,
        Math.min(Number(state.chapter) || 1, total)
    );

    select.innerHTML = Array.from(
        { length: total },
        (_, index) =>
            `<option value="${index + 1}">Chapter ${index + 1}</option>`
    ).join('');

    select.value = String(state.chapter);
}

/* -------------------- BIBLE API -------------------- */

async function fetchJSON(url, timeoutMs = 18000) {
    const controller = new AbortController();

    const timer = setTimeout(
        () => controller.abort(),
        timeoutMs
    );

    try {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json'
            },
            signal: controller.signal,
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(
                `Bible service returned HTTP ${response.status}.`
            );
        }

        return await response.json();

    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(
                'The request took too long. Check your connection and try again.'
            );
        }

        throw error;

    } finally {
        clearTimeout(timer);
    }
}

function normalizeVerses(rawVerses) {
    if (Array.isArray(rawVerses)) {
        return rawVerses.map((verse, index) => {
            if (typeof verse === 'string') {
                return {
                    number: index + 1,
                    text: verse.trim()
                };
            }

            return {
                number: Number(
                    verse.number ??
                    verse.verse ??
                    verse.verseNumber ??
                    index + 1
                ),
                text: String(
                    verse.text ??
                    verse.content ??
                    verse.value ??
                    ''
                ).trim()
            };

        }).filter(verse =>
            Number.isInteger(verse.number) &&
            verse.number > 0 &&
            verse.text
        );
    }

    if (rawVerses && typeof rawVerses === 'object') {
        return Object.entries(rawVerses)
            .filter(([key, value]) =>
                /^\d+$/.test(key) &&
                typeof value === 'string'
            )
            .map(([number, text]) => ({
                number: Number(number),
                text: text.trim()
            }))
            .filter(verse => verse.text)
            .sort((a, b) => a.number - b.number);
    }

    if (typeof rawVerses === 'string') {
        return rawVerses.split(/\r?\n/)
            .filter(Boolean)
            .map((text, index) => ({
                number: index + 1,
                text: text.trim()
            }));
    }

    return [];
}

async function fetchKJV(book, chapter) {
    const filename = `${book[3].replace(/-/g, '_')}.json`;

    const url =
        `https://raw.githubusercontent.com/nolanbaxter/kjv-bible/main/${filename}`;

    const data = await fetchJSON(url);

    const chapters = data.chapters || data;

    const chapterData =
        chapters[chapter] ??
        chapters[String(chapter)] ??
        chapters[`chapter_${chapter}`] ??
        chapters[`Chapter ${chapter}`];

    if (!chapterData) {
        throw new Error(
            'This KJV chapter was not found in the selected Bible dataset.'
        );
    }

    let verses = normalizeVerses(
        chapterData.verses ?? chapterData
    );

    if (!verses.length && Array.isArray(chapterData)) {
        verses = normalizeVerses(chapterData);
    }

    if (!verses.length) {
        throw new Error(
            'The KJV dataset returned an unexpected chapter format.'
        );
    }

    return {
        verses,
        attribution: 'King James Version (public-domain text; KJV Bible JSON corpus)',
        version: VERSION_NAMES.kjv
    };
}

async function fetchChapter(bookIndex, chapter, version = state.version) {
    const book = BOOKS[bookIndex];

    if (!book) {
        throw new Error('Please select a valid Bible book.');
    }

    if (
        !Number.isInteger(Number(chapter)) ||
        chapter < 1 ||
        chapter > book[1]
    ) {
        throw new Error(
            `Choose a chapter from 1 to ${book[1]}.`
        );
    }

    if (!VERSION_NAMES[version]) {
        throw new Error(
            'Please select a supported Bible translation.'
        );
    }

    if (version === 'kjv') {
        try {
            return await fetchKJV(book, chapter);
        } catch (primaryError) {
            console.warn(
                'KJV repository request failed; trying the Bible API.',
                primaryError
            );
        }
    }

    const url =
        `https://api.midvash.com/v1/${encodeURIComponent(version)}/${encodeURIComponent(book[3])}/${chapter}`;

    const json = await fetchJSON(url);

    const data = json.data || json;

    const rawVerses =
        data.verses ||
        data.chapter?.verses ||
        data.text;

    const verses = normalizeVerses(rawVerses);

    if (!verses.length) {
        throw new Error(
            'The Bible service returned an unexpected format. Try another translation.'
        );
    }

    return {
        verses,
        attribution:
            data.attribution ||
            data.meta?.copyright ||
            data.version?.attribution ||
            data.copyright ||
            '',
        version:
            data.version?.name ||
            data.version?.abbreviation ||
            VERSION_NAMES[version]
    };
}

/* -------------------- CHAPTER LOADING -------------------- */

async function loadChapter(options = {}) {
    if (!options.keepView) showView('reader');

    const bookSelect = $('book-select');
    const chapterSelect = $('chapter-select');
    const versionSelect = $('version-select');
    const languageSelect = $('language-select');

    if (bookSelect) state.book = Number(bookSelect.value);
    if (chapterSelect) state.chapter = Number(chapterSelect.value);
    if (versionSelect) state.version = versionSelect.value;
    if (languageSelect) state.language = languageSelect.value;

    const book = selectedBook();
    const chapter = state.chapter;
    const version = state.version;
    const requestId = ++state.chapterRequest;

    setText('passage-title', `${book[0]} ${chapter}`);
    setText('testament-label', book[2] === 'OT' ? 'OLD TESTAMENT' : 'NEW TESTAMENT');
    setText('translation-line', `${currentTranslationName()} · Chapter ${chapter}`);
    setText('chapter-position', `${book[0]} · ${chapter}`);
    setText('reader-status', 'Connecting to the Bible text service…');
    setText('copyright-note', 'Checking translation attribution…');
    setText('chapter-bookmark', chapterSaved() ? '★' : '☆');

    const verseContainer = $('verses');

    if (verseContainer) {
        verseContainer.innerHTML = `
            <div class="loading-card">
                <span class="loader"></span>
                <p>Loading the full chapter…</p>
            </div>`;
    }

    try {
        const result = await fetchCurrentChapter(state.book, chapter);

        if (requestId !== state.chapterRequest) return;

        state.verses = result.verses;

        setText(
            'translation-line',
            `${result.version || currentTranslationName()} · Chapter ${chapter}`
        );

        setText(
            'copyright-note',
            result.attribution
                ? `Translation attribution: ${result.attribution}`
                : 'Bible text provided by an external Bible service. Check the selected translation’s license before redistribution.'
        );

        setText(
            'reader-status',
            `${result.verses.length} verses · Select ☆ beside a verse to save it`
        );

        renderVerses();

    } catch (error) {
        if (requestId !== state.chapterRequest) return;

        state.verses = [];

        if (verseContainer) {
            const warayFallback = state.language === 'waray';
            verseContainer.innerHTML = `
                <div class="empty-state">
                    <strong>${warayFallback ? 'Open the verified Waray-Waray Bible' : 'We couldn’t load this chapter.'}</strong>
                    <p>${warayFallback
                        ? 'The Samarenyo Meaning-Based Bible (1984), published by the Philippine Bible Society, is available online. The current in-app Bible API does not provide its chapter text, so WordPath will not display guessed or machine-generated Scripture.'
                        : esc(error.message || 'An unexpected error occurred.')}</p>
                    <p>${warayFallback
                        ? 'Continue to the genuine Waray edition on Bible.com. You can return to WordPath at any time.'
                        : 'Check your internet connection, then try again. Bible chapters are retrieved online.'}</p>
                    ${warayFallback ? `<a class="secondary-btn waray-open-link" href="${warayBibleOnlineUrl()}" target="_blank" rel="noopener noreferrer">Read Waray Bible online ↗</a>` : ''}
                    <button class="secondary-btn" id="retry-load" type="button">Try again</button>
                </div>`;

            $('retry-load')?.addEventListener('click', () =>
                loadChapter({ keepView: true })
            );
        }

        setText('reader-status', 'Unable to load Scripture');
        setText(
            'copyright-note',
            'An internet connection and an available translation are required to retrieve Bible chapters.'
        );
    }
}

/* -------------------- VERSE DISPLAY & FILTER -------------------- */

function renderVerses() {
    const container = $('verses');
    if (!container) return;

    const query = ($('verse-filter')?.value || '').trim().toLowerCase();

    const visible = state.verses.filter(verse =>
        !query ||
        verse.text.toLowerCase().includes(query) ||
        String(verse.number) === query
    );

    if (!visible.length) {
        container.innerHTML = `
            <div class="empty-state">
                No verses in this chapter match that word.
            </div>`;
        return;
    }

    container.innerHTML = visible.map(verse => {
        const reference =
            `${selectedBook()[0]} ${state.chapter}:${verse.number}`;

        const saved = state.bookmarks.some(item =>
            item.reference === reference &&
            (item.translationKey || (item.language ? `lang:${item.language}` : item.version || 'kjv')) === currentTranslationKey()
        );

        return `
            <p class="verse-line" id="verse-${verse.number}">
                <span class="verse-num">${verse.number}</span>

                <span class="verse">${esc(verse.text)}</span>

                <span class="verse-actions">
                    <button
                        class="verse-save ${saved ? 'saved' : ''}"
                        data-save-verse="${verse.number}"
                        type="button"
                        title="Save verse"
                        aria-label="Save ${esc(reference)}"
                    >${saved ? '★' : '☆'}</button>

                    <button
                        class="verse-tool"
                        data-copy-verse="${verse.number}"
                        type="button"
                        title="Copy verse"
                        aria-label="Copy ${esc(reference)}"
                    >⧉</button>
                </span>
            </p>`;
    }).join('');

    container.style.fontSize = `${state.fontSize}px`;
}

function chapterSaved() {
    return state.bookmarks.some(item =>
        item.reference === `${selectedBook()[0]} ${state.chapter}` &&
        (item.translationKey || (item.language ? `lang:${item.language}` : item.version || 'kjv')) === currentTranslationKey() &&
        item.isChapter
    );
}

function updateBookmarkCount() {
    setText('bookmark-count', state.bookmarks.length);
}

/* -------------------- BOOKMARKS -------------------- */

function saveVerse(number) {
    const verse = state.verses.find(
        item => Number(item.number) === Number(number)
    );

    if (!verse) return;

    const reference =
        `${selectedBook()[0]} ${state.chapter}:${verse.number}`;

    const index = state.bookmarks.findIndex(item =>
        item.reference === reference &&
        (item.translationKey || (item.language ? `lang:${item.language}` : item.version || 'kjv')) === currentTranslationKey()
    );

    if (index >= 0) {
        state.bookmarks.splice(index, 1);
        toast('Bookmark removed.');
    } else {
        state.bookmarks.unshift({
            reference,
            text: verse.text,
            version: state.version,
            language: state.language,
            translationKey: currentTranslationKey(),
            versionName: currentTranslationName(),
            savedAt: new Date().toISOString()
        });

        toast('Verse saved to your bookmarks.');
    }

    persist(STORAGE.bookmarks, state.bookmarks);

    updateBookmarkCount();
    renderVerses();

    if (state.currentView === 'saved') {
        renderSaved();
    }
}

function saveChapter() {
    const reference =
        `${selectedBook()[0]} ${state.chapter}`;

    const index = state.bookmarks.findIndex(item =>
        item.reference === reference &&
        (item.translationKey || (item.language ? `lang:${item.language}` : item.version || 'kjv')) === currentTranslationKey() &&
        item.isChapter
    );

    if (index >= 0) {
        state.bookmarks.splice(index, 1);
        toast('Chapter bookmark removed.');
    } else {
        state.bookmarks.unshift({
            reference,
            text: `Bookmark for ${reference}`,
            version: state.version,
            language: state.language,
            translationKey: currentTranslationKey(),
            versionName: currentTranslationName(),
            isChapter: true,
            savedAt: new Date().toISOString()
        });

        toast('Chapter bookmarked.');
    }

    persist(STORAGE.bookmarks, state.bookmarks);

    setText(
        'chapter-bookmark',
        chapterSaved() ? '★' : '☆'
    );

    updateBookmarkCount();
    renderVerses();
}

function renderSaved() {
    const list = $('saved-list');
    if (!list) return;

    if (!state.bookmarks.length) {
        list.innerHTML = `
            <div class="empty-state">
                No bookmarks yet. Open a chapter and tap ☆ beside a verse to keep it here.
            </div>`;
        return;
    }

    list.innerHTML = state.bookmarks.map((item, index) => `
        <article class="saved-item">
            <div>
                <blockquote>
                    ${item.isChapter
                        ? esc(item.text)
                        : `“${esc(item.text)}”`}
                </blockquote>

                <strong>
                    ${esc(item.reference)} ·
                    ${esc(item.versionName || (item.language ? LANGUAGE_OPTIONS[item.language]?.label : (item.version || 'kjv').toUpperCase()))}
                </strong>

                <p>
                    <button
                        class="secondary-btn"
                        data-open-bookmark="${index}"
                        type="button"
                    >
                        Open passage →
                    </button>
                </p>
            </div>

            <button
                data-remove-bookmark="${index}"
                type="button"
                aria-label="Remove ${esc(item.reference)}"
            >
                Remove
            </button>
        </article>
    `).join('');
}

/* -------------------- SECTION NAVIGATION -------------------- */

function showView(view) {
    if (localStorage.getItem(STORAGE.authenticated) !== 'true') return;
    const allowed = [
        'reader',
        'daily',
        'saved',
        'plans',
        'quiz',
        'journal',
        'saints'
    ];

    if (!allowed.includes(view)) return;

    state.currentView = view;

    allowed.forEach(name => {
        const element = $(
            name === 'reader'
                ? 'reader-section'
                : `${name}-section`
        );

        element?.classList.toggle('hidden', name !== view);
    });

    document.querySelectorAll('.nav-link').forEach(link =>
        link.classList.toggle(
            'active',
            link.dataset.view === view
        )
    );

    if (view === 'saved') renderSaved();
    if (view === 'daily') loadDailyVerse();
    if (view === 'journal') renderJournal();
    if (view === 'quiz') startQuiz();
    if (view === 'saints') renderSaints();

    window.scrollTo({
        top: view === 'reader' ? 300 : 260,
        behavior: 'smooth'
    });
}

/* -------------------- VERSE OF THE DAY -------------------- */

const DAILY = [
    ['Psalm 119:105', 18, 119, 105],
    ['John 3:16', 42, 3, 16],
    ['Proverbs 3:5', 19, 3, 5],
    ['Matthew 11:28', 39, 11, 28],
    ['Romans 8:28', 44, 8, 28],
    ['Isaiah 41:10', 22, 41, 10],
    ['Philippians 4:6', 49, 4, 6]
];

function dailySelection() {
    const now = new Date();

    const dayNumber = Math.floor(
        Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        ) / 86400000
    );

    return DAILY[
        ((dayNumber % DAILY.length) + DAILY.length) %
        DAILY.length
    ];
}

async function loadDailyVerse() {
    const item = dailySelection();

    setText('daily-reference', `${item[0]} · ${currentTranslationName()}`);
    setText('daily-text', 'Loading today’s verse…');

    try {
        const result = await fetchCurrentChapter(item[1], item[2]);

        const verse = result.verses.find(
            entry => Number(entry.number) === item[3]
        );

        if (!verse) {
            throw new Error('Daily verse was not found.');
        }

        setText('daily-text', `“${verse.text}”`);

    } catch (error) {
        setText(
            'daily-text',
            `This verse is not available in ${currentTranslationName()} right now. Please check your connection or choose another language.`
        );
    }
}

/* -------------------- BIBLE REFERENCE SEARCH -------------------- */

function readReference(raw) {
    const input = String(raw || '').trim();

    const match = input.match(
        /^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/
    );

    if (!match) {
        toast('Use a reference like John 3:16, John 3, or Psalm 23.');
        return;
    }

    const bookIndex = normalizeBook(match[1]);

    if (bookIndex < 0) {
        toast('Book not recognized. Try its full name, like 1 Corinthians.');
        return;
    }

    const chapter = Number(match[2]);
    const firstVerse = match[3] ? Number(match[3]) : null;
    const lastVerse = match[4] ? Number(match[4]) : firstVerse;
    const book = BOOKS[bookIndex];

    if (chapter < 1 || chapter > book[1]) {
        toast(`${book[0]} has ${book[1]} chapters. Choose a valid chapter.`);
        return;
    }

    if (
        firstVerse !== null &&
        (firstVerse < 1 ||
        (lastVerse !== null && lastVerse < firstVerse))
    ) {
        toast('Please enter a valid verse number or verse range.');
        return;
    }

    state.book = bookIndex;
    state.chapter = chapter;

    if ($('book-select')) {
        $('book-select').value = String(bookIndex);
    }

    populateChapters();

    if ($('chapter-select')) {
        $('chapter-select').value = String(chapter);
    }

    loadChapter().then(() => {
        if (firstVerse === null) return;

        if ($('verse-filter')) {
            $('verse-filter').value = '';
        }

        renderVerses();

        const first = $(`verse-${firstVerse}`);

        if (!first) {
            toast('That verse number was not found in the loaded chapter.');
            return;
        }

        first.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        if (lastVerse && lastVerse > firstVerse) {
            const last = $(`verse-${lastVerse}`);

            if (last) {
                document.querySelectorAll('.verse-line.range-highlight')
                    .forEach(element =>
                        element.classList.remove('range-highlight')
                    );

                for (
                    let number = firstVerse;
                    number <= lastVerse;
                    number++
                ) {
                    $(`verse-${number}`)?.classList.add('range-highlight');
                }

                setTimeout(() => {
                    document.querySelectorAll('.verse-line.range-highlight')
                        .forEach(element =>
                            element.classList.remove('range-highlight')
                        );
                }, 2500);
            }
        }
    });
}

/* -------------------- READING PLANS -------------------- */

const PLANS = {
    peace: {
        title: 'Peace for the Week',
        days: [
            ['Psalms', 23],
            ['Matthew', 6],
            ['John', 14],
            ['Philippians', 4],
            ['Isaiah', 41],
            ['Psalms', 46],
            ['Romans', 8]
        ]
    },

    jesus: {
        title: 'Meet Jesus',
        days: [
            ['John', 1],
            ['Mark', 1],
            ['Luke', 5],
            ['Matthew', 5],
            ['John', 10],
            ['Luke', 15],
            ['Matthew', 11],
            ['John', 13],
            ['John', 14],
            ['Mark', 4],
            ['Luke', 22],
            ['John', 19],
            ['John', 20],
            ['Matthew', 28]
        ]
    },

    foundations: {
        title: 'Start with Scripture',
        days: [
            ['Genesis', 1],
            ['Psalms', 1],
            ['Proverbs', 3],
            ['Matthew', 5],
            ['John', 1],
            ['Romans', 8],
            ['Psalms', 23],
            ['Luke', 15],
            ['Ephesians', 2],
            ['Philippians', 4],
            ['Isaiah', 40],
            ['John', 15],
            ['1 Corinthians', 13],
            ['Psalms', 46],
            ['Matthew', 6],
            ['James', 1],
            ['Romans', 12],
            ['Colossians', 3],
            ['Psalms', 121],
            ['John', 14],
            ['Micah', 6],
            ['Hebrews', 11],
            ['Galatians', 5],
            ['Psalms', 91],
            ['Matthew', 11],
            ['2 Timothy', 3],
            ['1 John', 4],
            ['Romans', 5],
            ['Revelation', 21],
            ['Psalms', 150]
        ]
    }
};

function renderPlan(id) {
    const plan = PLANS[id];
    const container = $('plan-progress');

    if (!plan || !container) return;

    state.plan = id;

    const completed = safeArray(state.completed[id]);

    container.classList.remove('hidden');

    container.innerHTML = `
        <h3>${esc(plan.title)}</h3>

        <p>
            ${completed.length} of ${plan.days.length} readings completed
        </p>

        ${plan.days.map((day, index) => `
            <label class="plan-day">
                <input
                    type="checkbox"
                    data-plan-day="${index}"
                    ${completed.includes(index) ? 'checked' : ''}
                >

                <span>
                    Day ${index + 1}: ${esc(day[0])} ${day[1]}
                </span>

                <button
                    class="secondary-btn"
                    data-plan-open="${index}"
                    type="button"
                    style="margin-left:auto;padding:7px 10px"
                >
                    Read →
                </button>
            </label>
        `).join('')}
    `;

    container.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
    });
}

/* -------------------- BIBLE QUIZ -------------------- */

const QUIZ_QUESTIONS = [
    {
        q: 'Who built the ark?',
        a: ['Moses', 'Noah', 'Abraham', 'David'],
        correct: 1,
        note: 'Noah built the ark as God instructed him.'
    },
    {
        q: 'Who led the Israelites out of Egypt?',
        a: ['Joshua', 'Joseph', 'Moses', 'Aaron'],
        correct: 2,
        note: 'Moses led the Israelites out of Egypt.'
    },
    {
        q: 'Where was Jesus born?',
        a: ['Nazareth', 'Jerusalem', 'Bethlehem', 'Capernaum'],
        correct: 2,
        note: 'Jesus was born in Bethlehem.'
    },
    {
        q: 'Who defeated Goliath?',
        a: ['David', 'Saul', 'Jonathan', 'Solomon'],
        correct: 0,
        note: 'David defeated Goliath with a sling and a stone.'
    },
    {
        q: 'How many disciples did Jesus choose?',
        a: ['7', '10', '12', '14'],
        correct: 2,
        note: 'Jesus chose twelve disciples.'
    },
    {
        q: 'Who was swallowed by a great fish?',
        a: ['Jonah', 'Elijah', 'Peter', 'Job'],
        correct: 0,
        note: 'Jonah was swallowed by a great fish.'
    },
    {
        q: 'What is the first book of the Bible?',
        a: ['Exodus', 'Genesis', 'Psalms', 'Matthew'],
        correct: 1,
        note: 'Genesis is the first book of the Bible.'
    },
    {
        q: 'Which apostle denied Jesus three times?',
        a: ['John', 'James', 'Thomas', 'Peter'],
        correct: 3,
        note: 'Peter denied knowing Jesus three times before the rooster crowed.'
    },
    {
        q: 'Who received the Ten Commandments?',
        a: ['Moses', 'Noah', 'Isaiah', 'Paul'],
        correct: 0,
        note: 'Moses received the commandments on Mount Sinai.'
    },
    {
        q: 'Which book tells about the creation of the world?',
        a: ['Revelation', 'Acts', 'Genesis', 'Romans'],
        correct: 2,
        note: 'Genesis opens with the account of creation.'
    },
    {
        q: 'Who was known for great wisdom and was a king of Israel?',
        a: ['Solomon', 'Samson', 'Samuel', 'Gideon'],
        correct: 0,
        note: 'King Solomon was renowned for his wisdom.'
    },
    {
        q: 'What was Jesus’ first recorded miracle in the Gospel of John?',
        a: [
            'Healing a blind man',
            'Walking on water',
            'Turning water into wine',
            'Feeding five thousand'
        ],
        correct: 2,
        note: 'Jesus turned water into wine at a wedding in Cana.'
    }
];

function shuffle(items) {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index--) {
        const random = Math.floor(Math.random() * (index + 1));

        [copy[index], copy[random]] =
            [copy[random], copy[index]];
    }

    return copy;
}

function startQuiz() {
    state.quiz = {
        index: 0,
        score: 0,
        answered: false,
        questions: shuffle(QUIZ_QUESTIONS).slice(0, 8)
    };

    renderQuizQuestion();
}

function renderQuizQuestion() {
    const quiz = state.quiz;
    const total = quiz.questions.length;
    const question = quiz.questions[quiz.index];
    const nextButton = $('quiz-next');

    setText('quiz-score', `Score: ${quiz.score}`);
    setText('quiz-feedback', 'Choose an answer to continue.');

    if (!question) {
        setText('quiz-progress', 'QUIZ COMPLETE');

        setText(
            'quiz-question',
            `You scored ${quiz.score} out of ${total}!`
        );

        if ($('quiz-options')) {
            $('quiz-options').innerHTML = `
                <p>
                    Well done! Keep learning and growing in Scripture.
                </p>`;
        }

        setText(
            'quiz-feedback',
            quiz.score === total
                ? 'Perfect score! Excellent work.'
                : 'Thank you for playing. Try again to improve your score.'
        );

        if (nextButton) {
            nextButton.disabled = true;
            nextButton.textContent = 'Quiz completed';
        }

        if ($('quiz-progress-fill')) {
            $('quiz-progress-fill').style.width = '100%';
        }

        return;
    }

    setText(
        'quiz-progress',
        `QUESTION ${quiz.index + 1} OF ${total}`
    );

    setText('quiz-question', question.q);

    if ($('quiz-progress-fill')) {
        $('quiz-progress-fill').style.width =
            `${(quiz.index / total) * 100}%`;
    }

    if (nextButton) {
        nextButton.disabled = true;

        nextButton.textContent =
            quiz.index === total - 1
                ? 'See results →'
                : 'Next question →';
    }

    const options = $('quiz-options');
    if (!options) return;

    options.innerHTML = question.a.map((answer, index) => `
        <button
            class="quiz-option"
            type="button"
            data-quiz-answer="${index}"
        >
            <span>${String.fromCharCode(65 + index)}.</span>
            ${esc(answer)}
        </button>
    `).join('');
}

function answerQuiz(index) {
    const quiz = state.quiz;
    const question = quiz.questions[quiz.index];

    if (!question || quiz.answered) return;

    quiz.answered = true;

    const correct = index === question.correct;

    if (correct) {
        quiz.score++;
    }

    document.querySelectorAll('[data-quiz-answer]').forEach(button => {
        const answerIndex = Number(button.dataset.quizAnswer);

        button.disabled = true;

        if (answerIndex === question.correct) {
            button.classList.add('correct');
        } else if (answerIndex === index) {
            button.classList.add('incorrect');
        }
    });

    setText('quiz-score', `Score: ${quiz.score}`);

    setText(
        'quiz-feedback',
        `${correct ? 'Correct!' : 'Not quite.'} ${question.note}`
    );

    if ($('quiz-next')) {
        $('quiz-next').disabled = false;
    }
}

function nextQuizQuestion() {
    if (!state.quiz.answered) return;

    state.quiz.index++;
    state.quiz.answered = false;

    renderQuizQuestion();
}

/* -------------------- PRAYER JOURNAL -------------------- */

let journalEntries = loadJSON(STORAGE.journal, []);

if (!Array.isArray(journalEntries)) {
    journalEntries = [];
}

function renderJournal() {
    const list = $('journal-list');
    if (!list) return;

    setText(
        'journal-count',
        `${journalEntries.length} ${
            journalEntries.length === 1 ? 'entry' : 'entries'
        }`
    );

    if (!journalEntries.length) {
        list.innerHTML = `
            <div class="empty-state">
                Your reflections will appear here after you save your first entry.
            </div>`;
        return;
    }

    list.innerHTML = journalEntries.map((entry, index) => `
        <article class="journal-entry-card">
            <h4>${esc(entry.title)}</h4>

            <div class="journal-entry-meta">
                ${esc(entry.date)} · ${esc(entry.mood)}
                ${entry.reference ? ` · ${esc(entry.reference)}` : ''}
            </div>

            <p>
                ${esc(
                    entry.body.length > 320
                        ? entry.body.slice(0, 320) + '…'
                        : entry.body
                )}
            </p>

            <div class="journal-entry-actions">
                <button
                    type="button"
                    data-journal-copy="${index}"
                >
                    Copy
                </button>

                <button
                    type="button"
                    data-journal-delete="${index}"
                >
                    Delete
                </button>
            </div>
        </article>
    `).join('');
}

async function copyText(text) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    const field = document.createElement('textarea');

    field.value = text;
    field.setAttribute('readonly', '');

    field.style.position = 'fixed';
    field.style.opacity = '0';

    document.body.appendChild(field);

    field.select();

    const copied = document.execCommand('copy');

    field.remove();

    if (!copied) {
        throw new Error('Copy is not available in this browser.');
    }

    return true;
}

/* -------------------- SAINTS LIBRARY -------------------- */

const SAINTS = [
    {
        name: 'Saint Peter',
        title: 'Apostle and witness',
        category: 'apostle',
        virtue: 'Faith and courage',
        patronage: 'Often associated with fishermen and the Church',
        reflection: 'Peter’s story reminds us that faith can grow even after failure. A sincere return to God can become a new beginning.'
    },
    {
        name: 'Saint Paul',
        title: 'Apostle to the Gentiles',
        category: 'apostle',
        virtue: 'Perseverance and mission',
        patronage: 'Often associated with missionaries and writers',
        reflection: 'Paul’s life speaks of transformation, commitment, and sharing hope with others.'
    },
    {
        name: 'Saint Francis of Assisi',
        title: 'Brother to all creation',
        category: 'charity',
        virtue: 'Simplicity and compassion',
        patronage: 'Often associated with animals and ecology',
        reflection: 'His example invites us to live simply, care for creation, and serve people with humility.'
    },
    {
        name: 'Saint Teresa of Calcutta',
        title: 'Servant of the poor',
        category: 'charity',
        virtue: 'Mercy and service',
        patronage: 'Often associated with charitable works',
        reflection: 'Small acts of love, offered with sincerity, can bring dignity and comfort to others.'
    },
    {
        name: 'Saint Vincent de Paul',
        title: 'Priest and servant',
        category: 'charity',
        virtue: 'Generosity and service',
        patronage: 'Often associated with charitable organizations',
        reflection: 'His life encourages practical compassion and care for people experiencing poverty.'
    },
    {
        name: 'Saint Augustine',
        title: 'Bishop and teacher',
        category: 'prayer',
        virtue: 'Wisdom and conversion',
        patronage: 'Often associated with theologians and seekers',
        reflection: 'Augustine’s journey reminds us to keep seeking truth and to let love shape our choices.'
    },
    {
        name: 'Saint Thomas Aquinas',
        title: 'Priest and theologian',
        category: 'prayer',
        virtue: 'Wisdom and learning',
        patronage: 'Often associated with students and scholars',
        reflection: 'Faith and thoughtful study can work together in the search for truth.'
    },
    {
        name: 'Saint Monica',
        title: 'Mother and faithful example',
        category: 'prayer',
        virtue: 'Patience and prayer',
        patronage: 'Often associated with mothers and difficult family situations',
        reflection: 'Her example highlights patient love, persistent prayer, and hope for loved ones.'
    },
    {
        name: 'Saint Joan of Arc',
        title: 'Witness of courage',
        category: 'courage',
        virtue: 'Courage and conviction',
        patronage: 'Often associated with courage and service',
        reflection: 'Her story invites reflection on conscience, bravery, and remaining steadfast in difficult circumstances.'
    },
    {
        name: 'Saint Maximilian Kolbe',
        title: 'Priest and martyr',
        category: 'courage',
        virtue: 'Self-giving love',
        patronage: 'Often associated with families and prisoners',
        reflection: 'His witness is remembered as an extraordinary act of self-sacrifice and love for another.'
    },
    {
        name: 'Saint Stephen',
        title: 'The first Christian martyr',
        category: 'courage',
        virtue: 'Faithfulness and forgiveness',
        patronage: 'Remembered as a deacon and martyr',
        reflection: 'Stephen’s witness calls us to hold to our convictions and respond to others without hatred.'
    },
    {
        name: 'Saint Mary Magdalene',
        title: 'Disciple and witness',
        category: 'apostle',
        virtue: 'Devotion and hope',
        patronage: 'Remembered as a witness to the Resurrection',
        reflection: 'Her story points to faithful devotion and the hope at the heart of the Resurrection.'
    }
];

function renderSaints() {
    const grid = $('saints-grid');
    if (!grid) return;

    const query = ($('saint-search')?.value || '').trim().toLowerCase();
    const category = $('saint-filter')?.value || 'all';

    const matches = SAINTS.filter(saint => {
        const text = `
            ${saint.name}
            ${saint.title}
            ${saint.virtue}
            ${saint.patronage}
            ${saint.reflection}
        `.toLowerCase();

        return (
            (category === 'all' || saint.category === category) &&
            (!query || text.includes(query))
        );
    });

    if (!matches.length) {
        grid.innerHTML = `
            <div class="empty-state">
                No saints match your search. Try another name or filter.
            </div>`;
        return;
    }

    grid.innerHTML = matches.map(saint => `
        <article class="saint-card">
            <div class="saint-card-symbol" aria-hidden="true">✦</div>

            <p class="eyebrow">${esc(saint.title)}</p>

            <h3>${esc(saint.name)}</h3>

            <strong>${esc(saint.virtue)}</strong>

            <p>${esc(saint.reflection)}</p>

            <small>${esc(saint.patronage)}</small>
        </article>
    `).join('');
}

/* -------------------- EVENT LISTENERS -------------------- */

function bindEvents() {

    document.querySelectorAll('.nav-link').forEach(button => {
        button.addEventListener('click', () =>
            showView(button.dataset.view)
        );
    });

    $('start-reading')?.addEventListener('click', () => {
        showView('reader');

        $('reader-section')?.scrollIntoView({
            behavior: 'smooth'
        });
    });

    $('book-select')?.addEventListener('change', () => {
        state.book = Number($('book-select').value);
        state.chapter = 1;
        populateChapters();
    });

    $('chapter-select')?.addEventListener('change', () => {
        state.chapter = Number($('chapter-select').value);
    });

    $('version-select')?.addEventListener('change', () => {
        state.version = $('version-select').value;
        if (state.language === 'english') loadChapter();
    });

    $('language-select')?.addEventListener('change', () => {
        const nextLanguage = $('language-select').value;
        if (!LANGUAGE_OPTIONS[nextLanguage]) return;
        state.language = nextLanguage;
        persist(STORAGE.language, nextLanguage);
        const versionWrap = $('version-wrap');
        if (versionWrap) versionWrap.hidden = nextLanguage !== 'english';
        loadChapter();
        if (state.currentView === 'daily') loadDailyVerse();
    });

    $('load-chapter')?.addEventListener('click', () =>
        loadChapter()
    );

    $('reference-form')?.addEventListener('submit', event => {
        event.preventDefault();
        readReference($('reference-search')?.value);
    });

    $('verse-filter')?.addEventListener('input', renderVerses);

    $('clear-filter')?.addEventListener('click', () => {
        if ($('verse-filter')) {
            $('verse-filter').value = '';
        }

        renderVerses();
    });

    $('chapter-bookmark')?.addEventListener('click', saveChapter);

    $('verses')?.addEventListener('click', async event => {
        const saveButton = event.target.closest('[data-save-verse]');
        const copyButton = event.target.closest('[data-copy-verse]');

        if (saveButton) {
            saveVerse(saveButton.dataset.saveVerse);
        }

        if (copyButton) {
            const number = Number(copyButton.dataset.copyVerse);

            const verse = state.verses.find(
                item => Number(item.number) === number
            );

            if (!verse) return;

            const text =
                `${verse.text} — ${selectedBook()[0]} ${state.chapter}:${number} (${currentTranslationName()})`;

            try {
                await copyText(text);
                toast('Verse copied.');
            } catch {
                toast('Copy is not available in this browser.');
            }
        }
    });

    /* PREVIOUS CHAPTER */

    $('previous-chapter')?.addEventListener('click', () => {

        if (state.chapter > 1) {
            state.chapter--;

        } else if (state.book > 0) {
            state.book--;

            state.chapter = BOOKS[state.book][1];

            if ($('book-select')) {
                $('book-select').value = String(state.book);
            }

        } else {
            toast('You are at the beginning of the Bible.');
            return;
        }

        populateChapters();
        loadChapter();
    });

    /* NEXT CHAPTER */

    $('next-chapter')?.addEventListener('click', () => {

        if (state.chapter < selectedBook()[1]) {
            state.chapter++;

        } else if (state.book < BOOKS.length - 1) {
            state.book++;
            state.chapter = 1;

            if ($('book-select')) {
                $('book-select').value = String(state.book);
            }

        } else {
            toast('You have reached the end of the Bible.');
            return;
        }

        populateChapters();
        loadChapter();
    });

    /* FONT SIZE */

    $('font-down')?.addEventListener('click', () => {
        state.fontSize = Math.max(13, state.fontSize - 1);
        applyFontSize();
    });

    $('font-up')?.addEventListener('click', () => {
        state.fontSize = Math.min(25, state.fontSize + 1);
        applyFontSize();
    });

    /* DARK MODE */

    $('theme-toggle')?.addEventListener('click', toggleTheme);

    /* BOOKMARK EVENTS */

    $('saved-list')?.addEventListener('click', event => {

        const openButton = event.target.closest('[data-open-bookmark]');
        const removeButton = event.target.closest('[data-remove-bookmark]');

        if (removeButton) {
            const index = Number(removeButton.dataset.removeBookmark);

            if (Number.isInteger(index) && state.bookmarks[index]) {
                state.bookmarks.splice(index, 1);

                persist(STORAGE.bookmarks, state.bookmarks);

                updateBookmarkCount();
                renderSaved();
            }
        }

        if (openButton) {
            const item =
                state.bookmarks[Number(openButton.dataset.openBookmark)];

            if (item) {
                const reference = item.reference;

                state.language = item.language || 'english';
                persist(STORAGE.language, state.language);
                if ($('language-select')) $('language-select').value = state.language;
                if (item.version && $('version-select')) $('version-select').value = item.version;
                state.version = item.version || state.version;
                if ($('version-wrap')) $('version-wrap').hidden = state.language !== 'english';
                readReference(reference);
            }
        }
    });

    /* DAILY VERSE BUTTONS */

    $('daily-read')?.addEventListener('click', () => {
        readReference(
            ($('daily-reference')?.textContent || '').split(' · ')[0]
        );
    });

    $('daily-save')?.addEventListener('click', async () => {

        const reference =
            ($('daily-reference')?.textContent || '').split(' · ')[0];

        const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);

        if (!match) return;

        const bookIndex = normalizeBook(match[1]);

        if (bookIndex < 0) return;

        try {
            const result = await fetchCurrentChapter(
                bookIndex,
                Number(match[2])
            );

            const verse = result.verses.find(
                item => Number(item.number) === Number(match[3])
            );

            if (!verse) {
                throw new Error('Verse not found.');
            }

            const exists = state.bookmarks.some(item =>
                item.reference === reference &&
                (item.translationKey || (item.language ? `lang:${item.language}` : item.version || 'kjv')) === currentTranslationKey()
            );

            if (exists) {
                toast('That verse is already saved.');
                return;
            }

            state.bookmarks.unshift({
                reference,
                text: verse.text,
                version: state.version,
                language: state.language,
                translationKey: currentTranslationKey(),
                versionName: currentTranslationName(),
                savedAt: new Date().toISOString()
            });

            persist(STORAGE.bookmarks, state.bookmarks);

            updateBookmarkCount();

            toast('Daily verse saved.');

        } catch {
            toast('Connect to the internet to save this verse.');
        }
    });

    /* READING PLAN EVENTS */

    document.querySelectorAll('.plan-start').forEach(button => {
        button.addEventListener('click', () =>
            renderPlan(button.dataset.plan)
        );
    });

    $('plan-progress')?.addEventListener('change', event => {

        if (
            !event.target.matches('[data-plan-day]') ||
            !state.plan
        ) {
            return;
        }

        const index = Number(event.target.dataset.planDay);

        const done = safeArray(state.completed[state.plan]);

        state.completed[state.plan] = event.target.checked
            ? [...new Set([...done, index])]
            : done.filter(item => item !== index);

        persist(STORAGE.completed, state.completed);

        renderPlan(state.plan);
    });

    $('plan-progress')?.addEventListener('click', event => {

        const button = event.target.closest('[data-plan-open]');

        if (!button || !state.plan) return;

        const day = PLANS[state.plan].days[
            Number(button.dataset.planOpen)
        ];

        if (day) {
            readReference(`${day[0]} ${day[1]}`);
        }
    });

    /* PRAYER JOURNAL FORM */

    $('journal-form')?.addEventListener('submit', event => {

        event.preventDefault();

        const title = $('journal-title')?.value.trim() || '';
        const body = $('journal-entry')?.value.trim() || '';

        if (!title || !body) {
            toast('Add a title and reflection first.');
            return;
        }

        journalEntries.unshift({
            title,
            body,
            mood: $('journal-mood')?.value || 'Reflective',
            reference: $('journal-verse')?.value.trim() || '',

            date: new Date().toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),

            createdAt: new Date().toISOString()
        });

        if (persist(STORAGE.journal, journalEntries)) {
            $('journal-form').reset();

            renderJournal();

            toast('Your reflection was saved on this device.');
        }
    });

    /* JOURNAL COPY AND DELETE */

    $('journal-list')?.addEventListener('click', async event => {

        const deleteButton =
            event.target.closest('[data-journal-delete]');

        const copyButton =
            event.target.closest('[data-journal-copy]');

        if (deleteButton) {

            journalEntries.splice(
                Number(deleteButton.dataset.journalDelete),
                1
            );

            persist(STORAGE.journal, journalEntries);

            renderJournal();

            toast('Journal entry deleted.');
        }

        if (copyButton) {

            const entry =
                journalEntries[Number(copyButton.dataset.journalCopy)];

            if (!entry) return;

            try {
                await copyText(
                    `${entry.title}\n${entry.body}${entry.reference ? `\n${entry.reference}` : ''}`
                );

                toast('Journal entry copied.');

            } catch {
                toast('Copy is not available in this browser.');
            }
        }
    });

    /* QUIZ EVENTS */

    $('quiz-options')?.addEventListener('click', event => {

        const button = event.target.closest('[data-quiz-answer]');

        if (button) {
            answerQuiz(Number(button.dataset.quizAnswer));
        }
    });

    $('quiz-next')?.addEventListener('click', nextQuizQuestion);

    $('quiz-restart')?.addEventListener('click', startQuiz);

    /* SAINTS SEARCH AND FILTER */

    $('saint-search')?.addEventListener('input', renderSaints);

    $('saint-filter')?.addEventListener('change', renderSaints);

    /* INSTALL APP */

    $('install-app')?.addEventListener('click', installApp);
}

/* -------------------- THEME, FONT & PWA -------------------- */

function applyFontSize() {
    const verses = $('verses');

    if (verses) {
        verses.style.fontSize = `${state.fontSize}px`;
    }

    persist(STORAGE.fontSize, state.fontSize);
}

function applySavedTheme() {
    try {
        const dark = localStorage.getItem(STORAGE.theme) === '1';

        document.body.classList.toggle('dark', dark);

    } catch (error) {
        console.warn(
            'WordPath could not restore the theme preference.',
            error
        );
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark');

    try {
        localStorage.setItem(
            STORAGE.theme,
            document.body.classList.contains('dark') ? '1' : '0'
        );

    } catch (error) {
        console.warn(
            'WordPath could not save the theme preference.',
            error
        );
    }
}

/* -------------------- PWA INSTALLATION -------------------- */

let installPromptEvent = null;

window.addEventListener('beforeinstallprompt', event => {

    event.preventDefault();

    installPromptEvent = event;

    const button = $('install-app');

    if (button) {
        button.hidden = false;
    }
});

window.addEventListener('appinstalled', () => {

    installPromptEvent = null;

    const button = $('install-app');

    if (button) {
        button.textContent = 'Installed';
    }

    toast('WordPath was installed successfully.');
});

async function installApp() {

    if (!installPromptEvent) {
        toast(
            'To install WordPath, use your browser menu and choose Install app or Add to Home screen.'
        );

        return;
    }

    installPromptEvent.prompt();

    try {
        await installPromptEvent.userChoice;

    } finally {
        installPromptEvent = null;
    }
}


/* -------------------- EMAIL-ONLY DEVICE SIGN-IN -------------------- */
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}
function showAuthenticatedApp(email) {
    const login = $('login-screen');
    const shell = $('app-shell');
    if (login) login.hidden = true;
    if (shell) shell.hidden = false;
    setText('signed-in-email', email);
    initializeWordPath();
}
function setupEmailSignIn() {
    const rememberedEmail = localStorage.getItem(STORAGE.authEmail) || '';
    const emailInput = $('login-email');
    if (emailInput) {
        emailInput.value = rememberedEmail;
        emailInput.addEventListener('input', () => {
            const error = $('login-error');
            if (error) { error.textContent = ''; error.hidden = true; }
            emailInput.removeAttribute('aria-invalid');
        });
    }

    $('login-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const email = (emailInput?.value || '').trim().toLowerCase();
        const error = $('login-error');
        if (!isValidEmail(email)) {
            if (error) { error.textContent = 'Enter a valid email address, such as name@example.com.'; error.hidden = false; }
            emailInput?.setAttribute('aria-invalid', 'true');
            emailInput?.focus();
            return;
        }
        localStorage.setItem(STORAGE.authEmail, email);
        localStorage.setItem(STORAGE.authenticated, 'true');
        if (error) { error.textContent = ''; error.hidden = true; }
        emailInput?.removeAttribute('aria-invalid');
        showAuthenticatedApp(email);
    });

    $('sign-out')?.addEventListener('click', () => {
        localStorage.setItem(STORAGE.authenticated, 'false');
        const shell = $('app-shell');
        const login = $('login-screen');
        if (shell) shell.hidden = true;
        if (login) login.hidden = false;
        if (emailInput) emailInput.value = localStorage.getItem(STORAGE.authEmail) || '';
        $('login-error') && ($('login-error').textContent = '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    if (localStorage.getItem(STORAGE.authenticated) === 'true' && isValidEmail(rememberedEmail)) {
        showAuthenticatedApp(rememberedEmail);
    }
}

/* -------------------- INITIALIZATION -------------------- */

let wordPathInitialized = false;
function initializeWordPath() {
    if (wordPathInitialized) return;
    wordPathInitialized = true;

    if (!LANGUAGE_OPTIONS[state.language]) state.language = 'english';
    const languageSelect = $('language-select');
    if (languageSelect) languageSelect.value = state.language;
    if ($('version-wrap')) $('version-wrap').hidden = state.language !== 'english';
    if ($('version-select')) $('version-select').value = state.version;

    populateBooks();

    populateChapters();

    const savedFontSize = Number(
        loadJSON(STORAGE.fontSize, 17)
    );

    state.fontSize = Number.isFinite(savedFontSize)
        ? Math.max(13, Math.min(25, savedFontSize))
        : 17;

    applySavedTheme();

    applyFontSize();

    updateBookmarkCount();

    bindEvents();

    // Load the initial Bible chapter.
    loadChapter({
        keepView: true
    });

    // Set installation information.
    const installButton = $('install-app');

    if (installButton && !installPromptEvent) {
        installButton.title =
            'Install WordPath from your browser menu if supported.';
    }

    // Register the service worker if available.
    if (
        'serviceWorker' in navigator &&
        location.protocol !== 'file:'
    ) {
        navigator.serviceWorker.register('./service-worker.js')
            .catch(error =>
                console.info(
                    'WordPath service worker is not active:',
                    error.message
                )
            );
    }
}

/* -------------------- START WORDPATH -------------------- */

function startWordPathAccess() {
    setupEmailSignIn();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWordPathAccess, { once: true });
} else {
    startWordPathAccess();
}

