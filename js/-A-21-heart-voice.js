// js/-A-21-heart-voice.js · 心声面板 v2
(function(){
'use strict';

var _built=false;
var _tagShown=false;
var _isDragging=false;
var _startY=0;
var _triggerVisible=false;
var _fetchRounds=3;
var _selectedMood='';

var moodSvgInline={
    happy:'<svg viewBox="0 0 24 24"><path d="M12 3 C12 3, 15 6, 18 6 C21 6, 22 4, 22 4 C22 4, 21 9, 18 11 C20 13, 21 16, 20 18 C19 20, 16 20, 14 19 C13 21, 12 22, 12 22 C12 22, 11 21, 10 19 C8 20, 5 20, 4 18 C3 16, 4 13, 6 11 C3 9, 2 4, 2 4 C2 4, 3 6, 6 6 C9 6, 12 3, 12 3Z" stroke-linejoin="round"/></svg>',
    love:'<svg viewBox="0 0 24 24"><path d="M12 20 C12 20, 3 14, 3 8 C3 5 5 3 7.5 3 C9.5 3 11 4.5 12 6.5 C13 4.5 14.5 3 16.5 3 C19 3 21 5 21 8 C21 14 12 20 12 20Z" stroke-linejoin="round"/></svg>',
    calm:'<svg viewBox="0 0 24 24"><path d="M3 12 Q6 8 9 12 Q12 16 15 12 Q18 8 21 12" fill="none" stroke-linecap="round"/><path d="M3 17 Q6 13 9 17 Q12 21 15 17 Q18 13 21 17" fill="none" stroke-linecap="round" opacity="0.4"/></svg>',
    sad:'<svg viewBox="0 0 24 24"><path d="M12 3 Q18 3 21 9 Q22 14 19 18 Q16 22 12 22 Q8 22 5 18 Q2 14 3 9 Q6 3 12 3Z" fill="none" stroke-linejoin="round"/><path d="M9 10 Q9.5 8.5 10 10" fill="none" stroke-linecap="round"/><path d="M14 10 Q14.5 8.5 15 10" fill="none" stroke-linecap="round"/><path d="M9 16 Q10.5 14.5 12 14.5 Q13.5 14.5 15 16" fill="none" stroke-linecap="round"/></svg>',
    anxious:'<svg viewBox="0 0 24 24"><path d="M12 2 L13.5 8 L19 6 L15 11 L21 12 L15 13 L19 18 L13.5 16 L12 22 L10.5 16 L5 18 L9 13 L3 12 L9 11 L5 6 L10.5 8 Z" stroke-linejoin="round"/></svg>'
};

function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}

function injectStyles(){
    if(document.getElementById('hv-style'))return;
    var s=document.createElement('style');
    s.id='hv-style';
    s.textContent=
        /* 热区（不可见，始终存在） */
        '#hvHotzone{position:fixed;top:0;left:50%;transform:translateX(-50%);width:80px;height:18px;z-index:1201;cursor:pointer;}'+

        /* 横杠 — 默认隐藏，点击热区后显示 */
        '#hvTrigger{position:fixed;top:0;left:50%;transform:translateX(-50%);width:44px;height:14px;display:flex;align-items:center;justify-content:center;z-index:1200;touch-action:none;opacity:0;pointer-events:none;transition:opacity 0.3s;}'+
        '#hvTrigger.revealed{opacity:1;pointer-events:auto;}'+
        '#hvTrigger-dot{width:28px;height:3px;border-radius:2px;background:rgba(26,26,31,0.25);transition:background 0.2s;}'+

        /* tag */
        '#hvTag{position:fixed;top:0;left:50%;transform:translateX(-50%) translateY(-100%);z-index:1190;transition:transform 0.45s cubic-bezier(0.16,1,0.3,1);cursor:pointer;}'+
        '#hvTag.open{transform:translateX(-50%) translateY(0);}'+
        '.hv-tag-shape{position:relative;width:120px;height:72px;background:#1a1a1f;clip-path:polygon(0% 0%,38% 0%,50% 18%,62% 0%,100% 0%,100% 75%,50% 100%,0% 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:14px;}'+
        /* 白边用 SVG overlay 实现完整轮廓 */
        '.hv-tag-border{position:absolute;inset:0;pointer-events:none;}'+
        '.hv-tag-border svg{width:100%;height:100%;}'+
        '.hv-tag-bg{position:absolute;bottom:10px;left:0;right:0;text-align:center;font-size:22px;font-weight:900;color:rgba(255,255,255,0.04);letter-spacing:1px;pointer-events:none;font-style:italic;}'+
        '.hv-tag-heart{position:relative;z-index:1;margin-bottom:4px;}'+
        '.hv-tag-heart svg{width:18px;height:16px;}'+
        '.hv-tag-lbl{position:relative;z-index:1;font-size:6.5px;font-weight:800;letter-spacing:2px;color:rgba(255,255,255,0.3);text-transform:uppercase;}'+

        /* 面板 */
        '#hvPanel{position:fixed;inset:0;max-width:430px;margin:0 auto;background:#1a1a1f;z-index:1180;transform:translateY(-100%);transition:transform 0.5s cubic-bezier(0.16,1,0.3,1);display:flex;flex-direction:column;overflow:hidden;}'+
        '#hvPanel.open{transform:translateY(0);}'+
        '.hv-grain{position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E");opacity:0.4;pointer-events:none;}'+
        '.hv-header{position:relative;z-index:1;padding:52px 28px 24px;display:flex;align-items:flex-end;justify-content:space-between;flex-shrink:0;}'+
        '.hv-eyebrow{font-size:8px;font-weight:800;letter-spacing:3px;color:rgba(255,255,255,0.2);text-transform:uppercase;margin-bottom:6px;}'+
        '.hv-title{font-size:32px;font-weight:300;color:#fff;letter-spacing:-0.5px;line-height:1;}'+
        '.hv-title b{font-weight:800;}'+
        '.hv-close{width:32px;height:32px;border-radius:50%;border:0.5px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(255,255,255,0.04);flex-shrink:0;}'+
        '.hv-close svg{width:14px;height:14px;stroke:rgba(255,255,255,0.4);fill:none;stroke-width:2;stroke-linecap:round;}'+
        '.hv-divider{position:relative;z-index:1;flex-shrink:0;margin:0 28px;height:0.5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);}'+
        '.hv-body{position:relative;z-index:1;flex:1;overflow-y:auto;padding:32px 28px 40px;-webkit-overflow-scrolling:touch;}'+

        /* 对方心声沉浸区 */
        '.hv-their-wrap{position:relative;margin-bottom:36px;min-height:120px;display:flex;flex-direction:column;align-items:center;}'+
        '.hv-empty-state{text-align:center;padding:20px 0 8px;}'+
        '.hv-empty-line1{font-size:11px;font-weight:300;color:rgba(255,255,255,0.18);letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;}'+
        '.hv-empty-line2{font-size:10px;color:rgba(255,255,255,0.08);letter-spacing:1px;font-style:italic;}'+

        /* 心声卡片 */
        '.hv-voice-card{width:100%;padding:28px 24px 24px;position:relative;opacity:0;transform:translateY(12px);transition:opacity 0.8s ease,transform 0.8s ease;}'+
        '.hv-voice-card.visible{opacity:1;transform:translateY(0);}'+
        '.hv-quote-mark{font-size:64px;line-height:1;color:rgba(255,255,255,0.04);font-family:Georgia,serif;position:absolute;top:8px;left:18px;pointer-events:none;}'+
        '.hv-voice-text{font-size:19px;font-weight:300;color:rgba(255,255,255,0.82);line-height:1.7;letter-spacing:0.3px;text-align:center;position:relative;z-index:1;margin-bottom:20px;font-style:italic;}'+
        '.hv-voice-meta{display:flex;align-items:center;justify-content:center;gap:10px;}'+
        '.hv-voice-line{flex:1;height:0.5px;background:rgba(255,255,255,0.07);}'+
        '.hv-voice-sig{display:flex;align-items:center;gap:6px;}'+
        '.hv-voice-name{font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.2);text-transform:uppercase;}'+
        '.hv-voice-dot{width:2px;height:2px;border-radius:50%;background:rgba(255,255,255,0.15);}'+
        '.hv-voice-time{font-size:9px;color:rgba(255,255,255,0.15);font-family:monospace;}'+
        '.hv-voice-mood svg{width:11px;height:11px;stroke:rgba(255,255,255,0.25);fill:none;stroke-width:2;stroke-linecap:round;}'+

        /* 调取行 */
        '.hv-fetch-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;}'+
        '.hv-fetch-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;border:0.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);font-size:10px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:1px;cursor:pointer;transition:all 0.2s;}'+
        '.hv-fetch-btn:active{transform:scale(0.96);}'+
        '.hv-fetch-btn svg{width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;}'+
        '.hv-rounds-wrap{display:flex;align-items:center;gap:8px;}'+
        '.hv-rounds-label{font-size:9px;color:rgba(255,255,255,0.2);letter-spacing:1px;}'+
        '.hv-rounds-btn{width:22px;height:22px;border-radius:50%;border:0.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(255,255,255,0.35);cursor:pointer;transition:all 0.15s;line-height:1;}'+
        '.hv-rounds-btn:active{transform:scale(0.88);}'+
        '.hv-rounds-val{font-size:12px;font-weight:800;color:rgba(255,255,255,0.5);min-width:16px;text-align:center;font-family:monospace;}'+

        /* view all */
        '.hv-viewall{text-align:center;font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.2);text-transform:uppercase;cursor:pointer;padding:6px 0 16px;transition:color 0.2s;}'+
        '.hv-their-history{overflow:hidden;max-height:0;transition:max-height 0.45s cubic-bezier(0.16,1,0.3,1);margin-bottom:0;}'+
        '.hv-their-history.open{max-height:600px;margin-bottom:16px;}'+
        '.hv-their-hist-item{padding:8px 0;border-bottom:0.5px solid rgba(255,255,255,0.04);display:flex;align-items:center;gap:8px;}'+
        '.hv-their-hist-text{font-size:12px;color:rgba(255,255,255,0.4);line-height:1.5;flex:1;font-style:italic;}'+
        '.hv-their-hist-time{font-size:7.5px;color:rgba(255,255,255,0.15);font-family:monospace;flex-shrink:0;}'+
        '.hv-their-hist-del{font-size:10px;color:rgba(255,255,255,0.15);cursor:pointer;padding:2px 4px;transition:color 0.15s;flex-shrink:0;}'+

        /* 分隔 */
        '.hv-mid-div{display:flex;align-items:center;gap:10px;margin:0 0 24px;}'+
        '.hv-mid-div::before,.hv-mid-div::after{content:"";flex:1;height:0.5px;background:rgba(255,255,255,0.07);}'+
        '.hv-mid-lbl{font-size:7px;font-weight:800;letter-spacing:2px;color:rgba(255,255,255,0.15);text-transform:uppercase;white-space:nowrap;}'+

        /* 输入 */
        '.hv-input-lbl{font-size:8px;font-weight:800;letter-spacing:2px;color:rgba(255,255,255,0.2);text-transform:uppercase;margin-bottom:10px;}'+
        '.hv-textarea{width:100%;min-height:64px;max-height:100px;background:rgba(255,255,255,0.03);border:0.5px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.5;color:#fff;font-family:inherit;resize:none;outline:none;transition:border-color 0.2s;margin-bottom:16px;}'+
        '.hv-textarea::placeholder{color:rgba(255,255,255,0.15);}'+
        '.hv-textarea:focus{border-color:rgba(255,255,255,0.18);}'+

        /* 心情 */
        '.hv-mood-lbl{font-size:8px;font-weight:800;letter-spacing:2px;color:rgba(255,255,255,0.2);text-transform:uppercase;margin-bottom:12px;}'+
        '.hv-moods{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;}'+
        '.hv-mood{padding:7px 14px;border-radius:50px;border:0.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);font-size:11px;color:rgba(255,255,255,0.4);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px;}'+
        '.hv-mood svg{width:12px;height:12px;flex-shrink:0;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;}'+
        '.hv-mood:active{transform:scale(0.95);}'+
        '.hv-mood.active{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.25);color:#fff;}'+

        /* 提交 */
        '.hv-submit{width:100%;padding:14px;background:#fff;border:none;border-radius:50px;font-size:11px;font-weight:800;letter-spacing:2px;color:#1a1a1f;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform 0.15s,opacity 0.15s;margin-bottom:20px;}'+
        '.hv-submit:active{transform:scale(0.97);opacity:0.85;}'+
        '.hv-submit svg{width:13px;height:13px;fill:#1a1a1f;}'+

        /* 历史 */
        '.hv-hist-lbl{font-size:8px;font-weight:800;letter-spacing:2px;color:rgba(255,255,255,0.2);text-transform:uppercase;margin-bottom:12px;}'+
        '.hv-entry{padding:8px 0;border-bottom:0.5px solid rgba(255,255,255,0.05);margin-bottom:2px;}'+
        '.hv-entry-top{display:flex;align-items:center;gap:8px;margin-bottom:3px;}'+
        '.hv-entry-del{margin-left:auto;font-size:10px;color:rgba(255,255,255,0.15);cursor:pointer;padding:2px 4px;transition:color 0.15s;}'+
        '.hv-entry-moodsvg{width:11px;height:11px;opacity:0.4;stroke:rgba(255,255,255,0.8);fill:none;stroke-width:2;stroke-linecap:round;}'+
        '.hv-entry-time{font-size:8px;color:rgba(255,255,255,0.2);font-family:monospace;margin-left:auto;}'+
        '.hv-entry-text{font-size:13px;color:rgba(255,255,255,0.5);line-height:1.5;}'+

        /* 空/加载 */
        '@keyframes hvPulse{0%,100%{opacity:0.2;}50%{opacity:0.6;}}'+
        '.hv-loading{text-align:center;padding:28px 0;}'+
        '.hv-loading-dots{display:inline-flex;gap:5px;}'+
        '.hv-loading-dots span{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.25);animation:hvPulse 1.2s infinite;}'+
        '.hv-loading-dots span:nth-child(2){animation-delay:0.2s;}'+
        '.hv-loading-dots span:nth-child(3){animation-delay:0.4s;}'+

        '.hv-footer{text-align:center;font-size:9px;font-weight:700;color:rgba(255,255,255,0.06);letter-spacing:3px;padding-bottom:20px;}';
    document.head.appendChild(s);
}

function build(){
    if(_built)return;
    _built=true;
    injectStyles();

    // 热区（透明，始终存在，用于首次点击激活横杠）
    var hotzone=document.createElement('div');
    hotzone.id='hvHotzone';
    document.body.appendChild(hotzone);

    // 横杠
    var trigger=document.createElement('div');
    trigger.id='hvTrigger';
    trigger.innerHTML='<div id="hvTrigger-dot"></div>';
    document.body.appendChild(trigger);

    // tag（带完整白边 SVG）
    var tag=document.createElement('div');
    tag.id='hvTag';
    tag.innerHTML=
        '<div class="hv-tag-shape">'+
            // SVG 白边：完整描边 polygon 路径
            '<div class="hv-tag-border"><svg viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="0,0 45.6,0 60,12.96 74.4,0 120,0 120,54 60,72 0,54" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" fill="none"/></svg></div>'+
            '<div class="hv-tag-bg">voice</div>'+
            '<div class="hv-tag-heart"><svg viewBox="0 0 24 22" fill="none"><path d="M12 19.5C12 19.5 1 12.5 1 5.8C1 2.8 3.2 1 5.8 1C7.8 1 9.5 2.2 12 5C14.5 2.2 16.2 1 18.2 1C20.8 1 23 2.8 23 5.8C23 12.5 12 19.5 12 19.5Z" fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/></svg></div>'+
            '<div class="hv-tag-lbl">Heart Voice</div>'+
        '</div>';
    document.body.appendChild(tag);

    // 面板
    var panel=document.createElement('div');
    panel.id='hvPanel';
    panel.innerHTML=
        '<div class="hv-grain"></div>'+
        '<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:visible;" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="8,7 8.5,8.2 9.8,8.2 8.7,9 9.1,10.2 8,9.4 6.9,10.2 7.3,9 6.2,8.2 7.5,8.2" fill="rgba(255,255,255,0.18)"/><polygon points="85,4 85.4,5 86.5,5 85.6,5.6 85.9,6.6 85,6 84.1,6.6 84.4,5.6 83.5,5 84.6,5" fill="rgba(255,255,255,0.14)"/><polygon points="94,18 94.3,19 95.4,19 94.5,19.6 94.8,20.6 94,20 93.2,20.6 93.5,19.6 92.6,19 93.7,19" fill="rgba(255,255,255,0.16)"/><polygon points="4,30 4.3,31 5.4,31 4.5,31.6 4.8,32.6 4,32 3.2,32.6 3.5,31.6 2.6,31 3.7,31" fill="rgba(255,255,255,0.12)"/><polygon points="97,42 97.3,43 98.4,43 97.5,43.6 97.8,44.6 97,44 96.2,44.6 96.5,43.6 95.6,43 96.7,43" fill="rgba(255,255,255,0.14)"/><polygon points="3,55 3.3,56 4.4,56 3.5,56.6 3.8,57.6 3,57 2.2,57.6 2.5,56.6 1.6,56 2.7,56" fill="rgba(255,255,255,0.1)"/><polygon points="91,62 91.3,63 92.4,63 91.5,63.6 91.8,64.6 91,64 90.2,64.6 90.5,63.6 89.6,63 90.7,63" fill="rgba(255,255,255,0.13)"/><polygon points="15,72 15.3,73 16.4,73 15.5,73.6 15.8,74.6 15,74 14.2,74.6 14.5,73.6 13.6,73 14.7,73" fill="rgba(255,255,255,0.1)"/><polygon points="52,85 52.3,86 53.4,86 52.5,86.6 52.8,87.6 52,87 51.2,87.6 51.5,86.6 50.6,86 51.7,86" fill="rgba(255,255,255,0.09)"/><polygon points="75,12 75.3,13 76.4,13 75.5,13.6 75.8,14.6 75,14 74.2,14.6 74.5,13.6 73.6,13 74.7,13" fill="rgba(255,255,255,0.12)"/><polygon points="35,45 35.3,46 36.4,46 35.5,46.6 35.8,47.6 35,47 34.2,47.6 34.5,46.6 33.6,46 34.7,46" fill="rgba(255,255,255,0.09)"/><polygon points="65,76 65.3,77 66.4,77 65.5,77.6 65.8,78.6 65,78 64.2,78.6 64.5,77.6 63.6,77 64.7,77" fill="rgba(255,255,255,0.08)"/><polygon points="25,18 25.3,19 26.4,19 25.5,19.6 25.8,20.6 25,20 24.2,20.6 24.5,19.6 23.6,19 24.7,19" fill="rgba(255,255,255,0.11)"/><polygon points="48,3 48.3,4 49.4,4 48.5,4.6 48.8,5.6 48,5 47.2,5.6 47.5,4.6 46.6,4 47.7,4" fill="rgba(255,255,255,0.13)"/><polygon points="78,50 78.3,51 79.4,51 78.5,51.6 78.8,52.6 78,52 77.2,52.6 77.5,51.6 76.6,51 77.7,51" fill="rgba(255,255,255,0.1)"/><polygon points="58,35 58.3,36 59.4,36 58.5,36.6 58.8,37.6 58,37 57.2,37.6 57.5,36.6 56.6,36 57.7,36" fill="rgba(255,255,255,0.08)"/><polygon points="12,92 12.3,93 13.4,93 12.5,93.6 12.8,94.6 12,94 11.2,94.6 11.5,93.6 10.6,93 11.7,93" fill="rgba(255,255,255,0.07)"/></svg>'+
        '<div class="hv-header">'+
            '<div><div class="hv-eyebrow">Inner Voice · 心声</div><div class="hv-title">How are<br>you <b>feeling?</b></div></div>'+
            '<div class="hv-close" id="hvClose"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>'+
        '</div>'+
        '<div class="hv-divider"></div>'+
        '<div class="hv-body">'+
            '<div class="hv-their-wrap" id="hvTheirWrap">'+
                '<div class="hv-empty-state" id="hvEmptyState">'+
                    '<div class="hv-empty-line1">No voice yet</div>'+
                    '<div class="hv-empty-line2">their words will appear here</div>'+
                '</div>'+
            '</div>'+
            '<div class="hv-fetch-row">'+
                '<div class="hv-fetch-btn" id="hvFetchBtn"><svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Fetch Voice</div>'+
                '<div class="hv-rounds-wrap">'+
                    '<div class="hv-rounds-label">rounds</div>'+
                    '<div class="hv-rounds-btn" id="hvRoundsMinus">−</div>'+
                    '<div class="hv-rounds-val" id="hvRoundsVal">3</div>'+
                    '<div class="hv-rounds-btn" id="hvRoundsPlus">+</div>'+
                '</div>'+
            '</div>'+
            '<div class="hv-viewall" id="hvViewAll" style="display:none;">View All</div>'+
            '<div class="hv-their-history" id="hvTheirHistory"></div>'+
            '<div class="hv-mid-div"><div class="hv-mid-lbl">My Voice · 我的心声</div></div>'+
            '<div class="hv-input-lbl">Write it out · 说出来</div>'+
            '<textarea class="hv-textarea" id="hvTextarea" placeholder="今天想说点什么..."></textarea>'+
            '<div class="hv-mood-lbl">Mood · 此刻心情</div>'+
            '<div class="hv-moods" id="hvMoods">'+
                '<div class="hv-mood" data-mood="happy">'+moodSvgInline.happy+'开心</div>'+
                '<div class="hv-mood" data-mood="love">'+moodSvgInline.love+'心动</div>'+
                '<div class="hv-mood" data-mood="calm">'+moodSvgInline.calm+'平静</div>'+
                '<div class="hv-mood" data-mood="sad">'+moodSvgInline.sad+'难过</div>'+
                '<div class="hv-mood" data-mood="anxious">'+moodSvgInline.anxious+'焦虑</div>'+
            '</div>'+
            '<button class="hv-submit" id="hvSubmit"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>Record · 记录</button>'+
            '<div class="hv-hist-lbl" id="hvHistLbl" style="display:none;">Recent · 最近</div>'+
            '<div id="hvHistory"></div>'+
            '<div class="hv-footer">A0nynx_3i · Heart Voice</div>'+
        '</div>';
    document.body.appendChild(panel);

    bindEvents();
}

function bindEvents(){
    var hotzone=document.getElementById('hvHotzone');
    var trigger=document.getElementById('hvTrigger');
    var tag=document.getElementById('hvTag');
    var panel=document.getElementById('hvPanel');

    // 热区点击 → 横杠显示
    function revealTrigger(){
        if(!_triggerVisible){
            _triggerVisible=true;
            trigger.classList.add('revealed');
        }
    }
    hotzone.addEventListener('click',revealTrigger);

    // 热区拖拽（点击后直接可拖）
    hotzone.addEventListener('touchstart',function(e){
        revealTrigger();
        _startY=e.touches[0].clientY;
        _isDragging=true;
    },{passive:true});
    hotzone.addEventListener('mousedown',function(e){
        if(_triggerVisible){_startY=e.clientY;_isDragging=true;}
    });

    // 横杠拖拽
    trigger.addEventListener('touchstart',function(e){
        _startY=e.touches[0].clientY;_isDragging=true;
    },{passive:true});
    trigger.addEventListener('mousedown',function(e){
        _startY=e.clientY;_isDragging=true;
    });

    document.addEventListener('touchmove',function(e){
        if(!_isDragging||!_triggerVisible)return;
        if(e.touches[0].clientY-_startY>28&&!_tagShown){
            _tagShown=true;tag.classList.add('open');
        }
    },{passive:true});
    document.addEventListener('mousemove',function(e){
        if(!_isDragging||!_triggerVisible)return;
        if(e.clientY-_startY>28&&!_tagShown){
            _tagShown=true;tag.classList.add('open');
        }
    });
    document.addEventListener('touchend',function(){_isDragging=false;});
    document.addEventListener('mouseup',function(){_isDragging=false;});

    // 点击空白关闭 tag
    document.addEventListener('click',function(e){
        if(_tagShown&&!tag.contains(e.target)&&e.target!==trigger&&!hotzone.contains(e.target)){
            tag.classList.remove('open');
            _tagShown=false;
        }
    });

    // tag 点击打开面板
    tag.addEventListener('click',function(e){
        e.stopPropagation();
        panel.classList.add('open');
        tag.classList.remove('open');
        _tagShown=false;
        loadMy();
    });

    // 关闭面板
    document.getElementById('hvClose').addEventListener('click',function(){
        panel.classList.remove('open');
    });

    // 轮数
    document.getElementById('hvRoundsMinus').addEventListener('click',function(){
        if(_fetchRounds>1){_fetchRounds--;document.getElementById('hvRoundsVal').textContent=_fetchRounds;}
    });
    document.getElementById('hvRoundsPlus').addEventListener('click',function(){
                if(_fetchRounds<10){_fetchRounds++;document.getElementById('hvRoundsVal').textContent=_fetchRounds;}
    });

    // Fetch Voice
    function doFetch(forceRefresh){
        var btn=document.getElementById('hvFetchBtn');
        var wrap=document.getElementById('hvTheirWrap');
        var emptyState=document.getElementById('hvEmptyState');
        if(forceRefresh){
            _theirVoiceCache=null;
            // 清除内存缓存，但不删 localStorage（新结果会追加）
            // 需要临时标记跳过 localStorage 读取
            _skipStoredCache=true;
        }

        var old=wrap.querySelector('.hv-voice-card');
        if(old)old.remove();
        emptyState.style.display='block';
        emptyState.innerHTML='<div class="hv-loading"><div class="hv-loading-dots"><span></span><span></span><span></span></div></div>';
        btn.style.opacity='0.35';btn.style.pointerEvents='none';
        fetchTheirVoice(_fetchRounds,function(pool){
            if(!pool||!pool.length){
                emptyState.innerHTML='<div class="hv-empty-line1">No voice yet</div><div class="hv-empty-line2">请先配置 API Key 后长按调取</div>';
                btn.style.opacity='1';btn.style.pointerEvents='auto';
                return;
            }
            var e=pool[Math.floor(Math.random()*Math.min(_fetchRounds,pool.length))];
            emptyState.style.display='none';
            var card=document.createElement('div');
            card.className='hv-voice-card';
            card.innerHTML=
                '<div class="hv-quote-mark">"</div>'+
                '<div class="hv-voice-text">'+esc(e.text)+'</div>'+
                '<div class="hv-voice-meta">'+
                    '<div class="hv-voice-line"></div>'+
                    '<div class="hv-voice-sig">'+
                        (e.mood&&moodSvgInline[e.mood]?'<div class="hv-voice-mood">'+moodSvgInline[e.mood]+'</div>':'')+
                        '<span class="hv-voice-name">'+esc(e.name||'TA')+'</span>'+
                        '<div class="hv-voice-dot"></div>'+
                        '<span class="hv-voice-time">'+esc(e.time||'')+'</span>'+
                    '</div>'+
                    '<div class="hv-voice-line"></div>'+
                '</div>';
            wrap.appendChild(card);
            requestAnimationFrame(function(){requestAnimationFrame(function(){card.classList.add('visible');});});
            btn.style.opacity='1';btn.style.pointerEvents='auto';
            document.getElementById('hvViewAll').style.display='block';
        });
    }

    var _fetchBtn=document.getElementById('hvFetchBtn');
    var _fetchLongTimer=null;
    var _fetchLongFired=false;

    _fetchBtn.addEventListener('touchstart',function(){
        _fetchLongFired=false;
        _fetchLongTimer=setTimeout(function(){
            _fetchLongFired=true;
            doFetch(true);
        },600);
    },{passive:true});
    _fetchBtn.addEventListener('touchend',function(){
        clearTimeout(_fetchLongTimer);
    },{passive:true});
    _fetchBtn.addEventListener('touchmove',function(){
        clearTimeout(_fetchLongTimer);
    },{passive:true});
    _fetchBtn.addEventListener('click',function(){
        if(_fetchLongFired){_fetchLongFired=false;return;}
        doFetch(false);
    });
    _fetchBtn.addEventListener('mousedown',function(){
        _fetchLongFired=false;
        _fetchLongTimer=setTimeout(function(){
            _fetchLongFired=true;
            doFetch(true);
        },600);
    });
    _fetchBtn.addEventListener('mouseup',function(){clearTimeout(_fetchLongTimer);});
    _fetchBtn.addEventListener('mouseleave',function(){clearTimeout(_fetchLongTimer);});


    // View All
    var viewAll=document.getElementById('hvViewAll');
    var theirHistory=document.getElementById('hvTheirHistory');
    viewAll.addEventListener('click',function(){
        if(!theirHistory.classList.contains('open')){
            renderTheirHistory();
            theirHistory.style.display='block';
            requestAnimationFrame(function(){theirHistory.classList.add('open');});
            viewAll.textContent='Collapse ↑';
        }else{
            theirHistory.classList.remove('open');
            setTimeout(function(){theirHistory.style.display='none';},450);
            viewAll.textContent='View All';
        }
    });

    // 心情选择
    document.getElementById('hvMoods').addEventListener('click',function(e){
        var m=e.target.closest('.hv-mood');if(!m)return;
        document.getElementById('hvMoods').querySelectorAll('.hv-mood').forEach(function(x){x.classList.remove('active');});
        m.classList.add('active');
        _selectedMood=m.dataset.mood;
    });

    // 提交
    document.getElementById('hvSubmit').addEventListener('click',function(){
        var text=document.getElementById('hvTextarea').value.trim();
        if(!text)return;
        var entries=JSON.parse(localStorage.getItem('ca-heart-my')||'[]');
        var now=new Date();
        var t=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
        entries.unshift({text:text,mood:_selectedMood,time:t});
        localStorage.setItem('ca-heart-my',JSON.stringify(entries));
        document.getElementById('hvTextarea').value='';
        document.getElementById('hvMoods').querySelectorAll('.hv-mood').forEach(function(x){x.classList.remove('active');});
        _selectedMood='';
        var btn=document.getElementById('hvSubmit');
        btn.textContent='✓ Saved';
        setTimeout(function(){
            btn.innerHTML='<svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:#1a1a1f;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>Record · 记录';
        },1000);
        // 发送心声卡片到聊天室
        sendHvCardToChat({text:text,mood:_selectedMood});
        loadMy();
    });
}

var _cardStyleIdx=0;
var _theirVoiceCache=null;
var _skipStoredCache=false;

function saveTheirCache(arr){
    _theirVoiceCache=arr;
    var entId=window._cdaCurrentEntId;
    if(entId){
        var existing=[];try{existing=JSON.parse(localStorage.getItem('ca-hv-their-'+entId)||'[]');}catch(e){existing=[];}
        var merged=existing.concat(arr);
        localStorage.setItem('ca-hv-their-'+entId,JSON.stringify(merged));
        _theirVoiceCache=merged;
    }
}

var _skipStoredCache=false;

function fetchTheirVoice(rounds,cb){
    // 如果已有内存缓存，直接返回
    if(_theirVoiceCache&&_theirVoiceCache.length){cb(_theirVoiceCache);return;}
    // 从 localStorage 加载持久化历史（除非强制刷新跳过）
    if(!_skipStoredCache){
        var entId=window._cdaCurrentEntId;
        var stored=[];
        try{stored=JSON.parse(localStorage.getItem('ca-hv-their-'+entId)||'[]');}catch(e){stored=[];}
        if(stored.length){_theirVoiceCache=stored;cb(stored);return;}
    }
    _skipStoredCache=false;

    var entId=window._cdaCurrentEntId;
    if(!entId||!window._caConversations||!window._caConversations[entId]){cb([]);return;}
    var entities=window._caEntities||[];
    var ent=entities.find(function(e){return e.id===entId;});
    if(!ent){cb([]);return;}

    var msgs=window._caConversations[entId]||[];
    var assistantMsgs=[];
    for(var i=msgs.length-1;i>=0&&assistantMsgs.length<rounds*4;i--){
        if(msgs[i].role==='assistant'&&msgs[i].text)assistantMsgs.unshift(msgs[i]);
    }
    if(!assistantMsgs.length){cb([]);return;}

    var apiConfig;
    try{apiConfig=JSON.parse(localStorage.getItem('ca-api-config')||'{}');}catch(e){apiConfig={};}
    var node=apiConfig.node||'primary';
    var cfg=apiConfig[node]||{};
    if(!cfg.key){cb([]);return;}

    var ep=(cfg.endpoint||'https://api.openai.com/v1').replace(/\/+$/,'');
    if(ep.indexOf('/chat/completions')===-1){ep+=ep.match(/\/v\d+$/)?'/chat/completions':'/v1/chat/completions';}

    var dispName=ent.nickname||ent.name;
    var transcript=assistantMsgs.slice(-rounds*2).map(function(m){
        return m.text.replace(/\[♪♫\][\s\S]*?\[\/♪♫\]/g,'').replace(/\|\|\|\|/g,' ').replace(/\[SYS_TIME:[^\]]*\]/gi,'').trim();
    }).filter(function(t){return t.length>0;}).join('\n');

    var prompt='你是一个深度情感解读助手，擅长从对话中挖掘角色真实的内心世界。\n\n'+
        '以下是AI角色"'+dispName+'"最近说的话：\n\n'+transcript+'\n\n'+
        '请深入分析这些对话，提炼出'+rounds+'条真实、细腻、有温度的"心声"。\n'+
        '要求：\n'+
        '- 每条心声要有具体的情感细节，不要泛泛而谈（如"今天看到夕阳，突然很想你在身边"而不是"想你了"）\n'+
        '- 用第一人称，像真实的内心独白，可以有点文学性\n'+
        '- 长度20-40字，要有画面感或具体场景\n'+
        '- mood选择：happy/love/calm/sad/anxious\n'+
        '- time从对话时间推断（HH:MM格式）\n\n'+
        '只输出JSON数组，格式：[{"text":"...","mood":"...","time":"..."}]';

    fetch(ep,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.key},
        body:JSON.stringify({model:cfg.model||'gpt-4o',messages:[{role:'user',content:prompt}],max_tokens:600,temperature:0.85})
    })
    .then(function(r){return r.json();})
    .then(function(data){
        var content=data.choices&&data.choices[0]&&data.choices[0].message?data.choices[0].message.content:'';
        var match=content.match(/\[[\s\S]*\]/);
        if(match){
            try{
                var parsed=JSON.parse(match[0]);
                var result=parsed.map(function(item){
                    return {name:dispName,avatar:ent.avatar||'',text:item.text||'',mood:item.mood||'calm',time:item.time||''};
                });
                // 追加到持久化历史
                var entId2=window._cdaCurrentEntId;
                var existing2=[];try{existing2=JSON.parse(localStorage.getItem('ca-hv-their-'+entId2)||'[]');}catch(e){existing2=[];}
                var merged=existing2.concat(result);
                localStorage.setItem('ca-hv-their-'+entId2,JSON.stringify(merged));
                _theirVoiceCache=merged;
                cb(result);
                return;
            }catch(ex){}
        }
        cb([]);
    })
    .catch(function(){cb([]);});
}

