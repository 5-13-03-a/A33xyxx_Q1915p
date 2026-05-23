// js/-A-23-intimacy.js · 亲密档案 Intimacy Archive · Lucid White Editorial
(function(){
'use strict';

var built=false;
var currentEntId=null;

function getEntities(){return window._caEntities||[];}
function getConversations(){return window._caConversations||{};}

function calcStats(entId){
    var msgs=(getConversations()[entId])||[];
    var total=0,firstTime=null,lastTime=null,days=new Set();
    msgs.forEach(function(m){
        if(!m||!m.text)return;
        if(m.role==='user'||m.role==='assistant')total++;
        if(m.time){
            var d=m.time.split(' ')[0];
            if(d)days.add(d);
            if(!firstTime)firstTime=m.time;
            lastTime=m.time;
        }
    });
    var dayCount=days.size||1;
    var avgPerDay=Math.round(total/dayCount);
    var firstDate=firstTime?firstTime.split(' ')[0]:'';
    var totalDays=1;
    if(firstDate){
        var fd=new Date(firstDate.replace(/-/g,'/'));
        var now=new Date();
        totalDays=Math.max(1,Math.floor((now.getTime()-fd.getTime())/86400000));
    }
    var warmth=Math.min(99,Math.round(Math.min(avgPerDay*3,60)+Math.min(dayCount*0.5,39)));
    return{total:total,avgPerDay:avgPerDay,dayCount:dayCount,totalDays:totalDays,firstDate:firstDate,warmth:warmth};
}

function build(){
    if(built)return;
    built=true;
    var el=document.createElement('div');
    el.className='ia-app';
    el.id='iaApp';
    document.body.appendChild(el);
    if(!document.getElementById('ia-style')){
        var s=document.createElement('style');
        s.id='ia-style';
        s.textContent=cssText();
        document.head.appendChild(s);
    }
}

function render(entId){
    var el=document.getElementById('iaApp');
    if(!el)return;
    currentEntId=entId;

    var entities=getEntities();
    var ent=entities.find(function(e){return e.id===entId;});
    if(!ent){el.innerHTML='<div style="padding:80px 20px;text-align:center;color:#8E8E93;">No entity selected</div>';return;}

    var stats=calcStats(entId);
    var name=ent.nickname||ent.name||'Entity';
    var initial=name.charAt(0).toUpperCase();
    var color=ent.color||'#1a1a1f';
    var avatarUrl=ent.avatar||'';

    var memData;
    try{memData=JSON.parse(localStorage.getItem('ca-memory-'+entId)||'{"high":[],"mid":[],"low":[]}');}catch(e){memData={high:[],mid:[],low:[]};}
    var memCount=memData.high.length+memData.mid.length+memData.low.length;

    var codes;try{codes=JSON.parse(localStorage.getItem('ia-codes-'+entId)||'[]');}catch(e){codes=[];}
    var letters;try{letters=JSON.parse(localStorage.getItem('ia-letters-'+entId)||'[]');}catch(e){letters=[];}

    // 用户面具头像
    var userAv='';
    try{
        var masks=JSON.parse(localStorage.getItem('ca-user-masks')||'[]');
        var activeMask=masks.find(function(m){return m.active;})||masks[0];
        if(activeMask&&activeMask.id&&typeof ChatDB!=='undefined'){
            // 同步读取较难，先用空
        }
    }catch(ex){}

    // 头像内容
    var leftAvInner='<svg class="ia-venn-icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M4 22v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/></svg>';
    var rightAvInner=avatarUrl
        ?'<img src="'+avatarUrl+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
        :'<span style="font-family:\'Playfair Display\',serif;font-size:32px;font-style:italic;color:#1A1A1F;">'+initial+'</span>';

    // Hero 背景：头像从左到右渐变消失（原始像素，不压缩）
    var heroBgStyle=avatarUrl
        ?'background-image:url('+avatarUrl+');background-size:cover;background-position:left center;image-rendering:auto;'
        :'background:linear-gradient(to right,'+color+' 0%,'+color+'88 40%,transparent 100%);';

    // 异步加载头像：优先 DB 原图，回退到 ent.avatar
    if(avatarUrl&&typeof ChatDB!=='undefined'&&ChatDB.open){
        setTimeout(function(){
            ChatDB.open(function(d){
                if(!d)return;
                try{
                    var tx=d.transaction('avatars','readonly');
                    var req=tx.objectStore('avatars').get(entId);
                    req.onsuccess=function(){
                        var src=(req.result&&req.result.data)?req.result.data:avatarUrl;
                        var bgEl=document.getElementById('iaApp')&&document.getElementById('iaApp').querySelector('.ia-hero-bg');
                        if(bgEl){
                            bgEl.style.backgroundImage='url('+src+')';
                            bgEl.style.backgroundSize='cover';
                            bgEl.style.backgroundPosition='left center';
                        }
                    };
                }catch(ex){}
            });
        },50);
    }

    el.innerHTML=
        '<div class="ia-noise"></div>'+

        // Header
        '<div class="ia-header">'+
            '<div class="ia-header-back" id="iaBack"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>'+
            '<div class="ia-header-pill">'+
                '<div class="ia-header-meta">Vol. 01 · Archive</div>'+
                '<div class="ia-header-title">Intimacy</div>'+
            '</div>'+
        '</div>'+

        // Hero
        // Hero
        '<div class="ia-hero">'+
            '<div class="ia-hero-clip">'+
                '<div class="ia-hero-bg" style="'+heroBgStyle+'"></div>'+
                '<div class="ia-hero-blur"></div>'+
                '<div class="ia-hero-dark"></div>'+
                '<div class="ia-hero-stars" id="iaHeroStars"></div>'+
            '</div>'+
            '<div class="ia-hero-content">'+
                '<div class="ia-venn">'+
                    '<div class="ia-venn-circle left"><div class="ia-venn-glow-border"></div>'+leftAvInner+'</div>'+
                    '<div class="ia-venn-circle right">'+rightAvInner+'</div>'+
                    '<div class="ia-venn-core"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>'+
                '</div>'+
                '<div class="ia-hero-names">You & '+escapeHtml(name)+'</div>'+
                '<div class="ia-hero-badge"><div class="ia-hero-badge-dot"></div><span>Connected · Day '+stats.totalDays+'</span></div>'+
            '</div>'+
        '</div>'+

        // Data Strip
        '<div class="ia-data-strip">'+
            '<div class="ia-data-pill"><div class="ia-data-val" id="iaDV1">0</div><div class="ia-data-label">Messages</div></div>'+
            '<div class="ia-data-pill"><div class="ia-data-val" id="iaDV2">0</div><div class="ia-data-label">Days</div></div>'+
            '<div class="ia-data-pill"><div class="ia-data-val" id="iaDV3">0</div><div class="ia-data-label">Daily Avg</div></div>'+
        '</div>'+

        // Thermo
        '<div class="ia-thermo-wrap">'+
            '<div class="ia-thermo-header"><span>Absolute Zero</span><span class="ia-thermo-val" id="iaTVal">0°</span><span>Boiling Point</span></div>'+
            '<div class="ia-thermo-track"><div class="ia-thermo-fill" id="iaTFill" style="width:0%;"><div class="ia-thermo-dot"></div></div></div>'+
        '</div>'+

        // I. Milestones
        '<div class="ia-section" data-sec="milestone">'+
            '<div class="ia-sec-header">'+
                '<div class="ia-sec-badge">I.</div>'+
                '<div class="ia-sec-title">Milestones</div>'+
                '<div class="ia-sec-action" id="iaMilestoneGen" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>'+
                '<div class="ia-sec-chevron"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
            '</div>'+
            '<div class="ia-sec-body"><div id="iaMilestoneArea">'+buildMilestoneHTML(entId)+'</div></div>'+
        '</div>'+

        // II. Spectrum
        '<div class="ia-section" data-sec="spectrum">'+
            '<div class="ia-sec-header"><div class="ia-sec-badge">II.</div><div class="ia-sec-title">Spectrum</div><div class="ia-sec-chevron"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div></div>'+
            '<div class="ia-sec-body"><div class="ia-spectrum"><div class="ia-spec-chart" id="iaSpecChart"></div>'+
            '<div class="ia-spec-legend">'+
                '<div class="ia-spec-leg"><div class="ia-spec-dot" style="background:#1A1A1F;"></div>热情</div>'+
                '<div class="ia-spec-leg"><div class="ia-spec-dot" style="background:#888;"></div>温暖</div>'+
                '<div class="ia-spec-leg"><div class="ia-spec-dot" style="background:#E5E5E5;"></div>平静</div>'+
                '<div class="ia-spec-leg"><div class="ia-spec-dot" style="background:transparent;border:0.5px solid rgba(26,26,31,0.15);"></div>低落</div>'+
            '</div></div></div>'+
        '</div>'+

        // III. Sync Test
        '<div class="ia-section" data-sec="quiz">'+
            '<div class="ia-sec-header"><div class="ia-sec-badge">III.</div><div class="ia-sec-title">Synchronization</div><div class="ia-sec-chevron"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div></div>'+
            '<div class="ia-sec-body"><div class="ia-quiz-card">'+
                '<div class="ia-quiz-deco">Q</div>'+
                '<div class="ia-quiz-q" id="iaQLabel">Question 01</div>'+
                '<div class="ia-quiz-text" id="iaQText"></div>'+
                '<div class="ia-quiz-opts" id="iaQOpts"></div>'+
                '<div class="ia-quiz-res" id="iaQRes"></div>'+
            '</div></div>'+
        '</div>'+

        // IV. Glossary
        '<div class="ia-section" data-sec="codes">'+
            '<div class="ia-sec-header"><div class="ia-sec-badge">IV.</div><div class="ia-sec-title">Glossary</div>'+
                '<div class="ia-sec-action" id="iaCodeAddBtn" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>'+
                '<div class="ia-sec-chevron"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
            '</div>'+
            '<div class="ia-sec-body">'+buildGlossaryHTML(codes)+'</div>'+
        '</div>'+

        // V. Time Capsule
        '<div class="ia-section" data-sec="letters">'+
            '<div class="ia-sec-header"><div class="ia-sec-badge">V.</div><div class="ia-sec-title">Time Capsule</div>'+
                '<div class="ia-sec-action" id="iaLetterAddBtn" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>'+
                '<div class="ia-sec-chevron"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>'+
            '</div>'+
            '<div class="ia-sec-body">'+buildLettersHTML(letters)+'</div>'+
        '</div>'+

        // VI. Protocol
        '<div class="ia-section" data-sec="protocol">'+
            '<div class="ia-sec-header"><div class="ia-sec-badge">VI.</div><div class="ia-sec-title">Protocol</div><div class="ia-sec-chevron"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div></div>'+
            '<div class="ia-sec-body">'+buildProtocolHTML(ent)+'</div>'+
        '</div>'+

        // Summary
        '<div class="ia-summary-wrap">'+
            '<div class="ia-summary">'+
                '<div class="ia-sum-title">Official Record</div>'+
                '<div class="ia-sum-names">You & '+escapeHtml(name)+'</div>'+
                '<div class="ia-sum-status"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Status: Connected</div>'+
                '<div class="ia-sum-grid"><div class="ia-sum-block"><div class="ia-sum-val" id="iaSyncVal">--%</div><div class="ia-sum-lbl">Sync Rate</div></div><div class="ia-sum-div"></div><div class="ia-sum-block"><div class="ia-sum-val" id="iaWarmVal">0°</div><div class="ia-sum-lbl">Warmth</div></div></div>'+
            '</div>'+
        '</div>'+

        '<div class="ia-footer">A0nynx · 3i Studio</div>';

    // 绑定
    document.getElementById('iaBack').onclick=closeApp;
    document.getElementById('iaCodeAddBtn').onclick=function(){addCode();};
    document.getElementById('iaLetterAddBtn').onclick=function(){addLetter();};
    var milestoneBtn=document.getElementById('iaMilestoneGen');
    if(milestoneBtn)milestoneBtn.onclick=function(){generateMilestones(entId);};

    // Section 点击展开/折叠
    var secInited={};
    el.querySelectorAll('.ia-sec-header').forEach(function(hd){
        hd.addEventListener('click',function(){
            var sec=hd.closest('.ia-section');
            if(!sec)return;
            sec.classList.toggle('open');
            // 延迟初始化内容（只在首次展开时）
            var secId=sec.dataset.sec;
            if(sec.classList.contains('open')&&!secInited[secId]){
                secInited[secId]=true;
                if(secId==='spectrum')initSpectrum();
                if(secId==='quiz')initQuiz();
            }
        });
    });

    // 任务点击
    el.querySelectorAll('.ia-pr-item').forEach(function(item){
        item.onclick=function(e){
            e.stopPropagation();
            item.classList.toggle('done');
            saveTasks();
        };
    });

    // ── 通用删除交互 ──
    // 点击条目本身 → 切换 del-mode（显示删除按钮）
    // 点击删除按钮 → 执行删除
    // 点击其他地方 → 收起所有 del-mode

    function clearDelMode(){
        el.querySelectorAll('.del-mode').forEach(function(x){x.classList.remove('del-mode');});
    }

    // Glossary 点击
    el.querySelectorAll('.ia-gl-item.ia-deletable').forEach(function(item){
        item.addEventListener('click',function(e){
            if(e.target.closest('.ia-del-btn'))return;
            var wasMode=item.classList.contains('del-mode');
            clearDelMode();
            if(!wasMode)item.classList.add('del-mode');
        });
    });
    el.querySelectorAll('.ia-glossary .ia-del-btn').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var idx=parseInt(btn.dataset.idx);
            var codes;try{codes=JSON.parse(localStorage.getItem('ia-codes-'+currentEntId)||'[]');}catch(ex){codes=[];}
            codes.splice(idx,1);
            localStorage.setItem('ia-codes-'+currentEntId,JSON.stringify(codes));
            var area=btn.closest('.ia-sec-body');
            if(area){
                var newHtml=buildGlossaryHTML(codes);
                area.innerHTML=newHtml;
                bindDelEvents(area,'glossary');
            }
            showToast('已删除');
        });
    });

    // Letters 点击
    el.querySelectorAll('.ia-let-item.ia-deletable').forEach(function(item){
        item.addEventListener('click',function(e){
            if(e.target.closest('.ia-del-btn'))return;
            var wasMode=item.classList.contains('del-mode');
            clearDelMode();
            if(!wasMode)item.classList.add('del-mode');
        });
    });
    el.querySelectorAll('.ia-letters .ia-del-btn').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var idx=parseInt(btn.dataset.idx);
            var letters;try{letters=JSON.parse(localStorage.getItem('ia-letters-'+currentEntId)||'[]');}catch(ex){letters=[];}
            letters.splice(idx,1);
            localStorage.setItem('ia-letters-'+currentEntId,JSON.stringify(letters));
            var area=btn.closest('.ia-sec-body');
            if(area){
                area.innerHTML=buildLettersHTML(letters);
                bindDelEvents(area,'letters');
            }
            showToast('已删除');
        });
    });

    // Milestones 点击
    el.querySelectorAll('.ia-tl-item').forEach(function(item){
        item.addEventListener('click',function(e){
            if(e.target.closest('.ia-tl-del-btn'))return;
            var wasMode=item.classList.contains('del-mode');
            clearDelMode();
            if(!wasMode)item.classList.add('del-mode');
        });
    });
    el.querySelectorAll('.ia-tl-del-btn').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var idx=parseInt(btn.dataset.idx);
            var milestones;try{milestones=JSON.parse(localStorage.getItem('ia-milestones-'+currentEntId)||'[]');}catch(ex){milestones=[];}
            milestones.splice(idx,1);
            localStorage.setItem('ia-milestones-'+currentEntId,JSON.stringify(milestones));
            var area=document.getElementById('iaMilestoneArea');
            if(area){
                area.innerHTML=buildMilestoneHTML(currentEntId);
                bindDelEvents(area,'milestone');
            }
            showToast('已删除');
        });
    });

    // 点击空白收起
    el.addEventListener('click',function(e){
        if(!e.target.closest('.ia-deletable')&&!e.target.closest('.ia-tl-item')){
            clearDelMode();
        }
    });

    // 动画
    setTimeout(function(){
        animNum('iaDV1',0,stats.total,1000);
        animNum('iaDV2',0,stats.totalDays,600);
        animNum('iaDV3',0,stats.avgPerDay,500);
        document.getElementById('iaTVal').textContent=stats.warmth+'°';
        document.getElementById('iaTFill').style.width=stats.warmth+'%';
        document.getElementById('iaWarmVal').textContent=stats.warmth+'°';
        initStars();
    },400);
}

