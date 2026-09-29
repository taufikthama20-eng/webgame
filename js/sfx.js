/* ---------------- Sanggar Budaya — SFX (Sound Effects Engine) ---------------- */

let audioCtx = null;
let sfxMuted = localStorage.getItem('sanggar_sfx_muted') === 'true';

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

/**
 * Mobile Web Audio API Unlocker
 * HP (Android & iOS Safari) memblokir efek suara Web Audio API kecuali jika sudah di-unlock lewat sentuhan/tap pertama pengguna.
 */
function initAudioUnlock() {
    const unlock = () => {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
        if (ctx && ctx.state === 'running') {
            try {
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);
            } catch (e) { }
            ['touchstart', 'touchend', 'mousedown', 'click'].forEach(evt => {
                document.removeEventListener(evt, unlock, true);
            });
        }
    };
    ['touchstart', 'touchend', 'mousedown', 'click'].forEach(evt => {
        document.addEventListener(evt, unlock, true);
    });
}

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initAudioUnlock);
    initAudioUnlock();
}

function isSfxMuted() {
    return sfxMuted;
}

function toggleSfxMute() {
    sfxMuted = !sfxMuted;
    localStorage.setItem('sanggar_sfx_muted', sfxMuted ? 'true' : 'false');
    return sfxMuted;
}

/**
 * 1. Suara Benar: Chime Ceria & Shimmering Bell (C5 -> E5 -> G5 -> C6 + Glitter Harps)
 */
function playSfxCorrect() {
    if (sfxMuted) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.35, now);
        masterGain.connect(ctx.destination);

        // Arpeggio nada utama (C5, E5, G5, C6)
        const notes = [
            { freq: 523.25, time: 0.00, dur: 0.25 }, // C5
            { freq: 659.25, time: 0.07, dur: 0.25 }, // E5
            { freq: 783.99, time: 0.14, dur: 0.28 }, // G5
            { freq: 1046.50, time: 0.22, dur: 0.50 } // C6
        ];

        notes.forEach(({ freq, time, dur }, index) => {
            const start = now + time;

            // Nada Utama (Sine/Triangle blend for warm bell)
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = index === notes.length - 1 ? 'triangle' : 'sine';

            // Pop attack: pitch slight glide down for attack punch
            osc.frequency.setValueAtTime(freq * 1.05, start);
            osc.frequency.exponentialRampToValueAtTime(freq, start + 0.03);

            const vol = index === notes.length - 1 ? 0.4 : 0.3;
            gain.gain.setValueAtTime(0.001, start);
            gain.gain.linearRampToValueAtTime(vol, start + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(start);
            osc.stop(start + dur);

            // Shimmer Layer (Octave Higher Sparkle)
            const sparkleOsc = ctx.createOscillator();
            const sparkleGain = ctx.createGain();
            sparkleOsc.type = 'sine';
            sparkleOsc.frequency.setValueAtTime(freq * 2, start);

            sparkleGain.gain.setValueAtTime(0.001, start);
            sparkleGain.gain.linearRampToValueAtTime(0.12, start + 0.01);
            sparkleGain.gain.exponentialRampToValueAtTime(0.001, start + (dur * 0.7));

            sparkleOsc.connect(sparkleGain);
            sparkleGain.connect(masterGain);
            sparkleOsc.start(start);
            sparkleOsc.stop(start + dur);
        });
    } catch (e) {
        console.warn("SFX error:", e);
    }
}

/**
 * 2. Suara Salah: Bouncy "Uh-Oh" pitch slide (Filtered Triangle/Saw pitch sweep down)
 */
function playSfxWrong() {
    if (sfxMuted) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.3, now);

        // Lowpass filter agar tidak cempreng/bising
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.45);

        filter.connect(ctx.destination);
        masterGain.connect(filter);

        // Nada 1: "Uh" (Eb4 -> C4 pitch slide)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(311.13, now); // Eb4
        osc1.frequency.exponentialRampToValueAtTime(261.63, now + 0.15); // C4

        gain1.gain.setValueAtTime(0.001, now);
        gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(now);
        osc1.stop(now + 0.16);

        // Nada 2: "Oh" (Bb3 -> G3 pitch slide) - Nada lebih rendah & sedikit 'wobble'
        const start2 = now + 0.15;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(233.08, start2); // Bb3
        osc2.frequency.exponentialRampToValueAtTime(174.61, start2 + 0.28); // F3

        gain2.gain.setValueAtTime(0.001, start2);
        gain2.gain.linearRampToValueAtTime(0.4, start2 + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, start2 + 0.32);

        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(start2);
        osc2.stop(start2 + 0.32);

    } catch (e) {
        console.warn("SFX error:", e);
    }
}

/**
 * 3. Suara Timer Urgent: Wooden Click / Snap percussive
 */
function playSfxTick() {
    if (sfxMuted) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        // Rapid pitch drop untuk efek 'woodblock / click'
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.035);
    } catch (e) {
        console.warn("SFX error:", e);
    }
}

/**
 * 4. Suara Fanfare Kuis Selesai: Grand Victory Fanfare & Celebration Chords
 * (Brass Arpeggio + Triumph Chords + Star Sparkle Glitter Cascade)
 */
