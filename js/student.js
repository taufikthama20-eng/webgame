/* ---------------- Student Views & Logic ---------------- */

/* STUDENT: Nama */
function sNameView() {
  return `
  <button class="back" onclick="go('home')">&larr; Kembali</button>
  <h2>Siapa namamu?</h2>
  <p class="sub">Nama ini dipakai untuk menyimpan hasil kuismu.</p>
  <div class="card">
    <label class="field">Nama lengkap</label>
    <input type="text" id="inpName" placeholder="Contoh: Siti Amara" value="${S.name || ''}">
    <button class="btn btn-1 btn-block" onclick="submitName()">Lanjut</button>
  </div>`;
}

function submitName() {
  const v = document.getElementById('inpName').value.trim();
  if (!v) {
    alert('Isi nama dulu ya.');
    return;
  }
  S.name = v;
  go('s-kelas');
}

/* STUDENT: Pilih Kelas */
function sKelasView() {
  return `
  <button class="back" onclick="go('s-name')">&larr; Kembali</button>
  <h2>Halo, ${esc(S.name)} 👋</h2>
  <p class="sub">Pilih kelasmu.</p>
  <div class="klas-grid">
    ${[1, 2, 3].map(k => `
      <button class="klas-card" onclick="pickKelas(${k})">
        <span class="badge ${KELAS[k].badge}">SMP</span>
        <b>${KELAS[k].label}</b>
        <span>${esc(getMateriRingkasan(k))}</span>
      </button>
    `).join('')}
  </div>`;
}

function pickKelas(k) {
  S.kelas = k;
  go('s-materi');
}

/* STUDENT: Ringkasan Materi */
function sMateriView() {
  const k = S.kelas, info = KELAS[k];
  const ringkasan = getMateriRingkasan(k);
  return `
  <button class="back" onclick="go('s-kelas')">&larr; Ganti kelas</button>
  <span class="badge ${info.badge}">${info.label}</span>
  <h2 style="margin-top:8px;">Materi Hari Ini</h2>
  <div class="card"><p class="sub" style="margin-bottom:0;">${esc(ringkasan)}</p></div>
  <div class="row">
    <button class="btn" style="background:var(${info.accent});color:#1c1c1c;" onclick="startQuiz()">Mulai Kuis</button>
    <button class="btn btn-2" onclick="startFlashcards()">🎴 Mode Flashcard (Hafalan)</button>
    <button class="btn btn-ghost" onclick="openRiwayat()">Lihat Riwayat Nilai</button>
  </div>`;
}

/* ==========================================================================
   MODE FLASHCARD (KARTU BELAJAR DIGITAL 3D)
   ========================================================================== */

