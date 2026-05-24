// js/app.js · A0nynx_3i
// 框架已就绪，内容从 page1 开始填

window.onload = function () {
    updateClock();
    setInterval(updateClock, 1000);
    initDesktopSwiper();
    renderPage1();
    renderPage2();
    if (window.applyGlobalTheme) {
        window.applyGlobalTheme();
    }
    console.log('✅ A0nynx_3i 启动');
};

/* ── 时钟 ── */
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const el = document.getElementById('desktop-clock');
    if (el) el.innerText = `${h}:${m}`;

    const months = ['Jan.','Feb.','Mar.','Apr.','May.','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.'];
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayEl = document.getElementById('widgetDateDay');
    const weekEl = document.getElementById('widgetDateWeek');
    if (dayEl) dayEl.innerHTML = now.getDate() + ' <span>' + months[now.getMonth()] + '</span>';
    if (weekEl) weekEl.textContent = days[now.getDay()];
}

/* ── 分页滑动 ── */
function initDesktopSwiper() {
    const swiper = document.getElementById('swiper');
    const dot1   = document.getElementById('dot1');
    const dot2   = document.getElementById('dot2');
    if (!swiper) return;

    swiper.addEventListener('scroll', () => {
        const ratio = swiper.scrollLeft / swiper.clientWidth;
        dot1.classList.toggle('active', ratio < 0.5);
        dot2.classList.toggle('active', ratio >= 0.5);
    }, { passive: true });
}

