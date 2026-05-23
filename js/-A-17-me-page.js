// js/-A-17-me-page.js · "我的"页面（独立页面，接通数据）
(function(){
'use strict';

var built=false;
var styleInjected=false;

function getEntities(){return window._caEntities||[];}
function getConversations(){return window._caConversations||{};}
function getInitial(name){return(name||'?').trim().charAt(0).toUpperCase();}
function escapeHtml(str){var d=document.createElement('div');d.textContent=str;return d.innerHTML;}

function getMasks(){
    try{return JSON.parse(localStorage.getItem('ca-user-masks')||'[{"id":"m1","name":"The Architect","bio":"Logical, precise, structural thinker.","active":true}]');}catch(e){return[{id:'m1',name:'The Architect',bio:'',active:true}];}
}
function saveMasks(masks){
    // 头像单独存 IndexedDB，localStorage 只存文字数据
    var slim=masks.map(function(m){
        var s={id:m.id,name:m.name,bio:m.bio,active:m.active,boundEntities:m.boundEntities||[]};
        if(m.avatar&&typeof ChatDB!=='undefined'){
            ChatDB.open(function(d){
                if(!d)return;
                var tx=d.transaction('avatars','readwrite');
                tx.objectStore('avatars').put({id:'mask_'+m.id,data:m.avatar});
            });
        }
        return s;
    });
    localStorage.setItem('ca-user-masks',JSON.stringify(slim));
}
function loadMaskAvatars(masks,cb){
    if(typeof ChatDB==='undefined'){cb(masks);return;}
    var remaining=masks.length;
    if(!remaining){cb(masks);return;}
    masks.forEach(function(m){
        ChatDB.open(function(d){
            if(!d){remaining--;if(!remaining)cb(masks);return;}
            var tx=d.transaction('avatars','readonly');
            var req=tx.objectStore('avatars').get('mask_'+m.id);
            req.onsuccess=function(){
                if(req.result&&req.result.data)m.avatar=req.result.data;
                remaining--;if(!remaining)cb(masks);
            };
            req.onerror=function(){remaining--;if(!remaining)cb(masks);};
        });
    });
}

function injectStyle(){
    if(styleInjected)return;
    styleInjected=true;
    var css=`
@font-face{font-family:"TheatreDeco";src:url("https://file.icve.com.cn/file_doc/SyNI8mvo/uZqcTvbY.ttf") format("truetype");font-display:swap;}

.me-window{position:fixed;inset:0;z-index:870;background:#fff;max-width:430px;margin:0 auto;overflow-x:hidden;overflow-y:auto;display:flex;flex-direction:column;opacity:0;visibility:hidden;pointer-events:none;transition:none;}
.me-window.active{visibility:visible;pointer-events:auto;animation:me-reveal 0.4s cubic-bezier(0.16,1,0.3,1) forwards;}
.me-window.closing{pointer-events:none;animation:me-hide 0.3s cubic-bezier(0.4,0,0.2,1) forwards;}
@keyframes me-reveal{0%{opacity:0;transform:translateX(30%);}100%{opacity:1;transform:translateX(0);}}
@keyframes me-hide{0%{opacity:1;transform:translateX(0);}100%{opacity:0;transform:translateX(30%);visibility:hidden;}}

.me-window .me-hero{position:relative;height:300px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:55px;overflow:hidden;flex-shrink:0;}
.me-window .me-hero-gradient{position:absolute;inset:0;background:radial-gradient(ellipse at 30% 80%,rgba(255,255,255,0.95) 0%,rgba(180,180,188,0.4) 20%,rgba(80,80,88,0.5) 45%,rgba(42,42,48,0.75) 65%,#1a1a1f 100%);z-index:0;}
.me-window .me-hero-noise{position:absolute;inset:0;opacity:0.025;z-index:1;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
.me-window .me-hero-ring{position:absolute;border-radius:50%;z-index:1;pointer-events:none;}
.me-window .me-hero-ring.r1{width:200px;height:200px;top:-40px;left:-30px;border:0.5px solid rgba(255,255,255,0.05);animation:me-spin 40s linear infinite;}
.me-window .me-hero-ring.r2{width:140px;height:140px;top:40px;right:-20px;border:0.5px dashed rgba(255,255,255,0.04);animation:me-spin 28s linear infinite reverse;}
.me-window .me-hero-ring.r3{width:80px;height:80px;bottom:60px;left:40px;border:0.5px dotted rgba(255,255,255,0.03);animation:me-spin 18s linear infinite;}
@keyframes me-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
.me-window .me-hero-line{position:absolute;height:0.5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);z-index:1;pointer-events:none;}
.me-window .me-hero-line.l1{width:45%;top:30px;right:20%;}
.me-window .me-hero-line.l2{width:35%;top:65px;left:15%;}
.me-window .me-hero-dots{position:absolute;inset:0;z-index:1;pointer-events:none;}
.me-window .me-hero-dots .dot{position:absolute;border-radius:50%;background:#fff;}
.me-window .me-hero-dots .dot.a{width:3px;height:3px;opacity:0.18;top:25px;left:60px;animation:me-twinkle 3s ease-in-out infinite;}
.me-window .me-hero-dots .dot.b{width:2px;height:2px;opacity:0.1;top:50px;left:120px;animation:me-twinkle 3.5s ease-in-out infinite 0.8s;}
.me-window .me-hero-dots .dot.c{width:4px;height:4px;opacity:0.06;top:70px;right:50px;animation:me-twinkle 4s ease-in-out infinite 0.4s;}
.me-window .me-hero-dots .dot.d{width:2px;height:2px;opacity:0.12;top:40px;right:90px;animation:me-twinkle 2.8s ease-in-out infinite 1.2s;}
@keyframes me-twinkle{0%,100%{transform:scale(1);opacity:var(--o,0.1);}50%{transform:scale(1.6);opacity:0.3;}}

.me-window .me-hero-avatar-print{position:absolute;top:-60px;right:-90px;width:340px;height:340px;border-radius:50%;background-size:cover;background-position:center;z-index:1;opacity:0.4;-webkit-mask-image:radial-gradient(circle at 78% 28%,rgba(0,0,0,0.95) 5%,rgba(0,0,0,0.7) 18%,rgba(0,0,0,0.4) 35%,rgba(0,0,0,0.18) 50%,rgba(0,0,0,0.06) 68%,transparent 90%);mask-image:radial-gradient(circle at 78% 28%,rgba(0,0,0,0.95) 5%,rgba(0,0,0,0.7) 18%,rgba(0,0,0,0.4) 35%,rgba(0,0,0,0.18) 50%,rgba(0,0,0,0.06) 68%,transparent 90%);pointer-events:none;filter:blur(1.2px) saturate(0.7);}

.me-window .me-topbar{position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:50px 20px 16px;}
.me-window .me-topbar-title{font-size:10px;font-weight:800;letter-spacing:2.5px;color:rgba(255,255,255,0.3);text-transform:uppercase;}
.me-window .me-topbar-btn{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;border:0.5px solid rgba(255,255,255,0.1);}
.me-window .me-topbar-btn:active{transform:scale(0.9);background:rgba(255,255,255,0.15);}
.me-window .me-topbar-btn svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}

.me-window .me-id-card{position:relative;z-index:10;width:200px;transform:translateY(-40px) rotate(-2deg);}
.me-window .me-id-card::before{content:"Identity";position:absolute;left:0;bottom:calc(100% - 8px);font-family:"TheatreDeco",serif;font-size:14px;font-weight:400;background:linear-gradient(90deg,rgba(255,255,255,0.95) 0%,rgba(255,255,255,0.5) 60%,rgba(255,255,255,0.08) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:3px;white-space:nowrap;pointer-events:none;z-index:1;transform:skewX(-12deg);transform-origin:left center;}
.me-window .me-id-card-inner{background:rgba(255,255,255,0.06);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:0.5px solid rgba(255,255,255,0.12);border-radius:14px;padding:14px;display:flex;gap:12px;align-items:center;position:relative;}
.me-window .me-id-card-inner::after{content:"";position:absolute;top:0;right:0;width:50%;height:50%;border-top:0.5px solid rgba(0,0,0,0.5);border-right:0.5px solid rgba(0,0,0,0.5);border-radius:0 14px 0 0;pointer-events:none;}
.me-window .me-id-card-inner::before{content:"";position:absolute;left:0;bottom:0;width:50%;height:calc(100% - 10px);border-left:1.5px solid rgba(255,255,255,0.6);border-bottom:1.5px solid rgba(255,255,255,0.6);border-radius:0 0 0 14px;pointer-events:none;}
.me-window .me-id-avatar{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#3a3a42,#5a5a62);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;overflow:hidden;border:1.5px solid rgba(255,255,255,0.15);flex-shrink:0;}
.me-window .me-id-avatar img{width:100%;height:100%;object-fit:cover;}
.me-window .me-id-info{flex:1;min-width:0;}
.me-window .me-id-name{font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.me-window .me-id-handle{font-size:9px;color:rgba(255,255,255,0.35);margin-top:2px;font-weight:500;}
.me-window .me-id-stamp{position:absolute;top:-6px;right:-6px;width:28px;height:28px;border-radius:50%;background:#1a1a1f;border:2px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;}
.me-window .me-id-stamp svg{width:12px;height:12px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.me-window .me-id-barcode{position:absolute;bottom:6px;right:12px;display:flex;gap:1px;opacity:0.15;}
.me-window .me-id-barcode span{width:1.5px;height:10px;background:#fff;border-radius:0.5px;}
.me-window .me-id-barcode span:nth-child(2n){height:7px;}
.me-window .me-id-barcode span:nth-child(3n){width:2px;}

.me-window .me-card{position:relative;z-index:10;flex:1;background:#fff;border-radius:30px 30px 0 0;margin-top:-20px;padding:28px 20px 30px;box-shadow:0 -4px 30px rgba(0,0,0,0.04);display:flex;flex-direction:column;}
.me-window .me-card-handle{width:36px;height:4px;border-radius:2px;background:rgba(26,26,31,0.07);margin:0 auto 24px;}
.me-window .me-card-corner{position:absolute;pointer-events:none;z-index:0;}
.me-window .me-card-corner.tl{top:18px;left:14px;width:16px;height:16px;border-left:0.5px solid rgba(26,26,31,0.04);border-top:0.5px solid rgba(26,26,31,0.04);}
.me-window .me-card-corner.br{bottom:40px;right:14px;width:16px;height:16px;border-right:0.5px solid rgba(26,26,31,0.04);border-bottom:0.5px solid rgba(26,26,31,0.04);}

.me-window .me-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:28px;}
.me-window .me-stat{background:rgba(26,26,31,0.02);border:0.5px solid rgba(26,26,31,0.04);border-radius:16px;padding:16px 12px;text-align:center;position:relative;overflow:hidden;}
.me-window .me-stat::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(26,26,31,0.04),transparent);}
.me-window .me-stat-num{font-size:22px;font-weight:800;color:#1a1a1f;letter-spacing:-0.5px;line-height:1;}
.me-window .me-stat-label{font-size:8px;font-weight:700;color:rgba(26,26,31,0.2);letter-spacing:1.5px;text-transform:uppercase;margin-top:6px;}

.me-window .me-sep{display:flex;align-items:center;gap:8px;margin:0 0 20px;}
.me-window .me-sep-line{flex:1;height:0.5px;background:linear-gradient(90deg,rgba(26,26,31,0.04),rgba(26,26,31,0.08),rgba(26,26,31,0.04));}
.me-window .me-sep-text{font-size:8px;font-weight:800;letter-spacing:2px;color:rgba(26,26,31,0.12);text-transform:uppercase;}

.me-window .me-mask-list{display:flex;flex-direction:column;gap:8px;margin-bottom:24px;}
.me-window .me-mask{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;border:0.5px solid rgba(26,26,31,0.04);cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;}
.me-window .me-mask:active{background:rgba(26,26,31,0.02);transform:scale(0.98);}
.me-window .me-mask.active{border-color:rgba(26,26,31,0.12);background:rgba(26,26,31,0.015);}
.me-window .me-mask.active::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:#1a1a1f;border-radius:0 2px 2px 0;}
.me-window .me-mask-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1a1a1f,#3a3a42);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden;}
.me-window .me-mask-av img{width:100%;height:100%;object-fit:cover;}
.me-window .me-mask-info{flex:1;min-width:0;}
.me-window .me-mask-name{font-size:13px;font-weight:700;color:#1a1a1f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.me-window .me-mask-bio{font-size:10px;color:rgba(26,26,31,0.3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.me-window .me-mask-badge{font-size:7px;font-weight:800;letter-spacing:1px;color:#fff;background:#1a1a1f;padding:3px 8px;border-radius:10px;text-transform:uppercase;flex-shrink:0;}

.me-window .me-settings{display:flex;flex-direction:column;gap:4px;margin-bottom:24px;}
.me-window .me-set-row{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;cursor:pointer;transition:all 0.2s;}
.me-window .me-set-row:active{background:rgba(26,26,31,0.03);transform:scale(0.98);}
.me-window .me-set-icon{width:34px;height:34px;border-radius:10px;background:rgba(26,26,31,0.03);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.me-window .me-set-icon svg{width:16px;height:16px;stroke:#1a1a1f;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
.me-window .me-set-icon.danger{background:rgba(200,50,50,0.04);}
.me-window .me-set-icon.danger svg{stroke:#c83232;}
.me-window .me-set-info{flex:1;min-width:0;}
.me-window .me-set-name{font-size:13px;font-weight:600;color:#1a1a1f;}
.me-window .me-set-info .me-set-sub{font-size:10px;color:rgba(26,26,31,0.25);margin-top:1px;}
.me-window .me-set-arrow{width:14px;height:14px;stroke:rgba(26,26,31,0.12);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;}

.me-window .me-footer{text-align:center;padding:20px 0 10px;margin-top:auto;}
.me-window .me-footer-ver{font-size:9px;color:rgba(26,26,31,0.1);font-weight:600;letter-spacing:1px;margin-bottom:4px;}
.me-window .me-footer-brand{font-family:"TheatreDeco",serif;font-size:16px;color:rgba(26,26,31,0.035);letter-spacing:3px;}

/* + 按钮 */
.me-window .me-mask-add{display:flex;align-items:center;justify-content:center;gap:6px;padding:14px;border-radius:16px;border:0.5px dashed rgba(26,26,31,0.15);cursor:pointer;transition:all 0.2s;color:rgba(26,26,31,0.4);}
.me-window .me-mask-add:active{background:rgba(26,26,31,0.02);transform:scale(0.98);border-color:rgba(26,26,31,0.3);color:rgba(26,26,31,0.7);}
.me-window .me-mask-add svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.me-window .me-mask-add span{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;}

/* 弹窗 */
.me-modal{position:fixed;inset:0;z-index:950;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;visibility:hidden;transition:opacity 0.25s,visibility 0.25s;}
.me-modal.show{opacity:1;visibility:visible;}
.me-modal-card{width:100%;max-width:340px;background:#fff;border-radius:24px;padding:24px 20px 20px;position:relative;transform:scale(0.92) translateY(20px);transition:transform 0.3s cubic-bezier(0.16,1,0.3,1);box-shadow:0 20px 60px rgba(0,0,0,0.2);}
.me-modal.show .me-modal-card{transform:scale(1) translateY(0);}
.me-modal-title{font-size:13px;font-weight:800;color:#1a1a1f;letter-spacing:0.5px;margin-bottom:4px;}
.me-modal-sub{font-size:9px;font-weight:700;color:rgba(26,26,31,0.25);letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;}
.me-modal-av-row{display:flex;align-items:center;gap:14px;margin-bottom:18px;padding:12px;border-radius:14px;background:rgba(26,26,31,0.02);border:0.5px solid rgba(26,26,31,0.04);}
.me-modal-av-preview{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1a1a1f,#3a3a42);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden;}
.me-modal-av-preview img{width:100%;height:100%;object-fit:cover;}
.me-modal-av-actions{flex:1;display:flex;flex-direction:column;gap:6px;}
.me-modal-av-btn{padding:6px 10px;font-size:10px;font-weight:700;color:#1a1a1f;background:#fff;border:0.5px solid rgba(26,26,31,0.1);border-radius:8px;cursor:pointer;letter-spacing:0.5px;text-transform:uppercase;transition:all 0.15s;}
.me-modal-av-btn:active{transform:scale(0.96);background:rgba(26,26,31,0.04);}
.me-modal-av-btn.danger{color:#c83232;border-color:rgba(200,50,50,0.15);}
.me-modal-field{margin-bottom:14px;}
.me-modal-label{font-size:9px;font-weight:800;color:rgba(26,26,31,0.35);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;}
.me-modal-input{width:100%;padding:10px 14px;border-radius:12px;border:0.5px solid rgba(26,26,31,0.1);background:rgba(26,26,31,0.02);font-size:13px;color:#1a1a1f;font-family:inherit;outline:none;transition:all 0.2s;}
.me-modal-input:focus{border-color:rgba(26,26,31,0.3);background:#fff;}
.me-modal-textarea{resize:none;min-height:70px;line-height:1.5;}
.me-modal-actions{display:flex;gap:8px;margin-top:18px;}
.me-modal-btn{flex:1;padding:12px;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border:none;transition:all 0.2s;}
.me-modal-btn.cancel{background:rgba(26,26,31,0.04);color:#1a1a1f;}
.me-modal-btn.confirm{background:#1a1a1f;color:#fff;}
.me-modal-btn:active{transform:scale(0.97);}
.me-modal-btn.danger{background:#c83232;color:#fff;}
`;
    var style=document.createElement('style');
    style.id='me-page-style';
    style.textContent=css;
    document.head.appendChild(style);
}

function build(){
    if(built)return;
    built=true;
    injectStyle();
    var el=document.createElement('div');
    el.className='me-window';
    el.id='mePageApp';
    document.body.appendChild(el);
}

function render(masksWithAv){
    var el=document.getElementById('mePageApp');
    if(!el)return;

    if(!masksWithAv){
        var _m=getMasks();
        loadMaskAvatars(_m,function(loaded){render(loaded);});
        return;
    }

    var entities=getEntities();
    var conversations=getConversations();
    var masks=masksWithAv;
    var activeMask=masks.find(function(m){return m.active;})||masks[0];

    // 统计
    var totalMsgs=0;
    Object.keys(conversations).forEach(function(k){totalMsgs+=conversations[k].length;});

    // 身份证
    var idAvHtml=activeMask.avatar
        ?'<img src="'+activeMask.avatar+'">'
        :getInitial(activeMask.name);
    var handle='@'+activeMask.name.toLowerCase().replace(/\s+/g,'_')+' · Active';

    // 面具列表
    var maskHtml='';
    masks.forEach(function(mask){
        var isActive=mask.active;
        var avHtml=mask.avatar
            ?'<img src="'+mask.avatar+'">'
            :getInitial(mask.name);
        var badgeHtml=isActive?'<div class="me-mask-badge">Active</div>':'';
        maskHtml+='<div class="me-mask'+(isActive?' active':'')+'" data-id="'+mask.id+'">'+
            '<div class="me-mask-av">'+avHtml+'</div>'+
            '<div class="me-mask-info">'+
                '<div class="me-mask-name">'+escapeHtml(mask.name)+'</div>'+
                '<div class="me-mask-bio">'+escapeHtml(mask.bio||'No description')+'</div>'+
            '</div>'+
            badgeHtml+
        '</div>';
    });
    maskHtml+='<div class="me-mask-add" id="meMaskAdd"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>New Identity</span></div>';

    el.innerHTML=
        '<div class="me-hero">'+
            '<div class="me-hero-gradient"></div>'+
            '<div class="me-hero-noise"></div>'+
            '<div class="me-hero-ring r1"></div>'+
            '<div class="me-hero-ring r2"></div>'+
            '<div class="me-hero-ring r3"></div>'+
            '<div class="me-hero-line l1"></div>'+
            '<div class="me-hero-line l2"></div>'+
            '<div class="me-hero-dots"><div class="dot a" style="--o:0.18"></div><div class="dot b" style="--o:0.1"></div><div class="dot c" style="--o:0.06"></div><div class="dot d" style="--o:0.12"></div></div>'+
            (activeMask.avatar?'<div class="me-hero-avatar-print" style="background-image:url('+activeMask.avatar+');"></div>':'')+
            '<div class="me-topbar">'+
                '<div class="me-topbar-btn" id="meBack"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>'+
                '<div class="me-topbar-title">Profile</div>'+
                '<div class="me-topbar-btn" id="meSettings"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>'+
            '</div>'+
            '<div class="me-id-card">'+
                '<div class="me-id-card-inner">'+
                    '<div class="me-id-avatar">'+idAvHtml+'</div>'+
                    '<div class="me-id-info">'+
                        '<div class="me-id-name">'+escapeHtml(activeMask.name)+'</div>'+
                        '<div class="me-id-handle">'+handle+'</div>'+
                    '</div>'+
                '</div>'+
                '<div class="me-id-stamp"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>'+
                '<div class="me-id-barcode"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>'+
            '</div>'+
        '</div>'+

        '<div class="me-card">'+
            '<div class="me-card-handle"></div>'+
            '<div class="me-card-corner tl"></div>'+
            '<div class="me-card-corner br"></div>'+
            '<div class="me-stats">'+
                '<div class="me-stat"><div class="me-stat-num">'+String(entities.length).padStart(2,'0')+'</div><div class="me-stat-label">Entities</div></div>'+
                '<div class="me-stat"><div class="me-stat-num">'+totalMsgs+'</div><div class="me-stat-label">Messages</div></div>'+
                '<div class="me-stat"><div class="me-stat-num">'+masks.length+'</div><div class="me-stat-label">Masks</div></div>'+
            '</div>'+
            '<div class="me-sep"><div class="me-sep-line"></div><div class="me-sep-text">Identities</div><div class="me-sep-line"></div></div>'+
            '<div class="me-mask-list" id="meMaskList">'+maskHtml+'</div>'+
            '<div class="me-sep"><div class="me-sep-line"></div><div class="me-sep-text">Settings</div><div class="me-sep-line"></div></div>'+
            '<div class="me-settings">'+
                '<div class="me-set-row" id="meSetApi"><div class="me-set-icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><div class="me-set-info"><div class="me-set-name">API Key</div><div class="me-set-sub">Configure your AI provider</div></div><svg class="me-set-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>'+
                '<div class="me-set-row" id="meSetCss"><div class="me-set-icon"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div><div class="me-set-info"><div class="me-set-name">Custom CSS</div><div class="me-set-sub">Inject your own styles</div></div><svg class="me-set-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>'+
                '<div class="me-set-row" id="meSetAbout"><div class="me-set-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div><div class="me-set-info"><div class="me-set-name">About</div><div class="me-set-sub">A0nynx_3i · v1.0</div></div><svg class="me-set-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>'+
                '<div class="me-set-row" id="meSetReset"><div class="me-set-icon danger"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div><div class="me-set-info"><div class="me-set-name" style="color:#c83232;">System Reset</div><div class="me-set-sub">Wipe all data</div></div><svg class="me-set-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>'+
            '</div>'+
            '<div class="me-footer"><div class="me-footer-ver">A0nynx_3i · Issue No. 01</div><div class="me-footer-brand">Story</div></div>'+
        '</div>';

    // 事件
    document.getElementById('meBack').addEventListener('click',closeMePage);

    // 面具：点击=切换激活，长按=编辑
    el.querySelectorAll('.me-mask').forEach(function(maskEl){
        var pressTimer=null;
        var longPressed=false;
        var startEditing=function(){
            longPressed=true;
            if(navigator.vibrate)navigator.vibrate(15);
            var id=maskEl.dataset.id;
            var mask=masks.find(function(m){return m.id===id;});
            if(mask)openMaskEditor(mask,false);
        };
        maskEl.addEventListener('touchstart',function(){
            longPressed=false;
            pressTimer=setTimeout(startEditing,500);
        },{passive:true});
        maskEl.addEventListener('touchmove',function(){clearTimeout(pressTimer);});
        maskEl.addEventListener('touchend',function(){clearTimeout(pressTimer);});
        maskEl.addEventListener('contextmenu',function(e){
            e.preventDefault();
            startEditing();
        });
        maskEl.addEventListener('click',function(){
            if(longPressed)return;
            var id=maskEl.dataset.id;
            masks.forEach(function(m){m.active=(m.id===id);});
            saveMasks(masks);
            var _m=getMasks();
            loadMaskAvatars(_m,function(loaded){render(loaded);});
        });
    });

    // 新建按钮
    var addBtn=document.getElementById('meMaskAdd');
    if(addBtn){
        addBtn.addEventListener('click',function(){
            openMaskEditor({id:'m'+Date.now(),name:'',bio:'',avatar:'',active:false},true);
        });
    }

    // API Key
    document.getElementById('meSetApi').addEventListener('click',function(){
        var apiConfig;
        try{apiConfig=JSON.parse(localStorage.getItem('ca-api-config')||'{}');}catch(e){apiConfig={};}
        var node=apiConfig.node||'primary';
        var cfg=apiConfig[node]||{};
        var key=prompt('Enter API key:',cfg.key||'');
        if(key!==null){
            if(!apiConfig[node])apiConfig[node]={};
            apiConfig[node].key=key.trim();
            localStorage.setItem('ca-api-config',JSON.stringify(apiConfig));
        }
    });

    // System Reset
    document.getElementById('meSetReset').addEventListener('click',function(){
        if(confirm('System Reset will wipe ALL data. Proceed?')){
            window._caEntities=[];
            window._caConversations={};
            localStorage.removeItem('ca-user-masks');
            if(typeof ChatDB!=='undefined'&&ChatDB.clearAll){
                ChatDB.clearAll(function(){render();});
            }else{
                render();
            }
        }
    });

    // 注入底栏前先清理所有可能残留的 navBar
    var oldNavM=document.getElementById('mePageNav');
    if(oldNavM&&oldNavM.parentNode)oldNavM.parentNode.removeChild(oldNavM);
    var oldNavE=document.getElementById('elPageNav');
    if(oldNavE&&oldNavE.parentNode)oldNavE.parentNode.removeChild(oldNavE);
    var navHtml='<div class="cr-tab-capsule minimized" id="mePageNav">'+
        '<div class="cr-tab-item" data-tab="chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span class="cr-tab-label">Chat</span></div>'+
        '<div class="cr-tab-item" data-tab="explore"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg><span class="cr-tab-label">Explore</span></div>'+
        '<div class="cr-tab-item" data-tab="entity"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span class="cr-tab-label">Entity</span></div>'+
        '<div class="cr-tab-item active" data-tab="me"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span class="cr-tab-label">Me</span></div>'+
    '</div>';
    document.body.insertAdjacentHTML('beforeend',navHtml);

    var navBar=document.getElementById('mePageNav');
    setTimeout(function(){
        if(navBar&&navBar.classList.contains('minimized'))navBar.classList.add('collapsed');
    },1500);

    navBar.addEventListener('click',function(e){
        // 线 → 药丸
        if(navBar.classList.contains('collapsed')){
            navBar.classList.remove('collapsed');
            clearTimeout(navBar._reTimer);
            navBar._reTimer=setTimeout(function(){
                if(navBar&&navBar.classList.contains('minimized'))navBar.classList.add('collapsed');
            },4000);
            return;
        }
        // 药丸 → 完整胶囊
        if(navBar.classList.contains('minimized')){
            navBar.classList.remove('minimized');
            clearTimeout(navBar._reTimer);
            navBar._reTimer=setTimeout(function(){
                if(navBar){
                    navBar.classList.add('minimized');
                    setTimeout(function(){if(navBar&&navBar.classList.contains('minimized'))navBar.classList.add('collapsed');},1200);
                }
            },4500);
            return;
        }
        // 完整态点击
        var tab=e.target.closest('.cr-tab-item');
        if(!tab)return;
        var tabName=tab.dataset.tab;
        if(tabName==='me')return;
        // 切 active 播展开动效
        navBar.querySelectorAll('.cr-tab-item').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');
        clearTimeout(navBar._reTimer);
        // 短暂缓冲后立刻切页
        setTimeout(function(){
            // 清理所有页面 navBar
            var n1=document.getElementById('elPageNav');if(n1&&n1.parentNode)n1.parentNode.removeChild(n1);
            var n2=document.getElementById('mePageNav');if(n2&&n2.parentNode)n2.parentNode.removeChild(n2);
            if(tabName==='chat'){
                var elx=document.getElementById('mePageApp');
                if(elx){
                    elx.classList.remove('active','closing');
                    elx.style.visibility='hidden';
                }
            }else if(tabName==='entity'){
                if(typeof window.openEntityList==='function') window.openEntityList();
                setTimeout(function(){
                    var elx=document.getElementById('mePageApp');
                    if(elx){elx.classList.remove('active','closing');elx.style.visibility='hidden';}
                },50);
            }
        },120);
    });
}

function openMaskEditor(mask,isNew){
    var existing=document.getElementById('meMaskModal');
    if(existing)existing.parentNode.removeChild(existing);

    var modal=document.createElement('div');
    modal.className='me-modal';
    modal.id='meMaskModal';

    var avPreview=mask.avatar
        ?'<img src="'+mask.avatar+'">'
        :getInitial(mask.name||'?');

    modal.innerHTML=
        '<div class="me-modal-card">'+
            '<div class="me-modal-title">'+(isNew?'New Identity':'Edit Identity')+'</div>'+
            '<div class="me-modal-sub">User Mask Configuration</div>'+
            '<div class="me-modal-av-row">'+
                '<div class="me-modal-av-preview" id="mmAvPrev">'+avPreview+'</div>'+
                '<div class="me-modal-av-actions">'+
                    '<button class="me-modal-av-btn" id="mmAvUpload">Upload Image</button>'+
                    (mask.avatar?'<button class="me-modal-av-btn danger" id="mmAvRemove">Remove</button>':'')+
                '</div>'+
            '</div>'+
            '<div class="me-modal-field">'+
                '<div class="me-modal-label">Name</div>'+
                '<input type="text" class="me-modal-input" id="mmName" value="'+escapeHtml(mask.name||'')+'" placeholder="The Architect" maxlength="30">'+
            '</div>'+
            '<div class="me-modal-field">'+
                '<div class="me-modal-label">Persona / Bio</div>'+
                '<textarea class="me-modal-input me-modal-textarea" id="mmBio" placeholder="Logical, precise, structural thinker." maxlength="500">'+escapeHtml(mask.bio||'')+'</textarea>'+
            '</div>'+
            '<div class="me-modal-field">'+
                '<div class="me-modal-label">Bind to Entity · 绑定联系人</div>'+
                '<div id="mmBindList" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">'+
                    (function(){
                        var ents=getEntities();
                        var bound=mask.boundEntities||[];
                        if(!ents.length)return '<div style="font-size:10px;color:rgba(26,26,31,0.25);">No entities yet</div>';
                        var h='';
                        ents.forEach(function(ent){
                            var dn=ent.nickname||ent.name;
                            var isBound=bound.indexOf(ent.id)>=0;
                            h+='<div class="mm-bind-chip'+(isBound?' active':'')+'" data-eid="'+ent.id+'" style="'+
                                'padding:5px 10px;border-radius:20px;font-size:10px;font-weight:600;cursor:pointer;transition:all 0.15s;'+
                                'border:0.5px solid '+(isBound?'#1a1a1f':'rgba(26,26,31,0.1)')+';'+
                                'background:'+(isBound?'#1a1a1f':'rgba(26,26,31,0.02)')+';'+
                                'color:'+(isBound?'#fff':'rgba(26,26,31,0.5)')+';'+
                            '">'+escapeHtml(dn)+'</div>';
                        });
                        return h;
                    })()+
                '</div>'+
                '<div style="font-size:8px;color:rgba(26,26,31,0.2);margin-top:6px;line-height:1.4;">绑定后，与该联系人聊天时固定使用此面具身份，不受全局切换影响</div>'+
            '</div>'+
            '<div class="me-modal-actions">'+
                (isNew?'':'<button class="me-modal-btn danger" id="mmDelete">Delete</button>')+
                '<button class="me-modal-btn cancel" id="mmCancel">Cancel</button>'+
                '<button class="me-modal-btn confirm" id="mmSave">Save</button>'+
            '</div>'+
        '</div>';

    document.body.appendChild(modal);
    requestAnimationFrame(function(){modal.classList.add('show');});

    var hide=function(){
        modal.classList.remove('show');
        setTimeout(function(){if(modal.parentNode)modal.parentNode.removeChild(modal);},250);
    };

    // 上传头像
    document.getElementById('mmAvUpload').addEventListener('click',function(){
        var inp=document.createElement('input');
        inp.type='file';inp.accept='image/*';
        inp.onchange=function(e){
            var f=e.target.files[0];if(!f)return;
            var r=new FileReader();
            r.onload=function(ev){
                mask.avatar=ev.target.result;
                var prev=document.getElementById('mmAvPrev');
                prev.innerHTML='<img src="'+ev.target.result+'">';
                // 显示移除按钮
                if(!document.getElementById('mmAvRemove')){
                    var rmBtn=document.createElement('button');
                    rmBtn.className='me-modal-av-btn danger';
                    rmBtn.id='mmAvRemove';
                    rmBtn.textContent='Remove';
                    rmBtn.addEventListener('click',function(){
                        mask.avatar='';
                        document.getElementById('mmAvPrev').innerHTML=getInitial(document.getElementById('mmName').value||'?');
                        rmBtn.parentNode.removeChild(rmBtn);
                    });
                    document.getElementById('mmAvUpload').parentNode.appendChild(rmBtn);
                }
            };
            r.readAsDataURL(f);
        };
        inp.click();
    });

    // 移除头像
    var rmInit=document.getElementById('mmAvRemove');
    if(rmInit){
        rmInit.addEventListener('click',function(){
            mask.avatar='';
            document.getElementById('mmAvPrev').innerHTML=getInitial(document.getElementById('mmName').value||'?');
            rmInit.parentNode.removeChild(rmInit);
        });
    }

    // Cancel
    document.getElementById('mmCancel').addEventListener('click',hide);
    modal.addEventListener('click',function(e){
        if(e.target===modal)hide();
    });

    // 绑定联系人芯片点击
    var bindList=document.getElementById('mmBindList');
    if(bindList){
        bindList.querySelectorAll('.mm-bind-chip').forEach(function(chip){
            chip.addEventListener('click',function(){
                var isActive=chip.classList.contains('active');
                if(isActive){
                    chip.classList.remove('active');
                    chip.style.border='0.5px solid rgba(26,26,31,0.1)';
                    chip.style.background='rgba(26,26,31,0.02)';
                    chip.style.color='rgba(26,26,31,0.5)';
                }else{
                    chip.classList.add('active');
                    chip.style.border='0.5px solid #1a1a1f';
                    chip.style.background='#1a1a1f';
                    chip.style.color='#fff';
                }
            });
        });
    }

    // Save
    document.getElementById('mmSave').addEventListener('click',function(){
        var name=document.getElementById('mmName').value.trim();
        var bio=document.getElementById('mmBio').value.trim();
        if(!name){alert('Name is required.');return;}
        // 收集绑定的联系人ID
        var boundIds=[];
        if(bindList){
            bindList.querySelectorAll('.mm-bind-chip.active').forEach(function(chip){
                boundIds.push(chip.dataset.eid);
            });
        }
        var allMasks=getMasks();
        // 绑定是独占的：如果这个面具绑定了某个联系人，其他面具上要解除该联系人
        if(boundIds.length>0){
            allMasks.forEach(function(m){
                if(m.id===mask.id)return;
                if(!m.boundEntities)return;
                m.boundEntities=m.boundEntities.filter(function(eid){
                    return boundIds.indexOf(eid)===-1;
                });
            });
        }
        if(isNew){
            allMasks.push({id:mask.id,name:name,bio:bio,avatar:mask.avatar||'',active:false,boundEntities:boundIds});
        }else{
            var target=allMasks.find(function(m){return m.id===mask.id;});
            if(target){
                target.name=name;
                target.bio=bio;
                target.avatar=mask.avatar||'';
                target.boundEntities=boundIds;
            }
        }
        saveMasks(allMasks);
        hide();
        setTimeout(function(){render();},150);
    });

    // Delete
    var delBtn=document.getElementById('mmDelete');
    if(delBtn){
        delBtn.addEventListener('click',function(){
            if(!confirm('Delete this identity?'))return;
            var allMasks=getMasks();
            allMasks=allMasks.filter(function(m){return m.id!==mask.id;});
            // 如果删的是激活的，把第一个设为激活
            if(mask.active&&allMasks.length){allMasks[0].active=true;}
            saveMasks(allMasks);
            hide();
            setTimeout(function(){render();},150);
        });
    }
}

function closeMePage(){
    var el=document.getElementById('mePageApp');
    if(!el)return;
    var n1=document.getElementById('mePageNav');if(n1&&n1.parentNode)n1.parentNode.removeChild(n1);
    var n2=document.getElementById('elPageNav');if(n2&&n2.parentNode)n2.parentNode.removeChild(n2);
    el.classList.remove('active');
    el.classList.add('closing');
    setTimeout(function(){el.classList.remove('closing');},350);
}

window.openMePage=function(){
    build();
    var elPre=document.getElementById('mePageApp');
    if(elPre){
        elPre.style.cssText='';
        elPre.classList.remove('active','closing');
    }
    var doShow=function(){
        var el=document.getElementById('mePageApp');
        if(!el)return;
        el.style.cssText='';
        el.classList.remove('active','closing');
        void el.offsetWidth;
        el.classList.add('active');
    };
    if(typeof ChatDB!=='undefined'){
        ChatDB.loadEntities(function(ents){
            if(ents&&ents.length)window._caEntities=ents;
            ChatDB.loadAllConversations(function(convs){
                if(convs)window._caConversations=convs;
                render();
                doShow();
            });
        });
    }else{
        render();
        doShow();
    }
};

window.closeMePage=closeMePage;

})();