const FLASHCARDS_DATABASE = {
  1: [
    {
      kategori: '🎨 Seni Rupa',
      topik: 'Unsur Seni Rupa',
      depan: 'Apa saja 8 unsur dasar pembentuk karya Seni Rupa?',
      belakang: '1. Titik\n2. Garis\n3. Bidang\n4. Bentuk\n5. Ruang\n6. Warna\n7. Tekstur\n8. Gelap Terang',
      tip: '💡 Hafalan Cepat: Ti-Ga-Bi-Ben-Ru-War-Tek-Ge'
    },
    {
      kategori: '🎨 Seni Rupa',
      topik: 'Teori Warna',
      depan: 'Apa perbedaan Warna Primer, Sekunder, dan Tersier?',
      belakang: '• Primer: Warna pokok (Merah, Kuning, Biru)\n• Sekunder: Campuran 2 warna primer (Oranye, Hijau, Ungu)\n• Tersier: Campuran warna primer + sekunder (Cokelat, dll.)',
      tip: '💡 Contoh: Merah + Kuning = Oranye'
    },
    {
      kategori: '🎵 Seni Musik',
      topik: 'Unsur Musik',
      depan: 'Apa yang dimaksud dengan Ritme (Irama) dalam musik?',
      belakang: 'Ritme adalah panjang pendeknya bunyi serta nilai ketukan yang bergerak secara berulang dan teratur dalam sebuah lagu.',
      tip: '💡 Ritme menentukan tempo dan ketukan musik'
    },
    {
      kategori: '🎵 Seni Musik',
      topik: 'Alat Musik Tradisional',
      depan: 'Sebutkan 4 pengelompokan sumber bunyi alat musik (Idioperkusi, Membranofon, Aerofon, Kordofon)!',
      belakang: '• Idiofon: Getaran bahan alat itu sendiri (Angklung, Kolintang)\n• Membranofon: Selaput/Kulit (Gendang, Rebana)\n• Aerofon: Hembusan udara (Suling, Saxophone)\n• Kordofon: Senar/Dawai (Gitar, Kecapi)',
      tip: '💡 Hafalan: Idio (Benda), Memb (Kulit), Aero (Udara), Kordo (Dawai)'
    }
  ],
  2: [
    {
      kategori: '🎨 Seni Rupa',
      topik: 'Gambar Ilustrasi & Poster',
      depan: 'Apa 3 syarat utama Gambar Poster yang baik dan efektif?',
      belakang: '1. Menggunakan kalimat singkat, padat, dan jelas.\n2. Gambar menarik dengan kombinasi warna kontras.\n3. Pesan persuasif (mengajak) dan mudah dibaca dari jauh.',
      tip: '💡 Kunci: Visual mencolok + Kata persuasif'
    },
    {
      kategori: '🎵 Seni Musik',
      topik: 'Lagu Daerah & Vokal',
      depan: 'Apa perbedaan Bernyanyi Unisono dengan Grup Vokal?',
      belakang: '• Unisono: Bernyanyi bersama-sama dengan 1 jalur nada melodi saja.\n• Grup Vokal: Bernyanyi dengan pembagian 2 nada atau lebih (Sopran, Alto, Tenor, Bass).',
      tip: '💡 Uni = Satu nada melodi utama'
    }
  ],
  3: [
    {
      kategori: '🎨 Seni Rupa',
      topik: 'Seni Lukis & Patung',
      depan: 'Apa yang dimaksud dengan Aliran Seni Lukis Non-Representatif?',
      belakang: 'Aliran seni lukis yang tidak meniru bentuk alam nyata, melainkan mengutamakan ekspresi garis, bentuk geometris, dan komposisi warna abstrak.',
      tip: '💡 Non-representatif = Abstrak (tanpa tiruan alam)'
    },
    {
      kategori: '🎵 Seni Musik',
      topik: 'Ansambel Musik',
      depan: 'Apa fungsi Alat Musik Harmonis dalam ansambel musik?',
      belakang: 'Fungsinya adalah memainkan akor/kunci lagu untuk mengiringi melodi utama (Contoh: Piano, Gitar, Keyboard, Ukulele).',
      tip: '💡 Harmonis = Akor pengiring nada'
    }
  ]
};

let flashcardState = {
  list: [],
  idx: 0,
  flipped: false
};

function startFlashcards() {
  const k = S.kelas || 1;
  let cards = [...(FLASHCARDS_DATABASE[k] || [])];

  // Tambahkan soal dari bank soal lokal/cache untuk memperbanyak kartu
  const qList = (cache.q && cache.q[k]) ? cache.q[k] : [];
  qList.forEach(q => {
    cards.push({
      kategori: q.materi ? `📌 ${q.materi}` : '❓ Soal Kuis',
      topik: 'Soal & Pembahasan',
      depan: q.pertanyaan,
      belakang: `✅ Jawaban Benar:\n${q.opsi[q.jawaban]}\n\n${q.penjelasan ? '💡 Pembahasan:\n' + q.penjelasan : ''}`,
      gambar: q.gambarData || (q.gambarId ? `/_blob/${q.gambarId}` : null),
      audio: getQuestionAudioSrc(q)
    });
  });

  if (cards.length === 0) {
    alert('Belum ada materi kartu flashcard untuk kelas ini.');
    return;
  }

  flashcardState = {
    list: cards,
    idx: 0,
    flipped: false
  };

  go('s-flashcard');
}

