/* ---------------- Supabase Client & API Helper ---------------- */

// 1. Isi dengan URL & ANON KEY dari Dashboard Supabase Anda:
// (Project Settings -> API)
const SUPABASE_URL = 'https://qgwhlajpmhvocrmgagmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnd2hsYWpwbWh2b2NybWdhZ214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNjQ1NjQsImV4cCI6MjEwNTk0MDU2NH0.yY56lFvI3m1QCmn-F6LbgsqV1n0Cr-u7im_ohYDPfoE';

let supabaseClient = null;

// Inisialisasi Supabase Client jika URL & Key sudah diisi
if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ Supabase Client terhubung!");
    } catch (err) {
        console.warn("⚠️ Gagal inisialisasi Supabase Client:", err);
    }
} else {
    console.info("ℹ️ Supabase URL/Anon Key belum diisi di js/supabase.js. Menggunakan LocalStorage sebagai fallback.");
}

/* ---------------- API Helper Functions ---------------- */

/**
 * Mengambil daftar soal kuis dari Supabase
 */
async function sbFetchQuestions(kelas = null) {
    if (!supabaseClient) return null;
    try {
        let query = supabaseClient.from('questions').select('*').order('created_at', { ascending: true });
        if (kelas) {
            query = query.eq('kelas', kelas);
        }
        const { data, error } = await query;
        if (error) {
            console.error("Supabase Error [sbFetchQuestions]:", error);
            return null;
        }
        return data.map(q => ({
            ...q,
            gambarData: q.gambar_data || q.gambarData || null,
            audioData: q.audio_data || q.audioData || null,
            waktu: (q.waktu !== undefined && q.waktu !== null) ? Number(q.waktu) : 30,
            penjelasan: q.penjelasan || null
        }));
    } catch (e) {
        console.error("Network / Supabase Exception [sbFetchQuestions]:", e);
        return null;
    }
}

/**
 * Menyimpan atau memperbarui soal di Supabase
 */
async function sbSaveQuestion(questionObj) {
    if (!supabaseClient) return null;
    try {
        const payload = {
            kelas: Number(questionObj.kelas),
            materi: questionObj.materi,
            pertanyaan: questionObj.pertanyaan,
            gambar_data: questionObj.gambarData || null,
            audio_data: questionObj.audioData || null,
            opsi: questionObj.opsi,
            jawaban: Number(questionObj.jawaban),
            waktu: Number(questionObj.waktu || 30)
        };
        if (questionObj.penjelasan) {
            payload.penjelasan = questionObj.penjelasan;
        }

        if (questionObj.id && !String(questionObj.id).startsWith('local_')) {
            payload.id = questionObj.id;
        }

        let { data, error } = await supabaseClient
            .from('questions')
            .upsert(payload)
            .select();

        if (error && payload.penjelasan && (error.message || '').toLowerCase().includes('penjelasan')) {
            console.warn("Supabase table missing 'penjelasan' column. Retrying without it...");
            delete payload.penjelasan;
            const retry = await supabaseClient
                .from('questions')
                .upsert(payload)
                .select();
            data = retry.data;
            error = retry.error;
        }

        if (error) {
            console.error("Supabase Error [sbSaveQuestion]:", error);
            return null;
        }
        const res = data ? data[0] : null;
        if (res) {
            res.gambarData = res.gambar_data || res.gambarData || null;
            res.audioData = res.audio_data || res.audioData || null;
            res.penjelasan = res.penjelasan || questionObj.penjelasan || null;
        }
        return res;
    } catch (e) {
        console.error("Network / Supabase Exception [sbSaveQuestion]:", e);
        return null;
    }
}

/**
 * Menghapus soal dari Supabase
 */