// ═══ HTML Builders ═══

function buildMilestoneHTML(entId){
    var milestones;
    try{milestones=JSON.parse(localStorage.getItem('ia-milestones-'+entId)||'[]');}catch(e){milestones=[];}
    if(milestones.length===0)return '<div class="ia-empty">No milestones yet.<br><span style="font-size:10px;color:#8E8E93;">Tap ⚡ to let AI analyze your recent conversations.</span></div>';
    var h='<div class="ia-timeline">';
    milestones.slice(0,15).forEach(function(item,i){
        var dateDisp='';
        if(item.month&&item.day){dateDisp=getMonthAbbr(item.month)+'<br>'+item.day;}
        var timeDisp=item.time||'';
        var tag=item.tag||'';
        h+='<div class="ia-tl-item" data-idx="'+i+'">'+
            '<div class="ia-tl-date">'+dateDisp+'</div>'+
            '<div class="ia-tl-dot '+(item.importance==='high'?'filled':'')+'"></div>'+
            '<div class="ia-tl-line"></div>'+
            '<div class="ia-tl-content"><div class="ia-tl-text">'+escapeHtml(item.text)+'</div><div class="ia-tl-meta">'+(tag?tag+' · ':'')+escapeHtml(timeDisp)+'</div></div>'+
            '<div class="ia-tl-del-btn" data-idx="'+i+'"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>'+
        '</div>';
    });
    h+='</div>';
    return h;
}