function flipFlashcard() {
  flashcardState.flipped = !flashcardState.flipped;
  if (typeof playSfxTick === 'function') playSfxTick();
  const cardEl = document.getElementById('flashcardCard');
  if (cardEl) {
    if (flashcardState.flipped) {
      cardEl.classList.add('flipped');
    } else {
      cardEl.classList.remove('flipped');
    }
  }
}

function prevFlashcard() {
  if (flashcardState.idx > 0) {
    flashcardState.idx--;
    flashcardState.flipped = false;
    render();
  }
}

function nextFlashcard() {
  if (flashcardState.idx < flashcardState.list.length - 1) {
    flashcardState.idx++;
    flashcardState.flipped = false;
    render();
  }
}

function shuffleFlashcards() {
  flashcardState.list = flashcardState.list.sort(() => Math.random() - 0.5);
  flashcardState.idx = 0;
  flashcardState.flipped = false;
  render();
}

function sFlashcardView() {
  const info = KELAS[S.kelas || 1];
  const list = flashcardState.list || [];
  const item = list[flashcardState.idx];

  if (!item || list.length === 0) {
    return `
    <button class="back" onclick="go('s-materi')">&larr; Kembali ke Materi</button>
    <div class="card"><p class="empty">Tidak ada kartu hafalan.</p></div>`;
  }

  const isFlippedClass = flashcardState.flipped ? 'flipped' : '';

  return `
  <button class="back" onclick="go('s-materi')">&larr; Kembali ke Materi</button>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span class="badge ${info.badge}">${info.label}</span>
      <span class="badge badge-2" style="font-size:12px;">🎴 Flashcard Belajar</span>
    </div>
    <span style="font-size:13px;font-weight:700;color:var(--chalk-dim);">Kartu ${flashcardState.idx + 1} dari ${list.length}</span>
  </div>

  <!-- Perspective 3D Container -->
  <div class="flashcard-perspective">
    <div class="flashcard-card ${isFlippedClass}" id="flashcardCard" onclick="flipFlashcard()">
      
      <!-- SISI DEPAN (FRONT) -->
      <div class="flashcard-face flashcard-front">
        <div class="flashcard-header">
          <span class="flashcard-cat">${esc(item.kategori || 'Seni Budaya')}</span>
          <span class="flashcard-hint-badge">👆 Ketuk untuk Balik</span>
        </div>
        
        <div class="flashcard-body">
          ${item.topik ? `<div class="flashcard-topik">${esc(item.topik)}</div>` : ''}
          <div class="flashcard-question">${esc(item.depan)}</div>
          ${item.gambar ? `<img src="${item.gambar}" style="max-height:140px;border-radius:10px;margin-top:10px;object-fit:contain;">` : ''}
          ${item.audio ? `<audio controls src="${item.audio}" style="width:100%;margin-top:10px;" onclick="event.stopPropagation()"></audio>` : ''}
        </div>
      </div>

      <!-- SISI BELAKANG (BACK) -->
      <div class="flashcard-face flashcard-back">
        <div class="flashcard-header">
          <span class="flashcard-cat" style="color:var(--ok);">💡 Penjelasan & Jawaban</span>
          <span class="flashcard-hint-badge" style="background:rgba(127,201,127,0.2);color:var(--ok);">✓ Ketuk untuk Balik</span>
        </div>

        <div class="flashcard-body">
          <div class="flashcard-answer">${esc(item.belakang).replace(/\n/g, '<br>')}</div>
          ${item.tip ? `<div class="flashcard-tip">${esc(item.tip)}</div>` : ''}
        </div>
      </div>

    </div>
  </div>

  <!-- Navigasi & Acak Kartu Bar -->
  <div class="flashcard-controls">
    <button class="btn btn-ghost" onclick="prevFlashcard()" ${flashcardState.idx === 0 ? 'disabled' : ''}>
      &larr; Kartu Sebelumnya
    </button>
    <button class="btn btn-ghost btn-sm" onclick="shuffleFlashcards()" style="color:var(--k2);border-color:var(--k2);">
      🔀 Acak Urutan
    </button>
    <button class="btn btn-1" onclick="nextFlashcard()" ${flashcardState.idx === list.length - 1 ? 'disabled' : ''}>
      Kartu Berikutnya &rarr;
    </button>
  </div>`;
}


