/* ---------------- Teacher Views & Logic ---------------- */

/* TEACHER: Login */
function tLoginView() {
  return `
  <button class="back" onclick="go('home')">&larr; Kembali</button>
  <h2>Login Guru</h2>
  <p class="sub">Masukkan kode akses guru untuk mengelola soal.</p>
  <div class="card">
    <label class="field">Kode akses</label>
    <input type="password" id="inpPass" placeholder="Kode guru">
    <button class="btn btn-3 btn-block" onclick="teacherLogin()">Masuk</button>
  </div>`;
}

function teacherLogin() {
  const v = document.getElementById('inpPass').value;
  if (v !== '' && v !== 'bundafera') {
    alert('Kode salah.');
    return;
  }
  S.role = 'teacher';
  loadTeacherData();
  go('t-dash');
}

let teacherPollTimer = null;
let sbResultsSub = null;

function startTeacherAutoRefresh() {
  if (teacherPollTimer) clearInterval(teacherPollTimer);
  // Auto polling setiap 4 detik untuk update realtime tanpa reload
  teacherPollTimer = setInterval(async () => {
    if (currentView === 't-dash' || currentView === 't-hasil') {
      await silentRefreshResults();
    } else {
      clearInterval(teacherPollTimer);
      teacherPollTimer = null;
    }
  }, 4000);

  if (typeof supabaseClient !== 'undefined' && supabaseClient && !sbResultsSub && typeof sbSubscribeResults === 'function') {
    sbResultsSub = sbSubscribeResults(async () => {
      await silentRefreshResults();
    });
  }
}

async function silentRefreshResults() {
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    const sbR = await sbFetchResults();
    if (sbR) {
      const formatted = sbR.map(r => ({
        nama: r.nama,
        kelas: r.kelas,
        skor: r.skor,
        total: r.total_soal,
        waktu: r.created_at ? new Date(r.created_at).getTime() : Date.now()
      }));
      if (JSON.stringify(formatted) !== JSON.stringify(cache.r)) {
        cache.r = formatted;
        if (currentView === 't-dash' || currentView === 't-hasil') {
          render();
        }
      }
    }
  } else if (!db) {
    const localR = getLocalResults();
    if (JSON.stringify(localR) !== JSON.stringify(cache.r)) {
      cache.r = localR;
      if (currentView === 't-dash' || currentView === 't-hasil') {
        render();
      }
    }
  }
}

window.addEventListener('sanggar_result_updated', () => {
  if (currentView === 't-dash' || currentView === 't-hasil') {
    silentRefreshResults();
  }
});

async function loadTeacherData() {
  startTeacherAutoRefresh();
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    const sbQ = await sbFetchQuestions();
    const sbR = await sbFetchResults();
    if (sbQ) {
      cache.q = {
        1: sbQ.filter(q => Number(q.kelas) === 1),
        2: sbQ.filter(q => Number(q.kelas) === 2),
        3: sbQ.filter(q => Number(q.kelas) === 3)
      };
    }
    if (sbR) {
      cache.r = sbR.map(r => ({
        nama: r.nama,
        kelas: r.kelas,
        skor: r.skor,
        total: r.total_soal,
        waktu: r.created_at ? new Date(r.created_at).getTime() : Date.now()
      }));
    }
    if (currentView === 't-dash' || currentView === 't-hasil') render();
    return;
  }
  if (db) {
    if (unsubQ) unsubQ();
    unsubQ = db.collection('questions').onSnapshot(snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cache.q = {
        1: all.filter(q => q.kelas === 1),
        2: all.filter(q => q.kelas === 2),
        3: all.filter(q => q.kelas === 3)
      };
      if (currentView === 't-dash') render();
    });

    if (unsubR) unsubR();
    unsubR = db.collection('results').orderBy('waktu', 'desc').limit(100).onSnapshot(snap => {
      cache.r = snap.docs.map(d => d.data());
      if (currentView === 't-hasil') render();
    });
  } else {
    const all = getLocalQuestions();
    cache.q = {
      1: all.filter(q => q.kelas === 1),
      2: all.filter(q => q.kelas === 2),
      3: all.filter(q => q.kelas === 3)
    };
    cache.r = getLocalResults();
    if (currentView === 't-dash' || currentView === 't-hasil') render();
  }
}

