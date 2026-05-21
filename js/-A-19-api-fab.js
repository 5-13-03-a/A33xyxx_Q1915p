// js/-A-19-api-fab.js · API 切换悬浮球
(function () {
    'use strict';

    var built = false;
    var isOpen = false;

    function esc(s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : s); return d.innerHTML; }
    function getCfg() { try { return JSON.parse(localStorage.getItem('ca-api-config') || '{}'); } catch(e) { return {}; } }
    function saveCfg(cfg) { localStorage.setItem('ca-api-config', JSON.stringify(cfg)); }

    /* ══════════════════════════════════════ CSS ══════════════════════════════════════ */
    function injectCSS() {
        if (document.getElementById('api-fab-style')) return;
        var s = document.createElement('style');
        s.id = 'api-fab-style';
        s.textContent =
            /* 整体容器 */
            '#apiFab{position:fixed;bottom:22px;right:18px;z-index:9990;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none;}' +
            '#apiFab>*{pointer-events:auto;}' +

            /* 收起标签 */
            '#apiFabTag{display:flex;align-items:center;gap:5px;background:rgba(26,26,31,0.82);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:4px 8px 4px 6px;border-radius:20px;border:0.5px solid rgba(255,255,255,0.06);box-shadow:0 4px 16px rgba(0,0,0,0.18);cursor:pointer;transition:opacity 0.2s;-webkit-tap-highlight-color:transparent;}' +
            '#apiFabTag:active{opacity:0.8;}' +
            '#apiFabTag .ft-dot{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.25);}' +
            '#apiFabTag .ft-dot.ok{background:#c8c8c8;box-shadow:0 0 5px rgba(200,200,200,0.6);}' +
            '#apiFabTag .ft-model{font-size:8px;font-weight:700;color:rgba(255,255,255,0.82);letter-spacing:0.2px;}' +
            '#apiFabTag .ft-sep{width:1px;height:8px;background:rgba(255,255,255,0.1);}' +
            '#apiFabTag .ft-tk{font-size:7px;color:rgba(255,255,255,0.28);font-variant-numeric:tabular-nums;font-family:"Share Tech Mono",monospace;}' +

            /* 悬浮球 */
            '#apiFabBall{width:36px;height:36px;position:relative;cursor:pointer;flex-shrink:0;-webkit-tap-highlight-color:transparent;}' +
            '#apiFabBall .fb-ring{position:absolute;inset:-6px;width:48px;height:48px;animation:fabRing 8s linear infinite;pointer-events:none;}' +
            '@keyframes fabRing{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}' +
            '#apiFabBall .fb-core{position:absolute;inset:0;width:36px;height:36px;border-radius:50%;background:#1a1a1f;box-shadow:0 6px 20px rgba(0,0,0,0.22),0 2px 6px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;border:0.5px solid rgba(255,255,255,0.06);overflow:hidden;}' +
            '#apiFabBall .fb-core::before{content:"";position:absolute;inset:0;border-radius:50%;background:linear-gradient(145deg,rgba(255,255,255,0.1) 0%,transparent 50%);}' +
            '#apiFabBall .fb-core svg{position:relative;z-index:1;}' +
            '#apiFabBall .fb-status{position:absolute;top:-1px;right:-1px;width:10px;height:10px;border-radius:50%;background:rgba(200,200,200,0.4);border:2px solid transparent;z-index:10;transition:all 0.3s;}' +
            '#apiFabBall .fb-status.ok{background:#c8c8c8;box-shadow:0 0 5px rgba(200,200,200,0.5);}' +

            /* 球体点击态 */
            '#apiFabBall{transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1);}' +
            '#apiFabBall:active{transform:scale(0.88);}' +
            '#apiFabBall.active .fb-core{background:#2a2a2f;box-shadow:0 8px 28px rgba(0,0,0,0.28),0 2px 8px rgba(0,0,0,0.15);}' +
            '#apiFabBall.active .fb-ring{animation:fabRing 3s linear infinite;}' +

            /* 收起标签动效 */
            '#apiFabTag{transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s;}' +
            '#apiFabTag:active{transform:scale(0.94);}' +

            /* 面板动效升级 */
            '#apiFabPanel{transform-origin:bottom right;}' +
            '#apiFabPanel.open{animation:fabPanelIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards;}' +
            '@keyframes fabPanelIn{' +
                '0%{opacity:0;transform:translateY(12px) scale(0.94);}' +
                '100%{opacity:1;transform:translateY(0) scale(1);}' +
            '}' +

            /* 节点切换动效 */
            '#apiFabPanel .ap-node{transition:all 0.2s cubic-bezier(0.16,1,0.3,1);}' +
            '#apiFabPanel .ap-node:active{transform:scale(0.93);}' +

            /* 模型列表项动效 */
            '#apiFabPanel .ap-model-item{transition:background 0.15s,transform 0.15s;}' +
            '#apiFabPanel .ap-model-item:active{transform:scale(0.97);}' +

            /* 按钮动效 */
            '#apiFabPanel .ap-btn{transition:all 0.15s cubic-bezier(0.16,1,0.3,1);}' +
            '#apiFabPanel .ap-btn:active{transform:scale(0.94);}' +
            '#apiFabPanel .ap-btn.primary:active{background:#2a2a2f;}' +

            /* 关闭按钮动效 */
            '#apiFabPanel .ap-head-close{transition:all 0.15s;}' +
            '#apiFabPanel .ap-head-close:active{transform:scale(0.85);background:rgba(26,26,31,0.08);}' +

            /* Token 数字变化 */
            '@keyframes fabNumPop{0%{transform:scale(1);}50%{transform:scale(1.1);}100%{transform:scale(1);}}' +
            '.ap-tokens-num.pop{animation:fabNumPop 0.3s cubic-bezier(0.34,1.56,0.64,1);}' +

            /* 面板关闭动效 */
            '#apiFabPanel.closing{animation:fabPanelOut 0.2s cubic-bezier(0.4,0,1,1) forwards;}' +
            '@keyframes fabPanelOut{' +
                '0%{opacity:1;transform:translateY(0) scale(1);}' +
                '100%{opacity:0;transform:translateY(10px) scale(0.95);}' +
            '}' +

            /* 面板 */
            '#apiFabPanel{width:236px;background:#f8f7f4;border-radius:14px;border:0.5px solid rgba(26,26,31,0.07);box-shadow:0 20px 56px rgba(0,0,0,0.12),0 4px 14px rgba(0,0,0,0.06);overflow:hidden;position:relative;opacity:0;transform:translateY(8px) scale(0.97);transition:opacity 0.25s cubic-bezier(0.16,1,0.3,1),transform 0.25s cubic-bezier(0.16,1,0.3,1);pointer-events:none;}' +
            '#apiFabPanel.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}' +
            '#apiFabPanel .ap-deco{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden;}' +
            '#apiFabPanel .ap-content{position:relative;z-index:1;}' +

            /* 斜纹顶条 */
            '#apiFabPanel .ap-stripe{height:2.5px;background:repeating-linear-gradient(90deg,rgba(26,26,31,0.07) 0px,rgba(26,26,31,0.07) 14px,transparent 14px,transparent 20px);}' +

            /* 头部 */
            '#apiFabPanel .ap-head{padding:10px 13px 8px;border-bottom:1px solid rgba(26,26,31,0.05);display:flex;align-items:center;justify-content:space-between;}' +
            '#apiFabPanel .ap-head-left{display:flex;align-items:center;gap:6px;}' +
            '#apiFabPanel .ap-head-badge{font-family:"Share Tech Mono",monospace;font-size:6px;font-weight:700;letter-spacing:1.5px;color:rgba(26,26,31,0.28);text-transform:uppercase;background:rgba(26,26,31,0.04);border:0.5px solid rgba(26,26,31,0.08);padding:2px 6px;border-radius:3px;}' +
            '#apiFabPanel .ap-head-title{font-size:11px;font-weight:700;color:#1a1a1f;letter-spacing:-0.2px;}' +
            '#apiFabPanel .ap-head-close{width:18px;height:18px;border-radius:5px;background:rgba(26,26,31,0.04);display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;}' +
            '#apiFabPanel .ap-head-close svg{width:7px;height:7px;stroke:rgba(26,26,31,0.28);fill:none;stroke-width:2.5;stroke-linecap:round;}' +

            /* 节点 */
            '#apiFabPanel .ap-nodes{display:flex;gap:3px;padding:7px 9px 6px;}' +
            '#apiFabPanel .ap-node{flex:1;padding:5px 3px;border-radius:6px;background:rgba(26,26,31,0.02);border:0.5px solid rgba(26,26,31,0.06);display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;transition:all 0.15s;-webkit-tap-highlight-color:transparent;}' +
            '#apiFabPanel .ap-node:active{transform:scale(0.95);}' +
            '#apiFabPanel .ap-node.active{background:#1a1a1f;border-color:#1a1a1f;}' +
            '#apiFabPanel .ap-node-dot{width:4px;height:4px;border-radius:50%;background:rgba(26,26,31,0.1);}' +
            '#apiFabPanel .ap-node.active .ap-node-dot{background:#c8c8c8;box-shadow:0 0 4px rgba(200,200,200,0.5);}' +
            '#apiFabPanel .ap-node.has-key .ap-node-dot{background:rgba(26,26,31,0.3);}' +
            '#apiFabPanel .ap-node-name{font-size:6px;font-weight:800;letter-spacing:1px;color:rgba(26,26,31,0.2);text-transform:uppercase;font-family:"Share Tech Mono",monospace;}' +
            '#apiFabPanel .ap-node.active .ap-node-name{color:rgba(255,255,255,0.38);}' +
            '#apiFabPanel .ap-node-val{font-size:7px;color:rgba(26,26,31,0.18);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:56px;}' +
            '#apiFabPanel .ap-node.active .ap-node-val{color:rgba(255,255,255,0.42);}' +

            /* Token */
            '#apiFabPanel .ap-tokens{margin:0 9px 6px;padding:5px 9px;background:rgba(26,26,31,0.02);border:0.5px solid rgba(26,26,31,0.05);border-radius:6px;display:flex;align-items:center;gap:6px;position:relative;overflow:hidden;}' +
            '#apiFabPanel .ap-tokens::after{content:"TK";position:absolute;right:7px;top:50%;transform:translateY(-50%);font-family:"Share Tech Mono",monospace;font-size:22px;font-weight:700;color:rgba(26,26,31,0.02);letter-spacing:2px;pointer-events:none;}' +
            '#apiFabPanel .ap-tokens-label{font-size:6.5px;color:rgba(26,26,31,0.25);font-weight:700;flex:1;font-family:"Share Tech Mono",monospace;letter-spacing:0.5px;text-transform:uppercase;}' +
            '#apiFabPanel .ap-tokens-num{font-size:12px;font-weight:800;color:#1a1a1f;font-variant-numeric:tabular-nums;letter-spacing:-0.5px;}' +
            '#apiFabPanel .ap-tokens-unit{font-size:6.5px;color:rgba(26,26,31,0.25);font-weight:700;font-family:"Share Tech Mono",monospace;}' +
            '#apiFabPanel .ap-tokens-sep{width:1px;height:11px;background:rgba(26,26,31,0.06);}' +
            '#apiFabPanel .ap-tokens-total-num{font-size:8px;font-weight:700;color:rgba(26,26,31,0.32);font-variant-numeric:tabular-nums;}' +
            '#apiFabPanel .ap-tokens-total-unit{font-size:6px;color:rgba(26,26,31,0.18);font-family:"Share Tech Mono",monospace;}' +

            '#apiFabPanel .ap-div{height:1px;background:rgba(26,26,31,0.04);margin:0 9px;}' +

            /* 模型列表 */
            '#apiFabPanel .ap-models{max-height:122px;overflow-y:auto;scrollbar-width:none;padding:4px 6px;}' +
            '#apiFabPanel .ap-models::-webkit-scrollbar{display:none;}' +
            '#apiFabPanel .ap-model-g{font-size:6px;font-weight:800;letter-spacing:2px;color:rgba(26,26,31,0.16);text-transform:uppercase;padding:4px 5px 2px;font-family:"Share Tech Mono",monospace;display:flex;align-items:center;gap:5px;}' +
            '#apiFabPanel .ap-model-g::after{content:"";flex:1;height:0.5px;background:rgba(26,26,31,0.05);}' +
            '#apiFabPanel .ap-model-item{display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:5px;cursor:pointer;transition:background 0.12s;border:0.5px solid transparent;-webkit-tap-highlight-color:transparent;}' +
            '#apiFabPanel .ap-model-item:active{background:rgba(26,26,31,0.04);}' +
            '#apiFabPanel .ap-model-item.active{background:rgba(26,26,31,0.03);border-color:rgba(26,26,31,0.05);}' +
            '#apiFabPanel .ap-model-star{width:11px;height:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}' +
            '#apiFabPanel .ap-model-star svg{width:10px;height:10px;fill:rgba(26,26,31,0.07);stroke:rgba(26,26,31,0.07);stroke-width:2;transition:all 0.15s;}' +
            '#apiFabPanel .ap-model-item.fav .ap-model-star svg{fill:rgba(26,26,31,0.35);stroke:rgba(26,26,31,0.35);}' +
            '#apiFabPanel .ap-model-name{font-size:9px;font-weight:600;color:rgba(26,26,31,0.35);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '#apiFabPanel .ap-model-item.active .ap-model-name{color:#1a1a1f;font-weight:700;}' +
            '#apiFabPanel .ap-model-check{width:10px;height:10px;opacity:0;flex-shrink:0;}' +
            '#apiFabPanel .ap-model-item.active .ap-model-check{opacity:1;}' +
            '#apiFabPanel .ap-model-check svg{width:10px;height:10px;stroke:#1a1a1f;fill:none;stroke-width:2.5;stroke-linecap:round;}' +

            /* 输入 */
            '#apiFabPanel .ap-inputs{padding:6px 9px 5px;}' +
            '#apiFabPanel .ap-input-item{display:flex;align-items:center;gap:6px;padding:5px 8px;background:rgba(26,26,31,0.02);border:0.5px solid rgba(26,26,31,0.05);border-radius:6px;margin-bottom:3px;}' +
            '#apiFabPanel .ap-input-label{font-size:6px;font-weight:800;letter-spacing:1px;color:rgba(26,26,31,0.16);text-transform:uppercase;width:18px;flex-shrink:0;font-family:"Share Tech Mono",monospace;}' +
            '#apiFabPanel .ap-input-field{flex:1;background:transparent;border:none;outline:none;font-size:10px;color:#1a1a1f;font-family:-apple-system,sans-serif;}' +
            '#apiFabPanel .ap-input-field::placeholder{color:rgba(26,26,31,0.15);}' +
            '#apiFabPanel .ap-input-toggle{width:12px;height:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;}' +
            '#apiFabPanel .ap-input-toggle svg{width:10px;height:10px;stroke:rgba(26,26,31,0.2);fill:none;stroke-width:1.8;stroke-linecap:round;}' +

            /* 底部按钮 */
            '#apiFabPanel .ap-footer{display:flex;gap:3px;padding:6px 7px 9px;}' +
            '#apiFabPanel .ap-btn{flex:1;padding:6px 3px;border-radius:5px;background:rgba(26,26,31,0.025);border:0.5px solid rgba(26,26,31,0.06);font-size:6.5px;font-weight:800;letter-spacing:1px;color:rgba(26,26,31,0.28);text-transform:uppercase;cursor:pointer;text-align:center;font-family:"Share Tech Mono",monospace;transition:all 0.15s;-webkit-tap-highlight-color:transparent;}' +
            '#apiFabPanel .ap-btn:active{background:rgba(26,26,31,0.06);}' +
            '#apiFabPanel .ap-btn.primary{background:#1a1a1f;color:rgba(255,255,255,0.7);border-color:#1a1a1f;}' +
            '#apiFabPanel .ap-btn.danger{color:rgba(166,52,38,0.45);border-color:rgba(166,52,38,0.08);}' +
            '';
        document.head.appendChild(s);
    }

    /* ══════════════════════════════════════ Build ══════════════════════════════════════ */
    function build() {
        if (built) return;
        built = true;
        injectCSS();

        var wrap = document.createElement('div');
        wrap.id = 'apiFab';

        /* 面板 */
        var panel = document.createElement('div');
        panel.id = 'apiFabPanel';
        panel.innerHTML = buildPanelHTML();
        wrap.appendChild(panel);

        /* 收起标签 */
        var tag = document.createElement('div');
        tag.id = 'apiFabTag';
        tag.innerHTML = '<div class="ft-dot ok"></div><div class="ft-model">—</div><div class="ft-sep"></div><div class="ft-tk">— tk</div>';
        wrap.appendChild(tag);

        /* 悬浮球 */
        var ball = document.createElement('div');
        ball.id = 'apiFabBall';
        ball.innerHTML = buildBallHTML();
        wrap.appendChild(ball);

        document.body.appendChild(wrap);
        bindEvents();
        refreshUI();
    }

    function buildBallHTML() {
        return '' +
            /* 外层旋转装饰圈 */
            '<svg class="fb-ring" viewBox="0 0 48 48" fill="none">' +
                '<circle cx="24" cy="24" r="22" stroke="rgba(26,26,31,0.12)" stroke-width="0.6" stroke-dasharray="2 4" fill="none"/>' +
                '<circle cx="24" cy="2.5" r="1" fill="rgba(26,26,31,0.2)"/>' +
                '<circle cx="45.5" cy="24" r="1" fill="rgba(26,26,31,0.2)"/>' +
                '<circle cx="24" cy="45.5" r="1" fill="rgba(26,26,31,0.2)"/>' +
                '<circle cx="2.5" cy="24" r="1" fill="rgba(26,26,31,0.2)"/>' +
                '<circle cx="38.5" cy="7.5" r="0.7" fill="rgba(26,26,31,0.1)"/>' +
                '<circle cx="38.5" cy="40.5" r="0.7" fill="rgba(26,26,31,0.1)"/>' +
                '<circle cx="9.5" cy="7.5" r="0.7" fill="rgba(26,26,31,0.1)"/>' +
                '<circle cx="9.5" cy="40.5" r="0.7" fill="rgba(26,26,31,0.1)"/>' +
                '<line x1="24" y1="2" x2="24" y2="5.5" stroke="rgba(26,26,31,0.15)" stroke-width="0.8" stroke-linecap="round"/>' +
                '<line x1="46" y1="24" x2="42.5" y2="24" stroke="rgba(26,26,31,0.15)" stroke-width="0.8" stroke-linecap="round"/>' +
                '<line x1="24" y1="46" x2="24" y2="42.5" stroke="rgba(26,26,31,0.15)" stroke-width="0.8" stroke-linecap="round"/>' +
                '<line x1="2" y1="24" x2="5.5" y2="24" stroke="rgba(26,26,31,0.15)" stroke-width="0.8" stroke-linecap="round"/>' +
            '</svg>' +
            /* 核心圆 */
            '<div class="fb-core">' +
                '<svg width="30" height="30" viewBox="0 0 30 30" fill="none">' +
                    '<circle cx="15" cy="15" r="12" fill="rgba(255,255,255,0.03)"/>' +
                    '<circle cx="15" cy="15" r="9" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" fill="none" stroke-dasharray="2 3"/>' +
                    '<line x1="6" y1="15" x2="24" y2="15" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>' +
                    '<line x1="15" y1="6" x2="15" y2="24" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>' +
                    '<path d="M19.5 10.5 L22 13 L19.5 15.5" stroke="rgba(255,255,255,0.65)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                    '<path d="M8 13 L22 13" stroke="rgba(255,255,255,0.55)" stroke-width="1.2" stroke-linecap="round" fill="none"/>' +
                    '<path d="M10.5 19.5 L8 17 L10.5 14.5" stroke="rgba(255,255,255,0.45)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                    '<path d="M22 17 L8 17" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" stroke-linecap="round" fill="none"/>' +
                    '<circle cx="6" cy="6" r="0.8" fill="rgba(255,255,255,0.1)"/>' +
                    '<circle cx="24" cy="6" r="0.8" fill="rgba(255,255,255,0.1)"/>' +
                    '<circle cx="6" cy="24" r="0.8" fill="rgba(255,255,255,0.1)"/>' +
                    '<circle cx="24" cy="24" r="0.8" fill="rgba(255,255,255,0.1)"/>' +
                    '<circle cx="15" cy="15" r="1" fill="rgba(255,255,255,0.07)"/>' +
                '</svg>' +
            '</div>' +
            '<div class="fb-status ok"></div>';
    }

    function buildPanelHTML() {
        return '' +
            '<div class="ap-deco">' +
                '<svg width="236" height="500" viewBox="0 0 236 500" fill="none">' +
                    '<path d="M236 0 L236 80 Q200 60 160 20 L236 0Z" fill="rgba(26,26,31,0.012)"/>' +
                    '<circle cx="236" cy="0" r="85" stroke="rgba(26,26,31,0.04)" stroke-width="0.6" fill="none"/>' +
                    '<circle cx="236" cy="0" r="62" stroke="rgba(26,26,31,0.032)" stroke-width="0.4" fill="none" stroke-dasharray="2 4"/>' +
                    '<circle cx="236" cy="0" r="40" stroke="rgba(26,26,31,0.025)" stroke-width="0.4" fill="none"/>' +
                    '<circle cx="236" cy="0" r="20" stroke="rgba(26,26,31,0.05)" stroke-width="0.5" fill="none"/>' +
                    '<circle cx="236" cy="0" r="2.5" fill="rgba(26,26,31,0.07)"/>' +
                    '<circle cx="236" cy="0" r="1" fill="rgba(26,26,31,0.12)"/>' +
                    '<line x1="236" y1="0" x2="168" y2="52" stroke="rgba(26,26,31,0.05)" stroke-width="0.5"/>' +
                    '<line x1="236" y1="0" x2="194" y2="74" stroke="rgba(26,26,31,0.03)" stroke-width="0.35"/>' +
                    '<line x1="236" y1="0" x2="148" y2="28" stroke="rgba(26,26,31,0.03)" stroke-width="0.35"/>' +
                    '<g opacity="0.2"><circle cx="188" cy="12" r="0.8" fill="#1a1a1f"/><circle cx="200" cy="12" r="0.8" fill="#1a1a1f"/><circle cx="212" cy="12" r="0.8" fill="#1a1a1f"/><circle cx="224" cy="12" r="0.8" fill="#1a1a1f"/><circle cx="188" cy="22" r="0.8" fill="#1a1a1f"/><circle cx="200" cy="22" r="1.3" fill="#1a1a1f"/><circle cx="212" cy="22" r="0.8" fill="#1a1a1f"/><circle cx="224" cy="22" r="0.8" fill="#1a1a1f"/><circle cx="188" cy="32" r="0.8" fill="#1a1a1f"/><circle cx="200" cy="32" r="0.8" fill="#1a1a1f"/><circle cx="212" cy="32" r="1.3" fill="#1a1a1f"/><circle cx="224" cy="32" r="0.8" fill="#1a1a1f"/></g>' +
                    '<path d="M0 0 L0 48 L38 0Z" fill="rgba(26,26,31,0.01)"/>' +
                    '<line x1="0" y1="56" x2="42" y2="0" stroke="rgba(26,26,31,0.05)" stroke-width="0.7"/>' +
                    '<line x1="0" y1="80" x2="60" y2="0" stroke="rgba(26,26,31,0.032)" stroke-width="0.4"/>' +
                    '<line x1="0" y1="108" x2="82" y2="0" stroke="rgba(26,26,31,0.022)" stroke-width="0.4" stroke-dasharray="3 4"/>' +
                    '<line x1="0" y1="190" x2="8" y2="190" stroke="rgba(26,26,31,0.09)" stroke-width="0.8"/><line x1="0" y1="200" x2="5" y2="200" stroke="rgba(26,26,31,0.05)" stroke-width="0.5"/><line x1="0" y1="210" x2="5" y2="210" stroke="rgba(26,26,31,0.05)" stroke-width="0.5"/><line x1="0" y1="220" x2="5" y2="220" stroke="rgba(26,26,31,0.05)" stroke-width="0.5"/><line x1="0" y1="230" x2="8" y2="230" stroke="rgba(26,26,31,0.09)" stroke-width="0.8"/><circle cx="4" cy="210" r="1.5" fill="rgba(26,26,31,0.06)"/>' +
                    '<line x1="228" y1="148" x2="236" y2="148" stroke="rgba(26,26,31,0.09)" stroke-width="0.8"/><line x1="231" y1="158" x2="236" y2="158" stroke="rgba(26,26,31,0.05)" stroke-width="0.5"/><line x1="231" y1="168" x2="236" y2="168" stroke="rgba(26,26,31,0.05)" stroke-width="0.5"/><line x1="228" y1="178" x2="236" y2="178" stroke="rgba(26,26,31,0.09)" stroke-width="0.8"/>' +
                    '<circle cx="210" cy="275" r="12" fill="rgba(26,26,31,0.012)"/><circle cx="210" cy="275" r="12" stroke="rgba(26,26,31,0.04)" stroke-width="0.5" fill="none"/><circle cx="210" cy="275" r="7" stroke="rgba(26,26,31,0.032)" stroke-width="0.4" fill="none" stroke-dasharray="2 3"/><line x1="196" y1="275" x2="224" y2="275" stroke="rgba(26,26,31,0.06)" stroke-width="0.6"/><line x1="210" y1="261" x2="210" y2="289" stroke="rgba(26,26,31,0.06)" stroke-width="0.6"/><circle cx="210" cy="275" r="2" fill="rgba(26,26,31,0.06)"/><circle cx="210" cy="275" r="0.8" fill="rgba(26,26,31,0.1)"/>' +
                    '<text font-family="\'Share Tech Mono\',monospace" font-size="6" fill="rgba(26,26,31,0.038)" letter-spacing="2.5" font-weight="700" transform="translate(5.5,340) rotate(-90)">INFERENCE · MODEL · CONFIG · STREAM · TOKEN · API</text>' +
                    '<text font-family="\'Share Tech Mono\',monospace" font-size="5.5" fill="rgba(26,26,31,0.032)" letter-spacing="2" font-weight="700" transform="translate(230,210) rotate(90)">NODE · KEY · ENDPOINT · SYNC · PRIMARY</text>' +
                    '<text x="8" y="420" font-family="\'Share Tech Mono\',monospace" font-size="48" fill="rgba(26,26,31,0.013)" letter-spacing="3" font-weight="700">API</text>' +
                    '<text x="55" y="478" font-family="\'Share Tech Mono\',monospace" font-size="19" fill="rgba(26,26,31,0.01)" letter-spacing="2">CONFIG</text>' +
                    '<path d="M0 500 L0 380 Q50 420 80 500Z" fill="rgba(26,26,31,0.008)"/>' +
                    '<circle cx="0" cy="500" r="100" stroke="rgba(26,26,31,0.028)" stroke-width="0.6" fill="none"/>' +
                    '<circle cx="0" cy="500" r="68" stroke="rgba(26,26,31,0.02)" stroke-width="0.4" fill="none" stroke-dasharray="3 7"/>' +
                    '<g opacity="0.15"><circle cx="12" cy="432" r="0.8" fill="#1a1a1f"/><circle cx="22" cy="432" r="0.8" fill="#1a1a1f"/><circle cx="32" cy="432" r="0.8" fill="#1a1a1f"/><circle cx="12" cy="442" r="0.8" fill="#1a1a1f"/><circle cx="22" cy="442" r="1.3" fill="#1a1a1f"/><circle cx="32" cy="442" r="0.8" fill="#1a1a1f"/><circle cx="12" cy="452" r="0.8" fill="#1a1a1f"/><circle cx="22" cy="452" r="0.8" fill="#1a1a1f"/><circle cx="32" cy="452" r="0.8" fill="#1a1a1f"/></g>' +
                    '<polyline points="0,478 26,468 52,474 78,462 104,469 130,458 156,465 182,454 208,461 236,450" stroke="rgba(26,26,31,0.04)" stroke-width="0.7" fill="none"/>' +
                    '<polyline points="0,488 34,479 68,485 102,475 136,481 170,472 204,478 236,469" stroke="rgba(26,26,31,0.025)" stroke-width="0.5" fill="none" stroke-dasharray="4 7"/>' +
                    '<rect x="198" y="460" width="28" height="18" rx="2" fill="rgba(26,26,31,0.008)"/><rect x="198" y="460" width="28" height="18" rx="2" stroke="rgba(26,26,31,0.05)" stroke-width="0.6" fill="none"/><rect x="203" y="465" width="18" height="8" rx="1" stroke="rgba(26,26,31,0.04)" stroke-width="0.4" fill="none"/><circle cx="216" cy="469" r="1.8" stroke="rgba(26,26,31,0.04)" stroke-width="0.4" fill="none"/>' +
                    '<line x1="0" y1="345" x2="236" y2="345" stroke="rgba(26,26,31,0.022)" stroke-width="0.4" stroke-dasharray="5 10"/>' +
                    '<line x1="0" y1="400" x2="236" y2="500" stroke="rgba(26,26,31,0.022)" stroke-width="0.5"/>' +
                '</svg>' +
            '</div>' +
            '<div class="ap-content">' +
                '<div class="ap-stripe"></div>' +
                '<div class="ap-head">' +
                    '<div class="ap-head-left"><div class="ap-head-badge">01 · API</div><div class="ap-head-title">Config</div></div>' +
                    '<div class="ap-head-close" id="apiFabClose"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>' +
                '</div>' +
                '<div class="ap-nodes" id="apiFabNodes"></div>' +
                '<div class="ap-tokens">' +
                    '<span class="ap-tokens-label">Last Call</span>' +
                    '<span class="ap-tokens-num" id="apiFabTkNum">—</span>' +
                    '<span class="ap-tokens-unit">TK</span>' +
                    '<div class="ap-tokens-sep"></div>' +
                    '<span class="ap-tokens-total-num" id="apiFabTkTotal">—</span>' +
                    '<span class="ap-tokens-total-unit"> total</span>' +
                '</div>' +
                '<div class="ap-div"></div>' +
                '<div class="ap-models" id="apiFabModels"></div>' +
                '<div class="ap-div"></div>' +
                '<div class="ap-inputs">' +
                    '<div class="ap-input-item"><div class="ap-input-label">EP</div><input class="ap-input-field" id="apiFabEp" placeholder="https://api.openai.com/v1"></div>' +
                    '<div class="ap-input-item"><div class="ap-input-label">Key</div><input class="ap-input-field" id="apiFabKey" type="password" placeholder="sk-..."><div class="ap-input-toggle" id="apiFabKeyToggle"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div></div>' +
                '</div>' +
                '<div class="ap-footer">' +
                    '<div class="ap-btn" id="apiFabFetch">Fetch</div>' +
                    '<div class="ap-btn danger" id="apiFabReset">Reset</div>' +
                    '<div class="ap-btn primary" id="apiFabApply">Apply</div>' +
                '</div>' +
            '</div>';
    }

    /* ══════════════════════════════════════ Refresh UI ══════════════════════════════════════ */
    function refreshUI() {
        var cfg = getCfg();
        var node = cfg.node || 'primary';
        var nodes = ['primary', 'backup', 'nodeC'];
        var nodeLabels = { primary: 'Primary', backup: 'Backup', nodeC: 'Node C' };

        /* 节点按钮 */
        var nodesEl = document.getElementById('apiFabNodes');
        if (nodesEl) {
            var html = '';
            nodes.forEach(function(n) {
                var ncfg = cfg[n] || {};
                var hasKey = !!ncfg.key;
                var model = ncfg.model || '—';
                var shortModel = model.length > 8 ? model.substring(0, 8) + '..' : model;
                html += '<div class="ap-node' + (n === node ? ' active' : '') + (hasKey ? ' has-key' : '') + '" data-node="' + n + '">' +
                    '<div class="ap-node-dot"></div>' +
                    '<div class="ap-node-name">' + nodeLabels[n] + '</div>' +
                    '<div class="ap-node-val">' + esc(shortModel) + '</div>' +
                '</div>';
            });
            nodesEl.innerHTML = html;
            nodesEl.querySelectorAll('.ap-node').forEach(function(el) {
                el.addEventListener('click', function() {
                    var n = el.dataset.node;
                    var cfg2 = getCfg();
                    cfg2.node = n;
                    saveCfg(cfg2);
                    window.dispatchEvent(new CustomEvent('sh-api-updated', { detail: {} }));
                    refreshUI();
                });
            });
        }

        /* 当前节点输入框 */
        var curCfg = cfg[node] || {};
        var epEl = document.getElementById('apiFabEp');
        var keyEl = document.getElementById('apiFabKey');
        if (epEl) epEl.value = curCfg.endpoint || '';
        if (keyEl) keyEl.value = curCfg.key || '';

        /* Tag 标签 */
        var tagModel = document.querySelector('#apiFabTag .ft-model');
        var tagTk = document.querySelector('#apiFabTag .ft-tk');
        var tagDot = document.querySelector('#apiFabTag .ft-dot');
        var curModel = curCfg.model || '—';
        if (tagModel) tagModel.textContent = curModel.length > 10 ? curModel.substring(0, 10) + '..' : curModel;
        if (tagDot) { tagDot.classList.toggle('ok', !!curCfg.key); }

        /* Token 统计 */
        var lastTk = parseInt(localStorage.getItem('api-fab-last-tk') || '0', 10);
        var totalTk = parseInt(localStorage.getItem('api-fab-total-tk') || '0', 10);
        var tkNumEl = document.getElementById('apiFabTkNum');
        var tkTotalEl = document.getElementById('apiFabTkTotal');
        if (tkNumEl) tkNumEl.textContent = lastTk ? lastTk.toLocaleString() : '—';
        if (tkTotalEl) tkTotalEl.textContent = totalTk ? totalTk.toLocaleString() : '—';
        if (tagTk) tagTk.textContent = lastTk ? lastTk.toLocaleString() + ' tk' : '— tk';

        /* 状态点 */
        var statusEl = document.querySelector('#apiFabBall .fb-status');
        if (statusEl) statusEl.classList.toggle('ok', !!curCfg.key);

        /* 模型列表 */
        renderModels();
    }

    function renderModels() {
        var modelsEl = document.getElementById('apiFabModels');
        if (!modelsEl) return;
        var cfg = getCfg();
        var node = cfg.node || 'primary';
        var curModel = (cfg[node] || {}).model || '';
        var models = cfg.models || [];
        var favs = models.filter(function(m) { return m.fav; });
        var rest = models.filter(function(m) { return !m.fav; });
        var html = '';
        if (favs.length) {
            html += '<div class="ap-model-g">Favorites</div>';
            favs.forEach(function(m) {
                html += '<div class="ap-model-item fav' + (m.name === curModel ? ' active' : '') + '" data-name="' + esc(m.name) + '">' +
                    '<div class="ap-model-star"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>' +
                    '<div class="ap-model-name">' + esc(m.name) + '</div>' +
                    '<div class="ap-model-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>' +
                '</div>';
            });
        }
        if (rest.length) {
            html += '<div class="ap-model-g">All Models</div>';
            rest.forEach(function(m) {
                html += '<div class="ap-model-item' + (m.name === curModel ? ' active' : '') + '" data-name="' + esc(m.name) + '">' +
                    '<div class="ap-model-star"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>' +
                    '<div class="ap-model-name">' + esc(m.name) + '</div>' +
                    '<div class="ap-model-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>' +
                '</div>';
            });
        }
        if (!models.length) {
            html = '<div style="font-size:8px;color:rgba(26,26,31,0.2);text-align:center;padding:12px 0;font-family:\'Share Tech Mono\',monospace;letter-spacing:1px;">FETCH TO LOAD MODELS</div>';
        }
        modelsEl.innerHTML = html;
        modelsEl.querySelectorAll('.ap-model-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                if (e.target.closest('.ap-model-star')) {
                    var name = item.dataset.name;
                    var cfg2 = getCfg();
                    (cfg2.models || []).forEach(function(m) { if (m.name === name) m.fav = !m.fav; });
                    saveCfg(cfg2);
                    renderModels();
                    return;
                }
                var name = item.dataset.name;
                var cfg2 = getCfg();
                var node = cfg2.node || 'primary';
                if (!cfg2[node]) cfg2[node] = {};
                cfg2[node].model = name;
                saveCfg(cfg2);
                window.dispatchEvent(new CustomEvent('sh-api-updated', { detail: { model: name, node: node } }));
                refreshUI();
            });
        });
    }

    /* ══════════════════════════════════════ Drag ══════════════════════════════════════ */
    var _fabPos = { x: null, y: null };
    var _dragging = false;
    var _dragMoved = false;
    var _dragStart = { x: 0, y: 0 };
    var _dragOrigin = { x: 0, y: 0 };

    function initDrag() {
        var wrap = document.getElementById('apiFab');
        if (!wrap) return;

        /* 读取存储的位置 */
        try {
            var stored = JSON.parse(localStorage.getItem('api-fab-pos') || 'null');
            if (stored) { _fabPos = stored; applyFabPos(); }
        } catch(e) {}

        var ball = document.getElementById('apiFabBall');
        if (!ball) return;

        function startDrag(cx, cy) {
            _dragging = true;
            _dragMoved = false;
            var rect = wrap.getBoundingClientRect();
            _dragStart = { x: cx, y: cy };
            _dragOrigin = { x: rect.right, y: rect.bottom };
            wrap.style.transition = 'none';
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
        }

        function moveDrag(cx, cy) {
            if (!_dragging) return;
            var dx = cx - _dragStart.x;
            var dy = cy - _dragStart.y;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) _dragMoved = true;
            if (!_dragMoved) return;

            var vw = window.innerWidth;
            var vh = window.innerHeight;
            var newRight = Math.max(8, Math.min(vw - 60, vw - (_dragOrigin.x + dx)));
            var newBottom = Math.max(8, Math.min(vh - 60, vh - (_dragOrigin.y + dy)));
            _fabPos = { x: newRight, y: newBottom };
            applyFabPos();
        }

        function endDrag() {
            if (!_dragging) return;
            _dragging = false;
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            wrap.style.transition = '';
            if (_dragMoved) {
                try { localStorage.setItem('api-fab-pos', JSON.stringify(_fabPos)); } catch(e) {}
                /* 吸附到最近的边 */
                snapToEdge();
            }
        }

        ball.addEventListener('touchstart', function(e) {
            if (e.touches.length !== 1) return;
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });

        document.addEventListener('touchmove', function(e) {
            if (!_dragging) return;
            moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });

        document.addEventListener('touchend', function() { endDrag(); }, { passive: true });

        ball.addEventListener('mousedown', function(e) {
            e.preventDefault();
            startDrag(e.clientX, e.clientY);
        });

        document.addEventListener('mousemove', function(e) {
            if (!_dragging) return;
            moveDrag(e.clientX, e.clientY);
        });

        document.addEventListener('mouseup', function() { endDrag(); });
    }

    function applyFabPos() {
        var wrap = document.getElementById('apiFab');
        if (!wrap || !_fabPos.x) return;
        wrap.style.right = _fabPos.x + 'px';
        wrap.style.bottom = _fabPos.y + 'px';
    }

    function snapToEdge() {
        var wrap = document.getElementById('apiFab');
        if (!wrap) return;
        var vw = window.innerWidth;
        var rect = wrap.getBoundingClientRect();
        var centerX = rect.left + rect.width / 2;
        var newRight = centerX < vw / 2 ? (vw - rect.width - 8) : 18;
        _fabPos.x = newRight;
        wrap.style.transition = 'right 0.35s cubic-bezier(0.16,1,0.3,1), bottom 0.35s cubic-bezier(0.16,1,0.3,1)';
        wrap.style.right = newRight + 'px';
        try { localStorage.setItem('api-fab-pos', JSON.stringify(_fabPos)); } catch(e) {}
        setTimeout(function() { if (wrap) wrap.style.transition = ''; }, 400);
    }

    /* 面板拖动 */
    function initPanelDrag() {
        var panel = document.getElementById('apiFabPanel');
        var head = panel ? panel.querySelector('.ap-head') : null;
        if (!head) return;

        var _pDragging = false;
        var _pMoved = false;
        var _pStart = { x: 0, y: 0 };
        var _pOffset = { x: 0, y: 0 };

        head.style.cursor = 'grab';

        function pStart(cx, cy) {
            _pDragging = true;
            _pMoved = false;
            _pStart = { x: cx, y: cy };
            var style = window.getComputedStyle(panel);
            _pOffset = {
                x: parseInt(style.marginRight || '0', 10),
                y: parseInt(style.marginBottom || '0', 10)
            };
            panel.style.transition = 'none';
            head.style.cursor = 'grabbing';
        }

        function pMove(cx, cy) {
            if (!_pDragging) return;
            var dx = cx - _pStart.x;
            var dy = cy - _pStart.y;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) _pMoved = true;
            if (!_pMoved) return;
            var wrap = document.getElementById('apiFab');
            if (!wrap) return;
            var vw = window.innerWidth;
            var vh = window.innerHeight;
            var wRect = wrap.getBoundingClientRect();
            var pRect = panel.getBoundingClientRect();
            /* 移动整个 fab wrap */
            var newRight = Math.max(8, Math.min(vw - 60, parseFloat(wrap.style.right || '18') - dx));
            var newBottom = Math.max(8, Math.min(vh - 60, parseFloat(wrap.style.bottom || '22') - dy));
            wrap.style.right = newRight + 'px';
            wrap.style.bottom = newBottom + 'px';
            _fabPos = { x: newRight, y: newBottom };
            _pStart = { x: cx, y: cy };
        }

        function pEnd() {
            if (!_pDragging) return;
            _pDragging = false;
            head.style.cursor = 'grab';
            panel.style.transition = '';
            if (_pMoved) {
                try { localStorage.setItem('api-fab-pos', JSON.stringify(_fabPos)); } catch(e) {}
            }
        }

        head.addEventListener('mousedown', function(e) { e.preventDefault(); pStart(e.clientX, e.clientY); });
        document.addEventListener('mousemove', function(e) { pMove(e.clientX, e.clientY); });
        document.addEventListener('mouseup', pEnd);

        head.addEventListener('touchstart', function(e) {
            if (e.touches.length !== 1) return;
            pStart(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        document.addEventListener('touchmove', function(e) {
            if (!_pDragging) return;
            pMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        document.addEventListener('touchend', pEnd, { passive: true });
    }

    /* ══════════════════════════════════════ Bind ══════════════════════════════════════ */
    function bindEvents() {
        var ball = document.getElementById('apiFabBall');
        var tag = document.getElementById('apiFabTag');
        var panel = document.getElementById('apiFabPanel');
        var closeBtn = document.getElementById('apiFabClose');
        var keyToggle = document.getElementById('apiFabKeyToggle');
        var fetchBtn = document.getElementById('apiFabFetch');
        var resetBtn = document.getElementById('apiFabReset');
        var applyBtn = document.getElementById('apiFabApply');
        var epEl = document.getElementById('apiFabEp');
        var keyEl = document.getElementById('apiFabKey');

        /* 拖拽初始化 */
        initDrag();
        initPanelDrag();

        /* 球点击：拖动结束后不触发点击 */
        ball.addEventListener('click', function() {
            if (_dragMoved) { _dragMoved = false; return; }
            togglePanel();
        });
        tag.addEventListener('click', function() { togglePanel(); });
        if (closeBtn) closeBtn.addEventListener('click', function() { closePanel(); });

        /* 点击外部关闭 */
        document.addEventListener('click', function(e) {
            if (!isOpen) return;
            var fab = document.getElementById('apiFab');
            if (fab && !fab.contains(e.target)) closePanel();
        });

        /* Key 显示切换 */
        if (keyToggle) {
            keyToggle.addEventListener('click', function() {
                if (keyEl) keyEl.type = keyEl.type === 'password' ? 'text' : 'password';
            });
        }

        /* Fetch */
        if (fetchBtn) {
            fetchBtn.addEventListener('click', function() {
                var ep = epEl ? epEl.value.trim() : '';
                var key = keyEl ? keyEl.value.trim() : '';
                if (!ep || !key) { fetchBtn.textContent = 'Fill EP+Key'; setTimeout(function(){ fetchBtn.textContent = 'Fetch'; }, 1500); return; }
                fetchBtn.textContent = '...';
                var url = ep.replace(/\/+$/, '');
                if (url.indexOf('/chat/completions') !== -1) url = url.replace('/chat/completions', '/models');
                else if (url.indexOf('/models') === -1) url += '/models';
                fetch(url, { method: 'GET', headers: { 'Authorization': 'Bearer ' + key } })
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        var models = [];
                        if (data.data) data.data.forEach(function(m) {
                            var id = m.id || m.name || '';
                            if (id && id.indexOf('embed') === -1 && id.indexOf('tts') === -1 && id.indexOf('dall') === -1 && id.indexOf('whisper') === -1) {
                                models.push(id);
                            }
                        });
                        models.sort();
                        var cfg2 = getCfg();
                        cfg2.models = models.map(function(id) {
                            var ex = (cfg2.models || []).find(function(m) { return m.name === id; });
                            return { name: id, fav: ex ? ex.fav : false };
                        });
                        saveCfg(cfg2);
                        renderModels();
                        fetchBtn.textContent = models.length + ' OK';
                        setTimeout(function(){ fetchBtn.textContent = 'Fetch'; }, 1500);
                    })
                    .catch(function() { fetchBtn.textContent = 'Error'; setTimeout(function(){ fetchBtn.textContent = 'Fetch'; }, 1500); });
            });
        }

        /* Reset */
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                closePanel();
            });
        }

        /* Apply */
        if (applyBtn) {
            applyBtn.addEventListener('click', function() {
                var ep = epEl ? epEl.value.trim() : '';
                var key = keyEl ? keyEl.value.trim() : '';
                var cfg2 = getCfg();
                var node = cfg2.node || 'primary';
                if (!cfg2[node]) cfg2[node] = {};
                if (ep) cfg2[node].endpoint = ep;
                if (key) cfg2[node].key = key;
                saveCfg(cfg2);
                window.dispatchEvent(new CustomEvent('sh-api-updated', { detail: { ep: ep, key: key, node: node } }));
                refreshUI();
                applyBtn.textContent = 'Saved';
                setTimeout(function() { applyBtn.textContent = 'Apply'; }, 1200);
            });
        }

        /* 监听 token 更新 */
        window.addEventListener('api-fab-token-update', function(e) {
            var d = e.detail || {};
            if (d.last) localStorage.setItem('api-fab-last-tk', String(d.last));
            if (d.total) localStorage.setItem('api-fab-total-tk', String(d.total));
            refreshUI();
            var numEl = document.getElementById('apiFabTkNum');
            if (numEl) {
                numEl.classList.remove('pop');
                void numEl.offsetWidth;
                numEl.classList.add('pop');
                setTimeout(function() { numEl.classList.remove('pop'); }, 300);
            }
        });

        /* 监听设置同步 */
        window.addEventListener('sh-api-updated', function() { refreshUI(); });
    }

    function togglePanel() {
        if (isOpen) closePanel(); else openPanel();
    }
    function openPanel() {
        isOpen = true;
        var panel = document.getElementById('apiFabPanel');
        var ball = document.getElementById('apiFabBall');
        if (panel) panel.classList.add('open');
        if (ball) ball.classList.add('active');
        refreshUI();
    }
    function closePanel() {
        isOpen = false;
        var panel = document.getElementById('apiFabPanel');
        var ball = document.getElementById('apiFabBall');
        if (ball) ball.classList.remove('active');
        if (panel) {
            panel.classList.remove('open');
            panel.classList.add('closing');
            setTimeout(function() {
                panel.classList.remove('closing');
            }, 200);
        }
    }

    /* ══════════════════════════════════════ Public ══════════════════════════════════════ */
    window.openApiFab = function() {
        build();
        var fab = document.getElementById('apiFab');
        if (fab) fab.style.display = 'flex';
        refreshUI();
    };
    window.closeApiFab = function() {
        var fab = document.getElementById('apiFab');
        if (fab) fab.style.display = 'none';
        closePanel();
    };
    window.toggleApiFab = function() {
        build();
        var fab = document.getElementById('apiFab');
        if (!fab) return;
        if (fab.style.display === 'none') { fab.style.display = 'flex'; refreshUI(); }
        else { fab.style.display = 'none'; closePanel(); }
    };

    /* 监听 chat-app 和 theatre 的 token 使用量 */
    var _origFetch = window.fetch;
    /* 不拦截 fetch，改用事件方式：chat-app 调用 AI 结束后 dispatch 事件即可 */

})();