/* STUDENT: Kuis */
async function startQuiz() {
  const info = KELAS[S.kelas];
  document.getElementById('app').innerHTML = `<p class="empty">Memuat soal...</p>`;
  try {
    let fetchedFromSupabase = false;
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const sbQ = await sbFetchQuestions(S.kelas);
      if (sbQ !== null) {
        list = sbQ;
        fetchedFromSupabase = true;
      }
    }
    if (!fetchedFromSupabase) {
      if (db) {
        try {
          const snap = await db.collection('questions').where('kelas', '==', S.kelas).get();
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (err) {
          console.warn("DB fetch failed, using local fallback", err);
        }
      }
      if (!list || list.length === 0) {
        const localQ = getLocalQuestions();
        list = localQ.filter(q => Number(q.kelas) === Number(S.kelas));
      }
    }
    list = list.sort(() => Math.random() - 0.5).slice(0, 10);
    if (list.length === 0) {
      document.getElementById('app').innerHTML = `<p class="empty">Belum ada soal untuk kelas ini. Minta gurumu menambahkan soal dulu.</p><button class="btn btn-ghost" onclick="go('s-materi')">Kembali</button>`;
      return;
    }
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    quiz = { list, idx: 0, score: 0, answered: false, userAnswers: [] };
    go('s-quiz');
  } catch (e) {
    console.error("Quiz load error:", e);
    document.getElementById('app').innerHTML = `<p class="empty">Gagal memuat soal. Coba lagi.</p><button class="btn btn-ghost" onclick="go('s-materi')">Kembali</button>`;
  }
}

/* Helper untuk mendapatkan URL Audio dari Soal (baik direct base64, audioId, maupun audioLibId) */
function getQuestionAudioSrc(item) {
  if (!item) return null;
  if (item.audioData) return item.audioData;
  if (item.audio_data) return item.audio_data;
  const libId = item.audioLibId || item.audio_lib_id;
  if (libId) {
    const libItem = (cache.audioLib || []).find(a => String(a.id) === String(libId));
    if (libItem && libItem.audio_data) return libItem.audio_data;
  }
  if (item.audioId) return `/_blob/${item.audioId}`;
  return null;
}

function toggleSfxUI(btnEl) {
  if (typeof toggleSfxMute === 'function') {
    const isMuted = toggleSfxMute();
    if (btnEl) btnEl.textContent = isMuted ? '🔇 SFX Off' : '🔊 SFX On';
  }
}

