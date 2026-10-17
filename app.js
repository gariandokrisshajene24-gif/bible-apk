const BOOKS = [
    ['Genesis', 50, 'OT', 'genesis'],
    ['Exodus', 40, 'OT', 'exodus'],
    ['Leviticus', 27, 'OT', 'leviticus'],
    ['Numbers', 36, 'OT', 'numbers'],
    ['Deuteronomy', 34, 'OT', 'deuteronomy'],
    ['Joshua', 24, 'OT', 'joshua'],
    ['Judges', 21, 'OT', 'judges'],
    ['Ruth', 4, 'OT', 'ruth'],
    ['1 Samuel', 31, 'OT', '1-samuel'],
    ['2 Samuel', 24, 'OT', '2-samuel'],
    ['1 Kings', 22, 'OT', '1-kings'],
    ['2 Kings', 25, 'OT', '2-kings'],
    ['1 Chronicles', 29, 'OT', '1-chronicles'],
    ['2 Chronicles', 36, 'OT', '2-chronicles'],
    ['Ezra', 10, 'OT', 'ezra'],
    ['Nehemiah', 13, 'OT', 'nehemiah'],
    ['Esther', 10, 'OT', 'esther'],
    ['Job', 42, 'OT', 'job'],
    ['Psalms', 150, 'OT', 'psalms'],
    ['Proverbs', 31, 'OT', 'proverbs'],
    ['Ecclesiastes', 12, 'OT', 'ecclesiastes'],
    ['Song of Solomon', 8, 'OT', 'song-of-solomon'],
    ['Isaiah', 66, 'OT', 'isaiah'],
    ['Jeremiah', 52, 'OT', 'jeremiah'],
    ['Lamentations', 5, 'OT', 'lamentations'],
    ['Ezekiel', 48, 'OT', 'ezekiel'],
    ['Daniel', 12, 'OT', 'daniel'],
    ['Hosea', 14, 'OT', 'hosea'],
    ['Joel', 3, 'OT', 'joel'],
    ['Amos', 9, 'OT', 'amos'],
    ['Obadiah', 1, 'OT', 'obadiah'],
    ['Jonah', 4, 'OT', 'jonah'],
    ['Micah', 7, 'OT', 'micah'],
    ['Nahum', 3, 'OT', 'nahum'],
    ['Habakkuk', 3, 'OT', 'habakkuk'],
    ['Zephaniah', 3, 'OT', 'zephaniah'],
    ['Haggai', 2, 'OT', 'haggai'],
    ['Zechariah', 14, 'OT', 'zechariah'],
    ['Malachi', 4, 'OT', 'malachi'],
    ['Matthew', 28, 'NT', 'matthew'],
    ['Mark', 16, 'NT', 'mark'],
    ['Luke', 24, 'NT', 'luke'],
    ['John', 21, 'NT', 'john'],
    ['Acts', 28, 'NT', 'acts'],
    ['Romans', 16, 'NT', 'romans'],
    ['1 Corinthians', 16, 'NT', '1-corinthians'],
    ['2 Corinthians', 13, 'NT', '2-corinthians'],
    ['Galatians', 6, 'NT', 'galatians'],
    ['Ephesians', 6, 'NT', 'ephesians'],
    ['Philippians', 4, 'NT', 'philippians'],
    ['Colossians', 4, 'NT', 'colossians'],
    ['1 Thessalonians', 5, 'NT', '1-thessalonians'],
    ['2 Thessalonians', 3, 'NT', '2-thessalonians'],
    ['1 Timothy', 6, 'NT', '1-timothy'],
    ['2 Timothy', 4, 'NT', '2-timothy'],
    ['Titus', 3, 'NT', 'titus'],
    ['Philemon', 1, 'NT', 'philemon'],
    ['Hebrews', 13, 'NT', 'hebrews'],
    ['James', 5, 'NT', 'james'],
    ['1 Peter', 5, 'NT', '1-peter'],
    ['2 Peter', 3, 'NT', '2-peter'],
    ['1 John', 5, 'NT', '1-john'],
    ['2 John', 1, 'NT', '2-john'],
    ['3 John', 1, 'NT', '3-john'],
    ['Jude', 1, 'NT', 'jude'],
    ['Revelation', 22, 'NT', 'revelation']
];

const VERSION_NAMES = {
    kjv: 'King James Version',
    web: 'World English Bible',
    asv: 'American Standard Version'
};

const state = {
    book: 0,
    chapter: 1,
    version: 'kjv',
    verses: [],
    fontSize: 17,
    currentView: 'reader',
    bookmarks: loadJSON('wordpath-bookmarks', []),
    plan: null,
    completed: loadJSON('wordpath-completed', {})
};

const $ = id => document.getElementById(id);

function loadJSON(k, f) {
    try {
        return JSON.parse(localStorage.getItem(k)) ?? f;
    } catch {
        return f;
    }
}

