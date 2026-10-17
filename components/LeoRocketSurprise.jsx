import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLang } from '../lib/LangContext';

const KONAMI = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];

function playLaunchSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t0);
    osc.frequency.exponentialRampToValueAtTime(880, t0 + 1.4);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + 1.9);
    [880, 1174, 1568, 2093].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t = t0 + 1.2 + i * 0.14;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.4);
    });
    setTimeout(() => { try { ctx.close(); } catch {} }, 3500);
  } catch {}
}

export default function LeoRocketSurprise() {
  const langHook = useLang();
  const lang = langHook.lang || 'fr';
  const isEn = lang === 'en';
  const [phase, setPhase] = useState('idle');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const launch = useCallback(() => {
    setCopied(false);
    try { sessionStorage.setItem('leo_rocket_seen', '1'); } catch {}
    try { console.log('%cFUSEE10 : -10% !', 'font-weight:bold;color:#4f46e5'); } catch {}
    playLaunchSound();
    setPhase('flying');
    setTimeout(() => setPhase('reward'), 2600);
  }, []);

  useEffect(() => {
    if (phase !== 'flying' && phase !== 'reward') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const stars = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5, s: Math.random() * 1.5 + 0.4,
      tw: Math.random() * 6.28,
    }));
    const colors = ['#FFD54F','#E8442E','#4F46E5','#22C55E','#EC4899','#38BDF8','#F59E0B'];
    const confs = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 400,
      w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
      c: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 3.5, vx: -1.5 + Math.random() * 3,
      rot: Math.random() * 3, vr: -0.15 + Math.random() * 0.3,
    }));
    const start = performance.now();
    function draw(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, 'rgba(15,10,60,0.96)');
      g.addColorStop(0.6, 'rgba(49,46,129,0.94)');
      g.addColorStop(1, 'rgba(30,27,75,0.96)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      stars.forEach((st) => {
        st.y += st.s; st.tw += 0.08;
        if (st.y > canvas.height) { st.y = -5; st.x = Math.random() * canvas.width; }
        ctx.globalAlpha = 0.4 + Math.abs(Math.sin(st.tw)) * 0.6;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.28); ctx.fill();
      });
      ctx.globalAlpha = 1;
      confs.forEach((p) => {
        p.y += p.vy; p.x += p.vx + Math.sin(p.y / 40); p.rot += p.vr;
        if (p.y > canvas.height + 30) { p.y = -30; p.x = Math.random() * canvas.width; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * 0.6);
        ctx.restore();
      });
      const t = Math.min(1, elapsed / 2400);
      const ease = 1 - Math.pow(1 - t, 3);
      const rx = canvas.width / 2 + Math.sin(elapsed / 300) * 40;
      const ry = canvas.height + 80 - ease * (canvas.height + 220);
      const flame = ctx.createLinearGradient(0, ry, 0, ry + 90);
      flame.addColorStop(0, 'rgba(255,200,60,0.95)');
      flame.addColorStop(0.5, 'rgba(249,115,22,0.7)');
      flame.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(rx - 14, ry + 10);
      ctx.lineTo(rx + 14, ry + 10);
      ctx.lineTo(rx, ry + 80 + Math.random() * 30);
      ctx.closePath(); ctx.fill();
      ctx.font = '64px serif'; ctx.textAlign = 'center';
      ctx.fillText(String.fromCodePoint(0x1F680), rx, ry);
      if (t < 1) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillText(isEn ? 'To the stars, Leo!' : 'Vers les etoiles, Leo !', rx, Math.max(60, ry - 60));
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', onResize); };
  }, [phase, isEn]);

  useEffect(() => {
    let buf = [];
    let clicks = 0; let timer = null;
    const onKey = (e) => {
      const k = (e.key || '').toLowerCase();
      buf.push(k); buf = buf.slice(-KONAMI.length);
      if (buf.join(',') === KONAMI.join(',')) launch();
    };
    const onLogo = () => {
      clicks += 1;
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 1200);
      if (clicks >= 5) { clicks = 0; launch(); }
    };
    const auto = setTimeout(() => {
      try {
        if (!sessionStorage.getItem('leo_rocket_seen')) launch();
      } catch { launch(); }
    }, 25000);
    window.addEventListener('keydown', onKey);
    window.addEventListener('leo:logo-click', onLogo);
    window.__launchLeoRocket = launch;
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('leo:logo-click', onLogo);
      clearTimeout(auto); clearTimeout(timer);
      try { delete window.__launchLeoRocket; } catch {}
    };
  }, [launch]);

  const close = () => { setPhase('idle'); try { cancelAnimationFrame(rafRef.current); } catch {} };
  const copyCode = async () => {
    try { await navigator.clipboard.writeText('FUSEE10'); } catch {}
    setCopied(true);
  };
  if (phase === 'idle') return null;
  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Surprise Leo">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {phase === 'reward' && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="leo-pop bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border-4 border-yellow-300 relative">
            <button onClick={close} aria-label="Fermer"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold transition">X</button>
            <div className="text-5xl mb-2">Celebration ! Fusée !</div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
              {isEn ? 'Secret discovered!' : 'Secret decouvert !'}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {isEn ? 'You found Leo rocket. Your explorer reward:' : 'Tu as trouve la Fusee-Carton de Leo. Ta recompense :'}
            </p>
            <button onClick={copyCode}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black tracking-widest text-xl py-4 rounded-2xl border-2 border-dashed border-white/50 transition active:scale-95">
              FUSEE10
              <span className="block text-xs font-semibold opacity-80 mt-1">
                {copied ? (isEn ? 'Copied!' : 'Copie !') : (isEn ? '-10% : click to copy' : '-10% : cliquer pour copier')}
              </span>
            </button>
            <p className="text-xs text-slate-400 mt-3 mb-5">
              {isEn ? 'Valid on books, packs and combo.' : 'Valable sur livres, packs et combo.'}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <a href="/pack" className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold py-3 rounded-xl text-sm transition active:scale-95">
                {isEn ? 'See the Pack' : 'Voir le Pack'}
              </a>
              <button onClick={close} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition active:scale-95">
                {isEn ? 'Keep exploring' : 'Continuer'}
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-4">Astuce : Konami haut haut bas bas gauche droite gauche droite B A</p>
          </div>
        </div>
      )}
      <style jsx>{'.leo-pop{animation:leoPop .5s cubic-bezier(.34,1.56,.64,1);}@keyframes leoPop{from{opacity:0;transform:scale(.7) translateY(30px);}to{opacity:1;transform:scale(1) translateY(0);}}'}</style>
    </div>
  );
}

