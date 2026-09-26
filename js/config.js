/* ---------------- Konfigurasi & Utility ---------------- */
const KELAS = {
  1: {
    label: 'Kelas 1 · Seni Rupa',
    accent: '--k1',
    badge: 'badge-1',
    ringkasan: 'Mengenal jenis-jenis gambar, alat & bahan menggambar, unsur gambar (garis, bentuk, tekstur), serta teknik-teknik dasar menggambar.'
  },
  2: {
    label: 'Kelas 2 · Seni Rupa',
    accent: '--k2',
    badge: 'badge-2',
    ringkasan: 'Mengenal prinsip desain (keseimbangan, kontras, proporsi, irama), unsur desain, teori warna, komposisi dan bentuk.'
  },
  3: {
    label: 'Kelas 3 · Seni Rupa',
    accent: '--k3',
    badge: 'badge-3',
    ringkasan: 'Mengenal unsur musik, nada, alat musik, ritme, melodi, tempo — termasuk menebak judul lagu dari cuplikan audio.'
  }
};

const DEFAULT_QUESTIONS = [
  // Kelas 1 - Menggambar
  {
    id: 'q1_1',
    kelas: 1,
    materi: 'Unsur Gambar',
    pertanyaan: 'Perhatikan gambar berikut. Unsur seni rupa paling dasar yang terbentuk dari kumpulan titik-titik yang terhubung adalah...',
    gambarData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160" viewBox="0 0 400 160"><rect width="100%" height="100%" fill="%232d3b34" rx="10"/><circle cx="80" cy="80" r="30" stroke="%23e8874a" stroke-width="4" fill="none"/><line x1="150" y1="40" x2="280" y2="120" stroke="%234fb6a8" stroke-width="6"/><rect x="300" y="45" width="60" height="60" stroke="%239b7ede" stroke-width="4" fill="none"/></svg>',
    opsi: ['Garis', 'Bidang', 'Tekstur', 'Warna'],
    jawaban: 0
  },
  {
    id: 'q1_2',
    kelas: 1,
    materi: 'Alat & Bahan',
    pertanyaan: 'Pensil dengan kode "B" (Bold) memiliki karakteristik...',
    opsi: ['Keras dan tipis', 'Lunak dan hitam pekat', 'Sangat keras dan berwarna abu muda', 'Tidak dapat dihapus'],
    jawaban: 1
  },
  {
    id: 'q1_3',
    kelas: 1,
    materi: 'Teknik Menggambar',
    pertanyaan: 'Teknik menggambar dengan membuat garis-garis sejajar atau bersilangan untuk menentukan gelap terang disebut...',
    opsi: ['Teknik Dusel', 'Teknik Arsir', 'Teknik Pointilis', 'Teknik Plakat'],
    jawaban: 1
  },
  {
    id: 'q1_4',
    kelas: 1,
    materi: 'Unsur Gambar',
    pertanyaan: 'Nilai raba dari suatu permukaan bidang dalam seni rupa dinamakan...',
    opsi: ['Gelap Terang', 'Tekstur', 'Bentuk', 'Ruang'],
    jawaban: 1
  },
  {
    id: 'q1_5',
    kelas: 1,
    materi: 'Prinsip Menggambar',
    pertanyaan: 'Keseimbangan objek gambar pada bagian kiri dan kanan yang sama persis dinamakan keseimbangan...',
    opsi: ['Asimetris', 'Simetris', 'Sentral', 'Diagonal'],
    jawaban: 1
  },

  // Kelas 2 - Desain
  {
    id: 'q2_1',
    kelas: 2,
    materi: 'Teori Warna',
    pertanyaan: 'Lihat ilustrasi campuran warna berikut. Warna sekunder dihasilkan dari campuran dua warna primer. Campuran warna merah dan kuning menghasilkan warna...',
    gambarData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160" viewBox="0 0 400 160"><rect width="100%" height="100%" fill="%232d3b34" rx="10"/><circle cx="120" cy="80" r="45" fill="%23e8874a"/><circle cx="190" cy="80" r="45" fill="%23f7d154" opacity="0.85"/><text x="260" y="85" fill="%23eef1ea" font-family="sans-serif" font-size="16" font-weight="bold">Merah + Kuning</text></svg>',
    opsi: ['Hijau', 'Ungu', 'Jingga / Oranye', 'Cokelat'],
    jawaban: 2
  },
  {
    id: 'q2_2',
    kelas: 2,
    materi: 'Prinsip Desain',
    pertanyaan: 'Prinsip desain yang menunjukkan perbedaan mencolok antara dua unsur yang berdekatan untuk menarik perhatian adalah...',
    opsi: ['Kontras', 'Keseimbangan', 'Proporsi', 'Kesatuan'],
    jawaban: 0
  },
  {
    id: 'q2_3',
    kelas: 2,
    materi: 'Komposisi',
    pertanyaan: 'Perbandingan ukuran antara bagian satu dengan bagian yang lain atau dengan keseluruhan dinamakan...',
    opsi: ['Irama', 'Proporsi', 'Harmoni', 'Keseimbangan'],
    jawaban: 1
  },
  {
    id: 'q2_4',
    kelas: 2,
    materi: 'Teori Warna',
    pertanyaan: 'Kelompok warna primer dalam teori warna seni rupa terdiri dari...',
    opsi: ['Merah, Kuning, Biru', 'Merah, Hijau, Biru', 'Hitam, Putih, Abu-abu', 'Oranye, Hijau, Ungu'],
    jawaban: 0
  },
  {
    id: 'q2_5',
    kelas: 2,
    materi: 'Prinsip Desain',
    pertanyaan: 'Pengulangan unsur-unsur visual secara teratur dan berkelanjutan menciptakan kesan gerak yang disebut...',
    opsi: ['Irama (Rhythm)', 'Kontras', 'Tekstur', 'Keseimbangan'],
    jawaban: 0
  },

  // Kelas 3 - Musik
  {
    id: 'q3_1',
    kelas: 3,
    materi: 'Unsur Musik',
    pertanyaan: 'Cepat lambatnya laju ritme dalam sebuah lagu dinamakan...',
    opsi: ['Melodi', 'Tempo', 'Dinamik', 'Harmoni'],
    jawaban: 1
  },
  {
    id: 'q3_2',
    kelas: 3,
    materi: 'Alat Musik',
    pertanyaan: 'Alat musik yang sumber bunyinya berasal dari getaran dawai atau senar dinamakan...',
    opsi: ['Membranofon', 'Aerofon', 'Kordofon', 'Idiofon'],
    jawaban: 2
  },
  {
    id: 'q3_3',
    kelas: 3,
    materi: 'Tangga Nada',
    pertanyaan: 'Tangga nada diatonis mayor memiliki susunan interval jarak nada...',
    opsi: ['1 - 1 - 1/2 - 1 - 1 - 1 - 1/2', '1 - 1/2 - 1 - 1 - 1/2 - 1 - 1', '1/2 - 1 - 1 - 1 - 1/2 - 1 - 1', '1 - 1 - 1 - 1/2 - 1 - 1 - 1/2'],
    jawaban: 0
  },
  {
    id: 'q3_4',
    kelas: 3,
    materi: 'Dinamika Musik',
    pertanyaan: 'Tanda dinamika "Forte" (f) dalam musik berarti lagu dinyanyikan atau dimainkan dengan...',
    opsi: ['Sangat Lembut', 'Lembut', 'Nyaring / Keras', 'Sangat Keras'],
    jawaban: 2
  },
  {
    id: 'q3_5',
    kelas: 3,
    materi: 'Alat Musik Tradisional',
    pertanyaan: 'Angklung merupakan alat musik tradisional asal Jawa Barat yang dimainkan dengan cara...',
    opsi: ['Dipetik', 'Digoyangkan', 'Ditiup', 'Dipukul'],
    jawaban: 1
  }
];

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

