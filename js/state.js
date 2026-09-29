/* ---------------- State & Capability Setup ---------------- */
let db = null;
let assets = null;
let canWrite = false;

let S = { role: null, name: '', kelas: null };
let quiz = { list: [], idx: 0, score: 0, answered: false };
let quizTimerInterval = null;
let quizTimerSec = 0;

let unsubQ = null;
let unsubR = null;

let teacherKelasTab = 1;
let editId = null;

let cache = {
    q: { 1: [], 2: [], 3: [] },
    r: [],
    myResults: [],
    audioLib: []
};

async function initCaps() {
    if (typeof claude !== 'undefined' && claude.use) {
        try {
            db = await claude.use('db');
            assets = await claude.use('assets');
            const user = await claude.use('user');
            canWrite = user ? (user.can ? (user.can('data.write') ?? true) : true) : false;
        } catch (e) {
            console.warn("Claude capabilities interface error/unavailable:", e);
        }
    }
    render();
}

/* ---------------- Local Storage Fallbacks ---------------- */
function getLocalQuestions() {
    try {
        const stored = localStorage.getItem('sb_questions');
        if (stored) {
            return JSON.parse(stored);
        }
        localStorage.setItem('sb_questions', JSON.stringify(DEFAULT_QUESTIONS));
        return DEFAULT_QUESTIONS;
    } catch (e) {
        return typeof DEFAULT_QUESTIONS !== 'undefined' ? DEFAULT_QUESTIONS : [];
    }
}

function saveLocalQuestion(data, id = null) {
    const list = getLocalQuestions();
    if (id) {
        const idx = list.findIndex(q => q.id === id);
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...data };
        }
    } else {
        const newObj = { id: 'local_' + Date.now(), ...data };
        list.push(newObj);
    }
    localStorage.setItem('sb_questions', JSON.stringify(list));
}

function deleteLocalQuestion(id) {
    let list = getLocalQuestions();
    list = list.filter(q => q.id !== id);
    localStorage.setItem('sb_questions', JSON.stringify(list));
}

function getLocalResults(studentName = null) {
    try {
        const stored = localStorage.getItem('sb_results');
        const list = stored ? JSON.parse(stored) : [];
        if (studentName) {
            return list.filter(r => r.nama === studentName);
        }
        return list;
    } catch (e) {
        return [];
    }
}

function saveLocalResult(resultObj) {
    try {
        const list = getLocalResults();
        list.unshift(resultObj);
        localStorage.setItem('sb_results', JSON.stringify(list));
    } catch (e) {
        console.warn("Failed to save local result:", e);
    }
}

function getMateriRingkasan(kelas) {
    try {
        const stored = localStorage.getItem('sb_materi');
        if (stored) {
            const map = JSON.parse(stored);
            if (map && map[kelas]) return map[kelas];
        }
    } catch (e) { }
    return KELAS[kelas] ? KELAS[kelas].ringkasan : '';
}

function saveMateriRingkasan(kelas, ringkasan) {
    try {
        const stored = localStorage.getItem('sb_materi');
        const map = stored ? JSON.parse(stored) : {};
        map[kelas] = ringkasan;
        localStorage.setItem('sb_materi', JSON.stringify(map));
    } catch (e) {
        console.warn("Failed to save local materi ringkasan:", e);
    }
}

/* ---------------- Audio Library Local Storage Fallbacks ---------------- */
function getLocalAudioLib() {
    try {
        const stored = localStorage.getItem('sb_audio_library');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

function saveLocalAudio(audioObj) {
    try {
        const list = getLocalAudioLib();
        const existing = list.findIndex(a => a.id === audioObj.id);
        if (existing !== -1) {
            list[existing] = { ...list[existing], ...audioObj };
        } else {
            const newObj = { id: audioObj.id || ('local_audio_' + Date.now()), ...audioObj };
            list.unshift(newObj);
        }
        localStorage.setItem('sb_audio_library', JSON.stringify(list));
        return list[0];
    } catch (e) {
        console.warn("Failed to save local audio:", e);
        return null;
    }
}

function deleteLocalAudio(id) {
    try {
        let list = getLocalAudioLib();
        list = list.filter(a => a.id !== id);
        localStorage.setItem('sb_audio_library', JSON.stringify(list));
        return true;
    } catch (e) {
        console.warn("Failed to delete local audio:", e);
        return false;
    }
}

