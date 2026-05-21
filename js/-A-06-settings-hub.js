// js/settings-hub.js · A0nynx_3i Settings Hub
// 依赖：chat-app.js 已加载（共享 SFX 引擎和 localStorage）

(function () {
    'use strict';

    /* ══════════════════════════════════════
       音效引擎（独立，与 chat-app 共享配置）
    ══════════════════════════════════════ */
    let _ac = null;
    function ac() {
        if (!_ac) {
            try { _ac = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' }); } catch(e) {}
        }
        return _ac;
    }

    function unlockAudio() {
        var c = ac();
        if (!c) return;
        var tryPlay = function() {
            try {
                var buf = c.createBuffer(1, 1, c.sampleRate);
                var src = c.createBufferSource();
                src.buffer = buf;
                src.connect(c.destination);
                src.start(0);
            } catch(e) {}
        };
        if (c.state === 'suspended') {
            c.resume().then(tryPlay).catch(function(){});
        } else {
            tryPlay();
        }
    }
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('mousedown', unlockAudio);

    function getVol() { return parseFloat(localStorage.getItem('sh-master-vol') || '0.7'); }
    let hapticOn = localStorage.getItem('sh-haptic') !== 'false';

    function tone(f, d, t, v, dl) {
        const c = ac(), T = c.currentTime + (dl || 0), curVol = getVol();
        const o = c.createOscillator(), g = c.createGain();
        o.type = t || 'sine';
        o.frequency.setValueAtTime(f, T);
        g.gain.setValueAtTime(0, T);
        g.gain.linearRampToValueAtTime((v || 0.2) * curVol, T + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, T + d);
        o.connect(g); g.connect(c.destination);
        o.start(T); o.stop(T + d + 0.05);
    }
    function sweep(f1, f2, d, t, v, dl) {
        const c = ac(), T = c.currentTime + (dl || 0), curVol = getVol();
        const o = c.createOscillator(), g = c.createGain();
        o.type = t || 'sine';
        o.frequency.setValueAtTime(f1, T);
        o.frequency.exponentialRampToValueAtTime(f2, T + d);
        g.gain.setValueAtTime(0, T);
        g.gain.linearRampToValueAtTime((v || 0.2) * curVol, T + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, T + d);
        o.connect(g); g.connect(c.destination);
        o.start(T); o.stop(T + d + 0.05);
    }
    function noise(d, v, dl, ff) {
        const c = ac(), T = c.currentTime + (dl || 0), curVol = getVol();
        const buf = c.createBuffer(1, c.sampleRate * d, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource(); src.buffer = buf;
        const g = c.createGain();
        g.gain.setValueAtTime(0, T);
        g.gain.linearRampToValueAtTime((v || 0.1) * curVol, T + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, T + d);
        if (ff) {
            const f = c.createBiquadFilter();
            f.type = 'bandpass'; f.frequency.value = ff; f.Q.value = 1;
            src.connect(f); f.connect(g);
        } else { src.connect(g); }
        g.connect(c.destination);
        src.start(T); src.stop(T + d);
    }

    /* ══════════════════════════════════════
       完整音效库（31个）
    ══════════════════════════════════════ */
    const SFX = {
        'Whoosh':    () => { sweep(800,200,0.2,'sine',0.15); noise(0.15,0.04,0,2000); },
        'Pop':       () => { sweep(400,1000,0.08,'sine',0.25); tone(1200,0.05,'sine',0.1,0.03); },
        'Tick':      () => { tone(2000,0.04,'square',0.08); tone(1500,0.03,'sine',0.12,0.02); },
        'Swoosh':    () => { sweep(600,100,0.3,'triangle',0.12); noise(0.25,0.03,0,1500); },
        'Sparkle':   () => { tone(1800,0.1,'sine',0.15); tone(2400,0.08,'sine',0.12,0.05); tone(3000,0.06,'sine',0.08,0.1); },
        'Crystal':   () => { tone(1047,0.15,'sine',0.2); tone(1319,0.12,'sine',0.15,0.04); tone(1568,0.1,'sine',0.1,0.08); },
        'Ding':      () => { tone(1760,0.3,'sine',0.2); tone(2637,0.25,'sine',0.12,0.02); },
        'Bubble':    () => { sweep(200,800,0.12,'sine',0.2); tone(600,0.08,'sine',0.1,0.1); },
        'Chime':     () => { tone(1047,0.4,'sine',0.15); tone(1319,0.4,'sine',0.12,0.06); tone(1568,0.4,'sine',0.1,0.12); },
        'Soft':      () => { sweep(400,800,0.2,'sine',0.15); },
        'Glow':      () => { tone(880,0.25,'sine',0.18); tone(1320,0.2,'triangle',0.08,0.05); },
        'Drop':      () => { sweep(1200,400,0.1,'sine',0.2); tone(300,0.15,'sine',0.1,0.08); },
        'Click':     () => { tone(1500,0.03,'square',0.12); },
        'Tap':       () => { tone(800,0.05,'sine',0.15); },
        'Digital':   () => { tone(2000,0.02,'square',0.1); tone(2500,0.02,'square',0.08,0.015); },
        'Wood':      () => { sweep(400,200,0.08,'triangle',0.2); },
        'Blip':      () => { sweep(1000,1600,0.05,'square',0.1); },
        'Success':   () => { tone(784,0.1,'sine',0.2); tone(988,0.1,'sine',0.2,0.08); tone(1319,0.15,'sine',0.2,0.16); },
        'Error':     () => { tone(300,0.15,'sawtooth',0.15); tone(260,0.15,'sawtooth',0.15,0.12); },
        'Saved':     () => { tone(1000,0.08,'sine',0.15); tone(1500,0.12,'sine',0.15,0.06); },
        'Switch':    () => { sweep(400,1200,0.15,'triangle',0.15); },
        'Unlock':    () => { tone(800,0.05,'square',0.1); tone(1200,0.05,'square',0.1,0.05); sweep(1200,2000,0.15,'sine',0.15,0.1); },
        'Magic':     () => { sweep(400,1600,0.4,'sine',0.12); tone(2000,0.3,'sine',0.06,0.15); tone(2400,0.2,'sine',0.05,0.25); },
        'Paper':     () => { noise(0.3,0.08,0,3000); noise(0.2,0.06,0.1,2000); },
        'Glass':     () => { tone(2093,0.5,'sine',0.1); tone(2637,0.5,'sine',0.08,0.05); tone(3136,0.4,'sine',0.05,0.1); },
        'Shimmer':   () => { for(let i=0;i<8;i++) tone(1500+Math.random()*2000,0.15,'sine',0.05,i*0.04); },
        'LongPress': () => { sweep(200,600,0.25,'sine',0.15); },
        'Delete':    () => { sweep(800,100,0.3,'sawtooth',0.15); noise(0.2,0.05,0,500); },
        'Pin':       () => { tone(1200,0.1,'sine',0.2); tone(1800,0.15,'sine',0.15,0.06); },
        'Typing':    () => { tone(1200+Math.random()*400,0.03,'square',0.06); },
        'Read':      () => { tone(2000,0.05,'sine',0.12); tone(2400,0.08,'sine',0.1,0.04); },
    };

    const GROUPS = [
        { label: '01 · Send Message',    keys: ['Whoosh','Pop','Tick','Swoosh','Sparkle','Crystal'] },
        { label: '02 · Receive Message', keys: ['Ding','Bubble','Chime','Soft','Glow','Drop'] },
        { label: '03 · Interaction',     keys: ['Click','Tap','Digital','Wood','Blip'] },
        { label: '04 · System',          keys: ['Success','Error','Saved','Switch','Unlock'] },
        { label: '05 · Ambient',         keys: ['Magic','Paper','Glass','Shimmer'] },
        { label: '06 · Special',         keys: ['LongPress','Delete','Pin','Typing','Read'] },
    ];

    /* ══════════════════════════════════════
       音效配置 localStorage 读写
       key: sh-sfx-{mapId}
    ══════════════════════════════════════ */
    const SFX_KEYS = ['map-send','map-recv','map-typing','map-tap','map-long','map-delete','map-success','map-switch'];

    function loadSfxConfig() {
        const cfg = {};
        SFX_KEYS.forEach(k => {
            cfg[k] = localStorage.getItem('sh-sfx-' + k) || null;
        });
        return cfg;
    }

    function saveSfxKey(mapId, val) {
        if (val === null) {
            localStorage.removeItem('sh-sfx-' + mapId);
        } else {
            localStorage.setItem('sh-sfx-' + mapId, val);
        }
        /* 通知 chat-app 刷新 */
        window.dispatchEvent(new CustomEvent('sh-sfx-updated'));
    }

    /* ══════════════════════════════════════
       公共播放接口（供 chat-app.js 调用）
    ══════════════════════════════════════ */
    function shPlaySfx(sfxFn) {
        var c = ac();
        if (!c || c.state === 'closed') return;
        var doPlay = function() { try { sfxFn(); } catch(e) {} };
        if (c.state === 'running') {
            doPlay();
        } else {
            c.resume().then(doPlay).catch(function(){});
        }
    }

    window.SH = {
        play: function (mapId) {
            var key = localStorage.getItem('sh-sfx-' + mapId);
            if (key && SFX[key]) shPlaySfx(SFX[key]);
        },
        playKey: function (key) {
            if (key && SFX[key]) shPlaySfx(SFX[key]);
        },
        getMasterVol: function () { return getVol(); },
        isHaptic: function () { return localStorage.getItem('sh-haptic') !== 'false'; },
        vibrate: function (ms) {
            if (this.isHaptic() && window.navigator.vibrate) window.navigator.vibrate(ms || 8);
        },
        unlockNow: function () { unlockAudio(); }
    };

    /* ══════════════════════════════════════
       构建 Hub HTML
    ══════════════════════════════════════ */
    function buildHub() {
        const el = document.createElement('div');
        el.id = 'settingsHub';
        el.innerHTML = `
<style>
#settingsHub {
    position: fixed; inset: 0;
    background: #FFFFFF;
    z-index: 9998;
    display: flex; flex-direction: column;
    opacity: 0; visibility: hidden; pointer-events: none;
    font-family: 'Space Grotesk', sans-serif;
    max-width: 430px; margin: 0 auto;
    transform: translateZ(0);
}
#settingsHub.active {
    visibility: visible; pointer-events: auto;
    animation: sh-clip-reveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
#settingsHub.closing {
    pointer-events: none;
    animation: sh-clip-hide 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes sh-clip-reveal {
    0% { opacity: 0; clip-path: inset(40% 15% 40% 15% round 32px); transform: scale(0.96) translateZ(0); }
    100% { opacity: 1; clip-path: inset(0% 0% 0% 0% round 0px); transform: scale(1) translateZ(0); }
}
@keyframes sh-clip-hide {
    0% { opacity: 1; clip-path: inset(0% 0% 0% 0% round 0px); transform: scale(1) translateZ(0); }
    100% { opacity: 0; clip-path: inset(40% 15% 40% 15% round 32px); transform: scale(0.96) translateZ(0); visibility: hidden; }
}
@media (min-width: 431px) {
    #settingsHub {
        border-radius: 40px; height: 90vh; max-height: 850px;
        top: 50%; left: 50%; bottom: auto; right: auto;
        transform: translate(-50%, -50%) translateZ(0);
        border: 8px solid #FFF;
        box-shadow: 0 40px 100px rgba(0,0,0,0.15);
    }
    @keyframes sh-clip-reveal {
        0% { opacity: 0; clip-path: inset(40% 15% 40% 15% round 32px); transform: translate(-50%, -50%) scale(0.96) translateZ(0); }
        100% { opacity: 1; clip-path: inset(0% 0% 0% 0% round 40px); transform: translate(-50%, -50%) scale(1) translateZ(0); }
    }
    @keyframes sh-clip-hide {
        0% { opacity: 1; clip-path: inset(0% 0% 0% 0% round 40px); transform: translate(-50%, -50%) scale(1) translateZ(0); }
        100% { opacity: 0; clip-path: inset(40% 15% 40% 15% round 32px); transform: translate(-50%, -50%) scale(0.96) translateZ(0); visibility: hidden; }
    }
}

/* 变量 */
#settingsHub {
    --bg: #FFFFFF; --surface: #F2F2F2; --ink: #151515;
    --red: #A63426; --line: rgba(21,21,21,0.06);
    --line-faint: rgba(21,21,21,0.03); --meta: rgba(21,21,21,0.4);
    --mono: 'Share Tech Mono', monospace;
}

/* 水印 */
#sh-watermark {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    font-family: 'Playfair Display', serif;
    font-weight: 700; font-style: italic; font-size: 140px;
    color: rgba(21,21,21,0.025); pointer-events: none; z-index: 7;
    white-space: nowrap; transition: opacity 0.4s;
}

/* Header */
#sh-header {
    padding: 60px 32px 15px; background: #fff;
    z-index: 10; position: relative;
}
.sh-plaque {
    display: inline-flex; align-items: center;
    padding: 4px 12px; border: 1px solid var(--ink);
    border-radius: 50px; gap: 8px;
}
.sh-plaque-dot { width: 6px; height: 6px; background: var(--red); border-radius: 50%; }
.sh-plaque-text { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
.sh-title-area { margin-top: 20px; position: relative; }
.sh-page-title { font-family: 'Playfair Display', serif; font-style: italic; font-size: 44px; line-height: 1; }
.sh-page-title span { color: var(--red); }
.sh-page-sub { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: var(--meta); text-transform: uppercase; margin-top: 8px; }
.sh-back {
    position: absolute; top: 62px; right: 32px;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(21,21,21,0.05); border: 1px solid rgba(21,21,21,0.08);
    display: flex; justify-content: center; align-items: center;
    cursor: pointer; transition: transform .2s;
}
.sh-back:active { transform: scale(.84); }
.sh-back svg { width: 15px; height: 15px; stroke: var(--ink); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

/* Viewport */
#sh-viewport {
    flex: 1; overflow-y: auto; padding: 10px 32px 120px;
    position: relative; z-index: 5; -webkit-overflow-scrolling: touch;
}
#sh-viewport::-webkit-scrollbar { display: none; }

/* Section */
.sh-section { display: none; position: relative; }
.sh-section.active { display: block; }
.sh-section.anim-in { animation: shFadeIn 0.4s ease-out; }
@keyframes shFadeIn { from { opacity: 0; } to { opacity: 1; } }

/* 胶囊卡片容器 */
.sh-card {
    background: #FFFFFF;
    border: 1px solid var(--line);
    border-radius: 32px;
    padding: 0 24px;
    margin-bottom: 28px;
    box-shadow: 0 12px 40px -12px rgba(21,21,21,0.05);
    position: relative;
    z-index: 5;
}
.sh-card .sh-row:last-child { border-bottom: none; }
.sh-card .sh-api-expand-row:last-of-type { border-bottom: none; }

/* 签名 */
.sh-sig {
    font-family: 'Great Vibes', cursive; font-size: 52px;
    color: var(--red); opacity: 0.08; position: absolute;
    pointer-events: none; line-height: 1; z-index: 8;
}
.sh-sig-tr { top: 10px; right: -8px; transform: rotate(-8deg); }
.sh-sig-bl { bottom: 60px; left: -8px; transform: rotate(-12deg); font-size: 40px; }

/* Group label */
.sh-group-label {
    font-size: 10px; font-weight: 700; letter-spacing: 2px;
    color: var(--red); text-transform: uppercase;
    margin: 35px 0 12px; display: flex; align-items: center; gap: 10px;
}
.sh-group-label::after { content: ''; flex: 1; height: 1px; background: var(--line); }

/* Row */
.sh-row { display: flex; flex-direction: column; padding: 20px 0; border-bottom: 1px solid var(--line); }
.sh-row:last-child { border-bottom: none; }
.sh-row-top { display: flex; align-items: center; justify-content: space-between; }
.sh-row-info { flex: 1; padding-right: 12px; }
.sh-row-name { font-size: 15px; font-weight: 700; }
.sh-row-cn { font-size: 10px; color: var(--meta); margin-top: 2px; }
.sh-control { display: flex; align-items: center; gap: 10px; }

/* Plain select */
.sh-plain-select {
    -webkit-appearance: none; background: var(--surface); border: none;
    padding: 10px 14px; border-radius: 12px; font-family: inherit;
    font-size: 12px; font-weight: 700; outline: none; cursor: pointer;
    min-width: 110px; text-align: center;
}

/* Toggle */
.sh-toggle { width: 42px; height: 24px; background: #E0E0E0; border-radius: 20px; position: relative; transition: .3s; cursor: pointer; }
.sh-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: .3s; }
.sh-toggle.on { background: var(--ink); }
.sh-toggle.on::after { transform: translateX(18px); }

/* Slider */
.sh-slider { -webkit-appearance: none; width: 90px; height: 4px; background: var(--line); border-radius: 2px; outline: none; }
.sh-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: var(--ink); border-radius: 50%; cursor: pointer; }

/* SFX Trigger */
.sh-sfx-trigger {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface); padding: 10px 14px;
    border-radius: 12px; cursor: pointer; transition: background 0.2s; user-select: none;
}
.sh-sfx-trigger:active { background: #E8E8E8; }
.sh-sfx-trigger-name { font-size: 12px; font-weight: 700; min-width: 60px; text-align: center; color: var(--meta); }
.sh-sfx-trigger-name.has-value { color: var(--ink); }
.sh-sfx-trigger-arrow { font-size: 8px; color: var(--meta); transition: transform 0.3s; }
.sh-sfx-trigger.open .sh-sfx-trigger-arrow { transform: rotate(180deg); }

/* Play btn */
.sh-play-btn {
    width: 32px; height: 32px; border-radius: 50%; background: var(--ink);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; transition: background 0.2s;
}
.sh-play-btn:active { background: var(--red); }
.sh-play-btn.muted { background: #E0E0E0; pointer-events: none; }
.sh-play-btn svg { width: 11px; height: 11px; fill: #fff; transform: translateX(1px); }

/* SFX Panel */
.sh-sfx-panel {
    overflow: hidden; max-height: 0;
    transition: max-height 0.4s cubic-bezier(0.2,0.8,0.2,1), opacity 0.3s ease, margin-top 0.3s ease;
    opacity: 0; margin-top: 0;
}
.sh-sfx-panel.open { max-height: 600px; opacity: 1; margin-top: 14px; }
.sh-sfx-panel-inner {
    background: var(--surface); border-radius: 16px;
    padding: 16px; overflow-y: auto; max-height: 260px;
}
.sh-sfx-panel-inner::-webkit-scrollbar { display: none; }
.sh-sfx-none {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-radius: 10px; background: #fff;
    cursor: pointer; transition: all 0.15s; border: 1.5px solid transparent; margin-bottom: 12px;
}
.sh-sfx-none.selected { background: var(--ink); color: #fff; }
.sh-sfx-none-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; color: var(--meta); }
.sh-sfx-none.selected .sh-sfx-none-label { color: rgba(255,255,255,0.6); }
.sh-sfx-none-icon { font-size: 10px; color: var(--meta); }
.sh-sfx-none.selected .sh-sfx-none-icon { color: rgba(255,255,255,0.4); }
.sh-sfx-group-title { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--red); margin: 14px 0 8px; }
.sh-sfx-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; }
.sh-sfx-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border-radius: 10px; background: #fff;
    cursor: pointer; transition: all 0.15s; border: 1.5px solid transparent;
}
.sh-sfx-item:active { transform: scale(0.95); }
.sh-sfx-item.selected { background: var(--ink); color: #fff; border-color: var(--ink); }
.sh-sfx-item-name { font-size: 11px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sh-sfx-item-play { width: 18px; height: 18px; border-radius: 50%; background: var(--surface); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-left: 6px; }
.sh-sfx-item.selected .sh-sfx-item-play { background: var(--red); }
.sh-sfx-item-play svg { width: 6px; height: 6px; fill: var(--ink); transform: translateX(0.5px); }
.sh-sfx-item.selected .sh-sfx-item-play svg { fill: #fff; }

/* API Block */
.sh-api-block { margin-top: 4px; }
.sh-api-expand-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 0; border-bottom: 1px solid var(--line);
    cursor: pointer; user-select: none;
}
.sh-api-expand-row:last-of-type { border-bottom: none; }
.sh-api-expand-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
.sh-api-index {
    font-family: 'Share Tech Mono', monospace; font-size: 9px; color: #fff;
    background: var(--ink); padding: 3px 7px; border-radius: 6px;
    letter-spacing: 1px; flex-shrink: 0;
}
.sh-api-index.active-idx { background: var(--red); }
.sh-api-expand-info { min-width: 0; }
.sh-api-expand-name { font-size: 14px; font-weight: 700; }
.sh-api-expand-cn { font-size: 10px; color: var(--meta); margin-top: 2px; }
.sh-api-expand-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.sh-api-val-preview {
    font-family: 'Share Tech Mono', monospace; font-size: 11px; color: var(--meta);
    max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.sh-api-val-preview.filled { color: var(--ink); }
.sh-api-chevron { font-size: 8px; color: var(--meta); transition: transform 0.3s; }
.sh-api-expand-row.open .sh-api-chevron { transform: rotate(180deg); }
.sh-api-drawer {
    overflow: hidden; max-height: 0;
    transition: max-height 0.4s cubic-bezier(0.2,0.8,0.2,1), opacity 0.3s, margin 0.3s;
    opacity: 0; margin: 0;
}
.sh-api-drawer.open { max-height: 300px; opacity: 1; margin: 0 0 12px; }
.sh-api-drawer-inner {
    background: var(--ink); border-radius: 16px; padding: 20px;
    position: relative; overflow: hidden;
}
.sh-api-drawer-inner::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background-image: repeating-linear-gradient(0deg,transparent,transparent 19px,rgba(255,255,255,0.03) 19px,rgba(255,255,255,0.03) 20px);
    pointer-events: none; border-radius: 16px;
}
.sh-api-drawer-inner::after {
    content: attr(data-label); position: absolute; bottom: 12px; right: 16px;
    font-family: 'Share Tech Mono', monospace; font-size: 9px;
    color: rgba(255,255,255,0.1); letter-spacing: 2px; text-transform: uppercase;
}
.sh-api-field-label {
    font-family: 'Share Tech Mono', monospace; font-size: 9px;
    color: rgba(255,255,255,0.4); letter-spacing: 2px; text-transform: uppercase;
    margin-bottom: 8px; display: flex; align-items: center; gap: 8px;
}
.sh-api-field-label::before { content: '//'; color: var(--red); font-size: 11px; }
.sh-api-field-input {
    width: 100%; background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
    padding: 12px 14px; font-family: 'Share Tech Mono', monospace;
    font-size: 13px; color: #fff; outline: none;
    transition: border-color 0.2s, background 0.2s; letter-spacing: 0.5px;
}
.sh-api-field-input:focus { border-color: var(--red); background: rgba(255,255,255,0.09); }
.sh-api-field-input::placeholder { color: rgba(255,255,255,0.2); }
.sh-api-field-select {
    width: 100%; -webkit-appearance: none; background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
    padding: 12px 14px; font-family: 'Share Tech Mono', monospace;
    font-size: 13px; color: #fff; outline: none; cursor: pointer; transition: border-color 0.2s;
}
.sh-api-field-select:focus { border-color: var(--red); }
.sh-api-field-select option { background: #222; color: #fff; }
.sh-api-field-toggle-row { display: flex; align-items: center; justify-content: space-between; }
.sh-api-field-toggle-label { font-family: 'Share Tech Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.7); letter-spacing: 0.5px; }
.sh-api-toggle { width: 42px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 20px; position: relative; transition: .3s; cursor: pointer; }
.sh-api-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: rgba(255,255,255,0.5); border-radius: 50%; transition: .3s; }
.sh-api-toggle.on { background: var(--red); }
.sh-api-toggle.on::after { transform: translateX(18px); background: #fff; }
.sh-api-status { display: flex; align-items: center; gap: 6px; margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06); }
.sh-api-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4CAF50; box-shadow: 0 0 6px #4CAF50; }
.sh-api-status-dot.warn { background: #FFC107; box-shadow: 0 0 6px #FFC107; }
.sh-api-status-dot.off { background: rgba(255,255,255,0.2); box-shadow: none; }
.sh-api-status-text { font-family: 'Share Tech Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.35); letter-spacing: 1px; }

/* Data Buttons */
.sh-data-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 16px; border-radius: 14px;
    background: var(--ink); color: #fff;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
    cursor: pointer; transition: all 0.2s; user-select: none;
    white-space: nowrap;
}
.sh-data-btn svg { width: 13px; height: 13px; stroke: #fff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
.sh-data-btn:active { transform: scale(0.94); opacity: 0.85; }
.sh-data-btn-sec { background: var(--surface); color: var(--meta); border: 1px solid var(--line); }
.sh-data-btn-sec svg { stroke: var(--meta); }
.sh-data-btn-danger { background: var(--red); }
.sh-data-feedback {
    font-family: 'Share Tech Mono', monospace; font-size: 10px;
    letter-spacing: 1px; padding: 6px 2px 0;
    min-height: 18px; transition: opacity 0.3s; color: var(--meta);
}
.sh-data-feedback.ok { color: #4CAF50; }
.sh-data-feedback.err { color: var(--red); }
#sh-paste-area:focus { border-color: var(--ink); }

/* bg motif */
#sh-bg-motif { position: fixed; bottom: -380px; left: 50%; transform: translateX(-50%); pointer-events: none; z-index: 7; }
.sh-arc-thick { width: 850px; height: 850px; border: 50px solid rgba(21,21,21,0.03); border-radius: 50%; }
.sh-arc-thin { position: absolute; top: 40px; left: 50%; transform: translateX(-50%); width: 740px; height: 740px; border: 1px solid rgba(21,21,21,0.08); border-radius: 50%; }

/* Nav */
#sh-nav-zone { position: absolute; bottom: 0; left: 0; right: 0; height: 140px; overflow: hidden; z-index: 100; }
.sh-dial-arc { position: absolute; top: 0; left: 50%; transform: translateX(-50%); pointer-events: none; z-index: 105; }
.sh-pointer { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; background: var(--red); border-radius: 50%; box-shadow: 0 0 10px var(--red); z-index: 120; }
.sh-dial-scroll { width: 100%; height: 100%; overflow-x: auto; display: flex; align-items: flex-start; padding: 45px calc(50% - 60px) 0; scroll-snap-type: x mandatory; scrollbar-width: none; }
.sh-dial-scroll::-webkit-scrollbar { display: none; }
.sh-dial-item { flex: 0 0 120px; height: 70px; scroll-snap-align: center; display: flex; flex-direction: column; align-items: center; transition: all 0.4s cubic-bezier(0.2,0.8,0.2,1); opacity: 0.15; transform: scale(0.85); }
.sh-dial-item.active { opacity: 1; transform: scale(1.1); }
.sh-dial-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--ink); }
.sh-dial-cn { font-size: 8px; color: var(--red); font-weight: 700; margin-top: 6px; letter-spacing: 1px; }
</style>

<div id="sh-watermark">Audio</div>
<div id="sh-bg-motif"><div class="sh-arc-thick"></div><div class="sh-arc-thin"></div></div>

<header id="sh-header">
    <div class="sh-plaque">
        <div class="sh-plaque-dot"></div>
        <div class="sh-plaque-text">A0nynx_3i /. 核心设置</div>
    </div>
    <div class="sh-back" id="sh-back-btn">
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
    </div>
    <div class="sh-title-area">
        <div class="sh-page-title" id="sh-display-title">Acoustics<span>.</span></div>
        <div class="sh-page-sub" id="sh-display-sub">Audio Mapping & Profiles /. 音效映射</div>
    </div>
</header>

<div id="sh-viewport">

    <!-- Acoustics -->
    <div class="sh-section active" id="sh-sec-acoustics">
        <div class="sh-sig sh-sig-tr">A0nynx</div>
        <div class="sh-sig sh-sig-bl">Sound</div>
        
        <div class="sh-group-label">Global /. 全局</div>
        <div class="sh-card">
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Master Volume</div><div class="sh-row-cn">/. 系统主音量</div></div>
                    <div class="sh-control"><input type="range" class="sh-slider" id="sh-master-vol" min="0" max="100" value="70"></div>
                </div>
            </div>
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Haptic Feedback</div><div class="sh-row-cn">/. 物理触感反馈</div></div>
                    <div class="sh-control"><div class="sh-toggle on" id="sh-haptic-toggle"></div></div>
                </div>
            </div>
        </div>

        <div class="sh-group-label">Messaging /. 消息通讯</div>
        <div class="sh-card">
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Message Sent</div><div class="sh-row-cn">/. 消息成功发送</div></div>
                    <div class="sh-control">
                        <div class="sh-sfx-trigger" data-id="map-send"><span class="sh-sfx-trigger-name" id="sh-label-map-send">— None</span><span class="sh-sfx-trigger-arrow">▼</span></div>
                        <div class="sh-play-btn muted" id="sh-play-map-send"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
                    </div>
                </div>
                <div class="sh-sfx-panel" id="sh-panel-map-send"></div>
            </div>
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Message Received</div><div class="sh-row-cn">/. 收到AI回复</div></div>
                    <div class="sh-control">
                        <div class="sh-sfx-trigger" data-id="map-recv"><span class="sh-sfx-trigger-name" id="sh-label-map-recv">— None</span><span class="sh-sfx-trigger-arrow">▼</span></div>
                        <div class="sh-play-btn muted" id="sh-play-map-recv"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
                    </div>
                </div>
                <div class="sh-sfx-panel" id="sh-panel-map-recv"></div>
            </div>
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">AI Typing</div><div class="sh-row-cn">/. AI 正在输入</div></div>
                    <div class="sh-control">
                        <div class="sh-sfx-trigger" data-id="map-typing"><span class="sh-sfx-trigger-name" id="sh-label-map-typing">— None</span><span class="sh-sfx-trigger-arrow">▼</span></div>
                        <div class="sh-play-btn muted" id="sh-play-map-typing"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
                    </div>
                </div>
                <div class="sh-sfx-panel" id="sh-panel-map-typing"></div>
            </div>
        </div>

        <div class="sh-group-label">Interface /. 交互反馈</div>
        <div class="sh-card">
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Button Tap</div><div class="sh-row-cn">/. 通用按钮点击</div></div>
                    <div class="sh-control">
                        <div class="sh-sfx-trigger" data-id="map-tap"><span class="sh-sfx-trigger-name" id="sh-label-map-tap">— None</span><span class="sh-sfx-trigger-arrow">▼</span></div>
                        <div class="sh-play-btn muted" id="sh-play-map-tap"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
                    </div>
                </div>
                <div class="sh-sfx-panel" id="sh-panel-map-tap"></div>
            </div>
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Long Press</div><div class="sh-row-cn">/. 消息长按触发</div></div>
                    <div class="sh-control">
                        <div class="sh-sfx-trigger" data-id="map-long"><span class="sh-sfx-trigger-name" id="sh-label-map-long">— None</span><span class="sh-sfx-trigger-arrow">▼</span></div>
                        <div class="sh-play-btn muted" id="sh-play-map-long"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
                    </div>
                </div>
                <div class="sh-sfx-panel" id="sh-panel-map-long"></div>
            </div>
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Delete Action</div><div class="sh-row-cn">/. 删除/危险操作</div></div>
                    <div class="sh-control">
                        <div class="sh-sfx-trigger" data-id="map-delete"><span class="sh-sfx-trigger-name" id="sh-label-map-delete">— None</span><span class="sh-sfx-trigger-arrow">▼</span></div>
                        <div class="sh-play-btn muted" id="sh-play-map-delete"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
                    </div>
                </div>
                <div class="sh-sfx-panel" id="sh-panel-map-delete"></div>
            </div>
        </div>

        <div class="sh-group-label">System /. 系统事件</div>
        <div class="sh-card">
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Success Notification</div><div class="sh-row-cn">/. 操作成功提示</div></div>
                    <div class="sh-control">
                        <div class="sh-sfx-trigger" data-id="map-success"><span class="sh-sfx-trigger-name" id="sh-label-map-success">— None</span><span class="sh-sfx-trigger-arrow">▼</span></div>
                        <div class="sh-play-btn muted" id="sh-play-map-success"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
                    </div>
                </div>
                <div class="sh-sfx-panel" id="sh-panel-map-success"></div>
            </div>
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">API Switch</div><div class="sh-row-cn">/. 节点/模型切换</div></div>
                    <div class="sh-control">
                        <div class="sh-sfx-trigger" data-id="map-switch"><span class="sh-sfx-trigger-name" id="sh-label-map-switch">— None</span><span class="sh-sfx-trigger-arrow">▼</span></div>
                        <div class="sh-play-btn muted" id="sh-play-map-switch"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
                    </div>
                </div>
                <div class="sh-sfx-panel" id="sh-panel-map-switch"></div>
            </div>
        </div>

    </div>

    <!-- General -->
    <div class="sh-section" id="sh-sec-general">
        <div class="sh-sig sh-sig-tr">General</div>
        <div class="sh-sig sh-sig-bl">Config</div>
        
        <div class="sh-group-label">System /. 系统</div>
        <div class="sh-card">
            <div class="sh-row"><div class="sh-row-top"><div class="sh-row-info"><div class="sh-row-name">Language</div><div class="sh-row-cn">/. 系统语言选择</div></div><div class="sh-control"><select class="sh-plain-select"><option>English</option><option>简体中文</option></select></div></div></div>
            <div class="sh-row"><div class="sh-row-top"><div class="sh-row-info"><div class="sh-row-name">Region</div><div class="sh-row-cn">/. 区域与时区</div></div><div class="sh-control"><select class="sh-plain-select"><option>Global</option><option>Asia / Shanghai</option><option>Europe / London</option><option>US / New York</option></select></div></div></div>
        </div>

        <div class="sh-group-label">API /. 接口配置</div>
        <div class="sh-card">
            <div class="sh-api-block">
                <div class="sh-api-expand-row" data-api="endpoint">
                    <div class="sh-api-expand-left"><span class="sh-api-index">01</span><div class="sh-api-expand-info"><div class="sh-api-expand-name">API Endpoint</div><div class="sh-api-expand-cn">/. 接口地址</div></div></div>
                    <div class="sh-api-expand-right"><span class="sh-api-val-preview" id="sh-prev-api-endpoint">— unset</span><span class="sh-api-chevron">▼</span></div>
                </div>
                <div class="sh-api-drawer" id="sh-drawer-api-endpoint">
                    <div class="sh-api-drawer-inner" data-label="ENDPOINT">
                        <div class="sh-api-field-label">base url</div>
                        <input class="sh-api-field-input" id="sh-input-api-endpoint" type="text" placeholder="https://api.openai.com/v1">
                        <div class="sh-api-status"><div class="sh-api-status-dot warn" id="sh-dot-api-endpoint"></div><span class="sh-api-status-text" id="sh-stat-api-endpoint">AWAITING INPUT</span></div>
                    </div>
                </div>
                <div class="sh-api-expand-row" data-api="key">
                    <div class="sh-api-expand-left"><span class="sh-api-index">02</span><div class="sh-api-expand-info"><div class="sh-api-expand-name">API Key</div><div class="sh-api-expand-cn">/. 密钥</div></div></div>
                    <div class="sh-api-expand-right"><span class="sh-api-val-preview" id="sh-prev-api-key">— unset</span><span class="sh-api-chevron">▼</span></div>
                </div>
                <div class="sh-api-drawer" id="sh-drawer-api-key">
                    <div class="sh-api-drawer-inner" data-label="SECRET KEY">
                        <div class="sh-api-field-label">secret key</div>
                        <input class="sh-api-field-input" id="sh-input-api-key" type="password" placeholder="sk-••••••••••••••••••••">
                        <div class="sh-api-status"><div class="sh-api-status-dot off" id="sh-dot-api-key"></div><span class="sh-api-status-text" id="sh-stat-api-key">NOT CONFIGURED</span></div>
                    </div>
                </div>
                <div class="sh-api-expand-row" data-api="model">
                    <div class="sh-api-expand-left"><span class="sh-api-index active-idx">03</span><div class="sh-api-expand-info"><div class="sh-api-expand-name">Model</div><div class="sh-api-expand-cn">/. 当前模型</div></div></div>
                    <div class="sh-api-expand-right"><span class="sh-api-val-preview filled" id="sh-prev-api-model">gpt-4o</span><span class="sh-api-chevron">▼</span></div>
                </div>
                <div class="sh-api-drawer" id="sh-drawer-api-model">
                    <div class="sh-api-drawer-inner" data-label="MODEL">
                        <div class="sh-api-field-label">inference model</div>
                        <div style="display:flex;gap:8px;margin-bottom:12px;">
                            <input class="sh-api-field-input" id="sh-model-manual" type="text" placeholder="手动输入 model ID..." style="flex:1;">
                            <button id="sh-fetch-models-btn" style="flex-shrink:0;background:rgba(166,52,38,0.8);border:none;border-radius:10px;padding:0 14px;font-family:'Share Tech Mono',monospace;font-size:10px;color:#fff;cursor:pointer;letter-spacing:1px;transition:opacity 0.2s;">FETCH</button>
                        </div>
                        <div id="sh-model-list-wrap" style="max-height:200px;overflow-y:auto;scrollbar-width:none;margin-bottom:8px;"></div>
                        <div class="sh-api-status"><div class="sh-api-status-dot off" id="sh-dot-api-model"></div><span class="sh-api-status-text" id="sh-stat-api-model">NOT FETCHED</span></div>
                    </div>
                </div>
                <div class="sh-api-expand-row" data-api="timeout">
                    <div class="sh-api-expand-left"><span class="sh-api-index">04</span><div class="sh-api-expand-info"><div class="sh-api-expand-name">Timeout</div><div class="sh-api-expand-cn">/. 超时时间</div></div></div>
                    <div class="sh-api-expand-right"><span class="sh-api-val-preview filled" id="sh-prev-api-timeout">30s</span><span class="sh-api-chevron">▼</span></div>
                </div>
                <div class="sh-api-drawer" id="sh-drawer-api-timeout">
                    <div class="sh-api-drawer-inner" data-label="TIMEOUT">
                        <div class="sh-api-field-label">request timeout</div>
                        <select class="sh-api-field-select" id="sh-sel-api-timeout">
                            <option>10s</option><option selected>30s</option><option>60s</option><option>120s</option>
                        </select>
                        <div class="sh-api-status"><div class="sh-api-status-dot"></div><span class="sh-api-status-text">30S / STANDARD</span></div>
                    </div>
                </div>
                <div class="sh-api-expand-row" data-api="stream">
                    <div class="sh-api-expand-left"><span class="sh-api-index">05</span><div class="sh-api-expand-info"><div class="sh-api-expand-name">Stream Response</div><div class="sh-api-expand-cn">/. 流式输出</div></div></div>
                    <div class="sh-api-expand-right"><span class="sh-api-val-preview filled" id="sh-prev-api-stream">ON</span><span class="sh-api-chevron">▼</span></div>
                </div>
                <div class="sh-api-drawer" id="sh-drawer-api-stream">
                    <div class="sh-api-drawer-inner" data-label="STREAM">
                        <div class="sh-api-field-toggle-row">
                            <span class="sh-api-field-toggle-label">streaming_enabled</span>
                            <div class="sh-api-toggle on" id="sh-stream-toggle"></div>
                        </div>
                        <div class="sh-api-status"><div class="sh-api-status-dot" id="sh-dot-api-stream"></div><span class="sh-api-status-text" id="sh-stat-api-stream">STREAM / ACTIVE</span></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="sh-group-label">Presets /. API 预设</div>
        <div class="sh-card" id="sh-api-presets-card" style="padding:16px 24px;">
            <div id="sh-preset-list"></div>
            <div class="sh-data-btn sh-data-btn-sec" id="sh-preset-add" style="width:100%;justify-content:center;margin-top:12px;">
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                NEW PRESET
            </div>
        </div>
    </div>

    <!-- Appearance -->
    <div class="sh-section" id="sh-sec-appearance">
        <div class="sh-sig sh-sig-tr">Visual</div>
        <div class="sh-sig sh-sig-bl">Style</div>
        <div class="sh-group-label">Visual /. 视觉</div>
        <div class="sh-card">
            <div class="sh-row"><div class="sh-row-top"><div class="sh-row-info"><div class="sh-row-name">Dark Mode</div><div class="sh-row-cn">/. 强制深色模式</div></div><div class="sh-control"><div class="sh-toggle" id="sh-dark-toggle"></div></div></div></div>
            <div class="sh-row"><div class="sh-row-top"><div class="sh-row-info"><div class="sh-row-name">OLED Black</div><div class="sh-row-cn">/. 纯黑背景优化</div></div><div class="sh-control"><div class="sh-toggle on" id="sh-oled-toggle"></div></div></div></div>
            <div class="sh-row"><div class="sh-row-top"><div class="sh-row-info"><div class="sh-row-name">API Quick Switch</div><div class="sh-row-cn">/. 悬浮球 API 快捷切换</div></div><div class="sh-control"><div class="sh-toggle" id="sh-api-fab-toggle"></div></div></div></div>
        </div>
    </div>

    <!-- Account -->
    <div class="sh-section" id="sh-sec-account">
        <div class="sh-sig sh-sig-tr">Account</div>
        <div class="sh-sig sh-sig-bl">Identity</div>
        <div class="sh-group-label">Profile /. 账户信息</div>
        <div class="sh-card">
            <div class="sh-row"><div class="sh-row-top"><div class="sh-row-info"><div class="sh-row-name">Email</div><div class="sh-row-cn">/. 绑定邮箱</div></div><div class="sh-control"><input type="text" value="user@a0nynx.3i" style="border:none;background:var(--surface);border-radius:12px;padding:10px 14px;font-family:inherit;font-size:12px;font-weight:700;text-align:right;outline:none;width:160px;"></div></div></div>
            <div class="sh-row"><div class="sh-row-top"><div class="sh-row-info"><div class="sh-row-name">Subscription</div><div class="sh-row-cn">/. 订阅方案</div></div><div class="sh-control"><select class="sh-plain-select"><option>A0nynx Pro</option><option>Standard</option></select></div></div></div>
        </div>
    </div>

    <!-- Security -->
    <div class="sh-section" id="sh-sec-security">
        <div class="sh-sig sh-sig-tr">Secure</div>
        <div class="sh-sig sh-sig-bl">Lock</div>
        <div class="sh-group-label">Protection /. 防护</div>
        <div class="sh-card">
            <div class="sh-row"><div class="sh-row-top"><div class="sh-row-info"><div class="sh-row-name">Biometric Lock</div><div class="sh-row-cn">/. 生物识别解锁</div></div><div class="sh-control"><div class="sh-toggle on" id="sh-bio-toggle"></div></div></div></div>
            <div class="sh-row"><div class="sh-row-top"><div class="sh-row-info"><div class="sh-row-name">Two-Factor Auth</div><div class="sh-row-cn">/. 双重身份验证</div></div><div class="sh-control"><div class="sh-toggle" id="sh-2fa-toggle"></div></div></div></div>
            <div class="sh-row"><div class="sh-row-top"><div class="sh-row-info"><div class="sh-row-name">Encrypt Storage</div><div class="sh-row-cn">/. 本地数据加密</div></div><div class="sh-control"><div class="sh-toggle on" id="sh-enc-toggle"></div></div></div></div>
        </div>
    </div>

    <!-- Data -->
    <div class="sh-section" id="sh-sec-data">
        <div class="sh-sig sh-sig-tr">Data</div>
        <div class="sh-sig sh-sig-bl">Archive</div>

        <div class="sh-group-label">Cloud /. 云同步</div>
        <div class="sh-card" style="background:#151515;border-color:rgba(255,255,255,0.08);padding:20px 24px;cursor:pointer;transition:transform 0.2s;" id="sh-cloud-card">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M21 12a9 9 0 0 0-9-9M3 12a9 9 0 0 0 9 9"/><path d="M21 3v6h-6"/><path d="M3 21v-6h6"/></svg>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;font-weight:700;color:#fff;">Cloud Sync</div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px;">跨设备同步 · 无需注册账号</div>
                </div>
                <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:rgba(255,255,255,0.3);fill:none;stroke-width:2;stroke-linecap:round;flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
        </div>

        <div class="sh-group-label">Export /. 导出</div>
        <div class="sh-card">
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Export All Data</div><div class="sh-row-cn">/. 导出全部数据为 JSON 文件</div></div>
                    <div class="sh-control">
                        <div class="sh-data-btn" id="sh-export-btn">
                            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            EXPORT FILE
                        </div>
                    </div>
                </div>
            </div>
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Copy to Clipboard</div><div class="sh-row-cn">/. 复制数据到剪贴板</div></div>
                    <div class="sh-control">
                        <div class="sh-data-btn" id="sh-copy-btn">
                            <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            COPY JSON
                        </div>
                    </div>
                </div>
                <div class="sh-data-feedback" id="sh-copy-feedback"></div>
            </div>
        </div>

        <div class="sh-group-label">Import /. 导入</div>
        <div class="sh-card">
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Import from File</div><div class="sh-row-cn">/. 从 JSON 文件导入数据</div></div>
                    <div class="sh-control">
                        <div class="sh-data-btn" id="sh-import-btn">
                            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            IMPORT FILE
                        </div>
                        <input type="file" id="sh-import-file" accept=".json" style="display:none;">
                    </div>
                </div>
                <div class="sh-data-feedback" id="sh-import-feedback"></div>
            </div>
            <div class="sh-row">
                <div class="sh-row-top" style="align-items:flex-start;flex-direction:column;gap:10px;">
                    <div class="sh-row-info"><div class="sh-row-name">Paste JSON</div><div class="sh-row-cn">/. 直接粘贴 JSON 数据导入</div></div>
                    <textarea id="sh-paste-area" placeholder='{ "paste your exported JSON here..." }' style="width:100%;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px;font-family:\'Share Tech Mono\',monospace;font-size:11px;color:var(--ink);resize:none;height:100px;outline:none;letter-spacing:0.3px;box-sizing:border-box;transition:border-color 0.2s;"></textarea>
                    <div style="display:flex;gap:8px;width:100%;">
                        <div class="sh-data-btn sh-data-btn-sec" id="sh-paste-clear-btn" style="flex:1;">CLEAR</div>
                        <div class="sh-data-btn" id="sh-paste-import-btn" style="flex:2;">
                            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                            APPLY PASTE
                        </div>
                    </div>
                    <div class="sh-data-feedback" id="sh-paste-feedback"></div>
                </div>
            </div>
        </div>

        <div class="sh-group-label">Danger Zone /. 危险操作</div>
        <div class="sh-card">
            <div class="sh-row">
                <div class="sh-row-top">
                    <div class="sh-row-info"><div class="sh-row-name">Clear All Data</div><div class="sh-row-cn">/. 清除全部本地数据，不可恢复</div></div>
                    <div class="sh-control">
                        <div class="sh-data-btn sh-data-btn-danger" id="sh-clear-btn">
                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            CLEAR ALL
                        </div>
                    </div>
                </div>
                <div class="sh-data-feedback" id="sh-clear-feedback"></div>
            </div>
        </div>
    </div>

</div><!-- /sh-viewport -->

<!-- Nav -->
<nav id="sh-nav-zone">
    <svg class="sh-dial-arc" id="sh-dial-arc-svg" width="600" height="140" viewBox="0 0 600 140">
        <path id="sh-arc-path" d="M 0,28 Q 300,-60 600,28" fill="none" stroke="rgba(21,21,21,0.12)" stroke-width="1" stroke-dasharray="4 6"/>
    </svg>
    <div class="sh-pointer"></div>
    <div class="sh-dial-scroll" id="sh-dial">
        <div class="sh-dial-item" data-page="general" data-title="General" data-sub="System Preferences /. 通用设置"><div class="sh-dial-label">General</div><div class="sh-dial-cn">/. 通用</div></div>
        <div class="sh-dial-item" data-page="appearance" data-title="Appearance" data-sub="Interface Design /. 视觉外观"><div class="sh-dial-label">Appearance</div><div class="sh-dial-cn">/. 外观</div></div>
        <div class="sh-dial-item active" data-page="acoustics" data-title="Acoustics" data-sub="Audio Mapping & Profiles /. 音效映射"><div class="sh-dial-label">Acoustics</div><div class="sh-dial-cn">/. 音效</div></div>
        <div class="sh-dial-item" data-page="account" data-title="Account" data-sub="User Identity /. 账户身份"><div class="sh-dial-label">Account</div><div class="sh-dial-cn">/. 账户</div></div>
        <div class="sh-dial-item" data-page="security" data-title="Security" data-sub="Data Protection /. 安全隐私"><div class="sh-dial-label">Security</div><div class="sh-dial-cn">/. 安全</div></div>
        <div class="sh-dial-item" data-page="data" data-title="Data" data-sub="Import · Export · Sync /. 数据管理"><div class="sh-dial-label">Data</div><div class="sh-dial-cn">/. 数据</div></div>
    </div>
</nav>
        `;
        document.body.appendChild(el);
    }

    /* ══════════════════════════════════════
       绑定事件
    ══════════════════════════════════════ */
    function bindEvents() {
        /* 返回 */
        document.getElementById('sh-back-btn').addEventListener('click', closeHub);

        /* Toggle 通用点击 */
        ['sh-haptic-toggle','sh-dark-toggle','sh-oled-toggle','sh-bio-toggle','sh-2fa-toggle','sh-enc-toggle'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', () => el.classList.toggle('on'));
        });

        /* API FAB 开关 */
        var apiFabToggle = document.getElementById('sh-api-fab-toggle');
        if (apiFabToggle) {
            var fabOn = localStorage.getItem('sh-api-fab') === 'true';
            if (fabOn) { apiFabToggle.classList.add('on'); if (window.openApiFab) window.openApiFab(); }
            apiFabToggle.addEventListener('click', function() {
                apiFabToggle.classList.toggle('on');
                var on = apiFabToggle.classList.contains('on');
                localStorage.setItem('sh-api-fab', on ? 'true' : 'false');
                if (on) { if (window.openApiFab) window.openApiFab(); }
                else { if (window.closeApiFab) window.closeApiFab(); }
            });
        }

        /* Haptic 同步 */
        document.getElementById('sh-haptic-toggle').addEventListener('click', () => {
            hapticOn = document.getElementById('sh-haptic-toggle').classList.contains('on');
            localStorage.setItem('sh-haptic', hapticOn ? 'true' : 'false');
        });

        /* Master Volume */
        const volEl = document.getElementById('sh-master-vol');
        volEl.value = Math.round(getVol() * 100);
        volEl.addEventListener('input', e => {
            localStorage.setItem('sh-master-vol', e.target.value / 100);
        });

        /* SFX Triggers */
        document.querySelectorAll('#settingsHub .sh-sfx-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const id = trigger.dataset.id;
                shTogglePanel(id);
            });
        });

        /* SFX Play btns */
        SFX_KEYS.forEach(id => {
            const btn = document.getElementById('sh-play-' + id);
            if (btn) btn.addEventListener('click', () => {
                const key = localStorage.getItem('sh-sfx-' + id);
                if (key && SFX[key]) SFX[key]();
            });
        });

        /* API expand rows */
        document.querySelectorAll('#settingsHub .sh-api-expand-row').forEach(row => {
            row.addEventListener('click', () => {
                const apiId = row.dataset.api;
                shToggleApi(apiId);
            });
        });

        /* API inputs */
        const epInput = document.getElementById('sh-input-api-endpoint');
        const keyInput = document.getElementById('sh-input-api-key');
        const timeoutSel = document.getElementById('sh-sel-api-timeout');
        const streamToggle = document.getElementById('sh-stream-toggle');

        epInput.addEventListener('input', function(e) { shUpdateApiPreview('endpoint', e.target.value); });
        keyInput.addEventListener('input', function(e) { shUpdateApiPreview('key', e.target.value); });
        timeoutSel.addEventListener('change', function(e) { shUpdateApiPreview('timeout', e.target.value); shSyncApiToChat(); });
        streamToggle.addEventListener('click', function() {
            streamToggle.classList.toggle('on');
            var on = streamToggle.classList.contains('on');
            document.getElementById('sh-prev-api-stream').textContent = on ? 'ON' : 'OFF';
            var dot = document.getElementById('sh-dot-api-stream');
            var stat = document.getElementById('sh-stat-api-stream');
            dot.className = 'sh-api-status-dot' + (on ? '' : ' off');
            stat.textContent = on ? 'STREAM / ACTIVE' : 'STREAM / DISABLED';
            shSyncApiToChat();
        });

        epInput.addEventListener('change', shSyncApiToChat);
        epInput.addEventListener('input', shSyncApiToChat);
        keyInput.addEventListener('change', shSyncApiToChat);
        keyInput.addEventListener('input', shSyncApiToChat);

        /* 手动输入 model */
        var manualModelEl = document.getElementById('sh-model-manual');
        if (manualModelEl) {
            manualModelEl.addEventListener('input', function(e) {
                var val = e.target.value.trim();
                shUpdateApiPreview('model', val);
                shSyncApiToChat();
            });
        }

        /* Fetch Models 按钮 */
        var fetchBtn = document.getElementById('sh-fetch-models-btn');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', function() {
                var ep  = epInput ? epInput.value.trim() : '';
                var key = keyInput ? keyInput.value.trim() : '';
                if (!ep || !key) {
                    var dot = document.getElementById('sh-dot-api-model');
                    var stat = document.getElementById('sh-stat-api-model');
                    if (dot) dot.className = 'sh-api-status-dot warn';
                    if (stat) stat.textContent = 'FILL ENDPOINT & KEY FIRST';
                    return;
                }
                fetchBtn.textContent = '...';
                fetchBtn.style.opacity = '0.5';
                var dot = document.getElementById('sh-dot-api-model');
                var stat = document.getElementById('sh-stat-api-model');
                if (dot) dot.className = 'sh-api-status-dot warn';
                if (stat) stat.textContent = 'FETCHING...';

                /* 判断 provider */
                var epLower = ep.toLowerCase();
                if (epLower.indexOf('anthropic') !== -1 || epLower.indexOf('claude') !== -1) {
                    fetchBtn.textContent = 'FETCH';
                    fetchBtn.style.opacity = '1';
                    if (stat) stat.textContent = 'ANTHROPIC: TYPE MANUALLY';
                    return;
                }
                if (epLower.indexOf('generativelanguage') !== -1 || epLower.indexOf('gemini') !== -1) {
                    fetchBtn.textContent = 'FETCH';
                    fetchBtn.style.opacity = '1';
                    if (stat) stat.textContent = 'GOOGLE: TYPE MANUALLY';
                    return;
                }

                /* 构造 /models URL */
                var url = ep.replace(/\/+$/, '');
                if (url.indexOf('/chat/completions') !== -1) url = url.replace('/chat/completions', '/models');
                else if (url.indexOf('/models') === -1) url = url + '/models';

                fetch(url, {
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + key }
                })
                .then(function(res) {
                    return res.text().then(function(text) {
                        var t = text.trim();
                        if (t.charAt(0) !== '{' && t.charAt(0) !== '[') {
                            throw new Error(t.substring(0, 60));
                        }
                        if (!res.ok) {
                            var errData;
                            try { errData = JSON.parse(t); } catch(e) {}
                            throw new Error(errData && errData.error ? errData.error.message : 'HTTP ' + res.status);
                        }
                        return JSON.parse(t);
                    });
                })
                .then(function(data) {
                    fetchBtn.textContent = 'FETCH';
                    fetchBtn.style.opacity = '1';

                    var models = [];
                    if (data.data && Array.isArray(data.data)) {
                        data.data.forEach(function(m) {
                            var id = m.id || m.name || '';
                            if (id &&
                                id.indexOf('embed')      === -1 &&
                                id.indexOf('tts')        === -1 &&
                                id.indexOf('dall')       === -1 &&
                                id.indexOf('whisper')    === -1 &&
                                id.indexOf('moderation') === -1) {
                                models.push(id);
                            }
                        });
                    }
                    models.sort();

                    /* 同步到 ca-api-config.models */
                    var raw = localStorage.getItem('ca-api-config');
                    var cfg = {};
                    if (raw) { try { cfg = JSON.parse(raw); } catch(e) {} }
                    cfg.models = models.map(function(id) {
                        var existing = (cfg.models || []).find(function(m) { return m.name === id; });
                        return { name: id, fav: existing ? existing.fav : false };
                    });
                    localStorage.setItem('ca-api-config', JSON.stringify(cfg));

                    if (dot) dot.className = 'sh-api-status-dot';
                    if (stat) stat.textContent = models.length + ' MODELS LOADED';

                    shRenderModelList();
                })
                .catch(function(err) {
                    fetchBtn.textContent = 'FETCH';
                    fetchBtn.style.opacity = '1';
                    if (dot) dot.className = 'sh-api-status-dot off';
                    if (stat) stat.textContent = 'ERROR: ' + (err.message || 'FAILED').substring(0, 30).toUpperCase();
                });
            });
        }

        /* Dial */
        const dial = document.getElementById('sh-dial');
        const items = document.querySelectorAll('#settingsHub .sh-dial-item');
        const sections = document.querySelectorAll('#settingsHub .sh-section');

        dial.addEventListener('scroll', () => {
            const cx = dial.getBoundingClientRect().left + dial.offsetWidth / 2;
            items.forEach(item => {
                const ix = item.getBoundingClientRect().left + item.offsetWidth / 2;
                const dist = Math.abs(cx - ix);
                const angle = (ix - cx) / 25;
                const ty = Math.pow(dist / 35, 2);
                item.style.transform = `rotate(${angle}deg) translateY(${ty}px) scale(${Math.max(0.85, 1.1 - dist / 500)})`;
                if (dist < 50 && !item.classList.contains('active')) {
                    items.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    shSwitchPage(item.dataset.page, item.dataset.title, item.dataset.sub, sections);
                }
            });
        });

        /* ── Cloud Sync Card ── */
        document.getElementById('sh-cloud-card').addEventListener('click', function() {
            shOpenCloudSync();
        });
        document.getElementById('sh-cloud-card').addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.97)';
        }, {passive:true});
        document.getElementById('sh-cloud-card').addEventListener('touchend', function() {
            this.style.transform = '';
        }, {passive:true});

        function shOpenCloudSync() {
            var existing = document.getElementById('sh-cloud-overlay');
            if (existing) existing.remove();

            var syncCode = window.CloudSync ? window.CloudSync.getSyncCode() : 'XXXX-XXXX';
            var lastSync = localStorage.getItem('ca-cloud-last-sync') || '从未';

            var overlay = document.createElement('div');
            overlay.id = 'sh-cloud-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(21,21,21,0.6);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:99999;opacity:0;transition:opacity 0.3s;';
            overlay.innerHTML =
                '<div id="sh-cloud-modal" style="width:340px;max-height:90vh;background:#FAFAF8;border-radius:32px;border:0.5px solid #000;box-shadow:0 40px 100px rgba(0,0,0,0.4);overflow-y:auto;position:relative;">' +
                    '<div style="position:absolute;top:20px;right:-20px;font-family:\'Great Vibes\',cursive;font-size:80px;color:rgba(21,21,21,0.03);pointer-events:none;transform:rotate(-8deg);">Sync</div>' +
                    '<div id="sh-cloud-close" style="position:absolute;top:18px;right:18px;width:32px;height:32px;border-radius:50%;background:rgba(21,21,21,0.05);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;">' +
                        '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:#151515;fill:none;stroke-width:2;stroke-linecap:round;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                    '</div>' +
                    '<div style="padding:24px 22px 22px;position:relative;z-index:1;">' +
                        '<div style="width:40px;height:40px;border-radius:50%;background:#151515;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">' +
                            '<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M21 12a9 9 0 0 0-9-9M3 12a9 9 0 0 0 9 9"/><path d="M21 3v6h-6"/><path d="M3 21v-6h6"/></svg>' +
                        '</div>' +
                        '<div style="font-family:\'Playfair Display\',serif;font-style:italic;font-size:22px;font-weight:900;color:#151515;margin-bottom:4px;">Cloud Sync</div>' +
                        '<div style="font-size:10px;color:rgba(21,21,21,0.4);margin-bottom:16px;line-height:1.5;">通过同步码在不同设备间同步对话数据。无需注册，记住同步码即可。</div>' +
                        '<div style="background:#151515;border-radius:18px;padding:16px;margin-bottom:16px;position:relative;overflow:hidden;">' +
                            '<div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(to right,transparent,rgba(255,255,255,0.1),transparent);"></div>' +
                            '<div style="font-size:8px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:10px;">你的同步码 / Your Sync Code</div>' +
                            '<div id="sh-cloud-code" style="font-family:\'Share Tech Mono\',monospace;font-size:32px;font-weight:700;color:#fff;letter-spacing:5px;text-align:center;margin-bottom:14px;">' + syncCode + '</div>' +
                            '<div style="display:flex;justify-content:center;gap:8px;">' +
                                '<button id="sh-cloud-copy" style="padding:6px 16px;border-radius:50px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:rgba(255,255,255,0.5);font-size:9px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:inherit;">' +
                                    '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>复制</button>' +
                                '<button id="sh-cloud-regen" style="padding:6px 16px;border-radius:50px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:rgba(255,255,255,0.5);font-size:9px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:inherit;">' +
                                    '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>重新生成</button>' +
                            '</div>' +
                        '</div>' +
                        '<div style="height:1px;background:rgba(21,21,21,0.08);margin:14px 0;"></div>' +
                        '<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#A63426;text-transform:uppercase;margin-bottom:6px;">输入已有同步码 / Restore</div>' +
                        '<div style="font-size:9px;color:rgba(21,21,21,0.35);margin-bottom:8px;line-height:1.4;">如果你在其他设备上已有数据，输入那个设备的同步码来恢复。</div>' +
                        '<input type="text" id="sh-cloud-input" placeholder="Enter sync code..." maxlength="9" style="width:100%;border:none;border-bottom:1.5px solid rgba(21,21,21,0.12);background:transparent;padding:6px 0;font-family:\'Great Vibes\',cursive;font-size:16px;font-weight:400;color:#151515;outline:none;letter-spacing:1px;margin-bottom:16px;">' +
                        '<div style="display:flex;gap:10px;margin-bottom:12px;">' +
                            '<button id="sh-cloud-upload" style="flex:1;padding:15px;border-radius:50px;border:none;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;display:flex;align-items:center;justify-content:center;gap:6px;background:#151515;color:#fff;transition:transform 0.2s;">' +
                                '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>上传</button>' +
                            '<button id="sh-cloud-download" style="flex:1;padding:15px;border-radius:50px;border:1.5px solid #151515;background:transparent;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;display:flex;align-items:center;justify-content:center;gap:6px;color:#151515;transition:transform 0.2s;">' +
                                '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/></svg>下载</button>' +
                        '</div>' +
                        '<div id="sh-cloud-status" style="text-align:center;font-size:9px;color:rgba(21,21,21,0.3);font-weight:600;margin-top:8px;">上次同步：' + lastSync + '</div>' +
                        '<div style="margin-top:12px;padding:8px 12px;background:rgba(166,52,38,0.04);border-radius:10px;border:0.5px solid rgba(166,52,38,0.1);display:flex;gap:8px;align-items:flex-start;">' +
                            '<div style="flex-shrink:0;margin-top:1px;"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:#A63426;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>' +
                            '<span style="font-size:9px;color:#A63426;line-height:1.5;font-weight:500;">下载将覆盖本地所有数据，请确认同步码正确。此操作不可撤销。</span>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(overlay);
            requestAnimationFrame(function() { overlay.style.opacity = '1'; });

            /* 关闭 */
            overlay.querySelector('#sh-cloud-close').addEventListener('click', function() {
                overlay.style.opacity = '0';
                setTimeout(function() { overlay.remove(); }, 300);
            });
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    overlay.style.opacity = '0';
                    setTimeout(function() { overlay.remove(); }, 300);
                }
            });

            /* 复制 */
            overlay.querySelector('#sh-cloud-copy').addEventListener('click', function() {
                var code = overlay.querySelector('#sh-cloud-code').textContent;
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(code);
                }
                this.textContent = '已复制 ✓';
                var self = this;
                setTimeout(function() { self.innerHTML = '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>复制'; }, 1500);
            });

            /* 重新生成 */
            overlay.querySelector('#sh-cloud-regen').addEventListener('click', function() {
                if (!window.CloudSync) return;
                if (!confirm('重新生成将无法访问旧同步码的数据，确定？')) return;
                var newCode = window.CloudSync.generateCode();
                window.CloudSync.setSyncCode(newCode);
                overlay.querySelector('#sh-cloud-code').textContent = newCode;
            });

            /* 上传 */
            overlay.querySelector('#sh-cloud-upload').addEventListener('click', function() {
                if (!window.CloudSync) { shCloudStatus('CloudSync 模块未加载', true); return; }
                var btn = this;
                btn.textContent = '上传中...';
                btn.style.opacity = '0.5';

                /* 收集数据 */
                var entities = [];
                var conversations = {};
                if (window.ChatDB) {
                    ChatDB.loadEntities(function(ents) {
                        entities = ents || [];
                        ChatDB.loadAllConversations(function(convs) {
                            conversations = convs || {};
                            doUpload(entities, conversations, btn);
                        });
                    });
                } else {
                    doUpload([], {}, btn);
                }
            });

            function doUpload(entities, conversations, btn) {
                window.CloudSync.uploadAll(entities, conversations, function(err) {
                    btn.style.opacity = '1';
                    if (err) {
                        btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>上传';
                        shCloudStatus('上传失败: ' + err.message, true);
                    } else {
                        var now = new Date().toLocaleString('zh-CN');
                        localStorage.setItem('ca-cloud-last-sync', now);
                        btn.innerHTML = '✓ 已上传';
                        shCloudStatus('上次同步：' + now, false);
                        setTimeout(function() {
                            btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>上传';
                        }, 2000);
                    }
                });
            }

            /* 下载 */
            overlay.querySelector('#sh-cloud-download').addEventListener('click', function() {
                if (!window.CloudSync) { shCloudStatus('CloudSync 模块未加载', true); return; }
                var inputCode = overlay.querySelector('#sh-cloud-input').value.trim().toUpperCase();
                if (inputCode) {
                    window.CloudSync.setSyncCode(inputCode);
                    overlay.querySelector('#sh-cloud-code').textContent = inputCode;
                }
                var btn = this;
                btn.textContent = '下载中...';
                btn.style.opacity = '0.5';

                window.CloudSync.downloadAll(function(err, data) {
                    btn.style.opacity = '1';
                    if (err) {
                        btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/></svg>下载';
                        shCloudStatus('下载失败: ' + err.message, true);
                        return;
                    }
                    if (!data) {
                        btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/></svg>下载';
                        shCloudStatus('该同步码下无数据', true);
                        return;
                    }

                    /* 恢复数据 */
                    if (data.masks) localStorage.setItem('ca-user-masks', data.masks);
                    if (data.apiConfig) localStorage.setItem('ca-api-config', data.apiConfig);
                    if (data.transConfig) localStorage.setItem('ca-trans-config', data.transConfig);
                    if (data.avConfig) localStorage.setItem('ca-av-config', data.avConfig);
                    if (data.timeConfig) localStorage.setItem('ca-time-config', data.timeConfig);
                    if (data.customCss) localStorage.setItem('ca-custom-css', data.customCss);

                    /* 恢复 Private Space、记忆、世界书等额外数据 */
                    if (window.CloudSync && window.CloudSync.restoreExtra) {
                        CloudSync.restoreExtra(data);
                    }

                    /* 恢复 entities 和 conversations 到 IndexedDB */
                    if (window.ChatDB && data.entities) {
                        ChatDB.clearAll(function() {
                            var ents = data.entities || [];
                            var convs = data.conversations || {};
                            var remaining = ents.length;
                            if (remaining === 0) {
                                finishDownload(btn);
                                return;
                            }
                            ents.forEach(function(ent) {
                                ChatDB.saveEntity(ent, function() {
                                    var conv = convs[ent.id] || [];
                                    ChatDB.saveConversation(ent.id, conv, function() {
                                        remaining--;
                                        if (remaining === 0) finishDownload(btn);
                                    });
                                });
                            });
                        });
                    } else {
                        finishDownload(btn);
                    }
                });
            });

            function finishDownload(btn) {
                var now = new Date().toLocaleString('zh-CN');
                localStorage.setItem('ca-cloud-last-sync', now);
                btn.innerHTML = '✓ 已恢复';
                shCloudStatus('数据已恢复，刷新页面生效。上次同步：' + now, false);
                setTimeout(function() {
                    btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/></svg>下载';
                }, 2000);
            }

            function shCloudStatus(msg, isError) {
                var el = overlay.querySelector('#sh-cloud-status');
                if (el) {
                    el.textContent = msg;
                    el.style.color = isError ? '#A63426' : 'rgba(21,21,21,0.3)';
                }
            }
        }

        /* ── Data Page ── */
        function shCollectAllData() {
            var result = {};
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                try { result[k] = JSON.parse(localStorage.getItem(k)); }
                catch(e) { result[k] = localStorage.getItem(k); }
            }
            return result;
        }

        function shCollectIndexedDB(cb) {
            var result = { entities: [], conversations: {}, avatars: {} };
            var dbNames = ['CoutureOS_ChatDB'];

            /* 收集所有 IndexedDB 数据库的所有 store */
            var allStores = {};
            var dbRemaining = dbNames.length;

            function dumpDB(dbName, doneCb) {
                try {
                    var req = indexedDB.open(dbName);
                    req.onsuccess = function(e) {
                        var db = e.target.result;
                        var storeNames = Array.from(db.objectStoreNames);
                        if (!storeNames.length) { doneCb(); return; }

                        var tx = db.transaction(storeNames, 'readonly');
                        var storeRemaining = storeNames.length;

                        storeNames.forEach(function(storeName) {
                            var store = tx.objectStore(storeName);
                            var items = [];
                            var cursor = store.openCursor();
                            cursor.onsuccess = function(ev) {
                                var c = ev.target.result;
                                if (c) {
                                    items.push({ key: c.key, value: c.value });
                                    c.continue();
                                } else {
                                    allStores[dbName + '::' + storeName] = items;
                                    storeRemaining--;
                                    if (storeRemaining <= 0) doneCb();
                                }
                            };
                            cursor.onerror = function() {
                                storeRemaining--;
                                if (storeRemaining <= 0) doneCb();
                            };
                        });
                    };
                    req.onerror = function() { doneCb(); };
                } catch(e) { doneCb(); }
            }

            dumpDB('CoutureOS_ChatDB', function() {
                /* 从 dump 数据中提取 entities / conversations / avatars */
                var entItems = allStores['CoutureOS_ChatDB::entities'] || [];
                var convItems = allStores['CoutureOS_ChatDB::conversations'] || [];
                var avItems = allStores['CoutureOS_ChatDB::avatars'] || [];

                result.entities = entItems.map(function(item) { return item.value; });
                convItems.forEach(function(item) { result.conversations[item.key] = item.value; });
                avItems.forEach(function(item) { result.avatars[item.key] = item.value; });

                /* 把完整的 store dump 也带上，以防有其他 store */
                result._rawStores = allStores;

                cb(result);
            });
        }

        function shApplyImportData(obj) {
            if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) throw new Error('Invalid format');
            Object.keys(obj).forEach(function(k) {
                var v = obj[k];
                localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
            });
        }

        function shApplyFullImport(obj, feedbackId) {
            if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) {
                shSetFeedback(feedbackId, '✕  Invalid format', 'err');
                return;
            }

            function afterRestore(msg) {
                console.log('[IMPORT] afterRestore:', msg);
                // 全局 toast
                var toast=document.createElement('div');
                toast.style.cssText='position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#151515;color:#fff;padding:12px 24px;border-radius:50px;font-size:13px;font-weight:700;z-index:9999999;opacity:1;pointer-events:none;';
                toast.textContent=msg.indexOf('✓')!==-1?'✓ 导入成功，2秒后刷新...':'✕ 导入异常';
                document.body.appendChild(toast);
                // 2秒后强制刷新页面（最可靠的恢复方式）
                setTimeout(function(){
                    window.location.reload();
                }, 2000);
            }

            /* 检测是否为新版完整备份格式 */
            if (obj._format === 'a0nynx-full-backup' && obj.localStorage) {
                /* 恢复 localStorage */
                var lsData = obj.localStorage;
                Object.keys(lsData).forEach(function(k) {
                    var v = lsData[k];
                    localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
                });

                /* 恢复 IndexedDB entities + conversations + avatars */
                var ents = obj.entities || [];
                var convs = obj.conversations || {};
                var avatars = obj.avatars || {};

                /* 恢复 IndexedDB：优先用 _rawStores，否则用 entities/conversations/avatars */
                var rawStores = obj._rawStores || null;

                // 用 ChatDB 自身 API 写入（最可靠）
                if(window.ChatDB&&ChatDB.clearAll){
                    ChatDB.clearAll(function(){
                        var entArr=ents||[];
                        var convObj=convs||{};
                        var avObj=avatars||{};
                        var total=entArr.length;
                        if(!total){afterRestore('✓  Restored '+Object.keys(lsData).length+' keys (0 entities)');return;}
                        var done=0;
                        entArr.forEach(function(ent){
                            // 恢复头像到 entity 对象上
                            var avKey=ent.id;
                            if(avObj[avKey]&&avObj[avKey].data){ent.avatar=avObj[avKey].data;}
                            else if(avObj[avKey]&&typeof avObj[avKey]==='string'){ent.avatar=avObj[avKey];}
                            ChatDB.saveEntity(ent,function(){
                                var msgs=convObj[ent.id];
                                if(msgs){
                                    var msgArr=Array.isArray(msgs)?msgs:(msgs.messages||[]);
                                    ChatDB.saveConversation(ent.id,msgArr,function(){
                                        done++;if(done>=total)afterRestore('✓  Full restore · '+total+' entities + '+Object.keys(lsData).length+' keys');
                                    });
                                }else{
                                    done++;if(done>=total)afterRestore('✓  Full restore · '+total+' entities + '+Object.keys(lsData).length+' keys');
                                }
                            });
                        });
                        // 超时保底
                        setTimeout(function(){
                            if(done<total)afterRestore('✓  Partial restore · '+done+'/'+total+' entities');
                        },10000);
                    });
                }else{
                    afterRestore('✓  Restored '+Object.keys(lsData).length+' keys (no ChatDB)');
                }
            } else {
                /* 旧格式：直接当 localStorage 键值对处理 */
                shApplyImportData(obj);
                afterRestore('✓  Imported ' + Object.keys(obj).length + ' keys (legacy format)');
            }
        }

        function shSetFeedback(elId, msg, type, dur) {
            var el = document.getElementById(elId);
            if (!el) return;
            el.textContent = msg;
            el.className = 'sh-data-feedback ' + (type || '');
            if (dur !== 0) setTimeout(function() { el.textContent = ''; el.className = 'sh-data-feedback'; }, dur || 3000);
        }

        /* Export File — 完整备份（localStorage + IndexedDB） */
        document.getElementById('sh-export-btn').addEventListener('click', function() {
            var btn = document.getElementById('sh-export-btn');
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';

            function doExport(entities, conversations, avatars) {
                try {
                    var lsData = shCollectAllData();
                    var payload = {
                        _format: 'a0nynx-full-backup',
                        _version: 2,
                        _date: new Date().toISOString(),
                        localStorage: lsData,
                        entities: entities || [],
                        conversations: conversations || {},
                        avatars: avatars || {}
                    };

                    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'a0nynx-full-backup-' + new Date().toISOString().slice(0,10) + '.json';
                    a.click();
                    URL.revokeObjectURL(url);
                } catch(e) { alert('Export failed: ' + e.message); }
                btn.style.opacity = '1';
                btn.style.pointerEvents = '';
            }

            shCollectIndexedDB(function(dbData) {
                doExport(dbData.entities, dbData.conversations, dbData.avatars);
            });
        });

        /* Copy JSON — 完整备份 */
        document.getElementById('sh-copy-btn').addEventListener('click', function() {
            function doCopy(entities, conversations, avatars) {
                try {
                    var lsData = shCollectAllData();
                    var payload = {
                        _format: 'a0nynx-full-backup',
                        _version: 2,
                        _date: new Date().toISOString(),
                        localStorage: lsData,
                        entities: entities || [],
                        conversations: conversations || {},
                        avatars: avatars || {}
                    };
                    var str = JSON.stringify(payload);
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(str).then(function() {
                            shSetFeedback('sh-copy-feedback', '✓  Copied full backup · ' + str.length + ' chars', 'ok');
                        }).catch(function() {
                            shFallbackCopy(str);
                        });
                    } else {
                        shFallbackCopy(str);
                    }
                } catch(e) { shSetFeedback('sh-copy-feedback', '✕  ' + e.message, 'err'); }
            }

            shCollectIndexedDB(function(dbData) {
                doCopy(dbData.entities, dbData.conversations, dbData.avatars);
            });
        });

        function shFallbackCopy(str) {
            var ta = document.createElement('textarea');
            ta.value = str;
            ta.style.cssText = 'position:fixed;top:-9999px;opacity:0;';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                shSetFeedback('sh-copy-feedback', '✓  Copied to clipboard', 'ok');
            } catch(e) {
                shSetFeedback('sh-copy-feedback', '✕  Copy failed, try Export File', 'err');
            }
            document.body.removeChild(ta);
        }

        /* Import File — 支持完整备份格式和旧格式 */
        document.getElementById('sh-import-btn').addEventListener('click', function() {
            document.getElementById('sh-import-file').click();
        });
        document.getElementById('sh-import-file').addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    var obj = JSON.parse(ev.target.result);
                    shApplyFullImport(obj, 'sh-import-feedback');
                } catch(err) {
                    shSetFeedback('sh-import-feedback', '✕  Parse error: ' + err.message, 'err');
                }
            };
            reader.readAsText(file);
            this.value = '';
        });

        /* Paste Import — 支持完整备份格式和旧格式 */
        document.getElementById('sh-paste-clear-btn').addEventListener('click', function() {
            document.getElementById('sh-paste-area').value = '';
            shSetFeedback('sh-paste-feedback', '', '', 0);
        });
        document.getElementById('sh-paste-import-btn').addEventListener('click', function() {
            var raw = document.getElementById('sh-paste-area').value.trim();
            if (!raw) { shSetFeedback('sh-paste-feedback', '✕  Nothing to import', 'err'); return; }
            try {
                var obj = JSON.parse(raw);
                shApplyFullImport(obj, 'sh-paste-feedback');
                document.getElementById('sh-paste-area').value = '';
            } catch(err) {
                shSetFeedback('sh-paste-feedback', '✕  Invalid JSON: ' + err.message.substring(0,40), 'err');
            }
        });

        /* Clear All */
        document.getElementById('sh-clear-btn').addEventListener('click', function() {
            var fb = document.getElementById('sh-clear-feedback');
            if (fb.dataset.confirm === '1') {
                localStorage.clear();
                // 同时清除 IndexedDB
                if(window.ChatDB&&ChatDB.clearAll){
                    ChatDB.clearAll(function(){
                        shSetFeedback('sh-clear-feedback', '✓  All data cleared (localStorage + IndexedDB). Reload to reset.', 'ok', 6000);
                    });
                }else{
                    try{indexedDB.deleteDatabase('CoutureOS_ChatDB');}catch(e){}
                    shSetFeedback('sh-clear-feedback', '✓  All data cleared. Reload to reset.', 'ok', 6000);
                }
                fb.dataset.confirm = '0';
            } else {
                fb.dataset.confirm = '1';
                shSetFeedback('sh-clear-feedback', '⚠  Click again to confirm — this cannot be undone', 'err', 4000);
                setTimeout(function() { fb.dataset.confirm = '0'; }, 4000);
            }
        });

        /* Arc resize */
        const arcSvg = document.getElementById('sh-dial-arc-svg');
        const arcPath = document.getElementById('sh-arc-path');
        function resizeArc() {
            const W = window.innerWidth;
            arcSvg.setAttribute('width', W);
            arcSvg.setAttribute('viewBox', `0 0 ${W} 140`);
            arcPath.setAttribute('d', `M 0,28 Q ${W/2},-${Math.min(80, W * 0.12)} ${W},28`);
        }
        resizeArc();
        window.addEventListener('resize', resizeArc);

        /* ── API Presets ── */
        function getPresets(){try{return JSON.parse(localStorage.getItem('sh-api-presets')||'[]');}catch(e){return[];}}
        function savePresets(p){localStorage.setItem('sh-api-presets',JSON.stringify(p));}

        function renderPresets(){
            var list=document.getElementById('sh-preset-list');
            if(!list)return;
            var presets=getPresets();
            if(!presets.length){list.innerHTML='<div style="font-size:10px;color:var(--meta);text-align:center;padding:12px 0;">No presets yet</div>';return;}
            list.innerHTML=presets.map(function(p,i){
                return '<div class="sh-preset-row" data-idx="'+i+'" style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--line);">'+
                    '<div style="flex:1;min-width:0;">'+
                        '<div style="font-size:13px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+p.name+'</div>'+
                        '<div style="font-size:9px;color:var(--meta);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+((p.endpoint||'').substring(0,30))+' · '+(p.model||'—')+'</div>'+
                    '</div>'+
                    '<div class="sh-data-btn" data-action="use" data-idx="'+i+'" style="padding:6px 12px;font-size:9px;">USE</div>'+
                    '<div class="sh-data-btn sh-data-btn-sec" data-action="edit" data-idx="'+i+'" style="padding:6px 10px;font-size:9px;">✎</div>'+
                    '<div class="sh-data-btn sh-data-btn-danger" data-action="del" data-idx="'+i+'" style="padding:6px 10px;font-size:9px;">✕</div>'+
                '</div>';
            }).join('');

            list.querySelectorAll('[data-action]').forEach(function(btn){
                btn.addEventListener('click',function(e){
                    e.stopPropagation();
                    var idx=parseInt(btn.dataset.idx);
                    var action=btn.dataset.action;
                    var presets=getPresets();
                    if(action==='use'){
                        var p=presets[idx];if(!p)return;
                        var raw=localStorage.getItem('ca-api-config');
                        var cfg={};if(raw)try{cfg=JSON.parse(raw);}catch(e){}
                        var node=cfg.node||'primary';
                        var cur=cfg[node]||{};
                        function doSwitch(){
                            if(!cfg[node])cfg[node]={};
                            cfg[node].endpoint=p.endpoint||'';
                            cfg[node].key=p.key||'';
                            cfg[node].model=p.model||'';
                            localStorage.setItem('ca-api-config',JSON.stringify(cfg));
                            restoreState();
                            window.dispatchEvent(new CustomEvent('sh-api-updated'));
                            renderPresets();
                        }
                        if(cur.endpoint||cur.key){
                            ensureModalStyle();
                            var oldM=document.getElementById('sh-preset-modal');if(oldM)oldM.remove();
                            var askModal=document.createElement('div');
                            askModal.id='sh-preset-modal';askModal.className='me-modal';
                            askModal.innerHTML='<div class="me-modal-card"><div class="me-modal-title">保存当前配置？</div><div class="me-modal-sub">切换前是否将当前 API 配置保存为预设</div><div class="me-modal-actions"><button class="me-modal-btn cancel" id="shAskNo">不保存</button><button class="me-modal-btn confirm" id="shAskYes">保存</button></div></div>';
                            document.body.appendChild(askModal);
                            requestAnimationFrame(function(){askModal.classList.add('show');});
                            var hideAsk=function(){askModal.classList.remove('show');setTimeout(function(){askModal.remove();},250);};
                            document.getElementById('shAskNo').addEventListener('click',function(){hideAsk();doSwitch();});
                            document.getElementById('shAskYes').addEventListener('click',function(){
                                hideAsk();
                                var curPreset={name:'Auto-saved',endpoint:cur.endpoint||'',key:cur.key||'',model:cur.model||''};
                                presets.push(curPreset);savePresets(presets);renderPresets();
                                doSwitch();
                            });
                            askModal.addEventListener('click',function(ev){if(ev.target===askModal){hideAsk();doSwitch();}});
                        }else{doSwitch();}
                    }else if(action==='edit'){
                        openPresetEditor(idx);
                    }else if(action==='del'){
                        if(!confirm('Delete preset "'+presets[idx].name+'"?'))return;
                        presets.splice(idx,1);
                        savePresets(presets);
                        renderPresets();
                    }
                });
            });
        }

        function ensureModalStyle(){
            if(document.getElementById('sh-modal-style'))return;
            var s=document.createElement('style');s.id='sh-modal-style';
            s.textContent='.me-modal{position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;visibility:hidden;transition:opacity 0.25s,visibility 0.25s;}.me-modal.show{opacity:1;visibility:visible;}.me-modal-card{width:100%;max-width:340px;background:#fff;border-radius:24px;padding:24px 20px 20px;position:relative;transform:scale(0.92) translateY(20px);transition:transform 0.3s cubic-bezier(0.16,1,0.3,1);box-shadow:0 20px 60px rgba(0,0,0,0.2);}.me-modal.show .me-modal-card{transform:scale(1) translateY(0);}.me-modal-title{font-size:13px;font-weight:800;color:#1a1a1f;letter-spacing:0.5px;margin-bottom:4px;}.me-modal-sub{font-size:9px;font-weight:700;color:rgba(26,26,31,0.25);letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;}.me-modal-field{margin-bottom:14px;}.me-modal-label{font-size:9px;font-weight:800;color:rgba(26,26,31,0.35);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;}.me-modal-input{width:100%;padding:10px 14px;border-radius:12px;border:0.5px solid rgba(26,26,31,0.1);background:rgba(26,26,31,0.02);font-size:13px;color:#1a1a1f;font-family:inherit;outline:none;transition:all 0.2s;box-sizing:border-box;}.me-modal-input:focus{border-color:rgba(26,26,31,0.3);background:#fff;}.me-modal-actions{display:flex;gap:8px;margin-top:18px;}.me-modal-btn{flex:1;padding:12px;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border:none;transition:all 0.2s;text-align:center;}.me-modal-btn.cancel{background:rgba(26,26,31,0.04);color:#1a1a1f;}.me-modal-btn.confirm{background:#1a1a1f;color:#fff;}.me-modal-btn:active{transform:scale(0.97);}';
            document.head.appendChild(s);
        }

        function openPresetEditor(idx){
            ensureModalStyle();
            var presets=getPresets();
            var isNew=(idx===undefined||idx===null||idx<0);
            var p=isNew?{name:'',endpoint:'',key:'',model:''}:presets[idx];

            var old=document.getElementById('sh-preset-modal');if(old)old.remove();
            var modal=document.createElement('div');
            modal.id='sh-preset-modal';
            modal.className='me-modal';
            modal.innerHTML=
                '<div class="me-modal-card">'+
                    '<div class="me-modal-title">'+(isNew?'New Preset':'Edit Preset')+'</div>'+
                    '<div class="me-modal-sub">API Configuration Preset</div>'+
                    '<div class="me-modal-field"><div class="me-modal-label">Name</div><input type="text" class="me-modal-input" id="shPrName" value="'+(p.name||'').replace(/"/g,'&quot;')+'" placeholder="My API"></div>'+
                    '<div class="me-modal-field"><div class="me-modal-label">Endpoint</div><input type="text" class="me-modal-input" id="shPrEp" value="'+(p.endpoint||'').replace(/"/g,'&quot;')+'" placeholder="https://api.openai.com/v1"></div>'+
                    '<div class="me-modal-field"><div class="me-modal-label">API Key</div><input type="text" class="me-modal-input" id="shPrKey" value="'+(p.key||'').replace(/"/g,'&quot;')+'" placeholder="sk-..."></div>'+
                    '<div class="me-modal-field"><div class="me-modal-label">Model</div><input type="text" class="me-modal-input" id="shPrModel" value="'+(p.model||'').replace(/"/g,'&quot;')+'" placeholder="gpt-4o"></div>'+
                    '<div class="me-modal-actions">'+
                        '<button class="me-modal-btn cancel" id="shPrCancel">Cancel</button>'+
                        '<button class="me-modal-btn confirm" id="shPrSave">Save</button>'+
                    '</div>'+
                '</div>';
            document.body.appendChild(modal);
            requestAnimationFrame(function(){modal.classList.add('show');});

            var hide=function(){modal.classList.remove('show');setTimeout(function(){modal.remove();},250);};
            modal.addEventListener('click',function(e){if(e.target===modal)hide();});
            document.getElementById('shPrCancel').addEventListener('click',hide);
            document.getElementById('shPrSave').addEventListener('click',function(){
                var entry={
                    name:(document.getElementById('shPrName').value.trim()||'Unnamed'),
                    endpoint:document.getElementById('shPrEp').value.trim(),
                    key:document.getElementById('shPrKey').value.trim(),
                    model:document.getElementById('shPrModel').value.trim()
                };
                if(isNew){presets.push(entry);}
                else{presets[idx]=entry;}
                savePresets(presets);
                renderPresets();
                hide();
            });
        }

        document.getElementById('sh-preset-add').addEventListener('click',function(){
            openPresetEditor(-1);
        });

        renderPresets();
    }

    /* ══════════════════════════════════════
       页面切换
    ══════════════════════════════════════ */
    function shSwitchPage(id, title, sub, sections) {
        sections.forEach(s => { s.classList.remove('active'); s.classList.remove('anim-in'); });
        const t = document.getElementById('sh-sec-' + id);
        if (t) { t.classList.add('active'); t.classList.add('anim-in'); }
        document.getElementById('sh-display-title').innerHTML = title + '<span>.</span>';
        document.getElementById('sh-display-sub').textContent = sub;
        document.getElementById('sh-watermark').textContent = title;
        SH.vibrate(8);
    }

    /* ══════════════════════════════════════
       SFX Panel 展开/收起
    ══════════════════════════════════════ */
    const shSelected = loadSfxConfig();

    function shBuildPanel(mapId) {
        const panel = document.getElementById('sh-panel-' + mapId);
        if (!panel || panel.dataset.built) return;
        panel.dataset.built = '1';

        const inner = document.createElement('div');
        inner.className = 'sh-sfx-panel-inner';

        const noneEl = document.createElement('div');
        noneEl.className = 'sh-sfx-none' + (shSelected[mapId] === null ? ' selected' : '');
        noneEl.innerHTML = '<span class="sh-sfx-none-label">— None · 无音效</span><span class="sh-sfx-none-icon">✕</span>';
        noneEl.addEventListener('click', () => shSetSelection(mapId, null, panel));
        inner.appendChild(noneEl);

        GROUPS.forEach(grp => {
            const title = document.createElement('div');
            title.className = 'sh-sfx-group-title';
            title.textContent = grp.label;
            inner.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'sh-sfx-grid';
            grp.keys.forEach(key => {
                const item = document.createElement('div');
                item.className = 'sh-sfx-item' + (shSelected[mapId] === key ? ' selected' : '');
                item.dataset.key = key;
                item.innerHTML = `<span class="sh-sfx-item-name">${key}</span><span class="sh-sfx-item-play"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>`;
                item.addEventListener('click', e => {
                    e.stopPropagation();
                    shSetSelection(mapId, key, panel);
                    if (SFX[key]) SFX[key]();
                });
                grid.appendChild(item);
            });
            inner.appendChild(grid);
        });
        panel.appendChild(inner);
    }

    function shSetSelection(mapId, key, panel) {
        shSelected[mapId] = key;
        saveSfxKey(mapId, key);

        panel.querySelectorAll('.sh-sfx-item').forEach(i => i.classList.remove('selected'));
        panel.querySelectorAll('.sh-sfx-none').forEach(i => i.classList.remove('selected'));
        if (key === null) {
            panel.querySelector('.sh-sfx-none')?.classList.add('selected');
        } else {
            panel.querySelector(`.sh-sfx-item[data-key="${key}"]`)?.classList.add('selected');
        }

        const label = document.getElementById('sh-label-' + mapId);
        const btn = document.getElementById('sh-play-' + mapId);
        if (key === null) {
            label.textContent = '— None';
            label.classList.remove('has-value');
            btn.classList.add('muted');
        } else {
            label.textContent = key;
            label.classList.add('has-value');
            btn.classList.remove('muted');
        }
    }

    function shTogglePanel(mapId) {
        shBuildPanel(mapId);
        const panel = document.getElementById('sh-panel-' + mapId);
        const trigger = panel.closest('.sh-row').querySelector('.sh-sfx-trigger');
        const isOpen = panel.classList.contains('open');

        document.querySelectorAll('#settingsHub .sh-sfx-panel.open').forEach(p => {
            if (p.id !== 'sh-panel-' + mapId) {
                p.classList.remove('open');
                p.closest('.sh-row')?.querySelector('.sh-sfx-trigger')?.classList.remove('open');
            }
        });
        panel.classList.toggle('open', !isOpen);
        trigger.classList.toggle('open', !isOpen);
    }

    /* ══════════════════════════════════════
       API 展开
    ══════════════════════════════════════ */
    function shToggleApi(apiId) {
        const drawer = document.getElementById('sh-drawer-api-' + apiId);
        const row = drawer.previousElementSibling;
        const isOpen = drawer.classList.contains('open');
        document.querySelectorAll('#settingsHub .sh-api-drawer.open').forEach(d => {
            if (d.id !== 'sh-drawer-api-' + apiId) {
                d.classList.remove('open');
                d.previousElementSibling.classList.remove('open');
            }
        });
        drawer.classList.toggle('open', !isOpen);
        row.classList.toggle('open', !isOpen);
    }

    function shUpdateApiPreview(apiId, val) {
        const el = document.getElementById('sh-prev-api-' + apiId);
        if (!el) return;
        if (!val) {
            el.textContent = '— unset';
            el.classList.remove('filled');
        } else {
            el.textContent = apiId === 'key' ? 'sk-••••' + val.slice(-4) : val;
            el.classList.add('filled');
        }
        const dot = document.getElementById('sh-dot-api-' + apiId);
        const stat = document.getElementById('sh-stat-api-' + apiId);
        if (dot && stat) {
            if (val) { dot.className = 'sh-api-status-dot'; stat.textContent = 'CONFIGURED'; }
            else {
                if (apiId === 'key') { dot.className = 'sh-api-status-dot off'; stat.textContent = 'NOT CONFIGURED'; }
                else { dot.className = 'sh-api-status-dot warn'; stat.textContent = 'AWAITING INPUT'; }
            }
        }
        shSyncApiToChat();
    }

    /* ══════════════════════════════════════
       同步 API 配置到 chat-app
    ══════════════════════════════════════ */
    function shSyncApiToChat() {
        var epEl      = document.getElementById('sh-input-api-endpoint');
        var keyEl     = document.getElementById('sh-input-api-key');
        var manualEl  = document.getElementById('sh-model-manual');
        var timeoutEl = document.getElementById('sh-sel-api-timeout');
        var streamEl  = document.getElementById('sh-stream-toggle');

        var ep       = epEl      ? epEl.value.trim()      : '';
        var key      = keyEl     ? keyEl.value.trim()     : '';
        var model    = manualEl  ? manualEl.value.trim()  : '';
        var timeout  = timeoutEl ? timeoutEl.value        : '30s';
        var streamOn = streamEl  ? streamEl.classList.contains('on') : true;

        /* 读取现有配置，保留所有节点和 models */
        var raw = localStorage.getItem('ca-api-config');
        var cfg = { primary: { endpoint:'', key:'', prompt:'', model:'', timeout:'30s', stream:true }, backup: { endpoint:'', key:'', prompt:'', model:'' }, models: [], node: 'primary' };
        if (raw) { try { cfg = JSON.parse(raw); } catch(e) {} }

        /* 写入当前激活节点，不强制写 primary */
        var node = cfg.node || 'primary';
        if (!cfg[node]) cfg[node] = { endpoint:'', key:'', prompt:'', model:'', timeout:'30s', stream:true };

        if (ep)    cfg[node].endpoint = ep;
        if (key)   cfg[node].key      = key;
        if (model) cfg[node].model    = model;
        cfg[node].timeout = timeout;
        cfg[node].stream  = streamOn;

        localStorage.setItem('ca-api-config', JSON.stringify(cfg));

        window.dispatchEvent(new CustomEvent('sh-api-updated', { detail: { ep: ep, key: key, model: model, timeout: timeout, streamOn: streamOn, node: node } }));
    }


    /* ══════════════════════════════════════
       模型列表渲染
    ══════════════════════════════════════ */
    function shRenderModelList() {
        var wrap = document.getElementById('sh-model-list-wrap');
        if (!wrap) return;

        if (!document.getElementById('sh-mp-style')) {
            var s = document.createElement('style');
            s.id = 'sh-mp-style';
            s.textContent =
                '#sh-model-list-wrap::-webkit-scrollbar{display:none;}' +
                '.sh-mp-group{font-size:7px;font-weight:800;letter-spacing:2px;color:rgba(255,255,255,0.2);text-transform:uppercase;padding:8px 4px 4px;}' +
                '.sh-mp-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:all 0.15s;border:0.5px solid transparent;-webkit-tap-highlight-color:transparent;}' +
                '.sh-mp-item:active{background:rgba(255,255,255,0.06);}' +
                '.sh-mp-item.on{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.1);}' +
                '.sh-mp-fav{width:16px;height:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}' +
                '.sh-mp-fav svg{width:12px;height:12px;fill:rgba(255,255,255,0.15);stroke:rgba(255,255,255,0.15);stroke-width:2;transition:all 0.15s;}' +
                '.sh-mp-item.fav .sh-mp-fav svg{fill:#f0b429;stroke:#f0b429;}' +
                '.sh-mp-name{font-size:10px;font-weight:600;color:rgba(255,255,255,0.5);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
                '.sh-mp-item.on .sh-mp-name{color:#fff;font-weight:700;}' +
                '.sh-mp-check{width:14px;height:14px;flex-shrink:0;opacity:0;}' +
                '.sh-mp-item.on .sh-mp-check{opacity:1;}' +
                '.sh-mp-check svg{width:12px;height:12px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round;}';
            document.head.appendChild(s);
        }

        var cfg = {};
        try { cfg = JSON.parse(localStorage.getItem('ca-api-config') || '{}'); } catch(e) {}
        var node = cfg.node || 'primary';
        var curModel = (cfg[node] || {}).model || '';
        var models = cfg.models || [];

        if (!models.length) {
            wrap.innerHTML = '<div style="font-size:9px;color:rgba(255,255,255,0.2);text-align:center;padding:14px 0;letter-spacing:0.5px;">点击 FETCH 加载模型列表</div>';
            return;
        }

        var favs = models.filter(function(m) { return m.fav; });
        var rest = models.filter(function(m) { return !m.fav; });
        var html = '';

        if (favs.length) {
            html += '<div class="sh-mp-group">Favorites</div>';
            favs.forEach(function(m) {
                html += '<div class="sh-mp-item fav' + (m.name === curModel ? ' on' : '') + '" data-name="' + m.name + '">' +
                    '<div class="sh-mp-fav"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>' +
                    '<div class="sh-mp-name">' + m.name + '</div>' +
                    '<div class="sh-mp-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>' +
                '</div>';
            });
        }
        if (rest.length) {
            html += '<div class="sh-mp-group">All Models</div>';
            rest.forEach(function(m) {
                html += '<div class="sh-mp-item' + (m.name === curModel ? ' on' : '') + '" data-name="' + m.name + '">' +
                    '<div class="sh-mp-fav"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>' +
                    '<div class="sh-mp-name">' + m.name + '</div>' +
                    '<div class="sh-mp-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>' +
                '</div>';
            });
        }
        wrap.innerHTML = html;

        wrap.querySelectorAll('.sh-mp-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                if (e.target.closest('.sh-mp-fav')) return;
                var name = item.dataset.name;
                wrap.querySelectorAll('.sh-mp-item').forEach(function(i) { i.classList.remove('on'); });
                item.classList.add('on');
                var manualEl = document.getElementById('sh-model-manual');
                if (manualEl) manualEl.value = name;
                shUpdateApiPreview('model', name);
                shSyncApiToChat();
            });

            item.querySelector('.sh-mp-fav').addEventListener('click', function(e) {
                e.stopPropagation();
                var name = item.dataset.name;
                var cfg2 = {};
                try { cfg2 = JSON.parse(localStorage.getItem('ca-api-config') || '{}'); } catch(ex) {}
                (cfg2.models || []).forEach(function(m) {
                    if (m.name === name) m.fav = !m.fav;
                });
                localStorage.setItem('ca-api-config', JSON.stringify(cfg2));
                shRenderModelList();
            });
        });
    }

    /* ══════════════════════════════════════
       从 localStorage 恢复状态
    ══════════════════════════════════════ */
    function restoreState() {
        /* 恢复已选音效标签 */
        SFX_KEYS.forEach(function(mapId) {
            var key = localStorage.getItem('sh-sfx-' + mapId);
            var label = document.getElementById('sh-label-' + mapId);
            var btn = document.getElementById('sh-play-' + mapId);
            if (key && label && btn) {
                label.textContent = key;
                label.classList.add('has-value');
                btn.classList.remove('muted');
            }
        });

        /* 恢复 master vol */
        var vol = getVol();
        var volEl = document.getElementById('sh-master-vol');
        if (volEl) volEl.value = Math.round(vol * 100);

        /* 恢复 haptic */
        var hap = localStorage.getItem('sh-haptic') !== 'false';
        hapticOn = hap;
        var hapEl = document.getElementById('sh-haptic-toggle');
        if (hapEl) hapEl.classList.toggle('on', hap);

        /* 恢复 API FAB */
        var fabOnRestore = localStorage.getItem('sh-api-fab') === 'true';
        var fabToggleEl = document.getElementById('sh-api-fab-toggle');
        if (fabToggleEl) fabToggleEl.classList.toggle('on', fabOnRestore);
        if (fabOnRestore && window.openApiFab) window.openApiFab();
        else if (!fabOnRestore && window.closeApiFab) window.closeApiFab();

        /* 恢复 API 字段：从当前激活节点读取 */
        var caRaw = localStorage.getItem('ca-api-config');
        var cfg = { primary: { endpoint:'', key:'', model:'', timeout:'30s', stream:true }, node: 'primary' };
        if (caRaw) { try { cfg = JSON.parse(caRaw); } catch(e) {} }
        var activeNode = cfg.node || 'primary';
        if (!cfg[activeNode]) cfg[activeNode] = { endpoint:'', key:'', model:'', timeout:'30s', stream:true };
        var ep      = cfg[activeNode].endpoint || '';
        var key     = cfg[activeNode].key      || '';
        var model   = cfg[activeNode].model    || '';
        var timeout = cfg[activeNode].timeout  || '30s';
        var stream  = cfg[activeNode].stream   !== false;

        var epEl      = document.getElementById('sh-input-api-endpoint');
        var keyEl     = document.getElementById('sh-input-api-key');
        var modEl     = document.getElementById('sh-sel-api-model');
        var timeoutEl = document.getElementById('sh-sel-api-timeout');
        var streamEl  = document.getElementById('sh-stream-toggle');

        if (epEl && ep)   { epEl.value = ep;   shUpdateApiPreview('endpoint', ep); }
        if (keyEl && key) { keyEl.value = key;  shUpdateApiPreview('key', key); }

        /* model：手动输入框 + select 同步 */
        if (model) {
            var manualEl = document.getElementById('sh-model-manual');
            if (manualEl) manualEl.value = model;
            if (modEl) {
                var existOpt = modEl.querySelector('option[value="' + model + '"]');
                if (!existOpt) {
                    var newOpt = document.createElement('option');
                    newOpt.value = model;
                    newOpt.textContent = model;
                    modEl.appendChild(newOpt);
                }
                modEl.value = model;
            }
            shUpdateApiPreview('model', model);
        }

        /* 从 ca-api-config.models 恢复已缓存的模型列表 */
        if (cfg.models && cfg.models.length > 0) {
            var dotM  = document.getElementById('sh-dot-api-model');
            var statM = document.getElementById('sh-stat-api-model');
            if (dotM)  dotM.className = 'sh-api-status-dot';
            if (statM) statM.textContent = cfg.models.length + ' MODELS CACHED';
        }
        shRenderModelList();

        /* timeout */
        if (timeoutEl) {
            timeoutEl.value = timeout;
            var prevTimeout = document.getElementById('sh-prev-api-timeout');
            var dotTimeout  = document.getElementById('sh-dot-api-timeout');
            var statTimeout = document.getElementById('sh-stat-api-timeout');
            if (prevTimeout) { prevTimeout.textContent = timeout; prevTimeout.classList.add('filled'); }
            if (dotTimeout)  dotTimeout.className = 'sh-api-status-dot';
            if (statTimeout) statTimeout.textContent = timeout.toUpperCase() + ' / CONFIGURED';
        }

        /* stream */
        if (streamEl) {
            streamEl.classList.toggle('on', stream);
            var prevStream = document.getElementById('sh-prev-api-stream');
            var dotStream  = document.getElementById('sh-dot-api-stream');
            var statStream = document.getElementById('sh-stat-api-stream');
            if (prevStream) prevStream.textContent = stream ? 'ON' : 'OFF';
            if (dotStream)  dotStream.className = 'sh-api-status-dot' + (stream ? '' : ' off');
            if (statStream) statStream.textContent = stream ? 'STREAM / ACTIVE' : 'STREAM / DISABLED';
        }
    }

    /* ══════════════════════════════════════
       打开 / 关闭
    ══════════════════════════════════════ */
    window.openSettingsHub = function () {
        const hub = document.getElementById('settingsHub');
        hub.classList.add('active');
        restoreState();
        /* 滚动到 acoustics */
        setTimeout(() => {
            const activeItem = hub.querySelector('.sh-dial-item.active');
            if (activeItem) activeItem.scrollIntoView({ inline: 'center', behavior: 'auto' });
        }, 50);
    };

    function closeHub() {
        const hub = document.getElementById('settingsHub');
        hub.classList.remove('active');
        hub.classList.add('closing');
        setTimeout(() => hub.classList.remove('closing'), 400);
        SH.vibrate(8);
    }

    /* ══════════════════════════════════════
       启动
    ══════════════════════════════════════ */
    let hubBuilt = false;
    window.openSettingsHub = function () {
        if (!hubBuilt) {
            buildHub();
            bindEvents();
            hubBuilt = true;
        }
        const hub = document.getElementById('settingsHub');
        hub.classList.remove('closing');
        hub.querySelectorAll('.sh-section').forEach(s => s.classList.remove('anim-in'));
        restoreState();
        requestAnimationFrame(() => {
            hub.classList.add('active');
            setTimeout(() => {
                const activeItem = hub.querySelector('.sh-dial-item.active');
                if (activeItem) activeItem.scrollIntoView({ inline: 'center', behavior: 'auto' });
            }, 50);
        });
    };

})();