function playSfxFanfare() {
    if (sfxMuted) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.3, now);
        masterGain.connect(ctx.destination);

        // Sequence Fanfare:
        // Phase 1: Intro Arp (C5 -> E5 -> G5)
        // Phase 2: Chord F Major (F5, A5, C6)
        // Phase 3: Chord G Major (G5, B5, D6)
        // Phase 4: Grand Victory Chord C Major (C4, C5, E5, G5, C6, E6) + Sparkle Burst!

        const introNotes = [
            { freq: 523.25, time: 0.00, dur: 0.12 }, // C5
            { freq: 659.25, time: 0.10, dur: 0.12 }, // E5
            { freq: 783.99, time: 0.20, dur: 0.15 }  // G5
        ];

        introNotes.forEach(({ freq, time, dur }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + time);
            gain.gain.setValueAtTime(0.25, now + time);
            gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now + time);
            osc.stop(now + time + dur);
        });

        // Function helper untuk memainkan Chord Harmoni
        const playChord = (freqs, startTime, duration, type = 'triangle') => {
            freqs.forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, now + startTime);

                const vol = 0.25 / freqs.length;
                gain.gain.setValueAtTime(0.001, now + startTime);
                gain.gain.linearRampToValueAtTime(vol, now + startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + startTime + duration);

                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(now + startTime);
                osc.stop(now + startTime + duration);
            });
        };

        // Phase 2: F Major (0.32s)
        playChord([698.46, 880.00, 1046.50], 0.32, 0.22, 'triangle');

        // Phase 3: G Major (0.55s)
        playChord([783.99, 987.77, 1174.66], 0.55, 0.25, 'triangle');

        // Phase 4: Grand Victory Chord C Major (0.82s - 2.0s)
        const victoryChord = [261.63, 523.25, 659.25, 783.99, 1046.50, 1318.51]; // C4, C5, E5, G5, C6, E6
        playChord(victoryChord, 0.82, 1.25, 'triangle');

        // Brass sub-octave warmth for final chord
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(130.81, now + 0.82); // C3
        bassGain.gain.setValueAtTime(0.001, now + 0.82);
        bassGain.gain.linearRampToValueAtTime(0.2, now + 0.85);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        bassOsc.connect(bassGain);
        bassGain.connect(masterGain);
        bassOsc.start(now + 0.82);
        bassOsc.stop(now + 2.0);

        // Sparkle Glitter Cascade (Stars falling effect over final chord)
        const glitterNotes = [
            { freq: 2093.00, time: 0.90 }, // C7
            { freq: 2637.02, time: 1.02 }, // E7
            { freq: 3135.96, time: 1.14 }, // G7
            { freq: 4186.01, time: 1.26 }, // C8
            { freq: 3135.96, time: 1.40 }, // G7
            { freq: 2637.02, time: 1.55 }  // E7
        ];

        glitterNotes.forEach(({ freq, time }) => {
            const gOsc = ctx.createOscillator();
            const gGain = ctx.createGain();
            gOsc.type = 'sine';
            gOsc.frequency.setValueAtTime(freq, now + time);

            gGain.gain.setValueAtTime(0.001, now + time);
            gGain.gain.linearRampToValueAtTime(0.08, now + time + 0.01);
            gGain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.25);

            gOsc.connect(gGain);
            gGain.connect(masterGain);
            gOsc.start(now + time);
            gOsc.stop(now + time + 0.25);
        });

    } catch (e) {
        console.warn("SFX error:", e);
    }
}

/**
 * 5. Canvas Confetti System (Visual Celebration Cannon)
 */
function triggerConfetti() {
    try {
        let canvas = document.getElementById('confettiCanvas');
        if (canvas) canvas.remove();

        canvas = document.createElement('canvas');
        canvas.id = 'confettiCanvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '99999';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        let width = (canvas.width = window.innerWidth * dpr);
        let height = (canvas.height = window.innerHeight * dpr);

        const colors = [
            '#f7bb43', '#e8874a', '#4fb6a8', '#9b7ede',
            '#7fc97f', '#ff6b81', '#ffffff', '#ffd700', '#2ed573'
        ];

        const particleCount = 160;
        const particles = [];

        // Center Radial Burst Point (Tengah Layar)
        const centerX = width * 0.5;
        const centerY = height * 0.42;

        const createBurst = (count, cx, cy, speedMin, speedMax, delayMs = 0) => {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = (Math.random() * (speedMax - speedMin) + speedMin) * dpr;
                particles.push({
                    x: cx,
                    y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    gravity: 0.22 * dpr,
                    friction: 0.962,
                    rotation: Math.random() * 360,
                    rotSpeed: (Math.random() - 0.5) * 16,
                    size: (Math.random() * 9 + 5) * dpr,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    shape: Math.random() > 0.35 ? 'star' : (Math.random() > 0.5 ? 'circle' : 'rect'),
                    opacity: 1,
                    decay: Math.random() * 0.008 + 0.005,
                    delay: delayMs
                });
            }
        };

        // Burst 1: Ledakan Utama dari Tengah (360 derajat)
        createBurst(150, centerX, centerY, 8, 24, 0);

        // Burst 2: Ledakan Sekunder 200ms Kemudian (Sparkle Crown)
        createBurst(80, centerX, centerY - (30 * dpr), 6, 18, 200);

        let animationFrameId;
        const startTime = Date.now();
        const maxDuration = 3800; // 3.8 detik

        function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.fill();
        }

        function animate() {
            const elapsed = Date.now() - startTime;
            if (elapsed > maxDuration || particles.every(p => p.opacity <= 0 || p.y > height + 50)) {
                if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
                cancelAnimationFrame(animationFrameId);
                return;
            }

            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                if (elapsed < (p.delay || 0)) return;

                p.vx *= p.friction;
                p.vy *= p.friction;
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotSpeed;

                if (elapsed > 2000) {
                    p.opacity -= p.decay * 1.5;
                }

                if (p.opacity <= 0) return;

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);

                ctx.fillStyle = p.color;
                if (p.shape === 'rect') {
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
                } else if (p.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
                }
                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(animate);
        }

        animate();
    } catch (e) {
        console.warn("Confetti error:", e);
    }
}