function getMonthAbbr(m){var a=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];return a[(m-1)%12]||'';}

function buildGlossaryHTML(codes){
    var icons=[
        '<circle cx="12" cy="10" r="4"/><path d="M12 14c-5 0-5 4-5 4"/><path d="M12 14c5 0 5 4 5 4"/><path d="M8 6c0-2 2-4 4-4s4 2 4 4" stroke-dasharray="1 2"/>',
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
        '<path d="M18 8h1a4 4 0 0 1 0 8h-1M6 8H5a4 4 0 0 0 0 8h1"/><line x1="6" y1="12" x2="18" y2="12" stroke-dasharray="2 2"/><path d="M6 8c0-2 2.7-4 6-4s6 2 6 4"/>',
        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'
    ];
    if(codes.length===0)return '<div class="ia-empty">No secret codes yet.</div>';
    var h='<div class="ia-glossary">';
    codes.forEach(function(c,i){
        var ic=icons[i%icons.length];
        h+='<div class="ia-gl-item ia-deletable" data-idx="'+i+'">'+
            '<div class="ia-gl-icon"><svg viewBox="0 0 24 24">'+ic+'</svg></div>'+
            '<div class="ia-gl-content"><div class="ia-gl-word">'+escapeHtml(c.word)+'</div><div class="ia-gl-mean">'+escapeHtml(c.meaning)+'</div></div>'+
            '<div class="ia-del-btn" data-idx="'+i+'"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>'+
        '</div>';
    });
    h+='</div>';
    return h;
}

function buildLettersHTML(letters){
    if(letters.length===0)return '<div class="ia-empty">No letters yet.</div>';
    var h='<div class="ia-letters">';
    letters.forEach(function(l,i){
        var isOpen=l.condition==='Unrestricted'||l.condition==='随时可打开';
        h+='<div class="ia-let-item ia-deletable'+(isOpen?' openable':'')+'" data-idx="'+i+'">'+
            '<div class="ia-let-info">'+
                '<div class="ia-let-title">'+escapeHtml(l.title||'Letter #'+(i+1))+'</div>'+
                '<div class="ia-let-cond"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="'+(isOpen?'M7 11V7a5 5 0 0 1 5 5':'M7 11V7a5 5 0 0 1 10 0v4')+'"/></svg>'+escapeHtml(l.condition||'Sealed')+'</div>'+
            '</div>'+
            '<div class="ia-let-status '+(isOpen?'open':'sealed')+'">'+(isOpen?'Open':'Sealed')+'</div>'+'<div class="ia-del-btn" data-idx="'+i+'"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>'+
        '</div>';
    });
    h+='</div>';
    return h;
}

function buildProtocolHTML(ent){
    var name=ent?(ent.nickname||ent.name):'them';
    var tasks=[
        'Initiate morning greeting with '+name+'.',
        'Share one mundane daily detail.',
        'Deliver a sincere compliment to '+name+'.',
        'Execute goodnight protocol.'
    ];
    var done;try{done=JSON.parse(localStorage.getItem('ia-tasks-done-'+currentEntId+'-'+todayKey())||'[]');}catch(e){done=[];}
    var h='<div class="ia-protocol">';
    tasks.forEach(function(t,i){
        var isDone=done.indexOf(i)!==-1;
        h+='<div class="ia-pr-item'+(isDone?' done':'')+'" data-idx="'+i+'"><div class="ia-pr-box"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="ia-pr-text">'+t+'</div></div>';
    });
    h+='</div>';
    return h;
}

// ═══ Stars ═══
function initStars(){
    var container=document.getElementById('iaHeroStars');
    if(!container||container.children.length)return;
    var count=40;
    for(var i=0;i<count;i++){
        var star=document.createElement('div');
        star.className='ia-star';
        var size=Math.random()<0.3?(0.5+Math.random()*0.5):(1+Math.random()*2);
        var opacity=0.1+Math.random()*0.7;
        var delay=Math.random()*4;
        var dur=2+Math.random()*3;
        star.style.cssText=
            'width:'+size+'px;'+
            'height:'+size+'px;'+
            'left:'+Math.random()*100+'%;'+
            'top:'+Math.random()*100+'%;'+
            '--so:'+opacity+';'+
            'animation-delay:'+delay+'s;'+
            'animation-duration:'+dur+'s;'+
            'opacity:'+opacity+';';
        container.appendChild(star);
    }
}

// ═══ Spectrum ═══
function initSpectrum(){
    var chart=document.getElementById('iaSpecChart');
    if(!chart||chart.children.length)return;
    var colors=['#1A1A1F','#888888','#E5E5E5','transparent'];
    var borders=['none','none','none','0.5px solid rgba(26,26,31,0.08)'];
    for(var d=0;d<14;d++){
        var col=document.createElement('div');col.className='ia-spec-col';
        var rem=40+Math.random()*60;
        colors.forEach(function(c,i){
            var h2=i<3?Math.random()*rem*0.5:rem;rem-=h2;if(rem<0)rem=0;
            var seg=document.createElement('div');seg.className='ia-spec-seg';
            seg.style.height=Math.max(h2,2)+'%';
            seg.style.background=c;
            seg.style.border=borders[i];
            col.appendChild(seg);
        });
        chart.appendChild(col);
    }
}