/* STUDENT: Kuis */
async function startQuiz() {
  const info = KELAS[S.kelas];
  document.getElementById('app').innerHTML = `<p class="empty">Memuat soal...</p>`;
  try {
    // Pre-load audio library ke cache agar audio terhubung dengan audioLibId bisa diputar
    if (!cache.audioLib || cache.audioLib.length === 0) {
      if (typeof sbFetchAudioLibrary === 'function') {
        const lib = await sbFetchAudioLibrary();
        if (lib) cache.audioLib = lib;
        else if (typeof getLocalAudioLib === 'function') cache.audioLib = getLocalAudioLib();
      } else if (typeof getLocalAudioLib === 'function') {
        cache.audioLib = getLocalAudioLib();
      }
    }

    let fetchedFromSupabase = false;
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const sbQ = await sbFetchQuestions(S.kelas);
      if (sbQ !== null) {
        list = sbQ;
        fetchedFromSupabase = true;
      }
    }
    if (!fetchedFromSupabase) {
      if (db) {
        try {
          const snap = await db.collection('questions').where('kelas', '==', S.kelas).get();
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (err) {
          console.warn("DB fetch failed, using local fallback", err);
        }
      }
      if (!list || list.length === 0) {
        const localQ = getLocalQuestions();
        list = localQ.filter(q => Number(q.kelas) === Number(S.kelas));
      }
    }
    list = list.sort(() => Math.random() - 0.5).slice(0, 10);
    if (list.length === 0) {
      document.getElementById('app').innerHTML = `<p class="empty">Belum ada soal untuk kelas ini. Minta gurumu menambahkan soal dulu.</p><button class="btn btn-ghost" onclick="go('s-materi')">Kembali</button>`;
      return;
    }
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    quiz = { list, idx: 0, score: 0, answered: false, userAnswers: [] };
    go('s-quiz');
  } catch (e) {
    console.error("Quiz load error:", e);
    document.getElementById('app').innerHTML = `<p class="empty">Gagal memuat soal. Coba lagi.</p><button class="btn btn-ghost" onclick="go('s-materi')">Kembali</button>`;
  }
}

function sQuizView() {
  const info = KELAS[S.kelas];
  const item = quiz.list[quiz.idx];
  const pct = Math.round((quiz.idx) / quiz.list.length * 100);
  const maxSec = (typeof item.waktu !== 'undefined' && item.waktu !== null) ? item.waktu : 30;

  if (quizTimerInterval) clearInterval(quizTimerInterval);

  let media = '';
  const gSrc = item.gambarData || (item.gambarId ? `/_blob/${item.gambarId}` : null);
  const aSrc = getQuestionAudioSrc(item);
  if (gSrc) media += `<img class="q-media" src="${gSrc}">`;
  if (aSrc) media += `<audio class="q-media" controls src="${aSrc}" style="width:100%;margin-top:10px;"></audio>`;

  let timerHtml = '';
  if (maxSec > 0) {
    quizTimerSec = maxSec;
    timerHtml = `<div class="timer-badge" id="qTimerBadge">⏱️ <span id="qTimerVal">${maxSec}</span>s</div>`;

    setTimeout(() => {
      if (quizTimerInterval) clearInterval(quizTimerInterval);
      quizTimerInterval = setInterval(() => {
        if (currentView !== 's-quiz' || quiz.answered) {
          clearInterval(quizTimerInterval);
          return;
        }
        quizTimerSec--;
        const valEl = document.getElementById('qTimerVal');
        const badgeEl = document.getElementById('qTimerBadge');
        if (valEl) valEl.textContent = quizTimerSec;
        if (quizTimerSec <= 5 && badgeEl) {
          badgeEl.classList.add('urgent');
          if (typeof playSfxTick === 'function') playSfxTick();
        }
        if (quizTimerSec <= 0) {
          clearInterval(quizTimerInterval);
          answerQuiz(-1);
        }
      }, 1000);
    }, 50);
  }

  const sfxLabel = (typeof isSfxMuted === 'function' && isSfxMuted()) ? '🔇 SFX Off' : '🔊 SFX On';

  return `
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span class="badge ${info.badge}">${info.label}</span>
      <button class="btn btn-ghost btn-sm" onclick="toggleSfxUI(this)" style="padding:2px 8px;font-size:12px;">${sfxLabel}</button>
    </div>
    ${timerHtml}
  </div>
  <div class="progress" style="margin-top:10px;"><i style="width:${pct}%;background:var(${info.accent});"></i></div>
  <p class="sub" style="margin-bottom:6px;">Soal ${quiz.idx + 1} dari ${quiz.list.length}${item.materi ? ' · ' + esc(item.materi) : ''}</p>
  <p class="q-text">${esc(item.pertanyaan)}</p>
  ${media}
  <div id="optsWrap">${item.opsi.map((o, i) => `<button class="opt" onclick="answerQuiz(${i})">${esc(o)}</button>`).join('')}</div>`;
}

