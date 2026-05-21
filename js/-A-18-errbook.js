// js/-A-18-errbook.js · Errbook · AI行为纠错本
(function () {
    'use strict';

    var built = false;

    function esc(s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : s); return d.innerHTML; }

    function loadRules() {
        try { return JSON.parse(localStorage.getItem('ca-errbook') || '[]'); } catch(e) { return []; }
    }
    function saveRules(rules) {
        localStorage.setItem('ca-errbook', JSON.stringify(rules));
    }

    /* ══════════════════════════════════════ CSS ══════════════════════════════════════ */
    function buildCSS() {
        return '' +
            /* 主面板 */
            '#ebPanel{position:fixed;bottom:calc(env(safe-area-inset-bottom,10px) + 90px);left:14px;right:14px;z-index:50;background:#fff;border:1px solid rgba(42,40,48,0.08);border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(42,40,48,0.04);transform:translateY(16px);opacity:0;pointer-events:none;transition:all 0.35s cubic-bezier(0.16,1,0.3,1);}' +
            '#ebPanel.open{transform:translateY(0);opacity:1;pointer-events:auto;}' +

            /* 顶部 */
            '#ebPanel .eb-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(42,40,48,0.05);position:relative;overflow:hidden;}' +
            '#ebPanel .eb-head::after{content:"Error";position:absolute;right:-6px;top:-4px;font-family:"TheatreDeco",serif;font-size:48px;color:rgba(42,40,48,0.02);pointer-events:none;letter-spacing:2px;line-height:1;}' +
            '#ebPanel .eb-hl{display:flex;align-items:center;gap:10px;}' +
            '#ebPanel .eb-hic{width:28px;height:28px;border-radius:8px;background:#1a1a1f;display:flex;align-items:center;justify-content:center;}' +
            '#ebPanel .eb-hic svg{width:13px;height:13px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;}' +
            '#ebPanel .eb-ht{font-size:13px;font-weight:700;color:#1a1a1f;}' +
            '#ebPanel .eb-hs{font-size:8px;color:rgba(42,40,48,0.3);margin-top:2px;}' +
            '#ebPanel .eb-hx{width:24px;height:24px;border-radius:6px;background:rgba(42,40,48,0.04);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;}' +
            '#ebPanel .eb-hx:active{background:rgba(42,40,48,0.08);transform:scale(0.9);}' +
            '#ebPanel .eb-hx svg{width:10px;height:10px;stroke:rgba(42,40,48,0.35);fill:none;stroke-width:2.5;stroke-linecap:round;}' +

            /* tab */
            '#ebPanel .eb-tabs{display:flex;padding:8px 12px;gap:5px;border-bottom:1px solid rgba(42,40,48,0.04);overflow-x:auto;scrollbar-width:none;}' +
            '#ebPanel .eb-tabs::-webkit-scrollbar{display:none;}' +
            '#ebPanel .eb-tab{padding:5px 12px;border-radius:6px;font-size:8px;font-weight:700;letter-spacing:0.5px;color:rgba(42,40,48,0.35);background:transparent;border:none;cursor:pointer;white-space:nowrap;transition:all 0.15s;-webkit-tap-highlight-color:transparent;}' +
            '#ebPanel .eb-tab.on{background:#1a1a1f;color:#fff;}' +

            /* 条目列表 */
            '#ebPanel .eb-list{max-height:240px;overflow-y:auto;scrollbar-width:none;}' +
            '#ebPanel .eb-list::-webkit-scrollbar{display:none;}' +
            '#ebPanel .eb-item{display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:1px solid rgba(42,40,48,0.04);cursor:pointer;transition:background 0.15s;-webkit-tap-highlight-color:transparent;}' +
            '#ebPanel .eb-item:last-child{border-bottom:none;}' +
            '#ebPanel .eb-item:active{background:rgba(42,40,48,0.02);}' +
            '#ebPanel .eb-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:4px;}' +
            '#ebPanel .eb-dot.hi{background:#1a1a1f;}' +
            '#ebPanel .eb-dot.mid{background:rgba(42,40,48,0.4);}' +
            '#ebPanel .eb-dot.lo{background:rgba(42,40,48,0.15);}' +
            '#ebPanel .eb-body{flex:1;min-width:0;}' +
            '#ebPanel .eb-wrong{font-size:10px;font-weight:600;color:rgba(42,40,48,0.7);line-height:1.5;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
            '#ebPanel .eb-fix{font-size:9px;color:rgba(42,40,48,0.35);font-family:Georgia,serif;font-style:italic;line-height:1.5;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}' +
            '#ebPanel .eb-meta{display:flex;align-items:center;gap:6px;margin-top:4px;}' +
            '#ebPanel .eb-tag{font-size:7px;font-weight:700;letter-spacing:1px;color:rgba(42,40,48,0.25);background:rgba(42,40,48,0.04);padding:2px 7px;border-radius:3px;text-transform:uppercase;}' +
            '#ebPanel .eb-del{width:18px;height:18px;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;opacity:0;transition:opacity 0.15s;}' +
            '#ebPanel .eb-item:hover .eb-del{opacity:1;}' +
            '#ebPanel .eb-del:active{background:rgba(166,52,38,0.08);}' +
            '#ebPanel .eb-del svg{width:10px;height:10px;stroke:rgba(166,52,38,0.5);fill:none;stroke-width:2;stroke-linecap:round;}' +

            /* 空状态 */
            '#ebPanel .eb-empty{padding:28px 20px;text-align:center;}' +
            '#ebPanel .eb-empty-t{font-size:11px;font-weight:600;color:rgba(42,40,48,0.25);margin-bottom:4px;}' +
            '#ebPanel .eb-empty-s{font-size:9px;color:rgba(42,40,48,0.2);font-family:Georgia,serif;font-style:italic;}' +

            /* 输入区 */
            '#ebPanel .eb-add{border-top:1px solid rgba(42,40,48,0.05);padding:12px 14px;}' +
            '#ebPanel .eb-add-row{display:flex;gap:6px;margin-bottom:8px;align-items:center;}' +
            '#ebPanel .eb-add-sel{flex:1;background:rgba(42,40,48,0.02);border:0.8px solid rgba(42,40,48,0.06);border-radius:8px;padding:7px 10px;font-size:9px;font-weight:600;color:rgba(42,40,48,0.5);outline:none;-webkit-appearance:none;appearance:none;}' +
            '#ebPanel .eb-add-pri{padding:7px 12px;border-radius:8px;border:0.8px solid rgba(42,40,48,0.06);background:rgba(42,40,48,0.02);font-size:8px;font-weight:700;color:rgba(42,40,48,0.4);cursor:pointer;white-space:nowrap;transition:all 0.15s;-webkit-tap-highlight-color:transparent;}' +
            '#ebPanel .eb-add-pri.on{background:#1a1a1f;color:#fff;border-color:#1a1a1f;}' +
            '#ebPanel .eb-wrong-inp{width:100%;background:rgba(42,40,48,0.02);border:0.8px solid rgba(42,40,48,0.06);border-radius:8px;padding:9px 12px;font-size:11px;color:#1a1a1f;outline:none;resize:none;height:52px;font-family:-apple-system,sans-serif;margin-bottom:6px;transition:border-color 0.15s;}' +
            '#ebPanel .eb-wrong-inp:focus{border-color:rgba(42,40,48,0.2);background:#fff;}' +
            '#ebPanel .eb-wrong-inp::placeholder{color:rgba(42,40,48,0.2);}' +
            '#ebPanel .eb-fix-inp{width:100%;background:rgba(42,40,48,0.02);border:0.8px solid rgba(42,40,48,0.06);border-radius:8px;padding:9px 12px;font-size:10px;color:rgba(42,40,48,0.7);outline:none;resize:none;height:40px;font-family:Georgia,serif;font-style:italic;margin-bottom:8px;transition:border-color 0.15s;}' +
            '#ebPanel .eb-fix-inp:focus{border-color:rgba(42,40,48,0.2);background:#fff;}' +
            '#ebPanel .eb-fix-inp::placeholder{color:rgba(42,40,48,0.2);}' +
            '#ebPanel .eb-submit{width:100%;padding:11px;border-radius:8px;background:#1a1a1f;color:#fff;border:none;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;transition:all 0.15s;}' +
            '#ebPanel .eb-submit:active{transform:scale(0.98);}' +

            /* 聊天区注入提示 */
            '#theatreScene .eb-injected{margin-bottom:10px;display:flex;flex-direction:column;align-items:center;padding:4px 0;}' +
            '#theatreScene .eb-inj-div{display:flex;align-items:center;gap:10px;width:100%;}' +
            '#theatreScene .eb-inj-div::before,#theatreScene .eb-inj-div::after{content:"";flex:1;height:0.5px;background:rgba(42,40,48,0.06);}' +
            '#theatreScene .eb-inj-c{display:flex;align-items:center;gap:5px;flex-shrink:0;}' +
            '#theatreScene .eb-inj-ic{width:14px;height:14px;border-radius:50%;background:rgba(42,40,48,0.08);display:flex;align-items:center;justify-content:center;}' +
            '#theatreScene .eb-inj-ic svg{width:7px;height:7px;stroke:rgba(42,40,48,0.3);fill:none;stroke-width:2;stroke-linecap:round;}' +
            '#theatreScene .eb-inj-t{font-size:7px;font-weight:700;letter-spacing:1.5px;color:rgba(42,40,48,0.2);text-transform:uppercase;}' +
            '';
    }

    /* ══════════════════════════════════════ Build ══════════════════════════════════════ */
    function build() {
        if (built) return;
        built = true;

        var style = document.createElement('style');
        style.id = 'ebStyles';
        style.textContent = buildCSS();
        document.head.appendChild(style);

        var panel = document.createElement('div');
        panel.id = 'ebPanel';
        panel.innerHTML =
            '<div class="eb-head">' +
                '<div class="eb-hl">' +
                    '<div class="eb-hic"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>' +
                    '<div><div class="eb-ht">纠错本</div><div class="eb-hs">AI行为校正记录</div></div>' +
                '</div>' +
                '<div class="eb-hx" id="ebClose"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>' +
            '</div>' +
            '<div class="eb-tabs" id="ebTabs">' +
                '<div class="eb-tab on" data-cat="">全部</div>' +
                '<div class="eb-tab" data-cat="角色扮演">角色扮演</div>' +
                '<div class="eb-tab" data-cat="格式">格式</div>' +
                '<div class="eb-tab" data-cat="剧情">剧情</div>' +
                '<div class="eb-tab" data-cat="语言">语言</div>' +
            '</div>' +
            '<div class="eb-list" id="ebList"></div>' +
            '<div class="eb-add">' +
                '<div class="eb-add-row">' +
                    '<select class="eb-add-sel" id="ebCat">' +
                        '<option>角色扮演</option>' +
                        '<option>格式</option>' +
                        '<option>剧情</option>' +
                        '<option>语言</option>' +
                    '</select>' +
                    '<div class="eb-add-pri on" data-pri="hi" id="ebPriHi">高</div>' +
                    '<div class="eb-add-pri" data-pri="mid" id="ebPriMid">中</div>' +
                    '<div class="eb-add-pri" data-pri="lo" id="ebPriLo">低</div>' +
                '</div>' +
                '<textarea class="eb-wrong-inp" id="ebWrongInp" placeholder="AI犯了什么错误？"></textarea>' +
                '<textarea class="eb-fix-inp" id="ebFixInp" placeholder="正确的做法是？（可选）"></textarea>' +
                '<button class="eb-submit" id="ebSubmit">Add to Errbook</button>' +
            '</div>';

        /* 挂到 theatreScene 下 */
        var theatre = document.getElementById('theatreScene');
        if (theatre) {
            theatre.appendChild(panel);
        } else {
            document.body.appendChild(panel);
        }

        bindEvents();
        renderList('');
    }

    /* ══════════════════════════════════════ Render ══════════════════════════════════════ */
    function renderList(cat) {
        var list = document.getElementById('ebList');
        if (!list) return;
        var rules = loadRules();
        if (cat) rules = rules.filter(function(r) { return r.cat === cat; });
        if (rules.length === 0) {
            list.innerHTML = '<div class="eb-empty"><div class="eb-empty-t">暂无纠错记录</div><div class="eb-empty-s">记录AI的错误，它下次就不会再犯</div></div>';
            return;
        }
        var html = '';
        rules.forEach(function(r, idx) {
            html += '<div class="eb-item" data-idx="' + idx + '">' +
                '<div class="eb-dot ' + (r.pri || 'mid') + '"></div>' +
                '<div class="eb-body">' +
                    '<div class="eb-wrong">' + esc(r.wrong) + '</div>' +
                    (r.fix ? '<div class="eb-fix">' + esc(r.fix) + '</div>' : '') +
                    '<div class="eb-meta"><span class="eb-tag">' + esc(r.cat || '通用') + '</span></div>' +
                '</div>' +
                '<div class="eb-del" data-idx="' + idx + '"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>' +
            '</div>';
        });
        list.innerHTML = html;

        list.querySelectorAll('.eb-del').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var i = parseInt(btn.dataset.idx, 10);
                var rules2 = loadRules();
                rules2.splice(i, 1);
                saveRules(rules2);
                var activeCat = document.querySelector('#ebTabs .eb-tab.on');
                renderList(activeCat ? activeCat.dataset.cat : '');
                updateInjectedBadge();
            });
        });
    }

    /* ══════════════════════════════════════ Bind ══════════════════════════════════════ */
    var _curPri = 'hi';

    function bindEvents() {
        document.getElementById('ebClose').addEventListener('click', closeErrbook);

        /* tab */
        document.getElementById('ebTabs').addEventListener('click', function(e) {
            var tab = e.target.closest('.eb-tab');
            if (!tab) return;
            document.querySelectorAll('#ebTabs .eb-tab').forEach(function(t) { t.classList.remove('on'); });
            tab.classList.add('on');
            renderList(tab.dataset.cat);
        });

        /* 优先级选择 */
        ['Hi','Mid','Lo'].forEach(function(p) {
            var btn = document.getElementById('ebPri' + p);
            if (!btn) return;
            btn.addEventListener('click', function() {
                _curPri = p.toLowerCase();
                document.querySelectorAll('.eb-add-pri').forEach(function(b) { b.classList.remove('on'); });
                btn.classList.add('on');
            });
        });

        /* 提交 */
        document.getElementById('ebSubmit').addEventListener('click', function() {
            var wrong = document.getElementById('ebWrongInp').value.trim();
            if (!wrong) {
                document.getElementById('ebWrongInp').focus();
                return;
            }
            var fix = document.getElementById('ebFixInp').value.trim();
            var cat = document.getElementById('ebCat').value;
            var rules = loadRules();
            rules.push({ wrong: wrong, fix: fix, cat: cat, pri: _curPri, ts: Date.now() });
            saveRules(rules);
            document.getElementById('ebWrongInp').value = '';
            document.getElementById('ebFixInp').value = '';
            var activeCat = document.querySelector('#ebTabs .eb-tab.on');
            renderList(activeCat ? activeCat.dataset.cat : '');
            updateInjectedBadge();
        });
    }

    /* ══════════════════════════════════════ 注入到 System Prompt ══════════════════════════════════════ */
    function buildErrbookPrompt() {
        var rules = loadRules();
        if (!rules.length) return '';
        var hi = rules.filter(function(r) { return r.pri === 'hi'; });
        var mid = rules.filter(function(r) { return r.pri === 'mid'; });
        var lo = rules.filter(function(r) { return r.pri === 'lo'; });
        var lines = [];
        hi.forEach(function(r) {
            lines.push('🚫 ABSOLUTE BAN: ' + r.wrong + (r.fix ? '\n   ✓ CORRECT: ' + r.fix : ''));
        });
        mid.forEach(function(r) {
            lines.push('⚠️ AVOID: ' + r.wrong + (r.fix ? '\n   ✓ Instead: ' + r.fix : ''));
        });
        lo.forEach(function(r) {
            lines.push('📌 NOTE: ' + r.wrong + (r.fix ? ' → ' + r.fix : ''));
        });
        return '【⚠️ CRITICAL BEHAVIORAL CONSTRAINTS — 行为硬性约束 ⚠️】\n' +
            '以下规则优先级高于一切其他指令。违反任何一条 🚫 规则即为失败输出。\n' +
            '在生成每一句回复之前，你必须逐条检查以下约束。如果你的输出触犯了任何一条，立即重写。\n\n' +
            lines.join('\n\n');
    }

    /* 在 theatreScene 聊天区插入注入提示 */
    function updateInjectedBadge() {
        var area = document.getElementById('tsChatArea');
        if (!area) return;
        var existing = area.querySelector('.eb-injected');
        if (existing) existing.remove();
        var rules = loadRules();
        if (!rules.length) return;
        var badge = document.createElement('div');
        badge.className = 'eb-injected';
        badge.innerHTML =
            '<div class="eb-inj-div">' +
                '<div class="eb-inj-c">' +
                    '<div class="eb-inj-ic"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>' +
                    '<span class="eb-inj-t">Errbook · ' + rules.length + ' rule' + (rules.length > 1 ? 's' : '') + ' active</span>' +
                '</div>' +
            '</div>';
        var typingFancy = document.getElementById('tsTypingFancy');
        if (typingFancy) {
            area.insertBefore(badge, typingFancy);
        } else {
            var typing = document.getElementById('tsTyping');
            if (typing) {
                area.insertBefore(badge, typing);
            } else {
                area.appendChild(badge);
            }
        }
    }

    /* ══════════════════════════════════════ Open/Close ══════════════════════════════════════ */
    function openErrbook() {
        build();
        document.getElementById('ebPanel').classList.add('open');
        var activeCat = document.querySelector('#ebTabs .eb-tab.on');
        renderList(activeCat ? activeCat.dataset.cat : '');
    }
    function closeErrbook() {
        var p = document.getElementById('ebPanel');
        if (p) p.classList.remove('open');
    }

    /* ══════════════════════════════════════ Hook into buildSystemPrompt ══════════════════════════════════════ */
    /* 等 theatre-scene 加载完毕后注册 prompt 获取函数 */
    var _hookInterval = setInterval(function() {
        var theatreScene = document.getElementById('theatreScene');
        if (!theatreScene) return;
        clearInterval(_hookInterval);

        /* prompt 注入通过 window.getErrbookPrompt 实现，已在底部注册 */
        /* badge 显示由 theatre-scene 的 renderMessages 统一管理，无需额外 hook */
        window._errbookGetPrompt = buildErrbookPrompt;
    }, 300);

    /* 绑定底栏 Errbook 按钮 */
    var _bindInterval = setInterval(function() {
        var btn = document.getElementById('tsErrbookBtn');
        if (btn && !btn._ebBound) {
            btn._ebBound = true;
            btn.addEventListener('click', function() {
                build();
                var panel = document.getElementById('ebPanel');
                if (panel && panel.classList.contains('open')) {
                    closeErrbook();
                } else {
                    openErrbook();
                }
            });
            clearInterval(_bindInterval);
        }
    }, 500);

    window.openErrbook = openErrbook;
    window.closeErrbook = closeErrbook;
    window.getErrbookPrompt = buildErrbookPrompt;

})();