// ═══ Quiz ═══
var quizData=[
    {q:'If you could take them anywhere right now?',opts:['Ocean — Listen to the waves.','Summit — Watch the sunrise.','Home — Couch and movies.','Streets — Aimless midnight walk.'],icons:['<path d="M2 20c2-4 4-8 8-8s4 4 8 4 4-4 4-4"/>','<path d="M4 20L12 4l8 16"/><path d="M7 14h10"/>','<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>','<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'],ai:2},
    {q:'When would they most likely reply?',opts:['Morning — Just woke up.','Midnight — Before sleep.','Afternoon — Procrastinating.','Mealtime — Multitasking.'],icons:['<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2"/>','<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>','<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4M8 3v4"/>','<path d="M18 8h1a4 4 0 0 1 0 8h-1M6 8H5a4 4 0 0 0 0 8h1"/><line x1="6" y1="12" x2="18" y2="12"/>'],ai:1},
    {q:'What would they do after a fight?',opts:['Silent treatment, then reach out.','Pretend nothing happened.','Say it directly.','Send a song.'],icons:['<path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"/><rect x="3" y="4" width="18" height="18" rx="2"/>','<circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 1 4 1 4-1 4-1"/>','<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>','<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/>'],ai:3}
];
var quizIdx=0,quizHist=[];

function initQuiz(){renderQuiz();}

function renderQuiz(){
    var q=quizData[quizIdx];
    document.getElementById('iaQLabel').textContent='Question '+(quizIdx+1<10?'0':'')+(quizIdx+1);
    document.getElementById('iaQText').textContent=q.q;
    var el=document.getElementById('iaQOpts');
    el.innerHTML='';el.style.display='flex';
    document.getElementById('iaQRes').classList.remove('show');
    document.getElementById('iaQRes').style.display='none';
    q.opts.forEach(function(opt,i){
        var d=document.createElement('div');d.className='ia-quiz-opt';
        d.innerHTML='<svg class="ia-quiz-opt-icon" viewBox="0 0 24 24">'+q.icons[i]+'</svg><div class="ia-quiz-opt-text">'+opt+'</div>';
        d.onclick=function(){pickQuiz(d,i);};
        el.appendChild(d);
    });
}

function pickQuiz(el,idx){
    var q=quizData[quizIdx];
    var opts=document.querySelectorAll('#iaQOpts .ia-quiz-opt');
    opts.forEach(function(o){o.style.pointerEvents='none';});
    el.classList.add('sel');
    setTimeout(function(){
        opts.forEach(function(o,i){
            if(i===q.ai&&i===idx)o.classList.add('ok');
            else if(i===idx)o.classList.add('no');
            else if(i===q.ai){o.classList.add('ok');o.style.opacity='0.5';}
        });
        var match=idx===q.ai;quizHist.push(match);
        var pct=quizHist.length>0?Math.round(quizHist.filter(function(h){return h;}).length/quizHist.length*100):0;
        setTimeout(function(){
            document.getElementById('iaQOpts').style.display='none';
            var res=document.getElementById('iaQRes');
            res.style.display='block';res.classList.add('show');
            res.innerHTML='<div class="ia-quiz-res-icon">'+(match
                ?'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>'
                :'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-dasharray="2 4"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>')+
                '</div><div class="ia-quiz-res-text">'+(match?'Perfect Alignment.':'Divergence Detected.')+'</div>'+
                '<div class="ia-quiz-next" id="iaQNext">Next Question →</div>';
            document.getElementById('iaQNext').onclick=function(){quizIdx=(quizIdx+1)%quizData.length;renderQuiz();};
            var syncEl=document.getElementById('iaSyncVal');
            if(syncEl)syncEl.textContent=pct+'%';
        },600);
    },500);
}

// ═══ Add Code ═══
function addCode(){
    var word=prompt('Secret code / inside joke:');
    if(!word||!word.trim())return;
    var meaning=prompt('Real meaning:');
    if(!meaning||!meaning.trim())return;
    var codes;try{codes=JSON.parse(localStorage.getItem('ia-codes-'+currentEntId)||'[]');}catch(e){codes=[];}
    codes.push({word:word.trim(),meaning:meaning.trim()});
    localStorage.setItem('ia-codes-'+currentEntId,JSON.stringify(codes));
    render(currentEntId);
    showToast('Code added.');
}

// ═══ Add Letter ═══
function addLetter(){
    var title=prompt('Letter title:');
    if(!title||!title.trim())return;
    var cond=prompt('Open condition (e.g. "Reach Day 100", "Unrestricted"):');
    var letters;try{letters=JSON.parse(localStorage.getItem('ia-letters-'+currentEntId)||'[]');}catch(e){letters=[];}
    letters.push({title:title.trim(),condition:(cond||'Sealed').trim()});
    localStorage.setItem('ia-letters-'+currentEntId,JSON.stringify(letters));
    render(currentEntId);
    showToast('Letter sealed.');
}

// ═══ Generate Milestones via API ═══
function generateMilestones(entId){
    var msgs=(getConversations()[entId])||[];
    if(msgs.length<4){showToast('Not enough messages.');return;}

    var btn=document.getElementById('iaMilestoneGen');
    if(btn){btn.style.opacity='0.3';btn.style.pointerEvents='none';}
    showToast('Analyzing...');

    // 获取 API 配置
    var apiConfig;try{apiConfig=JSON.parse(localStorage.getItem('ca-api-config')||'{}');}catch(e){showToast('No API config.');return;}
    var node=apiConfig.node||'primary';
    var cfg=apiConfig[node]||{};
    if(!cfg.key){showToast('No API key.');if(btn){btn.style.opacity='1';btn.style.pointerEvents='auto';}return;}
    var model=cfg.model||'gpt-4o';
    var ep=(cfg.endpoint||'https://api.openai.com/v1').replace(/\/+$/,'');
    if(ep.indexOf('/chat/completions')===-1){if(ep.match(/\/v\d+$/))ep+='/chat/completions';else ep+='/v1/chat/completions';}

    // 取最近 60 条对话
    var recent=msgs.slice(-60);
    var entities=getEntities();
    var ent=entities.find(function(e){return e.id===entId;});
    var charName=ent?(ent.nickname||ent.name):'AI';
    var userName='User';
    try{var masks=JSON.parse(localStorage.getItem('ca-user-masks')||'[]');var am=masks.find(function(m){return m.active;});if(am&&am.name)userName=am.name;}catch(e){}

    var transcript=recent.filter(function(m){return m.role==='user'||m.role==='assistant';}).map(function(m,i){
        var role=m.role==='user'?userName:charName;
        var time=m.time||'';
        var text=(m.text||'').replace(/\[SYS_TIME:[^\]]*\]/gi,'').replace(/\|\|\|\|/g,'\n').substring(0,200);
        return '['+(i+1)+']'+(time?' ['+time+']':'')+' '+role+': '+text;
    }).join('\n');

    var prompt='你是一个亲密关系分析师。阅读以下 '+userName+' 和 '+charName+' 的对话记录，提取最有意义的里程碑时刻。\n\n'+
        '【规则】\n'+
        '1. 提取 5-10 个里程碑事件。\n'+
        '2. 每个事件必须有精确日期和时间（从消息中的时间戳提取）。时间格式如 "2025-06-28 23:14"，则输出 month=6, day=28, time="23:14"。\n'+
        '3. 用中文描述每个事件，简短有诗意，10-20字，用引号包裹。例如：「第一次说"我也想你了"」\n'+
        '4. importance 分为 "high"（改变关系走向的）和 "mid"（有意义但较小的）。\n'+
        '5. tag 用中文情感类别，如：坦诚、默契、冲突、亲密、信任、幽默、成长、心动、和解。\n'+
        '6. 从最近到最早排序。\n\n'+
        '【输出格式】严格 JSON 数组，不要输出任何其他内容：\n'+
        '[{"month":6,"day":28,"time":"23:14","text":"「第一次互相坦白想念对方」","importance":"high","tag":"坦诚"},{"month":6,"day":15,"time":"02:30","text":"「凌晨两点半一起听歌到天亮」","importance":"mid","tag":"默契"}]\n\n'+
        '对话记录：\n'+transcript;

    fetch(ep,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.key},
        body:JSON.stringify({model:model,messages:[{role:'user',content:prompt}],max_tokens:800,temperature:0.3})
    })
    .then(function(r){return r.json();})
    .then(function(data){
        if(btn){btn.style.opacity='1';btn.style.pointerEvents='auto';}
        var text=data.choices&&data.choices[0]&&data.choices[0].message?data.choices[0].message.content:'';
        // 提取 JSON
        var jsonMatch=text.match(/\[[\s\S]*\]/);
        if(!jsonMatch){showToast('Failed to parse.');return;}
        try{
            var milestones=JSON.parse(jsonMatch[0]);
            localStorage.setItem('ia-milestones-'+entId,JSON.stringify(milestones));
            // 刷新显示
            var area=document.getElementById('iaMilestoneArea');
            if(area)area.innerHTML=buildMilestoneHTML(entId);
            showToast(milestones.length+' milestones found.');
        }catch(ex){
            showToast('Parse error.');
            console.error('[IA Milestone]',ex,text);
        }
    })
    .catch(function(err){
        if(btn){btn.style.opacity='1';btn.style.pointerEvents='auto';}
        showToast('Error: '+err.message);
    });
}