function answerQuiz(i) {
  if (quizTimerInterval) clearInterval(quizTimerInterval);
  if (quiz.answered) return;
  quiz.answered = true;
  const item = quiz.list[quiz.idx];
  const opts = document.querySelectorAll('#optsWrap .opt');
  opts.forEach(o => o.disabled = true);

  if (!quiz.userAnswers) quiz.userAnswers = [];
  quiz.userAnswers.push({
    question: item,
    selected: i,
    isCorrect: i === item.jawaban
  });

  if (i === -1) {
    if (typeof playSfxWrong === 'function') playSfxWrong();
    const wrap = document.getElementById('optsWrap');
    if (wrap) {
      const timeoutMsg = document.createElement('p');
      timeoutMsg.className = 'hint';
      timeoutMsg.style.color = 'var(--bad)';
      timeoutMsg.style.fontWeight = 'bold';
      timeoutMsg.style.marginBottom = '8px';
      timeoutMsg.textContent = '⏰ Waktu menjawab habis!';
      wrap.prepend(timeoutMsg);
    }
  } else if (i === item.jawaban) {
    if (typeof playSfxCorrect === 'function') playSfxCorrect();
  } else {
    if (typeof playSfxWrong === 'function') playSfxWrong();
  }

  opts[item.jawaban].classList.add('correct');
  if (i >= 0 && i !== item.jawaban) {
    opts[i].classList.add('wrong');
  } else if (i === item.jawaban) {
    quiz.score++;
  }

  setTimeout(() => {
    quiz.idx++;
    quiz.answered = false;
    if (quiz.idx >= quiz.list.length) {
      finishQuiz();
    } else {
      render();
    }
  }, 1200);
}

async function finishQuiz() {
  if (quizTimerInterval) clearInterval(quizTimerInterval);
  currentView = 's-result';
  render();
  if (typeof triggerConfetti === 'function') triggerConfetti();
  if (typeof playSfxFanfare === 'function') playSfxFanfare();
  const resultObj = {
    nama: S.name,
    kelas: S.kelas,
    skor: quiz.score,
    total: quiz.list.length,
    waktu: Date.now()
  };
  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      await sbSaveResult(resultObj);
    } else if (db) {
      await db.collection('results').add(resultObj);
    } else {
      saveLocalResult(resultObj);
    }
    window.dispatchEvent(new CustomEvent('sanggar_result_updated', { detail: resultObj }));
  } catch (e) {
    saveLocalResult(resultObj);
    window.dispatchEvent(new CustomEvent('sanggar_result_updated', { detail: resultObj }));
  }
}