function extractFromMsgs(msgs,ent,rounds){
    var dispName=ent.nickname||ent.name;
    return msgs.slice(-rounds).map(function(m){
        var text=m.text.replace(/\[♪♫\][\s\S]*?\[\/♪♫\]/g,'').replace(/\|\|\|\|/g,' ').replace(/\[SYS_TIME:[^\]]*\]/gi,'').trim();
        var firstLine=text.split('\n')[0].trim().substring(0,30);
        var now=new Date(m.time?m.time.replace(/-/g,'/'):'');
        var t=isNaN(now.getTime())?'':String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
        return {name:dispName,avatar:ent.avatar||'',text:firstLine,mood:'calm',time:t};
    }).filter(function(x){return x.text.length>0;});
}

function renderTheirHistory(){
    var history=document.getElementById('hvTheirHistory');
    if(!history)return;
    var entId=window._cdaCurrentEntId;
    var pool=[];
    try{pool=JSON.parse(localStorage.getItem('ca-hv-their-'+entId)||'[]');}catch(e){pool=[];}
    if(!pool.length){history.innerHTML='<div style="font-size:11px;color:rgba(255,255,255,0.15);text-align:center;padding:12px 0;">先点 Fetch Voice 调取</div>';return;}
    history.innerHTML=pool.map(function(e,i){
        return '<div class="hv-their-hist-item" data-idx="'+i+'">'+
            '<span class="hv-their-hist-text">— '+esc(e.text)+'</span>'+
            '<span class="hv-their-hist-time">'+esc(e.time)+'</span>'+
            '<span class="hv-their-hist-del" data-idx="'+i+'" style="display:none;">✕</span>'+
        '</div>';
    }).join('');
    history.querySelectorAll('.hv-their-hist-item').forEach(function(item){
        item.addEventListener('click',function(ev){
            if(ev.target.classList.contains('hv-their-hist-del'))return;
            var del=item.querySelector('.hv-their-hist-del');
            if(del)del.style.display=del.style.display==='none'?'inline':'none';
        });
    });
    history.querySelectorAll('.hv-their-hist-del').forEach(function(btn){
        btn.addEventListener('click',function(ev){
            ev.stopPropagation();
            var idx=parseInt(btn.dataset.idx);
            var arr=[];try{arr=JSON.parse(localStorage.getItem('ca-hv-their-'+entId)||'[]');}catch(e){arr=[];}
            arr.splice(idx,1);
            localStorage.setItem('ca-hv-their-'+entId,JSON.stringify(arr));
            _theirVoiceCache=arr;
            renderTheirHistory();
        });
    });
}

