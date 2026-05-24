// js/-A-25-settings-customizer.js · A0nynx_3i 系统个性化微调逻辑（无限 IndexedDB 驱动版）
(function(){
'use strict';

// ── 0. 独立的高性能 IndexedDB 存储引擎 ──
var SystemSettingsDB = (function() {
    var DB_NAME = 'A0nynx_SystemSettingsDB';
    var STORE_NAME = 'settings';
    var db = null;

    function open(cb) {
        if (db) { cb(db); return; }
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function(e) {
            var d = e.target.result;
            if (!d.objectStoreNames.contains(STORE_NAME)) {
                d.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = function(e) { db = e.target.result; cb(db); };
        req.onerror = function() { cb(null); };
    }

    function set(key, val, cb) {
        open(function(d) {
            if (!d) { if (cb) cb(); return; }
            var tx = d.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(val, key);
            tx.oncomplete = function() { if (cb) cb(); };
        });
    }

    function get(key, cb) {
        open(function(d) {
            if (!d) { cb(null); return; }
            var tx = d.transaction(STORE_NAME, 'readonly');
            var req = tx.objectStore(STORE_NAME).get(key);
            req.onsuccess = function() { cb(req.result || null); };
            req.onerror = function() { cb(null); };
        });
    }

    function remove(key, cb) {
        open(function(d) {
            if (!d) { if (cb) cb(); return; }
            var tx = d.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(key);
            tx.oncomplete = function() { if (cb) cb(); };
        });
    }

    function clear(cb) {
        open(function(d) {
            if (!d) { if (cb) cb(); return; }
            var tx = d.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = function() { if (cb) cb(); };
        });
    }

    return { set: set, get: get, remove: remove, clear: clear };
})();
window.SystemSettingsDB = SystemSettingsDB;

// ── 默认图标 SVG 数据库 ──
var DEFAULT_SVGS = {
    p1: {
        chat: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 9.5a6.5 6.5 0 0 0-11.8-3.4 6.5 6.5 0 0 0-1.7 6.4L2 16l3.5-1.1A6.5 6.5 0 0 0 17 9.5Z" fill="rgba(28,28,30,0.08)" stroke="none"/><path d="M21 13.5a6.5 6.5 0 0 1-1.7 4.4L22 21l-3.5-1.1a6.5 6.5 0 1 1 2.5-6.4Z"/></svg>`,
        folder: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10a1 1 0 0 1 1 1v8H6V4a1 1 0 0 1 1-1z" fill="rgba(255,255,255,0.15)" stroke="none"/><path d="M4 5h5l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="rgba(255,255,255,0.05)"/><path d="M2 12.5l20-3v8.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.5z"/></svg>`,
        config: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="20" x2="6" y2="4" stroke-opacity="0.3"/><line x1="12" y1="20" x2="12" y2="4" stroke-opacity="0.3"/><line x1="18" y1="20" x2="18" y2="4" stroke-opacity="0.3"/><rect x="3" y="12" width="6" height="4" rx="1" fill="rgba(28,28,30,0.1)"/><rect x="9" y="6" width="6" height="4" rx="1" fill="rgba(28,28,30,0.1)"/><rect x="15" y="14" width="6" height="4" rx="1" fill="rgba(28,28,30,0.1)"/></svg>`,
        lens: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="3" fill="rgba(255,255,255,0.08)"/><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="1.5"/></svg>`,
        gallery: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="12" height="12" rx="2" fill="rgba(28,28,30,0.15)" stroke="none"/><rect x="8" y="8" width="12" height="12" rx="2" fill="var(--glass-panel)"/><path d="M8 16l3-3 2 2 3-3 2 2"/></svg>`,
        time: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="21"/><line x1="3" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="21" y2="12"/><circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.8)"/><line x1="12" y1="12" x2="12" y2="7"/><line x1="12" y1="12" x2="15.5" y2="13.5"/></svg>`,
        notes: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" fill="rgba(255,255,255,0.08)"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>`,
        theatre: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c0 4.5-4.5 9-9 9 4.5 0 9 4.5 9 9 0-4.5 4.5-9 9-9-4.5 0-9-4.5-9-9z" fill="rgba(28,28,30,0.08)"/></svg>`
    },
    p2: {
        camera: `<span class="p2-ico-star">★</span><svg viewBox="0 0 24 24" fill="none" stroke="#151517" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="4" fill="rgba(21,21,23,0.02)"/><circle cx="12" cy="12" r="3.5"/><path d="M7 6 L9 3 L15 3 L17 6"/><circle cx="12" cy="12" r="1" fill="#151517"/><circle cx="18" cy="9" r="0.7" fill="#151517" stroke="none"/></svg>`,
        shop: `<svg viewBox="0 0 24 24" fill="none" stroke="#151517" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11C7 4 10 2 11 6C12 9 12 9 13 6C14 2 17 4 17 11C20 13 20 18 17 20C14 22 10 22 7 20C4 18 4 13 7 11Z" fill="rgba(21,21,23,0.02)"/><circle cx="9" cy="15" r="1" fill="#151517"/><circle cx="15" cy="15" r="1" fill="#151517"/><path d="M11 16Q12 18 13 16"/></svg>`,
        settings: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 1 1 4 0v.09"/></svg>`,
        photos: `<span class="p2-ico-star">❄</span><svg viewBox="0 0 24 24" fill="none" stroke="#151517" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3" fill="rgba(21,21,23,0.02)"/><path d="M4 15 L9 10 L13 14 L17 9 L20 12"/><circle cx="15" cy="7.5" r="1" fill="#151517" stroke="none"/></svg>`
    }
};

// ── 1. 全局渲染与应用主题（核心逻辑） ──
window.applyGlobalTheme = function(cb) {
    SystemSettingsDB.get('a0-system-wp', function(wp) {
        SystemSettingsDB.get('a0-system-icon-style', function(iconStyle) {
            SystemSettingsDB.get('a0-system-blur', function(blur) {
                SystemSettingsDB.get('a0-system-grain', function(grain) {
                    SystemSettingsDB.get('a0-system-card-deco', function(cardDeco) {
                        wp = wp || 'lucid-white';
                        iconStyle = iconStyle || 'glass';
                        blur = blur || '20';
                        grain = grain || '2';
                        cardDeco = cardDeco || 'none';

                        // 1. 壁纸应用（锁定高保真，防止模糊与放大）
                        const mainFrame = document.getElementById('main-frame');
                        const archLights = document.querySelectorAll('.architectural-light, .p2-arch');
                        if (mainFrame) {
                            if (wp === 'lucid-white') {
                                mainFrame.style.backgroundImage = 'none';
                                mainFrame.style.backgroundColor = '#F8F8FA';
                                archLights.forEach(el => el.style.display = 'block');
                            } else if (wp === 'arch-light') {
                                mainFrame.style.backgroundImage = 'linear-gradient(135deg, #e5e5e7 0%, #ffffff 100%)';
                                archLights.forEach(el => el.style.display = 'none');
                            } else if (wp === 'obsidian-dark') {
                                mainFrame.style.backgroundImage = 'none';
                                mainFrame.style.backgroundColor = '#1e1e20';
                                archLights.forEach(el => el.style.display = 'none');
                            } else if (wp.startsWith('data:image')) {
                                mainFrame.style.backgroundImage = `url(${wp})`;
                                mainFrame.style.backgroundColor = 'transparent';
                                archLights.forEach(el => el.style.display = 'none');
                            }
                        }

                        // 2. 动态注入 CSS 覆盖全局样式
                        let styleEl = document.getElementById('a0-dynamic-theme-overrides');
                        if (!styleEl) {
                            styleEl = document.createElement('style');
                            styleEl.id = 'a0-dynamic-theme-overrides';
                            document.head.appendChild(styleEl);
                        }

                        let css = `
                            :root {
                                --glass-blur: blur(${blur}px) saturate(140%);
                                --preview-blur: ${blur}px;
                                --preview-grain: ${grain / 100};
                            }
                            .texture-noise, .p2-grain {
                                opacity: ${grain / 100} !important;
                            }
                            #main-frame {
                                background-size: cover !important;
                                background-position: center !important;
                                background-repeat: no-repeat !important;
                                background-attachment: fixed !important;
                                transform: none !important;
                                animation: none !important;
                            }
                        `;
                        styleEl.innerHTML = css;

                        // 2.5 个人资料卡高定装饰渲染
                        const p2Card = document.getElementById('p2ProfileCard');
                        if (p2Card) {
                            p2Card.className = 'p2-card'; // 重置
                            if (cardDeco !== 'none') {
                                p2Card.classList.add(`deco-${cardDeco}`);
                            }
                        }

                        // 3. 全局应用自定义上传的图标（覆盖 Page 1 & Page 2 且保留外框）
                        applyCustomIconsGlobally();

                        if (cb) cb();
                    });
                });
            });
        });
    });
};

// ── 2. 全局应用自定义图标 ──
function applyCustomIconsGlobally() {
    // Page 1 图标应用
    const p1Apps = ['chat', 'folder', 'config', 'lens', 'gallery', 'time', 'notes', 'theatre'];
    p1Apps.forEach(app => {
        SystemSettingsDB.get(`a0-p1-icon-${app}`, function(customIconData) {
            const p1Items = document.querySelectorAll('.app-item');
            p1Items.forEach(item => {
                const label = item.querySelector('.app-label');
                if (label && isMatchingAppP1(label.textContent, app)) {
                    const iconBox = item.querySelector('.app-icon');
                    if (iconBox) {
                        if (customIconData) {
                            iconBox.innerHTML = `<img src="${customIconData}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;">`;
                        } else {
                            iconBox.innerHTML = DEFAULT_SVGS.p1[app];
                        }
                    }
                }
            });
        });
    });

    // Page 2 图标应用
    const p2Apps = ['camera', 'shop', 'settings', 'photos'];
    p2Apps.forEach(app => {
        SystemSettingsDB.get(`a0-p2-icon-${app}`, function(customIconData) {
            const p2Items = document.querySelectorAll('.p2-app');
            p2Items.forEach(item => {
                const label = item.querySelector('.p2-app-l');
                if (label && isMatchingAppP2(label.textContent, app)) {
                    const iconBox = item.querySelector('.p2-ico');
                    if (iconBox) {
                        if (customIconData) {
                            iconBox.innerHTML = `<img src="${customIconData}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;">`;
                        } else {
                            iconBox.innerHTML = DEFAULT_SVGS.p2[app];
                        }
                    }
                }
            });
        });
    });
}

function isMatchingAppP1(labelText, appKey) {
    const text = labelText.toLowerCase().trim();
    return text === appKey;
}

function isMatchingAppP2(labelText, appKey) {
    const text = labelText.toLowerCase().trim();
    if (appKey === 'camera') return text.includes('相机');
    if (appKey === 'shop') return text.includes('商店');
    if (appKey === 'settings') return text.includes('设置');
    if (appKey === 'photos') return text.includes('照片');
    return false;
}

// ── 3. 打开设置面板 ──
window.openSettingsCustomizer = function() {
    SystemSettingsDB.get('a0-system-wp', function(wp) {
        SystemSettingsDB.get('a0-system-icon-style', function(iconStyle) {
            SystemSettingsDB.get('a0-system-blur', function(blur) {
                SystemSettingsDB.get('a0-system-grain', function(grain) {
                    SystemSettingsDB.get('a0-system-card-deco', function(cardDeco) {
                        wp = wp || 'lucid-white';
                        iconStyle = iconStyle || 'glass';
                        blur = blur || '20';
                        grain = grain || '2';
                        cardDeco = cardDeco || 'none';

                        renderPanelHTML(wp, iconStyle, blur, grain, cardDeco);
                    });
                });
            });
        });
    });
};

function renderPanelHTML(wp, iconStyle, blur, grain, cardDeco) {
    let panel = document.getElementById('settingsCustomizerPanel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'settingsCustomizerPanel';
        panel.className = 'settings-customizer-panel';
        document.getElementById('main-frame').appendChild(panel);
    }

    // 检查是否有自定义壁纸并渲染胶片卡片
    let customWpFrameHTML = '';
    if (wp.startsWith('data:image')) {
        customWpFrameHTML = `
            <div class="sc-film-frame active" data-wp="${wp}" id="scCustomWpFrame">
                <div class="sc-film-thumb" style="background-image: url(${wp});"></div>
                <div style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:6px;font-weight:900;color:#151517;background:rgba(255,255,255,0.8);padding:1px 0;">CUSTOM</div>
            </div>
        `;
    }

    panel.innerHTML = `
        <div class="sc-scroll">
            <!-- 头部 -->
            <div class="sc-header">
                <div class="sc-header-left">
                    <div class="sc-back-btn" id="scBackBtn">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </div>
                    <div class="sc-brand">
                        <p>A0nynx_3i · Customizer</p>
                        <h1>Atelier</h1>
                    </div>
                </div>
                <div class="sc-coordinates">LAT. 48.8566° N<br>LON. 2.3522° E</div>
            </div>

            <!-- 01. 壁纸选择 -->
            <div class="sc-section">
                <div class="sc-section-title">01 / Wallpaper Roll</div>
                <div class="sc-film-container" id="scFilmContainer">
                    ${customWpFrameHTML}
                    <div class="sc-film-frame" data-wp="lucid-white"><div class="sc-film-thumb" style="background-color: #F8F8FA;"></div></div>
                    <div class="sc-film-frame" data-wp="arch-light"><div class="sc-film-thumb" style="background-image: linear-gradient(135deg, #e5e5e7 0%, #ffffff 100%);"></div></div>
                    <div class="sc-film-frame" data-wp="obsidian-dark"><div class="sc-film-thumb" style="background-color: #1e1e20;"></div></div>
                    <div class="sc-upload-btn" id="scUploadBtn">
                        <svg viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span>Upload</span>
                    </div>
                    <input type="file" accept="image/*" id="scWpInput" style="display:none;">
                </div>
            </div>

            <!-- 02. 风格选择 -->
            <div class="sc-section">
                <div class="sc-section-title">02 / Icon Metallurgy</div>
                <div class="sc-knob-row">
                    <div class="sc-knob-option" data-style="glass">
                        <div class="sc-knob-dial"></div>
                        <div><div class="sc-knob-title">Glass</div><div class="sc-knob-desc">Frosted glass</div></div>
                    </div>
                    <div class="sc-knob-option" data-style="outline">
                        <div class="sc-knob-dial"></div>
                        <div><div class="sc-knob-title">Outline</div><div class="sc-knob-desc">Thin geometry</div></div>
                    </div>
                    <div class="sc-knob-option" data-style="dark">
                        <div class="sc-knob-dial"></div>
                        <div><div class="sc-knob-title">Obsidian</div><div class="sc-knob-desc">Solid deep fill</div></div>
                    </div>
                </div>
            </div>

            <!-- 02.5 个人资料卡高定装饰选择 -->
            <div class="sc-section">
                <div class="sc-section-title">02.5 / Card Atelier Decoration</div>
                <div class="sc-deco-grid">
                    <div class="sc-deco-option" data-deco="none">
                        <div class="sc-deco-title">None</div>
                        <div class="sc-deco-desc">Pure minimalism</div>
                    </div>
                    <div class="sc-deco-option" data-deco="swiss">
                        <div class="sc-deco-title">Swiss</div>
                        <div class="sc-deco-desc">Precision instrument</div>
                    </div>
                    <div class="sc-deco-option" data-deco="celestial">
                        <div class="sc-deco-title">Celestial</div>
                        <div class="sc-deco-desc">Orbit constellations</div>
                    </div>
                    <div class="sc-deco-option" data-deco="botanical">
                        <div class="sc-deco-title">Botanical</div>
                        <div class="sc-deco-desc">Leaf line draft</div>
                    </div>
                    <div class="sc-deco-option" data-deco="blueprint">
                        <div class="sc-deco-title">Blueprint</div>
                        <div class="sc-deco-desc">Architectural draft</div>
                    </div>
                    <div class="sc-deco-option" data-deco="tag">
                        <div class="sc-deco-title">Tag</div>
                        <div class="sc-deco-desc">Deconstructed label</div>
                    </div>
                </div>
            </div>

            <!-- 03. 精密微调 -->
            <div class="sc-section">
                <div class="sc-section-title">03 / Texture Physics</div>
                <div class="sc-sliders">
                    <div class="sc-slider-group">
                        <div class="sc-slider-info"><span>Glass Blur Strength</span><span id="scBlurVal">20px</span></div>
                        <input type="range" min="0" max="40" value="20" class="sc-range" id="scBlurSlider">
                        <div class="sc-slider-ticks"><span></span><span></span><span></span><span></span><span></span></div>
                    </div>
                    <div class="sc-slider-group">
                        <div class="sc-slider-info"><span>Grain Density</span><span id="scGrainVal">2%</span></div>
                        <input type="range" min="0" max="10" value="2" class="sc-range" id="scGrainSlider">
                        <div class="sc-slider-ticks"><span></span><span></span><span></span><span></span><span></span></div>
                    </div>
                </div>
            </div>

            <!-- 04. 实时预览与独立图标上传 -->
            <div class="sc-section">
                <div class="sc-section-title">04 / Live Render (Tap Icon to Upload)</div>
                <div style="display:flex;justify-content:center;gap:12px;margin-bottom:16px;">
                    <button id="scTabP1Btn" style="padding:6px 16px;font-size:10px;font-weight:700;letter-spacing:1px;border:1px solid #151517;background:#151517;color:#FFF;border-radius:20px;cursor:pointer;">Page 1 Icons</button>
                    <button id="scTabP2Btn" style="padding:6px 16px;font-size:10px;font-weight:700;letter-spacing:1px;border:1px solid rgba(21,21,23,0.15);background:transparent;color:#8E8E93;border-radius:20px;cursor:pointer;">Page 2 Icons</button>
                </div>
                
                <div class="sc-preview">
                    <div class="sc-preview-card">
                        <div class="sc-phone">
                            <div class="sc-phone-wp" id="scPhoneWp"></div>
                            <div class="sc-phone-glass" id="scPhoneGlass"></div>
                            <div class="sc-phone-grain" id="scPhoneGrain"></div>
                            
                            <!-- Page 1 预览网格 -->
                            <div class="sc-phone-grid" id="scPhoneGridP1" style="display:grid; grid-template-rows: repeat(2, 1fr);">
                                <div class="sc-phone-app" data-app="p1-chat">
                                    <div class="sc-phone-ico" id="scIco-p1-chat"></div>
                                    <div class="sc-phone-label">Chat</div>
                                </div>
                                <div class="sc-phone-app" data-app="p1-folder">
                                    <div class="sc-phone-ico" id="scIco-p1-folder"></div>
                                    <div class="sc-phone-label">Folder</div>
                                </div>
                                <div class="sc-phone-app" data-app="p1-config">
                                    <div class="sc-phone-ico" id="scIco-p1-config"></div>
                                    <div class="sc-phone-label">Config</div>
                                </div>
                                <div class="sc-phone-app" data-app="p1-lens">
                                    <div class="sc-phone-ico" id="scIco-p1-lens"></div>
                                    <div class="sc-phone-label">Lens</div>
                                </div>
                                <div class="sc-phone-app" data-app="p1-gallery">
                                    <div class="sc-phone-ico" id="scIco-p1-gallery"></div>
                                    <div class="sc-phone-label">Gallery</div>
                                </div>
                                <div class="sc-phone-app" data-app="p1-time">
                                    <div class="sc-phone-ico" id="scIco-p1-time"></div>
                                    <div class="sc-phone-label">Time</div>
                                </div>
                                <div class="sc-phone-app" data-app="p1-notes">
                                    <div class="sc-phone-ico" id="scIco-p1-notes"></div>
                                    <div class="sc-phone-label">Notes</div>
                                </div>
                                <div class="sc-phone-app" data-app="p1-theatre">
                                    <div class="sc-phone-ico" id="scIco-p1-theatre"></div>
                                    <div class="sc-phone-label">Theatre</div>
                                </div>
                            </div>

                            <!-- Page 2 预览网格 -->
                            <div class="sc-phone-grid" id="scPhoneGridP2" style="display:none;">
                                <div class="sc-phone-app" data-app="p2-camera">
                                    <div class="sc-phone-ico" id="scIco-p2-camera"></div>
                                    <div class="sc-phone-label">相机</div>
                                </div>
                                <div class="sc-phone-app" data-app="p2-shop">
                                    <div class="sc-phone-ico" id="scIco-p2-shop"></div>
                                    <div class="sc-phone-label">商店</div>
                                </div>
                                <div class="sc-phone-app" data-app="p2-settings">
                                    <div class="sc-phone-ico" id="scIco-p2-settings"></div>
                                    <div class="sc-phone-label">设置</div>
                                </div>
                                <div class="sc-phone-app" data-app="p2-photos">
                                    <div class="sc-phone-ico" id="scIco-p2-photos"></div>
                                    <div class="sc-phone-label">照片</div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <input type="file" accept="image/*" id="scIconFileInput" style="display:none;">
                <div style="text-align:center;margin-top:20px;display:flex;justify-content:center;gap:12px;">
                    <button id="scResetIconsBtn" style="padding:8px 18px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border:1px solid #A63426;background:transparent;color:#A63426;border-radius:20px;cursor:pointer;">恢复默认图标</button>
                    <button id="scResetAllBtn" style="padding:8px 18px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border:1px solid #8E8E93;background:#8E8E93;color:#FFF;border-radius:20px;cursor:pointer;">恢复出厂壁纸</button>
                </div>
            </div>
        </div>
    `;

    const scPhoneWp = document.getElementById('scPhoneWp');
    const scPhoneGlass = document.getElementById('scPhoneGlass');
    const scPhoneGrain = document.getElementById('scPhoneGrain');
    const scFilmContainer = document.getElementById('scFilmContainer');
    const scKnobOptions = panel.querySelectorAll('.sc-knob-option');
    const scDecoOptions = panel.querySelectorAll('.sc-deco-option');
    const scPhoneIcos = panel.querySelectorAll('.sc-phone-ico');
    const scUploadBtn = document.getElementById('scUploadBtn');
    const scWpInput = document.getElementById('scWpInput');
    const scBlurSlider = document.getElementById('scBlurSlider');
    const scBlurVal = document.getElementById('scBlurVal');
    const scGrainSlider = document.getElementById('scGrainSlider');
    const scGrainVal = document.getElementById('scGrainVal');
    const scIconFileInput = document.getElementById('scIconFileInput');
    const scResetIconsBtn = document.getElementById('scResetIconsBtn');
    const scResetAllBtn = document.getElementById('scResetAllBtn');

    const scTabP1Btn = document.getElementById('scTabP1Btn');
    const scTabP2Btn = document.getElementById('scTabP2Btn');
    const scPhoneGridP1 = document.getElementById('scPhoneGridP1');
    const scPhoneGridP2 = document.getElementById('scPhoneGridP2');

    let activeAppToUpload = null; // 格式: 'p1-chat' 或 'p2-camera'

    // 选项卡切换
    scTabP1Btn.onclick = function() {
        scTabP1Btn.style.background = '#151517'; scTabP1Btn.style.color = '#FFF'; scTabP1Btn.style.borderColor = '#151517';
        scTabP2Btn.style.background = 'transparent'; scTabP2Btn.style.color = '#8E8E93'; scTabP2Btn.style.borderColor = 'rgba(21,21,23,0.15)';
        scPhoneGridP1.style.display = 'grid';
        scPhoneGridP2.style.display = 'none';
    };
    scTabP2Btn.onclick = function() {
        scTabP2Btn.style.background = '#151517'; scTabP2Btn.style.color = '#FFF'; scTabP2Btn.style.borderColor = '#151517';
        scTabP1Btn.style.background = 'transparent'; scTabP1Btn.style.color = '#8E8E93'; scTabP1Btn.style.borderColor = 'rgba(21,21,23,0.15)';
        scPhoneGridP2.style.display = 'grid';
        scPhoneGridP1.style.display = 'none';
    };

    // 预览实时更新函数
    function updatePreview() {
        SystemSettingsDB.get('a0-system-wp', function(wpVal) {
            SystemSettingsDB.get('a0-system-icon-style', function(styleVal) {
                SystemSettingsDB.get('a0-system-blur', function(blurValData) {
                    SystemSettingsDB.get('a0-system-grain', function(grainValData) {
                        SystemSettingsDB.get('a0-system-card-deco', function(decoVal) {
                            const wp = wpVal || 'lucid-white';
                            const style = styleVal || 'glass';
                            const blur = blurValData || '20';
                            const grain = grainValData || '2';
                            const deco = decoVal || 'none';

                        // 1. 壁纸渲染
                        const scFilmFrames = panel.querySelectorAll('.sc-film-frame');
                        scFilmFrames.forEach(f => f.classList.remove('active'));
                        if (wp.startsWith('data:image')) {
                            scPhoneWp.style.backgroundImage = `url(${wp})`;
                            scPhoneWp.style.backgroundSize = 'cover';
                            scPhoneWp.style.backgroundPosition = 'center';
                            const customFrame = document.getElementById('scCustomWpFrame');
                            if (customFrame) customFrame.classList.add('active');
                        } else {
                            const activeFrame = panel.querySelector(`.sc-film-frame[data-wp="${wp}"]`);
                            if (activeFrame) activeFrame.classList.add('active');
                            if (wp === 'lucid-white') {
                                scPhoneWp.style.backgroundImage = 'none';
                                scPhoneWp.style.backgroundColor = '#F8F8FA';
                            } else if (wp === 'arch-light') {
                                scPhoneWp.style.backgroundImage = 'linear-gradient(135deg, #e5e5e7 0%, #ffffff 100%)';
                            } else if (wp === 'obsidian-dark') {
                                scPhoneWp.style.backgroundImage = 'none';
                                scPhoneWp.style.backgroundColor = '#1e1e20';
                            }
                        }

                        // 2. 图标外框风格
                        scKnobOptions.forEach(k => k.classList.remove('active'));
                        const activeKnob = panel.querySelector(`.sc-knob-option[data-style="${style}"]`);
                        if (activeKnob) activeKnob.classList.add('active');
                        
                        scPhoneIcos.forEach(ico => {
                            ico.className = 'sc-phone-ico';
                            ico.classList.add(`style-${style}`);
                        });

                        // 3. 渲染 Page 1 已上传的自定义图标
                        const p1Apps = ['chat', 'folder', 'config', 'lens', 'gallery', 'time', 'notes', 'theatre'];
                        p1Apps.forEach(app => {
                            SystemSettingsDB.get(`a0-p1-icon-${app}`, function(customIconData) {
                                const icoBox = document.getElementById(`scIco-p1-${app}`);
                                if (icoBox) {
                                    if (customIconData) {
                                        icoBox.innerHTML = `<img src="${customIconData}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;">`;
                                    } else {
                                        icoBox.innerHTML = DEFAULT_SVGS.p1[app];
                                    }
                                }
                            });
                        });

                        // 4. 渲染 Page 2 已上传的自定义图标
                        const p2Apps = ['camera', 'shop', 'settings', 'photos'];
                        p2Apps.forEach(app => {
                            SystemSettingsDB.get(`a0-p2-icon-${app}`, function(customIconData) {
                                const icoBox = document.getElementById(`scIco-p2-${app}`);
                                if (icoBox) {
                                    if (customIconData) {
                                        icoBox.innerHTML = `<img src="${customIconData}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;">`;
                                    } else {
                                        icoBox.innerHTML = DEFAULT_SVGS.p2[app];
                                    }
                                }
                            });
                        });

                        // 5. 模糊度
                        scBlurVal.innerText = `${blur}px`;
                        scPhoneGlass.style.backdropFilter = `blur(${blur}px)`;
                        scPhoneGlass.style.webkitBackdropFilter = `blur(${blur}px)`;

                        // 5.5 资料卡高定装饰
                        scDecoOptions.forEach(d => d.classList.remove('active'));
                        const activeDeco = panel.querySelector(`.sc-deco-option[data-deco="${deco}"]`);
                        if (activeDeco) activeDeco.classList.add('active');

                        // 6. 微粒感
                        scGrainVal.innerText = `${grain}%`;
                        scPhoneGrain.style.opacity = String(grain / 100);
                        });
                    });
                });
            });
        });
    }

    scBlurSlider.value = blur;
    scGrainSlider.value = grain;
    updatePreview();

    // 绑定高定装饰点击
    scDecoOptions.forEach(option => {
        option.onclick = function() {
            const decoType = option.getAttribute('data-deco');
            SystemSettingsDB.set('a0-system-card-deco', decoType, function() {
                updatePreview();
                window.applyGlobalTheme();
            });
        };
    });

    // 绑定壁纸点击
    function bindFilmClicks() {
        const scFilmFrames = panel.querySelectorAll('.sc-film-frame');
        scFilmFrames.forEach(frame => {
            frame.onclick = function() {
                const wpType = frame.getAttribute('data-wp');
                SystemSettingsDB.set('a0-system-wp', wpType, function() {
                    updatePreview();
                    window.applyGlobalTheme();
                });
            };
        });
    }
    bindFilmClicks();

    // 绑定上传壁纸
    scUploadBtn.onclick = function() { scWpInput.click(); };
    scWpInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const dataUrl = event.target.result;
            SystemSettingsDB.set('a0-system-wp', dataUrl, function() {
                let customFrame = document.getElementById('scCustomWpFrame');
                if (customFrame) {
                    customFrame.setAttribute('data-wp', dataUrl);
                    customFrame.querySelector('.sc-film-thumb').style.backgroundImage = `url(${dataUrl})`;
                } else {
                    const newFrame = document.createElement('div');
                    newFrame.id = 'scCustomWpFrame';
                    newFrame.className = 'sc-film-frame';
                    newFrame.setAttribute('data-wp', dataUrl);
                    newFrame.innerHTML = `
                        <div class="sc-film-thumb" style="background-image: url(${dataUrl});"></div>
                        <div style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:6px;font-weight:900;color:#151517;background:rgba(255,255,255,0.8);padding:1px 0;">CUSTOM</div>
                    `;
                    scFilmContainer.insertBefore(newFrame, scFilmContainer.firstChild);
                }
                bindFilmClicks();
                updatePreview();
                window.applyGlobalTheme();
            });
        };
        reader.readAsDataURL(file);
    };

    // 绑定图标点击上传
    const scPhoneApps = panel.querySelectorAll('.sc-phone-app');
    scPhoneApps.forEach(appEl => {
        appEl.onclick = function() {
            activeAppToUpload = appEl.getAttribute('data-app');
            scIconFileInput.click();
        };
    });

    scIconFileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file || !activeAppToUpload) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            // 根据 activeAppToUpload 分发存储键名
            const parts = activeAppToUpload.split('-');
            const page = parts[0]; // 'p1' 或 'p2'
            const appName = parts[1];
            
            SystemSettingsDB.set(`a0-${page}-icon-${appName}`, event.target.result, function() {
                updatePreview();
                window.applyGlobalTheme();
            });
        };
        reader.readAsDataURL(file);
    };

    // 恢复默认图标（实时生效）
    scResetIconsBtn.onclick = function() {
        const p1Apps = ['chat', 'folder', 'config', 'lens', 'gallery', 'time', 'notes', 'theatre'];
        const p2Apps = ['camera', 'shop', 'settings', 'photos'];
        
        let remaining = p1Apps.length + p2Apps.length;
        
        p1Apps.forEach(app => {
            SystemSettingsDB.remove(`a0-p1-icon-${app}`, checkDone);
        });
        p2Apps.forEach(app => {
            SystemSettingsDB.remove(`a0-p2-icon-${app}`, checkDone);
        });

        function checkDone() {
            remaining--;
            if (remaining === 0) {
                // 实时更新当前预览与桌面
                updatePreview();
                window.applyGlobalTheme();
            }
        }
    };

    // 恢复出厂壁纸与全局设置
    scResetAllBtn.onclick = function() {
        SystemSettingsDB.clear(function() {
            location.reload();
        });
    };

    // 绑定风格点击
    scKnobOptions.forEach(knob => {
        knob.onclick = function() {
            const style = knob.getAttribute('data-style');
            SystemSettingsDB.set('a0-system-icon-style', style, function() {
                updatePreview();
                window.applyGlobalTheme();
            });
        };
    });

    // 绑定滑块
    scBlurSlider.oninput = function(e) {
        SystemSettingsDB.set('a0-system-blur', e.target.value, function() {
            updatePreview();
            window.applyGlobalTheme();
        });
    };
    scGrainSlider.oninput = function(e) {
        SystemSettingsDB.set('a0-system-grain', e.target.value, function() {
            updatePreview();
            window.applyGlobalTheme();
        });
    };

    // 返回按钮
    document.getElementById('scBackBtn').onclick = function() {
        panel.classList.remove('active');
    };

    setTimeout(() => panel.classList.add('active'), 30);
}

})();