function sResultView() {
  const info = KELAS[S.kelas];
  const pct = Math.round(quiz.score / quiz.list.length * 100);

  let starCount = 1;
  let msg = 'Yuk pelajari lagi materinya!';
  let mascotLeft = 'Semangat!';
  let mascotRight = 'Ayo Coba Lagi! 💪';
  let badgeStyle = 'background: rgba(224, 101, 101, 0.2); color: var(--bad);';

  if (pct >= 80) {
    starCount = 3;
    msg = 'Keren Banget! Sempurna! 🎉';
    mascotLeft = 'Luar Biasa! 🌟';
    mascotRight = 'Kamu Hebat! 🏆';
    badgeStyle = 'background: rgba(127, 201, 127, 0.25); color: var(--ok);';
  } else if (pct >= 60) {
    starCount = 2;
    msg = 'Bagus! Terus Tingkatkan! 👍';
    mascotLeft = 'Kerja Bagus! ✨';
    mascotRight = 'Makin Pintar! 📚';
    badgeStyle = 'background: rgba(247, 187, 67, 0.25); color: #f7bb43;';
  }

  // Trigger Score count up animation after view renders
  setTimeout(() => {
    const el = document.getElementById('resultScoreVal');
    if (!el) return;
    let current = 0;
    const target = quiz.score;
    const total = quiz.list.length;
    if (target === 0) {
      el.textContent = `0/${total}`;
      return;
    }
    const stepTime = Math.max(40, Math.floor(800 / target));
    const timer = setInterval(() => {
      current++;
      el.textContent = `${current}/${total}`;
      if (current >= target) {
        clearInterval(timer);
      }
    }, stepTime);
  }, 60);

  return `
  <div class="result-celebration-container">
    <div class="mascot-cheer cheer-left">
      <img src="assets/boy_student.png" alt="Siswa SMP">
      <div class="speech-bubble">${mascotLeft}</div>
    </div>

    <div class="card result-hero result-hero-animated" style="flex:1;">
      <span class="badge ${info.badge}">${info.label}</span>
      
      <div class="result-stars">
        <span class="star star-1 ${starCount >= 1 ? 'active' : ''}">⭐</span>
        <span class="star star-2 ${starCount >= 2 ? 'active' : ''}">⭐</span>
        <span class="star star-3 ${starCount >= 3 ? 'active' : ''}">⭐</span>
      </div>

      <div class="score" id="resultScoreVal">0/${quiz.list.length}</div>
      <p class="pct">${pct}% Benar</p>
      
      <div class="encouragement-tag" style="${badgeStyle}">
        ${msg}
      </div>
    </div>

    <div class="mascot-cheer cheer-right">
      <img src="assets/girl_student.png" alt="Siswi SMP">
      <div class="speech-bubble">${mascotRight}</div>
    </div>
  </div>

  <div class="row" style="flex-direction:column;gap:10px;margin-top:14px;">
    <button class="btn btn-block" style="background:var(--ok);color:#1c1c1c;font-weight:800;font-size:15px;padding:14px;" onclick="go('s-pembahasan')">💡 Lihat Pembahasan & Kunci Jawaban</button>
    <div class="row" style="gap:10px;">
      <button class="btn" style="background:var(${info.accent});color:#1c1c1c;flex:1;" onclick="startQuiz()">Ulangi Kuis</button>
      <button class="btn btn-ghost" style="flex:1;" onclick="go('s-materi')">Kembali ke Materi</button>
      <button class="btn btn-ghost" style="flex:1;" onclick="openRiwayat()">Lihat Riwayat</button>
    </div>
  </div>`;
}

