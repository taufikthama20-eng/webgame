/* ==========================================
   STUDENT LEADERBOARD ENGINE MODULE
   Papan Peringkat Siswa per Kelas
   ========================================== */

let activeLeaderboardTab = 1;

/**
 * Mendapatkan data papan peringkat untuk kelas tertentu dari LocalStorage
 */
function getLeaderboardData(kls) {
  try {
    let list = [];

    // 1. Ambil data hasil kuis online (Supabase / Shared Cache) jika tersedia
    if (cache && Array.isArray(cache.r) && cache.r.length > 0) {
      const classResults = cache.r.filter(r => Number(r.kelas) === Number(kls));
      classResults.forEach(r => {
        list.push({
          id: 'sb_' + (r.waktu || Date.now()) + '_' + Math.random(),
          name: r.nama,
          score: r.skor,
          total: r.total,
          percentage: r.total > 0 ? Math.round((r.skor / r.total) * 100) : 0,
          timeSpent: r.durasi_detik || 60,
          badges: r.skor === r.total ? ['⭐', '🎯', '⚡'] : ['⭐'],
          date: r.waktu ? new Date(r.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Hari ini'
        });
      });
    }

    // 2. Ambil dari LocalStorage sebagai tambahan / fallback
    const raw = localStorage.getItem(`sanggar_leaderboard_k${kls}`);
    if (raw) {
      const localData = JSON.parse(raw);
      if (Array.isArray(localData)) {
        localData.forEach(item => {
          if (!list.some(existing => existing.name === item.name && existing.score === item.score)) {
            list.push(item);
          }
        });
      }
    }

    // Bersihkan data dummy/sampel lama yang tersimpan di localStorage
    const sampleNames = [
      'Siti Amara', 'Budi Santoso', 'Rani Permata',
      'Dewi Lestari', 'Fajar Ramadhan', 'Maya Putri',
      'Rizky Pratama', 'Anisa Rahma', 'Dimas Anggara',
      'Siswa Sanggar 1', 'Siswa Sanggar 2', 'Siswa Sanggar 3'
    ];
    const cleaned = list.filter(item => {
      if (item.id && String(item.id).startsWith('sample_')) return false;
      if (sampleNames.includes(item.name)) return false;
      return true;
    });

    // Sortir: Skor tertinggi -> Waktu tercepat -> Terbaru (Top 10 Saja)
    return cleaned.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.timeSpent || 999) - (b.timeSpent || 999);
    }).slice(0, 10);
  } catch (e) {
    console.warn("Leaderboard error:", e);
    return [];
  }
}

/**
 * Menyimpan nilai siswa ke Papan Peringkat Kelas
 */
function saveLeaderboardScore(kls, name, score, total, timeSpentSec = 60, badges = []) {
  if (!name || !kls) return;

  try {
    const currentData = getLeaderboardData(kls);
    const newEntry = {
      id: 'score_' + Date.now(),
      name: name,
      score: score,
      total: total,
      percentage: Math.round((score / total) * 100),
      timeSpent: timeSpentSec,
      badges: badges || [],
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    };

    currentData.push(newEntry);

    // Sortir & simpan Top 10 Peringkat Tertinggi
    const sorted = currentData.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.timeSpent || 999) - (b.timeSpent || 999);
    }).slice(0, 10);

    localStorage.setItem(`sanggar_leaderboard_k${kls}`, JSON.stringify(sorted));
  } catch (e) {
    console.warn("Save leaderboard error:", e);
  }
}

/**
 * Load data Papan Peringkat secara online dari Supabase
 */
async function syncLeaderboardSupabase() {
  if (typeof supabaseClient !== 'undefined' && supabaseClient && typeof sbFetchResults === 'function') {
    const sbR = await sbFetchResults();
    if (sbR) {
      cache.r = sbR.map(r => ({
        nama: r.nama,
        kelas: r.kelas,
        skor: r.skor,
        total: r.total_soal,
        waktu: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
        durasi_detik: r.durasi_detik || 60
      }));
      const container = document.getElementById('leaderboardContentArea');
      if (container && currentView === 's-leaderboard') {
        container.innerHTML = renderLeaderboardListHTML(activeLeaderboardTab);
      }
    }
  }
}