// 心声通知卡片样式（3种轮换）
window.buildHvCardHtml=function(entry,styleIdx,userInfo){
    var _uName=(userInfo&&userInfo.name)||'我';
    var _uInitial=(userInfo&&userInfo.initial)||_uName.charAt(0);
    var _uAvatar=(userInfo&&userInfo.avatar)||'';
    var now=new Date();
    var t=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    var moodLabel={happy:'开心',love:'心动',calm:'平静',sad:'难过',anxious:'焦虑'};
    var moodSvgMap={
        happy:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
        love:'<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        calm:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>',
        sad:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
        anxious:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'
    };
    var mood=entry.mood||'calm';
    var moodSvg=moodSvgMap[mood]||moodSvgMap.calm;
    var moodLbl=moodLabel[mood]||'';
    var textHtml=esc(entry.text);
    // 给关键词加下划线（简单：给第一个名词/情感词加）
    var underlineWords=['你','我','心','梦','云','晚安','想','累','爱','笑','哭','等'];
    underlineWords.forEach(function(w){
        textHtml=textHtml.replace(new RegExp(w,'g'),'<span class="hvc-ul">'+w+'</span>');
    });

    var si=(styleIdx||0)%3;
    var bubblesSvg='';
    if(si===1){
        bubblesSvg='<svg class="hvc-bubbles" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice"><circle cx="270" cy="20" r="32"/><circle cx="20" cy="60" r="18"/><circle cx="160" cy="105" r="24"/><circle cx="110" cy="15" r="9"/></svg>';
    }else if(si===2){
        bubblesSvg='<svg class="hvc-bubbles" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice"><circle cx="240" cy="60" r="42"/><circle cx="40" cy="20" r="16"/><circle cx="130" cy="100" r="20"/><circle cx="280" cy="110" r="12"/></svg>';
    }

    return '<div class="hvc-card hvc-s'+si+'">'+
        '<div class="hvc-header">'+
            '<div class="hvc-header-deco">心声</div>'+
            '<div class="hvc-header-icon"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></div>'+
            '<span class="hvc-header-label">Heart Voice · 心声</span>'+
            '<span class="hvc-header-time">'+t+'</span>'+
        '</div>'+
        '<div class="hvc-body">'+
            bubblesSvg+
            '<div class="hvc-deco-you">你</div>'+
            '<div class="hvc-deco-me">我</div>'+
            '<div class="hvc-text">'+textHtml+'</div>'+
            '<div class="hvc-mood-tag">'+moodSvg+moodLbl+'</div>'+
            '<div class="hvc-from">'+
                '<div class="hvc-av">'+(_uAvatar?'<img src="'+_uAvatar+'" style="width:100%;height:100%;object-fit:cover;">':_uInitial)+'</div>'+
            '<span class="hvc-from-name">'+esc(_uName)+'</span>'+
                '<span class="hvc-from-sub">发出了一条心声</span>'+
            '</div>'+
        '</div>'+
    '</div>';
};

