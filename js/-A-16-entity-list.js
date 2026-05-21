// js/-A-16-entity-list.js · 联系人列表页（独立页面，接通 entities 数据）
(function(){
'use strict';

var built=false;
var styleInjected=false;

function getEntities(){return window._caEntities||[];}
function getConversations(){return window._caConversations||{};}
function getInitial(name){return(name||'?').trim().charAt(0).toUpperCase();}
function escapeHtml(str){var d=document.createElement('div');d.textContent=str;return d.innerHTML;}
function pickColor(name){var sum=0;for(var i=0;i<name.length;i++)sum+=name.charCodeAt(i);return['#1C1C1E','#2C2C2E','#3A3A3C','#48484A','#636366','#8E8E93'][sum%6];}

function injectStyle(){
    if(styleInjected)return;
    styleInjected=true;
    var css=`
@font-face{font-family:"TheatreDeco";src:url("https://file.icve.com.cn/file_doc/SyNI8mvo/uZqcTvbY.ttf") format("truetype");font-display:swap;}

.el-window{position:fixed;inset:0;z-index:860;background:#fff;max-width:430px;margin:0 auto;overflow-x:hidden;overflow-y:auto;display:flex;flex-direction:column;opacity:0;visibility:hidden;pointer-events:none;transition:none;}
.el-window.active{visibility:visible;pointer-events:auto;animation:el-reveal 0.4s cubic-bezier(0.16,1,0.3,1) forwards;}
.el-window.closing{pointer-events:none;animation:el-hide 0.3s cubic-bezier(0.4,0,0.2,1) forwards;}
@keyframes el-reveal{0%{opacity:0;transform:translateX(30%);}100%{opacity:1;transform:translateX(0);}}
@keyframes el-hide{0%{opacity:1;transform:translateX(0);}100%{opacity:0;transform:translateX(30%);visibility:hidden;}}

.el-window .el-hero{position:relative;height:200px;display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;}
.el-window .el-hero-gradient{position:absolute;inset:0;background:radial-gradient(ellipse at 70% 90%,rgba(255,255,255,0.95) 0%,rgba(180,180,188,0.4) 20%,rgba(80,80,88,0.5) 45%,rgba(42,42,48,0.75) 65%,#1a1a1f 100%);z-index:0;}
.el-window .el-hero-noise{position:absolute;inset:0;opacity:0.025;z-index:1;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
.el-window .el-hero-ring{position:absolute;border-radius:50%;z-index:1;pointer-events:none;}
.el-window .el-hero-ring.r1{width:220px;height:220px;top:-50px;right:-30px;border:0.5px solid rgba(255,255,255,0.05);animation:el-spin 45s linear infinite;}
.el-window .el-hero-ring.r2{width:150px;height:150px;top:30px;left:-30px;border:0.5px dashed rgba(255,255,255,0.04);animation:el-spin 30s linear infinite reverse;}
@keyframes el-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
.el-window .el-hero-line{position:absolute;height:0.5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);z-index:1;pointer-events:none;}
.el-window .el-hero-line.l1{width:50%;top:40px;left:25%;}
.el-window .el-hero-line.l2{width:30%;top:75px;right:10%;}
.el-window .el-hero-dots{position:absolute;inset:0;z-index:1;pointer-events:none;}
.el-window .el-hero-dots .dot{position:absolute;border-radius:50%;background:#fff;}
.el-window .el-hero-dots .dot.a{width:3px;height:3px;opacity:0.2;top:30px;right:45px;animation:el-twinkle 3s ease-in-out infinite;}
.el-window .el-hero-dots .dot.b{width:2px;height:2px;opacity:0.1;top:60px;right:80px;animation:el-twinkle 4s ease-in-out infinite 1s;}
.el-window .el-hero-dots .dot.c{width:4px;height:4px;opacity:0.06;top:50px;left:55px;animation:el-twinkle 3.5s ease-in-out infinite 0.5s;}
.el-window .el-hero-dots .dot.d{width:2px;height:2px;opacity:0.15;top:85px;left:30px;animation:el-twinkle 2.8s ease-in-out infinite 1.5s;}
@keyframes el-twinkle{0%,100%{transform:scale(1);opacity:var(--o,0.1);}50%{transform:scale(1.6);opacity:0.35;}}

.el-window .el-topbar{position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;}
.el-window .el-back,.el-window .el-topbar-add{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;border:0.5px solid rgba(255,255,255,0.1);}
.el-window .el-back:active,.el-window .el-topbar-add:active{transform:scale(0.9);background:rgba(255,255,255,0.15);}
.el-window .el-back svg,.el-window .el-topbar-add svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}
.el-window .el-topbar-title{font-size:10px;font-weight:800;letter-spacing:2.5px;color:rgba(255,255,255,0.35);text-transform:uppercase;}

.el-window .el-hero-content{position:relative;z-index:10;padding:70px 24px 0;display:flex;flex-direction:column;}
.el-window .el-hero-title{font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;}
.el-window .el-hero-sub{font-size:11px;font-weight:500;color:rgba(255,255,255,0.3);margin-top:4px;letter-spacing:0.3px;}
.el-window .el-hero-count{position:absolute;top:55px;right:24px;font-family:"TheatreDeco",serif;font-size:56px;color:rgba(255,255,255,0.1);letter-spacing:2px;line-height:1;}

.el-window .el-card{position:relative;z-index:10;flex:1;background:#fff;border-radius:30px 30px 0 0;margin-top:-24px;padding:24px 0 30px;box-shadow:0 -4px 30px rgba(0,0,0,0.04);display:flex;flex-direction:column;min-height:400px;}
.el-window .el-card-handle{width:36px;height:4px;border-radius:2px;background:rgba(26,26,31,0.07);margin:0 auto 18px;}
.el-window .el-card-corner{position:absolute;pointer-events:none;z-index:0;}
.el-window .el-card-corner.tl{top:16px;left:14px;width:16px;height:16px;border-left:0.5px solid rgba(26,26,31,0.04);border-top:0.5px solid rgba(26,26,31,0.04);}
.el-window .el-card-corner.br{bottom:40px;right:14px;width:16px;height:16px;border-right:0.5px solid rgba(26,26,31,0.04);border-bottom:0.5px solid rgba(26,26,31,0.04);}

.el-window .el-search{margin:0 20px 18px;position:relative;}
.el-window .el-search-input{width:100%;height:38px;border:1px solid rgba(26,26,31,0.06);border-radius:50px;padding:0 16px 0 38px;font-size:12px;font-weight:500;color:#1a1a1f;outline:none;background:rgba(26,26,31,0.015);transition:border-color 0.2s,box-shadow 0.2s;}
.el-window .el-search-input:focus{border-color:rgba(26,26,31,0.12);box-shadow:0 2px 12px rgba(0,0,0,0.03);}
.el-window .el-search-input::placeholder{color:rgba(26,26,31,0.15);}
.el-window .el-search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:14px;height:14px;stroke:rgba(26,26,31,0.2);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}

.el-window .el-section{padding:0 20px;}
.el-window .el-section-header{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
.el-window .el-section-line{flex:1;height:0.5px;background:linear-gradient(90deg,rgba(26,26,31,0.06),rgba(26,26,31,0.02));}
.el-window .el-section-label{font-size:9px;font-weight:800;letter-spacing:2px;color:rgba(26,26,31,0.15);text-transform:uppercase;}
.el-window .el-section-count{font-size:9px;font-weight:800;color:rgba(26,26,31,0.1);letter-spacing:1px;}

.el-window .el-list{display:flex;flex-direction:column;gap:4px;}
.el-window .el-item{display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:16px;cursor:pointer;transition:all 0.2s;position:relative;}
.el-window .el-item:active{background:rgba(26,26,31,0.03);transform:scale(0.98);}
.el-window .el-item-avatar{width:44px;height:44px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff;position:relative;overflow:hidden;}
.el-window .el-item-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.el-window .el-item-avatar-ring{position:absolute;inset:-2px;border-radius:50%;border:1.5px solid rgba(26,26,31,0.06);}
.el-window .el-item-info{flex:1;min-width:0;}
.el-window .el-item-name{font-size:14px;font-weight:700;color:#1a1a1f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.el-window .el-item-persona{font-size:11px;color:rgba(26,26,31,0.3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:400;}
.el-window .el-item-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;}
.el-window .el-item-time{font-size:9px;color:rgba(26,26,31,0.15);font-weight:600;letter-spacing:0.3px;}
.el-window .el-item-badge{width:8px;height:8px;border-radius:50%;background:#1a1a1f;opacity:0.6;}
.el-window .el-item-arrow{width:14px;height:14px;stroke:rgba(26,26,31,0.12);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;}
.el-window .el-item-actions{display:flex;gap:6px;flex-shrink:0;}
.el-window .el-item-act{width:28px;height:28px;border-radius:50%;background:rgba(26,26,31,0.04);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;}
.el-window .el-item-act:active{transform:scale(0.85);background:rgba(26,26,31,0.08);}
.el-window .el-item-act svg{width:13px;height:13px;stroke:rgba(26,26,31,0.35);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.el-window .el-item-act.danger svg{stroke:#e04040;}

.el-window .el-fab{position:fixed;bottom:30px;right:calc(50% - 195px);width:50px;height:50px;border-radius:50%;background:#1a1a1f;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 28px rgba(26,26,31,0.25),0 0 0 4px rgba(26,26,31,0.04);transition:transform 0.2s,box-shadow 0.2s;z-index:100;}
.el-window .el-fab:active{transform:scale(0.92);}
.el-window .el-fab svg{width:20px;height:20px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round;}

.el-window .el-footer{text-align:center;padding:20px 0 10px;margin-top:auto;}
.el-window .el-footer-brand{font-family:"TheatreDeco",serif;font-size:14px;color:rgba(26,26,31,0.035);letter-spacing:3px;}

.el-window .el-edit-modal{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;padding:20px;animation:el-reveal 0.25s ease forwards;}
.el-window .el-edit-card{width:100%;max-width:320px;background:#fff;border-radius:24px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.2);border:0.5px solid rgba(26,26,31,0.08);}
.el-window .el-edit-title{font-size:9px;font-weight:800;letter-spacing:2px;color:rgba(26,26,31,0.25);text-transform:uppercase;margin-bottom:16px;}
.el-window .el-edit-field{margin-bottom:14px;}
.el-window .el-edit-label{font-size:9px;font-weight:700;color:rgba(26,26,31,0.4);margin-bottom:5px;}
.el-window .el-edit-input{width:100%;border:none;border-bottom:1px solid rgba(26,26,31,0.1);padding:8px 0;font-size:14px;font-weight:700;color:#1a1a1f;outline:none;background:transparent;}
.el-window .el-edit-textarea{width:100%;border:1px solid rgba(26,26,31,0.06);border-radius:12px;padding:10px 12px;font-size:12px;color:#1a1a1f;outline:none;resize:none;height:80px;line-height:1.5;font-family:inherit;background:rgba(26,26,31,0.015);}
.el-window .el-edit-btns{display:flex;gap:10px;margin-top:18px;}
.el-window .el-edit-btn{flex:1;padding:12px;border-radius:50px;border:none;font-size:10px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:0.5px;transition:all 0.2s;}
.el-window .el-edit-btn:active{transform:scale(0.96);}
.el-window .el-edit-btn.cancel{background:transparent;border:1px solid rgba(26,26,31,0.1);color:#1a1a1f;}
.el-window .el-edit-btn.save{background:#1a1a1f;color:#fff;}

/* ═══ 新建联系人页 ═══ */
.ne-page{position:relative;min-height:100vh;display:flex;flex-direction:column;background:#fff;}
.ne-hero{position:relative;height:280px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:60px;overflow:hidden;}
.ne-hero-gradient{position:absolute;inset:0;background:radial-gradient(ellipse at 70% 90%,#ffffff 0%,#a0a0a8 25%,#4a4a52 50%,#2a2a30 70%,#1a1a1f 100%);z-index:0;}
.ne-hero-noise{position:absolute;inset:0;opacity:0.025;z-index:1;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
.ne-hero-ring{position:absolute;border-radius:50%;z-index:1;pointer-events:none;}
.ne-hero-ring.r1{width:260px;height:260px;top:-60px;right:-40px;border:0.5px solid rgba(255,255,255,0.05);animation:ne-spin 45s linear infinite;}
.ne-hero-ring.r2{width:180px;height:180px;top:20px;left:-40px;border:0.5px dashed rgba(255,255,255,0.04);animation:ne-spin 30s linear infinite reverse;}
.ne-hero-ring.r3{width:100px;height:100px;top:60px;right:40px;border:0.5px dotted rgba(255,255,255,0.03);animation:ne-spin 20s linear infinite;}
@keyframes ne-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
.ne-hero-line{position:absolute;height:0.5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);z-index:1;pointer-events:none;}
.ne-hero-line.l1{width:50%;top:35px;left:25%;}
.ne-hero-line.l2{width:30%;top:70px;right:15%;}
.ne-hero-dots{position:absolute;inset:0;z-index:1;pointer-events:none;}
.ne-hero-dots .dot{position:absolute;border-radius:50%;background:#fff;}
.ne-hero-dots .dot.a{width:3px;height:3px;opacity:0.2;top:28px;right:50px;animation:ne-twinkle 3s ease-in-out infinite;}
.ne-hero-dots .dot.b{width:2px;height:2px;opacity:0.1;top:55px;right:90px;animation:ne-twinkle 4s ease-in-out infinite 1s;}
.ne-hero-dots .dot.c{width:4px;height:4px;opacity:0.06;top:45px;left:60px;animation:ne-twinkle 3.5s ease-in-out infinite 0.5s;}
.ne-hero-dots .dot.d{width:2px;height:2px;opacity:0.15;top:80px;left:35px;animation:ne-twinkle 2.8s ease-in-out infinite 1.5s;}
.ne-hero-dots .dot.e{width:3px;height:3px;opacity:0.08;top:20px;left:120px;animation:ne-twinkle 3.2s ease-in-out infinite 0.8s;}
@keyframes ne-twinkle{0%,100%{transform:scale(1);opacity:var(--o,0.1);}50%{transform:scale(1.6);opacity:0.35;}}
.ne-topbar{position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;}
.ne-back{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;border:0.5px solid rgba(255,255,255,0.1);}
.ne-back:active{transform:scale(0.9);background:rgba(255,255,255,0.15);}
.ne-back svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}
.ne-topbar-title{font-size:10px;font-weight:800;letter-spacing:2.5px;color:rgba(255,255,255,0.35);text-transform:uppercase;}
.ne-topbar-right{width:32px;}
.ne-avatar-wrap{position:relative;z-index:10;width:86px;height:86px;cursor:pointer;margin-bottom:10px;}
.ne-avatar-orbit{position:absolute;inset:-10px;border-radius:50%;border:1.5px dashed rgba(255,255,255,0.1);animation:ne-spin 16s linear infinite;}
.ne-avatar-orbit::before{content:"";position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.25);box-shadow:0 0 6px rgba(255,255,255,0.2);}
.ne-avatar-inner{width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#3a3a42,#5a5a62);display:flex;align-items:center;justify-content:center;overflow:hidden;border:2.5px solid rgba(255,255,255,0.15);transition:transform 0.2s;box-shadow:0 12px 40px rgba(0,0,0,0.3);}
.ne-avatar-wrap:active .ne-avatar-inner{transform:scale(0.93);}
.ne-avatar-inner svg{width:30px;height:30px;stroke:rgba(255,255,255,0.4);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}
.ne-avatar-badge{position:absolute;bottom:0;right:0;width:26px;height:26px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;z-index:2;box-shadow:0 3px 10px rgba(0,0,0,0.15);}
.ne-avatar-badge svg{width:12px;height:12px;stroke:#1a1a1f;fill:none;stroke-width:2.5;stroke-linecap:round;}
.ne-hero-hint{font-size:9px;font-weight:600;color:rgba(255,255,255,0.25);letter-spacing:1.5px;text-transform:uppercase;z-index:10;}
.ne-card{position:relative;z-index:10;flex:1;background:#fff;border-radius:30px 30px 0 0;margin-top:-24px;padding:28px 24px 30px;box-shadow:0 -4px 30px rgba(0,0,0,0.04);display:flex;flex-direction:column;}
.ne-card-handle{width:36px;height:4px;border-radius:2px;background:rgba(26,26,31,0.07);margin:0 auto 22px;}
.ne-card-corner{position:absolute;pointer-events:none;z-index:0;}
.ne-card-corner.tl{top:18px;left:14px;width:18px;height:18px;border-left:0.5px solid rgba(26,26,31,0.04);border-top:0.5px solid rgba(26,26,31,0.04);}
.ne-card-corner.br{bottom:90px;right:14px;width:18px;height:18px;border-right:0.5px solid rgba(26,26,31,0.04);border-bottom:0.5px solid rgba(26,26,31,0.04);}
.ne-field{margin-bottom:22px;position:relative;}
.ne-field-label{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.ne-field-num{width:18px;height:18px;border-radius:50%;background:#1a1a1f;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#fff;flex-shrink:0;}
.ne-field-name{font-size:10px;font-weight:700;color:rgba(26,26,31,0.35);letter-spacing:0.5px;text-transform:uppercase;}
.ne-input{width:100%;border:none;border-bottom:1.5px solid rgba(26,26,31,0.06);padding:10px 0;font-size:15px;font-weight:600;color:#1a1a1f;outline:none;background:transparent;transition:border-color 0.3s;}
.ne-input:focus{border-bottom-color:#1a1a1f;}
.ne-input::placeholder{color:rgba(26,26,31,0.12);font-weight:400;}
.ne-textarea{width:100%;border:1px solid rgba(26,26,31,0.05);border-radius:14px;padding:14px 16px;font-size:13px;color:#1a1a1f;outline:none;background:rgba(26,26,31,0.012);resize:none;height:100px;line-height:1.6;font-family:inherit;transition:border-color 0.3s,box-shadow 0.3s;}
.ne-textarea:focus{border-color:rgba(26,26,31,0.12);box-shadow:0 4px 16px rgba(0,0,0,0.02);}
.ne-textarea::placeholder{color:rgba(26,26,31,0.12);}
.ne-sep{display:flex;align-items:center;gap:8px;margin:4px 0 20px;}
.ne-sep-line{flex:1;height:0.5px;background:linear-gradient(90deg,rgba(26,26,31,0.03),rgba(26,26,31,0.07),rgba(26,26,31,0.03));}
.ne-sep-dot{width:3px;height:3px;border-radius:50%;background:rgba(26,26,31,0.1);}
.ne-field-sub{font-size:9px;color:rgba(26,26,31,0.2);margin-bottom:10px;line-height:1.4;}
.ne-submit{width:100%;height:52px;border:none;border-radius:50px;background:#1a1a1f;color:#fff;font-size:13px;font-weight:700;letter-spacing:0.5px;cursor:pointer;position:relative;overflow:hidden;transition:transform 0.2s,box-shadow 0.2s;margin-top:28px;}
.ne-submit:active{transform:scale(0.97);}
.ne-submit-shine{position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent);animation:ne-shine 4s ease-in-out infinite;}
@keyframes ne-shine{0%{left:-100%;}40%{left:100%;}100%{left:100%;}}
.ne-submit-text{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:8px;}
.ne-submit-text svg{width:15px;height:15px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.ne-footer{text-align:center;padding:18px 0 6px;}
.ne-footer-brand{font-family:"TheatreDeco",serif;font-size:14px;color:rgba(26,26,31,0.035);letter-spacing:3px;}
`;
    var style=document.createElement('style');
    style.id='el-entity-list-style';
    style.textContent=css;
    document.head.appendChild(style);
}

function build(){
    if(built)return;
    built=true;
    injectStyle();
    var el=document.createElement('div');
    el.className='el-window';
    el.id='entityListApp';
    document.body.appendChild(el);
}

function render(){
    var el=document.getElementById('entityListApp');
    if(!el)return;

    var entities=getEntities();
    var conversations=getConversations();
    var count=String(entities.length).padStart(2,'0');

    var listHtml='';
    entities.forEach(function(ent){
        var dispName=ent.nickname||ent.name;
        var persona=ent.persona?ent.persona.substring(0,30)+(ent.persona.length>30?'...':''):'AI Entity';
        var color=ent.color||pickColor(ent.name);
        var msgs=conversations[ent.id]||[];
        var lastTime=msgs.length?(msgs[msgs.length-1].time||'').split(' ')[1]||'':'';
        var avHtml=ent.avatar
            ?'<img src="'+ent.avatar+'">'
            :getInitial(dispName);

        listHtml+='<div class="el-item" data-id="'+ent.id+'">'+
            '<div class="el-item-avatar" style="background:linear-gradient(135deg,'+color+',#8E8E93);">'+
                '<div class="el-item-avatar-ring"></div>'+
                avHtml+
            '</div>'+
            '<div class="el-item-info">'+
                '<div class="el-item-name">'+escapeHtml(dispName)+'</div>'+
                '<div class="el-item-persona">'+escapeHtml(persona)+'</div>'+
            '</div>'+
            '<div class="el-item-actions">'+
                '<div class="el-item-act el-act-edit" data-id="'+ent.id+'"><svg viewBox="0 0 24 24"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></div>'+
                '<div class="el-item-act el-act-chat" data-id="'+ent.id+'"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>'+
                '<div class="el-item-act danger el-act-del" data-id="'+ent.id+'"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>'+
            '</div>'+
        '</div>';
    });

    el.innerHTML=
        '<div class="el-hero">'+
            '<div class="el-hero-gradient"></div>'+
            '<div class="el-hero-noise"></div>'+
            '<div class="el-hero-ring r1"></div>'+
            '<div class="el-hero-ring r2"></div>'+
            '<div class="el-hero-line l1"></div>'+
            '<div class="el-hero-line l2"></div>'+
            '<div class="el-hero-dots"><div class="dot a" style="--o:0.2"></div><div class="dot b" style="--o:0.1"></div><div class="dot c" style="--o:0.06"></div><div class="dot d" style="--o:0.15"></div></div>'+
            '<div class="el-topbar">'+
                '<div class="el-back" id="elBack"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>'+
                '<div class="el-topbar-title">Entities</div>'+
                '<div class="el-topbar-add" id="elAdd"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>'+
            '</div>'+
            '<div class="el-hero-content">'+
                '<div class="el-hero-title">Entities</div>'+
                '<div class="el-hero-sub">Your AI collection</div>'+
                '<div class="el-hero-count">'+count+'</div>'+
            '</div>'+
        '</div>'+

        '<div class="el-card">'+
            '<div class="el-card-handle"></div>'+
            '<div class="el-card-corner tl"></div>'+
            '<div class="el-card-corner br"></div>'+
            '<div class="el-search">'+
                '<svg class="el-search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'+
                '<input type="text" class="el-search-input" id="elSearchInput" placeholder="Search entities...">'+
            '</div>'+
            '<div class="el-section">'+
                '<div class="el-section-header">'+
                    '<div class="el-section-label">Directory</div>'+
                    '<div class="el-section-line"></div>'+
                    '<div class="el-section-count">'+count+'</div>'+
                '</div>'+
                '<div class="el-list" id="elList">'+listHtml+'</div>'+
            '</div>'+
            '<div class="el-footer"><div class="el-footer-brand">Story</div></div>'+
        '</div>'+

        '<div class="el-fab" id="elFab"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>';

    // 事件绑定
    document.getElementById('elBack').addEventListener('click',closeEntityList);

    document.getElementById('elSearchInput').addEventListener('input',function(){
        var q=this.value.toLowerCase();
        el.querySelectorAll('.el-item').forEach(function(item){
            var name=item.querySelector('.el-item-name').textContent.toLowerCase();
            item.style.display=name.indexOf(q)!==-1?'flex':'none';
        });
    });

    // 编辑
    el.querySelectorAll('.el-act-edit').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            openEditModal(btn.dataset.id);
        });
    });

    // 聊天
    el.querySelectorAll('.el-act-chat').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            closeEntityList();
            setTimeout(function(){
                if(typeof window.openChatDetailAlt==='function') window.openChatDetailAlt(btn.dataset.id);
            },350);
        });
    });

    // 删除
    el.querySelectorAll('.el-act-del').forEach(function(btn){
        btn.addEventListener('click',function(e){
            e.stopPropagation();
            var id=btn.dataset.id;
            if(!confirm('Delete this entity?'))return;
            var ents=getEntities();
            var idx=ents.findIndex(function(en){return en.id===id;});
            if(idx!==-1)ents.splice(idx,1);
            window._caEntities=ents;
            if(window._caConversations)delete window._caConversations[id];
            if(typeof ChatDB!=='undefined'){
                ChatDB.deleteEntity(id);
            }
            render();
        });
    });

    // 点击行 → 聊天
    el.querySelectorAll('.el-item').forEach(function(item){
        item.addEventListener('click',function(){
            var id=item.dataset.id;
            closeEntityList();
            setTimeout(function(){
                if(typeof window.openChatDetailAlt==='function') window.openChatDetailAlt(id);
            },350);
        });
    });

    // FAB / 顶部 + 按钮 → 新建
    document.getElementById('elFab').addEventListener('click',openNewModal);
    document.getElementById('elAdd').addEventListener('click',openNewModal);

    // 注入底栏前先清理所有可能残留的 navBar
    var oldNavE=document.getElementById('elPageNav');
    if(oldNavE&&oldNavE.parentNode)oldNavE.parentNode.removeChild(oldNavE);
    var oldNavM=document.getElementById('mePageNav');
    if(oldNavM&&oldNavM.parentNode)oldNavM.parentNode.removeChild(oldNavM);
    // 注入底栏（复用 chat-room.css 的 cr-tab-capsule）
    var navHtml='<div class="cr-tab-capsule minimized" id="elPageNav">'+
        '<div class="cr-tab-item" data-tab="chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span class="cr-tab-label">Chat</span></div>'+
        '<div class="cr-tab-item" data-tab="explore"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg><span class="cr-tab-label">Explore</span></div>'+
        '<div class="cr-tab-item active" data-tab="entity"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span class="cr-tab-label">Entity</span></div>'+
        '<div class="cr-tab-item" data-tab="me"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span class="cr-tab-label">Me</span></div>'+
    '</div>';
    document.body.insertAdjacentHTML('beforeend',navHtml);

    var navBar=document.getElementById('elPageNav');
    // 1.5s 后变成线
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
        if(tabName==='entity')return;
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
                var elx=document.getElementById('entityListApp');
                if(elx){
                    elx.classList.remove('active','closing');
                    elx.style.visibility='hidden';
                }
            }else if(tabName==='me'){
                if(typeof window.openMePage==='function') window.openMePage();
                setTimeout(function(){
                    var elx=document.getElementById('entityListApp');
                    if(elx){elx.classList.remove('active','closing');elx.style.visibility='hidden';}
                },50);
            }
        },120);
    });
}

