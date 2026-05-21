// js/-A-11-theatre-app.js · Theatre Card · 番外剧场
(function () {
    'use strict';

    var built = false;
    var theatres = [];
    var entities = [];

    /* ══════════════════════════════════════ Storage ══════════════════════════════════════ */
    function loadTheatres() {
        try { return JSON.parse(localStorage.getItem('ca-theatres') || '[]'); } catch(e) { return []; }
    }
    function saveTheatres() {
        localStorage.setItem('ca-theatres', JSON.stringify(theatres));
    }

    function loadEntitiesFromDB(cb) {
        try {
            var req = indexedDB.open('CoutureOS_ChatDB');
            req.onsuccess = function(e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains('entities')) { cb([]); return; }
                var tx = db.transaction(['entities','avatars'], 'readonly');
                var entReq = tx.objectStore('entities').getAll();
                entReq.onsuccess = function(ev) {
                    var ents = ev.target.result || [];
                    if (!ents.length) { cb([]); return; }
                    var avStore = tx.objectStore('avatars');
                    var remaining = ents.length;
                    ents.forEach(function(ent) {
                        var avReq = avStore.get(ent.id);
                        avReq.onsuccess = function(e2) {
                            var av = e2.target.result;
                            if (av && av.data) ent.avatar = av.data;
                            if (--remaining === 0) cb(ents);
                        };
                        avReq.onerror = function() { if (--remaining === 0) cb(ents); };
                    });
                };
                entReq.onerror = function() { cb([]); };
            };
            req.onerror = function() { cb([]); };
        } catch(e) { cb([]); }
    }

    function esc(s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : s); return d.innerHTML; }

    /* ══════════════════════════════════════ CSS ══════════════════════════════════════ */
    function buildCSS() {
        return '' +
            '@font-face{font-family:"TheatreDeco";src:url("https://file.icve.com.cn/file_doc/SyNI8mvo/uZqcTvbY.ttf") format("truetype");font-display:swap;}' +
            '#theatreApp{position:fixed;inset:0;z-index:200;background:linear-gradient(180deg,#fdfcfb 0%,#ffffff 30%,#ffffff 100%);font-family:-apple-system,"SF Pro Display",sans-serif;overflow-y:auto;-webkit-overflow-scrolling:touch;display:none;}' +
            '#theatreApp.open{display:block;animation:thFadeIn 0.4s cubic-bezier(0.16,1,0.3,1);}' +
            '@keyframes thFadeIn{from{opacity:0;transform:scale(0.98);}to{opacity:1;transform:scale(1);}}' +
            '#theatreApp *{margin:0;padding:0;box-sizing:border-box;}' +

            /* 顶部返回 */
            '#theatreApp .th-back{position:fixed;top:calc(env(safe-area-inset-top,20px) + 12px);left:16px;z-index:50;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(42,40,48,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 14px rgba(42,40,48,0.06);transition:transform 0.2s;}' +
            '#theatreApp .th-back:active{transform:scale(0.88);}' +
            '#theatreApp .th-back svg{width:16px;height:16px;stroke:#2a2830;fill:none;stroke-width:2;stroke-linecap:round;}' +

            /* 顶部垂落文字 */
            '#theatreApp .th-drops{position:fixed;top:0;left:0;right:0;height:220px;pointer-events:none;z-index:0;overflow:hidden;}' +
            '#theatreApp .th-drop{position:absolute;top:-10px;font-family:"TheatreDeco",serif;color:rgba(42,40,48,0.028);writing-mode:vertical-rl;white-space:nowrap;letter-spacing:6px;line-height:1;animation:thDropFall 12s ease-in-out infinite alternate;}' +
            '#theatreApp .th-drop:nth-child(1){left:8%;font-size:38px;animation-delay:0s;opacity:0.7;}' +
            '#theatreApp .th-drop:nth-child(2){left:22%;font-size:28px;animation-delay:1.5s;top:-20px;opacity:0.5;}' +
            '#theatreApp .th-drop:nth-child(3){left:38%;font-size:44px;animation-delay:0.8s;opacity:0.6;}' +
            '#theatreApp .th-drop:nth-child(4){left:55%;font-size:24px;animation-delay:2.2s;top:-15px;opacity:0.4;}' +
            '#theatreApp .th-drop:nth-child(5){left:68%;font-size:34px;animation-delay:0.4s;top:-5px;opacity:0.55;}' +
            '#theatreApp .th-drop:nth-child(6){left:82%;font-size:26px;animation-delay:1.8s;top:-25px;opacity:0.45;}' +
            '#theatreApp .th-drop:nth-child(7){left:93%;font-size:30px;animation-delay:3s;top:5px;opacity:0.35;}' +
            '@keyframes thDropFall{0%{transform:translateY(-8px);}100%{transform:translateY(12px);}}' +

            /* 背景微粒 */
            '#theatreApp::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background-image:radial-gradient(1px 1px at 15% 20%,rgba(42,40,48,0.06),transparent),radial-gradient(1.5px 1.5px at 80% 15%,rgba(42,40,48,0.04),transparent),radial-gradient(1px 1px at 45% 60%,rgba(42,40,48,0.05),transparent),radial-gradient(1px 1px at 70% 75%,rgba(42,40,48,0.03),transparent),radial-gradient(1.5px 1.5px at 25% 85%,rgba(42,40,48,0.04),transparent),radial-gradient(1px 1px at 90% 45%,rgba(42,40,48,0.03),transparent);}' +

            /* Page header */
            '#theatreApp .th-page-header{text-align:center;margin:60px 0 32px;position:relative;z-index:1;}' +
            '#theatreApp .th-ph-deco{font-family:"TheatreDeco",serif;font-size:68px;color:rgba(42,40,48,0.04);position:absolute;top:-18px;left:50%;transform:translateX(-50%);white-space:nowrap;pointer-events:none;letter-spacing:4px;}' +
            '#theatreApp .th-ph-eyebrow{font-size:8px;font-weight:800;letter-spacing:4px;color:rgba(42,40,48,0.3);text-transform:uppercase;margin-bottom:6px;position:relative;}' +
            '#theatreApp .th-ph-title{font-family:"TheatreDeco",serif;font-size:34px;color:#2a2830;position:relative;letter-spacing:1px;}' +
            '#theatreApp .th-ph-sub{font-family:Georgia,serif;font-style:italic;font-size:11px;color:rgba(42,40,48,0.4);margin-top:5px;letter-spacing:0.5px;position:relative;}' +

            '#theatreApp .th-cards{width:100%;max-width:380px;margin:0 auto;padding:0 16px 60px;display:flex;flex-direction:column;gap:0;position:relative;z-index:1;}' +

            /* 分组连线 */
            '#theatreApp .th-group{position:relative;display:flex;flex-direction:column;gap:14px;padding-left:18px;margin-bottom:14px;}' +
            '#theatreApp .th-group::before{content:"";position:absolute;left:6px;top:20px;bottom:20px;width:1px;background:repeating-linear-gradient(to bottom,rgba(42,40,48,0.12) 0px,rgba(42,40,48,0.12) 4px,transparent 4px,transparent 8px);}' +
            '#theatreApp .th-group-dot{position:absolute;left:3px;width:7px;height:7px;border-radius:50%;background:#2a2830;border:2px solid #f7f5f2;z-index:2;}' +
            '#theatreApp .th-group-dot.top{top:16px;}' +
            '#theatreApp .th-group-dot.bottom{bottom:16px;}' +
            '#theatreApp .th-group-label{position:absolute;left:-2px;top:50%;transform:translateY(-50%) rotate(-90deg);font-family:"TheatreDeco",serif;font-size:9px;letter-spacing:3px;color:rgba(42,40,48,0.15);white-space:nowrap;transform-origin:center center;}' +
            '#theatreApp .th-single{margin-bottom:14px;}' +

            /* 卡片 */
            '#theatreApp .tc{position:relative;overflow:visible;cursor:pointer;transition:all 0.35s cubic-bezier(0.16,1,0.3,1);border:0.8px solid #2a2830;}' +
            '#theatreApp .tc:active{transform:scale(0.975);}' +
            '#theatreApp .tc-badge{position:absolute;top:-1px;right:20px;background:#1a1a1f;color:#fff;font-size:7px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:3px 8px 4px;border-radius:0 0 3px 3px;z-index:5;}' +
            '#theatreApp .tc-entity-float{position:absolute;top:-9px;left:18px;z-index:6;display:flex;align-items:center;gap:6px;}' +
            '#theatreApp .tc-entity-name{font-family:"TheatreDeco",serif;font-size:14px;letter-spacing:1px;color:#2a2830;background:#f7f5f2;padding:0 8px;line-height:1;}' +

            /* 星星粒子 */
            '#theatreApp .tc-stars{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit;}' +
            '#theatreApp .tc-stars span{position:absolute;border-radius:50%;background:rgba(42,40,48,0.05);}' +
            '#theatreApp .tc-stars .s1{width:2.5px;height:2.5px;top:14px;right:50px;animation:thTwinkle 3s infinite ease-in-out;}' +
            '#theatreApp .tc-stars .s2{width:2px;height:2px;top:28px;right:80px;animation:thTwinkle 4s infinite ease-in-out 0.5s;}' +
            '#theatreApp .tc-stars .s3{width:2px;height:2px;bottom:18px;right:30px;animation:thTwinkle 3.5s infinite ease-in-out 1s;}' +
            '#theatreApp .tc-stars .s4{width:1.5px;height:1.5px;top:36px;right:120px;animation:thTwinkle 5s infinite ease-in-out 1.5s;}' +
            '#theatreApp .tc-stars .s5{width:2px;height:2px;bottom:10px;left:55%;animation:thTwinkle 4.5s infinite ease-in-out 0.8s;}' +
            '@keyframes thTwinkle{0%,100%{opacity:0.3;transform:scale(1);}50%{opacity:1;transform:scale(1.6);}}' +

            /* 装饰文字 */
            '#theatreApp .tc-deco-text{position:absolute;font-family:"TheatreDeco",serif;color:rgba(42,40,48,0.045);pointer-events:none;white-space:nowrap;line-height:1;}' +
            '#theatreApp .tc-deco-text.pos-tr{top:6px;right:10px;font-size:54px;letter-spacing:2px;}' +
            '#theatreApp .tc-deco-text.pos-bl{bottom:2px;left:14px;font-size:38px;letter-spacing:3px;}' +
            '#theatreApp .tc-deco-text.pos-center{top:50%;left:50%;transform:translate(-50%,-50%);font-size:72px;letter-spacing:4px;}' +

            '#theatreApp .tc.shape-round{background:#fff;border-radius:22px;padding:20px 18px 14px;box-shadow:0 3px 16px rgba(42,40,48,0.03);}' +
            '#theatreApp .tc.shape-ticket{background:#fff;border-radius:3px 18px 18px 3px;padding:20px 18px 14px 20px;border-left:3px solid #1a1a1f;box-shadow:0 3px 16px rgba(42,40,48,0.03);}' +
            '#theatreApp .tc.shape-diamond{background:linear-gradient(135deg,#fff 0%,#faf9f7 100%);border-radius:6px 22px 6px 22px;padding:20px 18px 14px;box-shadow:0 4px 20px rgba(42,40,48,0.03);}' +
            '#theatreApp .tc.shape-film{background:#1a1a1f;border-radius:18px;padding:20px 18px 14px;border-color:rgba(255,255,255,0.15);box-shadow:0 6px 24px rgba(0,0,0,0.1);}' +
            '#theatreApp .tc.shape-film .tc-badge{background:#fff;color:#1a1a1f;}' +
            '#theatreApp .tc.shape-film .tc-entity-name{color:#fff;background:#1a1a1f;padding:0 6px;}' +
            '#theatreApp .tc.shape-film .tc-title,#theatreApp .tc.shape-film .tc-premise{color:rgba(255,255,255,0.85);}' +
            '#theatreApp .tc.shape-film .tc-meta span{color:rgba(255,255,255,0.35);}' +
            '#theatreApp .tc.shape-film .tc-meta .sep{background:rgba(255,255,255,0.12);}' +
            '#theatreApp .tc.shape-film .tc-deco-text{color:rgba(255,255,255,0.05);}' +
            '#theatreApp .tc.shape-film .tc-footer{border-top-color:rgba(255,255,255,0.06);}' +
            '#theatreApp .tc.shape-film .tc-fork{color:rgba(255,255,255,0.25);}' +
            '#theatreApp .tc.shape-film .tc-fork::before{background:rgba(255,255,255,0.12);}' +
            '#theatreApp .tc.shape-film .ca-btn{border-color:rgba(255,255,255,0.15);color:rgba(255,255,255,0.55);}' +
            '#theatreApp .tc.shape-film .ca-btn:active{background:rgba(255,255,255,0.08);}' +
            '#theatreApp .tc.shape-film .ca-btn.primary{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:#fff;}' +
            '#theatreApp .tc.shape-film .tc-stars span{background:rgba(255,255,255,0.18);}' +
            '#theatreApp .tc.shape-film .cs-label{color:rgba(255,255,255,0.35);}' +
            '#theatreApp .tc.shape-film .tc-premise{background:rgba(255,255,255,0.03);border-left-color:rgba(255,255,255,0.1);}' +
            '#theatreApp .tc.shape-film .tc-status-text{color:rgba(255,255,255,0.35);}' +

            '#theatreApp .tc-status{display:flex;align-items:center;gap:5px;margin-bottom:6px;}' +
            '#theatreApp .cs-dot{width:5px;height:5px;border-radius:50%;}' +
            '#theatreApp .cs-dot.active{background:#34c759;box-shadow:0 0 5px rgba(42,40,48,0.3);}' +
            '#theatreApp .cs-dot.frozen{background:#8e8e93;box-shadow:0 0 4px rgba(142,142,147,0.3);}' +
            '#theatreApp .cs-dot.archived{background:rgba(42,40,48,0.12);}' +
            '#theatreApp .cs-label{font-size:7px;font-weight:800;letter-spacing:2px;color:rgba(42,40,48,0.3);text-transform:uppercase;}' +
            '#theatreApp .tc-status-text{font-size:8px;color:rgba(42,40,48,0.35);margin-left:auto;font-weight:500;letter-spacing:0.5px;}' +

            '#theatreApp .tc-title{font-family:Georgia,serif;font-style:italic;font-size:16px;color:#2a2830;margin-bottom:5px;line-height:1.3;letter-spacing:-0.3px;}' +
            '#theatreApp .tc-premise{font-size:10px;color:rgba(42,40,48,0.5);line-height:1.6;letter-spacing:0.2px;margin-bottom:7px;padding:5px 9px;background:rgba(42,40,48,0.018);border-radius:7px;border-left:2px solid rgba(42,40,48,0.08);font-style:italic;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}' +
            '#theatreApp .tc-meta{display:flex;align-items:center;gap:7px;}' +
            '#theatreApp .tc-meta span{font-size:9px;color:rgba(42,40,48,0.3);font-weight:500;}' +
            '#theatreApp .tc-meta .sep{width:2.5px;height:2.5px;border-radius:50%;background:rgba(42,40,48,0.12);}' +

            '#theatreApp .tc-footer{display:flex;align-items:center;justify-content:space-between;margin-top:9px;padding-top:12px;border-top:1px solid rgba(42,40,48,0.04);}' +
            '#theatreApp .tc-fork{font-size:8px;color:rgba(42,40,48,0.25);font-weight:500;display:flex;align-items:center;gap:4px;}' +
            '#theatreApp .tc-fork::before{content:"";display:block;width:8px;height:1px;background:rgba(42,40,48,0.1);}' +
            '#theatreApp .tc-actions{display:flex;gap:8px;}' +
            '#theatreApp .ca-btn{padding:8px 16px;border-radius:18px;border:1px solid rgba(42,40,48,0.1);background:transparent;font-size:9px;font-weight:700;color:rgba(42,40,48,0.55);letter-spacing:0.3px;cursor:pointer;transition:all 0.2s;}' +
            '#theatreApp .ca-btn:active{background:rgba(42,40,48,0.05);transform:scale(0.95);}' +
            '#theatreApp .ca-btn.primary{background:#2a2830;color:#fff;border-color:#2a2830;padding:8px 22px;}' +
            '#theatreApp .ca-btn.primary:active{background:#111;}' +
            '#theatreApp .ca-btn.danger{border-color:rgba(166,52,38,0.2);color:rgba(166,52,38,0.65);}' +

            '#theatreApp .tc-new{border:1px dashed rgba(42,40,48,0.1);background:rgba(255,255,255,0.35);box-shadow:none;border-radius:20px;display:flex;align-items:center;justify-content:center;padding:24px 20px;text-align:center;overflow:hidden;border-color:rgba(42,40,48,0.1);}' +
            '#theatreApp .tc-new:active{background:rgba(255,255,255,0.7);border-color:rgba(42,40,48,0.2);}' +
            '#theatreApp .cn-icon{width:34px;height:34px;border-radius:50%;background:rgba(42,40,48,0.03);display:flex;align-items:center;justify-content:center;margin:0 auto 7px;border:1px solid rgba(42,40,48,0.08);}' +
            '#theatreApp .cn-icon svg{width:13px;height:13px;stroke:#2a2830;fill:none;stroke-width:2;stroke-linecap:round;opacity:0.4;}' +
            '#theatreApp .cn-text{font-size:8px;font-weight:700;letter-spacing:2.5px;color:rgba(42,40,48,0.35);text-transform:uppercase;}' +
            '#theatreApp .cn-sub{font-family:Georgia,serif;font-style:italic;font-size:10px;color:rgba(42,40,48,0.22);margin-top:3px;}' +

            /* 空状态 */
            '#theatreApp .th-empty{text-align:center;padding:50px 30px;color:rgba(42,40,48,0.4);}' +
            '#theatreApp .th-empty-icon{width:50px;height:50px;border-radius:50%;background:rgba(42,40,48,0.04);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}' +
            '#theatreApp .th-empty-icon svg{width:22px;height:22px;stroke:rgba(42,40,48,0.35);fill:none;stroke-width:1.5;}' +
            '#theatreApp .th-empty-title{font-family:"TheatreDeco",serif;font-size:18px;color:rgba(42,40,48,0.6);margin-bottom:6px;}' +
            '#theatreApp .th-empty-sub{font-size:11px;color:rgba(42,40,48,0.4);line-height:1.6;font-family:Georgia,serif;font-style:italic;}' +

            /* Modal */
            '#theatreApp .th-modal-ov{position:fixed;inset:0;background:rgba(26,26,31,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:300;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.3s ease;padding:20px;}' +
            '#theatreApp .th-modal-ov.open{opacity:1;pointer-events:auto;}' +
            '#theatreApp .th-modal{width:100%;max-width:340px;background:#fff;border-radius:24px;padding:30px 24px 24px;box-shadow:0 20px 60px rgba(0,0,0,0.15);transform:translateY(20px) scale(0.95);transition:all 0.4s cubic-bezier(0.16,1,0.3,1);position:relative;overflow:hidden;border:1px solid rgba(42,40,48,0.08);max-height:90vh;overflow-y:auto;}' +
            '#theatreApp .th-modal-ov.open .th-modal{transform:translateY(0) scale(1);}' +
            '#theatreApp .mc-deco{position:absolute;top:-15px;right:-10px;font-family:"TheatreDeco",serif;font-size:80px;color:rgba(42,40,48,0.03);pointer-events:none;line-height:1;}' +
            '#theatreApp .mc-header{margin-bottom:24px;position:relative;z-index:1;}' +
            '#theatreApp .mc-title{font-family:"TheatreDeco",serif;font-size:26px;color:#2a2830;margin-bottom:4px;letter-spacing:1px;}' +
            '#theatreApp .mc-sub{font-size:10px;color:rgba(42,40,48,0.4);font-style:italic;font-family:Georgia,serif;}' +
            '#theatreApp .mf-group{margin-bottom:16px;position:relative;z-index:1;}' +
            '#theatreApp .mf-label{font-size:8px;font-weight:800;letter-spacing:1.5px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:6px;display:block;}' +
            '#theatreApp .mf-input{width:100%;background:#f7f5f2;border:1px solid rgba(42,40,48,0.06);border-radius:12px;padding:12px 14px;font-size:13px;color:#2a2830;outline:none;transition:all 0.2s;font-family:-apple-system,sans-serif;}' +
            '#theatreApp .mf-input:focus{background:#fff;border-color:#2a2830;box-shadow:0 4px 12px rgba(42,40,48,0.05);}' +
            '#theatreApp .mf-select-wrap{position:relative;}' +
            '#theatreApp .mf-select-wrap::after{content:"▼";position:absolute;right:14px;top:50%;transform:translateY(-50%) scaleX(1.5);font-size:8px;color:rgba(42,40,48,0.3);pointer-events:none;}' +
            '#theatreApp .mf-input.select{appearance:none;-webkit-appearance:none;padding-right:30px;cursor:pointer;}' +
            '#theatreApp .mf-textarea{height:110px;resize:none;line-height:1.6;font-family:Georgia,serif;font-style:italic;}' +
            '#theatreApp .mf-textarea::placeholder{color:rgba(42,40,48,0.3);}' +
            '#theatreApp .mc-footer{display:flex;gap:10px;margin-top:24px;position:relative;z-index:1;}' +
            '#theatreApp .mc-btn{flex:1;padding:12px;border-radius:50px;font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;transition:all 0.2s;border:none;}' +
            '#theatreApp .mc-btn.cancel{background:transparent;border:1px solid rgba(42,40,48,0.15);color:rgba(42,40,48,0.5);}' +
            '#theatreApp .mc-btn.cancel:active{background:rgba(42,40,48,0.05);}' +
            '#theatreApp .mc-btn.create{background:#1a1a1f;color:#fff;box-shadow:0 4px 14px rgba(26,26,31,0.2);}' +
            '#theatreApp .mc-btn.create:active{transform:scale(0.96);}' +

            '#theatreApp .footer-sig{text-align:center;padding:20px 0 40px;font-family:"TheatreDeco",serif;font-size:13px;color:rgba(42,40,48,0.12);letter-spacing:3px;position:relative;z-index:1;}' +
            '';
    }

    /* ══════════════════════════════════════ HTML ══════════════════════════════════════ */
    function buildHTML() {
        var el = document.createElement('div');
        el.id = 'theatreApp';
        el.innerHTML =
            '<style>' + buildCSS() + '</style>' +
            '<div class="th-back" id="thBackBtn"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>' +
            '<div class="th-drops">' +
                '<div class="th-drop">Theatre</div>' +
                '<div class="th-drop">Parallel</div>' +
                '<div class="th-drop">Scene</div>' +
                '<div class="th-drop">Act</div>' +
                '<div class="th-drop">Story</div>' +
                '<div class="th-drop">Dream</div>' +
                '<div class="th-drop">Lore</div>' +
            '</div>' +
            '<div class="th-page-header">' +
                '<div class="th-ph-deco">Theatre</div>' +
                '<div class="th-ph-eyebrow">A0nynx_3i · Parallel</div>' +
                '<div class="th-ph-title">Theatre</div>' +
                '<div class="th-ph-sub">番外剧场 · 平行叙事</div>' +
            '</div>' +
            '<div class="th-cards" id="thCardList"></div>' +
            '<div class="footer-sig">Theatre · Studio</div>' +
            '<div class="th-modal-ov" id="thModalOv">' +
                '<div class="th-modal">' +
                    '<div class="mc-deco">Draft</div>' +
                    '<div class="mc-header">' +
                        '<div class="mc-title">New Act</div>' +
                        '<div class="mc-sub">设定平行世界的前提，开启全新时间线</div>' +
                    '</div>' +
                    '<div class="mf-group">' +
                        '<label class="mf-label">Target Entity / 角色</label>' +
                        '<div class="mf-select-wrap"><select class="mf-input select" id="thModalEntity"></select></div>' +
                    '</div>' +
                    '<div class="mf-group">' +
                        '<label class="mf-label">Title / 剧场标题</label>' +
                        '<input type="text" class="mf-input" id="thModalTitle" placeholder="例如：「雨夜的告白」">' +
                    '</div>' +
                    '<div class="mf-group">' +
                        '<label class="mf-label">Premise & Lore / 前提与特殊设定</label>' +
                        '<textarea class="mf-input mf-textarea" id="thModalPremise" placeholder="详细描述这个平行世界的前提。\n例如：如果那天我没有离开，而是选择了留下。\n（越详细，AI 越能准确代入情境）"></textarea>' +
                    '</div>' +
                    '<div class="mf-group">' +
                        '<label class="mf-label">Fork Point / 时间线分叉点</label>' +
                        '<div class="mf-select-wrap"><select class="mf-input select" id="thModalFork">' +
                            '<option value="mainline">从主线最新进度分叉</option>' +
                            '<option value="blank">完全独立的空白开局</option>' +
                        '</select></div>' +
                    '</div>' +
                    '<div class="mc-footer">' +
                        '<button class="mc-btn cancel" id="thModalCancel">Cancel</button>' +
                        '<button class="mc-btn create" id="thModalCreate">Create Act</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(el);
    }

    /* ══════════════════════════════════════ Render ══════════════════════════════════════ */
    var SHAPES = ['shape-round', 'shape-ticket', 'shape-diamond', 'shape-film'];
    var DECO_WORDS = ['Rainy', 'Midnight', 'Parallel', 'Dream', 'Lore', 'Scene', 'Whisper', 'Echo', 'Drift', 'Silence'];
    var DECO_POS = ['pos-tr', 'pos-bl', 'pos-center'];

    function getShape(idx, isLast) { return isLast ? 'shape-film' : SHAPES[idx % (SHAPES.length - 1)]; }
    function getDecoWord(idx) { return DECO_WORDS[idx % DECO_WORDS.length]; }
    function getDecoPos(idx) { return DECO_POS[idx % DECO_POS.length]; }

    function renderCards() {
        var list = document.getElementById('thCardList');
        if (!list) return;

        if (theatres.length === 0) {
            list.innerHTML =
                '<div class="th-empty">' +
                    '<div class="th-empty-icon"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>' +
                    '<div class="th-empty-title">No Scenes Yet</div>' +
                    '<div class="th-empty-sub">点击下方 + 创建你的第一个番外剧场</div>' +
                '</div>' +
                '<div class="th-single"><div class="tc tc-new" id="thNewBtn"><div><div class="cn-icon"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><div class="cn-text">New Theatre</div><div class="cn-sub">设定前提，开启一段番外</div></div></div></div>';
            bindNewBtn();
            return;
        }

        /* 按 entity 分组 */
        var grouped = {};
        var order = [];
        theatres.forEach(function(t) {
            if (!grouped[t.entityId]) { grouped[t.entityId] = []; order.push(t.entityId); }
            grouped[t.entityId].push(t);
        });

        var html = '';
        var globalIdx = 0;
        order.forEach(function(entId) {
            var items = grouped[entId];
            var ent = entities.find(function(e) { return e.id === entId; });
            var entName = ent ? (ent.nickname || ent.name) : 'Unknown';

            if (items.length > 1) {
                html += '<div class="th-group"><div class="th-group-dot top"></div><div class="th-group-dot bottom"></div><div class="th-group-label">' + esc(entName) + '</div>';
                items.forEach(function(t, i) {
                    var isLast = (i === items.length - 1);
                    html += buildCardHTML(t, entName, globalIdx, isLast);
                    globalIdx++;
                });
                html += '</div>';
            } else {
                html += '<div class="th-single">' + buildCardHTML(items[0], entName, globalIdx, false) + '</div>';
                globalIdx++;
            }
        });

        html += '<div class="th-single"><div class="tc tc-new" id="thNewBtn"><div><div class="cn-icon"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><div class="cn-text">New Theatre</div><div class="cn-sub">设定前提，开启一段番外</div></div></div></div>';

        list.innerHTML = html;
        bindNewBtn();
        bindCardActions();
    }

    function buildCardHTML(t, entName, idx, isLast) {
        var shape = getShape(idx, isLast);
        var statusDot = t.status === 'active' ? 'active' : t.status === 'frozen' ? 'frozen' : 'archived';
        var statusLabel = t.status === 'active' ? 'Playing' : t.status === 'frozen' ? 'Frozen' : 'Archived';
        var statusText = t.status === 'active' ? '对话中' : t.status === 'frozen' ? '暂停中' : '已归档';
        var actNum = 'ACT ' + toRoman(idx + 1);
        var rounds = (t.messages || []).length;
        var dateStr = t.created ? t.created.substring(5, 10).replace('-', '/') : '';
        var decoWord = getDecoWord(idx);
        var decoPos = getDecoPos(idx);

        return '<div class="tc ' + shape + '" data-theatre-id="' + t.id + '">' +
            '<div class="tc-badge">' + actNum + '</div>' +
            '<div class="tc-entity-float"><span class="tc-entity-name">' + esc(entName) + '</span></div>' +
            '<div class="tc-stars"><span class="s1"></span><span class="s2"></span><span class="s3"></span><span class="s4"></span><span class="s5"></span></div>' +
            '<div class="tc-deco-text ' + decoPos + '">' + decoWord + '</div>' +
            '<div class="tc-status"><div class="cs-dot ' + statusDot + '"></div><div class="cs-label">' + statusLabel + '</div><span class="tc-status-text">' + statusText + '</span></div>' +
            '<div class="tc-title">' + esc(t.title || '无标题') + '</div>' +
            '<div class="tc-premise">' + esc(t.premise || '无前提设定') + '</div>' +
            '<div class="tc-meta"><span>' + dateStr + '</span><div class="sep"></div><span>' + rounds + ' rounds</span></div>' +
            '<div class="tc-footer">' +
                '<div class="tc-fork">Fork · ' + (t.forkPoint || 'mainline') + '</div>' +
                '<div class="tc-actions">' +
                    (t.status === 'active' ? '<button class="ca-btn primary" data-action="continue" data-id="' + t.id + '">继续</button><button class="ca-btn" data-action="freeze" data-id="' + t.id + '">暂停</button>' :
                     t.status === 'frozen' ? '<button class="ca-btn primary" data-action="resume" data-id="' + t.id + '">恢复</button><button class="ca-btn danger" data-action="delete" data-id="' + t.id + '">丢弃</button>' :
                     '<button class="ca-btn" data-action="view" data-id="' + t.id + '">查看</button><button class="ca-btn danger" data-action="delete" data-id="' + t.id + '">删除</button>') +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function toRoman(num) {
        var lookup = {10:'X',9:'IX',5:'V',4:'IV',1:'I'};
        var roman = '';
        var keys = [10,9,5,4,1];
        for (var i = 0; i < keys.length; i++) {
            while (num >= keys[i]) { roman += lookup[keys[i]]; num -= keys[i]; }
        }
        return roman;
    }

    function bindNewBtn() {
        var btn = document.getElementById('thNewBtn');
        if (btn) btn.addEventListener('click', openModal);
    }

    function bindCardActions() {
        document.querySelectorAll('#theatreApp .ca-btn[data-action]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var action = btn.dataset.action;
                var id = btn.dataset.id;
                var t = theatres.find(function(x) { return x.id === id; });
                if (!t) return;

                if (action === 'delete') {
                    if (confirm('确定删除这个剧场？')) {
                        theatres = theatres.filter(function(x) { return x.id !== id; });
                        saveTheatres();
                        renderCards();
                    }
                } else if (action === 'freeze') {
                    t.status = 'frozen';
                    saveTheatres();
                    renderCards();
                } else if (action === 'resume') {
                    t.status = 'active';
                    saveTheatres();
                    renderCards();
                } else if (action === 'continue' || action === 'view') {
                    if (typeof window.openTheatreScene === 'function') {
                        window.openTheatreScene(id);
                    }
                }
            });
        });
    }

    /* ══════════════════════════════════════ Modal ══════════════════════════════════════ */
    function openModal() {
        var sel = document.getElementById('thModalEntity');
        sel.innerHTML = '';
        entities.forEach(function(ent) {
            var opt = document.createElement('option');
            opt.value = ent.id;
            opt.textContent = ent.nickname || ent.name;
            sel.appendChild(opt);
        });
        document.getElementById('thModalTitle').value = '';
        document.getElementById('thModalPremise').value = '';
        document.getElementById('thModalFork').value = 'mainline';
        document.getElementById('thModalOv').classList.add('open');
    }

    function closeModal() {
        document.getElementById('thModalOv').classList.remove('open');
    }

    function createTheatre() {
        var entId = document.getElementById('thModalEntity').value;
        var title = document.getElementById('thModalTitle').value.trim();
        var premise = document.getElementById('thModalPremise').value.trim();
        var fork = document.getElementById('thModalFork').value;

        if (!entId) { alert('请选择角色'); return; }
        if (!title) { document.getElementById('thModalTitle').focus(); return; }

        var now = new Date();
        var dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');

        var theatre = {
            id: 'th_' + Date.now(),
            entityId: entId,
            title: title,
            premise: premise,
            forkPoint: fork,
            status: 'active',
            created: dateStr,
            messages: []
        };

        theatres.push(theatre);
        saveTheatres();
        closeModal();
        renderCards();
    }

    /* ══════════════════════════════════════ Bind ══════════════════════════════════════ */
    function bindAll() {
        document.getElementById('thBackBtn').addEventListener('click', function() {
            document.getElementById('theatreApp').classList.remove('open');
        });
        document.getElementById('thModalCancel').addEventListener('click', closeModal);
        document.getElementById('thModalCreate').addEventListener('click', createTheatre);
        document.getElementById('thModalOv').addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }

    /* ══════════════════════════════════════ Public ══════════════════════════════════════ */
    window.openTheatreApp = function() {
        if (!built) {
            buildHTML();
            bindAll();
            built = true;
        }
        theatres = loadTheatres();
        loadEntitiesFromDB(function(ents) {
            entities = ents || [];
            renderCards();
            document.getElementById('theatreApp').classList.add('open');
        });
    };

})();