/* TEACHER: Dashboard */
function tDashView() {
  const total = cache.q[1].length + cache.q[2].length + cache.q[3].length;
  const list = cache.q[teacherKelasTab] || [];
  const currentRingkasan = getMateriRingkasan(teacherKelasTab);
  return `
  <div class="row" style="justify-content:space-between;align-items:center;">
    <h2>Dashboard Ibu NurFerawati</h2>
    <button class="btn btn-ghost btn-sm" onclick="S.role=null;go('home')">Keluar</button>
  </div>
  <div class="stat-grid">
    <div class="stat stat-card-total"><b>${total}</b><span>Total Soal</span></div>
    <div class="stat stat-card-k1"><b>${cache.q[1].length}</b><span>Kelas 1</span></div>
    <div class="stat stat-card-k2"><b>${cache.q[2].length}</b><span>Kelas 2</span></div>
    <div class="stat stat-card-k3"><b>${cache.q[3].length}</b><span>Kelas 3</span></div>
  </div>
  <div class="row">
    <button class="btn btn-3" onclick="openForm(null)">+ Tambah Soal</button>
    <button class="btn btn-ghost" onclick="go('t-hasil')">Lihat Nilai Siswa</button>
  </div>
  <div class="tabbar" style="margin-top:18px;">
    ${[1, 2, 3].map(k => `<button class="${teacherKelasTab == k ? 'on' : ''}" onclick="teacherKelasTab=${k};render()">${KELAS[k].label}</button>`).join('')}
  </div>

  <!-- Edit Materi Hari Ini -->
  <div class="card card-accent-k${teacherKelasTab}" style="margin-bottom:16px;">
    <label class="field" style="font-weight:700;"> Materi Hari Ini (${KELAS[teacherKelasTab].label})</label>
    <textarea id="inpMateriRingkasan" style="min-height:60px;" placeholder="Tulis deskripsi ringkasan materi untuk kelas ini...">${esc(currentRingkasan)}</textarea>
    <div class="row" style="margin-top:8px;">
      <button class="btn btn-2 btn-sm" onclick="saveMateri(${teacherKelasTab})">Simpan Materi</button>
      <span id="materiSaveMsg" class="hint" style="align-self:center;color:var(--ok);font-weight:bold;display:none;">Tersimpan ✓</span>
    </div>
  </div>

  <div class="card card-accent-k${teacherKelasTab}">
    ${list.length === 0 ? `<p class="empty">Belum ada soal di kelas ini.</p>` : list.map(q => `
    <div class="qlist-item">
      <div>
        <div class="qtxt">${esc(q.pertanyaan)}</div>
        <div class="qmeta">${q.materi ? esc(q.materi) + ' · ' : ''}${q.gambarId ? '📷 gambar · ' : ''}${q.audioId ? '🎵 audio · ' : ''}jawaban: ${esc(q.opsi[q.jawaban] || '')}</div>
      </div>
      <div class="qlist-actions">
        <button class="btn btn-ghost btn-sm" onclick="openForm('${q.id}')">Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteQuestion('${q.id}')">Hapus</button>
      </div>
    </div>`).join('')}
  </div>`;
}

async function saveMateri(k) {
  const val = document.getElementById('inpMateriRingkasan').value.trim();
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    await sbSaveMateri(k, val);
  }
  saveMateriRingkasan(k, val);
  const msg = document.getElementById('materiSaveMsg');
  if (msg) {
    msg.style.display = 'inline';
    setTimeout(() => { msg.style.display = 'none'; }, 2000);
  }
}

async function deleteQuestion(id) {
  if (!confirm('Hapus soal ini?')) return;
  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      await sbDeleteQuestion(id);
      await loadTeacherData();
    } else if (db) {
      await db.collection('questions').doc(id).delete();
    } else {
      deleteLocalQuestion(id);
      loadTeacherData();
    }
  } catch (e) {
    alert('Gagal menghapus.');
  }
}