function persist(k, v) {
    try {
        localStorage.setItem(k, JSON.stringify(v));
        return true;
    } catch (err) {
        console.warn(`WordPath could not save ${k} to local storage.`, err);
        if (typeof toast === 'function') {
            toast('Could not save on this device. Check browser storage settings.');
        }
        return false;
    }
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

function toast(m) {
    const e = $('toast');
    e.textContent = m;
    e.classList.add('show');

    clearTimeout(toast.timer);

    toast.timer = setTimeout(
        () => e.classList.remove('show'),
        2500
    );
}

function selectedBook() {
    return BOOKS[state.book];
}


// POPULATE BIBLE BOOKS

function populateBooks() {
    const sel = $('book-select');
    sel.innerHTML = '';

    [
        [
            'Old Testament',
            BOOKS.map((b, i) => ({ ...b, index: i }))
                .filter(b => b[2] === 'OT')
        ],
        [
            'New Testament',
            BOOKS.map((b, i) => ({ ...b, index: i }))
                .filter(b => b[2] === 'NT')
        ]
    ].forEach(([group, books]) => {
        const og = document.createElement('optgroup');
        og.label = group;

        books.forEach(b => {
            const o = document.createElement('option');
            o.value = b.index;
            o.textContent = b[0];
            og.appendChild(o);
        });

        sel.appendChild(og);
    });

    sel.value = String(state.book);
}

function populateChapters() {
    const total = selectedBook()[1];

    $('chapter-select').innerHTML = Array.from(
        { length: total },
        (_, i) => `<option value="${i + 1}">Chapter ${i + 1}</option>`
    ).join('');

    $('chapter-select').value = String(
        Math.min(state.chapter, total)
    );
}

function normalizeBook(t) {
    const q = t.toLowerCase().replace(/[^a-z0-9]/g, '');

    return BOOKS.findIndex(b =>
        b[0].toLowerCase().replace(/[^a-z0-9]/g, '') === q ||
        b[3].replace(/[^a-z0-9]/g, '') === q
    );
}


// FETCH BIBLE CHAPTER
// KJV is bundled into the service-worker cache for full-book offline reading.
// The online source is only a fallback when a book has not yet been cached.
async function fetchChapter(bi, ch, version = state.version) {
    const b = BOOKS[bi];

    if (version === 'kjv') {
        const filename = b[3].replace(/-/g, '_') + '.json';
        const urls = [
            `./bible/kjv/${filename}`,
            `https://raw.githubusercontent.com/nolanbaxter/kjv-bible/main/${filename}`
        ];

        for (const url of urls) {
            try {
                const response = await fetch(url, {
                    headers: { Accept: 'application/json' }
                });
                if (!response.ok) continue;

                const data = await response.json();
                const chapterData = data.chapters?.[ch] ?? data.chapters?.[String(ch)];
                if (!chapterData || typeof chapterData !== 'object') continue;

                const values = Object.entries(chapterData)
                    .filter(([key, value]) => /^\d+$/.test(key) && typeof value === 'string')
                    .sort((a, b) => Number(a[0]) - Number(b[0]));

                if (values.length) {
                    return {
                        verses: values.map(([number, text]) => ({ number: Number(number), text })),
                        attribution: 'King James Version (public-domain text; KJV Bible JSON corpus)',
                        version: 'King James Version'
                    };
                }
            } catch (error) {
                // Try the next source. Cached local files work without a network connection.
            }
        }
    }

    // WEB and ASV remain online-only unless their own licensed datasets are added.
    const url = `https://api.midvash.com/v1/${encodeURIComponent(version)}/${encodeURIComponent(b[3])}/${ch}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
        throw Error(version === 'kjv'
            ? 'This KJV chapter is not cached yet. Connect to the internet and use “Download Bible for offline use”.'
            : 'This translation needs an internet connection. Select KJV for the offline Bible.');
    }

    const json = await res.json();
    const data = json.data || json;
    const verses = data.verses || data.chapter?.verses || data.text;

    if (Array.isArray(verses)) {
        return {
            verses: verses.map((v, i) => ({
                number: v.number ?? v.verse ?? i + 1,
                text: typeof v === 'string' ? v : (v.text ?? v.content ?? v.value ?? '')
            })).filter(v => v.text),
            attribution: data.attribution || data.meta?.copyright || data.version?.attribution || data.copyright || '',
            version: data.version?.name || data.version?.abbreviation || VERSION_NAMES[version]
        };
    }

    if (typeof verses === 'string') {
        return {
            verses: verses.split('\n').filter(Boolean).map((text, i) => ({ number: i + 1, text })),
            attribution: data.attribution || data.meta?.copyright || '',
            version: VERSION_NAMES[version]
        };
    }

    throw Error('The Bible service returned an unexpected format. Try another translation.');
}


// LOAD CHAPTER

async function loadChapter(opts = {}) {
    if (!opts.keepView) showView('reader');

    state.book = Number($('book-select').value);
    state.chapter = Number($('chapter-select').value);
    state.version = $('version-select').value;

    $('passage-title').textContent =
        `${selectedBook()[0]} ${state.chapter}`;

    $('testament-label').textContent =
        selectedBook()[2] === 'OT'
            ? 'OLD TESTAMENT'
            : 'NEW TESTAMENT';

    $('translation-line').textContent =
        `${VERSION_NAMES[state.version]} · Chapter ${state.chapter}`;

    $('chapter-position').textContent =
        `${selectedBook()[0]} · ${state.chapter}`;

    $('verses').innerHTML =
        '<div class="loading-card"><span class="loader"></span><p>Loading the full chapter…</p></div>';

    $('reader-status').textContent =
        'Connecting to the Bible text service…';

    $('copyright-note').textContent =
        'Checking translation attribution…';

    $('chapter-bookmark').textContent =
        chapterSaved() ? '★' : '☆';

    try {
        const r = await fetchChapter(
            state.book,
            state.chapter,
            state.version
        );

        state.verses = r.verses;

        $('translation-line').textContent =
            `${r.version || VERSION_NAMES[state.version]} · Chapter ${state.chapter}`;

        $('copyright-note').textContent = r.attribution
            ? `Translation attribution: ${r.attribution}`
            : 'Bible text provided by Midvash Bible API. Check the selected translation’s license before redistribution.';

        $('reader-status').textContent =
            `${r.verses.length} verses · Select ☆ beside a verse to save it`;

        renderVerses();

    } catch (err) {
        state.verses = [];

        $('verses').innerHTML =
            `<div class="empty-state"><strong>We couldn’t load this chapter.</strong><p>${esc(err.message)}</p><p>Check your internet connection, then try again. The complete Bible is loaded chapter by chapter from the online Bible API.</p><button class="secondary-btn" id="retry-load">Try again</button></div>`;

        $('reader-status').textContent =
            'Unable to load Scripture';

        $('copyright-note').textContent =
            'WordPath requires an internet connection to retrieve Bible chapters.';

        $('retry-load')?.addEventListener('click', () =>
            loadChapter({ keepView: true })
        );
    }
}


// DISPLAY VERSES

function renderVerses() {
    const q = $('verse-filter').value.trim().toLowerCase();

    const vs = state.verses.filter(v =>
        !q ||
        v.text.toLowerCase().includes(q) ||
        String(v.number) === q
    );

    if (!vs.length) {
        $('verses').innerHTML =
            '<div class="empty-state">No verses in this chapter match that word.</div>';

        return;
    }

    $('verses').innerHTML = vs.map(v => {
        const ref =
            `${selectedBook()[0]} ${state.chapter}:${v.number}`;

        const saved = state.bookmarks.some(b =>
            b.reference === ref &&
            b.version === state.version
        );

        return `
            <p class="verse-line" id="verse-${v.number}">
                <span class="verse-num">${v.number}</span>
                <span class="verse">${esc(v.text)}</span>
                <span class="verse-actions">
                    <button
                        class="verse-save ${saved ? 'saved' : ''}"
                        data-save-verse="${v.number}"
                        title="Save verse"
                        aria-label="Save ${esc(ref)}"
                    >${saved ? '★' : '☆'}</button>
                    <button class="verse-tool" data-copy-verse="${v.number}" title="Copy verse" aria-label="Copy ${esc(ref)}">⧉</button>
            </p>
        `;
    }).join('');
}


// CHAPTER BOOKMARKS

function chapterSaved() {
    return state.bookmarks.some(b =>
        b.reference === `${selectedBook()[0]} ${state.chapter}` &&
        b.version === state.version
    );
}

function updateBookmarkCount() {
    $('bookmark-count').textContent = state.bookmarks.length;
}

function saveVerse(n) {
    const v = state.verses.find(
        x => Number(x.number) === Number(n)
    );

    if (!v) return;

    const ref =
        `${selectedBook()[0]} ${state.chapter}:${v.number}`;

    const i = state.bookmarks.findIndex(b =>
        b.reference === ref &&
        b.version === state.version
    );

    if (i >= 0) {
        state.bookmarks.splice(i, 1);
        toast('Bookmark removed.');
    } else {
        state.bookmarks.unshift({
            reference: ref,
            text: v.text,
            version: state.version,
            versionName: VERSION_NAMES[state.version]
        });

        toast('Verse saved to your bookmarks.');
    }

    persist('wordpath-bookmarks', state.bookmarks);
    updateBookmarkCount();
    renderVerses();

    if (state.currentView === 'saved') renderSaved();
}

function saveChapter() {
    const ref = `${selectedBook()[0]} ${state.chapter}`;

    const i = state.bookmarks.findIndex(b =>
        b.reference === ref &&
        b.version === state.version
    );

    if (i >= 0) {
        state.bookmarks.splice(i, 1);
        toast('Chapter bookmark removed.');
    } else {
        state.bookmarks.unshift({
            reference: ref,
            text: `Bookmark for ${ref}`,
            version: state.version,
            versionName: VERSION_NAMES[state.version],
            isChapter: true
        });

        toast('Chapter bookmarked.');
    }

    persist('wordpath-bookmarks', state.bookmarks);

    $('chapter-bookmark').textContent =
        chapterSaved() ? '★' : '☆';

    updateBookmarkCount();
}


// DISPLAY SAVED BOOKMARKS

function renderSaved() {
    const list = $('saved-list');

    if (!state.bookmarks.length) {
        list.innerHTML =
            '<div class="empty-state">No bookmarks yet. Open a chapter and tap ☆ beside a verse to keep it here.</div>';

        return;
    }

    list.innerHTML = state.bookmarks.map((b, i) => `
        <article class="saved-item">
            <div>
                <blockquote>
                    ${b.isChapter ? esc(b.text) : `“${esc(b.text)}”`}
                </blockquote>

                <strong>
                    ${esc(b.reference)} · ${esc(b.version.toUpperCase())}
                </strong>

                <p>
                    <button
                        class="secondary-btn"
                        data-open-bookmark="${i}"
                    >
                        Open passage →
                    </button>
                </p>
            </div>

            <button data-remove-bookmark="${i}">
                Remove
            </button>
        </article>
    `).join('');
}


// NAVIGATION BETWEEN SECTIONS

function showView(view) {
    state.currentView = view;

    ['reader', 'daily', 'saved', 'plans', 'quiz', 'journal', 'saints'].forEach(v => {
        const el = $(v === 'reader' ? 'reader-section' : `${v}-section`);

        el.classList.toggle('hidden', v !== view);

        document.querySelectorAll('.nav-link').forEach(n =>
            n.classList.toggle('active', n.dataset.view === view)
        );
    });

    if (view === 'saved') renderSaved();
    if (view === 'daily') loadDailyVerse();
    if (view === 'journal') renderJournal();
    if (view === 'quiz') startQuiz();

    window.scrollTo({
        top: view === 'reader' ? 300 : 260,
        behavior: 'smooth'
    });
}


// VERSE OF THE DAY

const DAILY = [
    ['Psalm 119:105', 18, 119, 105],
    ['John 3:16', 42, 3, 16],
    ['Proverbs 3:5', 19, 3, 5],
    ['Matthew 11:28', 39, 11, 28],
    ['Romans 8:28', 44, 8, 28],
    ['Isaiah 41:10', 22, 41, 10],
    ['Philippians 4:6', 49, 4, 6]
];

async function loadDailyVerse() {
    const c = DAILY[
        ((Math.floor(Date.now() / 86400000) % DAILY.length) +
            DAILY.length) % DAILY.length
    ];

    $('daily-reference').textContent = `${c[0]} · KJV`;
    $('daily-text').textContent = 'Loading today’s verse…';

    try {
        const r = await fetchChapter(c[1], c[2], 'kjv');

        const v = r.verses.find(
            x => Number(x.number) === c[3]
        );

        if (v) $('daily-text').textContent = `“${v.text}”`;

    } catch {
        $('daily-text').textContent =
            '“Thy word is a lamp unto my feet, and a light unto my path.”';

        $('daily-reference').textContent =
            'Psalm 119:105 · KJV (sample fallback)';
    }
}


// SEARCH BIBLE REFERENCES

function readReference(raw) {
    const m = raw.trim().match(
        /^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/
    );

    if (!m) {
        toast('Use a reference like John 3:16 or Psalm 23.');
        return;
    }

    const idx = normalizeBook(m[1]);

    if (idx < 0) {
        toast('Book not recognized. Try its full name, like 1 Corinthians.');
        return;
    }

    state.book = idx;
    state.chapter = Number(m[2]);

    $('book-select').value = String(idx);

    populateChapters();

    if (
        state.chapter < 1 ||
        state.chapter > selectedBook()[1]
    ) {
        toast(`Choose a chapter from 1 to ${selectedBook()[1]}.`);
        return;
    }

    $('chapter-select').value = String(state.chapter);

    loadChapter().then(() => {
        if (m[3]) {
            setTimeout(() => {
                const el = $(`verse-${Number(m[3])}`);

                if (el) {
                    el.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });

                    el.style.background = '#e9dfc5';

                    setTimeout(() => el.style.background = '', 2000);

                } else {
                    toast('That verse number was not found in the loaded chapter.');
                }
            }, 250);
        }
    });
}


// READING PLANS

const PLANS = {
    peace: {
        title: 'Peace for the Week',

        days: [
            ['Psalms', 23],
            ['Matthew', 6],
            ['John', 14],
            ['Philippians', 4],
            ['Isaiah', 41],
            ['Psalm', 46],
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
            ['Psalm', 1],
            ['Proverbs', 3],
            ['Matthew', 5],
            ['John', 1],
            ['Romans', 8],
            ['Psalm', 23],
            ['Luke', 15],
            ['Ephesians', 2],
            ['Philippians', 4],
            ['Isaiah', 40],
            ['John', 15],
            ['1 Corinthians', 13],
            ['Psalm', 46],
            ['Matthew', 6],
            ['James', 1],
            ['Romans', 12],
            ['Colossians', 3],
            ['Psalm', 121],
            ['John', 14],
            ['Micah', 6],
            ['Hebrews', 11],
            ['Galatians', 5],
            ['Psalm', 91],
            ['Matthew', 11],
            ['2 Timothy', 3],
            ['1 John', 4],
            ['Romans', 5],
            ['Revelation', 21],
            ['Psalm', 150]
        ]
    }
};

function renderPlan(id) {
    state.plan = id;

    const p = PLANS[id];
    const done = state.completed[id] || [];

    $('plan-progress').classList.remove('hidden');

    $('plan-progress').innerHTML = `
        <h3>${esc(p.title)}</h3>

        <p>
            ${done.length} of ${p.days.length} readings completed
        </p>

        ${p.days.map((d, i) => `
            <label class="plan-day">
                <input
                    type="checkbox"
                    data-plan-day="${i}"
                    ${done.includes(i) ? 'checked' : ''}
                >

                <span>
                    Day ${i + 1}: ${esc(d[0])} ${d[1]}
                </span>

                <button
                    class="secondary-btn"
                    data-plan-open="${i}"
                    style="margin-left:auto;padding:7px 10px"
                >
                    Read →
                </button>
            </label>
        `).join('')}
    `;

    $('plan-progress').scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
    });
}


// EVENT LISTENERS

document.querySelectorAll('.nav-link').forEach(b =>
    b.addEventListener('click', () => showView(b.dataset.view))
);

$('start-reading').addEventListener('click', () => {
    showView('reader');

    $('reader-section').scrollIntoView({
        behavior: 'smooth'
    });
});

$('book-select').addEventListener('change', () => {
    state.book = Number($('book-select').value);
    state.chapter = 1;
    populateChapters();
});

$('chapter-select').addEventListener('change', () =>
    state.chapter = Number($('chapter-select').value)
);

$('version-select').addEventListener('change', () =>
    state.version = $('version-select').value
);

$('load-chapter').addEventListener('click', () => loadChapter());

$('reference-form').addEventListener('submit', e => {
    e.preventDefault();
    readReference($('reference-search').value);
});

$('verse-filter').addEventListener('input', renderVerses);

$('clear-filter').addEventListener('click', () => {
    $('verse-filter').value = '';
    renderVerses();
});

$('chapter-bookmark').addEventListener('click', saveChapter);

$('verses').addEventListener('click', e => {
    const b = e.target.closest('[data-save-verse]');
    if (b) saveVerse(b.dataset.saveVerse);
});


// PREVIOUS CHAPTER

$('previous-chapter').addEventListener('click', () => {
    if (state.chapter > 1) {
        state.chapter--;

    } else if (state.book > 0) {
        state.book--;
        state.chapter = BOOKS[state.book][1];

        $('book-select').value = String(state.book);

    } else {
        return toast('You are at the beginning of the Bible.');
    }

    populateChapters();
    loadChapter();
});


// NEXT CHAPTER

$('next-chapter').addEventListener('click', () => {
    if (state.chapter < selectedBook()[1]) {
        state.chapter++;

    } else if (state.book < BOOKS.length - 1) {
        state.book++;
        state.chapter = 1;

        $('book-select').value = String(state.book);

    } else {
        return toast('You have reached the end of the Bible.');
    }

    populateChapters();
    loadChapter();
});


// FONT SIZE CONTROLS

$('font-down').addEventListener('click', () => {
    $('verses').style.fontSize =
        `${state.fontSize = Math.max(13, state.fontSize - 1)}px`;
});

$('font-up').addEventListener('click', () => {
    $('verses').style.fontSize =
        `${state.fontSize = Math.min(25, state.fontSize + 1)}px`;
});


// DARK MODE

$('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');

    try {
        localStorage.setItem(
            'wordpath-dark',
            document.body.classList.contains('dark') ? '1' : '0'
        );
    } catch (err) {
        console.warn('WordPath could not save the theme preference.', err);
    }
});


// SAVED BOOKMARK EVENTS

$('saved-list').addEventListener('click', e => {
    const o = e.target.closest('[data-open-bookmark]');
    const r = e.target.closest('[data-remove-bookmark]');

    if (r) {
        state.bookmarks.splice(Number(r.dataset.removeBookmark), 1);

        persist('wordpath-bookmarks', state.bookmarks);
        updateBookmarkCount();
        renderSaved();
    }

    if (o) {
        readReference(
            state.bookmarks[Number(o.dataset.openBookmark)].reference
        );
    }
});


// DAILY VERSE BUTTONS

$('daily-read').addEventListener('click', () =>
    readReference($('daily-reference').textContent.split(' · ')[0])
);

$('daily-save').addEventListener('click', async () => {
    const ref = $('daily-reference').textContent.split(' · ')[0];
    const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);

    if (!m) return;

    const idx = normalizeBook(m[1]);

    try {
        const r = await fetchChapter(
            idx,
            Number(m[2]),
            'kjv'
        );

        const v = r.verses.find(
            x => Number(x.number) === Number(m[3])
        );

        if (
            v &&
            !state.bookmarks.some(
                b => b.reference === ref && b.version === 'kjv'
            )
        ) {
            state.bookmarks.unshift({
                reference: ref,
                text: v.text,
                version: 'kjv',
                versionName: VERSION_NAMES.kjv
            });

            persist('wordpath-bookmarks', state.bookmarks);
            updateBookmarkCount();

            toast('Daily verse saved.');

        } else {
            toast('That verse is already saved or unavailable.');
        }

    } catch {
        toast('Connect to the internet to save this verse.');
    }
});


// READING PLAN EVENTS

document.querySelectorAll('.plan-start').forEach(b =>
    b.addEventListener('click', () => renderPlan(b.dataset.plan))
);

$('plan-progress').addEventListener('change', e => {
    if (e.target.matches('[data-plan-day]')) {
        const i = Number(e.target.dataset.planDay);
        const done = state.completed[state.plan] || [];

        state.completed[state.plan] = e.target.checked
            ? [...new Set([...done, i])]
            : done.filter(x => x !== i);

        persist('wordpath-completed', state.completed);
        renderPlan(state.plan);
    }
});

$('plan-progress').addEventListener('click', e => {
    const b = e.target.closest('[data-plan-open]');

    if (b && state.plan) {
        const d = PLANS[state.plan].days[
            Number(b.dataset.planOpen)
        ];

        readReference(`${d[0]} ${d[1]}`);
    }
});



// PRAYER JOURNAL: entries remain local to this browser.
const JOURNAL_KEY = 'wordpath-journal';
let journalEntries = loadJSON(JOURNAL_KEY, []);

function renderJournal() {
    const list = $('journal-list');
    if (!list) return;
    const count = $('journal-count');
    count.textContent = `${journalEntries.length} ${journalEntries.length === 1 ? 'entry' : 'entries'}`;
    if (!journalEntries.length) {
        list.innerHTML = '<div class="empty-state">Your reflections will appear here after you save your first entry.</div>';
        return;
    }
    list.innerHTML = journalEntries.map((entry, i) => `
        <article class="journal-entry-card">
            <h4>${esc(entry.title)}</h4>
            <div class="journal-entry-meta">${esc(entry.date)} · ${esc(entry.mood)}${entry.reference ? ` · ${esc(entry.reference)}` : ''}</div>
            <p>${esc(entry.body.length > 320 ? entry.body.slice(0, 320) + '…' : entry.body)}</p>
            <div class="journal-entry-actions">
                <button type="button" data-journal-copy="${i}">Copy</button>
                <button type="button" data-journal-delete="${i}">Delete</button>
            </div>
        </article>`).join('');
}

const journalForm = $('journal-form');
if (journalForm) {
    journalForm.addEventListener('submit', e => {
        e.preventDefault();
        const title = $('journal-title').value.trim();
        const body = $('journal-entry').value.trim();
        if (!title || !body) return toast('Add a title and reflection first.');
        journalEntries.unshift({
            title, body,
            mood: $('journal-mood').value,
            reference: $('journal-verse').value.trim(),
            date: new Date().toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'})
        });
        persist(JOURNAL_KEY, journalEntries);
        journalForm.reset();
        renderJournal();
        toast('Your reflection was saved on this device.');
    });
}
if ($('journal-list')) {
    $('journal-list').addEventListener('click', async e => {
        const del = e.target.closest('[data-journal-delete]');
        const copy = e.target.closest('[data-journal-copy]');
        if (del) {
            journalEntries.splice(Number(del.dataset.journalDelete), 1);
            persist(JOURNAL_KEY, journalEntries);
            renderJournal();
            toast('Journal entry deleted.');
        }
        if (copy) {
            const entry = journalEntries[Number(copy.dataset.journalCopy)];
            if (entry) {
                try { await navigator.clipboard.writeText(`${entry.title}\n${entry.body}${entry.reference ? '\n' + entry.reference : ''}`); toast('Journal entry copied.'); }
                catch { toast('Copy is not available in this browser.'); }
            }
        }
    });
}

// Verse copy control only.
$('verses').addEventListener('click', async e => {
    const copy = e.target.closest('[data-copy-verse]');
    if (!copy) return;

    const n = Number(copy.dataset.copyVerse);
    const v = state.verses.find(x => Number(x.number) === n);
    if (!v) return;

    const text = `${v.text} — ${selectedBook()[0]} ${state.chapter}:${n} (${VERSION_NAMES[state.version]})`;

    try {
        await navigator.clipboard.writeText(text);
        toast('Verse copied.');
    } catch {
        toast('Copy is not available in this browser.');
    }
});

// Saints library: searchable introductory entries.
const SAINTS = [
 {name:'Saint Peter the Apostle',tags:'apostle courage',virtue:'Faith and perseverance',patron:'Often associated with fishermen and the Church',detail:'A disciple of Jesus who is remembered for leadership, repentance, and steadfast faith.',symbol:'✝'},
 {name:'Saint Paul the Apostle',tags:'apostle courage',virtue:'Zeal and mission',patron:'Often associated with missionaries and writers',detail:'Remembered for spreading the Gospel and writing letters to early Christian communities.',symbol:'✦'},
 {name:'Saint Francis of Assisi',tags:'charity prayer',virtue:'Humility and care for creation',patron:'Often associated with animals and ecology',detail:'Known for a life of simplicity, peace, and care for the poor and all creation.',symbol:'☘'},
 {name:'Saint Thérèse of Lisieux',tags:'prayer charity',virtue:'Little way of love',patron:'Often associated with missions',detail:'Remembered for finding holiness in small acts of love and daily faithfulness.',symbol:'🌹'},
 {name:'Saint Augustine of Hippo',tags:'prayer courage',virtue:'Wisdom and conversion',patron:'Often associated with theologians',detail:'A Christian teacher whose writings reflect on grace, truth, and the search for God.',symbol:'✧'},
 {name:'Saint Joan of Arc',tags:'courage',virtue:'Courage and conviction',patron:'Often associated with France and soldiers',detail:'Remembered for courage under pressure and commitment to her convictions.',symbol:'⚔'},
 {name:'Saint Anthony of Padua',tags:'charity prayer',virtue:'Compassion and teaching',patron:'Often invoked for lost items',detail:'A Franciscan preacher remembered for teaching, generosity, and care for people in need.',symbol:'✦'},
 {name:'Saint Joseph',tags:'courage charity',virtue:'Faithfulness and quiet service',patron:'Often associated with workers and families',detail:'Remembered in Christian tradition as the faithful guardian of Jesus and husband of Mary.',symbol:'✧'},
 {name:'Saint Mary Magdalene',tags:'courage apostle',virtue:'Devotion and witness',patron:'Often associated with penitents',detail:'A follower of Jesus remembered in the Gospels as a witness to the Resurrection.',symbol:'🌿'},
 {name:'Saint Teresa of Ávila',tags:'prayer courage',virtue:'Prayer and spiritual wisdom',patron:'Often associated with contemplative life',detail:'A Carmelite reformer and writer known for teachings on prayer and inner life.',symbol:'✧'},
 {name:'Saint Lorenzo Ruiz',tags:'courage',virtue:'Faith under persecution',patron:'Filipino saint and martyr',detail:'The first Filipino saint, remembered for steadfast faith and courage in persecution.',symbol:'✝'},
 {name:'Saint Pedro Calungsod',tags:'courage apostle',virtue:'Service and missionary faith',patron:'Filipino saint and martyr',detail:'A young Filipino missionary remembered for courage and dedication to his faith.',symbol:'✦'}
];
function renderSaints(){
 const grid=$('saints-grid'); if(!grid)return;
 const q=($('saint-search')?.value||'').trim().toLowerCase(); const f=$('saint-filter')?.value||'all';
 const items=SAINTS.filter(s=>(f==='all'||s.tags.split(' ').includes(f))&&`${s.name} ${s.tags} ${s.virtue} ${s.patron} ${s.detail}`.toLowerCase().includes(q));
 grid.innerHTML=items.length?items.map(s=>`<article class="saint-card"><div class="saint-symbol">${s.symbol}</div><p class="eyebrow">SAINT PROFILE</p><h3>${esc(s.name)}</h3><strong>${esc(s.virtue)}</strong><p>${esc(s.detail)}</p><div class="saint-patron"><span>ASSOCIATED WITH</span>${esc(s.patron)}</div></article>`).join(''):'<div class="empty-state">No saints match your search. Try another name or filter.</div>';
}
$('saint-search')?.addEventListener('input',renderSaints);
$('saint-filter')?.addEventListener('change',renderSaints);
renderSaints();

// INITIALIZE APPLICATION

if (String(loadJSON('wordpath-dark', '0')) === '1') {
    document.body.classList.add('dark');
}

populateBooks();
populateChapters();
updateBookmarkCount();
loadChapter({ keepView: true });

// BIBLE KNOWLEDGE QUIZ
const QUIZ_QUESTIONS = [
    { q: 'Who built the ark?', options: ['Moses', 'Noah', 'Abraham', 'David'], answer: 1, fact: 'Noah built the ark before the great flood (Genesis 6).'},
    { q: 'Where was Jesus born?', options: ['Nazareth', 'Jerusalem', 'Bethlehem', 'Jericho'], answer: 2, fact: 'Jesus was born in Bethlehem (Matthew 2:1).'},
    { q: 'Who was swallowed by a great fish?', options: ['Jonah', 'Peter', 'Paul', 'Elijah'], answer: 0, fact: 'Jonah was inside the great fish for three days and three nights (Jonah 1:17).'},
    { q: 'How many days did God take to create the world before resting on the seventh day?', options: ['Five', 'Six', 'Seven', 'Twelve'], answer: 1, fact: 'The creation account describes six days of work, followed by rest on the seventh (Genesis 1–2).'},
    { q: 'Who defeated Goliath?', options: ['Solomon', 'Saul', 'Joshua', 'David'], answer: 3, fact: 'David defeated Goliath with a sling and a stone (1 Samuel 17).'},
    { q: 'What was the first miracle of Jesus recorded in John?', options: ['Healing a blind man', 'Walking on water', 'Turning water into wine', 'Feeding a crowd'], answer: 2, fact: 'Jesus turned water into wine at a wedding in Cana (John 2:1–11).'},
    { q: 'Who led the Israelites out of Egypt?', options: ['Moses', 'Isaiah', 'Aaron alone', 'Samuel'], answer: 0, fact: 'Moses led the Israelites out of Egypt (Exodus).'},
    { q: 'Which disciple denied knowing Jesus three times?', options: ['John', 'Thomas', 'Peter', 'Andrew'], answer: 2, fact: 'Peter denied Jesus three times before the rooster crowed (Luke 22:54–62).'},
    { q: 'What is the final book of the New Testament?', options: ['Jude', 'Acts', 'Hebrews', 'Revelation'], answer: 3, fact: 'Revelation is the final book of the New Testament.'},
    { q: 'Who received the Ten Commandments from God?', options: ['Moses', 'Abraham', 'Jacob', 'Joshua'], answer: 0, fact: 'Moses received the commandments on Mount Sinai (Exodus 19–20).'}
];
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
function startQuiz() {
    quizQuestions = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 8);
    quizIndex = 0; quizScore = 0; quizAnswered = false;
    renderQuizQuestion();
}
function renderQuizQuestion() {
    const q = quizQuestions[quizIndex];
    if (!q) return;
    $('quiz-progress').textContent = `QUESTION ${quizIndex + 1} OF ${quizQuestions.length}`;
    $('quiz-score').textContent = `Score: ${quizScore}`;
    $('quiz-progress-fill').style.width = `${(quizIndex / quizQuestions.length) * 100}%`;
    $('quiz-question').textContent = q.q;
    $('quiz-feedback').textContent = 'Choose an answer to continue.';
    $('quiz-feedback').className = 'quiz-feedback';
    $('quiz-next').disabled = true;
    $('quiz-next').textContent = quizIndex === quizQuestions.length - 1 ? 'See results →' : 'Next question →';
    quizAnswered = false;
    $('quiz-options').innerHTML = q.options.map((option, i) => `<button type="button" class="quiz-option" data-answer="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(option)}</button>`).join('');
}
$('quiz-options')?.addEventListener('click', e => {
    const button = e.target.closest('[data-answer]');
    if (!button || quizAnswered) return;
    quizAnswered = true;
    const q = quizQuestions[quizIndex];
    const chosen = Number(button.dataset.answer);
    if (chosen === q.answer) { quizScore++; button.classList.add('correct'); $('quiz-feedback').classList.add('is-correct'); $('quiz-feedback').textContent = `Correct! ${q.fact}`; }
    else { button.classList.add('incorrect'); $('quiz-options').querySelector(`[data-answer="${q.answer}"]`)?.classList.add('correct'); $('quiz-feedback').classList.add('is-wrong'); $('quiz-feedback').textContent = `Not quite. ${q.fact}`; }
    $('quiz-score').textContent = `Score: ${quizScore}`;
    $('quiz-progress-fill').style.width = `${((quizIndex + 1) / quizQuestions.length) * 100}%`;
    $('quiz-next').disabled = false;
    $('quiz-options').querySelectorAll('button').forEach(b => b.disabled = true);
});
$('quiz-next')?.addEventListener('click', () => {
    if (!quizAnswered) return;
    if (quizIndex < quizQuestions.length - 1) { quizIndex++; renderQuizQuestion(); return; }
    $('quiz-progress').textContent = 'QUIZ COMPLETE';
    $('quiz-question').textContent = `You scored ${quizScore} out of ${quizQuestions.length}!`;
    $('quiz-options').innerHTML = '<div class="quiz-result-mark">✦</div><p>Keep reading, reflecting, and growing in your understanding of Scripture.</p>';
    $('quiz-feedback').textContent = quizScore === quizQuestions.length ? 'Perfect round — wonderful work!' : 'Try another round to strengthen your Bible knowledge.';
    $('quiz-next').disabled = true;
    $('quiz-progress-fill').style.width = '100%';
    persist('wordpath-quiz-best', Math.max(Number(loadJSON('wordpath-quiz-best', 0)), quizScore));
    $('quiz-score').textContent = `Best score: ${loadJSON('wordpath-quiz-best', quizScore)}/${quizQuestions.length}`;
});
$('quiz-restart')?.addEventListener('click', startQuiz);


// PROGRESSIVE WEB APP: install prompt and complete KJV offline cache.
let wordPathInstallPrompt = null;
const installAppButton = document.getElementById('install-app');
const downloadBibleButton = document.getElementById('download-bible');
const offlineBibleStatus = document.getElementById('offline-bible-status');

function wordPathIsInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.navigator.standalone === true; // iOS Safari
}

