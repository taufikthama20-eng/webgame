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
  if (v !== '' && v !== 'ibufera') {
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
  // Load audio library
  await loadAudioLibrary();
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

async function loadAudioLibrary() {
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    const sbAudio = await sbFetchAudioLibrary();
    if (sbAudio) {
      cache.audioLib = sbAudio;
    } else {
      cache.audioLib = getLocalAudioLib();
    }
  } else {
    cache.audioLib = getLocalAudioLib();
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
    <button class="btn btn-2" onclick="go('t-audio')">🎵 Kelola Audio Library</button>
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
        <div class="qmeta">${q.materi ? esc(q.materi) + ' · ' : ''}${q.gambarData || q.gambarId ? '📷 gambar · ' : ''}${(q.audioData || q.audio_data || q.audioLibId || q.audio_lib_id || q.audioId) ? '🎵 audio · ' : ''}jawaban: ${esc(q.opsi[q.jawaban] || '')}</div>
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
      const ok = await sbDeleteQuestion(id);
      if (ok) {
        for (let c = 1; c <= 3; c++) {
          cache.q[c] = cache.q[c].filter(q => q.id !== id);
        }
        render();
      } else {
        alert('Gagal menghapus dari database.');
      }
    } else if (db) {
      await db.collection('questions').doc(id).delete();
      for (let c = 1; c <= 3; c++) {
        cache.q[c] = cache.q[c].filter(q => q.id !== id);
      }
      render();
    } else {
      deleteLocalQuestion(id);
      for (let c = 1; c <= 3; c++) {
        cache.q[c] = cache.q[c].filter(q => q.id !== id);
      }
      render();
    }
  } catch (e) {
    alert('Gagal menghapus.');
  }
}