/* TEACHER: Form Tambah/Edit Soal */
function openForm(id) {
  editId = id;
  go('t-form');
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

function tFormView() {
  const editing = editId ? cache.q[teacherKelasTab].find(q => q.id === editId) || [1, 2, 3].map(k => cache.q[k]).flat().find(q => q.id === editId) : null;
  const d = editing || { kelas: teacherKelasTab, materi: '', pertanyaan: '', opsi: ['', '', '', ''], jawaban: 0, gambarData: null, gambarId: null, audioData: null, audioId: null };
  const gPreview = d.gambarData || (d.gambarId ? `/_blob/${d.gambarId}` : null);
  const aPreview = d.audioData || (d.audioId ? `/_blob/${d.audioId}` : null);

  return `
  <button class="back" onclick="go('t-dash')">&larr; Kembali</button>
  <h2>${editing ? 'Edit Soal' : 'Tambah Soal'}</h2>
  <div class="card">
    <label class="field">Kelas</label>
    <select id="fKelas">${[1, 2, 3].map(k => `<option value="${k}" ${d.kelas == k ? 'selected' : ''}>${KELAS[k].label}</option>`).join('')}</select>

    <label class="field">Materi / kategori</label>
    <input type="text" id="fMateri" value="${esc(d.materi || '')}" placeholder="Contoh: Unsur Gambar">

    <label class="field">Pertanyaan</label>
    <textarea id="fPertanyaan" placeholder="Tulis pertanyaan...">${esc(d.pertanyaan || '')}</textarea>

    <label class="field">Waktu Menjawab (Detik)</label>
    <input type="number" id="fWaktu" value="${typeof d.waktu !== 'undefined' && d.waktu !== null ? d.waktu : 30}" min="0" max="300" placeholder="Contoh: 30 (Isi 0 untuk tanpa batas waktu)">
    <p class="hint">Batas waktu untuk menjawab soal ini dalam detik. Isi 0 jika tidak ingin memakai batas waktu.</p>

    <label class="field">Gambar (opsional, untuk tebak gambar/desain)</label>
    <input type="file" id="fGambar" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml">
    ${gPreview ? `<p class="hint">Gambar tersimpan: <img src="${gPreview}" style="height:40px;border-radius:6px;vertical-align:middle;margin-left:6px;"></p>` : ''}

    <label class="field">Audio / Media (opsional, khusus file .mp3 atau .mp4)</label>
    <input type="file" id="fAudio" accept=".mp3,.mp4,audio/mpeg,audio/mp3,video/mp4,audio/mp4">
    ${aPreview ? `<p class="hint">Audio/Media tersimpan ✓ <audio controls src="${aPreview}" style="height:30px;vertical-align:middle;margin-left:6px;"></audio></p>` : ''}

    <label class="field">Pilihan Jawaban</label>
    ${[0, 1, 2, 3].map(i => `<div class="row" style="align-items:center;margin-bottom:8px;">
      <input type="radio" name="fJawaban" value="${i}" ${d.jawaban == i ? 'checked' : ''} style="width:auto;margin:0;">
      <input type="text" id="fOpsi${i}" value="${esc(d.opsi[i] || '')}" placeholder="Pilihan ${String.fromCharCode(65 + i)}" style="flex:1;margin-bottom:0;">
    </div>`).join('')}
    <p class="hint">Centang bulatan di samping pilihan yang benar.</p>

    <div class="row">
      <button class="btn btn-3" onclick="saveQuestion()">${editing ? 'Simpan Perubahan' : 'Tambah Soal'}</button>
      <button class="btn btn-ghost" onclick="go('t-dash')">Batal</button>
    </div>
  </div>`;
}

async function saveQuestion() {
  const kelas = parseInt(document.getElementById('fKelas').value);
  const materi = document.getElementById('fMateri').value.trim();
  const pertanyaan = document.getElementById('fPertanyaan').value.trim();
  const opsi = [0, 1, 2, 3].map(i => document.getElementById('fOpsi' + i).value.trim());
  const jRadio = document.querySelector('input[name=fJawaban]:checked');
  const waktuVal = parseInt(document.getElementById('fWaktu').value);
  const waktu = isNaN(waktuVal) ? 30 : Math.max(0, waktuVal);

  if (!pertanyaan || opsi.some(o => !o) || !jRadio) {
    alert('Lengkapi pertanyaan, semua pilihan, dan tandai jawaban benar.');
    return;
  }
  const jawaban = parseInt(jRadio.value);
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const editing = editId ? (cache.q[teacherKelasTab].find(q => q.id === editId) || [1, 2, 3].map(k => cache.q[k]).flat().find(q => q.id === editId)) : null;

  const data = {
    kelas,
    materi,
    pertanyaan,
    opsi,
    jawaban,
    waktu,
    gambarData: editing ? (editing.gambarData || null) : null,
    gambarId: editing ? (editing.gambarId || null) : null,
    audioData: editing ? (editing.audioData || null) : null,
    audioId: editing ? (editing.audioId || null) : null
  };

  try {
    const MAX_LOCAL_FILE_SIZE = 2.5 * 1024 * 1024; // 2.5 MB

    const gFile = document.getElementById('fGambar').files[0];
    if (gFile) {
      if (!db && typeof supabaseClient === 'undefined' && gFile.size > MAX_LOCAL_FILE_SIZE) {
        alert('Ukuran gambar terlalu besar (' + (gFile.size / (1024 * 1024)).toFixed(1) + 'MB). Maksimal ukuran file media untuk database lokal adalah 2.5 MB.');
        btn.disabled = false;
        btn.textContent = editing ? 'Simpan Perubahan' : 'Tambah Soal';
        return;
      }
      data.gambarData = await readFileAsDataURL(gFile);
      if (typeof assets !== 'undefined' && assets) {
        try {
          const up = await assets.upload(gFile);
          data.gambarId = up.id;
        } catch (err) { }
      }
    }
    const aFile = document.getElementById('fAudio').files[0];
    if (aFile) {
      const fn = aFile.name.toLowerCase();
      const isMp3 = fn.endsWith('.mp3') || aFile.type.includes('mpeg') || aFile.type.includes('mp3');
      const isMp4 = fn.endsWith('.mp4') || aFile.type.includes('mp4');
      if (!isMp3 && !isMp4) {
        alert('Hanya file berformat .mp3 atau .mp4 yang diperbolehkan!');
        btn.disabled = false;
        btn.textContent = editing ? 'Simpan Perubahan' : 'Tambah Soal';
        return;
      }
      if (!db && typeof supabaseClient === 'undefined' && aFile.size > MAX_LOCAL_FILE_SIZE) {
        alert('Ukuran file media/video terlalu besar (' + (aFile.size / (1024 * 1024)).toFixed(1) + 'MB). Penyimpanan lokal browser dibatasi maksimal 2.5 MB per file. Gunakan file berukuran lebih kecil atau potong durasi lagu/video.');
        btn.disabled = false;
        btn.textContent = editing ? 'Simpan Perubahan' : 'Tambah Soal';
        return;
      }
      data.audioData = await readFileAsDataURL(aFile);
      if (typeof assets !== 'undefined' && assets) {
        try {
          const up = await assets.upload(aFile, { type: isMp4 ? 'video/mp4' : 'audio/mpeg' });
          data.audioId = up.id;
        } catch (err) { }
      }
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      await sbSaveQuestion({ ...data, id: editId });
      await loadTeacherData();
    } else if (db) {
      if (editId) {
        await db.collection('questions').doc(editId).update(data);
      } else {
        await db.collection('questions').add(data);
      }
    } else {
      saveLocalQuestion(data, editId);
      loadTeacherData();
    }
    editId = null;
    go('t-dash');
  } catch (e) {
    alert('Gagal menyimpan: ' + (e && e.message ? e.message : 'coba lagi'));
    btn.disabled = false;
    btn.textContent = editId ? 'Simpan Perubahan' : 'Tambah Soal';
  }
}

/* TEACHER: Hasil Siswa */
function tHasilView() {
  const rows = cache.r || [];
  return `
  <button class="back" onclick="go('t-dash')">&larr; Kembali</button>
  <h2>Hasil Belajar Siswa</h2>
  <div class="card">
    ${rows.length === 0 ? `<p class="empty">Belum ada siswa yang mengerjakan kuis.</p>` : `
    <table>
      <thead>
        <tr><th>Nama</th><th>Kelas</th><th>Skor</th><th>Waktu</th></tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${esc(r.nama)}</td>
            <td>${KELAS[r.kelas] ? KELAS[r.kelas].label.split(' · ')[0] : r.kelas}</td>
            <td>${r.skor}/${r.total}</td>
            <td>${new Date(r.waktu).toLocaleString('id-ID')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`}
  </div>`;
}