// ═══重新绑定删除事件（局部刷新后调用）═══
function bindDelEvents(container,type){
    function clearDelMode(){
        container.querySelectorAll('.del-mode').forEach(function(x){x.classList.remove('del-mode');});
    }
    if(type==='glossary'){
        container.querySelectorAll('.ia-gl-item.ia-deletable').forEach(function(item){
            item.addEventListener('click',function(e){
                if(e.target.closest('.ia-del-btn'))return;
                var was=item.classList.contains('del-mode');clearDelMode();
                if(!was)item.classList.add('del-mode');
            });
        });
        container.querySelectorAll('.ia-glossary .ia-del-btn').forEach(function(btn){
            btn.addEventListener('click',function(e){
                e.stopPropagation();
                var idx=parseInt(btn.dataset.idx);
                var codes;try{codes=JSON.parse(localStorage.getItem('ia-codes-'+currentEntId)||'[]');}catch(ex){codes=[];}
                codes.splice(idx,1);
                localStorage.setItem('ia-codes-'+currentEntId,JSON.stringify(codes));
                container.innerHTML=buildGlossaryHTML(codes);
                bindDelEvents(container,'glossary');
                showToast('已删除');
            });
        });
    }else if(type==='letters'){
        container.querySelectorAll('.ia-let-item.ia-deletable').forEach(function(item){
            item.addEventListener('click',function(e){
                if(e.target.closest('.ia-del-btn'))return;
                var was=item.classList.contains('del-mode');clearDelMode();
                if(!was)item.classList.add('del-mode');
            });
        });
        container.querySelectorAll('.ia-letters .ia-del-btn').forEach(function(btn){
            btn.addEventListener('click',function(e){
                e.stopPropagation();
                var idx=parseInt(btn.dataset.idx);
                var letters;try{letters=JSON.parse(localStorage.getItem('ia-letters-'+currentEntId)||'[]');}catch(ex){letters=[];}
                letters.splice(idx,1);
                localStorage.setItem('ia-letters-'+currentEntId,JSON.stringify(letters));
                container.innerHTML=buildLettersHTML(letters);
                bindDelEvents(container,'letters');
                showToast('已删除');
            });
        });
    }else if(type==='milestone'){
        container.querySelectorAll('.ia-tl-item').forEach(function(item){
            item.addEventListener('click',function(e){
                if(e.target.closest('.ia-tl-del-btn'))return;
                var was=item.classList.contains('del-mode');
                container.querySelectorAll('.del-mode').forEach(function(x){x.classList.remove('del-mode');});
                if(!was)item.classList.add('del-mode');
            });
        });
        container.querySelectorAll('.ia-tl-del-btn').forEach(function(btn){
            btn.addEventListener('click',function(e){
                e.stopPropagation();
                var idx=parseInt(btn.dataset.idx);
                var milestones;try{milestones=JSON.parse(localStorage.getItem('ia-milestones-'+currentEntId)||'[]');}catch(ex){milestones=[];}
                milestones.splice(idx,1);
                localStorage.setItem('ia-milestones-'+currentEntId,JSON.stringify(milestones));
                container.innerHTML=buildMilestoneHTML(currentEntId);
                bindDelEvents(container,'milestone');
                showToast('已删除');
            });
        });
    }
}

// ═══ Save Tasks ═══
function saveTasks(){
    var items=document.querySelectorAll('.ia-pr-item');
    var done=[];
    items.forEach(function(item){
        if(item.classList.contains('done'))done.push(parseInt(item.dataset.idx));
    });
    localStorage.setItem('ia-tasks-done-'+currentEntId+'-'+todayKey(),JSON.stringify(done));
}

// ═══ Utils ═══
function escapeHtml(str){var d=document.createElement('div');d.textContent=str||'';return d.innerHTML;}
function animNum(id,f,t,dur){var el=document.getElementById(id);if(!el)return;var s=null;function step(ts){if(!s)s=ts;var p=Math.min((ts-s)/dur,1);el.textContent=Math.round(f+(t-f)*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
function todayKey(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

function closeApp(){
    var el=document.getElementById('iaApp');
    if(el){el.classList.remove('active');setTimeout(function(){el.classList.add('hidden');},350);}
}

function showToast(msg){
    var old=document.getElementById('iaToast');
    if(old)old.remove();
    var t=document.createElement('div');
    t.id='iaToast';t.className='ia-toast';
    t.textContent=msg;document.body.appendChild(t);
    requestAnimationFrame(function(){t.classList.add('show');});
    setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},400);},2000);
}
// toast 全局
window.toast=showToast;

// ═══ Entity Picker ═══
function renderEntityPicker(){
    var el=document.getElementById('iaApp');
    if(!el)return;
    var entities=getEntities();
    var h='<div class="ia-noise"></div><div class="ia-header"><div class="ia-header-back" id="iaBack"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div><div class="ia-header-meta">Vol. 01 · Archive</div><div class="ia-header-title">Intimacy</div></div>';
    h+='<div style="padding:40px 24px;"><div style="font-family:\'Playfair Display\',serif;font-size:28px;font-style:italic;color:#1A1A1F;margin-bottom:8px;">Select Entity</div>';
    h+='<div style="font-size:10px;color:#8E8E93;margin-bottom:32px;letter-spacing:0.05em;">Choose a bond to view its archive.</div>';
    if(entities.length===0){
        h+='<div class="ia-empty">No entities yet. Create one in Chat first.</div>';
    }else{
        entities.forEach(function(ent){
            var name=ent.nickname||ent.name||'Entity';
            var initial=name.charAt(0).toUpperCase();
            var color=ent.color||'#1A1A1F';
            var stats=calcStats(ent.id);
            var avInner=ent.avatar
                ?'<img src="'+ent.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
                :'<span style="font-family:\'Playfair Display\',serif;font-size:16px;font-style:italic;color:#fff;">'+initial+'</span>';
            h+='<div class="ia-ent-pick" data-eid="'+ent.id+'" style="display:flex;align-items:center;gap:16px;padding:20px 24px;background:#fff;border-radius:24px;border:0.5px solid rgba(26,26,31,0.08);margin-bottom:12px;cursor:pointer;">'+
                '<div style="width:48px;height:48px;border-radius:50%;background:'+color+';display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">'+avInner+'</div>'+
                '<div style="flex:1;"><div style="font-family:\'Playfair Display\',serif;font-size:16px;color:#1A1A1F;">'+escapeHtml(name)+'</div><div style="font-size:9px;color:#8E8E93;margin-top:2px;letter-spacing:0.1em;text-transform:uppercase;">'+stats.total+' messages · Day '+stats.totalDays+'</div></div>'+
                '<div style="font-family:\'Playfair Display\',serif;font-size:18px;font-style:italic;color:rgba(26,26,31,0.15);">'+stats.warmth+'°</div>'+
            '</div>';
        });
    }
    h+='</div>';
    el.innerHTML=h;
    document.getElementById('iaBack').onclick=closeApp;
    el.querySelectorAll('.ia-ent-pick').forEach(function(item){
        item.onclick=function(){var eid=item.dataset.eid;if(eid)render(eid);};
    });
}

