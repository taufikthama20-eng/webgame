/* ---------------- App Shell & Router ---------------- */

let currentView = 'home';

function homeView() {
  return `
  <div class="hero-container">
    <div class="hero-doodles">
      <span class="doodle doodle-palette">🎨</span>
      <span class="doodle doodle-note1">🎵</span>
      <span class="doodle doodle-note2">🎶</span>
      <span class="doodle doodle-brush">🖌️</span>
    </div>

    <div class="hero-char hero-char-left">
      <img src="assets/boy_student.png" alt="Siswa SMP">
    </div>

    <div class="hero-main">
      <h1 class="hero-title">
        Sanggar <span class="accent-budaya">Budaya</span><span class="sparkles">✨</span>
      </h1>
      <p class="hero-subtitle">Belajar Seni Rupa &amp; Seni Musik lewat kuis interaktif untuk siswa SMP kelas 1–3.</p>

      <div class="hero-card">
        <h2 class="hero-card-title">Ayo mulai belajar</h2>
        <p class="hero-card-sub">Pilih peranmu untuk melanjutkan.</p>
        <div class="hero-actions">
          <button class="btn-siswa-hero" onclick="triggerStudentPortal(event)">
            <span>🎓</span> Mulai sebagai Siswa <span>&rarr;</span>
          </button>
          <button class="btn-guru-hero" onclick="go('t-login')">
            <span>👥</span> Login Guru <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>

    <div class="hero-char hero-char-right">
      <img src="assets/girl_student.png" alt="Siswi SMP">
    </div>
  </div>`;
}

function triggerStudentPortal(e) {
  const btnEl = e ? e.currentTarget : null;
  if (typeof playStudentPortalSequence === 'function') {
    playStudentPortalSequence(btnEl, () => {
      go('s-name');
    });
  } else {
    if (typeof playSfxPop === 'function') playSfxPop();
    go('s-name');
  }
}

const views = {
  'home': homeView,
  's-name': sNameView,
  's-materi': sMateriView,
  's-flashcard': sFlashcardView,
  's-quiz': sQuizView,
  's-result': sResultView,
  's-pembahasan': sPembahasanView,
  's-riwayat': sRiwayatView,
  's-leaderboard': typeof renderLeaderboardView === 'function' ? renderLeaderboardView : sNameView,
  't-login': tLoginView,
  't-dash': tDashView,
  't-form': tFormView,
  't-hasil': tHasilView,
  't-audio': tAudioLibView
};

function render() {
  const appEl = document.getElementById('app');
  if (!appEl) return;
  const viewFn = views[currentView];
  appEl.innerHTML = viewFn ? viewFn() : '';
}

function go(v) {
  currentView = v;
  render();
  window.scrollTo(0, 0);
}

/* Inisialisasi saat Halaman Dimuat */
document.addEventListener('DOMContentLoaded', () => {
  initCaps();
});