/* ── Page 1 内容渲染 ── */
function renderPage1() {
    const page = document.getElementById('page1');
    if (!page) return;

    page.innerHTML = `
        <style>
            .texture-noise {
                position: absolute; inset: 0; z-index: 1; pointer-events: none;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
            }
            .architectural-light {
                position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                z-index: 0; pointer-events: none;
                background: linear-gradient(105deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.9) 35%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 65%, rgba(255,255,255,0) 80%);
                filter: blur(25px);
                animation: light-drift 20s ease-in-out infinite alternate;
            }
            @keyframes light-drift {
                0% { transform: translateY(-10%) translateX(-10%) rotate(0deg); }
                100% { transform: translateY(10%) translateX(10%) rotate(5deg); }
            }
            .bg-watermark {
                position: absolute; top: 35%; left: -15%;
                font-family: 'Playfair Display', serif; font-size: 220px; font-weight: 900; font-style: italic;
                color: rgba(21, 21, 23, 0.02); z-index: 2; pointer-events: none;
                transform: rotate(-90deg) translateY(-50%); letter-spacing: -5px;
            }
        </style>

        <!-- 背景层（跟随页面） -->
        <div class="architectural-light"></div>
        <div class="texture-noise"></div>
        <div class="bg-watermark">Aesthetic</div>

        <!-- Editorial 日期组件 -->
        <div class="widget-editorial" id="widgetEditorial">
            <div class="date-watermark-signature">Signature</div>
            <div class="widget-date" id="widgetDateDay"></div>
            <div class="widget-date" id="widgetDateWeek" style="font-size:28px;color:#555;margin-top:-2px;"></div>
            <div class="widget-sub">
                <span>Vol. 01 / Paris</span>
                <div class="barcode"></div>
            </div>
            <div class="signature-break">Avant-Garde</div>
        </div>

        <!-- 门票 Music Card -->
        <div class="ticket-wrapper">
            <div class="ticket-body">
                <div class="ticket-accent-bar"></div>
                <div class="ticket-left">
                    <div class="t-header">
                        <span class="t-badge">PLAYING</span>
                        <span class="t-id">TKT. #001</span>
                    </div>
                    <div class="t-title">Nocturne in E-flat</div>
                    <div class="t-artist">Frederic Chopin</div>
                    <div class="t-progress-wrapper">
                        <span class="t-time">02:14</span>
                        <div class="t-bar">
                            <div class="t-bar-fill"></div>
                            <div class="t-bar-dot"></div>
                        </div>
                    </div>
                </div>
                <div class="ticket-tear-line"></div>
                <div class="ticket-right">
                    <div class="t-vinyl">
                        <div class="t-label"><div class="t-hole"></div></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 分割线 -->
        <div class="ticket-divider"></div>

        <!-- App 图标网格 -->
        <div class="app-grid">
            <div class="app-item" onclick="if(window.openChatRoom) window.openChatRoom();">
                <div class="app-icon light">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 9.5a6.5 6.5 0 0 0-11.8-3.4 6.5 6.5 0 0 0-1.7 6.4L2 16l3.5-1.1A6.5 6.5 0 0 0 17 9.5Z" fill="rgba(28,28,30,0.08)" stroke="none"/>
                        <path d="M21 13.5a6.5 6.5 0 0 1-1.7 4.4L22 21l-3.5-1.1a6.5 6.5 0 1 1 2.5-6.4Z"/>
                    </svg>
                </div>
                <span class="app-label">Chat</span>
            </div>
            <div class="app-item" onclick="if(window.openWorldBook) window.openWorldBook();">
                <div class="app-icon dark">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7 3h10a1 1 0 0 1 1 1v8H6V4a1 1 0 0 1 1-1z" fill="rgba(255,255,255,0.15)" stroke="none"/>
                        <path d="M4 5h5l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="rgba(255,255,255,0.05)"/>
                        <path d="M2 12.5l20-3v8.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.5z"/>
                    </svg>
                </div>
                <span class="app-label">Folder</span>
            </div>
            <div class="app-item" onclick="if(window.openSettingsHub) window.openSettingsHub();">
                <div class="app-icon light">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="6" y1="20" x2="6" y2="4" stroke-opacity="0.3"/>
                        <line x1="12" y1="20" x2="12" y2="4" stroke-opacity="0.3"/>
                        <line x1="18" y1="20" x2="18" y2="4" stroke-opacity="0.3"/>
                        <rect x="3" y="12" width="6" height="4" rx="1" fill="rgba(28,28,30,0.1)"/>
                        <rect x="9" y="6" width="6" height="4" rx="1" fill="rgba(28,28,30,0.1)"/>
                        <rect x="15" y="14" width="6" height="4" rx="1" fill="rgba(28,28,30,0.1)"/>
                    </svg>
                </div>
                <span class="app-label">Config</span>
            </div>
            <div class="app-item" onclick="if(window.openLensApp) window.openLensApp();">
                <div class="app-icon dark">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="6" width="18" height="12" rx="3" fill="rgba(255,255,255,0.08)"/>
                        <circle cx="12" cy="12" r="3.5"/>
                        <circle cx="12" cy="12" r="1.5"/>
                    </svg>
                </div>
                <span class="app-label">Lens</span>
            </div>
            <div class="app-item">
                <div class="app-icon light">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="4" width="12" height="12" rx="2" fill="rgba(28,28,30,0.15)" stroke="none"/>
                        <rect x="8" y="8" width="12" height="12" rx="2" fill="var(--glass-panel)"/>
                        <path d="M8 16l3-3 2 2 3-3 2 2"/>
                    </svg>
                </div>
                <span class="app-label">Gallery</span>
            </div>
            <div class="app-item">
                <div class="app-icon dark">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="3" x2="12" y2="4"/>
                        <line x1="12" y1="20" x2="12" y2="21"/>
                        <line x1="3" y1="12" x2="4" y2="12"/>
                        <line x1="20" y1="12" x2="21" y2="12"/>
                        <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.8)"/>
                        <line x1="12" y1="12" x2="12" y2="7"/>
                        <line x1="12" y1="12" x2="15.5" y2="13.5"/>
                    </svg>
                </div>
                <span class="app-label">Time</span>
            </div>
            <div class="app-item" onclick="if(window.openIntimacyArchive) window.openIntimacyArchive();">
                <div class="app-icon dark">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
                        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" fill="rgba(255,255,255,0.08)"/>
                        <line x1="9" y1="13" x2="15" y2="13"/>
                        <line x1="9" y1="17" x2="13" y2="17"/>
                    </svg>
                </div>
                <span class="app-label">Notes</span>
            </div>
            <div class="app-item" onclick="if(window.openTheatreApp) window.openTheatreApp();">
                <div class="app-icon light">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 3c0 4.5-4.5 9-9 9 4.5 0 9 4.5 9 9 0-4.5 4.5-9 9-9-4.5 0-9-4.5-9-9z" fill="rgba(28,28,30,0.08)"/>
                    </svg>
                </div>
                <span class="app-label">Theatre</span>
            </div>
        </div>

        <!-- 图标下签名 -->
        <div class="grid-signature">Studio</div>
    `;

    // ── 全局 Dock 滑动变形 ──
    initDockMorph();
}

function initDockMorph(){
    var swiper=document.getElementById('swiper');
    var dock=document.getElementById('globalDock');
    var full=document.getElementById('gdFull');
    var pill=document.getElementById('gdPill');
    if(!swiper||!dock||!full||!pill)return;

    swiper.addEventListener('scroll',function(){
        var ratio=swiper.scrollLeft/swiper.clientWidth;
        if(ratio>1)ratio=1;
        if(ratio<0)ratio=0;

        // full dock: 从 1 → 0 淡出 + 缩小
        full.style.opacity=String(1-ratio);
        full.style.transform='scale('+(1-ratio*0.3)+')';
        full.style.pointerEvents=ratio>0.5?'none':'auto';

        // pill: 从 0 → 1 淡入 + 放大
        pill.style.opacity=String(ratio);
        pill.style.transform='scale('+(0.7+ratio*0.3)+')';
        pill.style.pointerEvents=ratio>0.5?'auto':'none';
    },{passive:true});
}