function openEditModal(entId){
    var el=document.getElementById('entityListApp');
    if(!el)return;
    var ents=getEntities();
    var ent=ents.find(function(e){return e.id===entId;});
    if(!ent)return;

    var color=ent.color||pickColor(ent.name);
    var initial=getInitial(ent.nickname||ent.name);
    var currentAvatar=ent.avatar||'';

    // 生成散布五角星 SVG
    var stars='';
    var starData=[
        {x:12,y:14,s:18,o:0.9,r:-15},{x:72,y:8,s:10,o:0.35,r:20},{x:88,y:30,s:14,o:0.7,r:-5},
        {x:55,y:22,s:8,o:0.5,r:35},{x:30,y:38,s:6,o:0.25,r:10},{x:78,y:52,s:11,o:0.6,r:-25},
        {x:18,y:58,s:7,o:0.3,r:15},{x:92,y:68,s:9,o:0.55,r:-10},{x:45,y:65,s:5,o:0.2,r:40},
        {x:62,y:78,s:13,o:0.75,r:-20},{x:-8,y:55,s:16,o:0.85,r:8},{x:25,y:-10,s:13,o:0.65,r:-18},
        {x:-5,y:20,s:9,o:0.4,r:25},{x:50,y:-8,s:7,o:0.45,r:12}
    ];
    starData.forEach(function(d){
        stars+='<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" '+
            'transform="translate('+(d.x*0.92)+','+(d.y*0.72)+') rotate('+d.r+',12,12) scale('+(d.s/24)+')" '+
            'fill="rgba(26,26,31,'+d.o+')" stroke="rgba(26,26,31,0.12)" stroke-width="0.5"/>';
    });

    var avHtml=currentAvatar
        ?'<img src="'+currentAvatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
        :'<span style="font-size:22px;font-weight:700;color:#fff;">'+initial+'</span>';

    var modal=document.createElement('div');
    modal.className='el-edit-modal';
    modal.id='elEditModal';
    modal.innerHTML=
        '<div class="el-edit-card" style="position:relative;overflow:hidden;">'+
            // 右上角头像区域
            '<div id="elEditAvatarZone" style="position:absolute;top:0;right:0;width:100px;height:100px;cursor:pointer;border-radius:0 24px 0 0;">'+
                '<div style="position:absolute;inset:0;background:#f0f0f2;border-radius:0 24px 0 60px;overflow:hidden;"></div>'+
                '<svg viewBox="-20 -20 120 92" style="position:absolute;inset:0;width:100%;height:100%;z-index:2;overflow:visible;filter:drop-shadow(0 0 0.5px rgba(255,255,255,0.15));">'+stars+'</svg>'+
                '<div id="elEditAvatarImg" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;overflow:hidden;">'+avHtml+'</div>'+
                '<div style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);font-size:8px;font-weight:800;color:rgba(26,26,31,0.55);letter-spacing:1px;white-space:nowrap;background:rgba(255,255,255,0.7);padding:2px 8px;border-radius:20px;backdrop-filter:blur(4px);">EDIT</div>'+
            '</div>'+
            '<input type="file" id="elEditAvatarInput" accept="image/*" style="display:none;">'+
            '<div class="el-edit-title" style="padding-right:80px;">Edit Entity</div>'+
            '<div class="el-edit-field">'+
                '<div class="el-edit-label">Name / 名字</div>'+
                '<input type="text" class="el-edit-input" id="elEditName" value="'+escapeHtml(ent.name)+'">'+
            '</div>'+
            '<div class="el-edit-field">'+
                '<div class="el-edit-label">Nickname / 备注</div>'+
                '<input type="text" class="el-edit-input" id="elEditNick" value="'+escapeHtml(ent.nickname||'')+'">'+
            '</div>'+
            '<div class="el-edit-field">'+
                '<div class="el-edit-label">Persona / 人设</div>'+
                '<textarea class="el-edit-textarea" id="elEditPersona">'+escapeHtml(ent.persona||'')+'</textarea>'+
            '</div>'+
            '<div class="el-edit-btns">'+
                '<button class="el-edit-btn cancel" id="elEditCancel">Cancel</button>'+
                '<button class="el-edit-btn save" id="elEditSave">Save</button>'+
            '</div>'+
        '</div>';

    el.appendChild(modal);

    var newAvatarData='';

    document.getElementById('elEditAvatarZone').addEventListener('click',function(){
        document.getElementById('elEditAvatarInput').click();
    });

    document.getElementById('elEditAvatarInput').addEventListener('change',function(e){
        var file=e.target.files[0];
        if(!file)return;
        var fileUrl=URL.createObjectURL(file);
        var img=new Image();
        img.onload=function(){
            var canvas=document.createElement('canvas');
            var size=200;canvas.width=size;canvas.height=size;
            var ctx=canvas.getContext('2d');
            var min=Math.min(img.width,img.height);
            var sx=(img.width-min)/2,sy=(img.height-min)/2;
            ctx.drawImage(img,sx,sy,min,min,0,0,size,size);
            newAvatarData=canvas.toDataURL('image/jpeg',0.7);
            document.getElementById('elEditAvatarImg').innerHTML='<img src="'+fileUrl+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
        };
        img.src=fileUrl;
    });

    modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
    document.getElementById('elEditCancel').addEventListener('click',function(){modal.remove();});
    document.getElementById('elEditSave').addEventListener('click',function(){
        var newName=document.getElementById('elEditName').value.trim();
        var newNick=document.getElementById('elEditNick').value.trim();
        var newPersona=document.getElementById('elEditPersona').value.trim();
        if(newName)ent.name=newName;
        ent.nickname=newNick||undefined;
        ent.persona=newPersona;
        if(newAvatarData)ent.avatar=newAvatarData;
        if(typeof ChatDB!=='undefined'&&ChatDB.saveEntity){
            ChatDB.saveEntity(ent);
        }
        modal.remove();
        render();
    });
}