// ═══ CSS ═══
function cssText(){
    return ''+
    '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap");'+

    '.ia-app{position:fixed;inset:0;max-width:430px;margin:0 auto;z-index:600;background:#F8F8FA;transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}'+
    '.ia-app.active{transform:translateX(0);}'+
    '.ia-app.hidden{display:none;}'+

    '.ia-noise{position:fixed;inset:0;z-index:9999;pointer-events:none;background:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.03\'/%3E%3C/svg%3E");}'+

    '.ia-header{padding:48px 16px 12px;display:flex;align-items:center;gap:10px;}'+
    '.ia-header-back{cursor:pointer;width:36px;height:36px;border-radius:50%;background:#fff;border:0.5px solid rgba(26,26,31,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.04);}'+
    '.ia-header-back svg{width:16px;height:16px;stroke:#1A1A1F;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}'+
    '.ia-header-pill{flex:1;display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#fff;border-radius:50px;border:0.5px solid rgba(26,26,31,0.08);box-shadow:0 2px 8px rgba(0,0,0,0.04);}'+
    '.ia-header-meta{font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#8E8E93;}'+
    '.ia-header-title{font-family:"Playfair Display",serif;font-size:15px;font-style:italic;color:#1A1A1F;}'+

    // Hero with avatar blurred background
    '.ia-hero{position:relative;display:flex;flex-direction:column;align-items:center;min-height:280px;border-radius:0 0 40px 40px;}'+
    '.ia-hero-clip{position:absolute;inset:0;border-radius:0 0 40px 40px;overflow:hidden;z-index:0;}'+
    '.ia-hero-bg{position:absolute;inset:-20px;background-size:cover;background-position:left center;image-rendering:auto;}'+
    '.ia-hero-blur{position:absolute;inset:0;z-index:1;background:linear-gradient(to right,transparent 0%,rgba(248,248,250,0.1) 30%,rgba(248,248,250,0.4) 55%,rgba(248,248,250,0.75) 75%,#F8F8FA 100%);}'+
    '.ia-hero-dark{position:absolute;inset:0;z-index:2;background:linear-gradient(135deg,rgba(0,0,0,0.25) 0%,rgba(0,0,0,0.1) 25%,transparent 50%);pointer-events:none;}'+
    '.ia-hero-content{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding:40px 24px 48px;}'+

    '.ia-venn{display:flex;align-items:center;justify-content:center;position:relative;margin-bottom:28px;}'+
    '.ia-venn-circle{width:130px;height:130px;border-radius:50%;border:0.5px solid rgba(26,26,31,0.08);background:rgba(248,248,250,0.7);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}'+
    '.ia-venn-circle.left{z-index:2;}'+
    '.ia-venn-circle.right{margin-left:-40px;z-index:1;}'+
    '.ia-venn-icon{width:54px;height:54px;stroke:#1A1A1F;fill:none;stroke-width:0.5;opacity:0.5;}'+
    '.ia-venn-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;width:36px;height:36px;border-radius:50%;background:#1A1A1F;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(248,248,250,0.8);}'+
    '.ia-venn-core svg{width:14px;height:14px;stroke:#fff;fill:none;stroke-width:1.5;stroke-linecap:round;}'+

    // 星星层
    '.ia-hero-stars{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;}'+
    '.ia-star{position:absolute;border-radius:50%;background:#fff;animation:iaStar 3s ease-in-out infinite;}'+
    '@keyframes iaStar{0%,100%{opacity:var(--so);transform:scale(1);}50%{opacity:calc(var(--so)*0.3);transform:scale(0.6);}}'+

    // 名字白色描边
    '.ia-hero-names{font-family:"Playfair Display",serif;font-size:32px;font-style:italic;color:#1A1A1F;letter-spacing:0.02em;margin-bottom:12px;'+
        'text-shadow:'+'0 0 8px rgba(255,255,255,1),'+
            '0 0 16px rgba(255,255,255,0.95),'+
            '0 0 30px rgba(255,255,255,0.85),'+
            '0 0 50px rgba(255,255,255,0.6),'+
            '0 0 80px rgba(255,255,255,0.35),'+
            '0 0 120px rgba(255,255,255,0.15);'+
        'filter:drop-shadow(0 0 6px rgba(255,255,255,0.9)) drop-shadow(0 0 20px rgba(255,255,255,0.5));}'+

    // 左侧头像白色渐变发光边框
    '.ia-venn-glow-border{position:absolute;inset:-3px;border-radius:50%;z-index:3;pointer-events:none;'+
        'background:transparent;'+
        'border:2.5px solid transparent;'+
        'background-clip:padding-box;'+
        'box-shadow:0 0 0 2px rgba(255,255,255,0.9),0 0 12px 4px rgba(255,255,255,0.5),0 0 28px 8px rgba(255,255,255,0.2);}'+
    '.ia-hero-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:50px;background:rgba(255,255,255,0.7);border:0.5px solid rgba(26,26,31,0.08);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}'+
    '.ia-hero-badge-dot{width:6px;height:6px;border-radius:50%;background:#1A1A1F;animation:iaBr 2s ease-in-out infinite alternate;}'+
    '@keyframes iaBr{0%{opacity:0.3;transform:scale(0.8);}100%{opacity:1;transform:scale(1.2);}}'+
    '.ia-hero-badge span{font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#8E8E93;}'+

    // Data strip
    '.ia-data-strip{display:flex;gap:12px;padding:24px;margin-top:-20px;position:relative;z-index:5;}'+
    '.ia-data-pill{flex:1;background:#fff;border-radius:24px;padding:20px 0;display:flex;flex-direction:column;align-items:center;box-shadow:0 4px 20px rgba(0,0,0,0.02);border:0.5px solid rgba(26,26,31,0.08);}'+
    '.ia-data-val{font-family:"Playfair Display",serif;font-size:24px;font-style:italic;color:#1A1A1F;line-height:1;margin-bottom:6px;}'+
    '.ia-data-label{font-size:8px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#8E8E93;}'+

    // Thermo
    '.ia-thermo-wrap{padding:0 32px 40px;}'+
    '.ia-thermo-header{display:flex;justify-content:space-between;margin-bottom:12px;font-size:9px;font-weight:600;letter-spacing:0.1em;color:#8E8E93;text-transform:uppercase;}'+
    '.ia-thermo-val{color:#1A1A1F;font-size:14px;font-family:"Playfair Display",serif;font-style:italic;text-transform:none;letter-spacing:0;}'+
    '.ia-thermo-track{height:2px;background:rgba(26,26,31,0.08);position:relative;border-radius:2px;}'+
    '.ia-thermo-fill{position:absolute;left:0;top:0;height:100%;background:#1A1A1F;border-radius:2px;transition:width 1.2s cubic-bezier(0.16,1,0.3,1);}'+
    '.ia-thermo-dot{position:absolute;right:-4px;top:50%;transform:translateY(-50%);width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid #1A1A1F;}'+

    // Section
    '.ia-section{padding:0 24px 0;margin-bottom:0;}'+
    '.ia-section .ia-sec-body{max-height:0;overflow:hidden;transition:max-height 0.5s cubic-bezier(0.16,1,0.3,1);opacity:0;transition:max-height 0.5s cubic-bezier(0.16,1,0.3,1),opacity 0.3s ease 0.1s;}'+
    '.ia-section.open .ia-sec-body{max-height:3000px;opacity:1;}'+
    '.ia-section.open{padding-bottom:32px;}'+
    '.ia-sec-header{display:flex;align-items:center;gap:12px;padding:12px 16px;margin:6px 0;cursor:pointer;-webkit-tap-highlight-color:transparent;background:#fff;border-radius:50px;border:0.5px solid rgba(26,26,31,0.06);transition:all 0.25s;}'+
    '.ia-section.open .ia-sec-header{background:rgba(26,26,31,0.03);border-color:rgba(26,26,31,0.1);margin-bottom:16px;}'+
    '.ia-sec-header:active{transform:scale(0.98);}'+
    '.ia-sec-chevron{margin-left:auto;width:20px;height:20px;border-radius:50%;background:rgba(26,26,31,0.04);display:flex;align-items:center;justify-content:center;transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1),background 0.25s;}'+
    '.ia-sec-chevron svg{width:10px;height:10px;stroke:#8E8E93;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}'+
    '.ia-section.open .ia-sec-chevron{transform:rotate(180deg);background:rgba(26,26,31,0.08);}'+
    '.ia-sec-badge{padding:3px 10px;border-radius:50px;background:#1A1A1F;color:#fff;font-family:"Playfair Display",serif;font-size:10px;font-style:italic;flex-shrink:0;}'+
    '.ia-sec-title{font-family:"Playfair Display",serif;font-size:15px;color:#1A1A1F;flex:1;}'+
    '.ia-sec-action{width:24px;height:24px;border:0.5px solid rgba(26,26,31,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;background:transparent;flex-shrink:0;transition:background 0.15s;}'+
    '.ia-sec-action:active{background:rgba(26,26,31,0.06);}'+
    '.ia-sec-action svg{width:10px;height:10px;stroke:#8E8E93;fill:none;stroke-width:1.5;stroke-linecap:round;}'+

    // Timeline
    '.ia-timeline{padding-left:0;}'+
    '.ia-tl-item{display:flex;gap:20px;margin-bottom:24px;position:relative;}'+
    '.ia-tl-item:last-child{margin-bottom:0;}'+
    '.ia-tl-item:last-child .ia-tl-line{display:none;}'+
    '.ia-tl-line{position:absolute;left:39.5px;top:24px;bottom:-24px;width:0.5px;background:rgba(26,26,31,0.08);}'+
    '.ia-tl-date{width:35px;font-size:9px;font-weight:600;color:#8E8E93;letter-spacing:0.1em;text-align:right;line-height:1.4;}'+
    '.ia-tl-dot{width:10px;height:10px;border:1px solid #1A1A1F;border-radius:50%;background:#F8F8FA;position:relative;z-index:2;margin-top:2px;flex-shrink:0;}'+
    '.ia-tl-dot.filled{background:#1A1A1F;}'+
    '.ia-tl-content{flex:1;padding-bottom:8px;}'+
    '.ia-tl-text{font-family:"Playfair Display",serif;font-size:16px;color:#1A1A1F;margin-bottom:6px;font-style:italic;}'+
    '.ia-tl-meta{font-size:9px;font-weight:500;color:#8E8E93;letter-spacing:0.05em;text-transform:uppercase;}'+

    // Spectrum
    '.ia-spectrum{padding:0;}'+
    '.ia-spec-chart{display:flex;align-items:flex-end;gap:4px;height:100px;margin-bottom:24px;border-bottom:0.5px solid rgba(26,26,31,0.08);padding-bottom:1px;}'+
    '.ia-spec-col{flex:1;display:flex;flex-direction:column-reverse;gap:2px;height:100%;}'+
    '.ia-spec-seg{width:100%;min-height:2px;border-radius:2px;}'+
    '.ia-spec-legend{display:flex;justify-content:center;gap:16px;}'+
    '.ia-spec-leg{display:flex;align-items:center;gap:6px;font-size:9px;font-weight:500;color:#8E8E93;letter-spacing:0.1em;text-transform:uppercase;}'+
    '.ia-spec-dot{width:8px;height:8px;border-radius:50%;}'+

    // Quiz
    '.ia-quiz-card{background:#1A1A1F;color:#fff;border-radius:32px;padding:32px 24px;position:relative;overflow:hidden;}'+
    '.ia-quiz-deco{position:absolute;right:-10px;top:-10px;font-family:"Playfair Display",serif;font-size:120px;font-style:italic;color:rgba(255,255,255,0.03);line-height:1;pointer-events:none;}'+
    '.ia-quiz-q{font-size:9px;font-weight:600;letter-spacing:0.2em;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:12px;position:relative;z-index:1;}'+
    '.ia-quiz-text{font-family:"Playfair Display",serif;font-size:20px;font-style:italic;margin-bottom:24px;position:relative;z-index:1;}'+
    '.ia-quiz-opts{display:flex;flex-direction:column;gap:10px;position:relative;z-index:1;}'+
    '.ia-quiz-opt{padding:16px 20px;border-radius:16px;background:rgba(255,255,255,0.05);border:0.5px solid rgba(255,255,255,0.1);display:flex;align-items:center;gap:16px;cursor:pointer;transition:all 0.3s;}'+
    '.ia-quiz-opt:active{transform:scale(0.98);}'+
    '.ia-quiz-opt.sel{background:rgba(255,255,255,0.95);color:#1A1A1F;}'+
    '.ia-quiz-opt.sel .ia-quiz-opt-icon{stroke:#1A1A1F;}'+
    '.ia-quiz-opt.ok{border-color:rgba(255,255,255,0.3);}'+
    '.ia-quiz-opt.no{opacity:0.3;text-decoration:line-through;}'+
    '.ia-quiz-opt-icon{width:16px;height:16px;stroke:rgba(255,255,255,0.5);fill:none;stroke-width:1.5;flex-shrink:0;}'+
    '.ia-quiz-opt-text{font-size:13px;font-weight:500;}'+
    '.ia-quiz-res{text-align:center;margin-top:32px;display:none;position:relative;z-index:1;}'+
    '.ia-quiz-res.show{display:block;animation:iaFI 0.5s ease;}'+
    '.ia-quiz-res-icon svg{width:40px;height:40px;stroke:#fff;fill:none;stroke-width:1;margin-bottom:12px;}'+
    '.ia-quiz-res-text{font-family:"Playfair Display",serif;font-size:16px;font-style:italic;}'+
    '.ia-quiz-next{margin-top:20px;padding:10px 20px;border-radius:50px;background:rgba(255,255,255,0.06);border:0.5px solid rgba(255,255,255,0.1);font-size:10px;font-weight:600;letter-spacing:0.1em;color:rgba(255,255,255,0.5);cursor:pointer;display:inline-block;}'+

    // Glossary
    '.ia-glossary{display:flex;flex-direction:column;gap:10px;}'+
    '.ia-gl-item{display:flex;align-items:center;gap:16px;padding:16px;background:#fff;border-radius:20px;border:0.5px solid rgba(26,26,31,0.08);}'+
    '.ia-gl-icon{width:40px;height:40px;border-radius:50%;background:#F8F8FA;display:flex;align-items:center;justify-content:center;flex-shrink:0;}'+
    '.ia-gl-icon svg{width:18px;height:18px;stroke:#1A1A1F;fill:none;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;}'+
    '.ia-gl-content{flex:1;}'+
    '.ia-gl-word{font-family:"Playfair Display",serif;font-size:16px;color:#1A1A1F;font-style:italic;margin-bottom:2px;}'+
    '.ia-gl-mean{font-size:10px;color:#8E8E93;}'+

    // Letters
    '.ia-letters{display:flex;flex-direction:column;gap:12px;}'+
    '.ia-let-item{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;background:#fff;border-radius:24px;border:0.5px solid rgba(26,26,31,0.08);cursor:pointer;}'+
    '.ia-let-info{display:flex;flex-direction:column;gap:6px;}'+
    '.ia-let-title{font-family:"Playfair Display",serif;font-size:16px;color:#1A1A1F;}'+
    '.ia-let-cond{font-size:9px;color:#8E8E93;font-weight:500;display:flex;align-items:center;gap:4px;}'+
    '.ia-let-cond svg{width:10px;height:10px;stroke:#8E8E93;fill:none;stroke-width:1.5;stroke-linecap:round;}'+
    '.ia-let-status{font-size:8px;font-weight:600;letter-spacing:0.1em;padding:6px 12px;border-radius:50px;text-transform:uppercase;}'+
    '.ia-let-status.sealed{background:#F8F8FA;color:#8E8E93;}'+
    '.ia-let-status.open{background:#1A1A1F;color:#fff;}'+

    // Protocol
    '.ia-protocol{display:flex;flex-direction:column;gap:10px;}'+
    '.ia-pr-item{display:flex;align-items:center;gap:16px;padding:16px 24px;background:#fff;border-radius:20px;border:0.5px solid rgba(26,26,31,0.08);cursor:pointer;transition:opacity 0.3s;}'+
    '.ia-pr-box{width:20px;height:20px;border-radius:50%;border:1px solid #8E8E93;display:flex;align-items:center;justify-content:center;transition:all 0.3s;flex-shrink:0;}'+
    '.ia-pr-item.done .ia-pr-box{background:#1A1A1F;border-color:#1A1A1F;}'+
    '.ia-pr-box svg{width:10px;height:10px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:0;transition:opacity 0.2s;}'+
    '.ia-pr-item.done .ia-pr-box svg{opacity:1;}'+
    '.ia-pr-text{font-size:13px;font-weight:500;color:#1A1A1F;transition:color 0.3s;}'+
    '.ia-pr-item.done .ia-pr-text{color:#8E8E93;text-decoration:line-through;}'+

    // Summary
    '.ia-summary-wrap{padding:0 24px 60px;}'+
    '.ia-summary{padding:40px 24px;background:#fff;border-radius:32px;border:0.5px solid rgba(26,26,31,0.08);box-shadow:0 10px 40px rgba(0,0,0,0.02);text-align:center;}'+
    '.ia-sum-title{font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#8E8E93;margin-bottom:16px;}'+
    '.ia-sum-names{font-family:"Playfair Display",serif;font-size:36px;font-style:italic;color:#1A1A1F;margin-bottom:8px;}'+
    '.ia-sum-status{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:50px;background:#F8F8FA;font-size:9px;font-weight:600;letter-spacing:0.1em;color:#1A1A1F;margin-bottom:32px;}'+
    '.ia-sum-status svg{width:10px;height:10px;stroke:#1A1A1F;fill:none;stroke-width:2;stroke-linecap:round;}'+
    '.ia-sum-grid{display:grid;grid-template-columns:1fr 1px 1fr;gap:0;border-top:0.5px solid rgba(26,26,31,0.08);padding-top:24px;}'+
    '.ia-sum-div{background:rgba(26,26,31,0.08);}'+
    '.ia-sum-block{display:flex;flex-direction:column;align-items:center;gap:4px;}'+
    '.ia-sum-val{font-family:"Playfair Display",serif;font-size:24px;color:#1A1A1F;}'+
    '.ia-sum-lbl{font-size:8px;font-weight:600;letter-spacing:0.1em;color:#8E8E93;text-transform:uppercase;}'+

    '.ia-footer{padding:0 0 40px;text-align:center;font-size:8px;font-weight:600;letter-spacing:0.3em;color:#8E8E93;text-transform:uppercase;}'+

    '.ia-empty{text-align:center;padding:40px 0;font-size:12px;color:#8E8E93;line-height:2;}'+

    // 删除态
    '.ia-del-btn{width:28px;height:28px;border-radius:50%;background:rgba(220,53,69,0.08);border:0.5px solid rgba(220,53,69,0.2);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;opacity:0;transform:scale(0.7);transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;}'+
    '.ia-del-btn svg{width:11px;height:11px;stroke:#DC3545;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}'+
    '.ia-deletable.del-mode .ia-del-btn{opacity:1;transform:scale(1);pointer-events:auto;}'+
    '.ia-deletable.del-mode{border-color:rgba(220,53,69,0.15)!important;background:rgba(220,53,69,0.02)!important;}'+
    '.ia-deletable{transition:border-color 0.2s,background 0.2s;}'+
    '.ia-tl-item.del-mode .ia-tl-card{border-color:rgba(220,53,69,0.15);background:rgba(220,53,69,0.02);}'+
    '.ia-tl-del-btn{width:28px;height:28px;border-radius:50%;background:rgba(220,53,69,0.08);border:0.5px solid rgba(220,53,69,0.2);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;opacity:0;transform:scale(0.7);transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;margin-top:2px;}'+
    '.ia-tl-del-btn svg{width:11px;height:11px;stroke:#DC3545;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}'+
    '.ia-tl-item.del-mode .ia-tl-del-btn{opacity:1;transform:scale(1);pointer-events:auto;}'+

    '.ia-toast{position:fixed;bottom:40px;left:50%;transform:translateX(-50%) translateY(10px);background:#1A1A1F;color:#fff;padding:14px 28px;border-radius:50px;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;opacity:0;transition:all 0.4s ease;pointer-events:none;z-index:10000;box-shadow:0 10px 30px rgba(0,0,0,0.15);}'+
    '.ia-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}'+

    '@keyframes iaFI{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}';
}

