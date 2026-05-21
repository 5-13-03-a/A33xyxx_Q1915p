// js/-A-12-theatre-scene.js · Theatre Scene View · 番外剧场对话界面
(function () {
    'use strict';

    var built = false;
    var curTheatre = null;
    var curEnt = null;
    var curMessages = [];
    var heat = 45;
    var baseDimOpacity = 0.45;
    var _tsAbortCtrl = null;
    var _tsInvoking = false;

    /* ══════════════════════════════════════ Storage ══════════════════════════════════════ */
    function loadTheatres() {
        try { return JSON.parse(localStorage.getItem('ca-theatres') || '[]'); } catch(e) { return []; }
    }
    function saveTheatres(theatres) {
        localStorage.setItem('ca-theatres', JSON.stringify(theatres));
    }
    function saveCurrentMessages() {
        if (!curTheatre) return;
        curTheatre.messages = curMessages;
        var theatres = loadTheatres();
        for (var i = 0; i < theatres.length; i++) {
            if (theatres[i].id === curTheatre.id) {
                theatres[i] = curTheatre;
                break;
            }
        }
        saveTheatres(theatres);
    }

    function loadEntFromDB(entId, cb) {
        try {
            var req = indexedDB.open('CoutureOS_ChatDB');
            req.onsuccess = function(e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains('entities')) { cb(null); return; }
                var tx = db.transaction(['entities','avatars'], 'readonly');
                var entReq = tx.objectStore('entities').get(entId);
                entReq.onsuccess = function(ev) {
                    var ent = ev.target.result;
                    if (!ent) { cb(null); return; }
                    var avReq = tx.objectStore('avatars').get(entId);
                    avReq.onsuccess = function(e2) {
                        var av = e2.target.result;
                        if (av && av.data) ent.avatar = av.data;
                        cb(ent);
                    };
                    avReq.onerror = function() { cb(ent); };
                };
                entReq.onerror = function() { cb(null); };
            };
            req.onerror = function() { cb(null); };
        } catch(e) { cb(null); }
    }

    function esc(s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : s); return d.innerHTML; }

    function apiCfg() { try { return JSON.parse(localStorage.getItem('ca-api-config') || '{}'); } catch (e) { return {}; } }
    function activeCfg() { var c = apiCfg(); return c[c.node || 'primary'] || { endpoint: '', key: '', model: '' }; }
    function resolveModel(n) { if (!n) return 'gpt-4o'; return n.trim(); }
    function normEp(r) {
        var e = (r || 'https://api.openai.com/v1').replace(/\/+$/, '');
        if (e.indexOf('/chat/completions') !== -1) return e;
        e = e.replace(/\/models$/, '');
        if (e.match(/\/v\d+$/)) return e + '/chat/completions';
        if (e.match(/\.(com|cn|io|ai|net|org)(\/|$)/) || e.match(/localhost/) || e.match(/:\d{2,5}$/)) return e + '/v1/chat/completions';
        return e + '/chat/completions';
    }

    /* ══════════════════════════════════════ System Prompt ══════════════════════════════════════ */
    function buildSystemPrompt(ent, theatre, heatLevel) {
        var persona = ent.persona || 'You are a mysterious character with depth and complexity.';
        var dispName = ent.nickname || ent.name;
        var premise = theatre.premise || '';

        /* 加载角色记忆（筛选与此剧场相关的） */
        var theatreMemory = '';
        try {
            var tmRaw = localStorage.getItem('ca-memory-' + ent.id);
            if (tmRaw) {
                var tm = JSON.parse(tmRaw);
                var allLines = [];
                if (tm.high && tm.high.length) allLines = allLines.concat(tm.high.map(function(l) { return '[HIGH] ' + l; }));
                if (tm.mid && tm.mid.length) allLines = allLines.concat(tm.mid.map(function(l) { return '[MID] ' + l; }));
                if (tm.low && tm.low.length) allLines = allLines.concat(tm.low.map(function(l) { return '[LOW] ' + l; }));

                /* 筛选：包含 THEATRE 标记的记忆 */
                var theatreLines = allLines.filter(function(l) {
                    return l.indexOf('[THEATRE') !== -1;
                });

                if (theatreLines.length) {
                    theatreMemory = '\n\n【角色记忆 / Character Memory（剧场相关）】\n' +
                        '以下记忆来自番外剧场。标记说明：\n' +
                        '- [THEATRE·番外]：角色认为这是真实发生的番外经历\n' +
                        '- [THEATRE·演戏]：角色知道这是在特殊设定下的演绎，并非真实经历，但记得内容\n' +
                        '- [MAINLINE]：角色视为正式主线经历\n\n' +
                        theatreLines.join('\n');
                }
            }
        } catch(e) {}

        /* 加载世界书（Theatre 独立绑定） */
        var wbBefore = '', wbAfter = '', wbEnd = '';
        try {
            var wbEntries = JSON.parse(localStorage.getItem('wb-entries') || '[]');
            var wbCfg = {};
            try { wbCfg = JSON.parse(localStorage.getItem('theatre-wb-config') || '{}'); } catch(e2) {}
            wbEntries.forEach(function(entry) {
                if (!entry.content) return;
                if (wbCfg[entry.id] === false) return;
                var txt = '[WORLD LORE: ' + (entry.name || '') + ']\n' + entry.content;
                if (entry.position === 'after_char') wbAfter += txt + '\n\n';
                else if (entry.position === 'after_prompt') wbEnd += txt + '\n\n';
                else wbBefore += txt + '\n\n';
            });
        } catch(e) {}

        /* 加载多人角色阵容 */
        var castPrompt = '';
        try {
            var castData = JSON.parse(localStorage.getItem('theatre-cast-' + theatre.id) || '[]');
            if (castData.length > 0) {
                castPrompt = '\n\n【多角色阵容 / Cast】\n本剧场包含以下角色，你需要同时扮演所有角色（除用户角色外）：\n';
                var castLoaded = 0;
                castData.forEach(function(c, idx) {
                    castPrompt += '\n角色 ' + (idx + 1) + '：「' + (c.name || 'Unknown') + '」\n';
                    if (c.persona && c.persona.trim()) {
                        castPrompt += '人设：' + c.persona + '\n';
                    } else if (c.entityId) {
                        /* 优先从实时缓存读取（enterScene 时写入），确保最新 */
                        var entKey = 'ca-entity-persona-' + c.entityId;
                        var cached = '';
                        try { cached = localStorage.getItem(entKey) || ''; } catch(e3) {}
                        if (cached) {
                            castPrompt += '人设：' + cached + '\n';
                        } else {
                            castPrompt += '人设：（未设定，请根据角色名自行推断性格）\n';
                        }
                    } else {
                        castPrompt += '人设：自由发挥，根据名字「' + (c.name || '') + '」和场景自行塑造性格\n';
                    }
                    if (c.color) castPrompt += '标识色：' + c.color + '\n';
                });
                castPrompt += '\n【多人对话格式】\n当多个角色说话时，使用 [DLG:角色名]对话内容[/DLG] 格式区分不同角色的台词。\n' +
                    '例如：\n[DLG:沈默]你不该来的。[/DLG]\n[DLG:陆离]是你先发的消息。[/DLG]\n' +
                    '单人说话时也可以用普通 [DLG]...[/DLG] 格式。\n\n' +
                    '【严格限制】\n' +
                    '- 你只能扮演上述角色阵容中列出的角色，严禁自行创造、引入或提及任何不在阵容中的新角色。\n' +
                    '- 不允许出现"路人""店员""陌生人"等未列出的角色说话或行动。\n' +
                    '- 如果场景需要其他人物存在，只能通过环境描写间接暗示（如"远处有人经过"），绝不能给他们台词或具体行为。\n' +
                    '- [DLG:角色名] 中的角色名必须严格匹配上方阵容中的名字，一字不差。\n';
            }
        } catch(e) {}

        var errbookInject = typeof window.getErrbookPrompt === 'function' ? window.getErrbookPrompt() : '';

        return (errbookInject ? errbookInject + '\n\n' : '') +
            (wbBefore ? wbBefore : '') + '你是一个沉浸式叙事AI，正在进行一场番外剧场（Theatre）的平行叙事。\n\n' +
            '【角色】\n你扮演的角色是「' + dispName + '」。\n' + persona + '\n\n' +
            castPrompt +
            '【剧场前提 / Premise — 必须严格遵守】\n' +
            '⚠️ 以下前提是本剧场的核心设定，你的所有回复必须完全基于此前提展开。\n' +
            '- 不要编造前提中没有提到的背景故事\n' +
            '- 不要改变前提中描述的角色关系、事件经过、人物设定\n' +
            '- 如果前提描述了一个故事线，从故事线的最新时间点开始演绎\n' +
            '- 前提中的每一个细节都是确定的事实，不可修改或忽略\n\n' +
            (premise || '无特殊前提，自由发挥。') + '\n\n' +
            '【分叉点】\n' + (theatre.forkPoint === 'blank' ? '完全独立的空白开局，不依赖任何主线剧情。' : '从主线最新进度分叉，延续已有的关系和记忆。') + '\n\n' +
            '【Heat / 情感张力等级】: ' + heatLevel + '%\n' +
            'Heat 校准你的情感距离与克制程度：\n' +
            '- 0–35%: 冷淡、自持、克制。壁垒完整。语言精简。\n' +
            '- 35–75%: 张力在表面之下积累。墙壁出现裂缝。每个字都有双重分量。\n' +
            '- 75–100%: 克制向内坍塌。存在感变得压倒性。每个动作都带电。\n\n' +
            '【叙事格式（必须遵守）】\n' +
            '用以下标签结构化每次回复：\n' +
            '[ACT] 物理动作、环境描写、感官细节 [/ACT]\n' +
            '[DLG] 角色对话，仅限角色本人的声音 [/DLG]\n' +
            '[TENS] 氛围暗流、内心独白、未说出口的重量 [/TENS]\n\n' +
            '参考节奏：\n' +
            '[ACT]桌上的灯投下长长的影子，他放下杯子——不急不缓，刻意的。[/ACT]\n' +
            '[DLG]"你回来了，"[/DLG][ACT]他说，没有转身。[/ACT][DLG]"我不确定你会。"[/DLG]\n' +
            '[TENS]房间屏住了呼吸。她也是。[/TENS]\n\n' +
            (function() {
                var pov = 'first';
                try { if (theatre) pov = localStorage.getItem('theatre-pov-' + theatre.id) || 'first'; } catch(e) {}
                if (pov === 'first') {
                    return '【人称规则】\n' +
                        '- 用户使用第一人称视角。\n' +
                        '- 你（角色）在对话和动作描写中必须用「你」来指代用户，不要用用户的名字。\n' +
                        '- 例如：「你走近了」「你的手在发抖」「你没有说话」\n\n';
                } else {
                    return '【人称规则】\n' +
                        '- 用户使用第三人称视角。\n' +
                        '- 你（角色）在对话和动作描写中用用户角色的名字来指代用户。\n\n';
                }
            })() +
            '【用户输入说明】\n' +
            '- 用户的消息可能包含动作描写（用 * 或括号包裹），这是用户角色的行为，不是对话。\n' +
            '- 例如：*走近了两步* 或 （沉默地看着你）\n' +
            '- 自然接收这些动作，在你的回复中对其做出反应。\n\n' +
            '【执行规则】\n' +
            '- 完全代入角色。不要打破第四面墙，不要AI免责声明。\n' +
            '- 以文学小说的密度和质感写作。\n' +
            (function() {
                var tkVal = 1200;
                try { tkVal = parseInt(document.getElementById('tsTokenSlider').value || '1200', 10); } catch(e) {}
                if (tkVal >= 3000) {
                    return '- 【字数硬性要求】本次回复不少于800字，目标1000-1500字。\n' +
                        '- 回复5-8段，每段3-5句。充分展开环境描写、动作细节、内心活动。\n' +
                        '- 不要急于结束场景。每个动作都值得一个完整的句子，每个情绪都值得被描写。\n' +
                        '- 如果你觉得写完了但字数不够，继续展开：加入环境细节、角色微表情、空气中的气味、光线变化、内心暗流。\n';
                } else if (tkVal >= 2000) {
                    return '- 【字数硬性要求】本次回复不少于500字，目标600-900字。\n' +
                        '- 回复4-6段，每段2-4句。展开描写，不要过于简短。\n' +
                        '- 不要只写对话。每句对话前后都应有动作或氛围描写。\n' +
                        '- 如果场景节奏允许，加入一个意外的细节或转折来丰富叙事。\n';
                } else if (tkVal >= 1000) {
                    return '- 【字数参考】目标300-500字，回复3-5段。\n' +
                        '- 平衡对话与描写，不要纯对话也不要纯描写。\n';
                } else {
                    return '- 回复2-3段，简洁有力。质量优先于长度。\n';
                }
            })() +
            '- [SCENE] 和 [DIALOGUE] 来自用户的输入描述他们角色的动作和话语。自然接收。\n' +
            '- [BEGIN] 开启场景。用让空气变得不同的方式开场。\n' +
            '- 匹配用户的语言。如果他们用中文写，用中文回复。\n' +
            '- 必须使用标签。不接受无标签的纯文本输出。\n' +
            (wbAfter ? '\n\n' + wbAfter : '') +
            (function() {
                var masks = [];
                try { masks = JSON.parse(localStorage.getItem('ca-user-masks') || '[]'); } catch(e) {}
                var active = masks.find(function(m) { return m.active; });
                if (active && active.name) {
                    return '\n\n【用户身份 / User Identity】\n' +
                        '- 名字/代号: ' + active.name + '\n' +
                        '- 人设/简介: ' + (active.bio || '无') + '\n' +
                        '以此身份与你互动的人就是上述用户。\n';
                }
                return '';
            })() +
            theatreMemory +
            (wbEnd ? '\n\n' + wbEnd : '') +
            (function(){
                try{if(localStorage.getItem('theatre-event-on-'+theatre.id)==='true'){
                    return '\n\n【随机事件系统 / Random Event — 必须遵守】\n'+
                    '你必须在每次回复末尾都触发一个随机事件（触发率100%）。在你的正常叙事回复之后，另起一行输出以下格式的事件标记：\n'+
                    '[EVENT::{"title":"事件标题","desc":"一句话描述当前情境变化","choices":["选项A","选项B","选项C"]}]\n\n'+
                    '【规则 — 违反即为失败输出】\n'+
                    '- 每次回复都必须在末尾附带 [EVENT::...] 标记，没有例外\n'+
                    '- 事件必须与当前场景自然衔接，不能突兀\n'+
                    '- 选项2-4个，每个选项是用户角色可能做出的反应\n'+
                    '- 选项要有差异性：一个大胆、一个保守、一个意外\n'+
                    '- title 简短有力（2-5字）\n'+
                    '- desc 一句话，描述发生了什么\n'+
                    '- [EVENT::...] 必须是回复的最后一行，之后不要再写任何内容\n'+
                    '- 如果用户上一条消息包含 [CHOSEN: ...]，说明用户选择了某个事件选项，你必须在本次回复中自然地融入该选择的后果\n\n'+
                    '【事件类型参考】\n'+
                    '环境变化（下雨、停电、有人来了）、情感转折（沉默、对视、不小心碰到）、意外打断（手机响、有人敲门）、关系试探（暧昧发言、肢体接触）\n\n'+
                    '【关系数值控制】\n'+
                    '你可以在回复末尾（[EVENT::...] 之前）输出以下标记来调整关系数值：\n'+
                    '[REL::{"intimacy":+5,"tension":-3}]\n'+
                    '- intimacy: 亲密度变化（-10 到 +10）\n'+
                    '- tension: 张力变化（-10 到 +10）\n'+
                    '- 只在发生了明显的关系变化时才输出，不要每次都输出\n'+
                    '- 正数=增加，负数=减少\n'+
                    '- 肢体接触、暧昧对话 → intimacy+\n'+
                    '- 冲突、误会、沉默 → tension+\n'+
                    '- 和解、坦诚 → tension-\n'+
                    '- 拒绝、冷淡 → intimacy-\n';
                }}catch(e){}
                return '';
            })();
    }

    /* ══════════════════════════════════════ Parse Narration ══════════════════════════════════════ */
    var _lastEventData = null;

    function parseNarr(text) {
        // 提取事件标记
        _lastEventData = null;
        // 提取关系数值变化
        var relMatch = text.match(/\[REL::\{[^}]*\}\]/);
        if (relMatch) {
            try {
                var relJson = relMatch[0].substring(6, relMatch[0].length - 1);
                var relData = JSON.parse(relJson);
                if (relData.intimacy) heat = Math.max(0, Math.min(100, heat + relData.intimacy));
                if (relData.tension) {
                    var tensionKey = curTheatre ? 'theatre-tension-' + curTheatre.id : '';
                    var curTension = parseInt(localStorage.getItem(tensionKey) || '50', 10);
                    curTension = Math.max(0, Math.min(100, curTension + relData.tension));
                    if (tensionKey) localStorage.setItem(tensionKey, String(curTension));
                }
                var heatSlider = document.getElementById('tsHeatSlider');
                if (heatSlider) { heatSlider.value = heat; updateHeatUI(heat); }
            } catch(e) {}
            text = text.replace(/\[REL::\{[^}]*\}\]/, '').trim();
        }
        var evMatch = text.match(/\[EVENT::\{[\s\S]*?\}\]\s*$/);
        if (evMatch) {
            try {
                var evJson = evMatch[0].substring(8, evMatch[0].length - 1);
                _lastEventData = JSON.parse(evJson);
            } catch(e) { _lastEventData = null; }
            text = text.replace(/\[EVENT::\{[\s\S]*?\}\]\s*$/, '').trim();
        }
        var h = esc(text);
        h = h.replace(/\[ACT\]([\s\S]*?)\[\/ACT\]/gi, function(_, c) {
            return '<span class="act">' + c.replace(/\n+/g, ' ').trim() + '</span>';
        });
        /* 多人对话: [DLG:角色名]...[/DLG] */
        var cast = [];
        try { if (curTheatre) cast = JSON.parse(localStorage.getItem('theatre-cast-' + curTheatre.id) || '[]'); } catch(e) {}
        var defaultColors = ['#2a2830','#48484a','#636366','#8e8e93','#aeaeb2'];
        var speakerIdx = 0;
        var speakersUsed = {};

        h = h.replace(/\[DLG:([^\]]+)\]([\s\S]*?)\[\/DLG\]/gi, function(_, speaker, c) {
            speaker = speaker.trim();
            var castEntry = cast.find(function(ce) { return ce.name === speaker; });
            var color, avatar;
            if (castEntry) {
                color = castEntry.color || defaultColors[speakerIdx % defaultColors.length];
                avatar = castEntry.avatar || '';
            } else if (curEnt && (speaker === curEnt.name || speaker === curEnt.nickname || speaker === (curEnt.nickname || curEnt.name))) {
                /* 主角色不在 cast 列表里，但 AI 用了主角色的名字说话 */
                color = curEnt.color || defaultColors[speakerIdx % defaultColors.length];
                avatar = curEnt.avatar || '';
            } else {
                color = defaultColors[speakerIdx % defaultColors.length];
                avatar = '';
            }
            if (!speakersUsed[speaker]) { speakersUsed[speaker] = { color: color, avatar: avatar }; speakerIdx++; }
            var initial = speaker.charAt(0).toUpperCase();
            var bubbleBg = color.replace(/^#/, '');
            var r = parseInt(bubbleBg.substring(0,2),16), g = parseInt(bubbleBg.substring(2,4),16), b = parseInt(bubbleBg.substring(4,6),16);
            var bgRgba = 'rgba(' + r + ',' + g + ',' + b + ',0.03)';
            var labelBg = 'rgba(' + r + ',' + g + ',' + b + ',0.1)';
            var avHtml = avatar ? '<img src="' + avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">' : initial;
            return '<span class="dlg" data-speaker="' + speaker + '" style="--bubble-bg:' + bgRgba + ';--speaker-color:' + color + ';--speaker-bg:' + labelBg + ';"><span class="dlg-av" style="background:' + color + ';">' + avHtml + '</span>' + c.replace(/\n+/g, ' ').trim() + '</span>';
        });
        /* 普通单人 DLG */
        h = h.replace(/\[DLG\]([\s\S]*?)\[\/DLG\]/gi, function(_, c) {
            return '<span class="dlg">' + c.replace(/\n+/g, ' ').trim() + '</span>';
        });
        h = h.replace(/\[TENS\]([\s\S]*?)\[\/TENS\]/gi, function(_, c) {
            return '<span class="tension">' + c.replace(/\n+/g, ' ').trim() + '</span>';
        });
        h = h.replace(/(<\/span>)\s*(<span)/g, '$1$2');
        h = h.replace(/\n+/g, ' ').trim();
        if (h.indexOf('<span') === -1) {
            h = '<span class="act">' + h + '</span>';
        }

        /* 多人头像标签 */
        var charTagHtml = '';
        var speakerNames = Object.keys(speakersUsed);
        if (speakerNames.length > 1) {
            charTagHtml = '<div class="narr-char-tag">';
            speakerNames.forEach(function(name) {
                var info = speakersUsed[name];
                var avInner = info.avatar ? '<img src="' + info.avatar + '">' : name.charAt(0).toUpperCase();
                charTagHtml += '<div class="narr-char-av" style="background:' + info.color + ';">' + avInner + '</div>';
            });
            charTagHtml += '</div>';
        }

        return '<div class="narr-strip"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div><div class="narr-tag">SCENE</div>' + charTagHtml + '<div class="narr"><span class="narr-wm">Story</span>' + h + '</div>';
    }

    /* ══════════════════════════════════════ CSS ══════════════════════════════════════ */
    function buildCSS() {
        return '' +
            '@font-face{font-family:"TheatreDeco";src:url("https://file.icve.com.cn/file_doc/SyNI8mvo/uZqcTvbY.ttf") format("truetype");font-display:swap;}' +

            '#theatreScene{position:fixed;inset:0;z-index:210;background:#f7f5f2;font-family:-apple-system,"SF Pro Display",sans-serif;color:#2a2830;display:none;flex-direction:column;overflow:hidden;}' +
            '#theatreScene.open{display:flex;animation:tsIn 0.4s cubic-bezier(0.16,1,0.3,1);}' +
            '@keyframes tsIn{from{opacity:0;transform:translateX(30px);}to{opacity:1;transform:translateX(0);}}' +
            '#theatreScene *{margin:0;padding:0;box-sizing:border-box;}' +

            /* 背景 */
            '#theatreScene .ts-bg{position:absolute;inset:0;z-index:0;background:#f7f5f2;background-size:cover;background-position:center;}' +
            '#theatreScene .ts-bg-dim{position:absolute;inset:0;z-index:1;background:rgba(255,255,255,0.45);transition:background 0.8s;}' +
            '#theatreScene .ts-bg-grain{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0.03;background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E");}' +

            /* 顶栏 */
            '#theatreScene .ts-topbar{position:fixed;top:calc(env(safe-area-inset-top,20px) + 8px);left:14px;right:14px;z-index:30;background:rgba(255,255,255,0.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:0.8px solid rgba(42,40,48,0.08);border-radius:20px;padding:10px 10px 0;box-shadow:0 4px 24px rgba(42,40,48,0.06),0 1px 3px rgba(42,40,48,0.03);display:flex;flex-direction:column;overflow:hidden;position:fixed;}' +
            '#theatreScene .ts-topbar::before{content:"Parallel Theatre";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:"TheatreDeco",serif;font-size:42px;color:rgba(42,40,48,0.025);white-space:nowrap;pointer-events:none;letter-spacing:4px;line-height:1;}' +
            '#theatreScene .ts-topbar::after{content:"World";position:absolute;bottom:-8px;right:-6px;font-family:"TheatreDeco",serif;font-size:56px;color:#000;white-space:nowrap;pointer-events:none;letter-spacing:2px;line-height:1;}' +
            '#theatreScene .ts-tb-row{display:flex;align-items:center;justify-content:space-between;padding:0 2px 8px;}' +
            '#theatreScene .ts-tb-btn{width:30px;height:30px;border-radius:50%;background:#2a2830;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.2s;}' +
            '#theatreScene .ts-tb-btn:active{transform:scale(0.88);}' +
            '#theatreScene .ts-tb-btn svg{width:13px;height:13px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;}' +
            '#theatreScene .ts-tb-center{display:flex;align-items:center;gap:8px;}' +
            '#theatreScene .ts-tb-mode{font-size:7px;font-weight:800;letter-spacing:2.5px;color:rgba(42,40,48,0.35);text-transform:uppercase;}' +
            '#theatreScene .ts-tb-dot{width:3px;height:3px;border-radius:50%;background:rgba(42,40,48,0.2);}' +
            '#theatreScene .ts-tb-title{font-family:"TheatreDeco",serif;font-size:12px;color:#2a2830;letter-spacing:1.5px;}' +

            /* 信息条 */
            '#theatreScene .ts-info{margin:0;background:rgba(42,40,48,0.025);border-top:1px solid rgba(42,40,48,0.05);border-radius:0 0 16px 16px;padding:9px 10px 10px;display:flex;align-items:center;gap:10px;}' +
            '#theatreScene .ts-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2a2830,#48484a);border:1.5px solid rgba(42,40,48,0.2);display:flex;align-items:center;justify-content:center;font-family:"TheatreDeco",serif;font-size:14px;color:#fff;flex-shrink:0;overflow:hidden;}' +
            '#theatreScene .ts-avatar img{width:100%;height:100%;object-fit:cover;}' +
            '#theatreScene .ts-info-text{flex:1;min-width:0;}' +
            '#theatreScene .ts-info-name{font-size:11px;font-weight:700;color:#2a2830;margin-bottom:2px;display:flex;align-items:center;gap:6px;}' +
            '#theatreScene .ts-info-badge{font-size:6px;font-weight:800;letter-spacing:1.5px;background:rgba(42,40,48,0.06);color:rgba(42,40,48,0.45);padding:1px 5px;border-radius:3px;text-transform:uppercase;}' +
            '#theatreScene .ts-info-premise{font-size:9px;color:rgba(42,40,48,0.45);font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:Georgia,serif;}' +
            '#theatreScene .ts-heat{flex-shrink:0;}' +
            '#theatreScene .ts-heat-label{font-size:7px;font-weight:800;letter-spacing:1.5px;color:rgba(42,40,48,0.35);text-transform:uppercase;}' +
            '#theatreScene .ts-heat-bar{width:50px;height:3px;background:rgba(42,40,48,0.08);border-radius:2px;overflow:hidden;}' +
            '#theatreScene .ts-heat-fill{height:100%;width:45%;background:linear-gradient(to right,rgba(42,40,48,0.3),rgba(42,40,48,0.7));border-radius:2px;transition:width 0.6s;}' +

            /* 对话区 */
            '#theatreScene .ts-chat{position:relative;z-index:10;flex:1;overflow-y:auto;padding:10px 16px 140px;margin-top:110px;scrollbar-width:none;-webkit-overflow-scrolling:touch;}' +
            '#theatreScene .ts-chat::-webkit-scrollbar{display:none;}' +

            /* AI 消息 */
            '#theatreScene .msg-ai{margin-bottom:20px;position:relative;padding-left:22px;}' +

            /* 左侧纵向黑色长条 */
            '#theatreScene .narr-strip{position:absolute;top:10px;bottom:18px;left:0;width:18px;background:#1a1a1f;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.2);z-index:3;overflow:hidden;}' +
            '#theatreScene .narr-strip::before{content:"";position:absolute;top:6px;left:50%;transform:translateX(-50%);width:8px;height:8px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.2);}' +
            '#theatreScene .narr-strip::after{content:"";position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.25);}' +
            '#theatreScene .narr-strip svg{width:11px;height:11px;stroke:rgba(255,255,255,0.7);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}' +

            /* 左上角黑色小标签 */
            '#theatreScene .narr-tag{position:absolute;top:14px;left:18px;background:#1a1a1f;color:rgba(255,255,255,0.75);font-family:"TheatreDeco",serif;font-size:8px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;padding:4px 10px 4px 8px;border-radius:0 6px 6px 0;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:4;line-height:1;cursor:pointer;transition:transform 0.3s cubic-bezier(0.16,1,0.3,1),opacity 0.3s;-webkit-tap-highlight-color:transparent;}' +
            '#theatreScene .narr-tag.peeked{transform:translateX(-100%);opacity:0.3;}' +

            '#theatreScene .narr{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:0.8px solid rgba(42,40,48,0.15);border-left:none;border-radius:0 12px 12px 0;padding:16px 18px 28px;box-shadow:0 2px 12px rgba(42,40,48,0.04);position:relative;overflow:hidden;}' +
            '#theatreScene .narr::before{content:"Narrative";position:absolute;top:8px;right:12px;font-family:"TheatreDeco",serif;font-size:38px;color:rgba(42,40,48,0.025);white-space:nowrap;pointer-events:none;letter-spacing:2px;line-height:1;}' +
            '#theatreScene .narr::after{content:"";position:absolute;bottom:0;left:0;right:0;height:14px;background:repeating-linear-gradient(90deg,transparent 0px,transparent 6px,rgba(42,40,48,0.04) 6px,rgba(42,40,48,0.04) 7px),linear-gradient(to bottom,rgba(42,40,48,0.02),transparent);border-top:1px dashed rgba(42,40,48,0.1);}' +

            /* 右下角纯黑破框字 */
            '#theatreScene .narr-wm{position:absolute;bottom:-6px;right:-4px;font-family:"TheatreDeco",serif;font-size:44px;color:#000;white-space:nowrap;pointer-events:none;letter-spacing:2px;line-height:1;}' +

            '#theatreScene .narr .act{display:block;color:rgba(42,40,48,0.45);font-style:italic;font-size:11px;line-height:2.0;font-family:"Noto Serif SC",Georgia,serif;margin-bottom:12px;padding-left:10px;border-left:1.5px solid rgba(42,40,48,0.08);}' +
            '#theatreScene .narr .act:last-child{margin-bottom:0;}' +
            '#theatreScene .narr .dlg{display:block;color:#1a1a1f;font-weight:500;font-family:"Noto Serif SC",Georgia,serif;font-size:12px;letter-spacing:0.4px;line-height:1.7;margin-bottom:12px;padding:7px 10px 7px 14px;background:rgba(42,40,48,0.03);border-radius:7px;border:0.5px solid rgba(26,26,31,0.1);border-left:2.5px solid #2a2830;position:relative;margin-left:10px;}' +
            '#theatreScene .narr .dlg::before{content:"";position:absolute;top:50%;left:-10px;transform:translateY(-50%);width:4px;height:4px;border-radius:50%;background:#1a1a1f;box-shadow:0 0 0 1.5px #fff,0 1px 3px rgba(0,0,0,0.15);font-size:0;line-height:0;z-index:5;}' +
            '#theatreScene .narr .dlg:not([data-speaker])::after{content:"\\201C";position:absolute;top:-2px;left:5px;font-family:Georgia,serif;font-size:18px;color:rgba(42,40,48,0.1);line-height:1;}' +
            '#theatreScene .narr .dlg:last-child{margin-bottom:0;}' +
            '#theatreScene .narr .tension{display:block;color:rgba(42,40,48,0.5);font-style:italic;font-size:10.5px;line-height:1.9;font-family:"Cormorant Garamond",Georgia,serif;letter-spacing:0.3px;border-bottom:1px dashed rgba(42,40,48,0.1);padding-bottom:8px;margin-bottom:12px;}' +
            '#theatreScene .narr .tension:last-child{border-bottom:none;padding-bottom:0;margin-bottom:0;}' +

            /* 多人对话 */
            '#theatreScene .narr .dlg[data-speaker]{display:inline-block;padding:8px 12px 8px 14px;border-radius:10px;margin-left:28px;margin-top:16px;border-left:none;border:0.5px solid rgba(26,26,31,0.04);background:var(--bubble-bg,rgba(42,40,48,0.015));max-width:88%;}' +
            '#theatreScene .narr .dlg[data-speaker]::before{content:"";position:absolute;top:14px;left:-10px;width:4px;height:4px;border-radius:50%;background:#1a1a1f;box-shadow:0 0 0 1.5px #fff,0 1px 3px rgba(0,0,0,0.15);font-size:0;font-family:inherit;border:none;z-index:5;}' +
            '#theatreScene .narr .dlg[data-speaker]::after{content:attr(data-speaker);position:absolute;top:-14px;left:0;font-size:8px;font-weight:700;letter-spacing:1px;font-style:normal;font-family:-apple-system,sans-serif;padding:2px 7px;border-radius:4px;white-space:nowrap;color:#fff;background:#1a1a1f;box-shadow:0 1px 4px rgba(0,0,0,0.1);}' +
            '#theatreScene .narr .dlg[data-speaker] .dlg-av{position:absolute;top:8px;left:-26px;width:18px;height:18px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.12);}' +
            '#theatreScene .narr-char-tag{position:absolute;top:8px;right:10px;z-index:5;display:flex;align-items:center;gap:3px;opacity:0.15;transition:opacity 0.4s cubic-bezier(0.16,1,0.3,1);cursor:pointer;-webkit-tap-highlight-color:transparent;}' +
            '#theatreScene .narr-char-tag.lit{opacity:1;}' +
            '#theatreScene .narr-char-av{width:18px;height:18px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;border:1px solid rgba(255,255,255,0.6);box-shadow:0 1px 4px rgba(0,0,0,0.1);margin-left:-5px;overflow:hidden;}' +
            '#theatreScene .narr-char-av:first-child{margin-left:0;}' +
            '#theatreScene .narr-char-av img{width:100%;height:100%;object-fit:cover;}' +

            /* 角色管理样式 */
            '#theatreScene .ts-cast-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(42,40,48,0.06);}' +
            '#theatreScene .ts-cast-row:last-child{border-bottom:none;}' +
            '#theatreScene .ts-cast-av{width:24px;height:24px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}' +
            '#theatreScene .ts-cast-name{font-size:11px;font-weight:600;color:#2a2830;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
            '#theatreScene .ts-cast-color{width:20px;height:20px;border-radius:50%;border:1.5px solid rgba(42,40,48,0.15);cursor:pointer;flex-shrink:0;position:relative;overflow:hidden;}' +
            '#theatreScene .ts-cast-color input{position:absolute;inset:-4px;width:28px;height:28px;opacity:0;cursor:pointer;}' +
            '#theatreScene .ts-cast-del{width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0.3;transition:opacity 0.2s;flex-shrink:0;}' +
            '#theatreScene .ts-cast-del:active{opacity:1;}' +
            '#theatreScene .ts-cast-del svg{width:12px;height:12px;stroke:rgba(166,52,38,0.7);fill:none;stroke-width:2;}' +
            '#theatreScene .ts-cast-add{display:flex;align-items:center;gap:8px;padding:10px 0;cursor:pointer;opacity:0.5;transition:opacity 0.2s;}' +
            '#theatreScene .ts-cast-add:active{opacity:1;}' +
            '#theatreScene .ts-cast-add svg{width:14px;height:14px;stroke:rgba(42,40,48,0.5);fill:none;stroke-width:2;}' +
            '#theatreScene .ts-cast-add span{font-size:10px;font-weight:600;color:rgba(42,40,48,0.5);}' +

            /* 用户消息 */
            '#theatreScene .msg-user{margin-bottom:14px;display:flex;flex-direction:column;align-items:flex-end;}' +
            '#theatreScene .user-text{font-family:"Noto Serif SC",Georgia,serif;font-size:11px;color:rgba(255,255,255,0.85);font-style:italic;text-align:right;max-width:85%;background:#1a1a1f;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1.5px solid rgba(255,255,255,0.12);border-radius:14px 4px 4px 14px;padding:9px 12px 9px 14px;line-height:1.9;letter-spacing:0.3px;position:relative;box-shadow:0 4px 16px rgba(0,0,0,0.15);overflow:hidden;}' +
            '#theatreScene .user-text::before{content:"Voice";position:absolute;bottom:4px;left:12px;font-family:"TheatreDeco",serif;font-size:28px;color:rgba(255,255,255,0.06);white-space:nowrap;pointer-events:none;letter-spacing:2px;line-height:1;}' +
            '#theatreScene .user-text .ts-user-wm{position:absolute;bottom:-6px;right:-8px;font-family:"TheatreDeco",serif;font-size:11px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.5);background:rgba(26,26,31,0.85);border:0.8px solid rgba(255,255,255,0.15);padding:2px 8px 3px;border-radius:4px 4px 10px 4px;white-space:nowrap;pointer-events:none;line-height:1;z-index:2;}' +
            '#theatreScene .user-text::after{content:"";position:absolute;right:0;top:8px;bottom:8px;width:2.5px;background:rgba(255,255,255,0.4);border-radius:2px;}' +

            /* 导演卡 */
            '#theatreScene .msg-director{margin-bottom:18px;margin-top:18px;display:flex;justify-content:center;}' +

            /* Director Style 1: Classic Center */
            '#theatreScene .director-card.ds1{width:100%;background:rgba(255,255,255,0.55);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:0.8px solid rgba(42,40,48,0.12);border-top:3px solid rgba(42,40,48,0.6);border-radius:12px;padding:16px;text-align:center;box-shadow:0 2px 12px rgba(42,40,48,0.04);position:relative;overflow:hidden;}' +
            '#theatreScene .director-card.ds1::before{content:"Director";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:"TheatreDeco",serif;font-size:52px;color:rgba(42,40,48,0.025);white-space:nowrap;pointer-events:none;letter-spacing:4px;line-height:1;}' +
            '#theatreScene .director-card.ds1::after{content:"Scene";position:absolute;bottom:-7px;left:-5px;font-family:"TheatreDeco",serif;font-size:40px;color:rgba(42,40,48,0.04);white-space:nowrap;pointer-events:none;letter-spacing:2px;line-height:1;}' +
            '#theatreScene .ds1 .dir-header{font-size:8px;font-weight:800;letter-spacing:3px;color:rgba(42,40,48,0.35);margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px;}' +
            '#theatreScene .ds1 .dir-header::before,#theatreScene .ds1 .dir-header::after{content:"";width:16px;height:1px;background:rgba(42,40,48,0.1);}' +
            '#theatreScene .ds1 .dir-label{font-size:9px;letter-spacing:1.5px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:4px;}' +
            '#theatreScene .ds1 .dir-scene-text{font-family:"Cormorant Garamond",Georgia,serif;font-size:13px;color:rgba(42,40,48,0.55);font-style:italic;line-height:1.7;margin-bottom:10px;}' +
            '#theatreScene .ds1 .dir-dlg-text{font-family:"Noto Serif SC",Georgia,serif;font-size:14px;color:#2a2830;line-height:1.7;}' +

            /* Director Style 2: Clapperboard */
            '#theatreScene .director-card.ds2{width:100%;background:#1a1a1f;border-radius:14px;padding:0;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.15);}' +
            '#theatreScene .ds2 .dir-clap{background:repeating-linear-gradient(135deg,#2a2830 0px,#2a2830 8px,#1a1a1f 8px,#1a1a1f 16px);height:22px;display:flex;align-items:center;padding:0 12px;}' +
            '#theatreScene .ds2 .dir-clap-label{font-family:"TheatreDeco",serif;font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:2px;}' +
            '#theatreScene .ds2 .dir-body{padding:14px 16px 16px;}' +
            '#theatreScene .ds2 .dir-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;}' +
            '#theatreScene .ds2 .dir-row:last-child{margin-bottom:0;}' +
            '#theatreScene .ds2 .dir-tag{font-size:7px;font-weight:800;letter-spacing:1.5px;color:rgba(255,255,255,0.35);text-transform:uppercase;padding:3px 8px;border:1px solid rgba(255,255,255,0.1);border-radius:4px;flex-shrink:0;margin-top:2px;}' +
            '#theatreScene .ds2 .dir-scene-text{font-family:"Noto Serif SC",Georgia,serif;font-size:12px;color:rgba(255,255,255,0.75);line-height:1.7;font-style:italic;}' +
            '#theatreScene .ds2 .dir-dlg-text{font-family:"Noto Serif SC",Georgia,serif;font-size:13px;color:#fff;line-height:1.7;font-weight:500;}' +

            /* Director Style 3: Sticky Note */
            '#theatreScene .director-card.ds3{width:100%;background:#fffef5;border:none;border-radius:4px;padding:18px 20px 20px;box-shadow:2px 3px 12px rgba(42,40,48,0.08),0 1px 3px rgba(42,40,48,0.04);position:relative;transform:rotate(-0.5deg);}' +
            '#theatreScene .ds3::before{content:"";position:absolute;top:0;left:20px;right:20px;height:3px;background:rgba(166,52,38,0.4);border-radius:0 0 2px 2px;}' +
            '#theatreScene .ds3 .dir-pin{position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 40% 40%,#e8e0d0,#b8a890);box-shadow:0 2px 4px rgba(0,0,0,0.15);border:1px solid rgba(42,40,48,0.1);}' +
            '#theatreScene .ds3 .dir-note-label{font-family:"Cormorant Garamond",Georgia,serif;font-size:10px;font-style:italic;color:rgba(42,40,48,0.35);letter-spacing:1px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px dashed rgba(42,40,48,0.12);}' +
            '#theatreScene .ds3 .dir-scene-text{font-family:"Noto Serif SC",Georgia,serif;font-size:12px;color:rgba(42,40,48,0.5);font-style:italic;line-height:1.8;margin-bottom:8px;padding-left:8px;border-left:2px solid rgba(166,52,38,0.2);}' +
            '#theatreScene .ds3 .dir-dlg-text{font-family:"Noto Serif SC",Georgia,serif;font-size:13px;color:#2a2830;line-height:1.7;font-weight:500;background:rgba(42,40,48,0.03);padding:8px 10px;border-radius:6px;}' +

            /* Director Style 4: Screenplay */
            '#theatreScene .director-card.ds4{width:100%;background:rgba(255,255,255,0.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:none;border-left:4px solid #2a2830;border-radius:0 10px 10px 0;padding:14px 16px 14px 18px;position:relative;}' +
            '#theatreScene .ds4 .dir-sp-badge{position:absolute;top:-8px;left:14px;font-family:"TheatreDeco",serif;font-size:7px;font-weight:700;letter-spacing:2px;color:#fff;background:#2a2830;padding:3px 10px;border-radius:4px;text-transform:uppercase;}' +
            '#theatreScene .ds4 .dir-sp-loc{font-family:"Courier New",monospace;font-size:9px;font-weight:700;color:rgba(42,40,48,0.4);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;margin-top:6px;}' +
            '#theatreScene .ds4 .dir-scene-text{font-family:"Courier New",monospace;font-size:11px;color:rgba(42,40,48,0.55);line-height:1.8;margin-bottom:10px;padding-left:20px;}' +
            '#theatreScene .ds4 .dir-sp-char{font-family:"Courier New",monospace;font-size:9px;font-weight:700;color:#2a2830;letter-spacing:2px;text-transform:uppercase;text-align:center;margin-bottom:2px;}' +
            '#theatreScene .ds4 .dir-dlg-text{font-family:"Courier New",monospace;font-size:12px;color:#2a2830;line-height:1.7;text-align:center;padding:0 30px;}' +

            /* Director Style 5: Minimal Divider */
            '#theatreScene .director-card.ds5{width:100%;padding:12px 0;background:transparent;border:none;box-shadow:none;}' +
            '#theatreScene .ds5 .dir-divider{display:flex;align-items:center;gap:12px;margin-bottom:12px;}' +
            '#theatreScene .ds5 .dir-divider::before,#theatreScene .ds5 .dir-divider::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(42,40,48,0.15),transparent);}' +
            '#theatreScene .ds5 .dir-div-icon{width:24px;height:24px;border-radius:50%;background:#2a2830;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
            '#theatreScene .ds5 .dir-div-icon svg{width:11px;height:11px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;}' +
            '#theatreScene .ds5 .dir-min-content{background:rgba(42,40,48,0.02);border-radius:10px;padding:12px 14px;}' +
            '#theatreScene .ds5 .dir-scene-text{font-family:"Noto Serif SC",Georgia,serif;font-size:11px;color:rgba(42,40,48,0.45);font-style:italic;line-height:1.8;margin-bottom:8px;}' +
            '#theatreScene .ds5 .dir-dlg-text{font-family:"Noto Serif SC",Georgia,serif;font-size:12px;color:#2a2830;line-height:1.7;font-weight:500;padding-left:10px;border-left:2px solid rgba(42,40,48,0.15);}' +

            /* 打字指示 */
            '#theatreScene .ts-typing{display:none;padding:8px 0;gap:4px;align-items:center;}' +
            '#theatreScene .ts-typing.show{display:flex;}' +
            '#theatreScene .ts-typing-dot{width:4px;height:4px;background:rgba(42,40,48,0.3);border-radius:50%;animation:tsDotBounce 1.4s infinite ease-in-out both;}' +
            '#theatreScene .ts-typing-dot:nth-child(1){animation-delay:-0.32s;}' +
            '#theatreScene .ts-typing-dot:nth-child(2){animation-delay:-0.16s;}' +
            '@keyframes tsDotBounce{0%,80%,100%{transform:scale(0);}40%{transform:scale(1);background:#2a2830;}}' +

            /* ═══ Typing Indicator Styles ═══ */
            '#theatreScene .ts-typing-fancy{display:none;padding:10px 0;align-items:center;gap:10px;animation:tsMsgIn 0.3s ease-out;margin-bottom:0;transition:margin-bottom 0.3s;}' +
            '#theatreScene .ts-typing-fancy.show{display:flex;}' +
            '#theatreScene .ts-typing-fancy.detail-open{margin-bottom:220px;}' +

            /* Style 1: Minimal Pulse */
            '#theatreScene .ts-typing-fancy.s1{padding:10px 16px;background:rgba(42,40,48,0.03);border-radius:30px;border:0.8px solid rgba(42,40,48,0.06);}' +
            '#theatreScene .ts-typing-fancy.s1 .tf-dots{display:flex;gap:4px;align-items:center;}' +
            '#theatreScene .ts-typing-fancy.s1 .tf-dot{width:5px;height:5px;background:#2a2830;border-radius:50%;animation:tfPulse 1.4s infinite ease-in-out both;}' +
            '#theatreScene .ts-typing-fancy.s1 .tf-dot:nth-child(1){animation-delay:-0.32s;}' +
            '#theatreScene .ts-typing-fancy.s1 .tf-dot:nth-child(2){animation-delay:-0.16s;}' +
            '@keyframes tfPulse{0%,80%,100%{transform:scale(0.4);opacity:0.3;}40%{transform:scale(1);opacity:1;}}' +
            '#theatreScene .ts-typing-fancy.s1 .tf-meta{margin-left:auto;display:flex;align-items:center;gap:8px;}' +
            '#theatreScene .ts-typing-fancy.s1 .tf-timer{font-size:10px;font-weight:700;color:rgba(42,40,48,0.4);font-variant-numeric:tabular-nums;}' +
            '#theatreScene .ts-typing-fancy.s1 .tf-token{font-size:7px;font-weight:800;letter-spacing:1px;color:rgba(42,40,48,0.3);background:rgba(42,40,48,0.05);padding:2px 6px;border-radius:4px;}' +

            /* Style 2: Cinematic Strip */
            '#theatreScene .ts-typing-fancy.s2{padding:12px 16px;background:#1a1a1f;border-radius:12px;position:relative;overflow:hidden;}' +
            '#theatreScene .ts-typing-fancy.s2::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);animation:tfScan 2s linear infinite;}' +
            '@keyframes tfScan{0%{transform:translateX(-100%);}100%{transform:translateX(100%);}}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-wave{display:flex;gap:2px;align-items:flex-end;height:16px;}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-bar{width:2.5px;background:rgba(255,255,255,0.6);border-radius:2px;animation:tfWave 1.2s ease-in-out infinite;}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-bar:nth-child(1){height:6px;animation-delay:0s;}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-bar:nth-child(2){height:10px;animation-delay:0.1s;}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-bar:nth-child(3){height:14px;animation-delay:0.2s;}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-bar:nth-child(4){height:8px;animation-delay:0.3s;}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-bar:nth-child(5){height:12px;animation-delay:0.4s;}' +
            '@keyframes tfWave{0%,100%{transform:scaleY(0.4);}50%{transform:scaleY(1);}}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-label{font-family:"TheatreDeco",serif;font-size:9px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-left:10px;}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-meta{margin-left:auto;display:flex;align-items:center;gap:8px;}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-timer{font-size:11px;font-weight:600;color:rgba(255,255,255,0.7);font-variant-numeric:tabular-nums;}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-ring{width:22px;height:22px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;position:relative;}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-ring::before{content:"";position:absolute;inset:-1.5px;border-radius:50%;border:1.5px solid transparent;border-top-color:rgba(255,255,255,0.6);animation:tfSpin 1.5s linear infinite;}' +
            '@keyframes tfSpin{to{transform:rotate(360deg);}}' +
            '#theatreScene .ts-typing-fancy.s2 .tf-ring span{font-size:6px;font-weight:800;color:rgba(255,255,255,0.5);}' +

            /* Style 3: Typewriter */
            '#theatreScene .ts-typing-fancy.s3{padding:10px 14px;background:rgba(255,255,255,0.9);border:0.8px solid rgba(42,40,48,0.12);border-left:3px solid #2a2830;border-radius:2px 10px 10px 2px;}' +
            '#theatreScene .ts-typing-fancy.s3 .tf-cursor{font-family:"Courier New",monospace;font-size:13px;font-weight:700;color:#2a2830;animation:tfBlink 0.8s step-end infinite;}' +
            '@keyframes tfBlink{0%,100%{opacity:1;}50%{opacity:0;}}' +
            '#theatreScene .ts-typing-fancy.s3 .tf-text{font-family:"Noto Serif SC",Georgia,serif;font-size:10px;font-style:italic;color:rgba(42,40,48,0.4);margin-left:6px;animation:tfFade 2s ease-in-out infinite;}' +
            '@keyframes tfFade{0%,100%{opacity:0.4;}50%{opacity:0.8;}}' +
            '#theatreScene .ts-typing-fancy.s3 .tf-meta{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:2px;}' +
            '#theatreScene .ts-typing-fancy.s3 .tf-timer{font-size:11px;font-weight:700;color:#2a2830;font-variant-numeric:tabular-nums;}' +
            '#theatreScene .ts-typing-fancy.s3 .tf-token{font-size:7px;font-weight:800;letter-spacing:1.5px;color:rgba(42,40,48,0.3);text-transform:uppercase;}' +

            /* Style 4: Floating Orb */
            '#theatreScene .ts-typing-fancy.s4{padding:14px 18px;background:linear-gradient(135deg,rgba(42,40,48,0.03),rgba(42,40,48,0.06));border-radius:50px;border:0.8px solid rgba(42,40,48,0.08);}' +
            '#theatreScene .ts-typing-fancy.s4 .tf-orb{width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#48484a,#1a1a1f);box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:tfFloat 2s ease-in-out infinite;flex-shrink:0;position:relative;}' +
            '#theatreScene .ts-typing-fancy.s4 .tf-orb::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid rgba(42,40,48,0.1);animation:tfOrbRing 2s ease-in-out infinite;}' +
            '@keyframes tfFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-3px);}}' +
            '@keyframes tfOrbRing{0%,100%{transform:scale(1);opacity:0.5;}50%{transform:scale(1.15);opacity:0;}}' +
            '#theatreScene .ts-typing-fancy.s4 .tf-center{flex:1;display:flex;flex-direction:column;gap:4px;margin-left:12px;}' +
            '#theatreScene .ts-typing-fancy.s4 .tf-status{font-size:10px;font-weight:700;color:rgba(42,40,48,0.6);}' +
            '#theatreScene .ts-typing-fancy.s4 .tf-progress{width:100%;height:3px;background:rgba(42,40,48,0.06);border-radius:2px;overflow:hidden;}' +
            '#theatreScene .ts-typing-fancy.s4 .tf-progress-fill{height:100%;width:0%;background:linear-gradient(90deg,#2a2830,#636366);border-radius:2px;animation:tfProg 8s linear infinite;}' +
            '@keyframes tfProg{0%{width:0%;}100%{width:100%;}}' +
            '#theatreScene .ts-typing-fancy.s4 .tf-meta{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;margin-left:12px;}' +
            '#theatreScene .ts-typing-fancy.s4 .tf-timer{font-size:13px;font-weight:800;color:#2a2830;font-variant-numeric:tabular-nums;}' +
            '#theatreScene .ts-typing-fancy.s4 .tf-token{font-size:7px;font-weight:800;letter-spacing:1px;color:rgba(42,40,48,0.4);background:rgba(42,40,48,0.06);padding:2px 8px;border-radius:10px;}' +

            /* Style 5: Ink Drop */
            '#theatreScene .ts-typing-fancy.s5{padding:12px 16px;background:rgba(255,255,255,0.6);border-radius:14px;border:0.8px solid rgba(42,40,48,0.08);position:relative;overflow:hidden;}' +
            '#theatreScene .ts-typing-fancy.s5::after{content:"Composing";position:absolute;bottom:-4px;right:8px;font-family:"TheatreDeco",serif;font-size:32px;color:rgba(42,40,48,0.025);letter-spacing:2px;line-height:1;pointer-events:none;}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-inks{display:flex;gap:6px;align-items:center;}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-ink{width:8px;height:8px;border-radius:50%;background:#2a2830;animation:tfInk 1.8s ease-in-out infinite;}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-ink:nth-child(1){animation-delay:0s;}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-ink:nth-child(2){animation-delay:0.3s;}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-ink:nth-child(3){animation-delay:0.6s;}' +
            '@keyframes tfInk{0%,100%{transform:scale(0.4);opacity:0.2;}30%{transform:scale(1.1);opacity:1;}60%{transform:scale(0.7);opacity:0.5;}}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-sep{width:1px;height:20px;background:rgba(42,40,48,0.1);border-radius:1px;margin:0 6px;}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-detail{flex:1;display:flex;align-items:center;justify-content:space-between;}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-timer-wrap{display:flex;align-items:baseline;gap:3px;}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-timer{font-size:14px;font-weight:800;color:#2a2830;font-variant-numeric:tabular-nums;}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-unit{font-size:8px;font-weight:700;color:rgba(42,40,48,0.3);}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-token-block{display:flex;flex-direction:column;align-items:flex-end;}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-token-num{font-size:11px;font-weight:800;color:rgba(42,40,48,0.6);font-variant-numeric:tabular-nums;}' +
            '#theatreScene .ts-typing-fancy.s5 .tf-token-label{font-size:6px;font-weight:800;letter-spacing:1.5px;color:rgba(42,40,48,0.25);text-transform:uppercase;}' +

            /* Typing Done State */
            '#theatreScene .ts-typing-fancy.done{transition:all 0.4s cubic-bezier(0.16,1,0.3,1);}' +
            '#theatreScene .ts-typing-fancy.s1.done{background:rgba(42,40,48,0.02);border-color:rgba(42,40,48,0.03);}' +
            '#theatreScene .ts-typing-fancy.s1.done .tf-timer{color:rgba(42,40,48,0.6);}' +
            '#theatreScene .ts-typing-fancy.s1.done .tf-token{background:rgba(42,40,48,0.08);color:rgba(42,40,48,0.5);}' +
            '#theatreScene .ts-typing-fancy.s2.done{background:#2a2830;}' +
            '#theatreScene .ts-typing-fancy.s2.done .tf-label{color:rgba(255,255,255,0.8);}' +
            '#theatreScene .ts-typing-fancy.s3.done{border-left-color:rgba(42,40,48,0.3);}' +
            '#theatreScene .ts-typing-fancy.s3.done .tf-timer{color:rgba(42,40,48,0.6);}' +
            '#theatreScene .ts-typing-fancy.s4.done .tf-status{color:rgba(42,40,48,0.8);}' +
            '#theatreScene .ts-typing-fancy.s5.done .tf-timer{color:rgba(42,40,48,0.6);}' +
            '@keyframes tfDoneFade{0%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(-8px);}}' +
            '#theatreScene .ts-typing-fancy.fading{animation:tfDoneFade 0.4s ease-in forwards;}' +

            /* Typing Detail Panel — All Styles */
            '#theatreScene .tf-dp{opacity:0;pointer-events:none;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);}' +
            '#theatreScene .tf-dp.open{opacity:1;pointer-events:auto;}' +
            '#theatreScene .tf-dp .d-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(42,40,48,0.04);}' +
            '#theatreScene .tf-dp .d-row:last-child{border-bottom:none;}' +
            '#theatreScene .tf-dp .d-key{font-size:9px;font-weight:700;color:rgba(42,40,48,0.4);letter-spacing:0.5px;}' +
            '#theatreScene .tf-dp .d-val{font-size:10px;font-weight:700;color:#2a2830;font-variant-numeric:tabular-nums;}' +
            /* Style A: Drop Card */
            '#theatreScene .tf-dp.dp-a{position:absolute;left:0;right:0;top:calc(100% + 6px);transform:translateY(-8px) scale(0.97);transition:all 0.4s cubic-bezier(0.16,1,0.3,1);z-index:10;}' +
            '#theatreScene .tf-dp.dp-a.open{transform:translateY(0) scale(1);opacity:1;}' +
            '#theatreScene .tf-dp.dp-a .dp-inner{background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:0.8px solid rgba(42,40,48,0.1);border-radius:14px;padding:14px 16px;box-shadow:0 6px 24px rgba(42,40,48,0.06);}' +
            /* Style B: Side Drawer */
            '#theatreScene .tf-dp.dp-b{position:absolute;top:0;right:0;bottom:0;width:200px;background:#1a1a1f;border-radius:0 14px 14px 0;padding:8px 12px;display:flex;flex-direction:column;justify-content:center;gap:2px;transform:translateX(calc(100% + 2px));opacity:1;pointer-events:none;transition:transform 0.4s cubic-bezier(0.16,1,0.3,1);overflow-y:auto;scrollbar-width:none;}' +
            '#theatreScene .tf-dp.dp-b::-webkit-scrollbar{display:none;}' +
            '#theatreScene .tf-dp.dp-b.open{transform:translateX(0);pointer-events:auto;}' +
            '#theatreScene .tf-dp.dp-b .d-key{color:rgba(255,255,255,0.4);}' +
            '#theatreScene .tf-dp.dp-b .d-val{color:rgba(255,255,255,0.85);}' +
            '#theatreScene .tf-dp.dp-b .d-row{border-bottom-color:rgba(255,255,255,0.06);}' +
            /* Style C: Bubble Popup */
            '#theatreScene .tf-dp.dp-c{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%) scale(0.9) translateY(10px);opacity:0;pointer-events:none;transition:all 0.35s cubic-bezier(0.16,1,0.3,1);z-index:10;}' +
            '#theatreScene .tf-dp.dp-c.open{opacity:1;pointer-events:auto;transform:translateX(-50%) scale(1) translateY(0);}' +
            '#theatreScene .tf-dp.dp-c .dp-inner{background:#1a1a1f;border-radius:14px;padding:12px 16px;box-shadow:0 12px 40px rgba(0,0,0,0.2);min-width:200px;position:relative;}' +
            '#theatreScene .tf-dp.dp-c .dp-inner::after{content:"";position:absolute;bottom:-5px;left:50%;width:10px;height:10px;background:#1a1a1f;border-radius:2px;transform:translateX(-50%) rotate(45deg);}' +
            '#theatreScene .tf-dp.dp-c .d-key{color:rgba(255,255,255,0.4);}' +
            '#theatreScene .tf-dp.dp-c .d-val{color:rgba(255,255,255,0.9);}' +
            '#theatreScene .tf-dp.dp-c .d-row{border-bottom-color:rgba(255,255,255,0.06);}' +
            /* Style D: Inline Expand */
            '#theatreScene .tf-dp.dp-d{max-height:0;overflow:hidden;opacity:1;pointer-events:auto;transition:max-height 0.4s cubic-bezier(0.16,1,0.3,1),padding 0.3s;padding:0 16px;background:rgba(42,40,48,0.02);border-top:0 solid rgba(42,40,48,0.06);}' +
            '#theatreScene .tf-dp.dp-d.open{max-height:200px;padding:10px 16px 12px;border-top-width:1px;opacity:1;}' +
            '#theatreScene .tf-dp.dp-d .d-val.highlight{color:rgba(42,40,48,0.7);background:rgba(42,40,48,0.05);padding:2px 8px;border-radius:4px;font-size:9px;}' +
            /* Style E: Grid Panel */
            '#theatreScene .tf-dp.dp-e{position:absolute;left:0;right:0;top:calc(100% + 6px);transform:translateY(-8px);opacity:0;pointer-events:none;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);z-index:10;}' +
            '#theatreScene .tf-dp.dp-e.open{transform:translateY(0);opacity:1;pointer-events:auto;}' +
            '#theatreScene .tf-dp.dp-e .dp-inner{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:0.8px solid rgba(42,40,48,0.1);border-radius:16px;padding:12px 16px;box-shadow:0 8px 32px rgba(42,40,48,0.08);display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;}' +
            '#theatreScene .tf-dp.dp-e .d-cell{display:flex;flex-direction:column;gap:2px;padding:6px 0;}' +
            '#theatreScene .tf-dp.dp-e .d-key{font-size:8px;font-weight:800;letter-spacing:1px;color:rgba(42,40,48,0.3);text-transform:uppercase;}' +
            '#theatreScene .tf-dp.dp-e .d-val{font-size:11px;font-weight:700;color:#2a2830;font-variant-numeric:tabular-nums;}' +
            '#theatreScene .tf-dp.dp-e .d-cell.full{grid-column:1/-1;border-top:1px solid rgba(42,40,48,0.06);padding-top:8px;margin-top:2px;}' +

            /* ═══ Time Badge (消息底部秒数) ═══ */
            '#theatreScene .ts-time-badge{display:flex;align-items:center;gap:6px;margin-top:6px;margin-left:22px;opacity:0;animation:tfBadgeIn 0.5s 0.3s ease-out forwards;}' +
            '@keyframes tfBadgeIn{0%{opacity:0;transform:translateY(-4px);}100%{opacity:1;transform:translateY(0);}}' +
            '#theatreScene .ts-time-badge .tb-dot{width:6px;height:6px;border-radius:50%;background:#2a2830;box-shadow:0 1px 4px rgba(42,40,48,0.2);flex-shrink:0;}' +
            '#theatreScene .ts-time-badge .tb-time{font-size:9px;font-weight:700;color:rgba(42,40,48,0.35);font-variant-numeric:tabular-nums;letter-spacing:0.3px;}' +
            /* Badge v2 ring */
            '#theatreScene .ts-time-badge.v2 .tb-dot{width:8px;height:8px;background:transparent;border:1.5px solid rgba(42,40,48,0.25);box-shadow:none;position:relative;}' +
            '#theatreScene .ts-time-badge.v2 .tb-dot::after{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:3px;height:3px;border-radius:50%;background:#2a2830;}' +
            /* Badge v3 capsule */
            '#theatreScene .ts-time-badge.v3{gap:0;}' +
            '#theatreScene .ts-time-badge.v3 .tb-capsule{display:flex;align-items:center;gap:5px;background:rgba(42,40,48,0.04);border:0.8px solid rgba(42,40,48,0.08);border-radius:20px;padding:3px 10px 3px 6px;}' +
            '#theatreScene .ts-time-badge.v3 .tb-dot{width:5px;height:5px;box-shadow:none;}' +
            '#theatreScene .ts-time-badge.v3 .tb-time{font-size:8px;}' +
            /* Badge v4 line */
            '#theatreScene .ts-time-badge.v4{gap:0;}' +
            '#theatreScene .ts-time-badge.v4 .tb-dot{width:5px;height:5px;}' +
            '#theatreScene .ts-time-badge.v4 .tb-line{width:12px;height:1px;background:rgba(42,40,48,0.12);}' +
            '#theatreScene .ts-time-badge.v4 .tb-time{margin-left:6px;}' +
            /* Badge v5 minimal right */
            '#theatreScene .ts-time-badge.v5{justify-content:flex-end;margin-right:4px;gap:5px;}' +
            '#theatreScene .ts-time-badge.v5 .tb-dot{width:4px;height:4px;background:rgba(42,40,48,0.2);box-shadow:none;}' +
            '#theatreScene .ts-time-badge.v5 .tb-time{font-size:8px;color:rgba(42,40,48,0.25);font-weight:600;}' +

            /* ═══ Continue Dot + Capsule ═══ */
            '#theatreScene .ts-cont-dot{width:18px;height:18px;border-radius:50%;background:rgba(42,40,48,0.03);border:0.8px solid rgba(42,40,48,0.06);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);opacity:0.4;margin-left:8px;vertical-align:middle;-webkit-tap-highlight-color:transparent;}' +
            '#theatreScene .ts-cont-dot:active{transform:scale(0.85);opacity:1;}' +
            '#theatreScene .ts-cont-dot.expanded{width:auto;border-radius:20px;padding:5px 12px 5px 8px;gap:5px;opacity:1;background:rgba(42,40,48,0.04);border-color:rgba(42,40,48,0.12);}' +
            '#theatreScene .ts-cont-dot svg{width:9px;height:9px;stroke:rgba(42,40,48,0.35);fill:none;stroke-width:2.5;stroke-linecap:round;flex-shrink:0;}' +
            '#theatreScene .ts-cont-dot .cont-label{display:none;font-size:8px;font-weight:700;color:rgba(42,40,48,0.4);letter-spacing:0.5px;white-space:nowrap;}' +
            '#theatreScene .ts-cont-dot.expanded .cont-label{display:inline;}' +
            '#theatreScene .ts-cont-dot.loading{pointer-events:none;width:auto;border-radius:20px;padding:5px 14px 5px 10px;gap:6px;opacity:1;background:#1a1a1f;border-color:#1a1a1f;}' +
            '#theatreScene .ts-cont-dot.loading svg{stroke:rgba(255,255,255,0.6);}' +
            '#theatreScene .ts-cont-dot.loading .cont-label{display:inline;color:rgba(255,255,255,0.7);animation:contPulse 1.2s ease-in-out infinite;}' +
            '@keyframes contPulse{0%,100%{opacity:0.5;}50%{opacity:1;}}' +

            /* ═══ Swipe Pages ═══ */
            '#theatreScene .ts-swipe-nav{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px;margin-left:22px;}' +
            '#theatreScene .ts-swipe-dot{width:6px;height:6px;border-radius:50%;background:rgba(42,40,48,0.15);transition:all 0.3s cubic-bezier(0.16,1,0.3,1);cursor:pointer;-webkit-tap-highlight-color:transparent;}' +
            '#theatreScene .ts-swipe-dot.active{width:18px;border-radius:3px;background:#2a2830;}' +
            '#theatreScene .ts-swipe-label{text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.25);margin-top:3px;margin-left:22px;letter-spacing:1px;}' +

            /* 事件卡片 */
            '#theatreScene .msg-event{margin-bottom:16px;padding-left:22px;}' +
            '#theatreScene .ts-ev-card{background:#1a1a1f;border-radius:14px;padding:16px 18px;position:relative;overflow:hidden;}' +
            '#theatreScene .ts-ev-card::before{content:"Event";position:absolute;top:8px;right:10px;font-family:"TheatreDeco",serif;font-size:28px;color:rgba(255,255,255,0.03);pointer-events:none;letter-spacing:1px;}' +
            '#theatreScene .ts-ev-head{display:flex;align-items:center;gap:6px;margin-bottom:6px;}' +
            '#theatreScene .ts-ev-head svg{stroke:rgba(255,255,255,0.5);}' +
            '#theatreScene .ts-ev-title{font-size:11px;font-weight:700;color:#fff;letter-spacing:0.3px;}' +
            '#theatreScene .ts-ev-desc{font-size:10px;color:rgba(255,255,255,0.4);font-family:Georgia,serif;font-style:italic;line-height:1.5;margin-bottom:12px;}' +
            '#theatreScene .ts-ev-choices{display:flex;flex-direction:column;gap:6px;}' +
            '#theatreScene .ts-ev-choice{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.08);cursor:pointer;transition:all 0.2s;-webkit-tap-highlight-color:transparent;}' +
            '#theatreScene .ts-ev-choice:active{transform:scale(0.98);background:rgba(255,255,255,0.08);}' +
            '#theatreScene .ts-ev-choice-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.25);flex-shrink:0;transition:background 0.2s;}' +
            '#theatreScene .ts-ev-choice-text{font-size:10px;color:rgba(255,255,255,0.6);font-weight:500;flex:1;}' +
            '#theatreScene .ts-ev-choice-arrow{font-size:9px;color:rgba(255,255,255,0.15);}' +

            /* 底栏 */
            '#theatreScene .ts-bottom{position:fixed;bottom:calc(env(safe-area-inset-bottom,10px) + 8px);left:14px;right:14px;z-index:20;}' +
            '#theatreScene .ts-bottom-glass{background:rgba(255,255,255,0.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:0.8px solid rgba(42,40,48,0.08);border-radius:22px;padding:12px 14px 14px;box-shadow:0 4px 24px rgba(42,40,48,0.06),0 1px 3px rgba(42,40,48,0.03);position:relative;overflow:hidden;}' +
            '#theatreScene .ts-bottom-glass::before{content:"Dialogue · Scene";position:absolute;bottom:8px;right:14px;font-family:"TheatreDeco",serif;font-size:36px;color:rgba(42,40,48,0.022);white-space:nowrap;pointer-events:none;letter-spacing:3px;line-height:1;}' +
            '#theatreScene .ts-bottom-glass::after{content:"Write";position:absolute;bottom:-10px;right:-4px;font-family:"TheatreDeco",serif;font-size:48px;color:#000;white-space:nowrap;pointer-events:none;letter-spacing:2px;line-height:1;}' +
            '#theatreScene .ts-bar-actions{display:flex;gap:6px;margin-bottom:10px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;}' +
            '#theatreScene .ts-bar-actions::-webkit-scrollbar{display:none;}' +
            '#theatreScene .ts-bar-btn{background:rgba(42,40,48,0.04);border:0.8px solid rgba(42,40,48,0.1);border-radius:20px;padding:6px 12px;color:rgba(42,40,48,0.55);font-size:10px;font-weight:600;display:flex;align-items:center;gap:5px;cursor:pointer;transition:all 0.2s;white-space:nowrap;flex-shrink:0;}' +
            '#theatreScene .ts-bar-btn:active{background:rgba(42,40,48,0.08);transform:scale(0.95);}' +
            '#theatreScene .ts-bar-btn svg{width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;}' +
            '#theatreScene .ts-bar-btn.accent{background:#2a2830;color:#fff;border-color:#2a2830;}' +
            '#theatreScene .ts-bar-btn.accent svg{stroke:#fff;}' +
            '#theatreScene .ts-bar-btn.accent:active{background:#111;}' +

            '#theatreScene .ts-input-row{display:flex;align-items:flex-end;gap:8px;}' +
            '#theatreScene .ts-add-btn{width:38px;height:38px;border-radius:12px;flex-shrink:0;background:rgba(42,40,48,0.04);border:0.8px solid rgba(42,40,48,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;}' +
            '#theatreScene .ts-add-btn:active{transform:scale(0.9);background:rgba(42,40,48,0.08);}' +
            '#theatreScene .ts-add-btn svg{width:16px;height:16px;stroke:rgba(42,40,48,0.5);fill:none;stroke-width:2;}' +
            '#theatreScene .ts-input-wrap{flex:1;background:rgba(42,40,48,0.03);border:0.8px solid rgba(42,40,48,0.1);border-radius:14px;padding:10px 42px 10px 14px;position:relative;}' +
            '#theatreScene .ts-input-wrap:focus-within{border-color:rgba(42,40,48,0.25);background:#fff;}' +
            '#theatreScene .ts-input-wrap textarea{width:100%;background:transparent;border:none;outline:none;color:#2a2830;font-family:"Noto Serif SC",Georgia,serif;font-size:13px;line-height:1.5;resize:none;max-height:80px;display:block;}' +
            '#theatreScene .ts-input-wrap textarea::placeholder{color:rgba(42,40,48,0.3);}' +
            '#theatreScene .ts-send-btn{position:absolute;right:5px;bottom:5px;width:28px;height:28px;border-radius:50%;background:#2a2830;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.2s;box-shadow:0 2px 6px rgba(42,40,48,0.15);}' +
            '#theatreScene .ts-send-btn:active{transform:scale(0.88);}' +
            '#theatreScene .ts-send-btn.stop-mode{background:#7a2a20;animation:tsPulseStop 1.2s ease-in-out infinite;}' +
            '@keyframes tsPulseStop{0%,100%{box-shadow:0 0 0 0 rgba(122,42,32,0.3);}50%{box-shadow:0 0 0 6px rgba(122,42,32,0);}}' +
            '#theatreScene .ts-send-btn svg{width:12px;height:12px;stroke:#fff;fill:none;stroke-width:2.5;}' +

            /* 导演弹窗 */
            '#theatreScene .ts-dir-popup{position:absolute;bottom:calc(100% + 8px);left:0;right:0;background:#fff;border:0.8px solid rgba(42,40,48,0.1);border-radius:18px;padding:16px;box-shadow:0 -6px 24px rgba(42,40,48,0.08),0 2px 8px rgba(42,40,48,0.04);opacity:0;pointer-events:none;transform:translateY(10px) scale(0.98);transition:all 0.3s cubic-bezier(0.16,1,0.3,1);}' +
            '#theatreScene .ts-dir-popup.open{opacity:1;pointer-events:auto;transform:translateY(0) scale(1);}' +
            '#theatreScene .ts-dp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:9px;border-bottom:1px solid rgba(42,40,48,0.06);}' +
            '#theatreScene .ts-dp-title{font-size:10px;font-weight:800;letter-spacing:2px;color:rgba(42,40,48,0.5);text-transform:uppercase;}' +
            '#theatreScene .ts-dp-close{background:none;border:none;color:rgba(42,40,48,0.35);font-size:16px;cursor:pointer;}' +
            '#theatreScene .ts-dp-label{font-size:8px;font-weight:700;letter-spacing:1px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:4px;}' +
            '#theatreScene .ts-dp-textarea{width:100%;background:rgba(42,40,48,0.02);border:0.8px solid rgba(42,40,48,0.08);border-radius:10px;padding:10px 12px;color:#2a2830;font-family:"Noto Serif SC",Georgia,serif;font-size:12px;resize:none;outline:none;height:55px;transition:border-color 0.2s;}' +
            '#theatreScene .ts-dp-textarea:focus{border-color:rgba(42,40,48,0.25);}' +
            '#theatreScene .ts-dp-textarea::placeholder{color:rgba(42,40,48,0.25);font-style:italic;}' +
            '#theatreScene .ts-dp-send{width:100%;padding:11px;background:#2a2830;border:none;border-radius:50px;color:#fff;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:transform 0.2s;margin-top:10px;}' +
            '#theatreScene .ts-dp-send:active{transform:scale(0.97);}' +

            /* 侧边设置 */
            '#theatreScene .ts-sidebar{position:fixed;top:0;left:0;bottom:0;width:280px;z-index:100;background:#f7f5f2;border-right:0.8px solid #2a2830;transform:translateX(-100%);transition:transform 0.4s cubic-bezier(0.16,1,0.3,1);display:flex;flex-direction:column;box-shadow:10px 0 30px rgba(42,40,48,0.08);}' +
            '#theatreScene .ts-sidebar.open{transform:translateX(0);}' +
            '#theatreScene .ts-sb-header{padding:50px 18px;border-bottom:1px solid rgba(42,40,48,0.08);display:flex;justify-content:space-between;align-items:center;}' +
            '#theatreScene .ts-sb-title{font-size:11px;font-weight:800;letter-spacing:2px;color:#2a2830;text-transform:uppercase;}' +
            '#theatreScene .ts-sb-close{background:none;border:none;color:rgba(42,40,48,0.4);font-size:18px;cursor:pointer;}' +
            '#theatreScene .ts-sb-content{flex:1;overflow-y:auto;padding:20px 18px;scrollbar-width:none;}' +
            '#theatreScene .ts-sb-content::-webkit-scrollbar{display:none;}' +
            '#theatreScene .ts-sb-label{font-size:9px;font-weight:800;letter-spacing:2px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:10px;display:block;}' +
            '#theatreScene .ts-sb-slider{width:100%;height:4px;background:rgba(42,40,48,0.08);border-radius:2px;outline:none;-webkit-appearance:none;margin-bottom:24px;}' +
            '#theatreScene .ts-sb-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#2a2830;cursor:pointer;box-shadow:0 0 8px rgba(42,40,48,0.2);}' +
            '#theatreScene .ts-sb-section{margin-bottom:18px;}' +
            '#theatreScene .ts-sb-section-title{font-size:9px;font-weight:800;letter-spacing:1.5px;color:rgba(42,40,48,0.5);text-transform:uppercase;margin-bottom:8px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;}' +
            '#theatreScene .ts-sb-section-title svg{width:12px;height:12px;stroke:rgba(42,40,48,0.35);fill:none;stroke-width:2;transition:transform 0.3s;}' +
            '#theatreScene .ts-sb-section.open .ts-sb-section-title svg{transform:rotate(180deg);}' +
            '#theatreScene .ts-sb-section-body{max-height:0;overflow:hidden;transition:max-height 0.4s cubic-bezier(0.16,1,0.3,1);}' +
            '#theatreScene .ts-sb-section.open .ts-sb-section-body{max-height:600px;overflow-y:auto;scrollbar-width:none;}' +
            '#theatreScene .ts-sb-section.open .ts-sb-section-body::-webkit-scrollbar{display:none;}' +
            '#theatreScene .ts-sb-premise-card{background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.06);border-radius:10px;padding:12px;margin-top:8px;}' +
            '#theatreScene .ts-sb-premise-text{font-size:11px;color:rgba(42,40,48,0.55);line-height:1.7;font-family:Georgia,serif;font-style:italic;}' +
            '#theatreScene .ts-sb-btn{width:100%;padding:11px;margin-top:12px;background:rgba(42,40,48,0.04);border:0.8px solid rgba(42,40,48,0.12);border-radius:12px;color:rgba(42,40,48,0.6);font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;cursor:pointer;transition:all 0.2s;}' +
            '#theatreScene .ts-sb-btn:active{background:rgba(42,40,48,0.08);transform:scale(0.97);}' +
            '#theatreScene .ts-sb-btn.danger{border-color:rgba(166,52,38,0.15);color:rgba(166,52,38,0.6);}' +
            '#theatreScene .ts-wb-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(42,40,48,0.06);}' +
            '#theatreScene .ts-wb-row:last-child{border-bottom:none;}' +
            '#theatreScene .ts-wb-name{font-size:11px;font-weight:600;color:rgba(42,40,48,0.6);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;}' +
            '#theatreScene .ts-wb-pos{font-size:7px;font-weight:800;letter-spacing:1px;color:rgba(42,40,48,0.3);text-transform:uppercase;margin-right:8px;flex-shrink:0;}' +
            '#theatreScene .ts-wb-toggle{width:32px;height:18px;border-radius:9px;background:rgba(42,40,48,0.1);position:relative;cursor:pointer;transition:background 0.2s;flex-shrink:0;}' +
            '#theatreScene .ts-wb-toggle.on{background:#2a2830;}' +
            '#theatreScene .ts-wb-toggle::after{content:"";position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:transform 0.2s cubic-bezier(0.16,1,0.3,1);}' +
            '#theatreScene .ts-wb-toggle.on::after{transform:translateX(14px);}' +
            '#theatreScene .ts-mask-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(42,40,48,0.06);cursor:pointer;transition:background 0.2s;}' +
            '#theatreScene .ts-mask-row:last-child{border-bottom:none;}' +
            '#theatreScene .ts-mask-row:active{background:rgba(42,40,48,0.04);}' +
            '#theatreScene .ts-mask-av{width:28px;height:28px;border-radius:50%;background:#2a2830;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;overflow:hidden;}' +
            '#theatreScene .ts-mask-av img{width:100%;height:100%;object-fit:cover;}' +
            '#theatreScene .ts-mask-info{flex:1;min-width:0;}' +
            '#theatreScene .ts-mask-name{font-size:11px;font-weight:700;color:#2a2830;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '#theatreScene .ts-mask-bio{font-size:9px;color:rgba(42,40,48,0.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}' +
            '#theatreScene .ts-mask-check{width:16px;height:16px;border-radius:50%;border:1.5px solid rgba(42,40,48,0.15);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}' +
            '#theatreScene .ts-mask-check.on{background:#2a2830;border-color:#2a2830;}' +
            '#theatreScene .ts-mask-check.on::after{content:"";width:6px;height:6px;border-radius:50%;background:#fff;}' +

            /* 新消息动画 */
            '#theatreScene .ts-new{animation:tsMsgIn 0.3s ease-out forwards;opacity:0;}' +
            '@keyframes tsMsgIn{to{opacity:1;}}' +

            /* 消息菜单 */
            '#theatreScene .ts-ctx-overlay{position:fixed;inset:0;z-index:998;}' +
            '#theatreScene .ts-ctx-menu{position:fixed;z-index:999;display:flex;flex-direction:row;align-items:center;gap:2px;padding:6px 8px;background:rgba(255,255,255,0.92);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border:1px solid rgba(42,40,48,0.1);border-radius:50px;box-shadow:0 12px 40px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.06);transform-origin:center top;animation:tsCtxIn 0.3s cubic-bezier(0.16,1,0.3,1);}' +
            '@keyframes tsCtxIn{0%{opacity:0;transform:scale(0.85) translateY(-10px);}100%{opacity:1;transform:scale(1) translateY(0);}}' +
            '#theatreScene .ts-ctx-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;cursor:pointer;border-radius:50px;background:transparent;transition:all 0.2s;white-space:nowrap;color:rgba(42,40,48,0.7);}' +
            '#theatreScene .ts-ctx-btn:active{transform:scale(0.93);background:rgba(42,40,48,0.06);}' +
            '#theatreScene .ts-ctx-btn svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;}' +
            '#theatreScene .ts-ctx-btn span{font-size:11px;font-weight:600;letter-spacing:0.3px;}' +
            '#theatreScene .ts-ctx-sep{width:1px;height:16px;background:rgba(42,40,48,0.1);border-radius:1px;flex-shrink:0;margin:0 2px;}' +
            '#theatreScene .ts-ctx-btn.danger{color:rgba(166,52,38,0.75);}' +
            '#theatreScene .ts-ctx-btn.danger:active{background:rgba(166,52,38,0.08);}' +
            '#theatreScene .ts-ctx-btn.regen{color:rgba(52,100,180,0.85);}' +
            '#theatreScene .ts-ctx-btn.regen:active{background:rgba(52,100,180,0.08);}' +

            /* 回溯消散动画 */
            '@keyframes tsDissolve{0%{opacity:1;transform:translateY(0) scale(1);filter:blur(0);}30%{opacity:0.7;transform:translateY(-6px) scale(1.01);filter:blur(0.5px);}100%{opacity:0;transform:translateY(-24px) scale(0.92);filter:blur(4px);}}' +
            '#theatreScene .ts-dissolving{animation:tsDissolve 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards;pointer-events:none;}' +

            /* 编辑态 */
            '#theatreScene .ts-edit-bar{position:fixed;top:calc(env(safe-area-inset-top,20px) + 70px);left:50%;transform:translateX(-50%);background:rgba(42,40,48,0.9);color:#fff;padding:8px 16px;border-radius:30px;font-size:11px;font-weight:600;letter-spacing:0.5px;display:flex;align-items:center;gap:12px;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,0.2);animation:tsMsgIn 0.3s ease-out;}' +
            '#theatreScene .ts-edit-bar button{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:20px;padding:5px 14px;font-size:10px;font-weight:700;cursor:pointer;transition:all 0.2s;}' +
            '#theatreScene .ts-edit-bar button:active{transform:scale(0.93);background:rgba(255,255,255,0.25);}' +
            '#theatreScene .ts-edit-bar .ts-edit-cancel{color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.1);}' +
            '#theatreScene .ts-edit-ta{width:100%;background:rgba(42,40,48,0.04);border:1.5px solid rgba(42,40,48,0.2);border-radius:12px;padding:12px;color:#2a2830;font-family:"Noto Serif SC",Georgia,serif;font-size:13px;line-height:1.6;resize:none;outline:none;transition:border-color 0.2s;box-sizing:border-box;overflow:hidden;}' +
            '#theatreScene .ts-edit-ta:focus{border-color:#2a2830;}' +

            /* 时间线视图 */
            '#theatreScene .ts-timeline{position:fixed;inset:0;z-index:190;background:#f7f5f2;display:none;flex-direction:column;overflow:hidden;}' +
            '#theatreScene .ts-timeline.open{display:flex;animation:tsIn 0.35s cubic-bezier(0.16,1,0.3,1);}' +
            '#theatreScene .ts-tl-header{padding:50px 20px 16px;display:flex;justify-content:space-between;align-items:center;}' +
            '#theatreScene .ts-tl-title{font-family:"TheatreDeco",serif;font-size:22px;color:#2a2830;letter-spacing:1px;}' +
            '#theatreScene .ts-tl-close{width:32px;height:32px;border-radius:50%;background:#2a2830;display:flex;align-items:center;justify-content:center;cursor:pointer;}' +
            '#theatreScene .ts-tl-close svg{width:13px;height:13px;stroke:#fff;fill:none;stroke-width:2;}' +
            '#theatreScene .ts-tl-scroll{flex:1;overflow-y:auto;padding:0 20px 40px 44px;position:relative;-webkit-overflow-scrolling:touch;}' +
            '#theatreScene .ts-tl-scroll::-webkit-scrollbar{display:none;}' +
            '#theatreScene .ts-tl-scroll::before{content:"";position:absolute;left:32px;top:0;bottom:0;width:1.5px;background:repeating-linear-gradient(to bottom,#2a2830 0px,#2a2830 6px,transparent 6px,transparent 12px);opacity:0.15;}' +
            '#theatreScene .ts-tl-node{position:relative;margin-bottom:20px;}' +
            '#theatreScene .ts-tl-dot{position:absolute;left:-18px;top:6px;width:9px;height:9px;border-radius:50%;background:#2a2830;border:2px solid #f7f5f2;box-shadow:0 0 0 1px rgba(42,40,48,0.15);z-index:2;}' +
            '#theatreScene .ts-tl-dot.user{background:#636366;}' +
            '#theatreScene .ts-tl-dot.director{background:#a63426;}' +
            '#theatreScene .ts-tl-dot.event{background:transparent;border:2px solid #2a2830;box-shadow:none;}' +
            '#theatreScene .ts-tl-dot.chapter{background:transparent;border:none;box-shadow:none;width:auto;height:auto;left:-24px;top:2px;}' +
            '#theatreScene .ts-tl-time{font-size:8px;font-weight:800;letter-spacing:1.5px;color:rgba(42,40,48,0.3);text-transform:uppercase;margin-bottom:3px;}' +
            '#theatreScene .ts-tl-card{background:rgba(255,255,255,0.75);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:0.8px solid rgba(42,40,48,0.1);border-radius:10px;padding:10px 12px;position:relative;overflow:hidden;}' +
            '#theatreScene .ts-tl-card::before{content:"";position:absolute;top:0;left:0;bottom:0;width:3px;border-radius:10px 0 0 10px;}' +
            '#theatreScene .ts-tl-card.t-ai::before{background:#2a2830;}' +
            '#theatreScene .ts-tl-card.t-user::before{background:#636366;}' +
            '#theatreScene .ts-tl-card.t-director::before{background:#a63426;}' +
            '#theatreScene .ts-tl-speaker{font-size:8px;font-weight:800;letter-spacing:1px;color:rgba(42,40,48,0.5);text-transform:uppercase;margin-bottom:3px;}' +
            '#theatreScene .ts-tl-text{font-size:10px;line-height:1.6;color:rgba(42,40,48,0.6);font-family:Georgia,serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
            '#theatreScene .ts-tl-event{background:rgba(42,40,48,0.03);border:1px dashed rgba(42,40,48,0.12);border-radius:8px;padding:8px 10px;text-align:center;}' +
            '#theatreScene .ts-tl-event-label{font-size:7px;font-weight:800;letter-spacing:2px;color:rgba(42,40,48,0.3);text-transform:uppercase;margin-bottom:2px;}' +
            '#theatreScene .ts-tl-event-text{font-size:10px;color:rgba(42,40,48,0.5);font-style:italic;font-family:Georgia,serif;}' +
            '#theatreScene .ts-tl-chapter{display:flex;align-items:center;gap:10px;margin:24px 0 16px -12px;}' +
            '#theatreScene .ts-tl-chapter-line{flex:1;height:1px;background:rgba(42,40,48,0.1);}' +
            '#theatreScene .ts-tl-chapter-label{font-family:"TheatreDeco",serif;font-size:11px;color:rgba(42,40,48,0.25);letter-spacing:1.5px;white-space:nowrap;}' +
            '#theatreScene .ts-tl-add{position:relative;height:20px;display:flex;align-items:center;justify-content:center;margin:4px 0;cursor:pointer;opacity:0;transition:opacity 0.2s;}' +
            '#theatreScene .ts-tl-node:hover+.ts-tl-add,#theatreScene .ts-tl-add:hover{opacity:1;}' +
            '#theatreScene .ts-tl-add-btn{width:18px;height:18px;border-radius:50%;background:rgba(42,40,48,0.08);display:flex;align-items:center;justify-content:center;transition:all 0.2s;}' +
            '#theatreScene .ts-tl-add-btn:active{transform:scale(0.9);background:rgba(42,40,48,0.15);}' +
            '#theatreScene .ts-tl-add-btn svg{width:10px;height:10px;stroke:rgba(42,40,48,0.4);fill:none;stroke-width:2;}' +
            '#theatreScene .ts-tl-actions{position:absolute;top:8px;right:8px;display:flex;gap:4px;}' +
            '#theatreScene .ts-tl-act-btn{width:22px;height:22px;border-radius:50%;background:rgba(42,40,48,0.05);display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:opacity 0.2s;}' +
            '#theatreScene .ts-tl-node:hover .ts-tl-act-btn{opacity:1;}' +
            '#theatreScene .ts-tl-act-btn:active{transform:scale(0.9);background:rgba(42,40,48,0.1);}' +
            '#theatreScene .ts-tl-act-btn svg{width:10px;height:10px;stroke:rgba(42,40,48,0.5);fill:none;stroke-width:2;}' +

            /* 分支面板 */
            '#theatreScene .ts-branch-panel{position:fixed;inset:0;z-index:190;background:#f7f5f2;display:none;flex-direction:column;overflow:hidden;}' +
            '#theatreScene .ts-branch-panel.open{display:flex;animation:tsIn 0.35s cubic-bezier(0.16,1,0.3,1);}' +
            '#theatreScene .ts-branch-header{padding:50px 20px 16px;display:flex;justify-content:space-between;align-items:center;}' +
            '#theatreScene .ts-branch-title{font-family:"TheatreDeco",serif;font-size:22px;color:#2a2830;letter-spacing:1px;}' +
            '#theatreScene .ts-branch-close{width:32px;height:32px;border-radius:50%;background:#2a2830;display:flex;align-items:center;justify-content:center;cursor:pointer;}' +
            '#theatreScene .ts-branch-close svg{width:13px;height:13px;stroke:#fff;fill:none;stroke-width:2;}' +
            '#theatreScene .ts-branch-scroll{flex:1;overflow-y:auto;padding:20px;-webkit-overflow-scrolling:touch;}' +
            '#theatreScene .ts-branch-scroll::-webkit-scrollbar{display:none;}' +
            '#theatreScene .ts-branch-item{background:#fff;border:1px solid rgba(42,40,48,0.08);border-radius:14px;padding:14px 16px;margin-bottom:12px;cursor:pointer;transition:all 0.2s;position:relative;}' +
            '#theatreScene .ts-branch-item:active{transform:scale(0.98);border-color:#2a2830;}' +
            '#theatreScene .ts-branch-item.active{border-color:#2a2830;border-width:1.5px;}' +
            '#theatreScene .ts-branch-item-badge{position:absolute;top:-6px;right:12px;font-size:7px;font-weight:800;letter-spacing:1.5px;background:#2a2830;color:#fff;padding:2px 8px;border-radius:3px;text-transform:uppercase;}' +
            '#theatreScene .ts-branch-item-name{font-size:13px;font-weight:700;color:#2a2830;margin-bottom:4px;}' +
            '#theatreScene .ts-branch-item-meta{font-size:9px;color:rgba(42,40,48,0.4);display:flex;gap:10px;}' +
            '#theatreScene .ts-branch-item-del{position:absolute;bottom:12px;right:12px;font-size:8px;color:rgba(166,52,38,0.5);cursor:pointer;font-weight:700;letter-spacing:1px;text-transform:uppercase;}' +
            '#theatreScene .ts-branch-item-del:active{color:#a63426;}' +
            '#theatreScene .ts-branch-empty{text-align:center;padding:40px 20px;font-size:11px;color:rgba(42,40,48,0.35);font-style:italic;font-family:Georgia,serif;}' +

            /* 全屏功能面板 */
            '#theatreScene .ts-fullpanel{position:fixed;inset:0;z-index:200;background:#f7f5f2;display:none;flex-direction:column;overflow-y:auto;-webkit-overflow-scrolling:touch;}' +
            '#theatreScene .ts-fullpanel.open{display:flex;animation:tsIn 0.35s cubic-bezier(0.16,1,0.3,1);}' +
            '#theatreScene .ts-fp-header{padding:60px 20px 20px;display:flex;justify-content:space-between;align-items:center;}' +
            '#theatreScene .ts-fp-title{font-family:"TheatreDeco",serif;font-size:24px;color:#2a2830;letter-spacing:1px;}' +
            '#theatreScene .ts-fp-close{width:36px;height:36px;border-radius:50%;background:#2a2830;display:flex;align-items:center;justify-content:center;cursor:pointer;}' +
            '#theatreScene .ts-fp-close svg{width:14px;height:14px;stroke:#fff;fill:none;stroke-width:2;}' +
            '#theatreScene .ts-fp-grid{padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:14px;}' +
            '#theatreScene .ts-fp-card{background:#fff;border:1px solid rgba(42,40,48,0.08);border-radius:16px;padding:20px 16px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer;transition:all 0.2s;}' +
            '#theatreScene .ts-fp-card:active{transform:scale(0.96);background:rgba(42,40,48,0.03);}' +
            '#theatreScene .ts-fp-card svg{width:24px;height:24px;stroke:#2a2830;fill:none;stroke-width:1.5;}' +
            '#theatreScene .ts-fp-card-name{font-size:10px;font-weight:700;color:#2a2830;letter-spacing:0.5px;text-align:center;}' +
            '#theatreScene .ts-fp-card-sub{font-size:8px;color:rgba(42,40,48,0.4);text-align:center;}' +
            '#theatreScene .ts-fp-card.disabled{opacity:0.35;pointer-events:none;}' +

            /* 助手子面板 */
            '#theatreScene .ts-assist-panel{display:none;padding:0 20px 40px;}' +
            '#theatreScene .ts-assist-panel.open{display:block;}' +
            '#theatreScene .ts-assist-input-row{display:flex;gap:8px;margin-bottom:16px;}' +
            '#theatreScene .ts-assist-input{flex:1;background:#fff;border:1px solid rgba(42,40,48,0.12);border-radius:12px;padding:12px 14px;font-size:12px;color:#2a2830;outline:none;font-family:-apple-system,sans-serif;}' +
            '#theatreScene .ts-assist-input:focus{border-color:#2a2830;}' +
            '#theatreScene .ts-assist-input::placeholder{color:rgba(42,40,48,0.3);}' +
            '#theatreScene .ts-assist-go{width:42px;height:42px;border-radius:50%;background:#2a2830;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:transform 0.2s;}' +
            '#theatreScene .ts-assist-go:active{transform:scale(0.9);}' +
            '#theatreScene .ts-assist-go svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2;}' +
            '#theatreScene .ts-assist-loading{text-align:center;padding:20px;font-size:10px;color:rgba(42,40,48,0.4);font-style:italic;}' +
            '#theatreScene .ts-assist-list{display:flex;flex-direction:column;gap:10px;}' +
            '#theatreScene .ts-assist-item{background:#fff;border:1px solid rgba(42,40,48,0.08);border-radius:14px;padding:14px 16px;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;}' +
            '#theatreScene .ts-assist-item:active{transform:scale(0.98);border-color:#2a2830;}' +
            '#theatreScene .ts-assist-item-title{font-family:Georgia,serif;font-style:italic;font-size:14px;color:#2a2830;margin-bottom:4px;font-weight:600;}' +
            '#theatreScene .ts-assist-item-premise{font-size:11px;color:rgba(42,40,48,0.5);line-height:1.5;}' +
            '#theatreScene .ts-assist-item-use{position:absolute;top:12px;right:12px;font-size:8px;font-weight:800;letter-spacing:1.5px;color:rgba(42,40,48,0.3);text-transform:uppercase;}' +

            /* Errbook injected badge */
            '#theatreScene .eb-inj-div{display:flex;align-items:center;justify-content:center;}' +
            '#theatreScene .eb-inj-c{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;background:rgba(42,40,48,0.03);border:0.5px solid rgba(42,40,48,0.08);}' +
            '#theatreScene .eb-inj-ic{width:14px;height:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
            '#theatreScene .eb-inj-ic svg{width:9px;height:9px;}' +
            '#theatreScene .eb-inj-t{font-size:9px;font-weight:600;color:rgba(42,40,48,0.4);letter-spacing:0.3px;white-space:nowrap;}' +
            '';
    }

    /* ══════════════════════════════════════ HTML ══════════════════════════════════════ */
    function buildHTML() {
        var el = document.createElement('div');
        el.id = 'theatreScene';
        el.innerHTML =
            '<style>' + buildCSS() + '</style>' +

            /* 背景 */
            '<div class="ts-bg" id="tsBg"></div>' +
            '<div class="ts-bg-dim" id="tsBgDim"></div>' +
            '<div class="ts-bg-grain"></div>' +

            /* 顶栏 */
            '<div class="ts-topbar">' +
                '<div class="ts-tb-row">' +
                    '<div class="ts-tb-btn" id="tsBackBtn"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>' +
                    '<div class="ts-tb-center">' +
                        '<span class="ts-tb-mode" id="tsActLabel">Act I</span>' +
                        '<span class="ts-tb-dot"></span>' +
                        '<span class="ts-tb-title">Parallel</span>' +
                    '</div>' +
                    '<div class="ts-tb-btn" id="tsSettingsBtn"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>' +
                '</div>' +
                '<div class="ts-info">' +
                    '<div class="ts-avatar" id="tsAvatar">?</div>' +
                    '<div class="ts-info-text">' +
                        '<div class="ts-info-name" id="tsInfoName">Entity <span class="ts-info-badge">Theatre</span></div>' +
                        '<div class="ts-info-premise" id="tsInfoPremise">...</div>' +
                    '</div>' +
                    '<div class="ts-heat">' +
                        '<div class="ts-heat-label">Heat</div>' +
                        '<div class="ts-heat-bar"><div class="ts-heat-fill" id="tsHeatFill"></div></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            /* 对话区 */
            '<div class="ts-chat" id="tsChatArea">' +
                '<div class="ts-typing" id="tsTyping">' +
                    '<div class="ts-typing-dot"></div>' +
                    '<div class="ts-typing-dot"></div>' +
                    '<div class="ts-typing-dot"></div>' +
                '</div>' +
                '<div class="ts-typing-fancy" id="tsTypingFancy"></div>' +
            '</div>' +

            /* 底栏 */
            '<div class="ts-bottom">' +
                '<div class="ts-dir-popup" id="tsDirPopup">' +
                    '<div class="ts-dp-header">' +
                        '<span class="ts-dp-title">Director Mode</span>' +
                        '<button class="ts-dp-close" id="tsDpClose">\u2715</button>' +
                    '</div>' +
                    '<div class="ts-dp-field">' +
                        '<div class="ts-dp-label">Scene / 场景动作</div>' +
                        '<textarea class="ts-dp-textarea" id="tsDpScene" placeholder="描述环境变化、动作或旁白…"></textarea>' +
                    '</div>' +
                    '<div class="ts-dp-field" style="margin-top:10px;">' +
                        '<div class="ts-dp-label">Dialogue / 对话</div>' +
                        '<textarea class="ts-dp-textarea" id="tsDpDlg" placeholder="你的角色说的话…"></textarea>' +
                    '</div>' +
                    '<button class="ts-dp-send" id="tsDpSend">Execute</button>' +
                '</div>' +
                '<div class="ts-bottom-glass">' +
                    '<div class="ts-bar-actions">' +
                        '<button class="ts-bar-btn" id="tsInvokeBtn"><svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>Invoke AI</button>' +
                        '<button class="ts-bar-btn" id="tsBeginBtn"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>Begin</button>' +
                        '<button class="ts-bar-btn accent" id="tsSumBtn"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Summarize</button>' +
                        '<button class="ts-bar-btn" id="tsErrbookBtn"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>纠错本</button>' +
                        '<button class="ts-bar-btn" id="tsEventBtn"><span style="font-size:13px;">🎲</span>Event</button>' +
                    '</div>' +
                    '<div class="ts-input-row">' +
                        '<div class="ts-add-btn" id="tsAddBtn"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>' +
                        '<div class="ts-input-wrap">' +
                            '<textarea id="tsTextarea" rows="1" placeholder="输入你的回应…"></textarea>' +
                            '<button class="ts-send-btn" id="tsSendBtn"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            /* 侧边设置 */
            '<div class="ts-sidebar" id="tsSidebar">' +
                '<div class="ts-sb-header">' +
                    '<span class="ts-sb-title">Settings</span>' +
                    '<button class="ts-sb-close" id="tsSbClose">\u2715</button>' +
                '</div>' +
                '<div class="ts-sb-content">' +
                    '<span class="ts-sb-label">Heat Control</span>' +
                    '<input type="range" class="ts-sb-slider" id="tsHeatSlider" min="0" max="100" value="45">' +

                    '<span class="ts-sb-label">Typing Style / 调取样式</span>' +
                    '<div style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;" id="tsTypingStyleRow">' +
                        '<div class="ts-style-opt" data-ts-style="0" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">OFF</div>' +
                        '<div class="ts-style-opt" data-ts-style="1" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Pulse</div>' +
                        '<div class="ts-style-opt" data-ts-style="2" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Cinema</div>' +
                        '<div class="ts-style-opt" data-ts-style="3" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Type</div>' +
                        '<div class="ts-style-opt" data-ts-style="4" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Orb</div>' +
                        '<div class="ts-style-opt" data-ts-style="5" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Ink</div>' +
                    '</div>' +
                    '<span class="ts-sb-label">Time Badge / 秒数徽章</span>' +
                    '<div style="display:flex;gap:4px;margin-bottom:20px;flex-wrap:wrap;" id="tsBadgeStyleRow">' +
                        '<div class="ts-badge-opt" data-tb-style="0" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">OFF</div>' +
                        '<div class="ts-badge-opt" data-tb-style="1" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Dot</div>' +
                        '<div class="ts-badge-opt" data-tb-style="2" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Ring</div>' +
                        '<div class="ts-badge-opt" data-tb-style="3" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Capsule</div>' +
                        '<div class="ts-badge-opt" data-tb-style="4" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Line</div>' +
                        '<div class="ts-badge-opt" data-tb-style="5" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Mini</div>' +
                    '</div>' +
                    '<span class="ts-sb-label">Detail Style / 详情样式</span>' +
                    '<div style="display:flex;gap:4px;margin-bottom:20px;flex-wrap:wrap;" id="tsDetailStyleRow">' +
                        '<div class="ts-detail-opt" data-td-style="a" style="flex:1;min-width:36px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Drop</div>' +
                        '<div class="ts-detail-opt" data-td-style="b" style="flex:1;min-width:36px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Side</div>' +
                        '<div class="ts-detail-opt" data-td-style="c" style="flex:1;min-width:36px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Bubble</div>' +
                        '<div class="ts-detail-opt" data-td-style="d" style="flex:1;min-width:36px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Inline</div>' +
                        '<div class="ts-detail-opt" data-td-style="e" style="flex:1;min-width:36px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:8px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Grid</div>' +
                    '</div>' +
                    '<span class="ts-sb-label">Director Style / 导演卡片</span>' +
                    '<div style="display:flex;gap:4px;margin-bottom:20px;flex-wrap:wrap;" id="tsDirectorStyleRow">' +
                        '<div class="ts-dir-opt" data-dir-style="1" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:7px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Classic</div>' +
                        '<div class="ts-dir-opt" data-dir-style="2" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:7px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Clap</div>' +
                        '<div class="ts-dir-opt" data-dir-style="3" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:7px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Note</div>' +
                        '<div class="ts-dir-opt" data-dir-style="4" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:7px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Script</div>' +
                        '<div class="ts-dir-opt" data-dir-style="5" style="flex:1;min-width:40px;padding:8px 4px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:7px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">Mini</div>' +
                    '</div>' +
                    '<span class="ts-sb-label">User POV / 用户人称</span>' +
                    '<div style="display:flex;gap:6px;margin-bottom:20px;" id="tsPovRow">' +
                        '<div class="ts-pov-btn" data-pov="first" style="flex:1;padding:8px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:9px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">第一人称<br><span style="font-size:8px;opacity:0.6;">角色用「你」</span></div>' +
                        '<div class="ts-pov-btn" data-pov="third" style="flex:1;padding:8px;border-radius:10px;border:1px solid rgba(42,40,48,0.12);background:transparent;text-align:center;font-size:9px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;transition:all 0.2s;">第三人称<br><span style="font-size:8px;opacity:0.6;">角色用名字</span></div>' +
                    '</div>' +
                    '<span class="ts-sb-label">Context Rounds</span>' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-size:9px;color:rgba(42,40,48,0.4);">Rounds</span><span style="font-size:10px;font-weight:700;color:#2a2830;" id="tsRoundsVal">20</span></div>' +
                    '<input type="range" class="ts-sb-slider" id="tsRoundsSlider" min="4" max="40" value="20">' +
                    '<div class="ts-sb-section" id="tsTokenSection">' +
                        '<div class="ts-sb-section-title" id="tsTokenToggle">Max Tokens / 字数设置<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>' +
                        '<div class="ts-sb-section-body">' +
                            '<div style="padding-top:12px;">' +
                                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                                    '<span style="font-size:9px;font-weight:800;letter-spacing:1px;color:rgba(42,40,48,0.4);text-transform:uppercase;">Tokens</span>' +
                                    '<span style="font-size:10px;font-weight:700;color:#2a2830;" id="tsTokenVal">1200</span>' +
                                '</div>' +
                                '<input type="range" class="ts-sb-slider" id="tsTokenSlider" min="200" max="4000" step="100" value="1200" style="margin-bottom:8px;">' +
                                '<div style="display:flex;justify-content:space-between;">' +
                                    '<span style="font-size:9px;color:rgba(42,40,48,0.4);">200</span>' +
                                    '<span style="font-size:9px;color:rgba(42,40,48,0.4);">4000</span>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ts-sb-section" id="tsWbSection">' +
                        '<div class="ts-sb-section-title" id="tsWbToggle">World Book / 世界书<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>' +
                        '<div class="ts-sb-section-body">' +
                            '<div style="padding-top:10px;" id="tsWbList"><div style="font-size:10px;color:rgba(42,40,48,0.35);text-align:center;padding:10px 0;font-style:italic;">No world book entries</div></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ts-sb-section" id="tsEditSection">' +
                        '<div class="ts-sb-section-title" id="tsEditToggle">Edit Theatre / 编辑剧场<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>' +
                        '<div class="ts-sb-section-body">' +
                            '<div style="padding-top:10px;">' +
                                '<div style="font-size:8px;font-weight:800;letter-spacing:1px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:6px;">Title / 标题</div>' +
                                '<input type="text" id="tsEditTitle" style="width:100%;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:10px;padding:10px 12px;color:#2a2830;font-size:12px;font-weight:600;outline:none;margin-bottom:12px;">' +
                                '<div style="font-size:8px;font-weight:800;letter-spacing:1px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:6px;">Premise / 前提</div>' +
                                '<textarea id="tsEditPremise" style="width:100%;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:10px;padding:10px 12px;color:#2a2830;font-size:11px;outline:none;resize:none;height:80px;font-family:Georgia,serif;font-style:italic;line-height:1.6;"></textarea>' +
                                '<button class="ts-sb-btn" id="tsEditTheatreSave" style="margin-top:8px;">Save Changes</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ts-sb-section" id="tsCastSection">' +
                        '<div class="ts-sb-section-title" id="tsCastToggle">Cast / 角色管理<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>' +
                        '<div class="ts-sb-section-body">' +
                            '<div style="padding-top:10px;" id="tsCastList"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ts-sb-section open" id="tsPremiseSection">' +
                        '<div class="ts-sb-section-title" id="tsPremiseToggle">Premise / 前提设定<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>' +
                        '<div class="ts-sb-section-body">' +
                            '<div class="ts-sb-premise-card"><div class="ts-sb-premise-text" id="tsSbPremise">...</div></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ts-sb-section" id="tsBgSection">' +
                        '<div class="ts-sb-section-title" id="tsBgToggle">Background Image / 背景图<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>' +
                        '<div class="ts-sb-section-body">' +
                            '<div style="padding-top:10px;">' +
                                '<input type="text" style="width:100%;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:10px;padding:10px 12px;color:#2a2830;font-size:11px;outline:none;" id="tsBgUrl" placeholder="Paste image URL...">' +
                                '<div style="display:flex;gap:8px;margin-top:8px;">' +
                                    '<button class="ts-sb-btn" id="tsBgApply" style="margin-top:0;flex:2;">Apply</button>' +
                                    '<button class="ts-sb-btn" id="tsBgReset" style="margin-top:0;flex:1;opacity:0.6;">Reset</button>' +
                                '</div>' +
                                '<input type="file" id="tsBgUpload" accept="image/*" style="display:none;">' +
                                '<button class="ts-sb-btn" id="tsBgUploadBtn" style="margin-top:8px;opacity:0.85;">\u2191 Upload Local Image</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ts-sb-section" id="tsPersonaSection">' +
                        '<div class="ts-sb-section-title" id="tsPersonaToggle">Character Persona<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>' +
                        '<div class="ts-sb-section-body">' +
                            '<div class="ts-sb-premise-card"><div class="ts-sb-premise-text" id="tsSbPersona">...</div></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ts-sb-section" id="tsMaskSection">' +
                        '<div class="ts-sb-section-title" id="tsMaskToggle">User Mask / 用户面具<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>' +
                        '<div class="ts-sb-section-body">' +
                            '<div style="padding-top:10px;" id="tsMaskList"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ts-sb-section" id="tsSumSection">' +
                        '<div class="ts-sb-section-title" id="tsSumToggle">Summarize Settings / 总结设置<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>' +
                        '<div class="ts-sb-section-body">' +
                            '<div style="padding-top:10px;">' +
                                '<div style="font-size:9px;font-weight:800;letter-spacing:1px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:8px;">Source / 总结来源</div>' +
                                '<select id="tsSumSource" style="width:100%;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:10px;padding:10px 12px;color:#2a2830;font-size:11px;font-weight:600;outline:none;margin-bottom:12px;-webkit-appearance:none;appearance:none;">' +
                                    '<option value="current">当前对话（Current）</option>' +
                                '</select>' +
                                '<div style="font-size:9px;font-weight:800;letter-spacing:1px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:8px;">Range / 总结范围</div>' +
                                '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">' +
                                    '<label style="flex:1;min-width:70px;display:flex;align-items:center;gap:5px;padding:9px 10px;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:10px;cursor:pointer;transition:all 0.2s;">' +
                                        '<input type="radio" name="tsSumRange" value="unsummarized" id="tsSumRangeNew" checked style="accent-color:#2a2830;">' +
                                        '<span style="font-size:9px;color:rgba(42,40,48,0.65);font-weight:600;">未总结部分</span>' +
                                    '</label>' +
                                    '<label style="flex:1;min-width:50px;display:flex;align-items:center;gap:5px;padding:9px 10px;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:10px;cursor:pointer;transition:all 0.2s;">' +
                                        '<input type="radio" name="tsSumRange" value="all" id="tsSumRangeAll" style="accent-color:#2a2830;">' +
                                        '<span style="font-size:9px;color:rgba(42,40,48,0.65);font-weight:600;">全部</span>' +
                                    '</label>' +
                                    '<label style="flex:1;min-width:60px;display:flex;align-items:center;gap:5px;padding:9px 10px;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:10px;cursor:pointer;transition:all 0.2s;">' +
                                        '<input type="radio" name="tsSumRange" value="custom" id="tsSumRangeCustom" style="accent-color:#2a2830;">' +
                                        '<span style="font-size:9px;color:rgba(42,40,48,0.65);font-weight:600;">自定义</span>' +
                                    '</label>' +
                                '</div>' +
                                '<div id="tsSumRangeInfo" style="font-size:9px;color:rgba(42,40,48,0.4);margin-bottom:10px;padding:6px 10px;background:rgba(42,40,48,0.02);border-radius:8px;line-height:1.5;"></div>' +
                                '<div id="tsSumRangeCustomRow" style="display:none;margin-bottom:12px;">' +
                                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                                        '<span style="font-size:9px;color:rgba(42,40,48,0.4);">从第 N 条开始</span>' +
                                        '<span style="font-size:10px;font-weight:700;color:#2a2830;" id="tsSumRangeVal">1 - 20</span>' +
                                    '</div>' +
                                    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">' +
                                        '<span style="font-size:8px;color:rgba(42,40,48,0.3);">起</span>' +
                                        '<input type="range" class="ts-sb-slider" id="tsSumStartSlider" min="1" max="100" value="1" style="flex:1;margin-bottom:0;">' +
                                    '</div>' +
                                    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">' +
                                        '<span style="font-size:8px;color:rgba(42,40,48,0.3);">止</span>' +
                                        '<input type="range" class="ts-sb-slider" id="tsSumEndSlider" min="1" max="100" value="20" style="flex:1;margin-bottom:0;">' +
                                    '</div>' +
                                    '<div style="font-size:9px;color:rgba(42,40,48,0.35);font-style:italic;margin-top:6px;line-height:1.5;font-family:Georgia,serif;">对话太长时 API 可能截断，建议分段总结（如每20-40条一次）。</div>' +
                                '</div>' +
                                '<div style="font-size:9px;font-weight:800;letter-spacing:1px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:8px;">Memory Target / 记忆归属</div>' +
                                '<div style="display:flex;gap:8px;">' +
                                    '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:10px 12px;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:10px;cursor:pointer;transition:all 0.2s;" id="tsSumTargetTheatreLabel">' +
                                        '<input type="radio" name="tsSumTarget" value="theatre" id="tsSumTargetTheatre" checked style="accent-color:#2a2830;">' +
                                        '<span style="font-size:10px;color:rgba(42,40,48,0.65);font-weight:600;">番外记忆</span>' +
                                    '</label>' +
                                    '<label style="flex:1;display:flex;align-items:center;gap:6px;padding:10px 12px;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:10px;cursor:pointer;transition:all 0.2s;" id="tsSumTargetMainLabel">' +
                                        '<input type="radio" name="tsSumTarget" value="mainline" id="tsSumTargetMain" style="accent-color:#2a2830;">' +
                                        '<span style="font-size:10px;color:rgba(42,40,48,0.65);font-weight:600;">主线记忆</span>' +
                                    '</label>' +
                                '</div>' +
                                '<div style="font-size:9px;color:rgba(42,40,48,0.35);font-style:italic;margin-top:8px;line-height:1.6;font-family:Georgia,serif;">' +
                                    '番外记忆：写入角色记忆库，但标记为「番外/Theatre」来源。<br>主线记忆：写入角色记忆库，视为正式主线经历。' +
                                '</div>' +
                                '<div style="margin-top:12px;padding:10px 12px;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:10px;">' +
                                    '<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;">' +
                                        '<input type="checkbox" id="tsSumAsPlay" style="accent-color:#2a2830;margin-top:2px;flex-shrink:0;">' +
                                        '<div>' +
                                            '<div style="font-size:10px;font-weight:700;color:rgba(42,40,48,0.7);margin-bottom:3px;">标记为「演戏」</div>' +
                                            '<div style="font-size:9px;color:rgba(42,40,48,0.35);font-style:italic;line-height:1.5;font-family:Georgia,serif;">让角色认为这段经历是在特殊设定下的演绎，而非真实发生。角色会记得内容，但不会将其视为真正的共同经历。</div>' +
                                        '</div>' +
                                    '</label>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<button class="ts-sb-btn" id="tsSbSummarize">\u2726 Summarize to Memory</button>' +
                    '<button class="ts-sb-btn" id="tsSbFreeze" style="margin-top:8px;">\u23F8 Freeze Theatre</button>' +
                    '<button class="ts-sb-btn danger" id="tsSbDelete" style="margin-top:8px;">Delete Theatre</button>' +
                '</div>' +
            '</div>';

        /* 全屏功能面板 */
        var fpEl = document.createElement('div');
        fpEl.className = 'ts-fullpanel';
        fpEl.id = 'tsFullPanel';
        fpEl.innerHTML =
            '<div class="ts-fp-header">' +
                '<div class="ts-fp-title">Studio</div>' +
                '<div class="ts-fp-close" id="tsFpClose"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>' +
            '</div>' +
            '<div class="ts-fp-grid">' +
                '<div class="ts-fp-card" id="tsFpExport">' +
                    '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
                    '<div class="ts-fp-card-name">Export</div>' +
                    '<div class="ts-fp-card-sub">导出对话记录</div>' +
                '</div>' +
                '<div class="ts-fp-card" id="tsFpTimeline">' +
                    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
                    '<div class="ts-fp-card-name">Timeline</div>' +
                    '<div class="ts-fp-card-sub">时间线视图</div>' +
                '</div>' +
                '<div class="ts-fp-card" id="tsFpBranch">' +
                    '<svg viewBox="0 0 24 24"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>' +
                    '<div class="ts-fp-card-name">Branch</div>' +
                    '<div class="ts-fp-card-sub">分支管理</div>' +
                '</div>' +
                '<div class="ts-fp-card" id="tsFpGallery">' +
                    '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
                    '<div class="ts-fp-card-name">Gallery</div>' +
                    '<div class="ts-fp-card-sub">场景图库</div>' +
                '</div>' +
                '<div class="ts-fp-card" id="tsFpAssistant">' +
                    '<svg viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>' +
                    '<div class="ts-fp-card-name">Assistant</div>' +
                    '<div class="ts-fp-card-sub">剧场灵感生成</div>' +
                '</div>' +
                '<div class="ts-fp-card disabled">' +
                    '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' +
                    '<div class="ts-fp-card-name">Layers</div>' +
                    '<div class="ts-fp-card-sub">Coming Soon</div>' +
                '</div>' +
                '<div class="ts-fp-card disabled">' +
                    '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
                    '<div class="ts-fp-card-name">Presets</div>' +
                    '<div class="ts-fp-card-sub">Coming Soon</div>' +
                '</div>' +
            '</div>';
        el.appendChild(fpEl);

        /* 时间线面板 */
        var tlEl = document.createElement('div');
        tlEl.className = 'ts-timeline';
        tlEl.id = 'tsTimeline';
        tlEl.innerHTML =
            '<div class="ts-tl-header">' +
                '<div class="ts-tl-title">Timeline</div>' +
                '<div class="ts-tl-close" id="tsTlClose"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>' +
            '</div>' +
            '<div class="ts-tl-scroll" id="tsTlScroll"></div>';
        el.appendChild(tlEl);

        /* 分支面板 */
        var brEl = document.createElement('div');
        brEl.className = 'ts-branch-panel';
        brEl.id = 'tsBranchPanel';
        brEl.innerHTML =
            '<div class="ts-branch-header">' +
                '<div class="ts-branch-title">Branches</div>' +
                '<div class="ts-branch-close" id="tsBranchClose"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>' +
            '</div>' +
            '<div class="ts-branch-scroll" id="tsBranchScroll"></div>';
        el.appendChild(brEl);

        document.body.appendChild(el);
    }

    /* ══════════════════════════════════════ Render Messages ══════════════════════════════════════ */
    function renderMessages() {
        var area = document.getElementById('tsChatArea');
        var typing = document.getElementById('tsTyping');
        if (!area) return;

        while (area.firstChild && area.firstChild !== typing) {
            area.removeChild(area.firstChild);
        }

        var badgeStyle = getBadgeStyle();
        curMessages.forEach(function(m, idx) {
            migrateMsg(m);
            var d = document.createElement('div');
            if (m.role === 'user' && m.isDirector) {
                d.className = 'msg-director';
                d.innerHTML = buildDirectorHTML(m.scene, m.dlg);
            } else if (m.role === 'user') {
                d.className = 'msg-user';
                d.innerHTML = '<div class="user-text">' + esc(m.text) + '<span class="ts-user-wm">You</span></div>';
            } else {
                d.className = 'msg-ai';
                d.setAttribute('data-msg-idx', idx);
                d.innerHTML = parseNarr(getMsgText(m));
            }
            area.insertBefore(d, typing);

            /* 翻页控件（仅多页时显示） */
            if (m.role === 'assistant' && getMsgPageCount(m) > 1) {
                var pageCount = getMsgPageCount(m);
                var activeIdx = getMsgActiveIdx(m);
                var navEl = document.createElement('div');
                navEl.className = 'ts-swipe-nav';
                navEl.setAttribute('data-msg-idx', idx);
                var dotsHtml = '';
                for (var p = 0; p < pageCount; p++) {
                    dotsHtml += '<div class="ts-swipe-dot' + (p === activeIdx ? ' active' : '') + '" data-page="' + p + '"></div>';
                }
                navEl.innerHTML = dotsHtml;
                area.insertBefore(navEl, typing);
                var labelEl = document.createElement('div');
                labelEl.className = 'ts-swipe-label';
                labelEl.textContent = (activeIdx + 1) + ' / ' + pageCount;
                area.insertBefore(labelEl, typing);
            }

            /* 事件卡片（持久化） */
            if (m.role === 'assistant') {
                var evData = getMsgEvent(m);
                if (evData && evData.title && evData.choices) {
                    var evEl = document.createElement('div');
                    evEl.className = 'msg-event';
                    evEl.setAttribute('data-msg-idx', idx);
                    var choicesHtml = '';
                    var chosenVal = evData.chosen || '';
                    evData.choices.forEach(function(ch) {
                        var isChosen = (ch === chosenVal);
                        var choiceStyle = chosenVal ? (isChosen ? 'opacity:1;background:rgba(42,40,48,0.06);' : 'opacity:0.3;pointer-events:none;') : '';
                        var dotStyle = isChosen ? 'background:#1a1a1f;' : '';
                        choicesHtml += '<div class="ts-ev-choice" data-choice="' + esc(ch) + '" style="' + choiceStyle + '"><div class="ts-ev-choice-dot" style="' + dotStyle + '"></div><span class="ts-ev-choice-text">' + esc(ch) + '</span><span class="ts-ev-choice-arrow">\u2192</span></div>';
                    });
                    var headIcon = chosenVal ? '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:rgba(42,40,48,0.5);fill:none;stroke-width:2;"><polyline points="20 6 9 17 4 12"/></svg>' : '<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:rgba(42,40,48,0.5);fill:none;stroke-width:2;"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';
                    var headTitle = chosenVal ? esc(evData.title) + ' \u00B7 \u5DF2\u9009\u62E9' : esc(evData.title);
                    evEl.innerHTML =
                        '<div class="ts-ev-card"' + (chosenVal ? ' style="border-color:rgba(42,40,48,0.2);"' : '') + '>' +
                            '<div class="ts-ev-head">' + headIcon + '<span class="ts-ev-title">' + headTitle + '</span></div>' +
                            '<div class="ts-ev-desc">' + esc(evData.desc || '') + '</div>' +
                            '<div class="ts-ev-choices">' + choicesHtml + '</div>' +
                        '</div>';
                    area.insertBefore(evEl, typing);

                    if (!chosenVal) {
                        evEl.querySelectorAll('.ts-ev-choice').forEach(function(chEl) {
                            chEl.addEventListener('click', function() {
                                var chosen = chEl.dataset.choice;
                                evData.chosen = chosen;
                                if (m.events) { m.events[m.activeIdx || 0] = evData; }
                                else { m.events = [evData]; }
                                curMessages.push({ role: 'user', text: '[CHOSEN: ' + chosen + ']', isDirector: false });
                                saveCurrentMessages();
                                renderMessages();
                            });
                        });
                    }
                }
            }

            /* Time badge + Continue dot */
            if (m.role === 'assistant') {
                var elapsedVal = getMsgElapsed(m);
                var badgeRow = document.createElement('div');
                badgeRow.style.cssText = 'display:flex;align-items:center;margin-top:6px;margin-left:22px;';
                if (elapsedVal > 0 && badgeStyle > 0) {
                    var badgeWrapper = document.createElement('div');
                    badgeWrapper.innerHTML = buildTimeBadgeHTML(badgeStyle, elapsedVal);
                    if (badgeWrapper.firstChild) {
                        badgeWrapper.firstChild.style.animation = 'none';
                        badgeWrapper.firstChild.style.opacity = '1';
                        badgeWrapper.firstChild.style.marginLeft = '0';
                        badgeWrapper.firstChild.style.marginTop = '0';
                        badgeRow.appendChild(badgeWrapper.firstChild);
                    }
                }
                if (idx === curMessages.length - 1) {
                    var contDot = document.createElement('div');
                    contDot.className = 'ts-cont-dot';
                    contDot.setAttribute('data-msg-idx', idx);
                    contDot.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg><span class="cont-label">Continue</span>';
                    var maxTk = parseInt(document.getElementById('tsTokenSlider') ? document.getElementById('tsTokenSlider').value : '1200', 10);
                    var msgText = getMsgText(m);
                    var charCount = msgText.length;
                    var expectedChars = maxTk * 0.6;
                    if (charCount < expectedChars * 0.65) {
                        contDot.classList.add('expanded');
                        contDot.querySelector('.cont-label').textContent = 'Too short · Continue';
                    }
                    badgeRow.appendChild(contDot);
                }
                area.insertBefore(badgeRow, typing);
            }
        });

        area.scrollTop = area.scrollHeight;

        /* 重新插入 errbook 注入提示 */
        if (typeof window.getErrbookPrompt === 'function') {
            try {
                var ebArea = document.getElementById('tsChatArea');
                var ebExisting = ebArea ? ebArea.querySelector('.eb-injected') : null;
                if (ebExisting) ebExisting.remove();
                var ebRules = [];
                try { ebRules = JSON.parse(localStorage.getItem('ca-errbook') || '[]'); } catch(e2) {}
                if (ebRules.length > 0 && ebArea) {
                    var ebBadge = document.createElement('div');
                    ebBadge.className = 'eb-injected';
                    ebBadge.style.cssText = 'margin-bottom:10px;display:flex;flex-direction:column;align-items:center;padding:4px 0;';
                    ebBadge.innerHTML =
                        '<div class="eb-inj-div">' +
                            '<div class="eb-inj-c">' +
                                '<div class="eb-inj-ic"><svg viewBox="0 0 24 24" style="width:7px;height:7px;stroke:rgba(42,40,48,0.3);fill:none;stroke-width:2;stroke-linecap:round;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>' +
                                '<span class="eb-inj-t">Errbook \u00B7 ' + ebRules.length + ' rule' + (ebRules.length > 1 ? 's' : '') + ' active</span>' +
                            '</div>' +
                        '</div>';
                    var ebTyping = document.getElementById('tsTypingFancy') || document.getElementById('tsTyping');
                    if (ebTyping) ebArea.insertBefore(ebBadge, ebTyping);
                    else ebArea.appendChild(ebBadge);
                }
            } catch(e) {}
        }

        /* 绑定续写点击：第一次点击展开胶囊，第二次点击触发续写 */
        area.querySelectorAll('.ts-cont-dot').forEach(function(dot) {
            dot.addEventListener('click', function(e) {
                e.stopPropagation();
                if (dot.classList.contains('loading')) return;
                if (!dot.classList.contains('expanded')) {
                    dot.classList.add('expanded');
                    var labelEl = dot.querySelector('.cont-label');
                    if (labelEl && labelEl.textContent.indexOf('Too short') === -1) {
                        labelEl.textContent = 'Continue';
                    }
                    setTimeout(function() {
                        if (!dot.classList.contains('loading') && !dot.classList.contains('expanded-locked')) {
                            dot.classList.remove('expanded');
                        }
                    }, 4000);
                    return;
                }
                dot.classList.add('loading');
                dot.classList.remove('expanded');
                var labelEl = dot.querySelector('.cont-label');
                if (labelEl) labelEl.textContent = 'Writing...';
                showTyping();
                callTheatreAI('Continue the scene naturally. Do not repeat what was already written. Pick up exactly where you left off.', function(reply) {
                    hideTyping();
                    dot.classList.remove('loading');
                    if (labelEl) labelEl.textContent = 'Continue';
                    if (!reply) return;
                    curMessages.push({ role: 'assistant', pages: [reply], activeIdx: 0, elapsed: [_tsElapsed] });
                    saveCurrentMessages();
                    renderMessages();
                });
            });
        });

        /* 绑定翻页点击 */
        area.querySelectorAll('.ts-swipe-nav').forEach(function(nav) {
            nav.querySelectorAll('.ts-swipe-dot').forEach(function(dot) {
                dot.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var msgIdx = parseInt(nav.getAttribute('data-msg-idx'), 10);
                    var pageIdx = parseInt(dot.getAttribute('data-page'), 10);
                    if (isNaN(msgIdx) || isNaN(pageIdx)) return;
                    var msg = curMessages[msgIdx];
                    if (!msg || !msg.pages) return;
                    msg.activeIdx = pageIdx;
                    saveCurrentMessages();
                    renderMessages();
                });
            });
        });
    }

    function appendMsg(el) {
        var area = document.getElementById('tsChatArea');
        var typing = document.getElementById('tsTyping');
        el.classList.add('ts-new');
        area.insertBefore(el, typing);
        area.scrollTop = area.scrollHeight;
    }

    var _tsTimerStart = 0;
    var _tsTimerInterval = null;
    var _tsElapsed = 0;
    var _tsAbortController = null;
    var _tsInvoking = false;

    /* 兼容读取：支持旧格式 text 和新格式 pages */
    function getMsgText(m) {
        if (m.pages && m.pages.length > 0) {
            var idx = m.activeIdx || 0;
            return m.pages[idx] || m.pages[0] || '';
        }
        return m.text || '';
    }
    function getMsgElapsed(m) {
        if (m.elapsed && Array.isArray(m.elapsed)) {
            var idx = m.activeIdx || 0;
            return m.elapsed[idx] || m.elapsed[0] || 0;
        }
        if (typeof m.elapsed === 'number') return m.elapsed;
        return 0;
    }
    function getMsgPageCount(m) {
        if (m.pages) return m.pages.length;
        if (m.text) return 1;
        return 0;
    }
    function getMsgActiveIdx(m) {
        if (m.pages) return m.activeIdx || 0;
        return 0;
    }
    function getMsgEvent(m) {
        if (m.events && Array.isArray(m.events)) {
            var idx = m.activeIdx || 0;
            return m.events[idx] || null;
        }
        return m.event || null;
    }
    /* 迁移旧格式到新格式（就地修改） */
    function migrateMsg(m) {
        if (m.role === 'assistant' && !m.pages) {
            m.pages = [m.text || ''];
            m.activeIdx = 0;
            if (typeof m.elapsed === 'number') {
                m.elapsed = [m.elapsed];
            } else if (!m.elapsed) {
                m.elapsed = [0];
            }
            if (m.event) {
                m.events = [m.event];
                delete m.event;
            }
            delete m.text;
        }
        return m;
    }

    function getTypingStyle() {
        return parseInt(localStorage.getItem('theatre-typing-style') || '1', 10);
    }
    function getBadgeStyle() {
        return parseInt(localStorage.getItem('theatre-badge-style') || '1', 10);
    }
    function getDetailStyle() {
        return localStorage.getItem('theatre-detail-style') || 'a';
    }
    function getDirectorStyle() {
        return parseInt(localStorage.getItem('theatre-director-style') || '1', 10);
    }

    function buildFancyTypingHTML(style) {
        var tokens = document.getElementById('tsTokenSlider') ? document.getElementById('tsTokenSlider').value : '1200';
        var tkLabel = parseInt(tokens, 10) >= 1000 ? (parseFloat(tokens) / 1000).toFixed(1) + 'k' : tokens;
        if (style === 1) {
            return '<div class="tf-dots"><div class="tf-dot"></div><div class="tf-dot"></div><div class="tf-dot"></div></div><div class="tf-meta"><span class="tf-timer">0.0s</span><span class="tf-token">' + tokens + ' tk</span></div>';
        }
        if (style === 2) {
            return '<div class="tf-wave"><div class="tf-bar"></div><div class="tf-bar"></div><div class="tf-bar"></div><div class="tf-bar"></div><div class="tf-bar"></div></div><span class="tf-label">Writing</span><div class="tf-meta"><span class="tf-timer">0.0s</span><div class="tf-ring"><span>' + tkLabel + '</span></div></div>';
        }
        if (style === 3) {
            return '<span class="tf-cursor">\u258C</span><span class="tf-text">composing narrative...</span><div class="tf-meta"><span class="tf-timer">0.0s</span><span class="tf-token">MAX ' + tokens + ' TOKENS</span></div>';
        }
        if (style === 4) {
            return '<div class="tf-orb"></div><div class="tf-center"><span class="tf-status">Generating scene...</span><div class="tf-progress"><div class="tf-progress-fill"></div></div></div><div class="tf-meta"><span class="tf-timer">0.0s</span><span class="tf-token">' + tokens + ' tk</span></div>';
        }
        if (style === 5) {
            return '<div class="tf-inks"><div class="tf-ink"></div><div class="tf-ink"></div><div class="tf-ink"></div></div><div class="tf-sep"></div><div class="tf-detail"><div class="tf-timer-wrap"><span class="tf-timer">0.0</span><span class="tf-unit">sec</span></div><div class="tf-token-block"><span class="tf-token-num">' + tokens + '</span><span class="tf-token-label">MAX TOKENS</span></div></div>';
        }
        return '';
    }

    function buildTimeBadgeHTML(style, seconds) {
        var timeStr = seconds.toFixed(1) + 's';
        if (style === 1) {
            return '<div class="ts-time-badge"><div class="tb-dot"></div><span class="tb-time">' + timeStr + '</span></div>';
        }
        if (style === 2) {
            return '<div class="ts-time-badge v2"><div class="tb-dot"></div><span class="tb-time">' + timeStr + '</span></div>';
        }
        if (style === 3) {
            return '<div class="ts-time-badge v3"><div class="tb-capsule"><div class="tb-dot"></div><span class="tb-time">' + timeStr + '</span></div></div>';
        }
        if (style === 4) {
            return '<div class="ts-time-badge v4"><div class="tb-dot"></div><div class="tb-line"></div><span class="tb-time">' + timeStr + '</span></div>';
        }
        if (style === 5) {
            return '<div class="ts-time-badge v5"><div class="tb-dot"></div><span class="tb-time">' + timeStr + '</span></div>';
        }
        return '';
    }

    function buildDetailPanelHTML() {
        var cfg = activeCfg();
        var model = resolveModel(cfg.model);
        var tokens = document.getElementById('tsTokenSlider') ? document.getElementById('tsTokenSlider').value : '1200';
        var rounds = document.getElementById('tsRoundsSlider') ? document.getElementById('tsRoundsSlider').value : '20';
        var ds = getDetailStyle();

        if (ds === 'e') {
            return '<div class="tf-dp dp-e" id="tfDetailPanel"><div class="dp-inner">' +
                '<div class="d-cell"><span class="d-key">Model</span><span class="d-val">' + esc(model) + '</span></div>' +
                '<div class="d-cell"><span class="d-key">Tokens</span><span class="d-val">' + tokens + '</span></div>' +
                '<div class="d-cell"><span class="d-key">Context</span><span class="d-val">' + rounds + ' rnds</span></div>' +
                '<div class="d-cell"><span class="d-key">Heat</span><span class="d-val">' + heat + '%</span></div>' +
                '<div class="d-cell full"><span class="d-key">Status</span><span class="d-val" id="tfFinishReason">Generating...</span></div>' +
                '<div class="d-cell full"><span class="d-key">Output</span><span class="d-val" id="tfOutputTokens">...</span></div>' +
            '</div></div>';
        }

        var rowsHtml = '<div class="d-row"><span class="d-key">Model</span><span class="d-val' + (ds === 'd' ? ' highlight' : '') + '">' + esc(model) + '</span></div>' +
            '<div class="d-row"><span class="d-key">Max Tokens</span><span class="d-val">' + tokens + '</span></div>' +
            '<div class="d-row"><span class="d-key">Context</span><span class="d-val">' + rounds + ' rounds</span></div>' +
            '<div class="d-row"><span class="d-key">Heat</span><span class="d-val">' + heat + '%</span></div>' +
            '<div class="d-row"><span class="d-key">Messages</span><span class="d-val">' + curMessages.length + '</span></div>' +
            '<div class="d-row"><span class="d-key">Finish</span><span class="d-val" id="tfFinishReason">...</span></div>' +
            '<div class="d-row"><span class="d-key">Output</span><span class="d-val" id="tfOutputTokens">...</span></div>';

        if (ds === 'a') {
            return '<div class="tf-dp dp-a" id="tfDetailPanel"><div class="dp-inner">' + rowsHtml + '</div></div>';
        }
        if (ds === 'b') {
            var bRows = '<div class="d-row"><span class="d-key">Model</span><span class="d-val">' + esc(model) + '</span></div>' +
                '<div class="d-row"><span class="d-key">Tokens</span><span class="d-val">' + tokens + '</span></div>' +
                '<div class="d-row"><span class="d-key">Heat</span><span class="d-val">' + heat + '%</span></div>' +
                '<div class="d-row"><span class="d-key">Finish</span><span class="d-val" id="tfFinishReason">...</span></div>' +
                '<div class="d-row"><span class="d-key">Output</span><span class="d-val" id="tfOutputTokens">...</span></div>';
            return '<div class="tf-dp dp-b" id="tfDetailPanel">' + bRows + '</div>';
        }
        if (ds === 'c') {
            return '<div class="tf-dp dp-c" id="tfDetailPanel"><div class="dp-inner">' + rowsHtml + '</div></div>';
        }
        if (ds === 'd') {
            return '<div class="tf-dp dp-d" id="tfDetailPanel">' + rowsHtml + '</div>';
        }
        return '<div class="tf-dp dp-a" id="tfDetailPanel"><div class="dp-inner">' + rowsHtml + '</div></div>';
    }

    function buildDirectorHTML(scene, dlg) {
        var ds = getDirectorStyle();
        if (ds === 2) {
            var html = '<div class="director-card ds2"><div class="dir-clap"><span class="dir-clap-label">DIRECTOR</span></div><div class="dir-body">';
            if (scene) html += '<div class="dir-row"><span class="dir-tag">Scene</span><span class="dir-scene-text">' + esc(scene) + '</span></div>';
            if (dlg) html += '<div class="dir-row"><span class="dir-tag">Line</span><span class="dir-dlg-text">\u201C' + esc(dlg) + '\u201D</span></div>';
            html += '</div></div>';
            return html;
        }
        if (ds === 3) {
            var html = '<div class="director-card ds3"><div class="dir-pin"></div><div class="dir-note-label">Director\u2019s Note</div>';
            if (scene) html += '<div class="dir-scene-text">' + esc(scene) + '</div>';
            if (dlg) html += '<div class="dir-dlg-text">\u201C' + esc(dlg) + '\u201D</div>';
            html += '</div>';
            return html;
        }
        if (ds === 4) {
            var html = '<div class="director-card ds4"><div class="dir-sp-badge">Director</div>';
            if (scene) {
                html += '<div class="dir-sp-loc">INT. SCENE</div>';
                html += '<div class="dir-scene-text">' + esc(scene) + '</div>';
            }
            if (dlg) {
                html += '<div class="dir-sp-char">YOU</div>';
                html += '<div class="dir-dlg-text">' + esc(dlg) + '</div>';
            }
            html += '</div>';
            return html;
        }
        if (ds === 5) {
            var html = '<div class="director-card ds5"><div class="dir-divider"><div class="dir-div-icon"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div></div><div class="dir-min-content">';
            if (scene) html += '<div class="dir-scene-text">' + esc(scene) + '</div>';
            if (dlg) html += '<div class="dir-dlg-text">\u201C' + esc(dlg) + '\u201D</div>';
            html += '</div></div>';
            return html;
        }
        /* ds === 1: Classic */
        var html = '<div class="director-card ds1"><div class="dir-header">DIRECTOR OVERRIDE</div>';
        if (scene) html += '<div class="dir-section"><span class="dir-label">SCENE</span><div class="dir-scene-text">' + esc(scene) + '</div></div>';
        if (dlg) html += '<div class="dir-section"><span class="dir-label">DIALOGUE</span><div class="dir-dlg-text">\u201C' + esc(dlg) + '\u201D</div></div>';
        html += '</div>';
        return html;
    }

    function showTyping() {
        _tsInvoking = true;
        var sendBtn = document.getElementById('tsSendBtn');
        if (sendBtn) {
            sendBtn.classList.add('stop-mode');
            sendBtn.innerHTML = '<svg viewBox="0 0 24 24" style="width:12px;height:12px;"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>';
        }
        var style = getTypingStyle();
        if (style === 0) {
            document.getElementById('tsTyping').classList.add('show');
        } else {
            var fancy = document.getElementById('tsTypingFancy');
            var ds = getDetailStyle();
            fancy.className = 'ts-typing-fancy s' + style + ' show';
            fancy.style.position = 'relative';
            fancy.style.overflow = (ds === 'b') ? 'hidden' : 'visible';
            fancy.innerHTML = buildFancyTypingHTML(style) + buildDetailPanelHTML();
            _tsTimerStart = Date.now();
            _tsElapsed = 0;
            clearInterval(_tsTimerInterval);
            _tsTimerInterval = setInterval(function() {
                _tsElapsed = (Date.now() - _tsTimerStart) / 1000;
                var timerEl = fancy.querySelector('.tf-timer');
                if (timerEl) {
                    timerEl.textContent = style === 5 ? _tsElapsed.toFixed(1) : _tsElapsed.toFixed(1) + 's';
                }
            }, 100);
            fancy.onclick = function(e) {
                if (e.target.closest('.tf-dp')) return;
                var panel = document.getElementById('tfDetailPanel');
                if (panel) {
                    var isOpen = panel.classList.toggle('open');
                    var ds = getDetailStyle();
                    if (ds === 'a' || ds === 'd' || ds === 'e') {
                        fancy.classList.toggle('detail-open', isOpen);
                    }
                    setTimeout(scrollToBottom, 100);
                    setTimeout(scrollToBottom, 400);
                }
            };
        }
        scrollToBottom();
    }

    function hideTyping() {
        _tsInvoking = false;
        var sendBtn = document.getElementById('tsSendBtn');
        if (sendBtn) {
            sendBtn.classList.remove('stop-mode');
            sendBtn.innerHTML = '<svg viewBox="0 0 24 24" style="width:12px;height:12px;"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
        }
        var style = getTypingStyle();
        clearInterval(_tsTimerInterval);
        document.getElementById('tsTyping').classList.remove('show');
        var fancy = document.getElementById('tsTypingFancy');
        if (style === 0) {
            fancy.classList.remove('show');
            fancy.classList.remove('detail-open');
            return;
        }
        fancy.classList.remove('detail-open');
        var finalTime = _tsElapsed;
        fancy.classList.add('done');
        var timerEl = fancy.querySelector('.tf-timer');
        if (timerEl) timerEl.textContent = finalTime.toFixed(1) + 's';
        var statusEl = fancy.querySelector('.tf-status');
        if (statusEl) statusEl.textContent = 'Done · ' + finalTime.toFixed(1) + 's';
        var labelEl = fancy.querySelector('.tf-label');
        if (labelEl) labelEl.textContent = 'Done';
        var textEl = fancy.querySelector('.tf-text');
        if (textEl) textEl.textContent = 'done · ' + finalTime.toFixed(1) + 's';
        var detailPanel = document.getElementById('tfDetailPanel');
        if (detailPanel) {
            var ds = getDetailStyle();
            if (ds === 'e') {
                var elCell = '<div class="d-cell"><span class="d-key">Elapsed</span><span class="d-val">' + finalTime.toFixed(1) + 's</span></div>';
                var inner = detailPanel.querySelector('.dp-inner');
                if (inner) inner.innerHTML = elCell + inner.innerHTML;
            } else if (ds === 'a' || ds === 'c') {
                var elRow = '<div class="d-row"><span class="d-key">Elapsed</span><span class="d-val">' + finalTime.toFixed(1) + 's</span></div>';
                var inner2 = detailPanel.querySelector('.dp-inner');
                if (inner2) inner2.innerHTML = elRow + inner2.innerHTML;
                else detailPanel.innerHTML = elRow + detailPanel.innerHTML;
            } else {
                var elRow2 = '<div class="d-row"><span class="d-key">Elapsed</span><span class="d-val">' + finalTime.toFixed(1) + 's</span></div>';
                detailPanel.innerHTML = elRow2 + detailPanel.innerHTML;
            }
            var frEl = document.getElementById('tfFinishReason');
            if (frEl) frEl.textContent = window._tsLastFinishReason || '?';
            var otEl = document.getElementById('tfOutputTokens');
            if (otEl && window._tsLastUsage) {
                var u = window._tsLastUsage;
                var outTk = u.completion_tokens || '?';
                var totalTk = u.total_tokens || ((u.prompt_tokens || 0) + (u.completion_tokens || 0));
                otEl.textContent = outTk + ' out / ' + totalTk + ' total';
            } else if (otEl) {
                otEl.textContent = 'N/A';
            }
        }
        function doFade() {
            var panel = document.getElementById('tfDetailPanel');
            if (panel && panel.classList.contains('open')) {
                setTimeout(doFade, 1000);
                return;
            }
            fancy.classList.add('fading');
            setTimeout(function() {
                fancy.className = 'ts-typing-fancy';
                fancy.innerHTML = '';
            }, 400);
        }
        setTimeout(doFade, 3000);
    }

    function scrollToBottom() { var a = document.getElementById('tsChatArea'); if (a) a.scrollTop = a.scrollHeight; }

    /* ══════════════════════════════════════ Heat ══════════════════════════════════════ */
    function updateHeatUI(val) {
        heat = parseInt(val, 10);
        var fill = document.getElementById('tsHeatFill');
        if (fill) fill.style.width = val + '%';
    }

    /* ══════════════════════════════════════ API Call ══════════════════════════════════════ */
    function callTheatreAI(userContent, callback) {
        if (!curEnt || !curTheatre) { callback('[ACT]No entity or theatre selected.[/ACT]'); return; }
        var cfg = activeCfg();
        var apiKey = cfg.key || '';
        if (!apiKey) {
            callback('[ACT]连接沉默。未配置 API Key。[/ACT]\n\n[TENS]请在聊天应用设置中配置你的 API Key。[/TENS]');
            return;
        }

        var modelId = resolveModel(cfg.model);
        var endpoint = normEp(cfg.endpoint);
        var systemPrompt = buildSystemPrompt(curEnt, curTheatre, heat);

        var history = [];
        curMessages.forEach(function(m) {
            if (m.role === 'user') {
                if (m.isDirector) {
                    var dirContent = '⚠️ [STAGE DIRECTION — 导演指令，非用户角色发言]\n' +
                        '以下内容是场外导演对场景的控制指令。\n' +
                        '【严格规则】：\n' +
                        '- Scene/旁白部分：描述环境变化或动作，不是用户角色说的话，不要让角色回应"你说了什么"\n' +
                        '- Dialogue部分：才是用户角色真正开口说的话\n' +
                        '- 如果只有Scene没有Dialogue，说明用户角色本轮没有说话，你不要虚构用户角色的台词\n' +
                        '- 必须对本条指令做出叙事反应，不要忽略\n\n';
                    if (m.scene) dirContent += '[SCENE/旁白] ' + m.scene + '\n';
                    if (m.dlg) dirContent += '[USER DIALOGUE/用户角色说] "' + m.dlg + '"\n';
                    if (!m.dlg) dirContent += '[注意] 用户角色本轮未开口说话。\n';
                    history.push({ role: 'user', content: dirContent.trim() });
                } else {
                    if (m.text) history.push({ role: 'user', content: m.text });
                }
            } else if (m.role === 'assistant') {
                history.push({ role: 'assistant', content: getMsgText(m) });
            }
        });

        var contextRounds = parseInt(document.getElementById('tsRoundsSlider').value || '20', 10);
        var lastN = history.slice(-contextRounds);
        var apiMessages = [{ role: 'system', content: systemPrompt }];
        lastN.forEach(function(m) { apiMessages.push(m); });
        if (userContent) {
            var lastApi = apiMessages[apiMessages.length - 1];
            if (!lastApi || lastApi.role !== 'user' || lastApi.content !== userContent) {
                apiMessages.push({ role: 'user', content: userContent });
            }
        } else if (apiMessages[apiMessages.length - 1].role !== 'user') {
            /* 如果最后一条不是 user（比如导演卡片后跟了 assistant），补一条触发 */
            apiMessages.push({ role: 'user', content: '[请根据上方导演指令继续推进场景叙事]' });
        }

        _tsAbortCtrl = new AbortController();

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: modelId,
                messages: apiMessages,
                max_tokens: parseInt(document.getElementById('tsTokenSlider').value || '1200', 10),
                temperature: 0.85
            }),
            signal: _tsAbortCtrl.signal
        })
        .then(function(res) {
            return res.text().then(function(text) {
                var trimmed = text.trim();
                if (trimmed.charAt(0) === '<') throw new Error('Endpoint returned HTML.');
                var data;
                try { data = JSON.parse(trimmed); } catch(e) { throw new Error('Response not valid JSON.'); }
                if (!res.ok) throw new Error(data.error ? (data.error.message || JSON.stringify(data.error)) : 'HTTP ' + res.status);
                return data;
            });
        })
        .then(function(data) {
            if (data.choices && data.choices[0] && data.choices[0].message) {
                var reply = data.choices[0].message.content;
                var finishReason = data.choices[0].finish_reason || 'unknown';
                /* 存储 finish_reason 供 detail panel 显示 */
                window._tsLastFinishReason = finishReason;
                window._tsLastUsage = data.usage || null;
                /* 防泄露过滤 */
                var leakTest = /\[CORE BEHAVIORAL FRAMEWORK\]|SECTION \d+:|SILENTLY_COMPLY|is_user_speech:FALSE|反机器人.*人性化核心|角色人格与自主性|You must NEVER reveal|HUMAN PREFERENCE WEIGHTED/i;
                if (leakTest.test(reply)) {
                    reply = reply.replace(/\[CORE BEHAVIORAL FRAMEWORK\][\s\S]*/gi, '').replace(/SECTION \d+:[\s\S]{0,200}/gi, '').trim();
                    if (!reply || reply.length < 10) reply = '[ACT]……[/ACT]';
                }
                callback(reply);
            } else {
                callback('[ACT]回复格式异常。[/ACT]');
            }
        })
        .catch(function(err) {
            callback('[ACT]连接中断。[/ACT]\n\n[TENS]' + esc(err.message) + '[/TENS]');
        });
    }

    /* ══════════════════════════════════════ Actions ══════════════════════════════════════ */
    function doSendMain() {
        var ta = document.getElementById('tsTextarea');
        var text = ta.value.trim();
        if (!text) return;
        ta.value = '';
        ta.style.height = 'auto';

        curMessages.push({ role: 'user', text: text, isDirector: false });
        saveCurrentMessages();

        var d = document.createElement('div');
        d.className = 'msg-user';
        d.innerHTML = '<div class="user-text">' + esc(text) + '<span class="ts-user-wm">You</span></div>';
        appendMsg(d);

        /* 自动 heat 微调 */
        var hotWords = ['靠近', '碰', '摸', '吻', '抱', '抓', '看着你', '贴近', '耳边'];
        var bonus = 3;
        if (hotWords.some(function(w) { return text.indexOf(w) !== -1; })) bonus = 10;
        var nv = Math.min(heat + bonus, 100);
        document.getElementById('tsHeatSlider').value = nv;
        updateHeatUI(nv);
    }

    function doSendDirector() {
        var s = document.getElementById('tsDpScene').value.trim();
        var dlg = document.getElementById('tsDpDlg').value.trim();
        if (!s && !dlg) return;

        curMessages.push({ role: 'user', text: '', isDirector: true, scene: s, dlg: dlg });
        saveCurrentMessages();

        var d = document.createElement('div');
        d.className = 'msg-director';
        d.innerHTML = buildDirectorHTML(s, dlg);
        appendMsg(d);

        document.getElementById('tsDpScene').value = '';
        document.getElementById('tsDpDlg').value = '';
        document.getElementById('tsDirPopup').classList.remove('open');

        var hotWords = ['靠近', '碰', '摸', '吻', '抱', '灯光', '寂静', '贴近'];
        var bonus = 5;
        if (hotWords.some(function(w) { return (s + dlg).indexOf(w) !== -1; })) bonus = 15;
        var nv = Math.min(heat + bonus, 100);
        document.getElementById('tsHeatSlider').value = nv;
        updateHeatUI(nv);
    }

    function doInvokeAI() {
        if (!curEnt || !curTheatre) return;

        /* 切换按钮为黑色停止态 */
        _tsInvoking = true;
        var invokeBtn = document.getElementById('tsInvokeBtn');
        invokeBtn.classList.add('accent');
        invokeBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>Stop';
        showTyping();

        /* 实时刷新 cast 角色的 persona 缓存，等全部完成后再发请求 */
        var castRefresh = [];
        try { castRefresh = JSON.parse(localStorage.getItem('theatre-cast-' + curTheatre.id) || '[]'); } catch(e) {}
        var needLoad = castRefresh.filter(function(c) { return !!c.entityId; });
        var loadRemaining = needLoad.length;

        function afterRefresh() {
            var userContent = '';
            if (curMessages.length > 0) {
                var last = curMessages[curMessages.length - 1];
                if (last.role === 'user') {
                    if (last.isDirector) {
                        userContent = '';
                    } else {
                        userContent = last.text || '';
                    }
                } else {
                    userContent = 'Continue the scene naturally.';
                }
            } else {
                userContent = '[BEGIN]';
            }

            callTheatreAI(userContent, function(reply) {
            hideTyping();
            _tsInvoking = false;
            _tsAbortCtrl = null;
            invokeBtn.classList.remove('accent');
            invokeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>Invoke AI';

            var newMsg = { role: 'assistant', pages: [reply], activeIdx: 0, elapsed: [_tsElapsed] };
            if (_lastEventData && _lastEventData.title && _lastEventData.choices) {
                newMsg.events = [_lastEventData];
                _lastEventData = null;
            }
            curMessages.push(newMsg);
            saveCurrentMessages();
            renderMessages();

            var hotWords = ['靠近', '贴', '吻', '抱', '心跳', '呼吸', '颈', '唇', '危险'];
            var bonus = 3;
            if (hotWords.some(function(w) { return reply.indexOf(w) !== -1; })) bonus = 8;
            var nv = Math.min(heat + bonus, 100);
            document.getElementById('tsHeatSlider').value = nv;
            updateHeatUI(nv);
            });
        }

        if (loadRemaining === 0) {
            afterRefresh();
        } else {
            needLoad.forEach(function(c) {
                loadEntFromDB(c.entityId, function(freshEnt) {
                    if (freshEnt && freshEnt.persona) {
                        localStorage.setItem('ca-entity-persona-' + c.entityId, freshEnt.persona);
                    }
                    loadRemaining--;
                    if (loadRemaining === 0) {
                        afterRefresh();
                    }
                });
            });
        }
    }

    function doBegin() {
        if (!curEnt || !curTheatre) return;
        var premise = curTheatre.premise || '';
        var beginPrompt = '[BEGIN] 创建一个引人入胜的开场场景。以角色身份自我介绍，带有丰富的氛围细节。';
        if (premise) beginPrompt += '\n\n前提：' + premise;
        showTyping();
        callTheatreAI(beginPrompt, function(reply) {
            hideTyping();
            curMessages.push({ role: 'assistant', pages: [reply], activeIdx: 0, elapsed: [_tsElapsed] });
            saveCurrentMessages();

            var d = document.createElement('div');
            d.className = 'msg-ai';
            d.innerHTML = parseNarr(reply);
            appendMsg(d);

            var badgeStyle = getBadgeStyle();
            if (badgeStyle > 0 && _tsElapsed > 0) {
                var badgeEl = document.createElement('div');
                badgeEl.innerHTML = buildTimeBadgeHTML(badgeStyle, _tsElapsed);
                if (badgeEl.firstChild) {
                    var area = document.getElementById('tsChatArea');
                    var typing = document.getElementById('tsTyping');
                    area.insertBefore(badgeEl.firstChild, typing);
                }
            }
        });
    }

    function doSummarize() {
        if (!curEnt || !curTheatre) return;
        var btn = document.getElementById('tsSbSummarize');
        btn.textContent = 'SUMMARIZING...';
        btn.style.opacity = '0.4';

        /* 确定总结来源 */
        var sourceMessages = curMessages;
        var sourceSelect = document.getElementById('tsSumSource');
        if (sourceSelect && sourceSelect.value !== 'current') {
            var branchId = sourceSelect.value;
            try {
                var branches = JSON.parse(localStorage.getItem('theatre-branches-' + curTheatre.id) || '[]');
                var br = branches.find(function(b) { return b.id === branchId; });
                if (br && br.messages) sourceMessages = br.messages;
            } catch(e) {}
        }

        if (!sourceMessages.length) {
            btn.textContent = '\u2726 No messages';
            setTimeout(function() { btn.textContent = '\u2726 Summarize to Memory'; btn.style.opacity = '1'; }, 1500);
            return;
        }

        /* 确定总结范围 */
        var rangeRadio = document.querySelector('input[name="tsSumRange"]:checked');
        var rangeMode = rangeRadio ? rangeRadio.value : 'unsummarized';
        var messagesToSummarize = sourceMessages;
        var sumEndIndex = sourceMessages.length;

        if (rangeMode === 'unsummarized') {
            var marker = 0;
            if (curTheatre) marker = parseInt(localStorage.getItem('theatre-sum-marker-' + curTheatre.id) || '0', 10);
            messagesToSummarize = sourceMessages.slice(marker);
            sumEndIndex = sourceMessages.length;
            if (messagesToSummarize.length === 0) {
                btn.textContent = '\u2726 Nothing new';
                setTimeout(function() { btn.textContent = '\u2726 Summarize to Memory'; btn.style.opacity = '1'; }, 1500);
                return;
            }
        } else if (rangeMode === 'custom') {
            var startIdx = parseInt(document.getElementById('tsSumStartSlider').value || '1', 10) - 1;
            var endIdx = parseInt(document.getElementById('tsSumEndSlider').value || '20', 10);
            messagesToSummarize = sourceMessages.slice(startIdx, endIdx);
            sumEndIndex = endIdx;
            if (messagesToSummarize.length === 0) {
                btn.textContent = '\u2726 Empty range';
                setTimeout(function() { btn.textContent = '\u2726 Summarize to Memory'; btn.style.opacity = '1'; }, 1500);
                return;
            }
        }

        var transcript = messagesToSummarize.map(function(m, i) {
            var role = m.role === 'user' ? 'User' : (curEnt.nickname || curEnt.name);
            var text = m.isDirector ? ('[SCENE] ' + (m.scene||'') + ' [DLG] ' + (m.dlg||'')) : getMsgText(m);
            return '[' + (i+1) + '] ' + role + ': ' + text;
        }).join('\n');

        var cfg = activeCfg();
        if (!cfg.key) { btn.textContent = '\u2726 Summarize to Memory'; btn.style.opacity = '1'; return; }

        var now = new Date();
        var dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
        var prompt = '你是一个记忆存档机器。你的唯一工作：把对话里发生的事一件一件写下来。\n\n' +
            '时间：' + dateStr + '\n' +
            '剧场标题：' + (curTheatre.title || '') + '\n' +
            '前提：' + (curTheatre.premise || '无') + '\n\n' +
            '【铁律——违反任何一条都是失败】\n' +
            '1. 禁止概括。"两人关系升温"是垃圾输出。要写：谁做了什么导致关系变化。\n' +
            '2. 禁止模糊。"似乎""可能""仿佛"出现一次就算失败。只写确实发生的事。\n' +
            '3. 禁止省略。每一次肢体接触、每一句关键对话、每一个情绪转折都必须单独记录。\n' +
            '4. 禁止合并。一件事写一条。不要把三件事塞进一句话。\n' +
            '5. 禁止文艺。不要用比喻、不要用修辞、不要写散文。像监控录像的文字版一样客观记录。\n' +
            '6. 重要对话必须引用原话。不要改写、不要意译。\n\n' +
            '【格式】\n' +
            '- [user] = 用户，[char] = 角色（多角色用角色名）\n' +
            '- 每行一条，前缀 HIGH: / MID: / LOW:\n' +
            '- 每条写成：谁 + 做了什么 + 对方什么反应 + 这件事为什么重要\n\n' +
            '【分级】\n' +
            'HIGH: 第一次做某事、承诺、拒绝、关系质变、不可逆行为\n' +
            'MID: 身体接触、情绪暴露、偏好发现、有意义的对话\n' +
            'LOW: 地点、天气、背景音、临时情绪\n\n' +
            '【正确示例】\n' +
            'HIGH: [char] 把 [user] 按在墙上，距离不到5厘米，说"你再说一次试试"。[user] 没有推开，反而笑了。这是第一次 [char] 用肢体压迫表达情绪而 [user] 没有抗拒。\n' +
            'MID: [char] 发现 [user] 一直在看自己的嘴唇，假装没注意到但把脸转开了，耳朵红了。\n' +
            'LOW: 深夜便利店，只有他们两个人，荧光灯嗡嗡响。\n\n' +
            '【错误示例——绝对不要这样写】\n' +
            '× "两人之间的氛围变得暧昧" ← 废话，要写具体什么动作/话导致暧昧\n' +
            '× "关系似乎有所进展" ← 模糊+概括，双重违规\n' +
            '× "[char] 表现出了在意" ← 怎么表现的？说了什么？做了什么？\n\n' +
            '只输出 HIGH:/MID:/LOW: 开头的条目。不要输出标题、总结、评论或任何其他文字。\n\n' +
            '对话记录：\n' + transcript;

        var endpoint = normEp(cfg.endpoint);
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key },
            body: JSON.stringify({ model: resolveModel(cfg.model), messages: [{ role: 'user', content: prompt }], max_tokens: 600, temperature: 0.4 })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            var text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
            if (!text) { btn.textContent = '\u2726 FAILED'; setTimeout(function(){ btn.textContent = '\u2726 Summarize to Memory'; btn.style.opacity = '1'; }, 1500); return; }
            var parsed = { high: [], mid: [], low: [] };
            text.split('\n').forEach(function(line) {
                line = line.trim();
                if (line.toUpperCase().indexOf('HIGH:') === 0) parsed.high.push(line.substring(5).trim());
                else if (line.toUpperCase().indexOf('MID:') === 0) parsed.mid.push(line.substring(4).trim());
                else if (line.toUpperCase().indexOf('LOW:') === 0) parsed.low.push(line.substring(4).trim());
            });

            /* 判断存储目标和标记 */
            var targetRadio = document.querySelector('input[name="tsSumTarget"]:checked');
            var target = targetRadio ? targetRadio.value : 'theatre';
            var asPlay = document.getElementById('tsSumAsPlay').checked;

            /* 统一存入角色记忆库 */
            var memKey = 'ca-memory-' + curTheatre.entityId;
            var labelSuffix;
            var sourceTag;
            if (target === 'mainline') {
                sourceTag = asPlay ? '[THEATRE·演戏]' : '[MAINLINE]';
                labelSuffix = asPlay ? ' → MAINLINE (演戏)' : ' → MAINLINE';
            } else {
                sourceTag = asPlay ? '[THEATRE·演戏]' : '[THEATRE·番外]';
                labelSuffix = asPlay ? ' → THEATRE (演戏)' : ' → THEATRE';
            }

            /* 给每条记忆加上来源标记 */
            var taggedHigh = parsed.high.map(function(l) { return sourceTag + ' ' + l; });
            var taggedMid = parsed.mid.map(function(l) { return sourceTag + ' ' + l; });
            var taggedLow = parsed.low.map(function(l) { return sourceTag + ' ' + l; });

            var existing = { high: [], mid: [], low: [] };
            try { var raw = localStorage.getItem(memKey); if (raw) existing = JSON.parse(raw); } catch(e) {}
            existing.high = existing.high.concat(taggedHigh);
            existing.mid = existing.mid.concat(taggedMid);
            existing.low = existing.low.concat(taggedLow);
            localStorage.setItem(memKey, JSON.stringify(existing));
            /* 保存总结标记：记录已总结到哪一条 */
            if (curTheatre && sourceSelect && sourceSelect.value === 'current') {
                localStorage.setItem('theatre-sum-marker-' + curTheatre.id, String(sumEndIndex));
            }
            var total = parsed.high.length + parsed.mid.length + parsed.low.length;
            var rangeInfo = messagesToSummarize.length + ' msgs';
            btn.textContent = '\u2713 ' + total + ' SAVED (' + rangeInfo + ')' + labelSuffix;
            setTimeout(function() { btn.textContent = '\u2726 Summarize to Memory'; btn.style.opacity = '1'; }, 2500);
        })
        .catch(function() {
            btn.textContent = '\u2726 Summarize to Memory';
            btn.style.opacity = '1';
        });
    }

    /* ══════════════════════════════════════ Bind ══════════════════════════════════════ */
    function bindAll() {
        /* 返回 */
        document.getElementById('tsBackBtn').addEventListener('click', function() {
            document.getElementById('theatreScene').classList.remove('open');
            curTheatre = null;
            curEnt = null;
            curMessages = [];
            /* 刷新卡片列表 */
            if (typeof window.openTheatreApp === 'function') {
                var appEl = document.getElementById('theatreApp');
                if (appEl && appEl.classList.contains('open')) {
                    window.openTheatreApp();
                }
            }
        });

        /* 设置侧边栏（短按）+ 全屏面板（长按） */
        var _tsSettingsTimer = null;
        var _tsSettingsLong = false;
        document.getElementById('tsSettingsBtn').addEventListener('touchstart', function(e) {
            _tsSettingsLong = false;
            _tsSettingsTimer = setTimeout(function() {
                _tsSettingsLong = true;
                document.getElementById('tsFullPanel').classList.add('open');
                if (navigator.vibrate) navigator.vibrate(10);
            }, 500);
        }, {passive: true});
        document.getElementById('tsSettingsBtn').addEventListener('touchend', function() {
            clearTimeout(_tsSettingsTimer);
            if (!_tsSettingsLong) {
                document.getElementById('tsSidebar').classList.toggle('open');
            }
        });
        document.getElementById('tsSettingsBtn').addEventListener('touchmove', function() {
            clearTimeout(_tsSettingsTimer);
        });
        /* 桌面端 fallback */
        document.getElementById('tsSettingsBtn').addEventListener('click', function(e) {
            if (!('ontouchstart' in window)) {
                document.getElementById('tsSidebar').classList.toggle('open');
            }
        });
        document.getElementById('tsFpClose').addEventListener('click', function() {
            document.getElementById('tsFullPanel').classList.remove('open');
            var ap = document.getElementById('tsAssistPanel');
            if (ap) ap.classList.remove('open');
        });

        /* ═══ 时间线视图 ═══ */
        document.getElementById('tsFpTimeline').addEventListener('click', function() {
            document.getElementById('tsFullPanel').classList.remove('open');
            renderTimeline();
            document.getElementById('tsTimeline').classList.add('open');
        });
        document.getElementById('tsTlClose').addEventListener('click', function() {
            document.getElementById('tsTimeline').classList.remove('open');
        });

        function getTimelineMarkers() {
            if (!curTheatre) return [];
            try { return JSON.parse(localStorage.getItem('theatre-timeline-' + curTheatre.id) || '[]'); } catch(e) { return []; }
        }
        function saveTimelineMarkers(markers) {
            if (!curTheatre) return;
            localStorage.setItem('theatre-timeline-' + curTheatre.id, JSON.stringify(markers));
        }

        function renderTimeline() {
            var scroll = document.getElementById('tsTlScroll');
            if (!scroll) return;
            var markers = getTimelineMarkers();
            var html = '';

            curMessages.forEach(function(m, idx) {
                /* 在此位置之前插入标记 */
                markers.filter(function(mk) { return mk.beforeIdx === idx; }).forEach(function(mk) {
                    if (mk.type === 'chapter') {
                        html += '<div class="ts-tl-chapter"><div class="ts-tl-chapter-line"></div><div class="ts-tl-chapter-label">' + esc(mk.text) + '</div><div class="ts-tl-chapter-line"></div></div>';
                    } else {
                        html += '<div class="ts-tl-node"><div class="ts-tl-dot event"></div><div class="ts-tl-event"><div class="ts-tl-event-label">Event</div><div class="ts-tl-event-text">' + esc(mk.text) + '</div></div><div class="ts-tl-actions"><div class="ts-tl-act-btn ts-tl-del-marker" data-mk-id="' + mk.id + '"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div></div></div>';
                    }
                });

                /* 消息节点 */
                var dotClass = m.role === 'user' ? (m.isDirector ? 'director' : 'user') : 'ai';
                var cardClass = m.role === 'user' ? (m.isDirector ? 't-director' : 't-user') : 't-ai';
                var speaker = m.role === 'user' ? (m.isDirector ? 'Director' : 'You') : (curEnt ? (curEnt.nickname || curEnt.name) : 'AI');
                var text = m.isDirector ? ((m.scene || '') + ' ' + (m.dlg || '')).trim() : getMsgText(m);
                var preview = text.substring(0, 60) + (text.length > 60 ? '...' : '');

                html += '<div class="ts-tl-node" data-msg-idx="' + idx + '">' +
                    '<div class="ts-tl-dot ' + dotClass + '"></div>' +
                    '<div class="ts-tl-time">MSG ' + (idx + 1) + '</div>' +
                    '<div class="ts-tl-card ' + cardClass + '">' +
                        '<div class="ts-tl-speaker">' + esc(speaker) + '</div>' +
                        '<div class="ts-tl-text">' + esc(preview) + '</div>' +
                        '<div class="ts-tl-actions">' +
                            '<div class="ts-tl-act-btn ts-tl-branch-btn" data-idx="' + idx + '" title="Branch"><svg viewBox="0 0 24 24"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg></div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

                /* 添加按钮 */
                html += '<div class="ts-tl-add" data-after-idx="' + idx + '"><div class="ts-tl-add-btn"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div></div>';
            });

            /* 末尾标记 */
            markers.filter(function(mk) { return mk.beforeIdx >= curMessages.length; }).forEach(function(mk) {
                if (mk.type === 'chapter') {
                    html += '<div class="ts-tl-chapter"><div class="ts-tl-chapter-line"></div><div class="ts-tl-chapter-label">' + esc(mk.text) + '</div><div class="ts-tl-chapter-line"></div></div>';
                } else {
                    html += '<div class="ts-tl-node"><div class="ts-tl-dot event"></div><div class="ts-tl-event"><div class="ts-tl-event-label">Event</div><div class="ts-tl-event-text">' + esc(mk.text) + '</div></div><div class="ts-tl-actions"><div class="ts-tl-act-btn ts-tl-del-marker" data-mk-id="' + mk.id + '"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div></div></div>';
                }
            });

            scroll.innerHTML = html;

            /* 绑定添加按钮 */
            scroll.querySelectorAll('.ts-tl-add').forEach(function(addEl) {
                addEl.addEventListener('click', function() {
                    var afterIdx = parseInt(addEl.dataset.afterIdx, 10);
                    var choice = prompt('输入标记内容\n（前缀 # 表示章节分隔，否则为事件标记）:');
                    if (!choice || !choice.trim()) return;
                    choice = choice.trim();
                    var mk = { id: 'mk_' + Date.now(), beforeIdx: afterIdx + 1 };
                    if (choice.charAt(0) === '#') {
                        mk.type = 'chapter';
                        mk.text = choice.substring(1).trim() || 'New Chapter';
                    } else {
                        mk.type = 'event';
                        mk.text = choice;
                    }
                    var markers2 = getTimelineMarkers();
                    markers2.push(mk);
                    saveTimelineMarkers(markers2);
                    renderTimeline();
                });
            });

            /* 绑定删除标记 */
            scroll.querySelectorAll('.ts-tl-del-marker').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var mkId = btn.dataset.mkId;
                    var markers2 = getTimelineMarkers().filter(function(mk) { return mk.id !== mkId; });
                    saveTimelineMarkers(markers2);
                    renderTimeline();
                });
            });

            /* 绑定分支按钮 */
            scroll.querySelectorAll('.ts-tl-branch-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var idx = parseInt(btn.dataset.idx, 10);
                    doBranchFrom(idx);
                });
            });
        }

        /* ═══ 分支系统 ═══ */
        document.getElementById('tsFpBranch').addEventListener('click', function() {
            document.getElementById('tsFullPanel').classList.remove('open');
            renderBranchPanel();
            document.getElementById('tsBranchPanel').classList.add('open');
        });
        document.getElementById('tsBranchClose').addEventListener('click', function() {
            document.getElementById('tsBranchPanel').classList.remove('open');
        });

        function getBranches() {
            if (!curTheatre) return [];
            try { return JSON.parse(localStorage.getItem('theatre-branches-' + curTheatre.id) || '[]'); } catch(e) { return []; }
        }
        function saveBranches(branches) {
            if (!curTheatre) return;
            localStorage.setItem('theatre-branches-' + curTheatre.id, JSON.stringify(branches));
        }

        function doBranchFrom(idx) {
            if (!curTheatre) return;
            var name = prompt('给这个分支起个名字:', '分支 · 从第' + (idx + 1) + '条');
            if (!name || !name.trim()) return;

            var branches = getBranches();

            /* 先把当前完整对话保存为「主线存档」，这样不管怎么操作都不会丢 */
            var mainlineExists = branches.some(function(b) { return b.isMainline && b.msgCount === curMessages.length; });
            if (!mainlineExists) {
                branches.push({
                    id: 'br_main_' + Date.now(),
                    name: '📌 主线（分支前）',
                    messages: JSON.parse(JSON.stringify(curMessages)),
                    createdAt: new Date().toISOString(),
                    fromIndex: curMessages.length - 1,
                    msgCount: curMessages.length,
                    isMainline: true
                });
            }

            /* 保存新分支：记录从哪里分叉，内容是截断后的新起点 */
            branches.push({
                id: 'br_' + Date.now(),
                name: name.trim(),
                messages: JSON.parse(JSON.stringify(curMessages.slice(0, idx + 1))),
                createdAt: new Date().toISOString(),
                fromIndex: idx,
                msgCount: idx + 1
            });
            saveBranches(branches);

            /* 回溯到指定位置 */
            curMessages = curMessages.slice(0, idx + 1);
            saveCurrentMessages();
            renderMessages();

            /* 关闭时间线 */
            document.getElementById('tsTimeline').classList.remove('open');
            var area = document.getElementById('tsChatArea');
            if (area) area.scrollTop = area.scrollHeight;
        }

        function renderBranchPanel() {
            var scroll = document.getElementById('tsBranchScroll');
            if (!scroll) return;
            var branches = getBranches();

            if (branches.length === 0) {
                scroll.innerHTML = '<div class="ts-branch-empty">No branches yet.<br>Use Timeline to create a branch from any point.</div>';
                return;
            }

            var html = '';
            branches.forEach(function(br) {
                var date = br.createdAt ? new Date(br.createdAt).toLocaleDateString() : '';
                html += '<div class="ts-branch-item" data-br-id="' + br.id + '">' +
                    '<div class="ts-branch-item-name">' + esc(br.name) + '</div>' +
                    '<div class="ts-branch-item-meta">' +
                        '<span>' + br.msgCount + ' messages</span>' +
                        '<span>from #' + (br.fromIndex + 1) + '</span>' +
                        '<span>' + date + '</span>' +
                    '</div>' +
                    '<div class="ts-branch-item-del" data-br-id="' + br.id + '">DELETE</div>' +
                '</div>';
            });
            scroll.innerHTML = html;

            /* 点击切换到分支 */
            scroll.querySelectorAll('.ts-branch-item').forEach(function(item) {
                item.addEventListener('click', function(e) {
                    if (e.target.closest('.ts-branch-item-del')) return;
                    var brId = item.dataset.brId;
                    var branches2 = getBranches();
                    var br = branches2.find(function(b) { return b.id === brId; });
                    if (!br) return;

                    /* 把当前状态保存（如果和已有分支不重复） */
                    var curJson = JSON.stringify(curMessages);
                    var alreadySaved = branches2.some(function(b) { return JSON.stringify(b.messages) === curJson; });
                    if (!alreadySaved && curMessages.length > 0) {
                        branches2.push({
                            id: 'br_auto_' + Date.now(),
                            name: '↩ 切换前 · ' + curMessages.length + '条',
                            messages: JSON.parse(curJson),
                            createdAt: new Date().toISOString(),
                            fromIndex: curMessages.length - 1,
                            msgCount: curMessages.length
                        });
                        saveBranches(branches2);
                    }

                    /* 加载分支 */
                    curMessages = JSON.parse(JSON.stringify(br.messages));
                    saveCurrentMessages();
                    renderMessages();
                    document.getElementById('tsBranchPanel').classList.remove('open');
                });
            });

            /* 删除分支 */
            scroll.querySelectorAll('.ts-branch-item-del').forEach(function(del) {
                del.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var brId = del.dataset.brId;
                    if (!confirm('删除这个分支？')) return;
                    var branches2 = getBranches().filter(function(b) { return b.id !== brId; });
                    saveBranches(branches2);
                    renderBranchPanel();
                });
            });
        }

        /* 剧场助手 */
        document.getElementById('tsFpAssistant').addEventListener('click', function() {
            var panel = document.getElementById('tsAssistPanel');
            if (!panel) {
                panel = document.createElement('div');
                panel.className = 'ts-assist-panel';
                panel.id = 'tsAssistPanel';
                panel.innerHTML =
                    '<div style="font-size:8px;font-weight:800;letter-spacing:2px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:12px;">Theatre Idea Generator</div>' +
                    '<div class="ts-assist-input-row">' +
                        '<input type="text" class="ts-assist-input" id="tsAssistInput" placeholder="输入类型关键词，如：暗恋、悬疑、重逢、校园...">' +
                        '<button class="ts-assist-go" id="tsAssistGo"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>' +
                    '</div>' +
                    '<div id="tsAssistResult"></div>';
                document.getElementById('tsFullPanel').appendChild(panel);

                document.getElementById('tsAssistGo').addEventListener('click', doAssistGenerate);
                document.getElementById('tsAssistInput').addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') { e.preventDefault(); doAssistGenerate(); }
                });
            }
            panel.classList.toggle('open');
        });

        function doAssistGenerate() {
            var input = document.getElementById('tsAssistInput');
            var keyword = input ? input.value.trim() : '';
            if (!keyword) { if (input) input.focus(); return; }

            var resultEl = document.getElementById('tsAssistResult');
            resultEl.innerHTML = '<div class="ts-assist-loading">正在生成灵感...</div>';

            var cfg = activeCfg();
            if (!cfg.key) {
                resultEl.innerHTML = '<div class="ts-assist-loading">请先配置 API Key</div>';
                return;
            }

            /* 读取角色和用户人设 */
            var charName = curEnt ? (curEnt.nickname || curEnt.name) : 'Unknown';
            var charPersona = curEnt ? (curEnt.persona || '') : '';
            var userMasks = [];
            try { userMasks = JSON.parse(localStorage.getItem('ca-user-masks') || '[]'); } catch(e2) {}
            var activeMask = userMasks.find(function(m) { return m.active; });
            var userName = activeMask ? activeMask.name : 'User';
            var userBio = activeMask ? (activeMask.bio || '') : '';

            var prompt = '你是一个创意剧场编剧。用户想要「' + keyword + '」类型的番外剧场。\n\n' +
                '【角色信息】\n' +
                '- 角色名：' + charName + '\n' +
                (charPersona ? '- 角色人设：' + charPersona + '\n' : '') +
                '- 用户名：' + userName + '\n' +
                (userBio ? '- 用户人设：' + userBio + '\n' : '') +
                '\n请根据以上两人的性格和关系，生成 6 个有趣、有张力、有画面感的剧场创意。每个创意包含一个标题和一段前提设定。\n' +
                '创意要贴合这两个角色的性格特点，让人一看就觉得"这两个人确实会发生这种事"。\n\n' +
                '【要求】\n' +
                '- 标题要有文学感，简短有力\n' +
                '- 前提设定 2-3 句话，描述具体的情境和冲突点\n' +
                '- 每个创意之间要有差异，不要雷同\n' +
                '- 前提要具体到能直接开始演的程度\n' +
                '- 用中文输出\n\n' +
                '【输出格式】严格按以下格式，每个创意独占一行：\n' +
                'IDEA: 标题 ||| 前提设定\n\n' +
                '示例：\n' +
                'IDEA: 雨夜的告白 ||| 如果那天你没有撑伞离开，而是转身走回了我身边。暴雨困住两个人在便利店的屋檐下，距离近到能听见彼此的心跳。\n' +
                'IDEA: 失忆后的第一天 ||| 你醒来发现自己失去了最近三个月的记忆，而面前这个人说他是你的恋人。你不记得他，但你的身体记得。';

            var endpoint = normEp(cfg.endpoint);
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key },
                body: JSON.stringify({
                    model: resolveModel(cfg.model),
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1000,
                    temperature: 0.95
                })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                var text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
                if (!text) { resultEl.innerHTML = '<div class="ts-assist-loading">生成失败，请重试</div>'; return; }

                var ideas = [];
                text.split('\n').forEach(function(line) {
                    line = line.trim();
                    if (line.toUpperCase().indexOf('IDEA:') === 0) {
                        var content = line.substring(5).trim();
                        var parts = content.split('|||');
                        if (parts.length >= 2) {
                            ideas.push({ title: parts[0].trim(), premise: parts[1].trim() });
                        }
                    }
                });

                if (ideas.length === 0) {
                    resultEl.innerHTML = '<div class="ts-assist-loading">未能解析结果，请重试</div>';
                    return;
                }

                var html = '<div class="ts-assist-list">';
                ideas.forEach(function(idea, idx) {
                    html += '<div class="ts-assist-item" data-idx="' + idx + '">' +
                        '<div class="ts-assist-item-use">TAP TO USE</div>' +
                        '<div class="ts-assist-item-title">' + esc(idea.title) + '</div>' +
                        '<div class="ts-assist-item-premise">' + esc(idea.premise) + '</div>' +
                    '</div>';
                });
                html += '</div>';
                resultEl.innerHTML = html;

                /* 点击套用 */
                resultEl.querySelectorAll('.ts-assist-item').forEach(function(item) {
                    item.addEventListener('click', function() {
                        var idx = parseInt(item.dataset.idx, 10);
                        var idea = ideas[idx];
                        if (!idea || !curTheatre) return;

                        curTheatre.title = idea.title;
                        curTheatre.premise = idea.premise;
                        var theatres = loadTheatres();
                        for (var i = 0; i < theatres.length; i++) {
                            if (theatres[i].id === curTheatre.id) {
                                theatres[i] = curTheatre;
                                break;
                            }
                        }
                        saveTheatres(theatres);

                        document.getElementById('tsActLabel').textContent = 'Act · ' + idea.title;
                        document.getElementById('tsInfoPremise').textContent = idea.premise;
                        document.getElementById('tsSbPremise').textContent = idea.premise;

                        item.style.borderColor = '#2a2830';
                        item.style.background = 'rgba(42,40,48,0.04)';
                        var useLabel = item.querySelector('.ts-assist-item-use');
                        if (useLabel) useLabel.textContent = '✓ APPLIED';

                        setTimeout(function() {
                            document.getElementById('tsFullPanel').classList.remove('open');
                            var ap = document.getElementById('tsAssistPanel');
                            if (ap) ap.classList.remove('open');
                        }, 800);
                    });
                });
            })
            .catch(function(err) {
                resultEl.innerHTML = '<div class="ts-assist-loading">错误: ' + esc(err.message) + '</div>';
            });
        }
        /* Event 按钮 → 弹出面板 */
        document.getElementById('tsEventBtn').addEventListener('click', function() {
            if (!curTheatre) return;
            var existing = document.getElementById('tsEventPanel');
            if (existing) { existing.remove(); return; }

            var key = 'theatre-event-on-' + curTheatre.id;
            var isOn = localStorage.getItem(key) === 'true';
            var dispName = curEnt ? (curEnt.nickname || curEnt.name) : 'Entity';

            var panel = document.createElement('div');
            panel.id = 'tsEventPanel';
            panel.style.cssText = 'position:fixed;inset:0;z-index:250;display:flex;flex-direction:column;overflow-y:auto;-webkit-overflow-scrolling:touch;background:rgba(247,245,242,0.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);animation:tsIn 0.35s cubic-bezier(0.16,1,0.3,1);';

            panel.innerHTML =
                '<div style="padding:calc(env(safe-area-inset-top,20px) + 14px) 16px 14px;display:flex;align-items:center;justify-content:space-between;">'+
                    '<div style="font-family:\'Playfair Display\',serif;font-size:18px;font-weight:700;color:#2a2830;">Event System</div>'+
                    '<div id="tsEvPanelClose" style="width:30px;height:30px;border-radius:50%;background:#2a2830;display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>'+
                '</div>'+
                '<div style="padding:0 16px 20px;">'+
                    '<div style="background:#fff;border-radius:14px;border:0.5px solid rgba(42,40,48,0.08);padding:16px;margin-bottom:12px;">'+
                        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'+
                            '<div style="width:32px;height:32px;border-radius:50%;background:#2a2830;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;">'+dispName.charAt(0).toUpperCase()+'</div>'+
                            '<div><div style="font-size:11px;font-weight:700;color:#2a2830;">'+esc(dispName)+'</div><div style="font-size:8px;color:rgba(42,40,48,0.4);font-style:italic;">Relationship</div></div>'+
                        '</div>'+
                        '<div style="display:flex;flex-direction:column;gap:8px;">'+
                            '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:8px;font-weight:700;color:rgba(42,40,48,0.35);width:32px;">亲密</span><div style="flex:1;height:3px;background:rgba(42,40,48,0.06);border-radius:2px;overflow:hidden;"><div style="height:100%;width:'+heat+'%;background:#2a2830;border-radius:2px;"></div></div><span style="font-size:8px;font-weight:700;color:rgba(42,40,48,0.4);">'+heat+'</span></div>'+
                            '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:8px;font-weight:700;color:rgba(42,40,48,0.35);width:32px;">张力</span><div style="flex:1;height:3px;background:rgba(42,40,48,0.06);border-radius:2px;overflow:hidden;"><div style="height:100%;width:'+Math.min(heat+20,100)+'%;background:linear-gradient(90deg,#8b4513,#a0522d);border-radius:2px;"></div></div><span style="font-size:8px;font-weight:700;color:rgba(42,40,48,0.4);">'+Math.min(heat+20,100)+'</span></div>'+
                        '</div>'+
                    '</div>'+
                    '<div style="background:#fff;border-radius:14px;border:0.5px solid rgba(42,40,48,0.08);padding:16px;margin-bottom:12px;">'+
                        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
                            '<span style="font-size:9px;font-weight:700;color:rgba(42,40,48,0.4);letter-spacing:1px;text-transform:uppercase;">当前氛围</span>'+
                            '<span style="font-size:10px;font-weight:700;color:#2a2830;">'+(heat>70?'暧昧期':heat>40?'试探期':'冷淡期')+' · '+heat+'%</span>'+
                        '</div>'+
                        '<div style="height:3px;background:rgba(42,40,48,0.06);border-radius:2px;overflow:hidden;margin-bottom:10px;"><div style="height:100%;width:'+heat+'%;background:linear-gradient(90deg,#2a2830,#636366);border-radius:2px;"></div></div>'+
                        '<div style="display:flex;gap:5px;flex-wrap:wrap;">'+
                            '<span style="font-size:7px;font-weight:700;padding:3px 8px;border-radius:20px;'+(heat>60?'background:#1a1a1f;color:#fff;':'background:rgba(42,40,48,0.04);color:rgba(42,40,48,0.35);')+'">暗流涌动</span>'+
                            '<span style="font-size:7px;font-weight:700;padding:3px 8px;border-radius:20px;'+(heat>40?'background:#1a1a1f;color:#fff;':'background:rgba(42,40,48,0.04);color:rgba(42,40,48,0.35);')+'">试探</span>'+
                            '<span style="font-size:7px;font-weight:700;padding:3px 8px;border-radius:20px;background:rgba(42,40,48,0.04);color:rgba(42,40,48,0.35);">克制</span>'+
                        '</div>'+
                    '</div>'+
                    '<div style="background:#1a1a1f;border-radius:14px;padding:18px;position:relative;overflow:hidden;">'+
                        '<div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,0.04),transparent 70%);"></div>'+
                        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">'+
                            '<div style="display:flex;align-items:center;gap:8px;">'+
                                '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:rgba(255,255,255,0.6);fill:none;stroke-width:2;"><rect x="2" y="2" width="20" height="20" rx="4"/><circle cx="8" cy="8" r="1.5"/><circle cx="16" cy="16" r="1.5"/><circle cx="12" cy="12" r="1.5"/></svg>'+
                                '<span style="font-size:11px;font-weight:700;color:#fff;">随机事件</span>'+
                            '</div>'+
                            '<div id="tsEvToggle" style="width:36px;height:20px;border-radius:10px;background:'+(isOn?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.1)')+';position:relative;cursor:pointer;transition:background 0.3s;">'+
                                '<div style="position:absolute;top:3px;left:'+(isOn?'19px':'3px')+';width:14px;height:14px;border-radius:50%;background:'+(isOn?'#1a1a1f':'rgba(255,255,255,0.3)')+';transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);"></div>'+
                            '</div>'+
                        '</div>'+
                        '<div style="font-size:9px;color:rgba(255,255,255,0.35);line-height:1.6;margin-bottom:14px;">开启后，AI 回复时有概率在末尾生成随机事件选项卡片。你选择后，AI 下次回复会融入你的选择。</div>'+
                        '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
                            '<span style="font-size:7px;font-weight:700;padding:3px 8px;border-radius:4px;background:rgba(200,160,60,0.15);color:rgba(255,210,80,0.7);">RARE</span>'+
                            '<span style="font-size:7px;font-weight:700;padding:3px 8px;border-radius:4px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.35);">COMMON</span>'+
                            '<span style="font-size:7px;font-weight:700;padding:3px 8px;border-radius:4px;background:rgba(160,80,200,0.15);color:rgba(200,140,255,0.7);">EPIC</span>'+
                        '</div>'+
                    '</div>'+
                '</div>';

            document.getElementById('theatreScene').appendChild(panel);

            // 关闭
            document.getElementById('tsEvPanelClose').addEventListener('click', function() {
                panel.style.opacity = '0';
                panel.style.transform = 'translateY(20px)';
                panel.style.transition = 'all 0.25s';
                setTimeout(function() { panel.remove(); }, 250);
            });

            // 开关
            document.getElementById('tsEvToggle').addEventListener('click', function() {
                var tog = this;
                var nowOn = localStorage.getItem(key) === 'true';
                if (nowOn) {
                    localStorage.removeItem(key);
                    tog.style.background = 'rgba(255,255,255,0.1)';
                    tog.firstElementChild.style.left = '3px';
                    tog.firstElementChild.style.background = 'rgba(255,255,255,0.3)';
                    document.getElementById('tsEventBtn').classList.remove('accent');
                    document.getElementById('tsEventBtn').innerHTML = '<span style="font-size:13px;">🎲</span>Event';
                } else {
                    localStorage.setItem(key, 'true');
                    tog.style.background = 'rgba(255,255,255,0.9)';
                    tog.firstElementChild.style.left = '19px';
                    tog.firstElementChild.style.background = '#1a1a1f';
                    document.getElementById('tsEventBtn').classList.add('accent');
                    document.getElementById('tsEventBtn').innerHTML = '<span style="font-size:13px;">🎲</span>Event ON';
                }
            });
        });

        document.getElementById('tsSbClose').addEventListener('click', function() {
            document.getElementById('tsSidebar').classList.remove('open');
        });

        /* 导演弹窗 */
        document.getElementById('tsAddBtn').addEventListener('click', function() {
            document.getElementById('tsDirPopup').classList.toggle('open');
        });
        document.getElementById('tsDpClose').addEventListener('click', function() {
            document.getElementById('tsDirPopup').classList.remove('open');
        });
        document.getElementById('tsDpSend').addEventListener('click', doSendDirector);

        /* 发送 */
        document.getElementById('tsSendBtn').addEventListener('click', function() {
            if (_tsInvoking && _tsAbortCtrl) {
                _tsAbortCtrl.abort();
                _tsAbortCtrl = null;
                _tsInvoking = false;
                hideTyping();
                var invokeBtn = document.getElementById('tsInvokeBtn');
                if (invokeBtn) {
                    invokeBtn.classList.remove('accent');
                    invokeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>Invoke AI';
                }
                return;
            }
            doSendMain();
        });
        var ta = document.getElementById('tsTextarea');
        ta.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        ta.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                doSendMain();
            }
        });

        /* 消息点击 → 弹出菜单 */
        var _tsCtxMenu = null;
        var _tsCtxOverlay = null;
        var _tsEditIdx = -1;
        var _tsRolling = false;

        function closeCtx() {
            if (_tsCtxMenu && _tsCtxMenu.parentNode) _tsCtxMenu.parentNode.removeChild(_tsCtxMenu);
            if (_tsCtxOverlay && _tsCtxOverlay.parentNode) _tsCtxOverlay.parentNode.removeChild(_tsCtxOverlay);
            _tsCtxMenu = null;
            _tsCtxOverlay = null;
        }

        document.getElementById('tsChatArea').addEventListener('click', function(e) {
            /* 点击 Narr 标签 → 窥探（缩回去露出被遮的字） */
            var tag = e.target.closest('.narr-tag');
            if (tag) {
                e.stopPropagation();
                tag.classList.add('peeked');
                setTimeout(function() { tag.classList.remove('peeked'); }, 2000);
                return;
            }

            /* 点击多人头像标签 → 点亮 */
            var charTag = e.target.closest('.narr-char-tag');
            if (charTag) {
                e.stopPropagation();
                charTag.classList.add('lit');
                setTimeout(function() { charTag.classList.remove('lit'); }, 3000);
                return;
            }

            var row = e.target.closest('.msg-ai,.msg-user,.msg-director');
            if (!row || _tsRolling) return;
            var idx = Array.from(document.getElementById('tsChatArea').querySelectorAll('.msg-ai,.msg-user,.msg-director')).indexOf(row);
            if (idx < 0 || idx >= curMessages.length) return;
            e.stopPropagation();
            closeCtx();

            var isAi = curMessages[idx].role === 'assistant';

            var overlay = document.createElement('div');
            overlay.className = 'ts-ctx-overlay';
            overlay.addEventListener('click', closeCtx);
            _tsCtxOverlay = overlay;

            var menu = document.createElement('div');
            menu.className = 'ts-ctx-menu';
            var html =
                '<div class="ts-ctx-btn ts-ctx-edit"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg><span>编辑</span></div>' +
                '<div class="ts-ctx-sep"></div>';
            if (isAi) {
                html += '<div class="ts-ctx-btn regen ts-ctx-regen"><svg viewBox="0 0 24 24"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg><span>重回</span></div><div class="ts-ctx-sep"></div>';
            }
            html +=
                '<div class="ts-ctx-btn ts-ctx-rollback"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg><span>回溯</span></div>' +
                '<div class="ts-ctx-sep"></div>' +
                '<div class="ts-ctx-btn danger ts-ctx-delete"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg><span>删除</span></div>';
            menu.innerHTML = html;
            _tsCtxMenu = menu;

            document.getElementById('theatreScene').appendChild(overlay);
            document.getElementById('theatreScene').appendChild(menu);

            requestAnimationFrame(function() {
                var rect = row.getBoundingClientRect();
                var menuW = menu.offsetWidth || 240;
                var menuH = menu.offsetHeight || 44;
                var left = rect.left + rect.width / 2 - menuW / 2;
                var top = rect.top - menuH - 10;
                if (left < 10) left = 10;
                if (left + menuW > window.innerWidth - 10) left = window.innerWidth - menuW - 10;
                if (top < 80) top = rect.bottom + 10;
                menu.style.left = left + 'px';
                menu.style.top = top + 'px';
            });

            /* 编辑 */
            menu.querySelector('.ts-ctx-edit').addEventListener('click', function(ev) {
                ev.stopPropagation(); closeCtx();
                doTsEdit(idx, row);
            });
            /* 重回（追加新页） */
            if (isAi) {
                menu.querySelector('.ts-ctx-regen').addEventListener('click', function(ev) {
                    ev.stopPropagation(); closeCtx();
                    var msg = curMessages[idx];
                    migrateMsg(msg);
                    showTyping();

                    /* 临时截断 curMessages，只保留 idx 之前的消息，让 callTheatreAI 不读到当前这条及之后的 */
                    var savedMessages = curMessages;
                    curMessages = savedMessages.slice(0, idx);

                    /* 构建 userContent：取 regen 目标之前的最后一条用户消息 */
                    var userContent = '';
                    for (var ri = curMessages.length - 1; ri >= 0; ri--) {
                        var prev = curMessages[ri];
                        if (prev.role === 'user') {
                            if (prev.isDirector) {
                                userContent = '';
                            } else {
                                userContent = prev.text || '';
                            }
                            break;
                        }
                    }
                    if (!userContent) userContent = 'Continue the scene naturally.';

                    callTheatreAI(userContent, function(reply) {
                        hideTyping();
                        /* 恢复完整消息列表 */
                        curMessages = savedMessages;
                        if (!reply) return;
                        msg.pages.push(reply);
                        msg.elapsed.push(_tsElapsed);
                        msg.activeIdx = msg.pages.length - 1;
                        curMessages[idx] = msg;
                        saveCurrentMessages();
                        renderMessages();
                    });
                });
            }
            /* 回溯 */
            menu.querySelector('.ts-ctx-rollback').addEventListener('click', function(ev) {
                ev.stopPropagation(); closeCtx();
                doTsRollback(idx);
            });
            /* 删除 */
            menu.querySelector('.ts-ctx-delete').addEventListener('click', function(ev) {
                ev.stopPropagation(); closeCtx();
                var msg = curMessages[idx];
                migrateMsg(msg);
                if (msg.role === 'assistant' && msg.pages && msg.pages.length > 1) {
                    var delMenu = document.createElement('div');
                    delMenu.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(42,40,48,0.3);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;animation:tsMsgIn 0.2s ease-out;';
                    delMenu.innerHTML = '<div style="background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:16px;padding:20px;width:260px;box-shadow:0 12px 40px rgba(42,40,48,0.15);text-align:center;">' +
                        '<div style="font-size:11px;font-weight:700;color:#2a2830;margin-bottom:4px;">删除选项</div>' +
                        '<div style="font-size:9px;color:rgba(42,40,48,0.4);margin-bottom:16px;">当前第 ' + (msg.activeIdx + 1) + ' 页，共 ' + msg.pages.length + ' 页</div>' +
                        '<div id="tsDelPage" style="padding:11px;border-radius:10px;border:1px solid rgba(42,40,48,0.1);background:rgba(42,40,48,0.03);font-size:10px;font-weight:700;color:#2a2830;cursor:pointer;margin-bottom:8px;transition:all 0.2s;">删除当前页</div>' +
                        '<div id="tsDelAll" style="padding:11px;border-radius:10px;border:1px solid rgba(166,52,38,0.2);background:rgba(166,52,38,0.04);font-size:10px;font-weight:700;color:#7a2a20;cursor:pointer;margin-bottom:8px;transition:all 0.2s;">删除全部（所有页）</div>' +
                        '<div id="tsDelCancel" style="padding:11px;border-radius:10px;font-size:10px;font-weight:600;color:rgba(42,40,48,0.4);cursor:pointer;">取消</div>' +
                    '</div>';
                    document.body.appendChild(delMenu);
                    delMenu.addEventListener('click', function(e) { if (e.target === delMenu) { delMenu.remove(); } });
                    document.getElementById('tsDelCancel').addEventListener('click', function() { delMenu.remove(); });
                    document.getElementById('tsDelPage').addEventListener('click', function() {
                        delMenu.remove();
                        var ai = msg.activeIdx || 0;
                        msg.pages.splice(ai, 1);
                        if (Array.isArray(msg.elapsed)) msg.elapsed.splice(ai, 1);
                        if (msg.pages.length === 0) {
                            curMessages.splice(idx, 1);
                        } else {
                            msg.activeIdx = Math.min(ai, msg.pages.length - 1);
                        }
                        saveCurrentMessages();
                        renderMessages();
                    });
                    document.getElementById('tsDelAll').addEventListener('click', function() {
                        delMenu.remove();
                        curMessages.splice(idx, 1);
                        saveCurrentMessages();
                        renderMessages();
                    });
                } else {
                    curMessages.splice(idx, 1);
                    saveCurrentMessages();
                    renderMessages();
                }
            });
        });

        function doTsRollback(idx) {
            if (_tsRolling) return;
            _tsRolling = true;
            var area = document.getElementById('tsChatArea');
            var allRows = Array.from(area.querySelectorAll('.msg-ai,.msg-user,.msg-director'));
            var toRemove = allRows.slice(idx + 1);
            toRemove.reverse().forEach(function(el, i) {
                setTimeout(function() { el.classList.add('ts-dissolving'); }, i * 50);
            });
            setTimeout(function() {
                curMessages = curMessages.slice(0, idx + 1);
                saveCurrentMessages();
                renderMessages();
                _tsRolling = false;
            }, toRemove.length * 50 + 450);
        }

        function doTsEdit(idx, row) {
            if (_tsEditIdx !== -1) return;
            _tsEditIdx = idx;
            var msg = curMessages[idx];
            migrateMsg(msg);

            var bar = document.createElement('div');
            bar.className = 'ts-edit-bar';
            bar.id = 'tsEditBar';
            bar.innerHTML = '✎ 编辑中 <button id="tsEditSave">保存</button><button class="ts-edit-cancel" id="tsEditCancel">取消</button>';
            document.getElementById('theatreScene').appendChild(bar);

            var taStyle = 'ts-edit-ta';
            if (msg.isDirector) {
                row.innerHTML = '<div style="font-size:8px;font-weight:700;letter-spacing:1px;color:rgba(42,40,48,0.4);margin-bottom:6px;">SCENE</div>' +
                    '<textarea class="' + taStyle + '" id="tsEditScene">' + esc(msg.scene || '') + '</textarea>' +
                    '<div style="font-size:8px;font-weight:700;letter-spacing:1px;color:rgba(42,40,48,0.4);margin:8px 0 6px;">DIALOGUE</div>' +
                    '<textarea class="' + taStyle + '" id="tsEditDlg">' + esc(msg.dlg || '') + '</textarea>';
            } else {
                var currentText = getMsgText(msg);
                row.innerHTML = '<textarea class="' + taStyle + '" id="tsEditTA">' + esc(currentText) + '</textarea>';
            }

            row.querySelectorAll('textarea').forEach(function(ta) {
                ta.style.height = 'auto';
                ta.style.height = ta.scrollHeight + 'px';
                ta.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; });
            });

            document.getElementById('tsEditSave').addEventListener('click', function() {
                if (msg.isDirector) {
                    var s = document.getElementById('tsEditScene');
                    var d = document.getElementById('tsEditDlg');
                    msg.scene = s ? s.value.trim() : '';
                    msg.dlg = d ? d.value.trim() : '';
                } else {
                    var ta = document.getElementById('tsEditTA');
                    if (ta) {
                        var newText = ta.value.trim();
                        if (msg.pages) {
                            msg.pages[msg.activeIdx || 0] = newText;
                        } else {
                            msg.text = newText;
                        }
                    }
                }
                curMessages[idx] = msg;
                saveCurrentMessages();
                endTsEdit();
            });
            document.getElementById('tsEditCancel').addEventListener('click', endTsEdit);
        }

        function endTsEdit() {
            _tsEditIdx = -1;
            var bar = document.getElementById('tsEditBar');
            if (bar) bar.remove();
            renderMessages();
        }

        /* AI 按钮 */

        document.getElementById('tsInvokeBtn').addEventListener('click', function() {
            if (_tsInvoking && _tsAbortCtrl) {
                _tsAbortCtrl.abort();
                _tsAbortCtrl = null;
                _tsInvoking = false;
                hideTyping();
                var btn = document.getElementById('tsInvokeBtn');
                btn.classList.remove('accent');
                btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>Invoke AI';
                return;
            }
            doInvokeAI();
        });
        document.getElementById('tsBeginBtn').addEventListener('click', doBegin);
        document.getElementById('tsSumBtn').addEventListener('click', doSummarize);

        /* Heat 滑块 */
        document.getElementById('tsHeatSlider').addEventListener('input', function() {
            updateHeatUI(this.value);
        });

        /* Typing Style 选择 */
        function updateTypingStyleUI() {
            var cur = getTypingStyle();
            document.querySelectorAll('.ts-style-opt').forEach(function(btn) {
                var val = parseInt(btn.dataset.tsStyle, 10);
                var isActive = val === cur;
                btn.style.background = isActive ? '#2a2830' : 'transparent';
                btn.style.color = isActive ? '#fff' : 'rgba(42,40,48,0.5)';
                btn.style.borderColor = isActive ? '#2a2830' : 'rgba(42,40,48,0.12)';
            });
        }
        document.querySelectorAll('.ts-style-opt').forEach(function(btn) {
            btn.addEventListener('click', function() {
                localStorage.setItem('theatre-typing-style', btn.dataset.tsStyle);
                updateTypingStyleUI();
            });
        });
        updateTypingStyleUI();

        /* Badge Style 选择 */
        function updateBadgeStyleUI() {
            var cur = getBadgeStyle();
            document.querySelectorAll('.ts-badge-opt').forEach(function(btn) {
                var val = parseInt(btn.dataset.tbStyle, 10);
                var isActive = val === cur;
                btn.style.background = isActive ? '#2a2830' : 'transparent';
                btn.style.color = isActive ? '#fff' : 'rgba(42,40,48,0.5)';
                btn.style.borderColor = isActive ? '#2a2830' : 'rgba(42,40,48,0.12)';
            });
        }
        document.querySelectorAll('.ts-badge-opt').forEach(function(btn) {
            btn.addEventListener('click', function() {
                localStorage.setItem('theatre-badge-style', btn.dataset.tbStyle);
                updateBadgeStyleUI();
                renderMessages();
            });
        });
        updateBadgeStyleUI();

        /* Detail Style 选择 */
        function updateDetailStyleUI() {
            var cur = getDetailStyle();
            document.querySelectorAll('.ts-detail-opt').forEach(function(btn) {
                var isActive = btn.dataset.tdStyle === cur;
                btn.style.background = isActive ? '#2a2830' : 'transparent';
                btn.style.color = isActive ? '#fff' : 'rgba(42,40,48,0.5)';
                btn.style.borderColor = isActive ? '#2a2830' : 'rgba(42,40,48,0.12)';
            });
        }
        document.querySelectorAll('.ts-detail-opt').forEach(function(btn) {
            btn.addEventListener('click', function() {
                localStorage.setItem('theatre-detail-style', btn.dataset.tdStyle);
                updateDetailStyleUI();
                if (_tsInvoking) {
                    var style = getTypingStyle();
                    var fancy = document.getElementById('tsTypingFancy');
                    if (fancy && fancy.classList.contains('show')) {
                        var wasOpen = false;
                        var oldPanel = document.getElementById('tfDetailPanel');
                        if (oldPanel && oldPanel.classList.contains('open')) wasOpen = true;
                        fancy.style.position = 'relative';
                        fancy.style.overflow = 'visible';
                        fancy.innerHTML = buildFancyTypingHTML(style) + buildDetailPanelHTML();
                        if (wasOpen) {
                            var newPanel = document.getElementById('tfDetailPanel');
                            if (newPanel) newPanel.classList.add('open');
                            var ds = getDetailStyle();
                            if (ds === 'a' || ds === 'e') fancy.classList.add('detail-open');
                            else fancy.classList.remove('detail-open');
                        }
                    }
                }
            });
        });
        updateDetailStyleUI();

        /* Director Style 选择 */
        function updateDirectorStyleUI() {
            var cur = getDirectorStyle();
            document.querySelectorAll('.ts-dir-opt').forEach(function(btn) {
                var val = parseInt(btn.dataset.dirStyle, 10);
                var isActive = val === cur;
                btn.style.background = isActive ? '#2a2830' : 'transparent';
                btn.style.color = isActive ? '#fff' : 'rgba(42,40,48,0.5)';
                btn.style.borderColor = isActive ? '#2a2830' : 'rgba(42,40,48,0.12)';
            });
        }
        document.querySelectorAll('.ts-dir-opt').forEach(function(btn) {
            btn.addEventListener('click', function() {
                localStorage.setItem('theatre-director-style', btn.dataset.dirStyle);
                updateDirectorStyleUI();
                renderMessages();
            });
        });
        updateDirectorStyleUI();

        /* 人称设置 */
        function getTheatrePov() {
            if (!curTheatre) return 'first';
            return localStorage.getItem('theatre-pov-' + curTheatre.id) || 'first';
        }
        function saveTheatrePov(pov) {
            if (!curTheatre) return;
            localStorage.setItem('theatre-pov-' + curTheatre.id, pov);
        }
        function updatePovUI() {
            var pov = getTheatrePov();
            document.querySelectorAll('.ts-pov-btn').forEach(function(btn) {
                var isActive = btn.dataset.pov === pov;
                btn.style.background = isActive ? '#2a2830' : 'transparent';
                btn.style.color = isActive ? '#fff' : 'rgba(42,40,48,0.5)';
                btn.style.borderColor = isActive ? '#2a2830' : 'rgba(42,40,48,0.12)';
            });
        }
        document.querySelectorAll('.ts-pov-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                saveTheatrePov(btn.dataset.pov);
                updatePovUI();
            });
        });
        updatePovUI();

        /* 轮数滑块持久化 */
        document.getElementById('tsRoundsSlider').addEventListener('input', function() {
            document.getElementById('tsRoundsVal').textContent = this.value;
            localStorage.setItem('theatre-context-rounds', this.value);
        });
        var savedRounds = localStorage.getItem('theatre-context-rounds');
        if (savedRounds) {
            document.getElementById('tsRoundsSlider').value = savedRounds;
            document.getElementById('tsRoundsVal').textContent = savedRounds;
        }

        /* 侧边栏折叠 */
        document.getElementById('tsTokenToggle').addEventListener('click', function() {
            document.getElementById('tsTokenSection').classList.toggle('open');
        });
        document.getElementById('tsTokenSlider').addEventListener('input', function() {
            document.getElementById('tsTokenVal').textContent = this.value;
            localStorage.setItem('theatre-max-tokens', this.value);
        });
        var savedTokens = localStorage.getItem('theatre-max-tokens');
        if (savedTokens) {
            document.getElementById('tsTokenSlider').value = savedTokens;
            document.getElementById('tsTokenVal').textContent = savedTokens;
        }
        /* 面具选择 */
        document.getElementById('tsMaskToggle').addEventListener('click', function() {
            document.getElementById('tsMaskSection').classList.toggle('open');
            if (document.getElementById('tsMaskSection').classList.contains('open')) {
                renderTsMaskList();
            }
        });

        function renderTsMaskList() {
            var listEl = document.getElementById('tsMaskList');
            if (!listEl) return;
            var masks = [];
            try { masks = JSON.parse(localStorage.getItem('ca-user-masks') || '[]'); } catch(e) {}
            if (masks.length === 0) {
                listEl.innerHTML = '<div style="font-size:10px;color:rgba(42,40,48,0.35);text-align:center;padding:10px 0;font-style:italic;">No masks configured</div>';
                return;
            }
            var html = '';
            masks.forEach(function(mask) {
                var isActive = mask.active;
                var avHtml = mask.avatar ? '<img src="' + mask.avatar + '">' : esc(mask.name ? mask.name.charAt(0).toUpperCase() : '?');
                html += '<div class="ts-mask-row" data-mask-id="' + mask.id + '">' +
                    '<div class="ts-mask-av">' + avHtml + '</div>' +
                    '<div class="ts-mask-info">' +
                        '<div class="ts-mask-name">' + esc(mask.name || 'Unnamed') + '</div>' +
                        '<div class="ts-mask-bio">' + esc((mask.bio || '').substring(0, 30)) + '</div>' +
                    '</div>' +
                    '<div class="ts-mask-check' + (isActive ? ' on' : '') + '"></div>' +
                '</div>';
            });
            listEl.innerHTML = html;
            listEl.querySelectorAll('.ts-mask-row').forEach(function(row) {
                row.addEventListener('click', function() {
                    var id = row.dataset.maskId;
                    var masks2 = [];
                    try { masks2 = JSON.parse(localStorage.getItem('ca-user-masks') || '[]'); } catch(e) {}
                    masks2.forEach(function(m) { m.active = (m.id === id); });
                    localStorage.setItem('ca-user-masks', JSON.stringify(masks2));
                    renderTsMaskList();
                });
            });
        }

        /* 世界书 */
        document.getElementById('tsWbToggle').addEventListener('click', function() {
            document.getElementById('tsWbSection').classList.toggle('open');
            if (document.getElementById('tsWbSection').classList.contains('open')) {
                renderTsWbList();
            }
        });

        function getTheatreWbConfig() {
            try { return JSON.parse(localStorage.getItem('theatre-wb-config') || '{}'); } catch(e) { return {}; }
        }
        function saveTheatreWbConfig(cfg) {
            localStorage.setItem('theatre-wb-config', JSON.stringify(cfg));
        }

        function renderTsWbList() {
            var listEl = document.getElementById('tsWbList');
            if (!listEl) return;
            var entries = [];
            try { entries = JSON.parse(localStorage.getItem('wb-entries') || '[]'); } catch(e) {}
            if (entries.length === 0) {
                listEl.innerHTML = '<div style="font-size:10px;color:rgba(42,40,48,0.35);text-align:center;padding:10px 0;font-style:italic;">No world book entries</div>';
                return;
            }
            var cfg = getTheatreWbConfig();
            var html = '';
            entries.forEach(function(entry) {
                var isOn = cfg[entry.id] !== false;
                var posLabel = entry.position === 'after_char' ? 'CHAR' : entry.position === 'after_prompt' ? 'END' : 'PRE';
                html += '<div class="ts-wb-row" data-wb-id="' + entry.id + '">' +
                    '<span class="ts-wb-name">' + esc(entry.name || 'Untitled') + '</span>' +
                    '<span class="ts-wb-pos">' + posLabel + '</span>' +
                    '<div class="ts-wb-toggle' + (isOn ? ' on' : '') + '" data-wb-id="' + entry.id + '"></div>' +
                '</div>';
            });
            listEl.innerHTML = html;
            listEl.querySelectorAll('.ts-wb-toggle').forEach(function(tog) {
                tog.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var id = tog.dataset.wbId;
                    var cfg2 = getTheatreWbConfig();
                    var isCurrentlyOn = tog.classList.contains('on');
                    cfg2[id] = !isCurrentlyOn;
                    tog.classList.toggle('on', !isCurrentlyOn);
                    saveTheatreWbConfig(cfg2);
                });
            });
        }

        /* 编辑剧场信息 */
        document.getElementById('tsEditToggle').addEventListener('click', function() {
            var sec = document.getElementById('tsEditSection');
            sec.classList.toggle('open');
            if (sec.classList.contains('open') && curTheatre) {
                document.getElementById('tsEditTitle').value = curTheatre.title || '';
                document.getElementById('tsEditPremise').value = curTheatre.premise || '';
            }
        });
        document.getElementById('tsEditTheatreSave').addEventListener('click', function() {
            if (!curTheatre) return;
            var newTitle = document.getElementById('tsEditTitle').value.trim();
            var newPremise = document.getElementById('tsEditPremise').value.trim();
            if (newTitle) curTheatre.title = newTitle;
            curTheatre.premise = newPremise;
            var theatres = loadTheatres();
            for (var i = 0; i < theatres.length; i++) {
                if (theatres[i].id === curTheatre.id) {
                    theatres[i] = curTheatre;
                    break;
                }
            }
            saveTheatres(theatres);
            document.getElementById('tsActLabel').textContent = 'Act · ' + (curTheatre.title || 'Untitled');
            document.getElementById('tsInfoPremise').textContent = curTheatre.premise || '无前提设定';
            document.getElementById('tsSbPremise').textContent = curTheatre.premise || '无前提设定';
            var btn = document.getElementById('tsEditTheatreSave');
            btn.textContent = '✓ Saved';
            setTimeout(function() { btn.textContent = 'Save Changes'; }, 1200);
            /* 实时同步卡片列表 */
            var appEl = document.getElementById('theatreApp');
            if (appEl && appEl.classList.contains('open') && typeof window.openTheatreApp === 'function') {
                window.openTheatreApp();
            }
        });

        /* 角色管理 */
        document.getElementById('tsCastToggle').addEventListener('click', function() {
            document.getElementById('tsCastSection').classList.toggle('open');
            if (document.getElementById('tsCastSection').classList.contains('open')) {
                renderTsCastList();
            }
        });

        function getTheatreCast() {
            if (!curTheatre) return [];
            try { return JSON.parse(localStorage.getItem('theatre-cast-' + curTheatre.id) || '[]'); } catch(e) { return []; }
        }
        function saveTheatreCast(cast) {
            if (!curTheatre) return;
            localStorage.setItem('theatre-cast-' + curTheatre.id, JSON.stringify(cast));
        }

        function renderTsCastList() {
            var listEl = document.getElementById('tsCastList');
            if (!listEl) return;
            var cast = getTheatreCast();
            var defaultColors = ['#2a2830','#48484a','#636366','#8e8e93','#aeaeb2'];
            var html = '';
            cast.forEach(function(c, idx) {
                var color = c.color || defaultColors[idx % defaultColors.length];
                var initial = c.name ? c.name.charAt(0).toUpperCase() : '?';
                var avContent = c.avatar ? '<img src="' + c.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">' : esc(initial);
                html += '<div class="ts-cast-row" data-cast-idx="' + idx + '">' +
                    '<div class="ts-cast-av" style="background:' + color + ';cursor:pointer;overflow:hidden;" data-cast-idx="' + idx + '">' + avContent + '<input type="file" accept="image/*" style="display:none;" data-cast-idx="' + idx + '"></div>' +
                    '<div class="ts-cast-name">' + esc(c.name || 'Unnamed') + '</div>' +
                    '<div class="ts-cast-color" style="background:' + color + ';"><input type="color" value="' + color + '" data-cast-idx="' + idx + '"></div>' +
                    '<div class="ts-cast-del" data-cast-idx="' + idx + '"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>' +
                '</div>';
            });
            html += '<div class="ts-cast-add" id="tsCastAdd"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Add Character</span></div>';
            listEl.innerHTML = html;

            listEl.querySelectorAll('.ts-cast-color input').forEach(function(inp) {
                inp.addEventListener('change', function() {
                    var idx = parseInt(inp.dataset.castIdx, 10);
                    var cast2 = getTheatreCast();
                    if (cast2[idx]) {
                        cast2[idx].color = inp.value;
                        saveTheatreCast(cast2);
                        renderTsCastList();
                    }
                });
            });
            /* 头像上传 */
            listEl.querySelectorAll('.ts-cast-av').forEach(function(avEl) {
                var fileInput = avEl.querySelector('input[type="file"]');
                if (!fileInput) return;
                avEl.addEventListener('click', function(e) {
                    if (e.target === fileInput) return;
                    e.stopPropagation();
                    fileInput.click();
                });
                fileInput.addEventListener('change', function(e) {
                    e.stopPropagation();
                    var file = e.target.files[0];
                    if (!file) return;
                    var img = new Image();
                    img.onload = function() {
                        var canvas = document.createElement('canvas');
                        var size = 100; canvas.width = size; canvas.height = size;
                        var ctx = canvas.getContext('2d');
                        var min = Math.min(img.width, img.height);
                        var sx = (img.width - min) / 2, sy = (img.height - min) / 2;
                        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
                        var dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        var idx2 = parseInt(fileInput.dataset.castIdx, 10);
                        var cast3 = getTheatreCast();
                        if (cast3[idx2]) {
                            cast3[idx2].avatar = dataUrl;
                            saveTheatreCast(cast3);
                            renderTsCastList();
                        }
                    };
                    img.src = URL.createObjectURL(file);
                });
            });

            listEl.querySelectorAll('.ts-cast-del').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var idx = parseInt(btn.dataset.castIdx, 10);
                    var cast2 = getTheatreCast();
                    cast2.splice(idx, 1);
                    saveTheatreCast(cast2);
                    renderTsCastList();
                });
            });
            listEl.querySelectorAll('.ts-cast-name').forEach(function(nameEl) {
                nameEl.addEventListener('click', function() {
                    var row = nameEl.closest('.ts-cast-row');
                    var idx = parseInt(row.dataset.castIdx, 10);
                    var cast2 = getTheatreCast();
                    var c = cast2[idx];
                    if (!c) return;

                    /* 弹出编辑面板 */
                    var existing = document.getElementById('tsCastEditPopup');
                    if (existing) existing.remove();

                    var popup = document.createElement('div');
                    popup.id = 'tsCastEditPopup';
                    popup.style.cssText = 'background:#fff;border:1px solid rgba(42,40,48,0.12);border-radius:14px;padding:16px;margin-top:8px;box-shadow:0 8px 24px rgba(0,0,0,0.08);';

                    var isVirtual = c.virtual || !c.entityId;
                    popup.innerHTML =
                        '<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:10px;">Edit Character</div>' +
                        '<div style="margin-bottom:10px;">' +
                            '<div style="font-size:9px;font-weight:700;color:rgba(42,40,48,0.5);margin-bottom:4px;">Name / 名字</div>' +
                            '<input type="text" id="tsCastEditName" value="' + esc(c.name || '') + '" style="width:100%;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:8px;padding:8px 10px;font-size:12px;font-weight:600;color:#2a2830;outline:none;">' +
                        '</div>' +
                        (isVirtual ? '<div style="margin-bottom:10px;">' +
                            '<div style="font-size:9px;font-weight:700;color:rgba(42,40,48,0.5);margin-bottom:4px;">Persona / 人设</div>' +
                            '<textarea id="tsCastEditPersona" style="width:100%;background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:8px;padding:8px 10px;font-size:11px;color:#2a2830;outline:none;resize:none;height:80px;font-family:Georgia,serif;font-style:italic;line-height:1.6;">' + esc(c.persona || '') + '</textarea>' +
                        '</div>' : '<div style="font-size:9px;color:rgba(42,40,48,0.35);font-style:italic;margin-bottom:10px;line-height:1.5;">This character is linked to a contact. Persona is loaded from their profile.</div>') +
                        '<div style="display:flex;gap:8px;">' +
                            '<button id="tsCastEditCancel" style="flex:1;padding:9px;border-radius:20px;border:1px solid rgba(42,40,48,0.12);background:transparent;font-size:9px;font-weight:700;color:rgba(42,40,48,0.5);cursor:pointer;">Cancel</button>' +
                            '<button id="tsCastEditSave" style="flex:1;padding:9px;border-radius:20px;border:none;background:#2a2830;color:#fff;font-size:9px;font-weight:700;cursor:pointer;">Save</button>' +
                        '</div>';

                    row.parentNode.insertBefore(popup, row.nextSibling);

                    document.getElementById('tsCastEditCancel').addEventListener('click', function() {
                        popup.remove();
                    });

                    document.getElementById('tsCastEditSave').addEventListener('click', function() {
                        var nameInput = document.getElementById('tsCastEditName');
                        var personaInput = document.getElementById('tsCastEditPersona');
                        var newName = nameInput ? nameInput.value.trim() : '';
                        if (newName) c.name = newName;
                        if (personaInput && isVirtual) {
                            c.persona = personaInput.value.trim();
                        }
                        cast2[idx] = c;
                        saveTheatreCast(cast2);
                        popup.remove();
                        renderTsCastList();
                    });
                });
                nameEl.style.cursor = 'pointer';
            });
            document.getElementById('tsCastAdd').addEventListener('click', function() {
                /* 弹出选择：从联系人导入 or 新建虚拟角色 */
                var existing = document.getElementById('tsCastAddPopup');
                if (existing) { existing.remove(); return; }

                var popup = document.createElement('div');
                popup.id = 'tsCastAddPopup';
                popup.style.cssText = 'background:rgba(42,40,48,0.03);border:1px solid rgba(42,40,48,0.1);border-radius:12px;padding:12px;margin-top:8px;';

                var entities = [];
                try {
                    var req = indexedDB.open('CoutureOS_ChatDB');
                    req.onsuccess = function(e) {
                        var db = e.target.result;
                        if (!db.objectStoreNames.contains('entities')) { buildPopup([]); return; }
                        var tx = db.transaction(['entities'], 'readonly');
                        var entReq = tx.objectStore('entities').getAll();
                        entReq.onsuccess = function(ev) { buildPopup(ev.target.result || []); };
                        entReq.onerror = function() { buildPopup([]); };
                    };
                    req.onerror = function() { buildPopup([]); };
                } catch(err) { buildPopup([]); }

                function buildPopup(ents) {
                    var cast2 = getTheatreCast();
                    var existingNames = cast2.map(function(c) { return c.name; });
                    var html = '<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:8px;">From Contacts / 从联系人</div>';

                    var available = ents.filter(function(en) {
                        var dispName = en.nickname || en.name;
                        if (existingNames.indexOf(dispName) !== -1) return false;
                        /* 排除剧场主角色本人 */
                        if (curTheatre && en.id === curTheatre.entityId) return false;
                        return true;
                    });
                    if (available.length > 0) {
                        available.forEach(function(en) {
                            var dispName = en.nickname || en.name;
                            html += '<div class="ts-cast-pick" data-name="' + esc(dispName) + '" data-id="' + en.id + '" style="display:flex;align-items:center;gap:8px;padding:8px 6px;cursor:pointer;border-radius:8px;transition:background 0.2s;">' +
                                '<div style="width:20px;height:20px;border-radius:50%;background:#2a2830;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;">' + esc(dispName.charAt(0).toUpperCase()) + '</div>' +
                                '<span style="font-size:11px;font-weight:600;color:#2a2830;">' + esc(dispName) + '</span>' +
                            '</div>';
                        });
                    } else {
                        html += '<div style="font-size:10px;color:rgba(42,40,48,0.35);font-style:italic;padding:6px 0;">No available contacts</div>';
                    }

                    html += '<div style="border-top:1px solid rgba(42,40,48,0.06);margin-top:10px;padding-top:10px;">' +
                        '<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:rgba(42,40,48,0.4);text-transform:uppercase;margin-bottom:8px;">Custom / 自定义虚拟角色</div>' +
                        '<div class="ts-cast-pick-custom" style="display:flex;align-items:center;gap:8px;padding:8px 6px;cursor:pointer;border-radius:8px;transition:background 0.2s;">' +
                            '<div style="width:20px;height:20px;border-radius:50%;background:rgba(42,40,48,0.1);display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:rgba(42,40,48,0.5);fill:none;stroke-width:2;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>' +
                            '<span style="font-size:11px;font-weight:600;color:rgba(42,40,48,0.6);">Create Virtual Character</span>' +
                        '</div>' +
                    '</div>';

                    popup.innerHTML = html;
                    var addBtn = document.getElementById('tsCastAdd');
                    addBtn.parentNode.insertBefore(popup, addBtn.nextSibling);

                    /* 绑定联系人选择 */
                    popup.querySelectorAll('.ts-cast-pick').forEach(function(pick) {
                        pick.addEventListener('click', function() {
                            var name = pick.dataset.name;
                            var colors = ['#2a2830','#48484a','#636366','#8e8e93','#aeaeb2'];
                            var c2 = getTheatreCast();
                            c2.push({ name: name, color: colors[c2.length % colors.length], entityId: pick.dataset.id });
                            saveTheatreCast(c2);
                            popup.remove();
                            renderTsCastList();
                        });
                    });

                    /* 绑定自定义创建 */
                    popup.querySelector('.ts-cast-pick-custom').addEventListener('click', function() {
                        var name = prompt('新角色名:');
                        if (!name || !name.trim()) return;
                        var colors = ['#2a2830','#48484a','#636366','#8e8e93','#aeaeb2'];
                        var c2 = getTheatreCast();
                        c2.push({ name: name.trim(), color: colors[c2.length % colors.length], virtual: true });
                        saveTheatreCast(c2);
                        popup.remove();
                        renderTsCastList();
                    });
                }
            });
        }

        document.getElementById('tsPremiseToggle').addEventListener('click', function() {
            document.getElementById('tsPremiseSection').classList.toggle('open');
        });
        document.getElementById('tsBgToggle').addEventListener('click', function() {
            document.getElementById('tsBgSection').classList.toggle('open');
        });
        document.getElementById('tsBgApply').addEventListener('click', function() {
            var url = document.getElementById('tsBgUrl').value.trim();
            if (url && curTheatre) {
                localStorage.setItem('theatre-bg-' + curTheatre.id, url);
                var bgEl = document.getElementById('tsBg');
                bgEl.style.cssText = 'position:absolute;inset:0;z-index:0;background-image:url(\'' + url + '\');background-size:cover;background-position:center;background-repeat:no-repeat;';
                document.getElementById('tsBgDim').style.background = 'rgba(255,255,255,0.35)';
            }
        });
        document.getElementById('tsBgReset').addEventListener('click', function() {
            if (curTheatre) {
                localStorage.removeItem('theatre-bg-' + curTheatre.id);
                var bgEl = document.getElementById('tsBg');
                bgEl.style.cssText = 'position:absolute;inset:0;z-index:0;background:#f7f5f2;';
                document.getElementById('tsBgDim').style.background = 'rgba(255,255,255,0.45)';
                document.getElementById('tsBgUrl').value = '';
            }
        });
        document.getElementById('tsBgUploadBtn').addEventListener('click', function() {
            document.getElementById('tsBgUpload').click();
        });
        document.getElementById('tsBgUpload').addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file || !curTheatre) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                var img = new Image();
                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    var maxS = 1600;
                    var w = img.width, h = img.height;
                    if (w > maxS) { h = Math.round(h * maxS / w); w = maxS; }
                    if (h > maxS) { w = Math.round(w * maxS / h); h = maxS; }
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    var dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                    localStorage.setItem('theatre-bg-' + curTheatre.id, dataUrl);
                    var bgEl = document.getElementById('tsBg');
                    bgEl.style.cssText = 'position:absolute;inset:0;z-index:0;background-image:url(\'' + dataUrl + '\');background-size:cover;background-position:center;background-repeat:no-repeat;';
                    document.getElementById('tsBgDim').style.background = 'rgba(255,255,255,0.35)';
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            this.value = '';
        });
        document.getElementById('tsPersonaToggle').addEventListener('click', function() {
            document.getElementById('tsPersonaSection').classList.toggle('open');
        });

        /* 总结设置折叠 */
        document.getElementById('tsSumToggle').addEventListener('click', function() {
            document.getElementById('tsSumSection').classList.toggle('open');
            if (document.getElementById('tsSumSection').classList.contains('open')) {
                refreshSumSourceOptions();
            }
        });

        /* 总结来源下拉：填充分支选项 */
        function refreshSumSourceOptions() {
            var sel = document.getElementById('tsSumSource');
            if (!sel || !curTheatre) return;
            var branches = [];
            try { branches = JSON.parse(localStorage.getItem('theatre-branches-' + curTheatre.id) || '[]'); } catch(e) {}
            var html = '<option value="current">当前对话（' + curMessages.length + ' 条）</option>';
            branches.forEach(function(br) {
                html += '<option value="' + br.id + '">' + esc(br.name) + '（' + br.msgCount + ' 条）</option>';
            });
            sel.innerHTML = html;
        }

        /* 总结范围切换 */
        function getSumMarker() {
            if (!curTheatre) return 0;
            return parseInt(localStorage.getItem('theatre-sum-marker-' + curTheatre.id) || '0', 10);
        }
        function updateSumRangeInfo() {
            var infoEl = document.getElementById('tsSumRangeInfo');
            if (!infoEl) return;
            var marker = getSumMarker();
            var total = curMessages.length;
            var rangeRadio = document.querySelector('input[name="tsSumRange"]:checked');
            var mode = rangeRadio ? rangeRadio.value : 'unsummarized';
            if (mode === 'unsummarized') {
                var unsumCount = total - marker;
                if (marker === 0) {
                    infoEl.textContent = '从未总结过，将总结全部 ' + total + ' 条消息。';
                } else if (unsumCount <= 0) {
                    infoEl.textContent = '已全部总结完毕（上次总结到第 ' + marker + ' 条），没有新消息。';
                } else {
                    infoEl.textContent = '上次总结到第 ' + marker + ' 条，将总结第 ' + (marker + 1) + ' - ' + total + ' 条（共 ' + unsumCount + ' 条新消息）。';
                }
            } else if (mode === 'all') {
                infoEl.textContent = '将总结全部 ' + total + ' 条消息（忽略已总结标记）。';
            } else {
                infoEl.textContent = '自定义范围，请用滑块选择起止位置。';
            }
        }
        function updateCustomSliders() {
            var total = curMessages.length || 1;
            var startSlider = document.getElementById('tsSumStartSlider');
            var endSlider = document.getElementById('tsSumEndSlider');
            if (startSlider) { startSlider.max = total; if (parseInt(startSlider.value) > total) startSlider.value = 1; }
            if (endSlider) { endSlider.max = total; if (parseInt(endSlider.value) > total) endSlider.value = total; }
            updateCustomRangeLabel();
        }
        function updateCustomRangeLabel() {
            var startVal = document.getElementById('tsSumStartSlider') ? document.getElementById('tsSumStartSlider').value : '1';
            var endVal = document.getElementById('tsSumEndSlider') ? document.getElementById('tsSumEndSlider').value : '20';
            var label = document.getElementById('tsSumRangeVal');
            if (label) label.textContent = startVal + ' - ' + endVal;
        }
        document.getElementById('tsSumRangeNew').addEventListener('change', function() {
            document.getElementById('tsSumRangeCustomRow').style.display = 'none';
            updateSumRangeInfo();
        });
        document.getElementById('tsSumRangeAll').addEventListener('change', function() {
            document.getElementById('tsSumRangeCustomRow').style.display = 'none';
            updateSumRangeInfo();
        });
        document.getElementById('tsSumRangeCustom').addEventListener('change', function() {
            document.getElementById('tsSumRangeCustomRow').style.display = 'block';
            updateCustomSliders();
            updateSumRangeInfo();
        });
        document.getElementById('tsSumStartSlider').addEventListener('input', function() {
            var endSlider = document.getElementById('tsSumEndSlider');
            if (parseInt(this.value) > parseInt(endSlider.value)) endSlider.value = this.value;
            updateCustomRangeLabel();
        });
        document.getElementById('tsSumEndSlider').addEventListener('input', function() {
            var startSlider = document.getElementById('tsSumStartSlider');
            if (parseInt(this.value) < parseInt(startSlider.value)) startSlider.value = this.value;
            updateCustomRangeLabel();
        });

        /* 侧边栏按钮 */
        document.getElementById('tsSbSummarize').addEventListener('click', function() {
            document.getElementById('tsSidebar').classList.remove('open');
            doSummarize();
        });
        document.getElementById('tsSbFreeze').addEventListener('click', function() {
            if (!curTheatre) return;
            curTheatre.status = 'frozen';
            var theatres = loadTheatres();
            for (var i = 0; i < theatres.length; i++) {
                if (theatres[i].id === curTheatre.id) {
                    theatres[i].status = 'frozen';
                    break;
                }
            }
            saveTheatres(theatres);
            document.getElementById('tsSidebar').classList.remove('open');
            document.getElementById('theatreScene').classList.remove('open');
        });
        document.getElementById('tsSbDelete').addEventListener('click', function() {
            if (!curTheatre) return;
            if (!confirm('确定删除这个剧场？所有对话将丢失。')) return;
            var theatres = loadTheatres();
            theatres = theatres.filter(function(t) { return t.id !== curTheatre.id; });
            saveTheatres(theatres);
            document.getElementById('tsSidebar').classList.remove('open');
            document.getElementById('theatreScene').classList.remove('open');
            curTheatre = null;
            curEnt = null;
            curMessages = [];
        });
    }

    /* ══════════════════════════════════════ Enter Scene ══════════════════════════════════════ */
    function enterScene(theatreId) {
        var theatres = loadTheatres();
        var theatre = theatres.find(function(t) { return t.id === theatreId; });
        if (!theatre) return;

        curTheatre = theatre;
        curMessages = theatre.messages || [];
        heat = 45;

        /* 迁移旧版番外记忆到统一 key */
        try {
            var oldKey = 'ca-memory-theatre-' + theatreId;
            var oldRaw = localStorage.getItem(oldKey);
            if (oldRaw) {
                var oldMem = JSON.parse(oldRaw);
                var mainKey = 'ca-memory-' + theatre.entityId;
                var existing = { high: [], mid: [], low: [] };
                try { var r = localStorage.getItem(mainKey); if (r) existing = JSON.parse(r); } catch(e) {}
                if (oldMem.high) existing.high = existing.high.concat(oldMem.high.map(function(l) { return l.indexOf('[THEATRE') === -1 ? '[THEATRE·番外] ' + l : l; }));
                if (oldMem.mid) existing.mid = existing.mid.concat(oldMem.mid.map(function(l) { return l.indexOf('[THEATRE') === -1 ? '[THEATRE·番外] ' + l : l; }));
                if (oldMem.low) existing.low = existing.low.concat(oldMem.low.map(function(l) { return l.indexOf('[THEATRE') === -1 ? '[THEATRE·番外] ' + l : l; }));
                localStorage.setItem(mainKey, JSON.stringify(existing));
                localStorage.removeItem(oldKey);
            }
        } catch(e) {}

        if (!built) {
            buildHTML();
            bindAll();
            built = true;
        }

        /* 预加载 cast 角色的 persona 和头像 */
        try {
            var castForLoad = JSON.parse(localStorage.getItem('theatre-cast-' + theatre.id) || '[]');
            var castChanged = false;
            var castRemaining = 0;
            castForLoad.forEach(function(c, idx) {
                if (c.entityId) {
                    castRemaining++;
                    loadEntFromDB(c.entityId, function(castEnt) {
                        if (castEnt) {
                            if (castEnt.persona) localStorage.setItem('ca-entity-persona-' + c.entityId, castEnt.persona);
                            /* 同步联系人头像到 cast */
                            if (castEnt.avatar && castEnt.avatar !== c.avatar) {
                                castForLoad[idx].avatar = castEnt.avatar;
                                castChanged = true;
                            }
                            /* 同步联系人颜色 */
                            if (castEnt.color && !c.avatar && !castForLoad[idx].color) {
                                castForLoad[idx].color = castEnt.color;
                                castChanged = true;
                            }
                        }
                        castRemaining--;
                        if (castRemaining === 0 && castChanged) {
                            localStorage.setItem('theatre-cast-' + theatre.id, JSON.stringify(castForLoad));
                            /* 头像加载完毕后重新渲染消息，确保历史记录中的头像同步 */
                            setTimeout(function() { renderMessages(); }, 100);
                        }
                    });
                }
            });
        } catch(e) {}

        /* 加载 entity */
        loadEntFromDB(theatre.entityId, function(ent) {
            curEnt = ent;
            var dispName = ent ? (ent.nickname || ent.name) : 'Unknown';
            var initial = dispName.charAt(0).toUpperCase();

            /* 更新顶栏 */
            document.getElementById('tsActLabel').textContent = 'Act · ' + (theatre.title || 'Untitled');
            var avatarEl = document.getElementById('tsAvatar');
            if (ent && ent.avatar) {
                avatarEl.innerHTML = '<img src="' + ent.avatar + '" style="width:100%;height:100%;object-fit:cover;">';
            } else {
                avatarEl.textContent = initial;
            }
            document.getElementById('tsInfoName').innerHTML = esc(dispName) + ' <span class="ts-info-badge">Theatre</span>';
            document.getElementById('tsInfoPremise').textContent = theatre.premise || '无前提设定';

            /* Heat */
            document.getElementById('tsHeatSlider').value = heat;
            updateHeatUI(heat);

            /* 侧边栏信息 */
            document.getElementById('tsSbPremise').textContent = theatre.premise || '无前提设定';
            document.getElementById('tsSbPersona').textContent = ent ? (ent.persona || 'AI Entity') : 'Unknown';

            /* 加载背景图 */
            var savedBg = localStorage.getItem('theatre-bg-' + theatre.id) || '';
            var bgEl = document.getElementById('tsBg');
            if (savedBg) {
                bgEl.style.cssText = 'position:absolute;inset:0;z-index:0;background-image:url(\'' + savedBg + '\');background-size:cover;background-position:center;background-repeat:no-repeat;';
                document.getElementById('tsBgDim').style.background = 'rgba(255,255,255,0.35)';
                document.getElementById('tsBgUrl').value = savedBg.length < 500 ? savedBg : '';
            } else {
                bgEl.style.cssText = 'position:absolute;inset:0;z-index:0;background:#f7f5f2;';
                document.getElementById('tsBgDim').style.background = 'rgba(255,255,255,0.45)';
                document.getElementById('tsBgUrl').value = '';
            }

            /* 渲染消息 */
            renderMessages();

            /* 同步 Event 按钮状态 */
            var evBtn = document.getElementById('tsEventBtn');
            if (evBtn && localStorage.getItem('theatre-event-on-' + theatre.id) === 'true') {
                evBtn.classList.add('accent');
                evBtn.innerHTML = '<span style="font-size:13px;">🎲</span>Event ON';
            }

            /* 打开界面 */
            document.getElementById('theatreScene').classList.add('open');
        });
    }

    /* ══════════════════════════════════════ Public API ══════════════════════════════════════ */
    window.openTheatreScene = function(theatreId) {
        enterScene(theatreId);
    };

})();