/* TEACHER: Form Tambah/Edit Soal */
function openForm(id) {
  editId = id;
  selectedAudioLibId = null;
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

function previewUploadedAudio(input) {
  const file = input.files[0];
  const container = document.getElementById('fAudioFilePreviewContainer');
  const player = document.getElementById('fAudioFilePlayer');
  if (file && player && container) {
    const url = URL.createObjectURL(file);
    player.src = url;
    container.style.display = 'block';
  } else if (container) {
    container.style.display = 'none';
  }
}

let selectedAudioLibId = null;

function tFormView() {
  const editing = editId ? cache.q[teacherKelasTab].find(q => q.id === editId) || [1, 2, 3].map(k => cache.q[k]).flat().find(q => q.id === editId) : null;
  const d = editing || { kelas: teacherKelasTab, materi: '', pertanyaan: '', opsi: ['', '', '', ''], jawaban: 0, gambarData: null, gambarId: null, audioData: null, audioId: null, audioLibId: null };
  const gPreview = d.gambarData || (d.gambarId ? `/_blob/${d.gambarId}` : null);
  const aPreview = d.audioData || (d.audioId ? `/_blob/${d.audioId}` : null);

  // Pre-select audio library item if editing
  if (editing && editing.audioLibId && !selectedAudioLibId) {
    selectedAudioLibId = editing.audioLibId;
  }

  const audioLibItems = cache.audioLib || [];

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

    <label class="field" style="font-size:13px;font-weight:700;color:var(--k2);margin-top:8px;">🎵 Audio untuk Soal (Opsional)</label>
    ${audioLibItems.length > 0 ? `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <p class="hint" style="margin-bottom:0;">Pilih audio dari library:</p>
      <span class="hint" style="margin-bottom:0;color:var(--k2);">${audioLibItems.length} audio tersedia</span>
    </div>
    <input type="text" id="audioPickerSearch" placeholder=" Cari judul audio..." oninput="filterAudioPicker(this.value)" style="margin-bottom:8px;padding:8px 12px;font-size:13px;">
    <div class="audio-picker" id="audioPicker">
      <div class="audio-picker-item ${!selectedAudioLibId ? 'selected' : ''}" onclick="pickAudioLib(null)">
        <span style="font-size:13px;color:var(--chalk-dim);"> Tanpa Audio</span>
      </div>
      ${audioLibItems.map(a => `
      <div class="audio-picker-item ${selectedAudioLibId === a.id ? 'selected' : ''}" data-nama="${esc(a.nama)}" onclick="pickAudioLib('${a.id}')">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
          <span style="font-size:18px;">🎵</span>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(a.nama)}</div>
            <audio controls src="${a.audio_data}" style="height:28px;width:100%;max-width:220px;margin-top:4px;" onclick="event.stopPropagation()"></audio>
          </div>
        </div>
        ${selectedAudioLibId === a.id ? '<span style="color:var(--ok);font-weight:700;font-size:18px;">✓</span>' : ''}
      </div>`).join('')}
    </div>
    ` : `<p class="hint">Belum ada audio di library. <a href="#" onclick="go('t-audio');return false;" style="color:var(--k2);font-weight:700;">Upload audio dulu →</a></p>`}

    <div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);">
      <label class="field">Atau upload file audio baru langsung (.mp3/.mp4)</label>
      <input type="file" id="fAudio" accept=".mp3,.mp4,audio/mpeg,audio/mp3,video/mp4,audio/mp4" onchange="previewUploadedAudio(this)">
      <div id="fAudioFilePreviewContainer" style="display:none;margin-top:8px;">
        <p class="hint" style="font-weight:600;color:var(--ok);">Preview Audio Pilihan Anda:
          <audio id="fAudioFilePlayer" controls style="height:32px;vertical-align:middle;margin-left:6px;width:100%;max-width:320px;"></audio>
        </p>
      </div>
      <p class="hint">Jika Anda upload file langsung, audio ini juga akan otomatis masuk ke Audio Library.</p>
    </div>
    ${aPreview && !selectedAudioLibId ? `<p class="hint">Audio tersimpan sebelumnya ✓ <audio controls src="${aPreview}" style="height:30px;vertical-align:middle;margin-left:6px;"></audio></p>` : ''}

    <label class="field" style="margin-top:12px;">Pilihan Jawaban</label>
    ${[0, 1, 2, 3].map(i => `<div class="row" style="align-items:center;margin-bottom:8px;">
      <input type="radio" name="fJawaban" value="${i}" ${d.jawaban == i ? 'checked' : ''} style="width:auto;margin:0;">
      <input type="text" id="fOpsi${i}" value="${esc(d.opsi[i] || '')}" placeholder="Pilihan ${String.fromCharCode(65 + i)}" style="flex:1;margin-bottom:0;">
    </div>`).join('')}
    <p class="hint">Centang bulatan di samping pilihan yang benar.</p>

    <label class="field">Pembahasan / Penjelasan Jawaban (Opsional)</label>
    <textarea id="fPenjelasan" placeholder="Tulis alasan/penjelasan mengapa jawaban tersebut benar...">${esc(d.penjelasan || '')}</textarea>
    <p class="hint">Penjelasan ini akan tampil bagi siswa saat melihat kunci jawaban &amp; pembahasan setelah selesai kuis.</p>

    <div class="row">
      <button class="btn btn-3" onclick="saveQuestion(event)">${editing ? 'Simpan Perubahan' : 'Tambah Soal'}</button>
      <button class="btn btn-ghost" onclick="go('t-dash')">Batal</button>
    </div>
  </div>`;
}

function pickAudioLib(id) {
  selectedAudioLibId = id;
  const picker = document.getElementById('audioPicker');
  if (!picker) return;

  const items = picker.querySelectorAll('.audio-picker-item');
  items.forEach(el => {
    // Check if this element corresponds to the selected id
    const clickAttr = el.getAttribute('onclick') || '';
    const matchesNull = (id === null && clickAttr.includes('null'));
    const matchesId = (id !== null && clickAttr.includes(`'${id}'`));

    if (matchesNull || matchesId) {
      el.classList.add('selected');
      if (id !== null && !el.querySelector('.check-mark')) {
        const check = document.createElement('span');
        check.className = 'check-mark';
        check.style.cssText = 'color:var(--ok);font-weight:700;font-size:18px;';
        check.textContent = '✓';
        el.appendChild(check);
      }
    } else {
      el.classList.remove('selected');
      const check = el.querySelector('.check-mark');
      if (check) check.remove();
    }
  });
}

async function saveQuestion(evt) {
  const kelas = parseInt(document.getElementById('fKelas').value);
  const materi = document.getElementById('fMateri').value.trim();
  const pertanyaan = document.getElementById('fPertanyaan').value.trim();
  const opsi = [0, 1, 2, 3].map(i => document.getElementById('fOpsi' + i).value.trim());
  const jRadio = document.querySelector('input[name=fJawaban]:checked');
  const waktuVal = parseInt(document.getElementById('fWaktu').value);
  const waktu = isNaN(waktuVal) ? 30 : Math.max(0, waktuVal);
  const penjelasan = document.getElementById('fPenjelasan').value.trim();

  if (!pertanyaan || opsi.some(o => !o) || !jRadio) {
    alert('Lengkapi pertanyaan, semua pilihan, dan tandai jawaban benar.');
    return;
  }
  const jawaban = parseInt(jRadio.value);
  const btn = (evt && evt.target) ? evt.target : (window.event ? window.event.target : null);
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';
  }

  const editing = editId ? (cache.q[teacherKelasTab].find(q => q.id === editId) || [1, 2, 3].map(k => cache.q[k]).flat().find(q => q.id === editId)) : null;

  const data = {
    kelas,
    materi,
    pertanyaan,
    opsi,
    jawaban,
    waktu,
    penjelasan: penjelasan || null,
    gambarData: editing ? (editing.gambarData || null) : null,
    gambarId: editing ? (editing.gambarId || null) : null,
    audioData: editing ? (editing.audioData || null) : null,
    audioId: editing ? (editing.audioId || null) : null,
    audioLibId: null
  };

  // If an audio library item is selected, use its data
  if (selectedAudioLibId) {
    const libItem = (cache.audioLib || []).find(a => a.id === selectedAudioLibId);
    if (libItem) {
      data.audioData = libItem.audio_data;
      data.audioLibId = libItem.id;
    }
  }

  try {
    const MAX_LOCAL_FILE_SIZE = 2.5 * 1024 * 1024; // 2.5 MB

    const gFile = document.getElementById('fGambar').files[0];
    if (gFile) {
      if (!db && typeof supabaseClient === 'undefined' && gFile.size > MAX_LOCAL_FILE_SIZE) {
        alert('Ukuran gambar terlalu besar (' + (gFile.size / (1024 * 1024)).toFixed(1) + 'MB). Maksimal ukuran file media untuk database lokal adalah 2.5 MB.');
        if (btn) {
          btn.disabled = false;
          btn.textContent = editing ? 'Simpan Perubahan' : 'Tambah Soal';
        }
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

    const aFile = document.getElementById('fAudio')?.files[0];
    if (aFile) {
      const fn = aFile.name.toLowerCase();
      const isMp3 = fn.endsWith('.mp3') || aFile.type.includes('mpeg') || aFile.type.includes('mp3');
      const isMp4 = fn.endsWith('.mp4') || aFile.type.includes('mp4');
      if (!isMp3 && !isMp4) {
        alert('Hanya file berformat .mp3 atau .mp4 yang diperbolehkan!');
        if (btn) {
          btn.disabled = false;
          btn.textContent = editing ? 'Simpan Perubahan' : 'Tambah Soal';
        }
        return;
      }
      if (!db && typeof supabaseClient === 'undefined' && aFile.size > MAX_LOCAL_FILE_SIZE) {
        alert('Ukuran file media/video terlalu besar (' + (aFile.size / (1024 * 1024)).toFixed(1) + 'MB). Penyimpanan lokal browser dibatasi maksimal 2.5 MB per file. Gunakan file berukuran lebih kecil atau potong durasi lagu/video.');
        if (btn) {
          btn.disabled = false;
          btn.textContent = editing ? 'Simpan Perubahan' : 'Tambah Soal';
        }
        return;
      }
      data.audioData = await readFileAsDataURL(aFile);
      if (typeof assets !== 'undefined' && assets) {
        try {
          const up = await assets.upload(aFile, { type: isMp4 ? 'video/mp4' : 'audio/mpeg' });
          data.audioId = up.id;
        } catch (err) { }
      }
      // Auto-save uploaded audio to library
      const audioLibName = fn.replace(/\.[^.]+$/, '');
      const audioLibObj = { nama: audioLibName, audio_data: data.audioData };
      if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const saved = await sbSaveAudio(audioLibObj);
        if (saved) {
          data.audioLibId = saved.id;
          cache.audioLib.unshift(saved);
        } else {
          const localSaved = saveLocalAudio({ id: 'local_audio_' + Date.now(), ...audioLibObj });
          if (localSaved) data.audioLibId = localSaved.id;
          cache.audioLib = getLocalAudioLib();
        }
      } else {
        const localSaved = saveLocalAudio({ id: 'local_audio_' + Date.now(), ...audioLibObj });
        if (localSaved) data.audioLibId = localSaved.id;
        cache.audioLib = getLocalAudioLib();
      }
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const savedRes = await sbSaveQuestion({ ...data, id: editId });
      if (savedRes) {
        const savedQ = {
          ...data,
          ...savedRes,
          gambarData: savedRes.gambarData || data.gambarData || null,
          audioData: savedRes.audioData || data.audioData || null,
          penjelasan: savedRes.penjelasan || data.penjelasan || null
        };
        const k = savedQ.kelas;
        for (let c = 1; c <= 3; c++) {
          cache.q[c] = cache.q[c].filter(q => q.id !== savedQ.id && q.id !== editId);
        }
        cache.q[k].push(savedQ);
      } else {
        console.warn("Supabase save returned null. Saving to local storage fallback...");
        saveLocalQuestion(data, editId);
        const all = getLocalQuestions();
        cache.q = {
          1: all.filter(q => Number(q.kelas) === 1),
          2: all.filter(q => Number(q.kelas) === 2),
          3: all.filter(q => Number(q.kelas) === 3)
        };
      }
    } else if (db) {
      if (editId) {
        await db.collection('questions').doc(editId).update(data);
      } else {
        const ref = await db.collection('questions').add(data);
        data.id = ref.id;
      }
      const targetId = editId || data.id;
      for (let c = 1; c <= 3; c++) {
        cache.q[c] = cache.q[c].filter(q => q.id !== targetId);
      }
      cache.q[kelas].push({ id: targetId, ...data });
    } else {
      saveLocalQuestion(data, editId);
      const all = getLocalQuestions();
      cache.q = {
        1: all.filter(q => Number(q.kelas) === 1),
        2: all.filter(q => Number(q.kelas) === 2),
        3: all.filter(q => Number(q.kelas) === 3)
      };
    }
    editId = null;
    go('t-dash');
  } catch (e) {
    alert('Gagal menyimpan: ' + (e && e.message ? e.message : 'coba lagi'));
    if (btn) {
      btn.disabled = false;
      btn.textContent = editId ? 'Simpan Perubahan' : 'Tambah Soal';
    }
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

/* ================ AUDIO LIBRARY ================ */

function tAudioLibView() {
  const lib = cache.audioLib || [];
  return `
  <button class="back" onclick="go('t-dash')">&larr; Kembali ke Dashboard</button>
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <h2>🎵 Audio Library</h2>
    <span class="badge badge-2" style="font-size:13px;">${lib.length} audio</span>
  </div>
  <p class="sub">Upload dan kelola file audio untuk digunakan dalam soal kuis.</p>

  <!-- Form Upload Audio Baru -->
  <div class="card" style="border-left:4px solid var(--k2);">
    <label class="field" style="font-weight:700;color:var(--k2);">➕ Upload Audio Baru</label>
    <input type="text" id="audioLibName" placeholder="Nama / judul audio (contoh: Lagu Ampar-Ampar Pisang)" style="margin-bottom:8px;">
    <input type="file" id="audioLibFile" accept=".mp3,.mp4,audio/mpeg,audio/mp3,video/mp4,audio/mp4" onchange="previewLibAudio(this)">
    <div id="libAudioPreviewContainer" style="display:none;margin-top:8px;">
      <p class="hint" style="font-weight:600;color:var(--ok);">Preview:
        <audio id="libAudioPlayer" controls style="height:32px;vertical-align:middle;margin-left:6px;width:100%;max-width:320px;"></audio>
      </p>
    </div>
    <div class="row" style="margin-top:10px;">
      <button class="btn btn-2" onclick="uploadToAudioLib()">⬆️ Upload ke Library</button>
      <span id="audioLibSaveMsg" class="hint" style="align-self:center;color:var(--ok);font-weight:bold;display:none;">Berhasil disimpan ✓</span>
    </div>
  </div>

  <!-- Daftar Audio -->
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <label class="field" style="font-weight:700;margin-bottom:0;">📂 Daftar Audio Tersimpan</label>
      <span class="hint" style="margin-bottom:0;color:var(--k2);">${lib.length} file</span>
    </div>
    ${lib.length > 0 ? `
    <input type="text" id="audioLibSearch" placeholder=" Cari audio di library..." oninput="filterAudioLib(this.value)" style="margin-bottom:12px;padding:8px 12px;font-size:13px;">
    <div style="display:flex;flex-direction:column;gap:10px;" id="audioLibList">
      ${lib.map(a => `
      <div class="audio-lib-item" data-nama="${esc(a.nama)}">
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
          <span style="font-size:24px;">🎵</span>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(a.nama)}</div>
            <audio controls src="${a.audio_data}" style="height:32px;width:100%;max-width:300px;margin-top:4px;"></audio>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="deleteAudioLib('${a.id}')" style="color:var(--bad);border-color:var(--bad);">🗑 Hapus</button>
      </div>`).join('')}
    </div>` : `<p class="empty">Belum ada audio di library. Upload audio pertamamu di atas!</p>`}
  </div>`;
}

function filterAudioPicker(q) {
  const query = (q || '').toLowerCase().trim();
  const items = document.querySelectorAll('#audioPicker .audio-picker-item[data-nama]');
  items.forEach(el => {
    const nama = el.getAttribute('data-nama') || '';
    if (!query || nama.toLowerCase().includes(query)) {
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  });
}

function filterAudioLib(q) {
  const query = (q || '').toLowerCase().trim();
  const items = document.querySelectorAll('#audioLibList .audio-lib-item[data-nama]');
  items.forEach(el => {
    const nama = el.getAttribute('data-nama') || '';
    if (!query || nama.toLowerCase().includes(query)) {
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  });
}

function previewLibAudio(input) {
  const file = input.files[0];
  const container = document.getElementById('libAudioPreviewContainer');
  const player = document.getElementById('libAudioPlayer');
  if (file && player && container) {
    const url = URL.createObjectURL(file);
    player.src = url;
    container.style.display = 'block';
  } else if (container) {
    container.style.display = 'none';
  }
}

async function uploadToAudioLib() {
  const namaInput = document.getElementById('audioLibName');
  const fileInput = document.getElementById('audioLibFile');
  const nama = (namaInput ? namaInput.value.trim() : '');
  const file = fileInput ? fileInput.files[0] : null;
  const btn = document.querySelector('button[onclick="uploadToAudioLib()"]');

  if (!file) {
    alert('Pilih file audio terlebih dahulu.');
    return;
  }

  const fn = file.name.toLowerCase();
  const isMp3 = fn.endsWith('.mp3') || file.type.includes('mpeg') || file.type.includes('mp3');
  const isMp4 = fn.endsWith('.mp4') || file.type.includes('mp4');
  if (!isMp3 && !isMp4) {
    alert('Hanya file berformat .mp3 atau .mp4 yang diperbolehkan!');
    return;
  }

  // Batas ukuran file 3 MB untuk stabilitas Base64 data URL
  const MAX_SIZE = 3 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    alert('Ukuran file audio terlalu besar (' + (file.size / (1024 * 1024)).toFixed(1) + ' MB). Maksimal ukuran file adalah 3 MB. Harap gunakan file audio berukuran lebih kecil atau potong durasinya.');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Mengupload...';
  }

  try {
    const audioName = nama || fn.replace(/\.[^.]+$/, '');
    const audioDataURL = await readFileAsDataURL(file);
    const audioObj = { nama: audioName, audio_data: audioDataURL };

    let success = false;
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const saved = await sbSaveAudio(audioObj);
      if (saved) {
        cache.audioLib.unshift(saved);
        success = true;
      } else {
        console.warn("Supabase save null, trying local fallback...");
        const localSaved = saveLocalAudio({ id: 'local_audio_' + Date.now(), ...audioObj });
        if (localSaved) {
          cache.audioLib = getLocalAudioLib();
          success = true;
        }
      }
    } else {
      const localSaved = saveLocalAudio({ id: 'local_audio_' + Date.now(), ...audioObj });
      if (localSaved) {
        cache.audioLib = getLocalAudioLib();
        success = true;
      }
    }

    if (!success) {
      alert('Gagal menyimpan file audio. Pastikan ukuran file tidak terlalu besar.');
    } else {
      // Clear inputs
      if (namaInput) namaInput.value = '';
      if (fileInput) fileInput.value = '';
      const preview = document.getElementById('libAudioPreviewContainer');
      if (preview) preview.style.display = 'none';
    }

    render();
    setTimeout(() => {
      const msg = document.getElementById('audioLibSaveMsg');
      if (msg) {
        msg.style.display = 'inline';
        setTimeout(() => { msg.style.display = 'none'; }, 2500);
      }
    }, 100);
  } catch (err) {
    console.error("Audio upload exception:", err);
    alert('Terjadi kesalahan saat upload audio: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⬆️ Upload ke Library';
    }
  }
}

async function deleteAudioLib(id) {
  if (!confirm('Hapus audio ini dari library?')) return;
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    const ok = await sbDeleteAudio(id);
    if (ok) {
      cache.audioLib = cache.audioLib.filter(a => a.id !== id);
    } else {
      alert('Gagal menghapus dari database.');
      return;
    }
  } else {
    deleteLocalAudio(id);
    cache.audioLib = getLocalAudioLib();
  }
  render();
}
