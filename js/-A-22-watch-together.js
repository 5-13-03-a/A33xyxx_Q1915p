// js/-A-22-watch-together.js · Watch Together 一起看（完全复刻原HTML）
(function(){
'use strict';

var _wtReaderCfg;
try{_wtReaderCfg=JSON.parse(localStorage.getItem('wt-reader-settings')||'{}');}catch(e){_wtReaderCfg={};}
var S={content:'',name:'',pos:0,fs:_wtReaderCfg.fs||19,ps:_wtReaderCfg.ps||800,ms:_wtReaderCfg.ms||200,bg:'#ffffff',color:'#0e0e0e'};
var library=[];
try{library=JSON.parse(localStorage.getItem('wt-library-meta')||'[]');}catch(e){library=[];}

// 从 localStorage 恢复设置
var _wtSettings;
try{_wtSettings=JSON.parse(localStorage.getItem('wt-mini-settings')||'{}');}catch(e){_wtSettings={};}
var miniFs=_wtSettings.fs||13;
var miniW=_wtSettings.w||200;
var miniH=_wtSettings.h||150;
var built=false;
var currentWtEntId=null;
var miniVisible=false;

// 恢复小窗状态
var _wtMiniState;
try{_wtMiniState=JSON.parse(localStorage.getItem('wt-mini-state')||'{}');}catch(e){_wtMiniState={};}

function saveMiniSettings(){
    localStorage.setItem('wt-mini-settings',JSON.stringify({fs:miniFs,w:miniW,h:miniH}));
}
function saveReaderSettings(){
    localStorage.setItem('wt-reader-settings',JSON.stringify({fs:S.fs,ps:S.ps,ms:S.ms}));
}
function saveMiniState(){
    localStorage.setItem('wt-mini-state',JSON.stringify({
        visible:miniVisible,name:S.name,pos:S.pos,ps:S.ps,ms:S.ms,entId:currentWtEntId
    }));
}

function saveLibraryMeta(){
    var meta=library.map(function(b){return{name:b.name,len:b.len||0,pos:b.pos||0};});
    localStorage.setItem('wt-library-meta',JSON.stringify(meta));
}

/* ═══ IndexedDB ═══ */
function openWtDB(cb){
    var req=indexedDB.open('WatchTogetherDB',1);
    req.onupgradeneeded=function(e){e.target.result.createObjectStore('books',{keyPath:'name'});};
    req.onsuccess=function(e){cb(e.target.result);};
    req.onerror=function(){cb(null);};
}
function saveBookContent(name,content,done){
    openWtDB(function(db){
        if(!db){if(done)done();return;}
        var tx=db.transaction('books','readwrite');
        tx.objectStore('books').put({name:name,content:content});
        tx.oncomplete=function(){if(done)done();};
        tx.onerror=function(){if(done)done();};
    });
}
function loadBookContent(name,cb){
    openWtDB(function(db){
        if(!db){cb('');return;}
        var tx=db.transaction('books','readonly');
        var req2=tx.objectStore('books').get(name);
        req2.onsuccess=function(){cb(req2.result?req2.result.content:'');};
        req2.onerror=function(){cb('');};
    });
}
function deleteBookContent(name,done){
    openWtDB(function(db){
        if(!db){if(done)done();return;}
        var tx=db.transaction('books','readwrite');
        tx.objectStore('books').delete(name);
        tx.oncomplete=function(){if(done)done();};
    });
}

/* ═══ Build DOM ═══ */
function buildAll(){
    if(built)return;
    built=true;

    // ══ UPLOAD VIEW ══
    var upload=document.createElement('section');
    upload.id='wt-view-upload';
    upload.className='wt-view';
    upload.innerHTML=
        '<div class="wt-up-masthead">'+
            '<div class="wt-up-masthead-top">'+
                '<div style="display:flex;align-items:center;gap:12px;">'+
                    '<div id="wtUploadBack" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0.4;"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:#0e0e0e;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><polyline points="15 18 9 12 15 6"/></svg></div>'+
                    '<div class="wt-up-issue">VOL. I · NO. 01 · ARCHIVE EDITION</div>'+
                '</div>'+
                '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" style="opacity:0.15;"><rect x="1" y="1" width="26" height="26" stroke="#0e0e0e" stroke-width="0.8"/><rect x="5" y="5" width="18" height="18" stroke="#0e0e0e" stroke-width="0.5"/><line x1="14" y1="1" x2="14" y2="27" stroke="#0e0e0e" stroke-width="0.5"/><line x1="1" y1="14" x2="27" y2="14" stroke="#0e0e0e" stroke-width="0.5"/></svg>'+
            '</div>'+
            '<div class="wt-up-logo">Watch<em>.</em></div>'+
            '<div class="wt-up-tagline">A Shared Reading Experience — Together in Every Word</div>'+
            '<div class="wt-up-masthead-rule"><div class="wt-up-rule-thick"></div><div class="wt-up-rule-gap"></div><div class="wt-up-rule-thin"></div></div>'+
        '</div>'+
        '<div class="wt-up-body">'+
            '<div class="wt-up-feature">'+
                '<div class="wt-up-feature-label">Feature · Load Archive</div>'+
                '<div class="wt-up-cta" id="wtUploadCta">'+
                    '<div class="wt-up-cta-left"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>'+
                    '<div class="wt-up-cta-right">'+
                        '<div class="wt-up-cta-headline">Open a Novel</div>'+
                        '<div class="wt-up-cta-sub">TXT · MD<br>Select a file to begin reading</div>'+
                    '</div>'+
                    '<div class="wt-up-cta-arrow">→</div>'+
                '</div>'+
            '</div>'+
            '<div class="wt-up-meta-row">'+
                '<span class="wt-up-meta-label">File Encoding</span>'+
                '<select class="wt-up-meta-select" id="wtEncoding"><option value="UTF-8">UTF-8</option><option value="GBK">GBK</option><option value="Big5">Big5</option><option value="Shift_JIS">Shift_JIS</option></select>'+
            '</div>'+
            '<div class="wt-up-library" id="wtLibrary" style="display:none;">'+
                '<div class="wt-up-lib-hd"><div class="wt-up-lib-title">Reading List</div><div class="wt-up-lib-count" id="wtLibCount">—</div></div>'+
                '<div id="wtLibList"></div>'+
            '</div>'+
        '</div>'+
        '<input type="file" id="wtFileInput" accept=".txt,.md" hidden>';
    document.body.appendChild(upload);

    // ══ READER VIEW ══
    var reader=document.createElement('section');
    reader.id='wt-view-reader';
    reader.className='wt-view';
    reader.innerHTML=
        '<div class="wt-rd-capsule">'+
            '<div class="wt-rd-cap-btn" id="wtReaderBack"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>'+
            '<div class="wt-rd-cap-center">'+
                '<div class="wt-rd-cap-badge">NOW READING</div>'+
                '<div class="wt-rd-cap-title" id="wtRdTitle">—</div>'+
                '<div class="wt-rd-cap-sub" id="wtRdSub">CH 0</div>'+
            '</div>'+
            '<div class="wt-rd-cap-btn" id="wtReaderSettings"><svg viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg></div>'+
        '</div>'+
        '<div class="wt-rd-content" id="wtReaderScroll"><div class="wt-rd-text" id="wtReaderText"></div></div>'+
        '<div class="wt-rd-footer-wrap">'+
            '<div class="wt-rd-footer-glow"></div>'+
            '<div class="wt-rd-footer">'+
                '<div class="wt-rd-progress-track" id="wtProgressArea"><div class="wt-rd-progress-fill" id="wtProgressFill"></div><div class="wt-rd-progress-thumb" id="wtProgressThumb"></div></div>'+
                '<div class="wt-rd-pct" id="wtProgressPct">0.0%</div>'+
            '</div>'+
        '</div>';
    document.body.appendChild(reader);

    // ══ SETTINGS SHEET ══
    var stOv=document.createElement('div');
    stOv.className='wt-st-overlay wt-view';
    stOv.id='wtSettingsOverlay';
    stOv.innerHTML=
        '<div class="wt-st-sheet">'+
            '<div class="wt-st-sheet-hd">'+
                '<div class="wt-st-sheet-title">Reading Settings</div>'+
                '<div class="wt-st-sheet-close" id="wtSettingsClose">CLOSE ×</div>'+
            '</div>'+
            '<div class="wt-st-section">'+
                '<div class="wt-st-section-label">Typography</div>'+
                '<div class="wt-st-row"><span class="wt-st-row-name">Font Size</span><div class="wt-st-ctrl"><div class="wt-st-btn" data-k="fs" data-d="-1">−</div><span class="wt-st-val" id="wtValFs">19</span><div class="wt-st-btn" data-k="fs" data-d="1">+</div></div></div>'+
            '</div>'+
            '<div class="wt-st-section">'+
                '<div class="wt-st-section-label">Sync Parameters</div>'+
                '<div class="wt-st-row"><span class="wt-st-row-name">Page Size</span><div class="wt-st-ctrl"><div class="wt-st-btn" data-k="ps" data-d="-100">−</div><span class="wt-st-val" id="wtValPs">800</span><div class="wt-st-btn" data-k="ps" data-d="100">+</div></div></div>'+
                '<div class="wt-st-row"><span class="wt-st-row-name">Mini Window</span><div class="wt-st-ctrl"><div class="wt-st-btn" data-k="ms" data-d="-50">−</div><span class="wt-st-val" id="wtValMs">200</span><div class="wt-st-btn" data-k="ms" data-d="50">+</div></div></div>'+
            '</div>'+
            '<button class="wt-st-invite-btn" id="wtSendInviteBtn"><svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>Send Invite · 发送邀约</button>'+
        '</div>';
    document.body.appendChild(stOv);

    // ══ MINI WINDOW ══
    var mini=document.createElement('div');
    mini.id='wt-mini';
    mini.className='wt-view';
    mini.innerHTML=
        '<div class="wt-mini-pin"></div>'+
        '<div class="wt-mini-hd" id="wtMiniHd">'+
            '<span class="wt-mini-name" id="wtMiniName">Reading...</span>'+
            '<div class="wt-mini-acts">'+
                '<div class="wt-mini-act" id="wtMiniSettingsBtn"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4"/></svg></div>'+
                '<div class="wt-mini-act" id="wtMiniExpand"><svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></div>'+
                '<div class="wt-mini-act" id="wtMiniCloseBtn"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>'+
            '</div>'+
        '</div>'+
        '<div class="wt-mini-bd" id="wtMiniText">等待开始阅读…</div>'+
        '<div class="wt-mini-ft">'+
            '<span class="wt-mini-pos" id="wtMiniPos">0 / 0</span>'+
            '<div class="wt-mini-live"><div class="wt-mini-live-dot"></div><span class="wt-mini-live-label">LIVE</span></div>'+
        '</div>'+
        '<div class="wt-mini-settings" id="wtMiniSettingsPanel">'+
            '<div class="wt-mini-settings-hd"><span>Mini Settings</span><div class="wt-mini-settings-close" id="wtMiniSettingsClose"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div></div>'+
            '<div class="wt-mini-settings-body">'+
                '<div class="wt-ms-row"><span class="wt-ms-label">字号</span><div class="wt-ms-ctrl"><div class="wt-ms-btn" data-k="fs" data-d="-1">−</div><span class="wt-ms-val" id="wtMsValFs">13</span><div class="wt-ms-btn" data-k="fs" data-d="1">+</div></div></div>'+
                '<div class="wt-ms-row"><span class="wt-ms-label">同步字数</span><div class="wt-ms-ctrl"><div class="wt-ms-btn" data-k="ms" data-d="-50">−</div><span class="wt-ms-val" id="wtMsValMs">200</span><div class="wt-ms-btn" data-k="ms" data-d="50">+</div></div></div>'+
                '<div class="wt-ms-row"><span class="wt-ms-label">宽度</span><div class="wt-ms-ctrl"><div class="wt-ms-btn" data-k="w" data-d="-20">−</div><span class="wt-ms-val" id="wtMsValW">200</span><div class="wt-ms-btn" data-k="w" data-d="20">+</div></div></div>'+
                '<div class="wt-ms-row"><span class="wt-ms-label">高度</span><div class="wt-ms-ctrl"><div class="wt-ms-btn" data-k="h" data-d="-20">−</div><span class="wt-ms-val" id="wtMsValH">150</span><div class="wt-ms-btn" data-k="h" data-d="20">+</div></div></div>'+
            '</div>'+
        '</div>'+
        '<div class="wt-mini-pager">'+
            '<div class="wt-mini-pager-btn" id="wtMiniPrev"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>'+
            '<div class="wt-mini-pager-btn" id="wtMiniNext"><svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg></div>'+
        '</div>';
    document.body.appendChild(mini);

    bindAllEvents();
}

/* ═══ Events ═══ */
function bindAllEvents(){
    // Upload back
    document.getElementById('wtUploadBack').addEventListener('click',closeUpload);

    // Upload CTA
    document.getElementById('wtUploadCta').addEventListener('click',function(){
        document.getElementById('wtFileInput').click();
    });

    // File input
    document.getElementById('wtFileInput').addEventListener('change',function(){
        var file=this.files[0];if(!file)return;
        var name=file.name.replace(/\.[^.]+$/,'');
        var enc=document.getElementById('wtEncoding').value;
        var r=new FileReader();
        r.onload=function(e){
            var content=e.target.result;
            var existing=library.findIndex(function(b){return b.name===name;});
            if(existing!==-1){library[existing].len=content.length;library[existing].content=content;}
            else{library.push({name:name,content:content,len:content.length,pos:0});}
            saveBookContent(name,content,function(){
                saveLibraryMeta();
                renderLibrary();
                S.name=name;S.content=content;S.pos=0;
                openReader();
            });
        };
        r.readAsText(file,enc);
        this.value='';
    });

    // Reader back
    document.getElementById('wtReaderBack').addEventListener('click',exitReader);

    // Reader settings button
    document.getElementById('wtReaderSettings').addEventListener('click',function(){
        document.getElementById('wtValFs').textContent=S.fs;
        document.getElementById('wtValPs').textContent=S.ps;
        document.getElementById('wtValMs').textContent=S.ms;
        document.getElementById('wtSettingsOverlay').classList.add('active');
    });

    // Settings close
    document.getElementById('wtSettingsClose').addEventListener('click',function(){
        document.getElementById('wtSettingsOverlay').classList.remove('active');
    });
    document.getElementById('wtSettingsOverlay').addEventListener('click',function(e){
        if(e.target===this)this.classList.remove('active');
    });

    // Settings buttons
    document.querySelectorAll('.wt-st-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            var k=this.dataset.k;
            var d=parseInt(this.dataset.d,10);
            if(k==='fs')S.fs=Math.max(12,Math.min(60,S.fs+d));
            if(k==='ps')S.ps=Math.max(200,Math.min(50000,S.ps+d));
            if(k==='ms')S.ms=Math.max(50,Math.min(5000,S.ms+d));
            document.getElementById('wtValFs').textContent=S.fs;
            document.getElementById('wtValPs').textContent=S.ps;
            document.getElementById('wtValMs').textContent=S.ms;
            saveReaderSettings();
            renderReaderContent();
        });
    });

    // Send invite from settings
    document.getElementById('wtSendInviteBtn').addEventListener('click',function(){
        document.getElementById('wtSettingsOverlay').classList.remove('active');
        sendInviteToChat();
    });

    // Progress area
    document.getElementById('wtProgressArea').addEventListener('click',function(e){
        var rect=this.getBoundingClientRect();
        var total=Math.max(1,S.content.length-S.ps);
        S.pos=Math.max(0,Math.min(total,Math.floor((e.clientX-rect.left)/rect.width*total)));
        savePosToLibrary();
        renderReaderContent();
        syncMini();
    });

    // Scroll to next page
    document.getElementById('wtReaderScroll').addEventListener('scroll',function(){
        if(this.scrollTop+this.clientHeight>=this.scrollHeight-5&&S.pos+S.ps<S.content.length){
            S.pos+=S.ps;
            savePosToLibrary();
            renderReaderContent();
            syncMini();
            this.scrollTop=0;
        }
    });

    // Mini window controls
    document.getElementById('wtMiniCloseBtn').addEventListener('click',closeMini);
    document.getElementById('wtMiniExpand').addEventListener('click',function(){closeMini();openReader();});
    document.getElementById('wtMiniSettingsBtn').addEventListener('click',function(){
        document.getElementById('wtMiniSettingsPanel').classList.add('active');
    });
    document.getElementById('wtMiniSettingsClose').addEventListener('click',function(){
        document.getElementById('wtMiniSettingsPanel').classList.remove('active');
    });

    // Mini settings buttons
    document.querySelectorAll('#wt-mini .wt-ms-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            var k=this.dataset.k;
            var d=parseInt(this.dataset.d,10);
            adjMini(k,d);
        });
    });

    // Mini pager
    document.getElementById('wtMiniPrev').addEventListener('click',function(){
        if(S.pos-S.ms>0)S.pos-=S.ms;else S.pos=0;
        savePosToLibrary();
        renderReaderContent();
        syncMini();
    });
    document.getElementById('wtMiniNext').addEventListener('click',function(){
        if(S.pos+S.ms<S.content.length)S.pos+=S.ms;
        savePosToLibrary();
        renderReaderContent();
        syncMini();
    });

    // Mini drag
    (function(){
        var miniEl=document.getElementById('wt-mini');
        var drag=false,sx,sy,ox,oy;
        function start(cx,cy){drag=true;sx=cx;sy=cy;ox=miniEl.offsetLeft;oy=miniEl.offsetTop;}
        function move(cx,cy){if(!drag)return;miniEl.style.right='auto';miniEl.style.left=(ox+cx-sx)+'px';miniEl.style.top=(oy+cy-sy)+'px';}
        function end(){drag=false;}
        var hd=document.getElementById('wtMiniHd');
        hd.addEventListener('touchstart',function(e){if(e.target.closest('.wt-mini-act'))return;start(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
        document.addEventListener('touchmove',function(e){if(drag)move(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
        document.addEventListener('touchend',function(){if(drag)end();});
        hd.addEventListener('mousedown',function(e){if(e.target.closest('.wt-mini-act'))return;start(e.clientX,e.clientY);});
        document.addEventListener('mousemove',function(e){if(drag)move(e.clientX,e.clientY);});
        document.addEventListener('mouseup',function(){if(drag)end();});
    })();
}

/* ═══ Library ═══ */
function renderLibrary(){
    var wrap=document.getElementById('wtLibrary');
    var list=document.getElementById('wtLibList');
    var count=document.getElementById('wtLibCount');
    if(!library.length){wrap.style.display='none';return;}
    wrap.style.display='block';
    count.textContent=library.length+' titles';
    list.innerHTML=library.map(function(b,i){
        var pct=b.len>0?Math.round((b.pos||0)/Math.max(1,b.len-S.ps)*100):0;
        pct=Math.min(100,Math.max(0,pct));
        var kb=Math.round((b.len||0)/1000);
        return '<div class="wt-up-book-item" data-idx="'+i+'">'+
            '<div class="wt-up-book-num">'+String(i+1).padStart(2,'0')+'</div>'+
            '<div class="wt-up-book-body">'+
                '<div class="wt-up-book-name">'+esc(b.name)+'</div>'+
                '<div class="wt-up-book-meta">'+(b.len||0)+' CH · '+kb+'K · '+pct+'% READ</div>'+
            '</div>'+
            '<div class="wt-up-book-prog"><div class="wt-up-book-prog-fill" style="height:'+pct+'%;"></div></div>'+
            '<div class="wt-up-book-del" data-del="'+i+'"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>'+
        '</div>';
    }).join('');

    list.querySelectorAll('.wt-up-book-item').forEach(function(item){
        item.addEventListener('click',function(e){
            if(e.target.closest('.wt-up-book-del'))return;
            var idx=parseInt(item.dataset.idx,10);
            var book=library[idx];
            S.name=book.name;S.pos=book.pos||0;
            if(book.content){S.content=book.content;openReader();}
            else{loadBookContent(book.name,function(c){S.content=c;book.content=c;openReader();});}
        });
    });

    list.querySelectorAll('.wt-up-book-del').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var idx=parseInt(btn.dataset.del,10);
            var name=library[idx].name;
            library.splice(idx,1);
            saveLibraryMeta();
            deleteBookContent(name,function(){renderLibrary();});
        });
    });
}

/* ═══ Upload Panel ═══ */
function openUpload(entId){
    buildAll();
    currentWtEntId=entId;
    renderLibrary();
    document.getElementById('wt-view-upload').classList.add('active');
}
function closeUpload(){
    document.getElementById('wt-view-upload').classList.remove('active');
}

/* ═══ Reader ═══ */
function openReader(){
    closeUpload();
    document.getElementById('wt-view-reader').classList.add('active');
    document.getElementById('wtRdTitle').textContent=S.name;
    document.getElementById('wtRdSub').textContent='WATCH TOGETHER · '+(S.content.length||0)+' CH';
    renderReaderContent();
}
function exitReader(){
    savePosToLibrary();
    document.getElementById('wt-view-reader').classList.remove('active');
}
function renderReaderContent(){
    var text=S.content.substring(S.pos,S.pos+S.ps);
    var el=document.getElementById('wtReaderText');
    el.textContent=text;
    el.style.fontSize=S.fs+'px';
    var total=Math.max(1,S.content.length-S.ps);
    var pct=Math.min(100,Math.max(0,S.pos/total*100));
    document.getElementById('wtProgressFill').style.width=pct+'%';
    document.getElementById('wtProgressThumb').style.left=pct+'%';
    document.getElementById('wtProgressPct').textContent=pct.toFixed(1)+'%';
    broadcastState();
}
function savePosToLibrary(){
    var idx=library.findIndex(function(b){return b.name===S.name;});
    if(idx!==-1){library[idx].pos=S.pos;saveLibraryMeta();}
}

/* ═══ Send Invite Card ═══ */
function sendInviteToChat(){
    if(!currentWtEntId||!S.content){toast('请先选择一本书');return;}
    var total=Math.max(1,S.content.length-S.ps);
    var pct=Math.min(100,S.pos/total*100);
    var pages=Math.ceil(S.content.length/S.ps);

    // 当前阅读的文本片段
    var currentText=S.content.substring(S.pos,S.pos+S.ms);

    var token='[WT_INVITE::'+JSON.stringify({
        name:S.name,len:S.content.length,
        pct:pct.toFixed(1),pages:pages,
        pos:S.pos,ps:S.ps,ms:S.ms,
        currentText:currentText
    })+'::WT_END]';

    if(!window._caConversations)window._caConversations={};
    if(!window._caConversations[currentWtEntId])window._caConversations[currentWtEntId]=[];

    var now=new Date();
    var timeStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');

    window._caConversations[currentWtEntId].push({role:'info',text:token,ai_visible:true,time:timeStr});

    if(typeof ChatDB!=='undefined'&&ChatDB.saveConversation){
        ChatDB.saveConversation(currentWtEntId,window._caConversations[currentWtEntId]);
    }

    exitReader();

    if(typeof window.openChatDetailAlt==='function'){
        window.openChatDetailAlt(currentWtEntId);
    }
    toast('邀请已发送');
}

/* ═══ Build Invite Card HTML (for chat bubble) ═══ */
function buildInviteCardHtml(data,msgIdx){
    var cardId='wt-card-'+Date.now()+'-'+Math.random().toString(36).substr(2,6);
    var html=
        '<div class="wt-invite-card" id="'+cardId+'">'+
            '<div class="wt-invite-card-hd">'+
                '<div class="wt-invite-card-hd-icon"><svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>'+
                '<span class="wt-invite-card-hd-label">Watch Together · Invite</span>'+
            '</div>'+
            '<div class="wt-invite-card-body">'+
                '<div class="wt-invite-card-title">'+esc(data.name)+'</div>'+
                '<div class="wt-invite-card-stats">'+
                    '<div class="wt-invite-card-stat"><span class="wt-invite-card-stat-val">'+Number(data.len).toLocaleString()+'</span><span class="wt-invite-card-stat-label">Chars</span></div>'+
                    '<div class="wt-invite-card-stat"><span class="wt-invite-card-stat-val">'+data.pct+'%</span><span class="wt-invite-card-stat-label">Progress</span></div>'+
                    '<div class="wt-invite-card-stat"><span class="wt-invite-card-stat-val">'+data.pages+'</span><span class="wt-invite-card-stat-label">Pages</span></div>'+
                '</div>'+
                '<button class="wt-invite-card-btn" data-card-id="'+cardId+'"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>开启小窗 · Watch</button>'+
            '</div>'+
        '</div>';

    setTimeout(function(){
        var card=document.getElementById(cardId);
        if(!card)return;
        var btn=card.querySelector('.wt-invite-card-btn');
        if(!btn)return;
        btn.addEventListener('click',function(ev){
            ev.stopPropagation();
            if(btn.classList.contains('accepted'))return;
            btn.classList.add('accepted');
            btn.innerHTML='<svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:currentColor;fill:none;stroke-width:2.5;"><polyline points="20 6 9 17 4 12"/></svg>已开启 · Watching';
            acceptInvite(data);
        });
    },500);

    return html;
}

/* ═══ Accept Invite ═══ */
function acceptInvite(data){
    buildAll();
    S.name=data.name;
    S.pos=data.pos||0;
    S.ps=data.ps||800;
    S.ms=data.ms||200;

    loadBookContent(data.name,function(content){
        if(!content){
            toast('未找到书籍，请先通过「一起看」上传该文件');
            return;
        }
        S.content=content;
        openMiniWindow();
    });
}

/* ═══ Mini Window ═══ */
function openMiniWindow(){
    buildAll();
    var mini=document.getElementById('wt-mini');
    mini.style.width=miniW+'px';
    mini.querySelector('.wt-mini-bd').style.maxHeight=miniH+'px';
    mini.style.display='block';
    setTimeout(function(){mini.classList.add('visible');},30);
    miniVisible=true;
    saveMiniState();
    syncMini();
}
function closeMini(){
    var mini=document.getElementById('wt-mini');
    mini.classList.remove('visible');
    setTimeout(function(){mini.style.display='none';},300);
    miniVisible=false;
    saveMiniState();

    // 发退出通知到聊天
    if(currentWtEntId&&window._caConversations&&window._caConversations[currentWtEntId]){
        var now=new Date();
        var timeStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
        window._caConversations[currentWtEntId].push({
            role:'info',
            text:'[WT_EXIT::退出了一起看「'+S.name+'」]',
            ai_visible:true,
            time:timeStr
        });
        if(typeof ChatDB!=='undefined'&&ChatDB.saveConversation){
            ChatDB.saveConversation(currentWtEntId,window._caConversations[currentWtEntId]);
        }
        // 刷新聊天
        var area=document.getElementById('cdaMsgArea');
        if(area){
            var tip=document.createElement('div');
            tip.className='cda-dc-notif-row';
            tip.innerHTML='<div style="display:flex;align-items:center;gap:6px;padding:4px 12px;border-radius:16px;background:rgba(26,26,31,0.02);border:0.5px solid rgba(26,26,31,0.06);">'+
                '<svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:rgba(26,26,31,0.25);fill:none;stroke-width:2;flex-shrink:0;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'+
                '<span style="font-size:10px;color:rgba(26,26,31,0.25);font-weight:400;">退出了一起看</span>'+
            '</div>';
            area.appendChild(tip);
            area.scrollTop=area.scrollHeight;
        }
    }
}
function syncMini(){
    var mini=document.getElementById('wt-mini');
    if(!mini||mini.style.display==='none')return;
    document.getElementById('wtMiniText').textContent=S.content.substring(S.pos,S.pos+S.ms)||'等待开始…';
    document.getElementById('wtMiniText').style.fontSize=miniFs+'px';
    document.getElementById('wtMiniPos').textContent=S.pos+' / '+S.content.length;
    document.getElementById('wtMiniName').textContent=S.name;
}
function adjMini(k,d){
    if(k==='fs'){miniFs=Math.max(10,Math.min(40,miniFs+d));document.getElementById('wtMsValFs').textContent=miniFs;}
    if(k==='ms'){S.ms=Math.max(50,Math.min(5000,S.ms+d));document.getElementById('wtMsValMs').textContent=S.ms;document.getElementById('wtValMs').textContent=S.ms;}
    if(k==='w'){miniW=Math.max(150,Math.min(280,miniW+d));document.getElementById('wtMsValW').textContent=miniW;document.getElementById('wt-mini').style.width=miniW+'px';}
    if(k==='h'){miniH=Math.max(80,Math.min(300,miniH+d));document.getElementById('wtMsValH').textContent=miniH;document.querySelector('.wt-mini-bd').style.maxHeight=miniH+'px';}
    document.getElementById('wtMiniText').style.fontSize=miniFs+'px';
    saveMiniSettings();
    syncMini();
}

/* ═══ Broadcast / Sync ═══ */
function broadcastState(){
    syncMini();
    saveMiniState();

    // 同步当前阅读内容到对话，让AI知道你正在看的内容
    if(!currentWtEntId)return;
    if(!window._caConversations||!window._caConversations[currentWtEntId])return;
    var currentText=S.content.substring(S.pos,S.pos+S.ms);
    if(!currentText)return;

    // 查找并更新最后一条 WT_READING 消息（避免刷屏）
    var msgs=window._caConversations[currentWtEntId];
    var lastReadIdx=-1;
    for(var i=msgs.length-1;i>=0;i--){
        if(msgs[i].role==='info'&&msgs[i].text&&msgs[i].text.indexOf('[WT_READING::')===0){
            lastReadIdx=i;break;
        }
    }

    var readingToken='[WT_READING::'+JSON.stringify({
        name:S.name,pos:S.pos,
        text:currentText
    })+'::WT_END]';

    if(lastReadIdx!==-1){
        msgs[lastReadIdx].text=readingToken;
    }else{
        msgs.push({role:'info',text:readingToken,ai_visible:true,time:''});
    }

    if(typeof ChatDB!=='undefined'&&ChatDB.saveConversation){
        ChatDB.saveConversation(currentWtEntId,msgs);
    }
}


/* ═══ Restore Mini on Page Load ═══ */
function restoreMiniIfNeeded(){
    if(!_wtMiniState.visible||!_wtMiniState.name)return;
    buildAll();
    S.name=_wtMiniState.name;
    S.pos=_wtMiniState.pos||0;
    S.ps=_wtMiniState.ps||800;
    S.ms=_wtMiniState.ms||200;
    currentWtEntId=_wtMiniState.entId||null;
    loadBookContent(S.name,function(content){
        if(!content)return;
        S.content=content;
        var mini=document.getElementById('wt-mini');
        mini.style.width=miniW+'px';
        mini.querySelector('.wt-mini-bd').style.maxHeight=miniH+'px';
        mini.style.display='block';
        setTimeout(function(){mini.classList.add('visible');},30);
        miniVisible=true;
        syncMini();
    });
}

// 页面加载后恢复小窗
if(document.readyState==='complete'){restoreMiniIfNeeded();}
else{window.addEventListener('load',restoreMiniIfNeeded);}

/* ═══ AI Turn Page ═══ */
// AI 回复中包含 [WT_TURN_PAGE] 指令时，触发翻页
window.addEventListener('wt-ai-turn-page',function(e){
    var dir=(e.detail&&e.detail.direction)||'next';
    if(!S.content)return;
    if(dir==='next'){
        if(S.pos+S.ps<S.content.length)S.pos+=S.ps;
    }else if(dir==='prev'){
        if(S.pos-S.ps>0)S.pos-=S.ps;else S.pos=0;
    }
    savePosToLibrary();
    if(document.getElementById('wt-view-reader').classList.contains('active')){
        renderReaderContent();
    }
    syncMini();
    saveMiniState();

    // 在聊天室显示翻页提示
    if(currentWtEntId&&window._caConversations&&window._caConversations[currentWtEntId]){
        var now=new Date();
        var timeStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
        window._caConversations[currentWtEntId].push({
            role:'info',
            text:'[WT_PAGE_TURN::'+dir+'::对方翻了一页]',
            ai_visible:false,
            time:timeStr
        });
        if(typeof ChatDB!=='undefined'&&ChatDB.saveConversation){
            ChatDB.saveConversation(currentWtEntId,window._caConversations[currentWtEntId]);
        }
        // 刷新聊天界面
        var area=document.getElementById('cdaMsgArea');
        if(area&&typeof window.openChatDetailAlt==='function'){
            // 轻量刷新：不全量重渲染，直接追加提示
            var tip=document.createElement('div');
            tip.className='cda-dc-notif-row';
            tip.innerHTML='<div style="display:flex;align-items:center;gap:6px;padding:4px 12px;border-radius:16px;background:rgba(26,26,31,0.02);border:0.5px solid rgba(26,26,31,0.06);">'+
                '<svg viewBox="0 0 24 24" style="width:10px;height:10px;stroke:rgba(26,26,31,0.25);fill:none;stroke-width:2;flex-shrink:0;"><polyline points="'+(dir==='next'?'9 6 15 12 9 18':'15 18 9 12 15 6')+'"/></svg>'+
                '<span style="font-size:10px;color:rgba(26,26,31,0.25);font-weight:400;">对方翻了一页</span>'+
            '</div>';
            area.appendChild(tip);
            area.scrollTop=area.scrollHeight;
        }
    }

    // 同步阅读内容给AI
    broadcastState();
});

/* ═══ Helpers ═══ */
function esc(str){var d=document.createElement('div');d.textContent=str;return d.innerHTML;}
function toast(msg){
    var t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#0e0e0e;color:#fff;padding:8px 18px;border-radius:50px;font-size:12px;font-weight:600;z-index:9999;opacity:0;transition:opacity 0.2s;';
    t.textContent=msg;document.body.appendChild(t);
    requestAnimationFrame(function(){t.style.opacity='1';});
    setTimeout(function(){t.style.opacity='0';setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},200);},1200);
}

/* ═══ Public API ═══ */
window.WatchTogether={
    open:openUpload,
    buildInviteCardHtml:buildInviteCardHtml,
    acceptInvite:acceptInvite,
    openMini:openMiniWindow,
    closeMini:closeMini,
    getState:function(){return{name:S.name,pos:S.pos,ps:S.ps,ms:S.ms,content:S.content,len:S.content.length};}
};

})();