async function sbDeleteQuestion(id) {
    if (!supabaseClient) return false;
    try {
        const { error } = await supabaseClient
            .from('questions')
            .delete()
            .eq('id', id);
        if (error) {
            console.error("Supabase Error [sbDeleteQuestion]:", error);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Network / Supabase Exception [sbDeleteQuestion]:", e);
        return false;
    }
}

/**
 * Mengambil riwayat hasil kuis siswa dari Supabase
 */
async function sbFetchResults(studentName = null) {
    if (!supabaseClient) return null;
    try {
        let query = supabaseClient.from('results').select('*').order('created_at', { ascending: false });
        if (studentName) {
            query = query.eq('nama', studentName);
        }
        const { data, error } = await query;
        if (error) {
            console.error("Supabase Error [sbFetchResults]:", error);
            return null;
        }
        return data;
    } catch (e) {
        console.error("Network / Supabase Exception [sbFetchResults]:", e);
        return null;
    }
}

/**
 * Menyimpan hasil kuis siswa ke Supabase
 */
async function sbSaveResult(resultObj) {
    if (!supabaseClient) return null;
    try {
        const payload = {
            nama: resultObj.nama,
            kelas: Number(resultObj.kelas),
            skor: Number(resultObj.skor),
            total_soal: Number(resultObj.total),
            durasi_detik: Number(resultObj.durasiSec || 0)
        };
        const { data, error } = await supabaseClient
            .from('results')
            .insert(payload)
            .select();
        if (error) {
            console.error("Supabase Error [sbSaveResult]:", error);
            return null;
        }
        return data ? data[0] : null;
    } catch (e) {
        console.error("Network / Supabase Exception [sbSaveResult]:", e);
        return null;
    }
}

/**
 * Mengambil ringkasan materi dari Supabase
 */
async function sbFetchMateri(kelas) {
    if (!supabaseClient) return null;
    try {
        const { data, error } = await supabaseClient
            .from('materi')
            .select('*')
            .eq('kelas', kelas)
            .maybeSingle();
        if (error) {
            console.error("Supabase Error [sbFetchMateri]:", error);
            return null;
        }
        return data ? data.ringkasan : null;
    } catch (e) {
        console.error("Network / Supabase Exception [sbFetchMateri]:", e);
        return null;
    }
}

/**
 * Menyimpan / update ringkasan materi ke Supabase
 */
async function sbSaveMateri(kelas, ringkasan) {
    if (!supabaseClient) return null;
    try {
        const { data, error } = await supabaseClient
            .from('materi')
            .upsert({ kelas: Number(kelas), ringkasan: ringkasan })
            .select();
        if (error) {
            console.error("Supabase Error [sbSaveMateri]:", error);
            return null;
        }
        return data ? data[0] : null;
    } catch (e) {
        console.error("Network / Supabase Exception [sbSaveMateri]:", e);
        return null;
    }
}

/**
 * Berlangganan (Subscribe) perubahan real-time pada tabel results Supabase
 */
function sbSubscribeResults(onInsertCallback) {
    if (!supabaseClient) return null;
    try {
        const channel = supabaseClient
            .channel('public-results-changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'results' }, payload => {
                console.log("⚡ Realtime Supabase Result Inserted:", payload);
                if (onInsertCallback) onInsertCallback(payload.new);
            })
            .subscribe();
        return channel;
    } catch (e) {
        console.warn("Realtime subscription exception:", e);
        return null;
    }
}

/* ---------------- Audio Library API ---------------- */

/**
 * Mengambil seluruh audio dari library di Supabase
 */
async function sbFetchAudioLibrary() {
    if (!supabaseClient) return null;
    try {
        const { data, error } = await supabaseClient
            .from('audio_library')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error("Supabase Error [sbFetchAudioLibrary]:", error);
            return null;
        }
        return data;
    } catch (e) {
        console.error("Network / Supabase Exception [sbFetchAudioLibrary]:", e);
        return null;
    }
}

/**
 * Menyimpan audio baru ke library di Supabase
 */
async function sbSaveAudio(audioObj) {
    if (!supabaseClient) return null;
    try {
        const payload = {
            nama: audioObj.nama,
            audio_data: audioObj.audio_data
        };
        if (audioObj.id && !String(audioObj.id).startsWith('local_')) {
            payload.id = audioObj.id;
        }
        const { data, error } = await supabaseClient
            .from('audio_library')
            .upsert(payload)
            .select();
        if (error) {
            console.error("Supabase Error [sbSaveAudio]:", error);
            return null;
        }
        return data ? data[0] : null;
    } catch (e) {
        console.error("Network / Supabase Exception [sbSaveAudio]:", e);
        return null;
    }
}

/**
 * Menghapus audio dari library di Supabase
 */
async function sbDeleteAudio(id) {
    if (!supabaseClient) return false;
    try {
        const { error } = await supabaseClient
            .from('audio_library')
            .delete()
            .eq('id', id);
        if (error) {
            console.error("Supabase Error [sbDeleteAudio]:", error);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Network / Supabase Exception [sbDeleteAudio]:", e);
        return false;
    }
}