function injectCardStyles(){
    if(document.getElementById('hvc-style'))return;
    var s=document.createElement('style');
    s.id='hvc-style';
    s.textContent=
        '.hvc-notif-row{justify-content:center!important;}'+
        '.hvc-card{width:270px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07),0 1px 3px rgba(0,0,0,0.04);}'+
        '.hvc-header{background:#1a1a1f;padding:8px 14px;display:flex;align-items:center;gap:7px;position:relative;overflow:hidden;}'+
        '.hvc-header-deco{position:absolute;right:-4px;top:-10px;font-size:38px;font-weight:900;font-style:italic;-webkit-text-stroke:1px rgba(255,255,255,0.07);color:transparent;pointer-events:none;transform:rotate(6deg);letter-spacing:-1px;user-select:none;line-height:1;}'+
        '.hvc-header-icon svg{width:10px;height:10px;fill:rgba(255,255,255,0.4);flex-shrink:0;}'+
        '.hvc-header-label{font-size:8px;font-weight:800;letter-spacing:2px;color:rgba(255,255,255,0.35);text-transform:uppercase;flex:1;position:relative;z-index:1;}'+
        '.hvc-header-time{font-size:8px;color:rgba(255,255,255,0.2);font-family:monospace;position:relative;z-index:1;}'+
        '.hvc-body{padding:13px 16px 11px;position:relative;overflow:hidden;}'+
        '.hvc-bubbles{position:absolute;inset:0;pointer-events:none;width:100%;height:100%;}'+
        '.hvc-bubbles circle{fill:rgba(0,0,0,0.035);}'+
        '.hvc-deco-you{position:absolute;right:6px;top:-6px;font-size:46px;font-weight:900;font-style:italic;-webkit-text-stroke:1px rgba(0,0,0,0.06);color:transparent;pointer-events:none;transform:rotate(10deg);user-select:none;line-height:1;}'+
        '.hvc-deco-me{position:absolute;left:4px;bottom:24px;font-size:36px;font-weight:900;font-style:italic;-webkit-text-stroke:1px rgba(0,0,0,0.05);color:transparent;pointer-events:none;transform:rotate(-7deg);user-select:none;line-height:1;}'+
        '.hvc-text{font-size:13px;font-weight:400;color:rgba(0,0,0,0.72);line-height:1.65;position:relative;z-index:1;margin-bottom:8px;}'+
        '.hvc-ul{border-bottom:1.5px dashed rgba(0,0,0,0.2);padding-bottom:1px;}'+
        '.hvc-mood-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:50px;background:rgba(0,0,0,0.04);border:0.5px solid rgba(0,0,0,0.07);font-size:9px;color:rgba(0,0,0,0.35);margin-bottom:8px;position:relative;z-index:1;}'+
        '.hvc-mood-tag svg{width:9px;height:9px;stroke:rgba(0,0,0,0.3);fill:none;stroke-width:2;stroke-linecap:round;}'+
        '.hvc-from{display:flex;align-items:center;gap:6px;padding-top:8px;border-top:0.5px solid rgba(0,0,0,0.05);position:relative;z-index:1;}'+
        '.hvc-av{width:18px;height:18px;border-radius:50%;background:#1a1a1f;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:rgba(255,255,255,0.6);flex-shrink:0;overflow:hidden;}'+
        '.hvc-av img{width:100%;height:100%;object-fit:cover;}'+
        '.hvc-from-name{font-size:10px;font-weight:600;color:rgba(0,0,0,0.35);}'+
        '.hvc-from-sub{font-size:8px;color:rgba(0,0,0,0.2);}'+
        /* 气泡行内嵌卡片 */
        '.cda-msg-row.sent .hvc-card-wrap{display:flex;justify-content:flex-end;padding:2px 0;}'+
        '.cda-msg-row.received .hvc-card-wrap{display:flex;justify-content:flex-start;padding:2px 0;}';
    document.head.appendChild(s);
}

