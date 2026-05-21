// js/-A-15-chat-detail-alt-settings.js · 新聊天室设置页（小票风格）
(function(){
'use strict';

var settingsBuilt=false;
var settingsEntId=null;

function escapeHtml(str){var d=document.createElement('div');d.textContent=str;return d.innerHTML;}

function buildSettings(){
    if(settingsBuilt)return;
    settingsBuilt=true;
    var el=document.createElement('div');
    el.className='cda-settings';
    el.id='cdaSettings';
    document.body.appendChild(el);
}

function loadMemory(entId){
    try{return JSON.parse(localStorage.getItem('ca-memory-'+entId)||'{"high":[],"mid":[],"low":[]}');}catch(e){return{high:[],mid:[],low:[]};}
}
function saveMemory(entId,data){localStorage.setItem('ca-memory-'+entId,JSON.stringify(data));}

function loadApiConfig(){
    try{return JSON.parse(localStorage.getItem('ca-api-config')||'{}');}catch(e){return{};}
}
function saveApiConfig(cfg){localStorage.setItem('ca-api-config',JSON.stringify(cfg));}

function loadTimeConfig(){
    try{return JSON.parse(localStorage.getItem('ca-time-config')||'{"on":false}');}catch(e){return{on:false};}
}
function saveTimeConfig(cfg){localStorage.setItem('ca-time-config',JSON.stringify(cfg));}

function loadWatermarkConfig(){
    try{return JSON.parse(localStorage.getItem('ca-watermark-config')||'{"text":"Story"}');}catch(e){return{text:"Story"};}
}
function saveWatermarkConfig(cfg){localStorage.setItem('ca-watermark-config',JSON.stringify(cfg));}

function renderSettings(entId){
    var el=document.getElementById('cdaSettings');
    if(!el)return;
    settingsEntId=entId;

    var memData=loadMemory(entId);
    var apiConfig=loadApiConfig();
    var node=apiConfig.node||'primary';
    var cfg=apiConfig[node]||{};
    var timeConfig=loadTimeConfig();
    var wmConfig=loadWatermarkConfig();
    var memRounds=parseInt(localStorage.getItem('ca-mem-rounds-14-'+entId)||localStorage.getItem('ca-mem-rounds-'+entId)||'30',10);

    var avatarConfig;
    try{avatarConfig=JSON.parse(localStorage.getItem('ca-avatar-config')||'{"sent":false,"received":true}');}catch(e){avatarConfig={sent:false,received:true};}

    var animConfig;
    try{animConfig=JSON.parse(localStorage.getItem('ca-anim-config')||'{"sent":"fadeRise","received":"fadeRise"}');}catch(e){animConfig={sent:'fadeRise',received:'fadeRise'};}

    var transConfig;
    try{transConfig=JSON.parse(localStorage.getItem('ca-trans-config-14')||'{"style":"off","myLang":"Auto","transLang":"Chinese"}');}catch(e){transConfig={style:'off',myLang:'Auto',transLang:'Chinese'};}

    var wmOptions=['Story','Love','Dream','Chat','Yours','None'];
    var wmGridHtml='';
    wmOptions.forEach(function(w){
        var isActive=wmConfig.text===w?'active':'';
        var textStyle=w==='None'?'font-family:sans-serif;font-size:10px;':'';
        wmGridHtml+='<div class="cs-wm-item '+isActive+'" data-wm="'+w+'"><div class="cs-wm-text" style="'+textStyle+'">'+w+'</div></div>';
    });

    function renderMemLevel(level,label,items){
        var html='<div class="cs-mem-level"><div class="cs-mem-hd cs-mem-hd-toggle" data-level="'+level+'"><div class="cs-mem-badge '+level+'">'+label+'</div><div style="display:flex;align-items:center;gap:8px;"><div class="cs-mem-count">'+items.length+' 条</div><svg class="cs-mem-chevron" viewBox="0 0 24 24" style="width:12px;height:12px;stroke:rgba(26,26,31,0.25);fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);"><polyline points="6 9 12 15 18 9"/></svg></div></div>';
        html+='<div class="cs-mem-body" data-level="'+level+'" style="max-height:0;overflow:hidden;transition:max-height 0.4s cubic-bezier(0.16,1,0.3,1);">';
        items.forEach(function(item,idx){
            html+='<div class="cs-mem-item" data-level="'+level+'" data-idx="'+idx+'"><span class="cs-mem-item-text">'+escapeHtml(item)+'</span><button class="cs-mem-edit" data-level="'+level+'" data-idx="'+idx+'" style="width:18px;height:18px;border-radius:50%;border:none;background:rgba(26,26,31,0.06);color:rgba(26,26,31,0.4);font-size:9px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;">✎</button><button class="cs-mem-del" data-level="'+level+'" data-idx="'+idx+'" style="width:18px;height:18px;border-radius:50%;border:none;background:rgba(26,26,31,0.06);color:rgba(26,26,31,0.4);font-size:10px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;">×</button></div>';
        });
        html+='<div class="cs-mem-add"><input type="text" placeholder="添加记忆..." data-level="'+level+'"><button data-level="'+level+'">+</button></div>';
        html+='</div></div>';
        return html;
    }

    var entities=window._caEntities||[];
    var ent=entities.find(function(e){return e.id===entId;});
    var heroName=ent?(ent.nickname||ent.name):'Entity';
    var heroInitial=heroName.charAt(0).toUpperCase();
    var heroColor=ent&&ent.color?ent.color:'#1a1a1f';
    var heroAvHtml=ent&&ent.avatar?'<img src="'+ent.avatar+'" style="width:100%;height:100%;object-fit:cover;">':heroInitial;

    el.innerHTML=
        '<div class="cs-hero"><div class="cs-hero-bg"></div><div class="cs-hero-grain"></div><div class="cs-hero-wm">Profile</div>'+
            '<div class="cs-hero-back" id="csBack"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>返回</div>'+
            '<div class="cs-hero-fade"></div>'+
            '<div class="cs-hero-content">'+
                '<div style="position:relative;display:inline-block;cursor:pointer;" id="csHeroAvatarWrap">'+
                    '<div class="cs-hero-avatar" style="background:'+heroColor+';">'+heroAvHtml+'</div>'+
                    '<input type="file" id="csHeroAvatarInput" accept="image/*" style="display:none;">'+
                    '<svg style="position:absolute;bottom:-4px;right:-4px;z-index:3;pointer-events:none;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3));" width="16" height="14" viewBox="0 0 16 14"><path d="M8 12.5 C8 12.5, 1 8, 1 3.8 C1 1.7, 2.6 0.5, 4.2 0.5 C5.6 0.5, 6.8 1.3, 8 3 C9.2 1.3, 10.4 0.5, 11.8 0.5 C13.4 0.5, 15 1.7, 15 3.8 C15 8, 8 12.5, 8 12.5Z" fill="rgba(255,255,255,0.9)"/></svg>'+
                    '<svg style="position:absolute;inset:-20px;top:-16px;overflow:visible;pointer-events:none;z-index:2;" width="calc(100% + 40px)" height="calc(100% + 40px)" viewBox="0 0 100 100">'+
                        '<path d="M50 72 C50 72, 18 54, 18 34 C18 24, 26 17, 35 17 C41 17, 46 20, 50 25 C54 20, 59 17, 65 17 C74 17, 82 24, 82 34 C82 54, 50 72, 50 72Z" stroke="rgba(255,255,255,0.47)" stroke-width="1.6" stroke-dasharray="3 3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
                        '<path d="M82 84 C82 84, 70 76, 70 66 C70 61, 73 57, 77 57 C79.5 57, 81.5 58.5, 82 61 C82.5 58.5, 84.5 57, 87 57 C91 57, 94 61, 94 66 C94 76, 82 84, 82 84Z" stroke="rgba(255,255,255,0.13)" stroke-width="0.9" stroke-dasharray="2 4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
                        '<path d="M108 18 C108 18, 102 14, 102 9.5 C102 7.2, 103.6 5.5, 105.2 5.5 C106.4 5.5, 107.3 6.3, 108 7.5 C108.7 6.3, 109.6 5.5, 110.8 5.5 C112.4 5.5, 114 7.2, 114 9.5 C114 14, 108 18, 108 18Z" stroke="rgba(255,255,255,0.07)" stroke-width="0.7" stroke-dasharray="1.5 3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
                        '<path d="M120 50 C120 50, 116 47, 116 43.5 C116 41.8, 117.1 40.5, 118.3 40.5 C119.1 40.5, 119.7 41, 120 41.8 C120.3 41, 120.9 40.5, 121.7 40.5 C122.9 40.5, 124 41.8, 124 43.5 C124 47, 120 50, 120 50Z" stroke="rgba(255,255,255,0.1)" stroke-width="0.7" stroke-dasharray="1.5 3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
                        '<path d="M98 95 C98 95, 95 93, 95 90.5 C95 89.2, 95.9 88.2, 96.8 88.2 C97.5 88.2, 98 88.7, 98 89.4 C98 88.7, 98.5 88.2, 99.2 88.2 C100.1 88.2, 101 89.2, 101 90.5 C101 93, 98 95, 98 95Z" stroke="rgba(255,255,255,0.06)" stroke-width="0.6" stroke-dasharray="1.5 3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
                        '<path d="M130 72 C130 72, 127.5 70.5, 127.5 68.5 C127.5 67.4, 128.2 66.5, 129 66.5 C129.6 66.5, 130 67, 130 67.6 C130 67, 130.4 66.5, 131 66.5 C131.8 66.5, 132.5 67.4, 132.5 68.5 C132.5 70.5, 130 72, 130 72Z" stroke="rgba(255,255,255,0.05)" stroke-width="0.5" stroke-dasharray="1.5 3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
                        '<path d="M115 32 C115 32, 113 30.5, 113 28.8 C113 27.8, 113.6 27, 114.3 27 C114.8 27, 115 27.5, 115 28 C115 27.5, 115.2 27, 115.7 27 C116.4 27, 117 27.8, 117 28.8 C117 30.5, 115 32, 115 32Z" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" stroke-dasharray="1.5 3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
                        '<path d="M140 40 C140 40, 138 38.8, 138 37.2 C138 36.3, 138.6 35.5, 139.2 35.5 C139.7 35.5, 140 36, 140 36.5 C140 36, 140.3 35.5, 140.8 35.5 C141.4 35.5, 142 36.3, 142 37.2 C142 38.8, 140 40, 140 40Z" stroke="rgba(255,255,255,0.04)" stroke-width="0.5" stroke-dasharray="1.5 3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
                        '<path d="M105 62 C105 62, 103.5 61, 103.5 59.8 C103.5 59.1, 104 58.5, 104.5 58.5 C104.9 58.5, 105 58.9, 105 59.2 C105 58.9, 105.1 58.5, 105.5 58.5 C106 58.5, 106.5 59.1, 106.5 59.8 C106.5 61, 105 62, 105 62Z" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" stroke-dasharray="1.5 3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
                    '</svg>'+
                '</div>'+
                '<div class="cs-hero-info"><div class="cs-hero-name">'+escapeHtml(heroName)+'</div><div class="cs-hero-sub">Entity · Settings</div></div>'+
            '</div>'+
        '</div>'+
        '<div class="cs-body">'+

        '<div class="cs-section-hd"><div class="cs-section-title">Appearance</div><div class="cs-section-num">01 · 外观</div></div>'+
        '<div class="cs-ticket light cs-ticket-appearance"><div class="cs-ticket-hd"><div class="cs-ticket-label">Appearance · 外观</div><div class="cs-ticket-num">NO.01</div></div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8.5" cy="8.5" r="2.5"/><path d="M21 15l-5-5L5 21"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">聊天背景</div><div class="cs-acc-desc">Chat background image</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner">'+
                '<div class="cs-bg-preview" id="csBgPreview"><div class="cs-bg-preview-inner" id="csBgPreviewInner"></div><div class="cs-bg-preview-label">当前背景</div></div>'+
                '<div class="cs-bg-actions">'+
                    '<div class="cs-btn ghost" id="csBgUpload"><input type="file" accept="image/*" id="csBgFileInput" style="display:none;">选择图片</div>'+
                    '<div class="cs-btn ghost" id="csBgReset">恢复默认</div>'+
                '</div>'+
                '<div style="margin-top:12px;"><div style="font-size:9px;color:rgba(26,26,31,0.3);margin-bottom:6px;">模糊程度</div><div class="cs-slider-row"><input type="range" class="cs-slider" id="csBgBlur" min="0" max="20" step="1" value="'+(JSON.parse(localStorage.getItem('ca-bg-config')||'{}').blur||0)+'"><div class="cs-slider-val" id="csBgBlurVal">'+(JSON.parse(localStorage.getItem('ca-bg-config')||'{}').blur||0)+'</div></div></div>'+
                '<div style="margin-top:10px;"><div style="font-size:9px;color:rgba(26,26,31,0.3);margin-bottom:6px;">透明度</div><div class="cs-slider-row"><input type="range" class="cs-slider" id="csBgOpacity" min="0" max="100" step="5" value="'+(JSON.parse(localStorage.getItem('ca-bg-config')||'{}').opacity!==undefined?JSON.parse(localStorage.getItem('ca-bg-config')||'{}').opacity:100)+'"><div class="cs-slider-val" id="csBgOpacityVal">'+(JSON.parse(localStorage.getItem('ca-bg-config')||'{}').opacity!==undefined?JSON.parse(localStorage.getItem('ca-bg-config')||'{}').opacity:100)+'%</div></div></div>'+
                '</div></div>'+
            '</div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 17l3-5 3 3 4-5" opacity="0.5"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">气泡底纹</div><div class="cs-acc-desc">Watermark text on bubbles</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner"><div class="cs-wm-grid">'+wmGridHtml+'</div>'+
                '<div style="margin-top:12px;"><div style="font-size:9px;color:rgba(26,26,31,0.3);margin-bottom:4px;">自定义底纹文字</div><input type="text" id="csWmCustom" placeholder="Type custom text..." value="'+(wmOptions.indexOf(wmConfig.text)===-1?escapeHtml(wmConfig.text):'')+'" style="width:100%;border:none;border-bottom:0.5px solid rgba(26,26,31,0.1);background:transparent;font-size:12px;padding:6px 0;outline:none;color:#1a1a1f;"></div>'+
                '</div></div>'+
            '</div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">消息动效</div><div class="cs-acc-desc">Message animation style</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner">'+
                '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:10px;">我的消息 (Sent)</div>'+
                '<div class="cs-caps cs-anim-caps" id="csAnimSentCaps">'+
                    '<div class="cs-cap'+(animConfig.sent==='fadeRise'?' active':'')+'">Rise</div>'+
                    '<div class="cs-cap'+(animConfig.sent==='elastic'?' active':'')+'">Pop</div>'+
                    '<div class="cs-cap'+(animConfig.sent==='slideInk'?' active':'')+'">Ink</div>'+
                    '<div class="cs-cap'+(animConfig.sent==='twDrop'?' active':'')+'">Drop</div>'+
                    '<div class="cs-cap'+(animConfig.sent==='gravity'?' active':'')+'">Gravity</div>'+
                '</div>'+
                '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:10px;margin-top:14px;">对方消息 (Received)</div>'+
                '<div class="cs-caps cs-anim-caps" id="csAnimRecvCaps">'+
                    '<div class="cs-cap'+(animConfig.received==='fadeRise'?' active':'')+'">Rise</div>'+
                    '<div class="cs-cap'+(animConfig.received==='elastic'?' active':'')+'">Pop</div>'+
                    '<div class="cs-cap'+(animConfig.received==='slideInk'?' active':'')+'">Ink</div>'+
                    '<div class="cs-cap'+(animConfig.received==='twDrop'?' active':'')+'">Drop</div>'+
                    '<div class="cs-cap'+(animConfig.received==='gravity'?' active':'')+'">Gravity</div>'+
                '</div>'+
                '<div id="csAnimPreview" style="margin-top:14px;background:rgba(26,26,31,0.02);border-radius:12px;padding:12px;min-height:50px;max-height:160px;border:0.5px solid rgba(26,26,31,0.05);display:flex;flex-direction:column;gap:6px;overflow-y:auto;-webkit-overflow-scrolling:touch;"></div>'+
                '</div></div>'+
            '</div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">回复速度</div><div class="cs-acc-desc">Message delivery pace</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner">'+
                '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:10px;">气泡间隔倍率</div>'+
                '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;"><div style="font-size:9px;color:rgba(26,26,31,0.3);">快</div><div class="cs-slider-row" style="flex:1;margin:0;"><input type="range" class="cs-slider" id="csSpeedSlider" min="30" max="200" step="10" value="'+(JSON.parse(localStorage.getItem('ca-speed-config')||'{"rate":100}').rate||100)+'"></div><div style="font-size:9px;color:rgba(26,26,31,0.3);">慢</div></div>'+
                '<div style="display:flex;align-items:center;justify-content:space-between;"><div style="font-size:11px;font-weight:600;color:#1a1a1f;">当前倍率</div><div id="csSpeedVal" style="font-family:monospace;font-size:14px;font-weight:700;color:#1a1a1f;">'+(JSON.parse(localStorage.getItem('ca-speed-config')||'{"rate":100}').rate||100)+'%</div></div>'+
                '<div style="margin-top:12px;font-size:9px;color:rgba(26,26,31,0.25);line-height:1.5;">30% = 极快连发 · 100% = 默认节奏 · 200% = 慢悠悠</div>'+
                '</div></div>'+
            '</div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">头像显示</div><div class="cs-acc-desc">Show / hide avatars</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner">'+
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><span style="font-size:12px;font-weight:600;color:#1a1a1f;">对方头像</span><div class="cs-toggle'+(avatarConfig.received!==false?' on':'')+'" id="csAvatarRecvToggle"></div></div>'+
                '<div style="display:flex;align-items:center;justify-content:space-between;"><span style="font-size:12px;font-weight:600;color:#1a1a1f;">我的头像</span><div class="cs-toggle'+(avatarConfig.sent?' on':'')+'" id="csAvatarSentToggle"></div></div>'+
                '</div></div>'+
            '</div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2v3"/><path d="M14 18h6"/><path d="M17 22l-5-10-5 10"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">翻译设置</div><div class="cs-acc-desc">Style & target language</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner"><div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:8px;">翻译风格</div><div class="cs-trans-grid" id="csTransGrid">'+
                    '<div class="cs-trans-item'+(transConfig.style==='off'?' active':'')+'" data-style="off"><div class="cs-trans-icon">✕</div><div class="cs-trans-name">Off</div></div>'+
                    '<div class="cs-trans-item'+(transConfig.style==='underline'?' active':'')+'" data-style="underline"><div class="cs-trans-icon">━</div><div class="cs-trans-name">Underline</div></div>'+
                    '<div class="cs-trans-item'+(transConfig.style==='flip'?' active':'')+'" data-style="flip"><div class="cs-trans-icon">↻</div><div class="cs-trans-name">Flip</div></div>'+
                    '<div class="cs-trans-item'+(transConfig.style==='ghost'?' active':'')+'" data-style="ghost"><div class="cs-trans-icon">◇</div><div class="cs-trans-name">Ghost</div></div>'+
                    '<div class="cs-trans-item'+(transConfig.style==='ribbon'?' active':'')+'" data-style="ribbon"><div class="cs-trans-icon">▸</div><div class="cs-trans-name">Ribbon</div></div>'+
                    '<div class="cs-trans-item'+(transConfig.style==='ink'?' active':'')+'" data-style="ink"><div class="cs-trans-icon">◉</div><div class="cs-trans-name">Ink</div></div>'+
                    '<div class="cs-trans-item'+(transConfig.style==='curtain'?' active':'')+'" data-style="curtain"><div class="cs-trans-icon">▼</div><div class="cs-trans-name">Curtain</div></div>'+
                    '<div class="cs-trans-item'+(transConfig.style==='split'?' active':'')+'" data-style="split"><div class="cs-trans-icon">≡</div><div class="cs-trans-name">Split</div></div>'+
                    '<div class="cs-trans-item'+(transConfig.style==='typewriter'?' active':'')+'" data-style="typewriter"><div class="cs-trans-icon">▌</div><div class="cs-trans-name">Type</div></div>'+
                    '<div class="cs-trans-item'+(transConfig.style==='mirror'?' active':'')+'" data-style="mirror"><div class="cs-trans-icon">◫</div><div class="cs-trans-name">Mirror</div></div>'+
                    '<div class="cs-trans-item'+(transConfig.style==='stamp'?' active':'')+'" data-style="stamp"><div class="cs-trans-icon">◈</div><div class="cs-trans-name">Stamp</div></div>'+
                '</div>'+
                '<div class="cs-trans-preview" id="csTransPreview"><div class="cs-tp-label">Preview · 预览</div><div class="cs-tp-area" id="csTransPreviewArea"></div><div class="cs-tp-hint">点击气泡查看翻译效果</div></div>'+
                '<div style="display:flex;gap:12px;margin-top:14px;"><div style="flex:1;"><div style="font-size:9px;color:rgba(26,26,31,0.3);margin-bottom:4px;">My Language</div><input type="text" id="csTransMyLang" value="'+escapeHtml(transConfig.myLang||'Auto')+'" style="width:100%;border:none;border-bottom:0.5px solid rgba(26,26,31,0.1);background:transparent;font-size:12px;padding:5px 0;outline:none;color:#1a1a1f;"></div><div style="flex:1;"><div style="font-size:9px;color:rgba(26,26,31,0.3);margin-bottom:4px;">Translate To</div><input type="text" id="csTransTargetLang" value="'+escapeHtml(transConfig.transLang||'Chinese')+'" style="width:100%;border:none;border-bottom:0.5px solid rgba(26,26,31,0.1);background:transparent;font-size:12px;padding:5px 0;outline:none;color:#1a1a1f;"></div></div>'+
                '</div></div>'+
            '</div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">气泡字体</div><div class="cs-acc-desc">Font size & custom font</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner">'+
                '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:10px;">字体大小 / Font Size</div>'+
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">'+
                    '<span style="font-size:9px;color:rgba(26,26,31,0.3);">小</span>'+
                    '<div class="cs-slider-row" style="flex:1;margin:0;"><input type="range" class="cs-slider" id="csFontSize" min="11" max="18" step="1" value="'+(function(){try{return JSON.parse(localStorage.getItem('ca-bubble-font')||'{}').size||13;}catch(e){return 13;}})()+'""></div>'+
                    '<span style="font-size:9px;color:rgba(26,26,31,0.3);">大</span>'+
                    '<span id="csFontSizeVal" style="font-family:monospace;font-size:12px;font-weight:700;color:#1a1a1f;min-width:28px;text-align:center;">'+(function(){try{return JSON.parse(localStorage.getItem('ca-bubble-font')||'{}').size||13;}catch(e){return 13;}})()+' px</span>'+
                '</div>'+
                '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:8px;">自定义字体 / Custom Font</div>'+
                '<div style="font-size:8px;color:rgba(26,26,31,0.25);margin-bottom:8px;line-height:1.5;">输入字体名称，或粘贴图床字体 URL（.woff2/.ttf/.otf）</div>'+
                '<input type="text" id="csFontName" placeholder="例: Noto Serif SC, LXGW WenKai..." value="'+(function(){try{return JSON.parse(localStorage.getItem('ca-bubble-font')||'{}').name||'';}catch(e){return '';}})()+'" style="width:100%;border:none;border-bottom:0.5px solid rgba(26,26,31,0.1);background:transparent;font-size:12px;padding:6px 0;outline:none;color:#1a1a1f;margin-bottom:12px;">'+
                '<input type="text" id="csFontUrl" placeholder="字体文件 URL（选填）" value="'+(function(){try{return JSON.parse(localStorage.getItem('ca-bubble-font')||'{}').url||'';}catch(e){return '';}})()+'" style="width:100%;border:none;border-bottom:0.5px solid rgba(26,26,31,0.1);background:transparent;font-size:12px;padding:6px 0;outline:none;color:#1a1a1f;margin-bottom:12px;">'+
                '<div class="cs-btns"><div class="cs-btn ghost" id="csFontReset" style="background:transparent;border:1px solid rgba(26,26,31,0.15);color:#1a1a1f;">Reset</div><div class="cs-btn dark" id="csFontApply" style="background:#1a1a1f;color:#fff;">Apply</div></div>'+
                '</div></div>'+
            '</div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">自定义样式</div><div class="cs-acc-desc">Inject CSS overrides</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner"><textarea id="csCssInput" style="width:100%;height:70px;background:rgba(26,26,31,0.02);border:0.5px solid rgba(26,26,31,0.06);border-radius:10px;padding:10px;font-family:monospace;font-size:10px;color:#1a1a1f;outline:none;resize:none;line-height:1.5;" placeholder="/* custom styles */">'+(localStorage.getItem('ca-custom-css')||'')+'</textarea><div class="cs-btns"><div class="cs-btn ghost" id="csCssReset">Reset</div><div class="cs-btn dark" id="csCssSave">Apply</div></div></div></div>'+
            '</div>'+
        '</div>'+

        '<div class="cs-ticket dark"><div class="cs-ticket-hd"><div class="cs-ticket-label">Behavior · 行为</div><div class="cs-ticket-num">NO.02</div></div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">时间感知</div><div class="cs-acc-desc">Time awareness injection</div></div><div class="cs-toggle'+(timeConfig.on?' on':'')+'" id="csTimeToggle"></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner">'+
                '<div style="text-align:center;margin-bottom:16px;padding:12px;background:rgba(255,255,255,0.04);border-radius:10px;border:0.5px solid rgba(255,255,255,0.08);"><div style="font-size:9px;color:rgba(255,255,255,0.3);margin-bottom:4px;letter-spacing:1px;text-transform:uppercase;">Current Time</div><div id="csTimeClock" style="font-family:monospace;font-size:22px;font-weight:700;color:#fff;letter-spacing:2px;">--</div></div>'+
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><span style="font-size:11px;font-weight:600;color:#fff;">自定义时间</span><div class="cs-toggle'+(timeConfig.custom?' on':'')+'" id="csTimeCustomToggle"></div></div>'+
                '<div id="csTimeCustomInputs" style="display:'+(timeConfig.custom?'block':'none')+';">'+
                '<div style="display:flex;gap:8px;">'+
                '<div style="flex:1;text-align:center;"><div style="font-size:8px;color:rgba(255,255,255,0.3);margin-bottom:3px;">月</div><input type="number" id="csTcMonth" value="'+(timeConfig.customMonth||new Date().getMonth()+1)+'" min="1" max="12" style="width:100%;border:none;border-bottom:0.5px solid rgba(255,255,255,0.12);background:transparent;font-size:14px;font-weight:700;text-align:center;padding:4px 0;outline:none;color:#fff;"></div>'+
                '<div style="flex:1;text-align:center;"><div style="font-size:8px;color:rgba(255,255,255,0.3);margin-bottom:3px;">日</div><input type="number" id="csTcDay" value="'+(timeConfig.customDay||new Date().getDate())+'" min="1" max="31" style="width:100%;border:none;border-bottom:0.5px solid rgba(255,255,255,0.12);background:transparent;font-size:14px;font-weight:700;text-align:center;padding:4px 0;outline:none;color:#fff;"></div>'+
                '<div style="flex:1;text-align:center;"><div style="font-size:8px;color:rgba(255,255,255,0.3);margin-bottom:3px;">时</div><input type="number" id="csTcHour" value="'+(timeConfig.customHour!==undefined?timeConfig.customHour:new Date().getHours())+'" min="0" max="23" style="width:100%;border:none;border-bottom:0.5px solid rgba(255,255,255,0.12);background:transparent;font-size:14px;font-weight:700;text-align:center;padding:4px 0;outline:none;color:#fff;"></div>'+
                '<div style="flex:1;text-align:center;"><div style="font-size:8px;color:rgba(255,255,255,0.3);margin-bottom:3px;">分</div><input type="number" id="csTcMin" value="'+(timeConfig.customMin!==undefined?timeConfig.customMin:new Date().getMinutes())+'" min="0" max="59" style="width:100%;border:none;border-bottom:0.5px solid rgba(255,255,255,0.12);background:transparent;font-size:14px;font-weight:700;text-align:center;padding:4px 0;outline:none;color:#fff;"></div>'+
                '</div></div>'+
                '</div></div>'+
            '</div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">旁白模式</div><div class="cs-acc-desc">AI outputs narration between lines</div></div><div class="cs-toggle'+(JSON.parse(localStorage.getItem('ca-narration-config')||'{"on":false}').on?' on':'')+'" id="csNarrationToggle"></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner">'+
                '<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:10px;">旁白样式 / Narration Style</div>'+
                '<div class="cs-narr-grid" id="csNarrGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">'+
                    (function(){var ns;try{ns=JSON.parse(localStorage.getItem('ca-narration-config')||'{}');}catch(e){ns={};}var cur=ns.style||'a';var items=[{id:'a',name:'居中'},{id:'b',name:'竖线'},{id:'c',name:'卡片'},{id:'d',name:'极简'},{id:'e',name:'右签'},{id:'f',name:'破折'},{id:'g',name:'引用'},{id:'h',name:'等宽'},{id:'i',name:'音符'},{id:'j',name:'淡线'},{id:'k',name:'散文'},{id:'l',name:'圆点'},{id:'m',name:'暗色'},{id:'n',name:'手写'}];var h='';items.forEach(function(it){h+='<div class="cs-narr-item'+(cur===it.id?' active':'')+'" data-narr-style="'+it.id+'" style="padding:10px 6px;border-radius:10px;text-align:center;cursor:pointer;border:0.5px solid rgba(255,255,255,'+(cur===it.id?'0.3':'0.08')+');background:rgba(255,255,255,'+(cur===it.id?'0.1':'0.03')+');transition:all 0.2s;"><div style="font-size:10px;font-weight:700;color:'+(cur===it.id?'#fff':'rgba(255,255,255,0.5)')+';letter-spacing:0.3px;">'+it.name+'</div><div style="font-size:7px;color:rgba(255,255,255,0.25);margin-top:2px;text-transform:uppercase;">'+it.id.toUpperCase()+'</div></div>';});return h;})()+
                '</div>'+
                '<div style="margin-top:16px;border-top:0.5px solid rgba(255,255,255,0.06);padding-top:14px;">'+
                    '<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:10px;">旁白字数范围 / Length Range</div>'+
                    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'+
                        '<span style="font-size:8px;color:rgba(255,255,255,0.25);flex-shrink:0;">短</span>'+
                        '<input type="range" class="cs-slider" id="csNarrMinLen" min="2" max="50" step="1" value="'+(function(){try{return JSON.parse(localStorage.getItem('ca-narration-config')||'{}').minLen||3;}catch(e){return 3;}})()+'" style="flex:1;">'+
                        '<span id="csNarrMinVal" style="font-family:monospace;font-size:11px;color:#fff;min-width:20px;text-align:center;">'+(function(){try{return JSON.parse(localStorage.getItem('ca-narration-config')||'{}').minLen||3;}catch(e){return 3;}})()+' 字</span>'+
                    '</div>'+
                    '<div style="display:flex;align-items:center;gap:10px;">'+
                        '<span style="font-size:8px;color:rgba(255,255,255,0.25);flex-shrink:0;">长</span>'+
                        '<input type="range" class="cs-slider" id="csNarrMaxLen" min="10" max="200" step="5" value="'+(function(){try{return JSON.parse(localStorage.getItem('ca-narration-config')||'{}').maxLen||80;}catch(e){return 80;}})()+'" style="flex:1;">'+
                        '<span id="csNarrMaxVal" style="font-family:monospace;font-size:11px;color:#fff;min-width:20px;text-align:center;">'+(function(){try{return JSON.parse(localStorage.getItem('ca-narration-config')||'{}').maxLen||80;}catch(e){return 80;}})()+' 字</span>'+
                    '</div>'+
                    '<div style="margin-top:8px;font-size:8px;color:rgba(255,255,255,0.2);line-height:1.5;">AI 每段旁白大约在此范围内波动，不是硬限制</div>'+
                '</div>'+
                '<div style="margin-top:16px;border-top:0.5px solid rgba(255,255,255,0.06);padding-top:14px;">'+
                    '<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:10px;">旁白字号 / Narration Font Size</div>'+
                    '<div style="display:flex;align-items:center;gap:10px;">'+
                        '<span style="font-size:8px;color:rgba(255,255,255,0.25);flex-shrink:0;">小</span>'+
                        '<input type="range" class="cs-slider" id="csNarrFontSize" min="10" max="16" step="1" value="'+(function(){try{return JSON.parse(localStorage.getItem('ca-narration-config')||'{}').fontSize||12;}catch(e){return 12;}})()+'" style="flex:1;">'+
                        '<span style="font-size:8px;color:rgba(255,255,255,0.25);flex-shrink:0;">大</span>'+
                        '<span id="csNarrFontSizeVal" style="font-family:monospace;font-size:11px;color:#fff;min-width:28px;text-align:center;">'+(function(){try{return JSON.parse(localStorage.getItem('ca-narration-config')||'{}').fontSize||12;}catch(e){return 12;}})()+' px</span>'+
                    '</div>'+
                '</div>'+
                '</div></div>'+
            '</div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">见面邀请</div><div class="cs-acc-desc">Allow AI to invite meet</div></div><div class="cs-toggle'+(JSON.parse(localStorage.getItem('ca-invite-config-'+entId)||'{"allow":false}').allow?' on':'')+'" id="csInviteToggle"></div></div></div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">API 配置</div><div class="cs-acc-desc">Endpoint · Key · Model</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner">'+
                '<div style="margin-bottom:12px;"><div style="font-size:9px;color:rgba(255,255,255,0.3);margin-bottom:4px;">Endpoint</div><input type="text" id="csApiEndpoint" value="'+escapeHtml(cfg.endpoint||'https://api.openai.com/v1')+'" style="width:100%;border:none;border-bottom:0.5px solid rgba(255,255,255,0.12);background:transparent;font-size:12px;padding:6px 0;outline:none;color:#fff;"></div>'+
                '<div style="margin-bottom:12px;"><div style="font-size:9px;color:rgba(255,255,255,0.3);margin-bottom:4px;">API Key</div><input type="password" id="csApiKey" value="'+escapeHtml(cfg.key||'')+'" placeholder="sk-..." style="width:100%;border:none;border-bottom:0.5px solid rgba(255,255,255,0.12);background:transparent;font-size:12px;padding:6px 0;outline:none;color:#fff;"></div>'+
                '<div style="margin-bottom:12px;"><div style="font-size:9px;color:rgba(255,255,255,0.3);margin-bottom:4px;">Model</div><input type="text" id="csApiModel" value="'+escapeHtml(cfg.model||'gpt-4o')+'" placeholder="gpt-4o / claude-3.5..." style="width:100%;border:none;border-bottom:0.5px solid rgba(255,255,255,0.12);background:transparent;font-size:12px;padding:6px 0;outline:none;color:#fff;"></div>'+
                '<div style="margin-bottom:12px;"><div style="font-size:9px;color:rgba(255,255,255,0.3);margin-bottom:4px;">System Prompt（附加）</div><textarea id="csApiPrompt" placeholder="额外的系统指令..." style="width:100%;height:60px;border:0.5px solid rgba(255,255,255,0.08);border-radius:8px;background:rgba(255,255,255,0.03);font-size:11px;padding:8px;outline:none;resize:none;color:#fff;line-height:1.5;">'+escapeHtml(cfg.prompt||'')+'</textarea></div>'+
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-size:10px;color:rgba(255,255,255,0.5);">节点切换</span><div class="cs-caps" id="csApiNodeCaps"><div class="cs-cap'+(node==='primary'?' active':'')+'">Primary</div><div class="cs-cap'+(node==='backup'?' active':'')+'">Backup</div></div></div>'+
                '<div class="cs-btns"><div class="cs-btn ghost" id="csApiFetch">Fetch Models</div><div class="cs-btn dark" id="csApiSave">Save</div></div>'+
                '</div></div>'+
            '</div>'+
        '</div>'+

        '<div class="cs-ticket light"><div class="cs-ticket-hd"><div class="cs-ticket-label">Memory Bank · 记忆</div><div class="cs-ticket-num">NO.03</div></div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">记忆条目</div><div class="cs-acc-desc">HIGH · MID · LOW 三级记忆</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner" id="csMemInner">'+
                renderMemLevel('high','HIGH',memData.high)+
                renderMemLevel('mid','MID',memData.mid)+
                renderMemLevel('low','LOW',memData.low)+
                '<div class="cs-btns"><div class="cs-btn ghost" id="csMemAutoSum">✦ AI 总结</div><div class="cs-btn dark" id="csMemManualSum">手动总结</div></div>'+
                '<div style="margin-top:16px;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><div style="font-size:11px;font-weight:600;color:#1a1a1f;">AI 记忆轮数</div><div style="font-size:9px;color:rgba(26,26,31,0.3);">调取最近 N 轮对话</div></div><div class="cs-slider-row"><input type="range" class="cs-slider" id="csMemSlider" min="5" max="100" step="5" value="'+memRounds+'"><div class="cs-slider-val" id="csMemSliderVal">'+memRounds+'</div></div></div>'+
                '</div></div>'+
            '</div>'+
        '</div>'+

        '<div class="cs-ticket dark"><div class="cs-ticket-hd"><div class="cs-ticket-label">Notification Style · 通知卡片</div><div class="cs-ticket-num">NO.03.5</div></div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z" opacity="0.15"/><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10h8M8 14h5"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">通知卡片样式</div><div class="cs-acc-desc">Director notification appearance</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner">'+
                '<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:12px;">选择导演通知（旁白/动作/纠错）的显示风格</div>'+
                '<div class="cs-notif-grid" id="csNotifGrid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:16px;">'+
                    (function(){
                        var cur;try{cur=localStorage.getItem('ca-notif-style')||'default';}catch(e){cur='default';}
                        var items=[
                            {id:'default',name:'默认',icon:'◻'},
                            {id:'a',name:'胶片',icon:'▮'},
                            {id:'b',name:'邮票',icon:'◫'},
                            {id:'c',name:'缝线',icon:'┃'},
                            {id:'d',name:'折角',icon:'◸'},
                            {id:'e',name:'极简',icon:'│'}
                        ];
                        var h='';
                        items.forEach(function(it){
                            var isActive=cur===it.id;
                            h+='<div class="cs-notif-item'+(isActive?' active':'')+'" data-notif-style="'+it.id+'" style="padding:10px 4px;border-radius:10px;text-align:center;cursor:pointer;border:0.5px solid rgba(255,255,255,'+(isActive?'0.35':'0.08')+');background:rgba(255,255,255,'+(isActive?'0.12':'0.03')+');transition:all 0.2s;">'+
                                '<div style="font-size:16px;margin-bottom:4px;opacity:'+(isActive?'1':'0.5')+';">'+it.icon+'</div>'+
                                '<div style="font-size:8px;font-weight:700;color:'+(isActive?'#fff':'rgba(255,255,255,0.4)')+';letter-spacing:0.3px;">'+it.name+'</div>'+
                            '</div>';
                        });
                        return h;
                    })()+
                '</div>'+
                '<div id="csNotifPreview" style="background:rgba(255,255,255,0.03);border:0.5px solid rgba(255,255,255,0.06);border-radius:14px;padding:14px;min-height:60px;">'+
                    '<div style="font-size:8px;color:rgba(255,255,255,0.2);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Preview · 预览</div>'+
                    '<div id="csNotifPreviewArea" style="display:flex;flex-direction:column;gap:8px;"></div>'+
                '</div>'+
                '<div style="margin-top:14px;border-top:0.5px solid rgba(255,255,255,0.06);padding-top:14px;">'+
                    '<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:10px;">通知字号 / Notification Font Size</div>'+
                    '<div style="display:flex;align-items:center;gap:10px;">'+
                        '<span style="font-size:8px;color:rgba(255,255,255,0.25);flex-shrink:0;">小</span>'+
                        '<input type="range" class="cs-slider" id="csNotifFontSize" min="8" max="14" step="0.5" value="'+(function(){try{return parseFloat(localStorage.getItem('ca-notif-font-size')||'10.5');}catch(e){return 10.5;}})()+'" style="flex:1;">'+
                        '<span style="font-size:8px;color:rgba(255,255,255,0.25);flex-shrink:0;">大</span>'+
                        '<span id="csNotifFontSizeVal" style="font-family:monospace;font-size:11px;color:#fff;min-width:32px;text-align:center;">'+(function(){try{return parseFloat(localStorage.getItem('ca-notif-font-size')||'10.5');}catch(e){return 10.5;}})()+' px</span>'+
                    '</div>'+
                '</div>'+
                '</div></div>'+
            '</div>'+
        '</div>'+

        '<div class="cs-ticket light"><div class="cs-ticket-hd"><div class="cs-ticket-label">Time Gap · 时间间隔</div><div class="cs-ticket-num">NO.03.6</div></div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">时间间隔通知</div><div class="cs-acc-desc">Time gap notification style</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner">'+
                '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:8px;">消息间隔超过设定时间时，在气泡之间插入提示</div>'+
                '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:10px;">触发阈值 / Threshold</div>'+
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">'+
                    '<span style="font-size:8px;color:rgba(26,26,31,0.25);flex-shrink:0;">1min</span>'+
                    '<input type="range" class="cs-slider" id="csTgnThreshold" min="1" max="60" step="1" value="'+(function(){try{return parseInt(localStorage.getItem('ca-tgn-threshold')||'5',10);}catch(e){return 5;}})()+'" style="flex:1;">'+
                    '<span style="font-size:8px;color:rgba(26,26,31,0.25);flex-shrink:0;">60min</span>'+
                    '<span id="csTgnThresholdVal" style="font-family:monospace;font-size:12px;font-weight:700;color:#1a1a1f;min-width:40px;text-align:center;">'+(function(){try{return parseInt(localStorage.getItem('ca-tgn-threshold')||'5',10);}catch(e){return 5;}})()+' min</span>'+
                '</div>'+
                '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:12px;">间隔样式 / Style</div>'+
                '<div class="cs-tgn-grid" id="csTgnGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:16px;">'+
                    (function(){
                        var cur;try{cur=localStorage.getItem('ca-tgn-style')||'off';}catch(e){cur='off';}
                        var items=[
                            {id:'off',name:'OFF',icon:'—'},
                            {id:'a',name:'Dot',icon:'•'},
                            {id:'b',name:'Wave',icon:'~'},
                            {id:'c',name:'Hour',icon:'H'},
                            {id:'d',name:'Ring',icon:'O'},
                            {id:'e',name:'Film',icon:'|'}
                        ];
                        var h='';
                        items.forEach(function(it){
                            var isActive=cur===it.id;
                            h+='<div class="cs-tgn-item'+(isActive?' active':'')+'" data-tgn-style="'+it.id+'" style="padding:10px 4px;border-radius:10px;text-align:center;cursor:pointer;border:0.5px solid rgba(26,26,31,'+(isActive?'0.2':'0.06')+');background:rgba(26,26,31,'+(isActive?'0.06':'0.01')+');transition:all 0.2s;">'+
                                '<div style="font-size:12px;font-weight:800;margin-bottom:3px;opacity:'+(isActive?'1':'0.35')+';color:#1a1a1f;">'+it.icon+'</div>'+
                                '<div style="font-size:7px;font-weight:700;color:'+(isActive?'#1a1a1f':'rgba(26,26,31,0.3)')+';letter-spacing:0.3px;">'+it.name+'</div>'+
                            '</div>';
                        });
                        return h;
                    })()+
                '</div>'+
                '<div id="csTgnPreview" style="background:rgba(26,26,31,0.02);border:0.5px solid rgba(26,26,31,0.05);border-radius:14px;padding:14px;min-height:40px;">'+
                    '<div style="font-size:8px;color:rgba(26,26,31,0.15);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Preview</div>'+
                    '<div id="csTgnPreviewArea"></div>'+
                '</div>'+
                '</div></div>'+
            '</div>'+
        '</div>'+

        '<div class="cs-ticket light"><div class="cs-ticket-hd"><div class="cs-ticket-label">Filter · 过滤</div><div class="cs-ticket-num">NO.04</div></div>'+
            '<div class="cs-acc"><div class="cs-acc-hd"><div class="cs-acc-icon"><svg viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg></div><div class="cs-acc-info"><div class="cs-acc-name">符号过滤</div><div class="cs-acc-desc">Hide specific characters from view</div></div><svg class="cs-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
                '<div class="cs-acc-body"><div class="cs-acc-inner">'+
                '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:8px;">输入要隐藏的符号（直接输入，不需要正则语法）</div>'+
                '<div style="font-size:8px;color:rgba(26,26,31,0.25);margin-bottom:10px;line-height:1.5;">例：输入 ，。！ 则聊天气泡中的逗号、句号、感叹号会自动替换为空格</div>'+
                '<input type="text" id="csFilterChars" placeholder="例: ，。、！？…" value="'+(function(){try{return localStorage.getItem('ca-filter-chars')||'';}catch(e){return '';}})()+'" style="width:100%;border:none;border-bottom:0.5px solid rgba(26,26,31,0.1);background:transparent;font-size:14px;padding:8px 0;outline:none;color:#1a1a1f;letter-spacing:2px;margin-bottom:16px;">'+
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-size:11px;font-weight:600;color:#1a1a1f;">启用过滤</span><div class="cs-toggle'+(localStorage.getItem('ca-filter-on')==='true'?' on':'')+'" id="csFilterToggle"></div></div>'+
                '<div style="margin-top:14px;padding-top:14px;border-top:0.5px solid rgba(26,26,31,0.06);">'+
                    '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:10px;">过滤范围 / Filter Scope</div>'+
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><span style="font-size:11px;font-weight:500;color:#1a1a1f;">对方消息</span><div class="cs-toggle on" id="csFilterReceived" style="pointer-events:none;opacity:0.4;"></div></div>'+
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><span style="font-size:11px;font-weight:500;color:#1a1a1f;">我的消息</span><div class="cs-toggle'+(localStorage.getItem('ca-filter-mine')!=='false'?' on':'')+'" id="csFilterMine"></div></div>'+
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><span style="font-size:11px;font-weight:500;color:#1a1a1f;">旁白文字</span><div class="cs-toggle'+(localStorage.getItem('ca-filter-narr')!=='false'?' on':'')+'" id="csFilterNarr"></div></div>'+
                '</div>'+
                '<div style="margin-top:10px;font-size:9px;color:rgba(26,26,31,0.2);line-height:1.5;">过滤仅影响显示，不修改原始消息数据</div>'+
                '</div></div>'+
            '</div>'+
        '</div>'+

        '<div class="cs-ticket dark"><div class="cs-ticket-hd"><div class="cs-ticket-label">Danger Zone · 危险操作</div><div class="cs-ticket-num">NO.05</div></div>'+
            '<div class="cs-danger-row" id="csDangerClear"><div class="cs-danger-icon"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></div><div class="cs-danger-info"><div class="cs-danger-name">清空聊天记录</div><div class="cs-danger-sub">删除所有消息，不可恢复</div></div></div>'+
            '<div class="cs-danger-row" id="csDangerDelete"><div class="cs-danger-icon"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div><div class="cs-danger-info"><div class="cs-danger-name">删除联系人</div><div class="cs-danger-sub">永久删除此 Entity 及所有数据</div></div></div>'+
        '</div>'+

        '<div class="cs-footer-sig">A0nynx_3i</div>'+
        '</div>';

    bindSettingsEvents(entId);
}

function applyAvatarConfig(){
    var styleId='cda-avatar-style';
    var existing=document.getElementById(styleId);
    if(existing)existing.parentNode.removeChild(existing);
    var ac;try{ac=JSON.parse(localStorage.getItem('ca-avatar-config')||'{"sent":false,"received":true}');}catch(e){ac={sent:false,received:true};}
    var css='';
    if(!ac.received){
        css+='.cda-msg-row.received .cda-msg-av{display:none!important;}';
    }
    if(ac.sent){
        css+='.cda-msg-row.sent .cda-sent-av{display:flex!important;}';
    }
    if(css){
        var s=document.createElement('style');
        s.id=styleId;
        s.textContent=css;
        document.head.appendChild(s);
    }
}

function applyWatermarkNow(text){
    var wmStyleId='cda-wm-style';
    var wmExisting=document.getElementById(wmStyleId);
    if(wmExisting)wmExisting.parentNode.removeChild(wmExisting);
    if(!text||text==='None'){
        var hideStyle=document.createElement('style');
        hideStyle.id=wmStyleId;
        hideStyle.textContent='.cda-bubble::after{display:none!important;content:none!important;}';
        document.head.appendChild(hideStyle);
        return;
    }
    var wmStyle=document.createElement('style');
    wmStyle.id=wmStyleId;
    wmStyle.textContent='.cda-bubble{position:relative;overflow:hidden;}.cda-bubble::after{content:"'+text.replace(/"/g,'\\"')+'";position:absolute;bottom:-1px;right:2px;font-family:"TheatreDeco",serif;font-size:18px;pointer-events:none;letter-spacing:1px;line-height:1;white-space:nowrap;z-index:0;}.cda-msg-row.sent .cda-bubble::after{color:rgba(255,255,255,0.06);}.cda-msg-row.received .cda-bubble::after{color:rgba(0,0,0,0.12);}';
    document.head.appendChild(wmStyle);
}

function bindSettingsEvents(entId){
    var el=document.getElementById('cdaSettings');
    if(!el)return;

    // 返回
    document.getElementById('csBack').addEventListener('click',closeSettings);

    // 联系人头像更换
    var heroWrap=document.getElementById('csHeroAvatarWrap');
    var heroInput=document.getElementById('csHeroAvatarInput');
    if(heroWrap&&heroInput){
        heroWrap.addEventListener('click',function(){heroInput.click();});
        heroInput.addEventListener('change',function(e){
            var file=e.target.files[0];
            if(!file)return;
            var url=URL.createObjectURL(file);
            var img=new Image();
            img.onload=function(){
                var canvas=document.createElement('canvas');
                var size=200;canvas.width=size;canvas.height=size;
                var ctx=canvas.getContext('2d');
                var min=Math.min(img.width,img.height);
                var sx=(img.width-min)/2,sy=(img.height-min)/2;
                ctx.drawImage(img,sx,sy,min,min,0,0,size,size);
                var dataUrl=canvas.toDataURL('image/jpeg',0.7);
                var entities=window._caEntities||[];
                var ent=entities.find(function(e){return e.id===entId;});
                if(!ent)return;
                ent.avatar=dataUrl;
                if(typeof ChatDB!=='undefined'&&ChatDB.saveEntity)ChatDB.saveEntity(ent);
                // 更新 hero 头像显示
                var av=el.querySelector('.cs-hero-avatar');
                if(av)av.innerHTML='<img src="'+dataUrl+'" style="width:100%;height:100%;object-fit:cover;">';
                // 同步聊天室头像
                window.dispatchEvent(new CustomEvent('cda-settings-changed'));
                URL.revokeObjectURL(url);
            };
            img.src=url;
        });
    }

    // 手风琴
    el.querySelectorAll('.cs-acc-hd').forEach(function(hd){
        hd.addEventListener('click',function(e){
            if(e.target.closest('.cs-toggle'))return;
            var acc=hd.closest('.cs-acc');
            if(acc)acc.classList.toggle('open');
        });
    });

    // Toggle
    el.querySelectorAll('.cs-toggle').forEach(function(tog){
        tog.addEventListener('click',function(e){e.stopPropagation();tog.classList.toggle('on');});
    });

    // 胶囊
    el.querySelectorAll('.cs-cap').forEach(function(cap){
        cap.addEventListener('click',function(e){
            e.stopPropagation();
            var parent=cap.closest('.cs-caps');
            if(!parent)return;
            parent.querySelectorAll('.cs-cap').forEach(function(c){c.classList.remove('active');});
            cap.classList.add('active');
        });
    });

    // 回复速度
    var speedSlider=document.getElementById('csSpeedSlider');
    var speedVal=document.getElementById('csSpeedVal');
    if(speedSlider){
        speedSlider.addEventListener('input',function(){
            var v=parseInt(speedSlider.value,10);
            if(speedVal)speedVal.textContent=v+'%';
            localStorage.setItem('ca-speed-config',JSON.stringify({rate:v}));
        });
    }

    // 头像显示
    var avatarRecvToggle=document.getElementById('csAvatarRecvToggle');
    var avatarSentToggle=document.getElementById('csAvatarSentToggle');
    if(avatarRecvToggle){
        avatarRecvToggle.addEventListener('click',function(e){
            e.stopPropagation();
            setTimeout(function(){
                var ac;try{ac=JSON.parse(localStorage.getItem('ca-avatar-config')||'{}');}catch(ex){ac={};}
                ac.received=avatarRecvToggle.classList.contains('on');
                localStorage.setItem('ca-avatar-config',JSON.stringify(ac));
                applyAvatarConfig();
                if(typeof renderMessagesNoAnim==='function')renderMessagesNoAnim();
            },50);
        });
    }
    if(avatarSentToggle){
        avatarSentToggle.addEventListener('click',function(e){
            e.stopPropagation();
            setTimeout(function(){
                var ac;try{ac=JSON.parse(localStorage.getItem('ca-avatar-config')||'{}');}catch(ex){ac={};}
                ac.sent=avatarSentToggle.classList.contains('on');
                localStorage.setItem('ca-avatar-config',JSON.stringify(ac));
                applyAvatarConfig();
                if(typeof renderMessagesNoAnim==='function')renderMessagesNoAnim();
            },50);
        });
    }

    // 动效选择
    var animNameMap={'Rise':'fadeRise','Pop':'elastic','Ink':'slideInk','Drop':'twDrop','Gravity':'gravity'};

    function getAnimCSS(name,type){
        var map={
            'fadeRise':'cda-anim-fadeRise',
            'elastic':'cda-anim-elastic-'+(type==='sent'?'right':'left'),
            'slideInk':'cda-anim-slideInk-'+(type==='sent'?'right':'left'),
            'twDrop':'cda-anim-twDrop',
            'gravity':'cda-anim-gravity'
        };
        return map[name]||'cda-anim-fadeRise';
    }

    function playAnimSingle(type){
        var preview=document.getElementById('csAnimPreview');
        if(!preview)return;
        var ac;try{ac=JSON.parse(localStorage.getItem('ca-anim-config')||'{"sent":"fadeRise","received":"fadeRise"}');}catch(ex){ac={sent:'fadeRise',received:'fadeRise'};}

        // 找到已有的该类型气泡，移除旧的重新播放
        var existingId=type==='sent'?'csAnimPrevSent':'csAnimPrevRecv';
        var existing=document.getElementById(existingId);
        if(existing)existing.parentNode.removeChild(existing);

        var row=document.createElement('div');
        row.id=existingId;
        if(type==='received'){
            row.style.cssText='display:flex;align-items:flex-end;gap:6px;';
            row.innerHTML='<div style="width:22px;height:22px;border-radius:50%;background:#1a1a1f;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;flex-shrink:0;">A</div><div class="cda-anim-bubble" style="padding:7px 13px;font-size:12px;background:#e8e8ea;color:#1a1a1f;border-radius:14px;max-width:70%;">想你了 💭</div>';
            preview.insertBefore(row,preview.firstChild);
        }else{
            row.style.cssText='display:flex;align-items:flex-end;gap:6px;justify-content:flex-end;';
            row.innerHTML='<div class="cda-anim-bubble" style="padding:7px 13px;font-size:12px;background:#1a1a1f;color:#fff;border-radius:14px;max-width:70%;">我也是～</div>';
            preview.appendChild(row);
        }

        var bubble=type==='received'?row.querySelector('div:last-child'):row.querySelector('div');
        var animName=type==='sent'?ac.sent:ac.received;
        requestAnimationFrame(function(){
            requestAnimationFrame(function(){
                bubble.className='cda-anim-bubble';
                bubble.style.animation=getAnimCSS(animName,type)+' 0.5s cubic-bezier(0.16,1,0.3,1) forwards';
            });
        });
    }

    var sentCaps=document.getElementById('csAnimSentCaps');
    if(sentCaps){
        sentCaps.querySelectorAll('.cs-cap').forEach(function(cap){
            cap.addEventListener('click',function(e){
                e.stopPropagation();
                sentCaps.querySelectorAll('.cs-cap').forEach(function(c){c.classList.remove('active');});
                cap.classList.add('active');
                var ac;try{ac=JSON.parse(localStorage.getItem('ca-anim-config')||'{}');}catch(ex){ac={};}
                ac.sent=animNameMap[cap.textContent]||'fadeRise';
                localStorage.setItem('ca-anim-config',JSON.stringify(ac));
                playAnimSingle('sent');
            });
        });
    }
    var recvCaps=document.getElementById('csAnimRecvCaps');
    if(recvCaps){
        recvCaps.querySelectorAll('.cs-cap').forEach(function(cap){
            cap.addEventListener('click',function(e){
                e.stopPropagation();
                recvCaps.querySelectorAll('.cs-cap').forEach(function(c){c.classList.remove('active');});
                cap.classList.add('active');
                var ac;try{ac=JSON.parse(localStorage.getItem('ca-anim-config')||'{}');}catch(ex){ac={};}
                ac.received=animNameMap[cap.textContent]||'fadeRise';
                localStorage.setItem('ca-anim-config',JSON.stringify(ac));
                playAnimSingle('received');
            });
        });
    }

    // 翻译网格保存 + 预览
    var transGrid=document.getElementById('csTransGrid');
    if(transGrid){
        function renderTransPreview(style){
            var area=document.getElementById('csTransPreviewArea');
            if(!area)return;
            if(style==='off'){
                area.innerHTML='<div style="text-align:center;padding:20px 0;font-size:11px;color:rgba(26,26,31,0.25);">翻译已关闭</div>';
                return;
            }
            var orig='想出去走走';
            var trans='Wanna go for a walk';
            var html='';
            if(style==='underline'){
                html='<div class="ctp-row recv"><div class="ctp-av">K</div><div class="ctp-wrap ctp-s1" onclick="this.classList.toggle(\'ctp-s1-active\')"><div class="ctp-bubble recv">'+orig+'<div class="ctp-s1-trans"><div class="ctp-s1-inner">'+trans+'</div></div></div></div></div>';
            }else if(style==='flip'){
                html='<div class="ctp-row recv"><div class="ctp-av">K</div><div class="ctp-wrap ctp-s2" onclick="this.classList.toggle(\'ctp-s2-active\')"><div class="ctp-s2-card"><div class="ctp-bubble recv ctp-s2-front">'+orig+'</div><div class="ctp-s2-back recv">'+trans+'</div></div></div></div>';
            }else if(style==='ghost'){
                html='<div class="ctp-row recv" style="margin-bottom:44px;"><div class="ctp-av">K</div><div class="ctp-wrap" onclick="this.classList.toggle(\'ctp-s3-active\')"><div class="ctp-bubble recv">'+orig+'</div><div class="ctp-s3-ghost recv">'+trans+'</div></div></div>';
            }else if(style==='ribbon'){
                html='<div class="ctp-row recv"><div class="ctp-av">K</div><div class="ctp-wrap" onclick="this.classList.toggle(\'ctp-s4-active\')"><div class="ctp-s4-ribbon recv"><div class="ctp-s4-main">'+orig+'</div><div class="ctp-s4-peel">'+trans+'</div></div></div></div>';
            }else if(style==='ink'){
                html='<div class="ctp-row recv"><div class="ctp-av">K</div><div class="ctp-wrap" onclick="this.classList.toggle(\'ctp-s5-active\')"><div class="ctp-bubble recv" style="position:relative;">'+orig+'<div class="ctp-s5-dot"></div><div class="ctp-s5-trans"><div class="ctp-s5-inner">'+trans+'</div></div></div></div></div>';
            }else if(style==='curtain'){
                html='<div class="ctp-row recv"><div class="ctp-av">K</div><div class="ctp-wrap" onclick="this.classList.toggle(\'ctp-s6-active\')"><div class="ctp-bubble recv ctp-s6-bubble"><span>'+orig+'</span><div class="ctp-s6-curtain recv">'+trans+'</div></div></div></div>';
            }else if(style==='split'){
                html='<div class="ctp-row recv"><div class="ctp-av">K</div><div class="ctp-wrap" onclick="this.classList.toggle(\'ctp-s7-active\')"><div class="ctp-bubble recv"><div>'+orig+'</div><div class="ctp-s7-divider"></div><div class="ctp-s7-split"><div class="ctp-s7-tag">EN</div><div class="ctp-s7-text">'+trans+'</div></div></div></div></div>';
            }else if(style==='typewriter'){
                html='<div class="ctp-row recv"><div class="ctp-av">K</div><div class="ctp-wrap" onclick="this.classList.toggle(\'ctp-s8-active\')"><div class="ctp-bubble recv">'+orig+'<div class="ctp-s8-trans"><div class="ctp-s8-inner">'+trans+'<span class="ctp-s8-cursor"></span></div></div></div></div></div>';
            }else if(style==='mirror'){
                html='<div class="ctp-row recv" style="margin-bottom:44px;"><div class="ctp-av">K</div><div class="ctp-wrap ctp-s9" onclick="this.classList.toggle(\'ctp-s9-active\')"><div class="ctp-bubble recv">'+orig+'</div><div class="ctp-s9-ref recv">'+trans+'</div></div></div>';
            }else if(style==='stamp'){
                html='<div class="ctp-row recv" style="margin-bottom:20px;"><div class="ctp-av">K</div><div class="ctp-wrap" onclick="this.classList.toggle(\'ctp-s10-active\')"><div class="ctp-bubble recv ctp-s10-bubble">'+orig+'<div class="ctp-s10-stamp recv">'+trans+'</div></div></div></div>';
            }
            area.innerHTML=html;
        }

        transGrid.querySelectorAll('.cs-trans-item').forEach(function(item){
            item.addEventListener('click',function(e){
                e.stopPropagation();
                transGrid.querySelectorAll('.cs-trans-item').forEach(function(i){i.classList.remove('active');});
                item.classList.add('active');
                var tc;try{tc=JSON.parse(localStorage.getItem('ca-trans-config-14')||'{}');}catch(ex){tc={};}
                tc.style=item.dataset.style;
                localStorage.setItem('ca-trans-config-14',JSON.stringify(tc));
                renderTransPreview(item.dataset.style);
            });
        });

        // 初始渲染当前选中的预览
        var initTransConfig;
        try{initTransConfig=JSON.parse(localStorage.getItem('ca-trans-config')||'{"style":"off"}');}catch(ex){initTransConfig={style:'off'};}
        renderTransPreview(initTransConfig.style);
    }
    var transMyLang=document.getElementById('csTransMyLang');
    var transTargetLang=document.getElementById('csTransTargetLang');
    if(transMyLang){
        transMyLang.addEventListener('change',function(){
            var tc;try{tc=JSON.parse(localStorage.getItem('ca-trans-config-14')||'{}');}catch(ex){tc={};}
            tc.myLang=transMyLang.value.trim()||'Auto';
            localStorage.setItem('ca-trans-config-14',JSON.stringify(tc));
        });
    }
    if(transTargetLang){
        transTargetLang.addEventListener('change',function(){
            var tc;try{tc=JSON.parse(localStorage.getItem('ca-trans-config-14')||'{}');}catch(ex){tc={};}
            tc.transLang=transTargetLang.value.trim()||'Chinese';
            localStorage.setItem('ca-trans-config-14',JSON.stringify(tc));
        });
    }

    // 背景图
    var bgPreviewInner=document.getElementById('csBgPreviewInner');
    var bgConfig;try{bgConfig=JSON.parse(localStorage.getItem('ca-bg-config')||'{}');}catch(ex){bgConfig={};}
    if(bgPreviewInner){
        if(bgConfig.image){
            bgPreviewInner.style.backgroundImage='url('+bgConfig.image+')';
            bgPreviewInner.style.backgroundSize='cover';
            bgPreviewInner.style.backgroundPosition='center';
        }else{
            bgPreviewInner.style.background='#fff';
        }
    }

    var bgUploadBtn=document.getElementById('csBgUpload');
    var bgFileInput=document.getElementById('csBgFileInput');
    if(bgUploadBtn&&bgFileInput){
        bgUploadBtn.addEventListener('click',function(e){
            e.stopPropagation();
            bgFileInput.click();
        });
        bgFileInput.addEventListener('change',function(ev){
            var file=ev.target.files[0];
            if(!file)return;
            var img=new Image();
            img.onload=function(){
                var canvas=document.createElement('canvas');
                var maxW=1200,maxH=1200;
                var w=img.width,h=img.height;
                if(w>maxW||h>maxH){
                    var ratio=Math.min(maxW/w,maxH/h);
                    w=Math.round(w*ratio);
                    h=Math.round(h*ratio);
                }
                canvas.width=w;canvas.height=h;
                canvas.getContext('2d').drawImage(img,0,0,w,h);
                var dataUrl=canvas.toDataURL('image/jpeg',0.85);
                var cfg=JSON.parse(localStorage.getItem('ca-bg-config')||'{}');
                cfg.image=dataUrl;
                localStorage.setItem('ca-bg-config',JSON.stringify(cfg));
                if(bgPreviewInner){
                    bgPreviewInner.style.backgroundImage='url('+dataUrl+')';
                    bgPreviewInner.style.backgroundSize='cover';
                    bgPreviewInner.style.backgroundPosition='center';
                }
                applyBgToChat();
            };
            img.src=URL.createObjectURL(file);
        });
    }

    var bgResetBtn=document.getElementById('csBgReset');
    if(bgResetBtn){
        bgResetBtn.addEventListener('click',function(e){
            e.stopPropagation();
            var cfg=JSON.parse(localStorage.getItem('ca-bg-config')||'{}');
            delete cfg.image;
            localStorage.setItem('ca-bg-config',JSON.stringify(cfg));
            if(bgPreviewInner){
                bgPreviewInner.style.backgroundImage='none';
                bgPreviewInner.style.background='#fff';
            }
            applyBgToChat();
        });
    }

    var bgBlurSlider=document.getElementById('csBgBlur');
    var bgBlurVal=document.getElementById('csBgBlurVal');
    if(bgBlurSlider){
        bgBlurSlider.addEventListener('input',function(){
            bgBlurVal.textContent=bgBlurSlider.value;
            var cfg=JSON.parse(localStorage.getItem('ca-bg-config')||'{}');
            cfg.blur=parseInt(bgBlurSlider.value,10);
            localStorage.setItem('ca-bg-config',JSON.stringify(cfg));
            applyBgToChat();
        });
    }

    var bgOpacitySlider=document.getElementById('csBgOpacity');
    var bgOpacityVal=document.getElementById('csBgOpacityVal');
    if(bgOpacitySlider){
        bgOpacitySlider.addEventListener('input',function(){
            bgOpacityVal.textContent=bgOpacitySlider.value+'%';
            var cfg=JSON.parse(localStorage.getItem('ca-bg-config')||'{}');
            cfg.opacity=parseInt(bgOpacitySlider.value,10);
            localStorage.setItem('ca-bg-config',JSON.stringify(cfg));
            applyBgToChat();
        });
    }

    function applyBgToChat(){
        var cfg=JSON.parse(localStorage.getItem('ca-bg-config')||'{}');
        var styleId='cda-bg-style';
        var existing=document.getElementById(styleId);
        if(existing)existing.parentNode.removeChild(existing);
        if(!cfg.image){return;}
        var blur=cfg.blur||0;
        var opacity=(cfg.opacity!==undefined?cfg.opacity:100)/100;
        var s=document.createElement('style');
        s.id=styleId;
        s.textContent=
            '.cda-messages::before{content:"";position:fixed;top:0;left:0;right:0;bottom:0;max-width:430px;margin:0 auto;z-index:0;pointer-events:none;'+
            'background-image:url('+cfg.image+');background-size:cover;background-position:center;background-attachment:fixed;'+
            'filter:blur('+blur+'px);opacity:'+opacity+';'+
            '}'+
            '.cda-messages>*{position:relative;z-index:1;}'+
            '.cda-msg-row.has-tail .cda-bubble-wrap::before{display:none!important;}'+
            '.cda-msg-row.has-tail .cda-bubble-wrap::after{display:none!important;}';
        document.head.appendChild(s);
    }

    // 初始应用背景
    applyBgToChat();

    // 底纹选择
    el.querySelectorAll('.cs-wm-item').forEach(function(item){
        item.addEventListener('click',function(e){
            e.stopPropagation();
            var grid=item.closest('.cs-wm-grid');
            if(!grid)return;
            grid.querySelectorAll('.cs-wm-item').forEach(function(i){i.classList.remove('active');});
            item.classList.add('active');
            var wm=item.dataset.wm;
            saveWatermarkConfig({text:wm});
            document.getElementById('csWmCustom').value='';
            applyWatermarkNow(wm);
        });
    });

    // 自定义底纹
    var wmCustom=document.getElementById('csWmCustom');
    if(wmCustom){
        wmCustom.addEventListener('input',function(){
            var val=wmCustom.value.trim();
            if(val){
                el.querySelectorAll('.cs-wm-item').forEach(function(i){i.classList.remove('active');});
                saveWatermarkConfig({text:val});
                applyWatermarkNow(val);
            }
        });
    }

    // 时间感知
    var timeToggle=document.getElementById('csTimeToggle');
    if(timeToggle){
        timeToggle.addEventListener('click',function(e){
            e.stopPropagation();
            // toggle 的 on class 已经在通用 toggle handler 里切换了，这里直接读
            setTimeout(function(){
                var tc=loadTimeConfig();
                tc.on=timeToggle.classList.contains('on');
                saveTimeConfig(tc);
            },50);
        });
    }

    var timeCustomToggle=document.getElementById('csTimeCustomToggle');
    if(timeCustomToggle){
        timeCustomToggle.addEventListener('click',function(e){
            e.stopPropagation();
            setTimeout(function(){
                var tc=loadTimeConfig();
                tc.custom=timeCustomToggle.classList.contains('on');
                if(tc.custom){
                    tc.customMonth=parseInt(document.getElementById('csTcMonth').value)||new Date().getMonth()+1;
                    tc.customDay=parseInt(document.getElementById('csTcDay').value)||new Date().getDate();
                    tc.customHour=parseInt(document.getElementById('csTcHour').value)||0;
                    tc.customMin=parseInt(document.getElementById('csTcMin').value)||0;
                }
                saveTimeConfig(tc);
                var inputs=document.getElementById('csTimeCustomInputs');
                if(inputs)inputs.style.display=tc.custom?'block':'none';
            },50);
        });
    }

    ['csTcMonth','csTcDay','csTcHour','csTcMin'].forEach(function(id){
        var inp=document.getElementById(id);
        if(inp){
            inp.addEventListener('input',function(){
                var tc=loadTimeConfig();
                tc.customMonth=parseInt(document.getElementById('csTcMonth').value)||1;
                tc.customDay=parseInt(document.getElementById('csTcDay').value)||1;
                tc.customHour=parseInt(document.getElementById('csTcHour').value)||0;
                tc.customMin=parseInt(document.getElementById('csTcMin').value)||0;
                saveTimeConfig(tc);
            });
        }
    });

    // 时钟
    var clockEl=document.getElementById('csTimeClock');
    var clockTimer=setInterval(function(){
        if(!clockEl||!document.getElementById('cdaSettings'))return clearInterval(clockTimer);
        var tc=loadTimeConfig();
        var now=new Date();
        var mo=now.getMonth()+1,d=now.getDate(),h=now.getHours(),m=now.getMinutes(),s=now.getSeconds();
        if(tc.custom){
            mo=tc.customMonth||mo;d=tc.customDay||d;h=tc.customHour!==undefined?tc.customHour:h;m=tc.customMin!==undefined?tc.customMin:m;
        }
        clockEl.textContent=mo+'月'+d+'日 '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    },1000);

    // 旁白模式
    var narrationToggle=document.getElementById('csNarrationToggle');
    if(narrationToggle){
        narrationToggle.addEventListener('click',function(e){
            e.stopPropagation();
            setTimeout(function(){
                var nc;try{nc=JSON.parse(localStorage.getItem('ca-narration-config')||'{}');}catch(ex){nc={};}
                nc.on=narrationToggle.classList.contains('on');
                localStorage.setItem('ca-narration-config',JSON.stringify(nc));
                // 写入一条 info 通知到对话记录
                if(settingsEntId){
                    if(!window._caConversations)window._caConversations={};
                    if(!window._caConversations[settingsEntId])window._caConversations[settingsEntId]=[];
                    var nMsg=nc.on?'♪♫':'♪';
                    window._caConversations[settingsEntId].push({role:'info',text:nMsg,ai_visible:true,time:(function(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');})()});
                    if(typeof ChatDB!=='undefined'&&ChatDB.saveConversation){
                        ChatDB.saveConversation(settingsEntId,window._caConversations[settingsEntId]);
                    }
                }
                // 通知写入后再触发渲染刷新
                window.dispatchEvent(new CustomEvent('cda-settings-changed'));
            },50);
        });
    }

    // 旁白样式选择
    var narrGrid=document.getElementById('csNarrGrid');
    if(narrGrid){
        narrGrid.querySelectorAll('.cs-narr-item').forEach(function(item){
            item.addEventListener('click',function(e){
                e.stopPropagation();
                narrGrid.querySelectorAll('.cs-narr-item').forEach(function(i){
                    i.classList.remove('active');
                    i.style.borderColor='rgba(255,255,255,0.08)';
                    i.style.background='rgba(255,255,255,0.03)';
                    i.querySelector('div').style.color='rgba(255,255,255,0.5)';
                });
                item.classList.add('active');
                item.style.borderColor='rgba(255,255,255,0.3)';
                item.style.background='rgba(255,255,255,0.1)';
                item.querySelector('div').style.color='#fff';
                var nc;try{nc=JSON.parse(localStorage.getItem('ca-narration-config')||'{}');}catch(ex){nc={};}
                nc.style=item.dataset.narrStyle;
                localStorage.setItem('ca-narration-config',JSON.stringify(nc));
                window.dispatchEvent(new CustomEvent('cda-settings-changed'));
            });
        });
    }

    // 旁白字数范围
    var narrMinSlider=document.getElementById('csNarrMinLen');
    var narrMaxSlider=document.getElementById('csNarrMaxLen');
    var narrMinVal=document.getElementById('csNarrMinVal');
    var narrMaxVal=document.getElementById('csNarrMaxVal');
    if(narrMinSlider){
        narrMinSlider.addEventListener('input',function(){
            var v=parseInt(narrMinSlider.value,10);
            if(narrMinVal)narrMinVal.textContent=v+' 字';
            var nc;try{nc=JSON.parse(localStorage.getItem('ca-narration-config')||'{}');}catch(ex){nc={};}
            nc.minLen=v;
            localStorage.setItem('ca-narration-config',JSON.stringify(nc));
        });
    }
    if(narrMaxSlider){
        narrMaxSlider.addEventListener('input',function(){
            var v=parseInt(narrMaxSlider.value,10);
            if(narrMaxVal)narrMaxVal.textContent=v+' 字';
            var nc;try{nc=JSON.parse(localStorage.getItem('ca-narration-config')||'{}');}catch(ex){nc={};}
            nc.maxLen=v;
            localStorage.setItem('ca-narration-config',JSON.stringify(nc));
        });
    }

    // 旁白字号
    var narrFontSlider=document.getElementById('csNarrFontSize');
    var narrFontVal=document.getElementById('csNarrFontSizeVal');
    if(narrFontSlider){
        narrFontSlider.addEventListener('input',function(){
            var v=parseInt(narrFontSlider.value,10);
            if(narrFontVal)narrFontVal.textContent=v+' px';
            var nc;try{nc=JSON.parse(localStorage.getItem('ca-narration-config')||'{}');}catch(ex){nc={};}
            nc.fontSize=v;
            localStorage.setItem('ca-narration-config',JSON.stringify(nc));
            applyNarrFontSize(v);
        });
    }

    function applyNarrFontSize(size){
        var styleId='cda-narr-fontsize-style';
        var existing=document.getElementById(styleId);
        if(existing)existing.parentNode.removeChild(existing);
        var s=document.createElement('style');
        s.id=styleId;
        s.textContent='.cda-narr-line{font-size:'+size+'px!important;}';
        document.head.appendChild(s);
    }
    // 初始应用
    (function(){var nc;try{nc=JSON.parse(localStorage.getItem('ca-narration-config')||'{}');}catch(e){nc={};}if(nc.fontSize)applyNarrFontSize(nc.fontSize);})();

    // 见面邀请
    var inviteToggle=document.getElementById('csInviteToggle');
    if(inviteToggle){
        inviteToggle.addEventListener('click',function(e){
            e.stopPropagation();
            setTimeout(function(){
                var allow=inviteToggle.classList.contains('on');
                localStorage.setItem('ca-invite-config-'+entId,JSON.stringify({allow:allow}));
            },50);
        });
    }

    // API 保存
    var apiSave=document.getElementById('csApiSave');
    if(apiSave){
        apiSave.addEventListener('click',function(){
            var config=loadApiConfig();
            var nodeCaps=document.getElementById('csApiNodeCaps');
            var activeNode=nodeCaps.querySelector('.cs-cap.active');
            var node=activeNode&&activeNode.textContent.toLowerCase()==='backup'?'backup':'primary';
            config.node=node;
            if(!config[node])config[node]={};
            config[node].endpoint=document.getElementById('csApiEndpoint').value.trim();
            config[node].key=document.getElementById('csApiKey').value.trim();
            config[node].model=document.getElementById('csApiModel').value.trim();
            config[node].prompt=document.getElementById('csApiPrompt').value.trim();
            saveApiConfig(config);
            apiSave.textContent='✓ Saved';
            setTimeout(function(){apiSave.textContent='Save';},1200);
        });
    }

    // 气泡字体
    var fontSizeSlider=document.getElementById('csFontSize');
    var fontSizeVal=document.getElementById('csFontSizeVal');
    if(fontSizeSlider){
        fontSizeSlider.addEventListener('input',function(){
            if(fontSizeVal)fontSizeVal.textContent=fontSizeSlider.value+' px';
        });
    }
    var fontApply=document.getElementById('csFontApply');
    var fontReset=document.getElementById('csFontReset');
    if(fontApply){
        fontApply.addEventListener('click',function(){
            var size=parseInt(document.getElementById('csFontSize').value,10)||13;
            var name=(document.getElementById('csFontName').value||'').trim();
            var url=(document.getElementById('csFontUrl').value||'').trim();
            localStorage.setItem('ca-bubble-font',JSON.stringify({size:size,name:name,url:url}));
            applyBubbleFont();
            fontApply.textContent='✓ Applied';
            setTimeout(function(){fontApply.textContent='Apply';},1000);
        });
    }
    if(fontReset){
        fontReset.addEventListener('click',function(){
            localStorage.removeItem('ca-bubble-font');
            document.getElementById('csFontSize').value=13;
            if(fontSizeVal)fontSizeVal.textContent='13 px';
            document.getElementById('csFontName').value='';
            document.getElementById('csFontUrl').value='';
            applyBubbleFont();
        });
    }

    function applyBubbleFont(){
        var styleId='cda-bubble-font-style';
        var existing=document.getElementById(styleId);
        if(existing)existing.parentNode.removeChild(existing);
        var cfg;
        try{cfg=JSON.parse(localStorage.getItem('ca-bubble-font')||'{}');}catch(e){cfg={};}
        var css='';
        // 加载自定义字体
        if(cfg.url&&cfg.name){
            css+='@font-face{font-family:"'+cfg.name+'";src:url("'+cfg.url+'");font-display:swap;}\n';
        }
        // 应用字体大小
        var size=cfg.size||13;
        css+='.cda-bubble{font-size:'+size+'px!important;}\n';
        // 应用字体名称
        if(cfg.name){
            css+='.cda-bubble{font-family:"'+cfg.name+'",-apple-system,BlinkMacSystemFont,sans-serif!important;}\n';
        }
        if(css){
            var s=document.createElement('style');
            s.id=styleId;
            s.textContent=css;
            document.head.appendChild(s);
        }
    }
    applyBubbleFont();

    // CSS
    var cssSave=document.getElementById('csCssSave');
    var cssReset=document.getElementById('csCssReset');
    if(cssSave){
        cssSave.addEventListener('click',function(){
            var val=document.getElementById('csCssInput').value;
            localStorage.setItem('ca-custom-css',val);
            var styleNode=document.getElementById('ca-custom-css-node');
            if(!styleNode){
                styleNode=document.createElement('style');
                styleNode.id='ca-custom-css-node';
                document.head.appendChild(styleNode);
            }
            styleNode.textContent=val;
            cssSave.textContent='✓ Applied';
            setTimeout(function(){cssSave.textContent='Apply';},1200);
        });
    }
    if(cssReset){
        cssReset.addEventListener('click',function(){
            document.getElementById('csCssInput').value='';
            localStorage.removeItem('ca-custom-css');
            var styleNode=document.getElementById('ca-custom-css-node');
            if(!styleNode){
                styleNode=document.createElement('style');
                styleNode.id='ca-custom-css-node';
                document.head.appendChild(styleNode);
            }
            styleNode.textContent='';
        });
    }

    // 记忆级别展开/收起
    el.querySelectorAll('.cs-mem-hd-toggle').forEach(function(hd){
        hd.style.cursor='pointer';
        hd.addEventListener('click',function(e){
            e.stopPropagation();
            var level=hd.dataset.level;
            var body=el.querySelector('.cs-mem-body[data-level="'+level+'"]');
            var chevron=hd.querySelector('.cs-mem-chevron');
            if(!body)return;
            var isOpen=body.style.maxHeight&&body.style.maxHeight!=='0px'&&body.style.maxHeight!=='0';
            if(isOpen){
                body.style.maxHeight='0';
                body.style.overflow='hidden';
                body.style.padding='0';
                if(chevron)chevron.style.transform='rotate(0deg)';
            }else{
                body.style.maxHeight='280px';
                body.style.overflowY='auto';
                body.style.overflowX='hidden';
                body.style.padding='8px 0';
                body.style.webkitOverflowScrolling='touch';
                if(chevron)chevron.style.transform='rotate(180deg)';
            }
        });
    });

    // 记忆编辑
    el.querySelectorAll('.cs-mem-edit').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            e.preventDefault();
            var level=btn.dataset.level;
            var idx=parseInt(btn.dataset.idx,10);
            var data=loadMemory(entId);
            if(!data[level]||!data[level][idx])return;
            var currentVal=data[level][idx];

            // 自定义编辑弹窗
            var old=document.getElementById('csMemEditModal');
            if(old)old.parentNode.removeChild(old);

            var modal=document.createElement('div');
            modal.id='csMemEditModal';
            modal.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';

            var bg=document.createElement('div');
            bg.style.cssText='position:absolute;inset:0;background:rgba(26,26,31,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
            modal.appendChild(bg);

            var card=document.createElement('div');
            card.style.cssText='position:relative;width:100%;max-width:320px;background:#fff;border-radius:20px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,0.25);';
            card.innerHTML=
                '<div style="font-size:9px;font-weight:800;letter-spacing:2px;color:rgba(26,26,31,0.3);text-transform:uppercase;margin-bottom:12px;">Edit Memory</div>'+
                '<textarea id="csMemEditTA" style="width:100%;min-height:80px;max-height:200px;border:1px solid rgba(26,26,31,0.1);border-radius:12px;padding:12px;font-size:13px;line-height:1.5;color:#1a1a1f;outline:none;resize:none;font-family:inherit;">'+escapeHtml(currentVal)+'</textarea>'+
                '<div style="display:flex;gap:10px;margin-top:14px;">'+
                    '<button id="csMemEditCancel" style="flex:1;padding:12px;border-radius:50px;border:1px solid rgba(26,26,31,0.12);background:transparent;font-size:9px;font-weight:700;cursor:pointer;color:#1a1a1f;">取消</button>'+
                    '<button id="csMemEditSave" style="flex:1;padding:12px;border-radius:50px;border:none;background:#1a1a1f;color:#fff;font-size:9px;font-weight:700;cursor:pointer;">保存</button>'+
                '</div>';
            modal.appendChild(card);
            document.body.appendChild(modal);

            var ta=document.getElementById('csMemEditTA');
            setTimeout(function(){if(ta)ta.focus();},100);

            bg.addEventListener('click',function(){modal.remove();});
            document.getElementById('csMemEditCancel').addEventListener('click',function(){modal.remove();});
            document.getElementById('csMemEditSave').addEventListener('click',function(){
                var newVal=ta.value.trim();
                if(newVal){
                    var freshData=loadMemory(entId);
                    if(freshData[level]&&freshData[level].length>idx){
                        freshData[level][idx]=newVal;
                        saveMemory(entId,freshData);
                        var textEl=btn.closest('.cs-mem-item').querySelector('.cs-mem-item-text');
                        if(textEl)textEl.textContent=newVal;
                    }
                }
                modal.remove();
            });
        });
    });

    // 记忆删除
    el.querySelectorAll('.cs-mem-del').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            e.preventDefault();
            var level=btn.dataset.level;
            var idx=parseInt(btn.dataset.idx,10);
            var data=loadMemory(entId);
            if(data[level]&&data[level].length>idx){
                data[level].splice(idx,1);
                saveMemory(entId,data);
                var item=btn.closest('.cs-mem-item');
                if(item)item.parentNode.removeChild(item);
                var hd=el.querySelector('.cs-mem-hd-toggle[data-level="'+level+'"]');
                if(hd){
                    var countEl=hd.querySelector('.cs-mem-count');
                    if(countEl)countEl.textContent=data[level].length+' 条';
                }
            }
        });
    });

    // 记忆添加
    el.querySelectorAll('.cs-mem-add button').forEach(function(btn){
        btn.addEventListener('click',function(){
            var level=btn.dataset.level;
            var input=el.querySelector('.cs-mem-add input[data-level="'+level+'"]');
            if(!input||!input.value.trim())return;
            var val=input.value.trim();
            var data=loadMemory(entId);
            data[level].push(val);
            saveMemory(entId,data);
            input.value='';

            // 直接插入 DOM，不重建页面
            var body=el.querySelector('.cs-mem-body[data-level="'+level+'"]');
            if(body){
                var addRow=body.querySelector('.cs-mem-add');
                var idx=data[level].length-1;
                var item=document.createElement('div');
                item.className='cs-mem-item';
                item.setAttribute('data-level',level);
                item.setAttribute('data-idx',idx);
                item.innerHTML='<span class="cs-mem-item-text">'+escapeHtml(val)+'</span><button class="cs-mem-edit" data-level="'+level+'" data-idx="'+idx+'" style="width:18px;height:18px;border-radius:50%;border:none;background:rgba(26,26,31,0.06);color:rgba(26,26,31,0.4);font-size:9px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;">✎</button><button class="cs-mem-del" data-level="'+level+'" data-idx="'+idx+'" style="width:18px;height:18px;border-radius:50%;border:none;background:rgba(26,26,31,0.06);color:rgba(26,26,31,0.4);font-size:10px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;">×</button>';
                if(addRow){body.insertBefore(item,addRow);}else{body.appendChild(item);}

                // 绑定新条目的编辑和删除
                item.querySelector('.cs-mem-edit').addEventListener('click',function(e){
                    e.stopPropagation();e.preventDefault();
                    var curIdx=parseInt(this.dataset.idx,10);
                    var curData=loadMemory(entId);
                    if(!curData[level]||!curData[level][curIdx])return;
                    var currentVal=curData[level][curIdx];
                    var old=document.getElementById('csMemEditModal');if(old)old.remove();
                    var modal=document.createElement('div');modal.id='csMemEditModal';
                    modal.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
                    var bg2=document.createElement('div');bg2.style.cssText='position:absolute;inset:0;background:rgba(26,26,31,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';modal.appendChild(bg2);
                    var card=document.createElement('div');card.style.cssText='position:relative;width:100%;max-width:320px;background:#fff;border-radius:20px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,0.25);';
                    card.innerHTML='<div style="font-size:9px;font-weight:800;letter-spacing:2px;color:rgba(26,26,31,0.3);text-transform:uppercase;margin-bottom:12px;">Edit Memory</div><textarea id="csMemEditTA" style="width:100%;min-height:80px;max-height:200px;border:1px solid rgba(26,26,31,0.1);border-radius:12px;padding:12px;font-size:13px;line-height:1.5;color:#1a1a1f;outline:none;resize:none;font-family:inherit;">'+escapeHtml(currentVal)+'</textarea><div style="display:flex;gap:10px;margin-top:14px;"><button id="csMemEditCancel" style="flex:1;padding:12px;border-radius:50px;border:1px solid rgba(26,26,31,0.12);background:transparent;font-size:9px;font-weight:700;cursor:pointer;color:#1a1a1f;">取消</button><button id="csMemEditSave" style="flex:1;padding:12px;border-radius:50px;border:none;background:#1a1a1f;color:#fff;font-size:9px;font-weight:700;cursor:pointer;">保存</button></div>';
                    modal.appendChild(card);document.body.appendChild(modal);
                    bg2.addEventListener('click',function(){modal.remove();});
                    document.getElementById('csMemEditCancel').addEventListener('click',function(){modal.remove();});
                    document.getElementById('csMemEditSave').addEventListener('click',function(){
                        var nv=document.getElementById('csMemEditTA').value.trim();
                        if(nv){var fd=loadMemory(entId);if(fd[level]&&fd[level].length>curIdx){fd[level][curIdx]=nv;saveMemory(entId,fd);var te=item.querySelector('.cs-mem-item-text');if(te)te.textContent=nv;}}
                        modal.remove();
                    });
                });
                item.querySelector('.cs-mem-del').addEventListener('click',function(e){
                    e.stopPropagation();e.preventDefault();
                    var curIdx=parseInt(this.dataset.idx,10);
                    var curData=loadMemory(entId);
                    if(curData[level]&&curData[level].length>curIdx){curData[level].splice(curIdx,1);saveMemory(entId,curData);item.remove();
                        var hd=el.querySelector('.cs-mem-hd-toggle[data-level="'+level+'"]');
                        if(hd){var ce=hd.querySelector('.cs-mem-count');if(ce)ce.textContent=curData[level].length+' 条';}
                    }
                });

                // 更新计数
                var hd=el.querySelector('.cs-mem-hd-toggle[data-level="'+level+'"]');
                if(hd){var countEl=hd.querySelector('.cs-mem-count');if(countEl)countEl.textContent=data[level].length+' 条';}
            }
        });
    });

    // 记忆轮数
    var slider=document.getElementById('csMemSlider');
    var sliderVal=document.getElementById('csMemSliderVal');
    if(slider){
        slider.addEventListener('input',function(){
            sliderVal.textContent=slider.value;
            localStorage.setItem('ca-mem-rounds-14-'+entId,slider.value);
        });
    }

    // AI 总结 + 手动总结
    var autoSumBtn=document.getElementById('csMemAutoSum');
    var manualSumBtn=document.getElementById('csMemManualSum');

    function doSummarize(fromIdx,toIdx,mode){
        var msgs=window._caConversations&&window._caConversations[entId]?window._caConversations[entId]:[];
        if(msgs.length===0){alert('没有对话数据');return Promise.reject(new Error('无数据'));}
        var f=Math.max(0,fromIdx);
        var t=Math.min(msgs.length,toIdx);
        if(f>=t)return;

        var selectedMsgs=msgs.slice(f,t);
                var transcript=selectedMsgs.map(function(m,i){
                    var _tStr=m.time||'';
                    var _roleL=m.role==='user'?'User':(m.role==='assistant'?'AI':'System');
                    var _mText=m.text||'';
                    var _stMatch=_mText.match(/\[SYS_TIME:\s*([^\]]*)\]/i);
                    var _eTime=_stMatch?_stMatch[1].trim():'';
                    var _dTime=_eTime||_tStr;
                    return '['+(f+i+1)+'] ['+_dTime+'] '+_roleL+': '+_mText;
                }).join('\n');

        var sumPrompt='你是一个精密的叙事记忆系统。请仔细阅读以下对话记录（第 '+(f+1)+' 至第 '+t+' 条），从中提取关键记忆信息。\n\n'+
            '【强制规则】\n'+
            '- 用户一律称为 [user]，角色一律称为 [char]，禁止使用任何其他称谓。\n'+
            '- 凡涉及具体事件，必须以「在［时间］发生……」的格式开头，并在结尾补充「[user] 情绪：… / [char] 情绪：…」。\n'+
            '- 时间信息：若对话中含有时间戳（[SYS_TIME] 或类似标记），优先提取并写入；若无明确时间，写「时间不明」。\n'+
            '- 每条记忆必须包含：主体（[user]/[char]）、行为/事件、情绪反应，三者缺一不可。\n'+
            '- 禁止模糊表述，禁止"似乎""可能"等词。记录已发生的事实。\n\n'+
            '【记忆分级标准】\n'+
            'HIGH — 定义双方关系骨架的核心信息：\n'+
            '  · 双方关系性质的明确转变（如：从陌生→熟识，从疏离→亲密）\n'+
            '  · [char] 对 [user] 做出的重要承诺、表态、或立场宣言\n'+
            '  · [user] 对 [char] 触发的关键情绪节点（愤怒、触动、失控等）\n'+
            '  · 双方共同经历的、不可逆的场景事件\n\n'+
            'MID — 丰富双方互动肌理的重要细节：\n'+
            '  · [char] 对特定话题、人物、事物表现出的明显好恶或习惯反应\n'+
            '  · [user] 的行为模式、语言风格、或反复出现的倾向\n'+
            '  · 有情感温度的对话片段（带时间节点）\n'+
            '  · 双方之间形成的专属默契、暗语、或特殊记忆锚点\n\n'+
            'LOW — 近期碎片与临时性信息：\n'+
            '  · 本次对话中出现的临时场景、道具、地点\n'+
            '  · [user] 或 [char] 在本次对话中的情绪底色\n'+
            '  · 尚未定型、可能随后续对话演变的细节\n\n'+
            '【输出格式】严格按以下格式，每条独立一行，不输出任何额外文字：\n'+
            'HIGH: [内容]\n'+
            'MID: [内容]\n'+
            'LOW: [内容]\n\n'+
            '【事件格式示例】\n'+
            'HIGH: 在［第3条，时间不明］[char] 第一次主动握住 [user] 的手，打破了此前的疏离；[user] 情绪：震惊后转为颤抖的温热；[char] 情绪：克制中透出决然。\n'+
            'MID: 在［第7条，22:14］[user] 说「我不需要你保护」，[char] 沉默超过五秒后才回答；[user] 情绪：逞强中带自我保护；[char] 情绪：隐忍，轻微受挫。\n'+
            'LOW: [user] 本次对话全程语气强硬，但在话题转向回忆时音调明显软化。\n\n'+
            '对话记录：\n'+transcript;

        var apiConfig;try{apiConfig=JSON.parse(localStorage.getItem('ca-api-config')||'{}');}catch(e){apiConfig={};}
        var node=apiConfig.node||'primary';
        var cfg=apiConfig[node]||{};
        var apiKey=cfg.key||'';
        if(!apiKey){alert('未配置 API Key');return Promise.reject(new Error('无API Key'));}

        var model=cfg.model||'gpt-4o';
        var ep=(cfg.endpoint||'https://api.openai.com/v1').replace(/\/+$/,'');
        if(ep.indexOf('/chat/completions')===-1){
            if(ep.match(/\/v\d+$/))ep+='/chat/completions';
            else ep+='/v1/chat/completions';
        }

        return fetch(ep,{
            method:'POST',
            headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
            body:JSON.stringify({model:model,messages:[{role:'user',content:sumPrompt}],max_tokens:800,temperature:0.4})
        })
        .then(function(res){return res.json();})
        .then(function(data){
            var text=data.choices&&data.choices[0]&&data.choices[0].message?data.choices[0].message.content:'';
            var parsed={high:[],mid:[],low:[]};
            text.split('\n').forEach(function(line){
                line=line.trim();
                if(line.toUpperCase().indexOf('HIGH:')===0)parsed.high.push(line.substring(5).trim());
                else if(line.toUpperCase().indexOf('MID:')===0)parsed.mid.push(line.substring(4).trim());
                else if(line.toUpperCase().indexOf('LOW:')===0)parsed.low.push(line.substring(4).trim());
            });

            var existing=loadMemory(entId);
            var finalData;
            if(mode==='replace'){
                finalData=parsed;
            }else{
                finalData={high:existing.high.concat(parsed.high),mid:existing.mid.concat(parsed.mid),low:existing.low.concat(parsed.low)};
            }
            saveMemory(entId,finalData);
            localStorage.setItem('ca-mem-last-sum-'+entId,String(t));
            return parsed;
        });
    }

    function showSumModal(){
        var msgs=window._caConversations&&window._caConversations[entId]?window._caConversations[entId]:[];
        var total=msgs.length;
        if(total===0){alert('没有对话记录');return;}
        var lastSumIdx=parseInt(localStorage.getItem('ca-mem-last-sum-'+entId)||'0',10);

        var old=document.getElementById('csSumModal');
        if(old)old.parentNode.removeChild(old);

        var modal=document.createElement('div');
        modal.id='csSumModal';
        modal.style.cssText='position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';

        var bg=document.createElement('div');
        bg.style.cssText='position:absolute;inset:0;background:rgba(26,26,31,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
        modal.appendChild(bg);

        var card=document.createElement('div');
        card.style.cssText='position:relative;width:100%;max-width:320px;background:#fff;border-radius:24px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.25);';

        card.innerHTML=
            '<div style="font-size:9px;font-weight:800;letter-spacing:2px;color:rgba(26,26,31,0.3);text-transform:uppercase;margin-bottom:16px;">Memory Summary</div>'+
            '<div style="font-size:12px;font-weight:600;color:#1a1a1f;margin-bottom:6px;">对话范围</div>'+
            '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:14px;">共 <b>'+total+'</b> 条'+(lastSumIdx>0?' · 已总结至第 <b style="color:#c0392b;">'+lastSumIdx+'</b> 条':' · 尚未总结')+'</div>'+
            '<div style="display:flex;gap:10px;margin-bottom:16px;">'+
                '<div style="flex:1;"><div style="font-size:8px;font-weight:700;color:rgba(26,26,31,0.3);margin-bottom:4px;">FROM</div><input id="csSumFrom" type="number" min="1" max="'+total+'" value="'+(lastSumIdx+1)+'" style="width:100%;border:none;border-bottom:1px solid rgba(26,26,31,0.1);font-size:14px;font-weight:700;padding:4px 0;outline:none;color:#1a1a1f;"></div>'+
                '<div style="flex:1;"><div style="font-size:8px;font-weight:700;color:rgba(26,26,31,0.3);margin-bottom:4px;">TO</div><input id="csSumTo" type="number" min="1" max="'+total+'" value="'+total+'" style="width:100%;border:none;border-bottom:1px solid rgba(26,26,31,0.1);font-size:14px;font-weight:700;padding:4px 0;outline:none;color:#1a1a1f;"></div>'+
            '</div>'+
            '<div style="display:flex;gap:8px;margin-bottom:16px;">'+
                '<div class="cs-sum-mode active" data-mode="append" style="flex:1;padding:10px;border-radius:12px;border:1px solid #1a1a1f;background:#1a1a1f;color:#fff;font-size:9px;font-weight:700;text-align:center;cursor:pointer;">追加</div>'+
                '<div class="cs-sum-mode" data-mode="replace" style="flex:1;padding:10px;border-radius:12px;border:1px solid rgba(26,26,31,0.12);background:transparent;color:#1a1a1f;font-size:9px;font-weight:700;text-align:center;cursor:pointer;">替换</div>'+
            '</div>'+
            '<div style="display:flex;gap:10px;">'+
                '<button id="csSumCancel" style="flex:1;padding:12px;border-radius:50px;border:1px solid rgba(26,26,31,0.12);background:transparent;font-size:9px;font-weight:700;cursor:pointer;color:#1a1a1f;">取消</button>'+
                '<button id="csSumConfirm" style="flex:2;padding:12px;border-radius:50px;border:none;background:#1a1a1f;color:#fff;font-size:9px;font-weight:700;cursor:pointer;">✦ 开始总结</button>'+
            '</div>';

        modal.appendChild(card);
        document.body.appendChild(modal);

        bg.addEventListener('click',function(){modal.remove();});
        card.querySelector('#csSumCancel').addEventListener('click',function(){modal.remove();});

        var sumMode='append';
        card.querySelectorAll('.cs-sum-mode').forEach(function(btn){
            btn.addEventListener('click',function(){
                sumMode=btn.dataset.mode;
                card.querySelectorAll('.cs-sum-mode').forEach(function(b){
                    var isA=b.dataset.mode===sumMode;
                    b.style.background=isA?'#1a1a1f':'transparent';
                    b.style.color=isA?'#fff':'#1a1a1f';
                    b.style.border=isA?'1px solid #1a1a1f':'1px solid rgba(26,26,31,0.12)';
                });
            });
        });

        card.querySelector('#csSumConfirm').addEventListener('click',function(){
            var f=parseInt(document.getElementById('csSumFrom').value,10)||1;
            var t=parseInt(document.getElementById('csSumTo').value,10)||total;
            f=Math.max(1,Math.min(f,total))-1;
            t=Math.max(f+1,Math.min(t,total));

            var confirmBtn=card.querySelector('#csSumConfirm');
            confirmBtn.textContent='总结中...';
            confirmBtn.style.opacity='0.5';
            confirmBtn.disabled=true;

            var result=doSummarize(f,t,sumMode);
            if(!result){modal.remove();return;}
            result.then(function(parsed){
                modal.remove();
                var totalNew=(parsed.high?parsed.high.length:0)+(parsed.mid?parsed.mid.length:0)+(parsed.low?parsed.low.length:0);
                alert('✓ '+totalNew+' 条记忆已保存');
                // 刷新设置页记忆显示
                renderSettings(entId);
                var settingsEl=document.getElementById('cdaSettings');
                if(settingsEl)settingsEl.classList.add('active');
            }).catch(function(err){
                confirmBtn.textContent='✦ 开始总结';
                confirmBtn.style.opacity='1';
                confirmBtn.disabled=false;
                alert('总结失败: '+err.message);
            });
        });
    }

    if(autoSumBtn){
        autoSumBtn.addEventListener('click',function(e){
            e.stopPropagation();
            showAutoSumConfig();
        });
    }

    function showAutoSumConfig(){
        var old=document.getElementById('csAutoSumModal');
        if(old)old.parentNode.removeChild(old);

        var threshold=parseInt(localStorage.getItem('ca-auto-sum-threshold-'+entId)||'0',10);
        var msgs=window._caConversations&&window._caConversations[entId]?window._caConversations[entId]:[];
        var total=msgs.length;

        var modal=document.createElement('div');
        modal.id='csAutoSumModal';
        modal.style.cssText='position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';

        var bg=document.createElement('div');
        bg.style.cssText='position:absolute;inset:0;background:rgba(26,26,31,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
        modal.appendChild(bg);

        var card=document.createElement('div');
        card.style.cssText='position:relative;width:100%;max-width:300px;background:#fff;border-radius:24px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.25);';

        card.innerHTML=
            '<div style="font-size:9px;font-weight:800;letter-spacing:2px;color:rgba(26,26,31,0.3);text-transform:uppercase;margin-bottom:16px;">Auto Summary</div>'+
            '<div style="font-size:12px;font-weight:600;color:#1a1a1f;margin-bottom:6px;">自动总结设置</div>'+
            '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:16px;line-height:1.5;">当对话消息数量达到设定值时，自动触发 AI 记忆总结。设为 0 则禁用。</div>'+
            '<div style="font-size:10px;color:rgba(26,26,31,0.4);margin-bottom:6px;">当前对话：<b style="color:#1a1a1f;">'+total+'</b> 条</div>'+
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'+
                '<span style="font-size:10px;font-weight:600;color:#1a1a1f;">触发阈值</span>'+
                '<span id="csAutoSumVal" style="font-family:monospace;font-size:16px;font-weight:700;color:#c0392b;">'+threshold+'</span>'+
            '</div>'+
            '<input type="range" id="csAutoSumSlider" min="0" max="200" step="10" value="'+threshold+'" style="width:100%;accent-color:#1a1a1f;margin-bottom:8px;">'+
            '<div style="font-size:8px;color:rgba(26,26,31,0.25);line-height:1.5;margin-bottom:20px;">0 = 禁用自动总结 · 建议设为 50~100</div>'+
            '<div style="display:flex;gap:10px;">'+
                '<button id="csAutoSumClose" style="flex:1;padding:12px;border-radius:50px;border:none;background:#1a1a1f;color:#fff;font-size:9px;font-weight:700;cursor:pointer;">确定</button>'+
            '</div>';

        modal.appendChild(card);
        document.body.appendChild(modal);

        bg.addEventListener('click',function(){modal.remove();});
        card.querySelector('#csAutoSumClose').addEventListener('click',function(){modal.remove();});

        var slider=card.querySelector('#csAutoSumSlider');
        var valDisp=card.querySelector('#csAutoSumVal');
        slider.addEventListener('input',function(){
            valDisp.textContent=slider.value;
            localStorage.setItem('ca-auto-sum-threshold-'+entId,slider.value);
        });
    }
    if(manualSumBtn){
        manualSumBtn.addEventListener('click',function(e){
            e.stopPropagation();
            showSumModal();
        });
    }

    // 通知卡片样式
    var notifGrid=document.getElementById('csNotifGrid');
    if(notifGrid){
        function renderNotifPreview(style){
            var area=document.getElementById('csNotifPreviewArea');
            if(!area)return;
            var narrText='窗外的雨声渐渐大了起来。';
            var actText='他站起身走到窗边。';
            var errText='语气不应该这么温柔。';
            var html='';

            if(style==='default'){
                html+='<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.06);"><div style="width:2.5px;min-height:100%;border-radius:2px;background:#fff;flex-shrink:0;align-self:stretch;"></div><div style="flex:1;"><div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;"><span style="font-size:6.5px;font-weight:800;letter-spacing:0.8px;padding:1.5px 5px;border-radius:3px;background:#fff;color:#1a1a1f;">旁白</span><span style="font-size:6.5px;color:rgba(255,255,255,0.2);">14:32</span></div><div style="font-size:9.5px;color:rgba(255,255,255,0.6);font-style:italic;line-height:1.4;">'+narrText+'</div></div></div>';
                html+='<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.06);"><div style="width:2.5px;min-height:100%;border-radius:2px;background:rgba(255,255,255,0.2);flex-shrink:0;align-self:stretch;"></div><div style="flex:1;"><div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;"><span style="font-size:6.5px;font-weight:800;letter-spacing:0.8px;padding:1.5px 5px;border-radius:3px;border:0.5px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);">动作</span></div><div style="font-size:9.5px;color:rgba(255,255,255,0.45);line-height:1.4;">'+actText+'</div></div></div>';
            }else if(style==='a'){
                // 胶片条
                html+='<div style="background:#1a1a1f;border-radius:3px;overflow:hidden;position:relative;border:0.5px solid rgba(255,255,255,0.1);"><div style="position:absolute;top:0;bottom:0;left:0;width:8px;background:repeating-linear-gradient(to bottom,transparent 0px,transparent 2.5px,rgba(255,255,255,0.1) 2.5px,rgba(255,255,255,0.1) 4px,transparent 4px,transparent 6.5px);"></div><div style="position:absolute;top:0;bottom:0;right:0;width:8px;background:repeating-linear-gradient(to bottom,transparent 0px,transparent 2.5px,rgba(255,255,255,0.1) 2.5px,rgba(255,255,255,0.1) 4px,transparent 4px,transparent 6.5px);"></div><div style="margin:0 12px;padding:7px 5px;border-left:0.5px solid rgba(255,255,255,0.05);border-right:0.5px solid rgba(255,255,255,0.05);"><div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;"><span style="font-size:6px;font-weight:800;letter-spacing:0.8px;padding:1.5px 5px;border-radius:2px;background:#fff;color:#1a1a1f;">旁白</span><span style="font-size:6px;color:rgba(255,255,255,0.2);margin-left:auto;">14:32</span></div><div style="font-size:9.5px;color:rgba(255,255,255,0.7);font-style:italic;line-height:1.4;">'+narrText+'</div></div></div>';
                html+='<div style="background:#1a1a1f;border-radius:3px;overflow:hidden;position:relative;border:0.5px solid rgba(255,255,255,0.1);"><div style="position:absolute;top:0;bottom:0;left:0;width:8px;background:repeating-linear-gradient(to bottom,transparent 0px,transparent 2.5px,rgba(255,255,255,0.1) 2.5px,rgba(255,255,255,0.1) 4px,transparent 4px,transparent 6.5px);"></div><div style="position:absolute;top:0;bottom:0;right:0;width:8px;background:repeating-linear-gradient(to bottom,transparent 0px,transparent 2.5px,rgba(255,255,255,0.1) 2.5px,rgba(255,255,255,0.1) 4px,transparent 4px,transparent 6.5px);"></div><div style="margin:0 12px;padding:7px 5px;border-left:0.5px solid rgba(255,255,255,0.05);border-right:0.5px solid rgba(255,255,255,0.05);"><div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;"><span style="font-size:6px;font-weight:800;letter-spacing:0.8px;padding:1.5px 5px;border-radius:2px;border:0.5px solid rgba(255,255,255,0.25);color:rgba(255,255,255,0.5);">动作</span></div><div style="font-size:9.5px;color:rgba(255,255,255,0.45);line-height:1.4;">'+actText+'</div></div></div>';
            }else if(style==='b'){
                // 邮票
                html+='<div style="background:rgba(255,255,255,0.95);border:1px dashed rgba(26,26,31,0.15);border-radius:2px;padding:8px 10px;position:relative;"><div style="position:absolute;top:-3px;right:6px;width:22px;height:22px;border-radius:50%;border:1.5px solid #1a1a1f;display:flex;align-items:center;justify-content:center;background:#1a1a1f;transform:rotate(12deg);"><span style="font-size:5px;font-weight:900;color:#fff;">CUT</span></div><div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;"><span style="font-size:6.5px;font-weight:800;color:#1a1a1f;letter-spacing:0.5px;">旁白</span><div style="flex:1;height:0.5px;background:rgba(26,26,31,0.08);"></div><span style="font-size:6px;color:rgba(26,26,31,0.2);">14:32</span></div><div style="font-size:9.5px;color:rgba(26,26,31,0.55);font-style:italic;line-height:1.4;padding-right:16px;">'+narrText+'</div></div>';
                html+='<div style="background:rgba(255,255,255,0.95);border:1px dashed rgba(26,26,31,0.15);border-radius:2px;padding:8px 10px;position:relative;"><div style="position:absolute;top:-3px;right:6px;width:22px;height:22px;border-radius:50%;border:1.5px solid rgba(26,26,31,0.6);display:flex;align-items:center;justify-content:center;background:rgba(26,26,31,0.7);transform:rotate(12deg);"><span style="font-size:5px;font-weight:900;color:#fff;">ACT</span></div><div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;"><span style="font-size:6.5px;font-weight:800;color:rgba(26,26,31,0.35);letter-spacing:0.5px;">动作</span><div style="flex:1;height:0.5px;background:rgba(26,26,31,0.08);"></div></div><div style="font-size:9.5px;color:rgba(26,26,31,0.45);line-height:1.4;">'+actText+'</div></div>';
            }else if(style==='c'){
                // 缝线
                html+='<div><div style="height:4px;background:repeating-linear-gradient(to right,rgba(255,255,255,0.15) 0px,rgba(255,255,255,0.15) 5px,transparent 5px,transparent 10px);border-radius:1px;"></div><div style="background:rgba(255,255,255,0.05);border-left:2px solid #fff;border-right:2px solid #fff;padding:7px 10px;"><div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;"><div style="width:12px;height:12px;border-radius:3px;background:#fff;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" style="width:7px;height:7px;stroke:#1a1a1f;fill:none;stroke-width:2;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div><span style="font-size:6.5px;font-weight:800;color:#fff;letter-spacing:0.8px;">旁白</span><span style="font-size:6px;color:rgba(255,255,255,0.2);margin-left:auto;">14:32</span></div><div style="font-size:9.5px;color:rgba(255,255,255,0.65);font-style:italic;line-height:1.4;">'+narrText+'</div></div><div style="height:4px;background:repeating-linear-gradient(to right,rgba(255,255,255,0.15) 0px,rgba(255,255,255,0.15) 5px,transparent 5px,transparent 10px);border-radius:1px;"></div></div>';
                html+='<div><div style="height:4px;background:repeating-linear-gradient(to right,rgba(255,255,255,0.15) 0px,rgba(255,255,255,0.15) 5px,transparent 5px,transparent 10px);border-radius:1px;"></div><div style="background:rgba(255,255,255,0.05);border-left:2px solid rgba(255,255,255,0.2);border-right:2px solid rgba(255,255,255,0.2);padding:7px 10px;"><div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;"><span style="font-size:6.5px;font-weight:800;color:rgba(255,255,255,0.4);letter-spacing:0.8px;">动作</span></div><div style="font-size:9.5px;color:rgba(255,255,255,0.4);line-height:1.4;">'+actText+'</div></div><div style="height:4px;background:repeating-linear-gradient(to right,rgba(255,255,255,0.15) 0px,rgba(255,255,255,0.15) 5px,transparent 5px,transparent 10px);border-radius:1px;"></div></div>';
            }else if(style==='d'){
                // 折角
                html+='<div style="background:linear-gradient(135deg,rgba(255,255,255,0.95) 0%,rgba(248,247,244,0.95) 100%);border-radius:0 10px 10px 10px;padding:8px 12px;position:relative;box-shadow:0 1px 6px rgba(0,0,0,0.04);"><div style="position:absolute;top:0;left:0;width:12px;height:12px;background:linear-gradient(135deg,rgba(240,238,235,1) 50%,rgba(26,26,31,0.06) 50%);border-radius:0 0 5px 0;"></div><div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;padding-left:10px;"><div style="width:4px;height:4px;border-radius:50%;background:#1a1a1f;"></div><span style="font-size:6.5px;font-weight:800;color:#1a1a1f;letter-spacing:0.5px;">旁白</span><span style="font-size:6px;color:rgba(26,26,31,0.18);margin-left:auto;">14:32</span></div><div style="font-size:9.5px;color:rgba(26,26,31,0.55);font-style:italic;line-height:1.4;padding-left:10px;">'+narrText+'</div></div>';
                html+='<div style="background:linear-gradient(135deg,rgba(255,255,255,0.95) 0%,rgba(248,247,244,0.95) 100%);border-radius:0 10px 10px 10px;padding:8px 12px;position:relative;box-shadow:0 1px 6px rgba(0,0,0,0.04);"><div style="position:absolute;top:0;left:0;width:12px;height:12px;background:linear-gradient(135deg,rgba(240,238,235,1) 50%,rgba(26,26,31,0.06) 50%);border-radius:0 0 5px 0;"></div><div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;padding-left:10px;"><div style="width:4px;height:4px;border-radius:50%;background:rgba(26,26,31,0.2);border:0.5px solid rgba(26,26,31,0.3);"></div><span style="font-size:6.5px;font-weight:800;color:rgba(26,26,31,0.4);letter-spacing:0.5px;">动作</span></div><div style="font-size:9.5px;color:rgba(26,26,31,0.4);line-height:1.4;padding-left:10px;">'+actText+'</div></div>';
            }else if(style==='e'){
                // 极简线条
                html+='<div style="display:flex;align-items:stretch;"><div style="width:2px;border-radius:2px;background:#fff;flex-shrink:0;"></div><div style="padding:3px 10px;"><div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;"><span style="font-size:6.5px;font-weight:800;color:#fff;letter-spacing:0.8px;">旁白</span><span style="font-size:6px;color:rgba(255,255,255,0.15);margin-left:auto;">14:32</span></div><div style="font-size:9.5px;color:rgba(255,255,255,0.5);font-style:italic;line-height:1.4;">'+narrText+'</div></div></div>';
                html+='<div style="display:flex;align-items:stretch;"><div style="width:2px;border-radius:2px;background:rgba(255,255,255,0.15);flex-shrink:0;"></div><div style="padding:3px 10px;"><div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;"><span style="font-size:6.5px;font-weight:800;color:rgba(255,255,255,0.3);letter-spacing:0.8px;">动作</span></div><div style="font-size:9.5px;color:rgba(255,255,255,0.35);line-height:1.4;">'+actText+'</div></div></div>';
            }

            area.innerHTML=html;
        }

        notifGrid.querySelectorAll('.cs-notif-item').forEach(function(item){
            item.addEventListener('click',function(e){
                e.stopPropagation();
                notifGrid.querySelectorAll('.cs-notif-item').forEach(function(i){
                    i.classList.remove('active');
                    i.style.borderColor='rgba(255,255,255,0.08)';
                    i.style.background='rgba(255,255,255,0.03)';
                    i.querySelector('div:first-child').style.opacity='0.5';
                    i.querySelector('div:last-child').style.color='rgba(255,255,255,0.4)';
                });
                item.classList.add('active');
                item.style.borderColor='rgba(255,255,255,0.35)';
                item.style.background='rgba(255,255,255,0.12)';
                item.querySelector('div:first-child').style.opacity='1';
                item.querySelector('div:last-child').style.color='#fff';
                var style=item.dataset.notifStyle;
                localStorage.setItem('ca-notif-style',style);
                renderNotifPreview(style);
                window.dispatchEvent(new CustomEvent('cda-settings-changed'));
            });
        });

        // 初始渲染预览
        var initNotifStyle;try{initNotifStyle=localStorage.getItem('ca-notif-style')||'default';}catch(e){initNotifStyle='default';}
        renderNotifPreview(initNotifStyle);

        // 通知字号
        var notifFontSlider=document.getElementById('csNotifFontSize');
        var notifFontVal=document.getElementById('csNotifFontSizeVal');
        if(notifFontSlider){
            notifFontSlider.addEventListener('input',function(){
                var v=notifFontSlider.value;
                if(notifFontVal)notifFontVal.textContent=v+' px';
                localStorage.setItem('ca-notif-font-size',v);
                applyNotifFontSize(v);
                window.dispatchEvent(new CustomEvent('cda-settings-changed'));
            });
        }
        function applyNotifFontSize(size){
            var styleId='cda-notif-fontsize-style';
            var existing=document.getElementById(styleId);
            if(existing)existing.parentNode.removeChild(existing);
            var s=document.createElement('style');
            s.id=styleId;
            s.textContent='.cda-dc-notif-text{font-size:'+size+'px!important;}.cda-notif-a-text{font-size:'+size+'px!important;}.cda-notif-b-text{font-size:'+size+'px!important;}.cda-notif-c-text{font-size:'+size+'px!important;}.cda-notif-d-text{font-size:'+size+'px!important;}.cda-notif-e-text{font-size:'+size+'px!important;}';
            document.head.appendChild(s);
        }
        // 初始应用
        (function(){var fs=localStorage.getItem('ca-notif-font-size');if(fs)applyNotifFontSize(fs);})();
    }

    // 时间间隔样式 - 独立绑定（对应 NO.03.6）
    var tgnThSlider=document.getElementById('csTgnThreshold');
    var tgnThVal=document.getElementById('csTgnThresholdVal');
    if(tgnThSlider){
        tgnThSlider.addEventListener('input',function(){
            var v=parseInt(tgnThSlider.value,10);
            if(tgnThVal)tgnThVal.textContent=v+' min';
            localStorage.setItem('ca-tgn-threshold',String(v));
            window.dispatchEvent(new CustomEvent('cda-settings-changed'));
        });
    }
    var tgnGrid=document.getElementById('csTgnGrid');
    if(tgnGrid){
        function renderTgnPreview(style){
            var area=document.getElementById('csTgnPreviewArea');
            if(!area)return;
            if(style==='off'){
                area.innerHTML='<div style="text-align:center;padding:10px 0;font-size:9px;color:rgba(26,26,31,0.2);">已关闭</div>';
                return;
            }
            var html='';
            if(style==='a'){
                html='<div style="display:flex;justify-content:center;margin:6px 0;"><div style="display:flex;align-items:center;gap:8px;padding:5px 14px;border-radius:20px;background:rgba(26,26,31,0.02);"><div style="width:5px;height:5px;border-radius:50%;background:rgba(26,26,31,0.15);animation:tgnBreath 2.5s ease-in-out infinite;"></div><span style="font-size:9px;color:rgba(26,26,31,0.2);font-weight:500;">23 min</span></div></div>';
            }else if(style==='b'){
                html='<div style="display:flex;justify-content:center;margin:6px 0;"><div style="display:flex;align-items:center;gap:0;width:70%;max-width:200px;height:20px;"><div style="flex:1;height:0.5px;background:linear-gradient(90deg,transparent,rgba(26,26,31,0.08),transparent);"></div><div style="display:flex;align-items:center;gap:6px;padding:0 10px;flex-shrink:0;"><div style="display:flex;align-items:center;gap:1.5px;"><div style="width:1.5px;height:4px;border-radius:1px;background:rgba(26,26,31,0.12);"></div><div style="width:1.5px;height:7px;border-radius:1px;background:rgba(26,26,31,0.12);"></div><div style="width:1.5px;height:10px;border-radius:1px;background:rgba(26,26,31,0.12);"></div><div style="width:1.5px;height:7px;border-radius:1px;background:rgba(26,26,31,0.12);"></div><div style="width:1.5px;height:4px;border-radius:1px;background:rgba(26,26,31,0.12);"></div></div><span style="font-size:8px;color:rgba(26,26,31,0.15);font-weight:600;">1h 30m</span></div><div style="flex:1;height:0.5px;background:linear-gradient(90deg,transparent,rgba(26,26,31,0.08),transparent);"></div></div></div>';
            }else if(style==='c'){
                html='<div style="display:flex;justify-content:center;margin:6px 0;"><div style="display:flex;align-items:center;gap:7px;padding:4px 14px;border-radius:16px;background:rgba(26,26,31,0.015);border:0.5px solid rgba(26,26,31,0.04);"><svg viewBox="0 0 24 24" style="width:12px;height:12px;flex-shrink:0;" fill="none" stroke="rgba(26,26,31,0.2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12M6 22h12M7 2v4.2C7 8.4 8.8 10 12 12c-3.2 2-5 3.6-5 5.8V22M17 2v4.2C17 8.4 15.2 10 12 12c3.2 2 5 3.6 5 5.8V22"/></svg><span style="font-size:9px;color:rgba(26,26,31,0.2);font-weight:500;">45 min</span><span style="font-size:8px;color:rgba(26,26,31,0.12);font-family:Courier New,monospace;">· 2:30 PM</span></div></div>';
            }else if(style==='d'){
                html='<div style="display:flex;justify-content:center;margin:6px 0;"><div style="position:relative;display:flex;align-items:center;justify-content:center;padding:6px 18px;"><div style="position:absolute;width:50px;height:50px;border-radius:50%;border:0.5px solid rgba(26,26,31,0.06);"></div><div style="position:absolute;width:70px;height:70px;border-radius:50%;border:0.5px solid rgba(26,26,31,0.04);"></div><div style="position:relative;z-index:1;display:flex;align-items:center;gap:6px;"><div style="width:4px;height:4px;border-radius:50%;background:rgba(26,26,31,0.15);"></div><span style="font-size:9px;color:rgba(26,26,31,0.18);font-weight:500;">2h 15m</span><div style="width:4px;height:4px;border-radius:50%;background:rgba(26,26,31,0.15);"></div></div></div></div>';
            }else if(style==='e'){
                html='<div style="display:flex;justify-content:center;margin:6px 0;"><div style="display:flex;align-items:center;padding:3px 0;"><div style="display:flex;flex-direction:column;gap:3px;padding:0 4px;"><div style="width:4px;height:3px;border-radius:1px;background:rgba(26,26,31,0.06);"></div><div style="width:4px;height:3px;border-radius:1px;background:rgba(26,26,31,0.06);"></div><div style="width:4px;height:3px;border-radius:1px;background:rgba(26,26,31,0.06);"></div></div><div style="padding:4px 14px;border-top:0.5px solid rgba(26,26,31,0.06);border-bottom:0.5px solid rgba(26,26,31,0.06);display:flex;align-items:center;gap:8px;"><span style="font-family:Courier New,monospace;font-size:7px;font-weight:700;color:rgba(26,26,31,0.12);">▸▸▸</span><span style="font-size:9px;color:rgba(26,26,31,0.18);font-weight:500;font-style:italic;">3h 20m</span><span style="font-family:Courier New,monospace;font-size:7px;color:rgba(26,26,31,0.1);">4:15 PM</span></div><div style="display:flex;flex-direction:column;gap:3px;padding:0 4px;"><div style="width:4px;height:3px;border-radius:1px;background:rgba(26,26,31,0.06);"></div><div style="width:4px;height:3px;border-radius:1px;background:rgba(26,26,31,0.06);"></div><div style="width:4px;height:3px;border-radius:1px;background:rgba(26,26,31,0.06);"></div></div></div></div>';
            }
            area.innerHTML=html;
        }

        tgnGrid.querySelectorAll('.cs-tgn-item').forEach(function(item){
            item.addEventListener('click',function(e){
                e.stopPropagation();
                tgnGrid.querySelectorAll('.cs-tgn-item').forEach(function(i){
                    i.classList.remove('active');
                    i.style.borderColor='rgba(26,26,31,0.06)';
                    i.style.background='rgba(26,26,31,0.01)';
                    i.querySelector('div:first-child').style.opacity='0.4';
                    i.querySelector('div:last-child').style.color='rgba(26,26,31,0.3)';
                });
                item.classList.add('active');
                item.style.borderColor='rgba(26,26,31,0.2)';
                item.style.background='rgba(26,26,31,0.06)';
                item.querySelector('div:first-child').style.opacity='1';
                item.querySelector('div:last-child').style.color='#1a1a1f';
                localStorage.setItem('ca-tgn-style',item.dataset.tgnStyle);
                renderTgnPreview(item.dataset.tgnStyle);
                window.dispatchEvent(new CustomEvent('cda-settings-changed'));
            });
        });

        var initTgn;try{initTgn=localStorage.getItem('ca-tgn-style')||'off';}catch(e){initTgn='off';}
        renderTgnPreview(initTgn);
    }

    // 符号过滤
    var filterInput=document.getElementById('csFilterChars');
    var filterToggle=document.getElementById('csFilterToggle');
    var filterMine=document.getElementById('csFilterMine');
    var filterNarr=document.getElementById('csFilterNarr');
    if(filterInput){
        filterInput.addEventListener('input',function(){
            localStorage.setItem('ca-filter-chars',filterInput.value);
            applyFilterRefresh();
        });
    }
    if(filterToggle){
        filterToggle.addEventListener('click',function(e){
            e.stopPropagation();
            setTimeout(function(){
                localStorage.setItem('ca-filter-on',filterToggle.classList.contains('on')?'true':'false');
                applyFilterRefresh();
            },50);
        });
    }
    if(filterMine){
        filterMine.addEventListener('click',function(e){
            e.stopPropagation();
            setTimeout(function(){
                localStorage.setItem('ca-filter-mine',filterMine.classList.contains('on')?'true':'false');
                applyFilterRefresh();
            },50);
        });
    }
    if(filterNarr){
        filterNarr.addEventListener('click',function(e){
            e.stopPropagation();
            setTimeout(function(){
                localStorage.setItem('ca-filter-narr',filterNarr.classList.contains('on')?'true':'false');
                applyFilterRefresh();
            },50);
        });
    }

    function applyFilterRefresh(){
        window.dispatchEvent(new CustomEvent('cda-settings-changed'));
    }

    // 危险操作
    var clearBtn=document.getElementById('csDangerClear');
    if(clearBtn){
        clearBtn.addEventListener('click',function(){
            if(!confirm('清空所有聊天记录？'))return;
            if(window._caConversations)window._caConversations[entId]=[];
            if(typeof ChatDB!=='undefined'&&ChatDB.saveConversation){
                ChatDB.saveConversation(entId,[]);
            }
            closeSettings();
            if(typeof window.openChatDetailAlt==='function')window.openChatDetailAlt(entId);
        });
    }

    var deleteBtn=document.getElementById('csDangerDelete');
    if(deleteBtn){
        deleteBtn.addEventListener('click',function(){
            if(!confirm('永久删除此联系人及所有数据？'))return;
            if(window._caEntities){
                window._caEntities=window._caEntities.filter(function(e){return e.id!==entId;});
            }
            if(window._caConversations)delete window._caConversations[entId];
            if(typeof ChatDB!=='undefined'&&ChatDB.deleteEntity){
                ChatDB.deleteEntity(entId);
            }
            closeSettings();
            if(typeof window.closeChatDetailAlt==='function')window.closeChatDetailAlt();
        });
    }
}

function closeSettings(){
    var el=document.getElementById('cdaSettings');
    if(!el)return;
    el.classList.remove('active');
    el.classList.add('closing');
    setTimeout(function(){el.classList.remove('closing');},350);

    // 关闭设置后立即刷新聊天气泡（翻译样式等变更即时生效）
    var area=document.getElementById('cdaMsgArea');
    if(area&&settingsEntId){
        var entities=window._caEntities||[];
        var ent=entities.find(function(e){return e.id===settingsEntId;});
        if(ent&&typeof window.openChatDetailAlt==='function'){
            // 直接重新渲染消息区，不重建整个页面
            setTimeout(function(){
                var msgArea=document.getElementById('cdaMsgArea');
                if(msgArea){
                    window.dispatchEvent(new CustomEvent('cda-settings-changed',{detail:{entId:settingsEntId}}));
                }
            },100);
        }
    }
}

window.openCdaSettings=function(entId){
    buildSettings();
    renderSettings(entId);
    var el=document.getElementById('cdaSettings');
    el.classList.remove('closing');
    el.classList.add('active');
};

window.closeCdaSettings=closeSettings;

})();