function openNewModal(){
    var el=document.getElementById('entityListApp');
    if(!el)return;

    var modal=document.createElement('div');
    modal.className='el-edit-modal';
    modal.id='elNewModal';
    modal.style.cssText='position:fixed;inset:0;z-index:9999;background:#fff;overflow-y:auto;animation:el-reveal 0.35s cubic-bezier(0.16,1,0.3,1) forwards;';
    modal.innerHTML=
        '<div class="ne-page">'+
            '<div class="ne-hero">'+
                '<div class="ne-hero-gradient"></div>'+
                '<div class="ne-hero-noise"></div>'+
                '<div class="ne-hero-ring r1"></div>'+
                '<div class="ne-hero-ring r2"></div>'+
                '<div class="ne-hero-ring r3"></div>'+
                '<div class="ne-hero-line l1"></div>'+
                '<div class="ne-hero-line l2"></div>'+
                '<div class="ne-hero-dots"><div class="dot a" style="--o:0.2"></div><div class="dot b" style="--o:0.1"></div><div class="dot c" style="--o:0.06"></div><div class="dot d" style="--o:0.15"></div><div class="dot e" style="--o:0.08"></div></div>'+
                '<div class="ne-topbar">'+
                    '<div class="ne-back" id="neBack"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>'+
                    '<div class="ne-topbar-title">New Entity</div>'+
                    '<div class="ne-topbar-right"></div>'+
                '</div>'+
                '<div class="ne-avatar-wrap" id="neAvatarWrap">'+
                    '<div class="ne-avatar-orbit"></div>'+
                    '<div class="ne-avatar-inner" id="neAvatarInner"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>'+
                    '<div class="ne-avatar-badge"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>'+
                    '<input type="file" id="neAvatarInput" accept="image/*" style="display:none;">'+
                '</div>'+
                '<div class="ne-hero-hint">Tap to upload</div>'+
            '</div>'+
            '<div class="ne-card">'+
                '<div class="ne-card-handle"></div>'+
                '<div class="ne-card-corner tl"></div>'+
                '<div class="ne-card-corner br"></div>'+
                '<div class="ne-field">'+
                    '<div class="ne-field-label"><div class="ne-field-num">1</div><div class="ne-field-name">Name / 名字</div></div>'+
                    '<input type="text" class="ne-input" id="neNewName" placeholder="Give them a name...">'+
                '</div>'+
                '<div class="ne-field">'+
                    '<div class="ne-field-label"><div class="ne-field-num">2</div><div class="ne-field-name">Persona / 人设</div></div>'+
                    '<textarea class="ne-textarea" id="neNewPersona" placeholder="Describe their personality, tone, background..."></textarea>'+
                '</div>'+
                '<div class="ne-sep"><div class="ne-sep-line"></div><div class="ne-sep-dot"></div><div class="ne-sep-line"></div></div>'+
                '<div class="ne-field">'+
                    '<div class="ne-field-label"><div class="ne-field-num">3</div><div class="ne-field-name">Special Traits / 特殊设定</div></div>'+
                    '<div class="ne-field-sub">为角色添加额外的行为规则或特殊属性</div>'+
                    '<textarea class="ne-textarea" id="neNewTraits" style="height:80px;" placeholder="例如：会在句尾加颜文字、说话带口癖、容易害羞..."></textarea>'+
                '</div>'+
                '<button class="ne-submit" id="neSubmitBtn">'+
                    '<div class="ne-submit-shine"></div>'+
                    '<div class="ne-submit-text"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Initialize Entity</div>'+
                '</button>'+
                '<div class="ne-footer"><div class="ne-footer-brand">Story</div></div>'+
            '</div>'+
        '</div>';

    document.body.appendChild(modal);

    var neAvatarData='';

    // 返回
    document.getElementById('neBack').addEventListener('click',function(){
        modal.style.animation='el-hide 0.3s cubic-bezier(0.4,0,0.2,1) forwards';
        setTimeout(function(){modal.remove();},300);
    });

    // 头像上传
    document.getElementById('neAvatarWrap').addEventListener('click',function(){
        document.getElementById('neAvatarInput').click();
    });
    document.getElementById('neAvatarInput').addEventListener('change',function(e){
        var file=e.target.files[0];
        if(!file)return;
        var fileUrl=URL.createObjectURL(file);
        var img=new Image();
        img.onload=function(){
            // 小头像用于存储
            var canvas=document.createElement('canvas');
            var size=200;canvas.width=size;canvas.height=size;
            var ctx=canvas.getContext('2d');
            var min=Math.min(img.width,img.height);
            var sx=(img.width-min)/2,sy=(img.height-min)/2;
            ctx.drawImage(img,sx,sy,min,min,0,0,size,size);
            neAvatarData=canvas.toDataURL('image/jpeg',0.7);
            document.getElementById('neAvatarInner').innerHTML='<img src="'+fileUrl+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
            // 高清原图作为顶部背景
            var heroGrad=modal.querySelector('.ne-hero-gradient');
            if(heroGrad){
                heroGrad.style.backgroundImage='url('+fileUrl+')';
                heroGrad.style.backgroundSize='cover';
                heroGrad.style.backgroundPosition='center';
                // 叠加渐变遮罩保持右下白色晕染
                if(!modal.querySelector('.ne-hero-mask')){
                    var mask=document.createElement('div');
                    mask.className='ne-hero-mask';
                    mask.style.cssText='position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse at 70% 90%,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.3) 18%,rgba(0,0,0,0.1) 40%,rgba(0,0,0,0.45) 60%,rgba(0,0,0,0.65) 100%);';
                    heroGrad.parentNode.insertBefore(mask,heroGrad.nextSibling);
                }
            }
        };
        img.src=fileUrl;
    });

    // 提交
    document.getElementById('neSubmitBtn').addEventListener('click',function(){
        var name=document.getElementById('neNewName').value.trim();
        var persona=document.getElementById('neNewPersona').value.trim();
        var traits=document.getElementById('neNewTraits').value.trim();
        if(!name){
            document.getElementById('neNewName').style.borderBottomColor='#e04040';
            setTimeout(function(){var inp=document.getElementById('neNewName');if(inp)inp.style.borderBottomColor='';},1500);
            return;
        }
        var fullPersona=persona;
        if(traits)fullPersona=(fullPersona?fullPersona+'\n\n':'')+'[特殊设定] '+traits;

        var ent={
            id:'ent_'+Date.now(),
            name:name,
            persona:fullPersona,
            avatar:neAvatarData||'',
            color:pickColor(name),
            created:new Date().toISOString().split('T')[0]+' '+new Date().toTimeString().split(' ')[0].substring(0,5),
            unread:0
        };
        var ents=getEntities();
        ents.push(ent);
        window._caEntities=ents;
        if(!window._caConversations)window._caConversations={};
        window._caConversations[ent.id]=[];
        if(typeof ChatDB!=='undefined'){
            if(ChatDB.saveEntity)ChatDB.saveEntity(ent);
            if(ChatDB.saveConversation)ChatDB.saveConversation(ent.id,[]);
        }

        var btn=document.getElementById('neSubmitBtn');
        btn.style.background='#2d2d32';
        btn.querySelector('.ne-submit-text').innerHTML='<svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;"><polyline points="20 6 9 17 4 12"/></svg> Created';
        setTimeout(function(){
            modal.style.animation='el-hide 0.3s cubic-bezier(0.4,0,0.2,1) forwards';
            setTimeout(function(){modal.remove();render();},300);
        },800);
    });
}

function closeEntityList(){
    var el=document.getElementById('entityListApp');
    if(!el)return;
    var n1=document.getElementById('elPageNav');if(n1&&n1.parentNode)n1.parentNode.removeChild(n1);
    var n2=document.getElementById('mePageNav');if(n2&&n2.parentNode)n2.parentNode.removeChild(n2);
    el.classList.remove('active');
    el.classList.add('closing');
    setTimeout(function(){el.classList.remove('closing');},350);
}

window.openEntityList=function(){
    build();
    // 彻底重置元素状态
    var elPre=document.getElementById('entityListApp');
    if(elPre){
        elPre.style.cssText='';
        elPre.classList.remove('active','closing');
    }
    var doShow=function(){
        var el=document.getElementById('entityListApp');
        if(!el)return;
        el.style.cssText='';
        el.classList.remove('active','closing');
        // 强制 reflow，确保 active 动画重新触发
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

window.closeEntityList=closeEntityList;

})();