function sPembahasanView() {
  const info = KELAS[S.kelas];
  const answers = (quiz && quiz.userAnswers) ? quiz.userAnswers : [];
  return `
  <button class="back" onclick="go('s-result')">&larr; Kembali ke Hasil Kuis</button>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
    <h2>💡 Pembahasan & Kunci Jawaban</h2>
    <span class="badge ${info.badge}">${info.label}</span>
  </div>
  <p class="sub">Pelajari jawabanmu untuk memahami materi lebih dalam.</p>
  <div style="display:flex;flex-direction:column;gap:16px;margin-top:16px;">
    ${answers.length === 0 ? `<div class="card"><p class="empty">Tidak ada data pembahasan.</p></div>` : answers.map((ans, idx) => {
    const q = ans.question;
    const isCorrect = ans.isCorrect;
    const gSrc = q.gambarData || (q.gambarId ? `/_blob/${q.gambarId}` : null);
    const aSrc = getQuestionAudioSrc(q);

    return `
      <div class="card" style="border-left: 6px solid ${isCorrect ? 'var(--ok)' : 'var(--bad)'}; position: relative;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span class="badge" style="background:${isCorrect ? 'var(--ok)' : 'var(--bad)'};color:#fff;font-weight:700;">
            ${isCorrect ? '✓ Benar' : '✕ Salah'}
          </span>
          <span style="font-size:13px;color:var(--text-sub);font-weight:600;">Soal ${idx + 1} dari ${answers.length}</span>
        </div>
        <p style="font-weight:700;font-size:16px;margin-bottom:10px;line-height:1.4;color:var(--text);">${esc(q.pertanyaan)}</p>
        ${gSrc ? `<img class="q-media" src="${gSrc}" style="max-height:160px;margin-bottom:10px;">` : ''}
        ${aSrc ? `<audio class="q-media" controls src="${aSrc}" style="width:100%;margin-bottom:10px;"></audio>` : ''}
        
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
          ${q.opsi.map((opt, optIdx) => {
      let bg = 'var(--surface-hover)';
      let border = '1px solid var(--border)';
      let icon = '';
      if (optIdx === q.jawaban) {
        bg = 'rgba(79, 182, 168, 0.18)';
        border = '2px solid var(--ok)';
        icon = ' <b style="color:var(--ok);">✓ Jawaban Benar</b>';
      }
      if (optIdx === ans.selected && optIdx !== q.jawaban) {
        bg = 'rgba(232, 135, 74, 0.18)';
        border = '2px solid var(--bad)';
        icon = ' <b style="color:var(--bad);">✕ Jawaban Anda</b>';
      } else if (optIdx === ans.selected && optIdx === q.jawaban) {
        icon = ' <b style="color:var(--ok);">✓ Jawaban Anda (Benar)</b>';
      }
      return `<div style="padding:10px 14px;border-radius:8px;background:${bg};border:${border};font-size:14px;font-weight:600;display:flex;justify-content:space-between;align-items:center;">
              <span><b>${String.fromCharCode(65 + optIdx)}.</b> ${esc(opt)}</span>
              <span style="font-size:13px;">${icon}</span>
            </div>`;
    }).join('')}
        </div>

        ${q.penjelasan ? `
        <div style="background:var(--bg);padding:14px;border-radius:8px;border:1px dashed var(--accent);margin-top:10px;">
          <p style="margin:0;font-weight:700;color:var(--accent);font-size:14px;display:flex;align-items:center;gap:6px;">
            💡 Pembahasan & Alasan:
          </p>
          <p style="margin:6px 0 0 0;font-size:14px;line-height:1.5;color:var(--text);">${esc(q.penjelasan)}</p>
        </div>
        ` : ''}
      </div>`;
  }).join('')}
  </div>
  <div class="row" style="margin-top:20px;">
    <button class="btn" style="background:var(${info.accent});color:#1c1c1c;" onclick="startQuiz()">Ulangi Kuis</button>
    <button class="btn btn-ghost" onclick="go('s-materi')">Kembali ke Materi</button>
  </div>`;
}

/* STUDENT: Riwayat Nilai */
async function openRiwayat() {
  document.getElementById('app').innerHTML = `<p class="empty">Memuat riwayat...</p>`;
  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const res = await sbFetchResults(S.name);
      if (res) {
        cache.myResults = res.map(r => ({
          kelas: r.kelas,
          skor: r.skor,
          total: r.total_soal,
          waktu: r.created_at ? new Date(r.created_at).getTime() : Date.now()
        }));
      } else {
        cache.myResults = getLocalResults(S.name);
      }
    } else if (db) {
      const snap = await db.collection('results').where('nama', '==', S.name).orderBy('waktu', 'desc').limit(20).get();
      cache.myResults = snap.docs.map(d => d.data());
    } else {
      cache.myResults = getLocalResults(S.name);
    }
  } catch (e) {
    cache.myResults = getLocalResults(S.name);
  }
  go('s-riwayat');
}

function sRiwayatView() {
  const rows = cache.myResults || [];
  return `
  <button class="back" onclick="go('s-materi')">&larr; Kembali</button>
  <h2>Riwayat Nilai — ${esc(S.name)}</h2>
  <div class="card">
    ${rows.length === 0 ? `<p class="empty">Belum ada riwayat kuis.</p>` : `
    <table>
      <thead>
        <tr><th>Kelas</th><th>Skor</th><th>Waktu</th></tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${KELAS[r.kelas] ? KELAS[r.kelas].label.split(' · ')[0] : r.kelas}</td>
            <td>${r.skor}/${r.total}</td>
            <td>${new Date(r.waktu).toLocaleString('id-ID')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`}
  </div>`;
}