function updateInstallButtonVisibility() {
    if (!installAppButton) return;
    if (wordPathIsInstalled()) {
        installAppButton.hidden = true;
        installAppButton.setAttribute('aria-hidden', 'true');
    }
}

// On launch, hide the button if this page is already running as an installed app.
updateInstallButtonVisibility();
window.matchMedia('(display-mode: standalone)').addEventListener?.('change', updateInstallButtonVisibility);

window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    wordPathInstallPrompt = event;
    if (installAppButton && !wordPathIsInstalled()) {
        installAppButton.hidden = false;
        installAppButton.removeAttribute('aria-hidden');
        installAppButton.textContent = 'Install app';
    }
});

installAppButton?.addEventListener('click', async () => {
    if (!wordPathInstallPrompt) {
        toast('To install: open your browser menu and choose Install app or Add to Home Screen.');
        return;
    }
    wordPathInstallPrompt.prompt();
    await wordPathInstallPrompt.userChoice;
    wordPathInstallPrompt = null;
});

window.addEventListener('appinstalled', () => {
    wordPathInstallPrompt = null;
    if (installAppButton) {
        installAppButton.hidden = true;
        installAppButton.setAttribute('aria-hidden', 'true');
    }
    toast('WordPath has been installed.');
});

function requestOfflineBibleDownload() {
    if (!('serviceWorker' in navigator)) {
        toast('Offline Bible downloads require a supported browser and HTTPS hosting.');
        return;
    }
    navigator.serviceWorker.ready.then(registration => {
        const worker = registration.active || navigator.serviceWorker.controller;
        if (!worker) throw new Error('The offline service worker is not ready yet. Reload and try again.');
        if (downloadBibleButton) {
            downloadBibleButton.disabled = true;
            downloadBibleButton.textContent = 'Preparing offline Bible…';
        }
        if (offlineBibleStatus) offlineBibleStatus.textContent = 'Downloading all 66 KJV books for offline reading. Keep this page open and connected to the internet.';
        worker.postMessage({ type: 'DOWNLOAD_BIBLE' });
    }).catch(error => {
        if (downloadBibleButton) {
            downloadBibleButton.disabled = false;
            downloadBibleButton.textContent = 'Download Bible for offline use';
        }
        if (offlineBibleStatus) offlineBibleStatus.textContent = error.message;
    });
}