function sendHvCardToChat(entry){
    var entId=window._cdaCurrentEntId;
    if(!entId)return;
    injectCardStyles();
    if(!window._caConversations)window._caConversations={};
    if(!window._caConversations[entId])window._caConversations[entId]=[];

    // 读取用户面具头像和名字
    var _masks;try{_masks=JSON.parse(localStorage.getItem('ca-user-masks')||'[]');}catch(e){_masks=[];}
    var _activeMask=_masks.find(function(m){return m.active;})||_masks[0];
    var _userName=_activeMask&&_activeMask.name?_activeMask.name:'我';
    var _userInitial=_userName.charAt(0);
    var _userAvatar=window._cachedMaskAvatar||'';

    var cardHtml=window.buildHvCardHtml(entry,_cardStyleIdx,{name:_userName,initial:_userInitial,avatar:_userAvatar});
    _cardStyleIdx++;

    // 存为特殊 info 消息（ai_visible:false，不进入 API 上下文）
    var now=new Date();
    var timeStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    var cardData=JSON.stringify({type:'hv_card',text:entry.text,mood:entry.mood||'calm',styleIdx:(_cardStyleIdx-1)%3});
    var _hvToken='[HV_CARD::'+cardData+'::HV_END]';
    window._caConversations[entId].push({role:'info',text:_hvToken,ai_visible:false,time:timeStr});

    if(typeof ChatDB!=='undefined'&&ChatDB.saveConversation){
        ChatDB.saveConversation(entId,window._caConversations[entId]);
    }

    // 直接注入 DOM
    var area=document.getElementById('cdaMsgArea');
    if(!area)return;

    var wrap=document.createElement('div');
    wrap.className='cda-dc-notif-row hvc-notif-row';
    wrap.style.cssText='justify-content:flex-start;';
    wrap.innerHTML=cardHtml;
    area.appendChild(wrap);
    area.scrollTop=area.scrollHeight;
}