/**
 * Format detik ke menit dan detik (contoh: 1m 25s)
 */
function formatTimeSpent(seconds) {
  if (!seconds || seconds <= 0) return '1m 15s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * Ganti tab kelas papan peringkat secara in-place
 */
function selectLeaderboardTab(kls) {
  activeLeaderboardTab = kls;
  const container = document.getElementById('leaderboardContentArea');
  if (container) {
    container.innerHTML = renderLeaderboardListHTML(kls);
  }

  [1, 2, 3].forEach(id => {
    const tabEl = document.getElementById(`tab_k${id}`);
    if (tabEl) {
      tabEl.className = `leaderboard-tab ${id == kls ? 'active-k' + id : ''}`;
    }
  });
}

/**
 * Render Tampilan Utama Halaman Papan Peringkat Kelas
 */
function renderLeaderboardView() {
  const k = activeLeaderboardTab || S.kelas || 1;
  activeLeaderboardTab = k;

  // Trigger sync Supabase secara asynchronous
  syncLeaderboardSupabase();

  return `
  <button class="back" onclick="go('home')">&larr; Kembali</button>
  <h2>🏆 Papan Peringkat Siswa</h2>
  <p class="sub">Lihat daftar nilai kuis dan siswa berprestasi terbaik di Sanggar Budaya.</p>

  <div class="leaderboard-container">
    
    <!-- Tab Selector Kelas 1, 2, 3 -->
    <div class="leaderboard-tabs">
      <div class="leaderboard-tab ${k == 1 ? 'active-k1' : ''}" id="tab_k1" onclick="selectLeaderboardTab(1)">
        Kelas 1 (SMP 7)
      </div>
      <div class="leaderboard-tab ${k == 2 ? 'active-k2' : ''}" id="tab_k2" onclick="selectLeaderboardTab(2)">
        Kelas 2 (SMP 8)
      </div>
      <div class="leaderboard-tab ${k == 3 ? 'active-k3' : ''}" id="tab_k3" onclick="selectLeaderboardTab(3)">
        Kelas 3 (SMP 9)
      </div>
    </div>

    <!-- Area Konten Daftar Peringkat -->
    <div id="leaderboardContentArea">
      ${renderLeaderboardListHTML(k)}
    </div>

  </div>`;
}

/**
 * Render HTML Daftar Kartu Peringkat per Kelas
 */
function renderLeaderboardListHTML(kls) {
  const list = getLeaderboardData(kls);
  if (!list || list.length === 0) {
    return `
      <div class="leaderboard-empty">
        <span style="font-size:36px;display:block;margin-bottom:8px;">🎓</span>
        <b>Belum ada nilai terdaftar untuk ${KELAS[kls] ? KELAS[kls].label : 'Kelas ' + kls}.</b>
        <p style="font-size:13px;margin-top:4px;">Jadilah siswa pertama yang menyelesaikan kuis dan raih Peringkat 1!</p>
      </div>
    `;
  }

  const medals = ['🥇', '🥈', '🥉'];

  return `
    <div class="rank-list">
      ${list.map((item, index) => {
    const rankNum = index + 1;
    const rankClass = rankNum <= 3 ? `rank-${rankNum}` : '';
    const badgeIcon = rankNum <= 3 ? medals[index] : `${rankNum}`;
    const badgesEarned = Array.isArray(item.badges) ? item.badges.join(' ') : '⭐';

    return `
          <div class="rank-card ${rankClass}">
            <div class="rank-badge">${badgeIcon}</div>
            <div class="rank-info">
              <div class="rank-name">
                <span>${esc(item.name)}</span>
                <span style="font-size:13px;">${badgesEarned}</span>
              </div>
              <div class="rank-meta">
                <span>⏱️ ${formatTimeSpent(item.timeSpent)}</span>
                <span>📅 ${item.date || 'Hari ini'}</span>
              </div>
            </div>
            <div class="rank-score-pill">
              ${item.score}/${item.total} (${item.percentage || Math.round((item.score / item.total) * 100)}%)
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}
