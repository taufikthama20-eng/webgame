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
    <button class="btn btn-ghost" onclick="openRiwayat()">Lihat Riwayat Nilai</button>
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
    quiz = { list, idx: 0, score: 0, answered: false };
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
  const aSrc = item.audioData || (item.audioId ? `/_blob/${item.audioId}` : null);
  if (gSrc) media += `<img class="q-media" src="${gSrc}">`;
  if (aSrc) media += `<audio class="q-media" controls src="${aSrc}" style="width:100%;"></audio>`;

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
        }
        if (quizTimerSec <= 0) {
          clearInterval(quizTimerInterval);
          answerQuiz(-1);
        }
      }, 1000);
    }, 50);
  }

  return `
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <span class="badge ${info.badge}">${info.label}</span>
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

  if (i === -1) {
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
  const msg = pct >= 80 ? 'Keren banget! 🎉' : pct >= 60 ? 'Bagus, terus berlatih!' : 'Yuk pelajari lagi materinya!';
  return `
  <div class="card result-hero">
    <span class="badge ${info.badge}">${info.label}</span>
    <div class="score">${quiz.score}/${quiz.list.length}</div>
    <p class="pct">${pct}% benar · ${msg}</p>
  </div>
  <div class="row">
    <button class="btn" style="background:var(${info.accent});color:#1c1c1c;" onclick="startQuiz()">Ulangi Kuis</button>
    <button class="btn btn-ghost" onclick="go('s-materi')">Kembali ke Materi</button>
    <button class="btn btn-ghost" onclick="openRiwayat()">Lihat Riwayat</button>
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