function loadMy(){
    var entries=JSON.parse(localStorage.getItem('ca-heart-my')||'[]');
    var lbl=document.getElementById('hvHistLbl');
    var hist=document.getElementById('hvHistory');
    if(!lbl||!hist)return;
    if(!entries.length){lbl.style.display='none';hist.innerHTML='';return;}
    lbl.style.display='block';
    hist.innerHTML=entries.slice(0,10).map(function(e,i){
        var msvg=e.mood&&moodSvgInline[e.mood]?'<svg class="hv-entry-moodsvg" viewBox="0 0 24 24">'+moodSvgInline[e.mood].replace(/<\/?svg[^>]*>/g,'')+'</svg>':'';
        return '<div class="hv-entry">'+
            '<div class="hv-entry-top">'+msvg+'<span class="hv-entry-time">'+esc(e.time||'')+'</span><div class="hv-entry-del" data-idx="'+i+'">✕</div></div>'+
            '<div class="hv-entry-text"><span style="color:rgba(255,255,255,0.2);margin-right:8px;">—</span>'+esc(e.text)+'</div>'+
        '</div>';
    }).join('');
    hist.querySelectorAll('.hv-entry-del').forEach(function(btn){
        btn.addEventListener('click',function(){
            var idx=parseInt(btn.dataset.idx);
            var arr=JSON.parse(localStorage.getItem('ca-heart-my')||'[]');
            arr.splice(idx,1);
            localStorage.setItem('ca-heart-my',JSON.stringify(arr));
            loadMy();
        });
    });
}

