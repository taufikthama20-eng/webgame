/* ---------------- App Shell & Router ---------------- */

let currentView = 'home';

function homeView() {
    return `
  <h1>Sanggar Budaya</h1>
  <p class="sub">Belajar Seni Rupa &amp; Seni Musik lewat kuis interaktif untuk siswa SMP kelas 1–3.</p>
  <div class="card">
    <h2>Ayo mulai belajar</h2>
    <p class="sub">Pilih peranmu untuk melanjutkan.</p>
    <div class="row">
      <button class="btn btn-1" onclick="go('s-name')">Mulai sebagai Siswa</button>
      <button class="btn btn-ghost" onclick="go('t-login')">Login Guru</button>
    </div>
  </div>`;
}

const views = {
    'home': homeView,
    's-name': sNameView,
    's-kelas': sKelasView,
    's-materi': sMateriView,
    's-quiz': sQuizView,
    's-result': sResultView,
    's-riwayat': sRiwayatView,
    't-login': tLoginView,
    't-dash': tDashView,
    't-form': tFormView,
    't-hasil': tHasilView
};

function render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;
    const viewFn = views[S.role === '__view' ? S.role : currentView];
    appEl.innerHTML = viewFn ? viewFn() : '';
    attachHandlers();
}

function go(v) {
    currentView = v;
    render();
    window.scrollTo(0, 0);
}

function attachHandlers() {
    // Tempat handler event tambahan jika diperlukan
}

/* Inisialisasi saat Halaman Dimuat */
document.addEventListener('DOMContentLoaded', () => {
    initCaps();
});
