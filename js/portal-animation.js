/* ==========================================
   CINEMATIC 5-SECOND STUDENT PORTAL CONTROLLER
   3D Storybook Unfold & Galaxy Orbit (5s Duration)
   ========================================== */

function playStudentPortalSequence(btnEl, onComplete) {
    // Step 1: Button click compression feedback
    if (btnEl) {
        btnEl.classList.add('btn-pressed');
        setTimeout(() => btnEl.classList.remove('btn-pressed'), 300);
    }

    // Play audio pop & Gamelan Gong Portal Sound Theme (5 Seconds)
    if (typeof playSfxPortalTheme === 'function') {
        playSfxPortalTheme();
    } else if (typeof playSfxPop === 'function') {
        playSfxPop();
    }

    // Remove existing overlay if any
    const oldOverlay = document.getElementById('studentPortalOverlay');
    if (oldOverlay) oldOverlay.remove();

    // Create Portal Fullscreen Overlay Container
    const overlay = document.createElement('div');
    overlay.id = 'studentPortalOverlay';
    overlay.className = 'portal-overlay';

    // Step 2: 3D Storybook Cover Unfold Wings
    const wings = document.createElement('div');
    wings.className = 'portal-book-wings';
    wings.innerHTML = `
    <div class="portal-wing-left"></div>
    <div class="portal-wing-right"></div>
  `;
    overlay.appendChild(wings);

    // Step 3: Radial Light Glow Burst
    const glow = document.createElement('div');
    glow.className = 'portal-radial-glow';
    overlay.appendChild(glow);

    // Step 4: Swirling Galaxy Orbit Cultural Icons
    const orbitContainer = document.createElement('div');
    orbitContainer.className = 'portal-icon-orbit';

    const culturalIcons = [
        { icon: '📖', label: 'Buku Seni' },
        { icon: '🎨', label: 'Kuas Melukis' },
        { icon: '🎵', label: 'Notasi Musik' },
        { icon: '🎭', label: 'Topeng Tari' },
        { icon: '✏️', label: 'Sketsa Gambar' },
        { icon: '🌟', label: 'Bintang Prestasi' },
        { icon: '🚀', label: 'Semangat Belajar' },
        { icon: '💃', label: 'Seni Tari' }
    ];

    const radius = 220; // Radius in pixels for galaxy ring
    culturalIcons.forEach((item, index) => {
        const angle = (index / culturalIcons.length) * (Math.PI * 2);
        const ox = Math.round(Math.cos(angle) * radius) + 'px';
        const oy = Math.round(Math.sin(angle) * radius) + 'px';
        const itemRot = (index * 45) + 'deg';

        const itemEl = document.createElement('div');
        itemEl.className = 'portal-orbit-item';
        itemEl.innerText = item.icon;
        itemEl.style.setProperty('--ox', ox);
        itemEl.style.setProperty('--oy', oy);
        itemEl.style.setProperty('--itemRot', itemRot);

        orbitContainer.appendChild(itemEl);
    });

    overlay.appendChild(orbitContainer);

    // Step 5: Shimmer Motto & Subtitle Badge + Loading Bar
    const content = document.createElement('div');
    content.className = 'portal-content';
    content.innerHTML = `
    <h2 class="portal-motto-shimmer">Siap Mengasah Kesenian? ✨</h2>
    <div class="portal-submotto-badge">
      <span>Mari Jelajahi Kekayaan Seni &amp; Budaya Nusantara! 🇮🇩</span>
    </div>
    <div class="portal-loading-container">
      <div class="portal-loading-bar">
        <div class="portal-loading-fill"></div>
      </div>
      <div class="portal-loading-text">Menyiapkan Ruang Belajar Sanggar Budaya...</div>
    </div>
  `;
    overlay.appendChild(content);

    document.body.appendChild(overlay);

    // Activate CSS animations
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });

    // Step 6: 5-Second Cinematic Dissolve & Seamless Transition
    // Ganti tampilan di bawah overlay TERLEBIH DAHULU agar tidak ada kilatan (flicker) halaman awal
    setTimeout(() => {
        if (typeof onComplete === 'function') {
            onComplete();
        }
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 400);
    }, 4500);
}