// ═══ 公开 API ═══
window.openIntimacyArchive=function(entId){
    if(!entId){
        entId=window._cdaCurrentEntId;
        if(!entId){
            var ents=getEntities();
            if(ents.length===1)entId=ents[0].id;
        }
    }
    build();
    var el=document.getElementById('iaApp');
    if(!el)return;
    el.classList.remove('hidden');

    if(entId){
        render(entId);
        requestAnimationFrame(function(){el.classList.add('active');});
        return;
    }

    if(typeof ChatDB!=='undefined'&&ChatDB.loadEntities){
        ChatDB.loadEntities(function(dbEnts){
            if(dbEnts&&dbEnts.length>0){
                window._caEntities=dbEnts;
                if(ChatDB.loadAllConversations){
                    ChatDB.loadAllConversations(function(allConvs){
                        if(allConvs){
                            if(!window._caConversations)window._caConversations={};
                            var keys=Object.keys(allConvs);
                            for(var i=0;i<keys.length;i++){
                                if(!window._caConversations[keys[i]])window._caConversations[keys[i]]=allConvs[keys[i]];
                            }
                        }
                        if(dbEnts.length===1)render(dbEnts[0].id);
                        else renderEntityPicker();
                        requestAnimationFrame(function(){el.classList.add('active');});
                    });
                }else{
                    if(dbEnts.length===1)render(dbEnts[0].id);
                    else renderEntityPicker();
                    requestAnimationFrame(function(){el.classList.add('active');});
                }
            }else{
                renderEntityPicker();
                requestAnimationFrame(function(){el.classList.add('active');});
            }
        });
    }else{
        renderEntityPicker();
        requestAnimationFrame(function(){el.classList.add('active');});
    }
};

})();