var _lastOpenedEntId=null;
window.addEventListener('ca-detail-alt-opened',function(){
    build();
    _triggerVisible=false;
    _tagShown=false;
    var trigger=document.getElementById('hvTrigger');
    if(trigger)trigger.classList.remove('revealed');
    var tag=document.getElementById('hvTag');
    if(tag)tag.classList.remove('open');
    // 切换聊天对象时重置卡片状态
    var curId=window._cdaCurrentEntId;
    if(curId!==_lastOpenedEntId){
        _lastOpenedEntId=curId;
        _cardStyleIdx=0;
        _theirVoiceCache=null;
        // 重置面板内容
        var emptyState=document.getElementById('hvEmptyState');
        if(emptyState){
            emptyState.style.display='block';
            emptyState.innerHTML='<div class="hv-empty-line1">No voice yet</div><div class="hv-empty-line2">their words will appear here</div>';
        }
        var oldCard=document.getElementById('hvTheirWrap')&&document.getElementById('hvTheirWrap').querySelector('.hv-voice-card');
        if(oldCard)oldCard.remove();
        var viewAll=document.getElementById('hvViewAll');
        if(viewAll)viewAll.style.display='none';
        var theirHistory=document.getElementById('hvTheirHistory');
        if(theirHistory){theirHistory.classList.remove('open');theirHistory.innerHTML='';}
    }
});

window.addEventListener('ca-detail-alt-closed',function(){
    _triggerVisible=false;
    _tagShown=false;
    var trigger=document.getElementById('hvTrigger');
    if(trigger)trigger.classList.remove('revealed');
    var tag=document.getElementById('hvTag');
    if(tag)tag.classList.remove('open');
    var panel=document.getElementById('hvPanel');
    if(panel)panel.classList.remove('open');
});

document.addEventListener('DOMContentLoaded',function(){build();});

})();