downloadBibleButton?.addEventListener('click', requestOfflineBibleDownload);

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.addEventListener('message', event => {
        const data = event.data || {};
        if (data.type === 'BIBLE_CACHE_PROGRESS') {
            const message = `Offline Bible download: ${data.cached} of ${data.total} books (${Math.round(data.cached / data.total * 100)}%).`;
            if (offlineBibleStatus) offlineBibleStatus.textContent = message;
            if (downloadBibleButton) downloadBibleButton.textContent = 'Downloading Bible…';
        }
        if (data.type === 'BIBLE_CACHE_COMPLETE') {
            const message = data.cached === data.total
                ? 'Offline Bible ready: all 66 books and 31,102 KJV verses are cached on this device.'
                : `Offline Bible partly downloaded: ${data.cached} of ${data.total} books. Connect to the internet and retry.`;
            if (offlineBibleStatus) offlineBibleStatus.textContent = message;
            if (downloadBibleButton) {
                downloadBibleButton.disabled = false;
                downloadBibleButton.textContent = data.cached === data.total ? 'Bible saved for offline use' : 'Retry offline Bible download';
            }
            toast(data.cached === data.total ? 'All KJV books are ready offline.' : 'Some Bible books could not be downloaded.');
        }
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => navigator.serviceWorker.ready.then(() => {
                const worker = registration.active || navigator.serviceWorker.controller;
                worker?.postMessage({ type: 'GET_BIBLE_STATUS' });
            }))
            .catch(error => console.error('WordPath service worker registration failed:', error));
    });
}
