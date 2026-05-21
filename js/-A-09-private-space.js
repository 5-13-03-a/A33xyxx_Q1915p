// js/private-space.js · Private Space Module
(function () {
    'use strict';

    var built = false;

    function _psApiCfg(){try{return JSON.parse(localStorage.getItem('ca-api-config')||'{}');}catch(e){return {};}}
    function _psActiveCfg(){var c=_psApiCfg();return c[c.node||'primary']||{endpoint:'',key:'',model:''};}
    function _psNormEp(r){var e=(r||'https://api.openai.com/v1').replace(/\/+$/,'');if(e.indexOf('/chat/completions')!==-1)return e;e=e.replace(/\/models$/,'');if(e.match(/\/v\d+$/))return e+'/chat/completions';if(e.match(/\.(com|cn|io|ai|net|org)(\/|$)/)||e.match(/localhost/)||e.match(/:\d{2,5}$/))return e+'/v1/chat/completions';return e+'/chat/completions';}

    var _psEntity={name:'Luna',avatar:'',color:'#6b667a'};
    var _psUser={name:'You',avatar:'',color:'#2a2830'};

    function loadEntityAndUser(){
        try{
            var _pls=localStorage;
            var _psRaw=_pls.getItem('ps-current-entity');
            if(_psRaw){_psEntity=JSON.parse(_psRaw);}
            var _psMasks=JSON.parse(_pls.getItem('ca-user-masks')||'[]');
            var _psActiveMask=_psMasks.find(function(m){return m.active;});
            if(_psActiveMask){_psUser.name=_psActiveMask.name||'You';_psUser.avatar=_psActiveMask.avatar||'';}
        }catch(e){}
    }

    function buildCSS(){
        return '@font-face{font-family:\'DecoFont\';src:url(\'https://file.icve.com.cn/file_doc/TErHYkZx/srpvXCDj.ttf\') format(\'truetype\');font-display:swap}' +
        ':root{--bg:#eceaf0;--surface:#F8F7F9;--accent:#2a2830;--ai:#6b667a;--ai-soft:rgba(107,102,122,.09);--text:#2a2830;--sub:#9a98a3;--border:rgba(42,40,48,.06);--msg-ai:#f0eef4}' +
        '#psApp *{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,"SF Pro Display",sans-serif;-webkit-tap-highlight-color:transparent}' +
        '#psApp{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;background:var(--surface);display:flex;flex-direction:column;overflow:hidden;z-index:2147483646}' +

        '#psApp .hdr{width:calc(100% - 24px);margin:10px 12px 0;padding:6px 6px 6px 8px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;background:#fff;z-index:20;border:1px solid rgba(42,40,48,.09);border-radius:50px;position:relative;box-shadow:0 2px 10px rgba(42,40,48,.06)}' +
        '#psApp .hdr-capsule{display:flex;align-items:center;gap:8px}' +
        '#psApp .hdr-avatars{display:flex;align-items:center}' +
        '#psApp .hdr-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;flex-shrink:0}' +
        '#psApp .hdr-av-me{background:#2a2830;margin-right:-9px;z-index:2}' +
        '#psApp .hdr-av-luna{background:#fff;border:1.5px solid rgba(107,102,122,.28);z-index:1}' +
        '#psApp .hdr-cap-text{display:flex;flex-direction:column;gap:1px;margin-left:6px}' +
        '#psApp .hdr-cap-title{font-size:12px;font-weight:800;color:var(--text);letter-spacing:.2px;line-height:1}' +
        '#psApp .hdr-cap-sub{font-size:9px;color:var(--sub);letter-spacing:.3px;line-height:1}' +
        '#psApp .hdr-right{display:flex;align-items:center;gap:6px}' +
        '#psApp .hdr-mood{background:rgba(42,40,48,.05);color:var(--sub);padding:5px 13px;border-radius:40px;font-size:11px;font-weight:700;transition:.4s;white-space:nowrap;flex-shrink:0;border:1px solid rgba(42,40,48,.08)}' +
        '#psApp .hdr-tag{font-family:\'DecoFont\',serif;font-size:9px;color:rgba(107,102,122,.35);letter-spacing:1.5px;white-space:nowrap}' +

        '#psToasts{position:fixed;top:68px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:6px;z-index:2147483647;pointer-events:none}' +
        '#psApp .toast{background:transparent;color:var(--ai);padding:6px 16px;border-radius:0;font-family:\'DecoFont\',serif;font-size:11px;font-weight:400;letter-spacing:1.5px;animation:psToastFade 2.8s ease forwards;opacity:0;text-shadow:0 1px 3px rgba(0,0,0,.04)}' +
        '@keyframes psToastFade{0%{opacity:0;transform:translateY(-6px);filter:blur(3px)}15%{opacity:.85;transform:translateY(0);filter:blur(0)}75%{opacity:.85;transform:translateY(0);filter:blur(0)}100%{opacity:0;transform:translateY(4px);filter:blur(2px)}}' +

        '#psApp .stage{width:100%;height:240px;flex-shrink:0;position:relative;overflow:hidden;background:#fff;touch-action:none;contain:layout style paint}' +
        '#psApp .stage.dragging{cursor:grabbing}' +
        '#psApp .stage::after{content:\'\';position:absolute;bottom:0;left:0;right:0;height:1px;background:repeating-linear-gradient(90deg,rgba(42,40,48,.06),rgba(42,40,48,.06) 4px,transparent 4px,transparent 10px);pointer-events:none;z-index:5}' +

        '#psApp .deco-layer{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}' +
        '#psApp .deco-main{font-family:\'DecoFont\',serif;font-size:110px;font-weight:900;color:rgba(124,92,252,.042);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);white-space:nowrap;user-select:none;letter-spacing:4px;line-height:1}' +
        '#psApp .deco-sub{font-family:\'DecoFont\',serif;font-size:18px;font-weight:400;color:rgba(124,92,252,.07);position:absolute;bottom:12px;right:16px;letter-spacing:4px;user-select:none;white-space:nowrap}' +
        '#psApp .deco-corner{font-family:\'DecoFont\',serif;font-size:13px;font-weight:400;color:rgba(0,0,0,.05);position:absolute;top:10px;left:14px;letter-spacing:3px;user-select:none;white-space:nowrap}' +
        '#psApp .deco-vert{font-family:\'DecoFont\',serif;font-size:11px;color:rgba(0,0,0,.04);position:absolute;bottom:18px;left:14px;letter-spacing:2px;user-select:none;white-space:nowrap;writing-mode:vertical-lr}' +

        '#psApp .world{position:absolute;inset:0;pointer-events:none;z-index:2;will-change:transform;transform:translateZ(0)}' +
        '#psApp .floor{width:700px;height:700px;position:absolute;top:50%;left:50%;background:#fafafa;background-image:linear-gradient(rgba(0,0,0,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.025) 1px,transparent 1px);background-size:44px 44px;border:1px solid rgba(0,0,0,.05);box-shadow:0 24px 60px rgba(0,0,0,.07);transform-origin:center center;transform:translate(-50%,-50%) rotateX(55deg) rotateZ(-45deg)}' +
        '#psApp .furn{position:absolute;border-radius:6px;overflow:hidden}' +
        '#psApp .f-bed{width:100px;height:144px;top:60px;right:80px;background:#fff;border:1px solid #e2e2ec;box-shadow:-6px 6px 0 #dcdce8}' +
        '#psApp .f-bed::before{content:\'\';position:absolute;top:10px;left:8px;right:8px;height:38px;background:#ece8ff;border-radius:4px}' +
        '#psApp .f-bed::after{font-family:\'DecoFont\',serif;content:\'Bed\';font-size:22px;font-weight:900;color:rgba(124,92,252,.10);position:absolute;bottom:8px;right:6px;letter-spacing:1px;user-select:none;line-height:1}' +
        '#psApp .f-desk{width:68px;height:50px;bottom:80px;left:80px;background:#fff;border:1px solid #e2e2ec;box-shadow:-4px 4px 0 #dcdce8}' +
        '#psApp .f-desk::after{font-family:\'DecoFont\',serif;content:\'Desk\';font-size:13px;font-weight:700;color:rgba(0,0,0,.08);position:absolute;bottom:4px;right:4px;letter-spacing:1px;user-select:none}' +
        '#psApp .f-rug{width:160px;height:120px;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(124,92,252,.04);border-radius:10px;border:1px solid rgba(124,92,252,.1);display:flex;align-items:center;justify-content:center}' +
        '#psApp .f-rug::after{font-family:\'DecoFont\',serif;content:\'Private Room\';font-size:16px;font-weight:700;color:rgba(124,92,252,.12);letter-spacing:2px;user-select:none;white-space:nowrap}' +
        '#psApp .f-wardrobe{width:90px;height:110px;top:55px;left:75px;background:#fff;border:1px solid #e2e2ec;box-shadow:-5px 5px 0 #dcdce8}' +
        '#psApp .f-wardrobe::before{content:\'\';position:absolute;top:8px;left:50%;transform:translateX(-50%);width:1px;height:94px;background:#e2e2ec}' +
        '#psApp .f-wardrobe::after{font-family:\'DecoFont\',serif;content:\'Wardrobe\';font-size:11px;font-weight:700;color:rgba(0,0,0,.08);position:absolute;bottom:6px;left:0;right:0;text-align:center;letter-spacing:1px;user-select:none}' +
        '#psApp .f-sofa{width:130px;height:70px;bottom:75px;right:75px;background:#fff;border:1px solid #e2e2ec;box-shadow:-5px 5px 0 #dcdce8;border-radius:8px}' +
        '#psApp .f-sofa::before{content:\'\';position:absolute;top:0;left:0;right:0;height:24px;background:#f0effe;border-radius:8px 8px 0 0;border-bottom:1px solid #e2e2ec}' +
        '#psApp .f-sofa::after{font-family:\'DecoFont\',serif;content:\'Sofa\';font-size:13px;font-weight:700;color:rgba(124,92,252,.12);position:absolute;bottom:6px;right:8px;letter-spacing:1px;user-select:none}' +

        '#psApp .char{position:absolute;display:flex;flex-direction:column;align-items:center;will-change:transform;transform:translateZ(0)}' +
        '#psApp .av{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 22px rgba(0,0,0,.15);position:relative;flex-shrink:0}' +
        '#psApp .char-me .av{background:var(--accent)}' +
        '#psApp .char-ai .av{background:#fff;border:2.5px solid var(--ai)}' +
        '#psApp .av svg{width:26px;height:26px}' +
        '#psApp .av-ring{position:absolute;inset:-5px;border-radius:50%;border:1px solid rgba(107,102,122,.25);box-shadow:0 0 8px rgba(107,102,122,.12);animation:psGlow 3s ease-in-out infinite;pointer-events:none}' +
        '@keyframes psGlow{0%,100%{box-shadow:0 0 6px rgba(107,102,122,.12)}50%{box-shadow:0 0 14px rgba(107,102,122,.28)}}' +
        '#psApp .av-name{font-size:9px;font-weight:800;letter-spacing:.7px;color:var(--sub);text-transform:uppercase;margin-top:4px;white-space:nowrap}' +
        '#psApp .av-dot{width:10px;height:10px;border-radius:50%;margin-top:3px;position:relative;flex-shrink:0;overflow:hidden;contain:paint}' +
        '#psApp .char-me .av-dot{background:var(--accent);box-shadow:0 0 0 3px rgba(0,0,0,.1)}' +
        '#psApp .char-ai .av-dot{background:var(--ai);box-shadow:0 0 0 3px rgba(107,102,122,.14)}' +
        '#psApp .av-dot::after{content:\'\';position:absolute;inset:0;border-radius:50%;animation:psPing 2.6s ease-out infinite}' +
        '#psApp .char-me .av-dot::after{background:rgba(0,0,0,.22)}' +
        '#psApp .char-ai .av-dot::after{background:rgba(107,102,122,.22)}' +
        '@keyframes psPing{0%{transform:scale(1);opacity:.8}80%,100%{transform:scale(3.5);opacity:0}}' +
        '#psApp .av-shadow{width:36px;height:10px;background:rgba(0,0,0,.10);border-radius:50%;margin-top:-2px;filter:blur(4px);flex-shrink:0}' +
        '@keyframes psABounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-18px)}}' +
        '@keyframes psAShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}65%{transform:translateX(8px)}}' +
        '@keyframes psAWobble{0%,100%{transform:rotate(0)scale(1)}30%{transform:rotate(-9deg)scale(1.06)}70%{transform:rotate(9deg)scale(1.06)}}' +
        '#psApp .do-bounce{animation:psABounce .65s ease}' +
        '#psApp .do-shake{animation:psAShake .5s ease}' +
        '#psApp .do-wobble{animation:psAWobble .75s ease 2}' +

        '#psApp .minimap{position:absolute;bottom:10px;right:12px;width:58px;height:58px;border-radius:12px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,.08);z-index:15;overflow:hidden;pointer-events:none}' +
        '#psApp .minimap-label{font-family:\'DecoFont\',serif;font-size:7px;color:rgba(0,0,0,.2);position:absolute;top:3px;left:0;right:0;text-align:center;letter-spacing:1px;user-select:none}' +
        '#psApp .mm-dot{position:absolute;width:6px;height:6px;border-radius:50%;transform:translate(-50%,-50%);transition:.3s}' +
        '#psApp .mm-me{background:var(--accent)}' +
        '#psApp .mm-ai{background:var(--ai)}' +

        '#psApp #fhint{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:30;display:flex;flex-direction:column;align-items:center;gap:7px;pointer-events:none;opacity:0;transition:opacity .25s;width:calc(100% - 32px);max-width:340px}' +
        '#psApp #fhint.visible{opacity:1}' +
        '#psApp .fhint-name{background:rgba(255,255,255,.9);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(0,0,0,.08);padding:7px 18px;border-radius:40px;font-size:12px;font-weight:600;color:var(--text);box-shadow:0 4px 16px rgba(0,0,0,.08);display:flex;align-items:center;gap:8px;white-space:nowrap;pointer-events:none}' +
        '#psApp .fhint-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}' +
        '#psApp .fhint-btns{display:flex;gap:7px;pointer-events:auto}' +
        '#psApp .fhint-btn{background:#2a2830;border:none;padding:9px 22px;border-radius:30px;font-size:12px;font-weight:700;color:#fff;cursor:pointer;white-space:nowrap;pointer-events:auto;touch-action:manipulation;-webkit-user-select:none;user-select:none;box-shadow:0 4px 14px rgba(42,40,48,.22);letter-spacing:.3px}' +
        '#psApp .fhint-btn:active{background:#111018;transform:scale(.95)}' +
        '#psApp .char-me.anchored .av{box-shadow:0 0 18px rgba(124,92,252,.5),0 0 40px rgba(124,92,252,.2),0 8px 22px rgba(0,0,0,.15);border:2px solid rgba(124,92,252,.4)}' +
        '#psApp .char-me.anchored .av-dot{background:rgba(124,92,252,.8);box-shadow:0 0 0 3px rgba(124,92,252,.2)}' +
        '@keyframes psAnchorPulse{0%,100%{box-shadow:0 0 18px rgba(124,92,252,.4),0 8px 22px rgba(0,0,0,.15)}50%{box-shadow:0 0 28px rgba(124,92,252,.6),0 0 50px rgba(124,92,252,.15),0 8px 22px rgba(0,0,0,.15)}}' +
        '#psApp .char-me.anchored .av{animation:psAnchorPulse 2s ease-in-out infinite}' +
        '#psApp .fhint-leave{background:rgba(124,92,252,.15);border:1.5px solid rgba(124,92,252,.3);padding:7px 16px;border-radius:30px;font-size:11px;font-weight:700;color:rgba(124,92,252,.85);cursor:pointer;white-space:nowrap;pointer-events:auto;touch-action:manipulation;transition:all .2s}' +
        '#psApp .fhint-leave:active{transform:scale(.93);background:rgba(124,92,252,.25)}' +

        '#psApp .bottom{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;background:#fff;border-radius:28px 28px 0 0;box-shadow:0 -6px 28px rgba(0,0,0,.04);overflow:hidden;z-index:20;position:relative;contain:layout style paint;margin-top:20px}' +
        '#psApp .bottom::before{content:\'\';position:absolute;top:18px;left:50%;transform:translateX(-50%);width:32px;height:3px;background:rgba(42,40,48,.08);border-radius:2px;z-index:3;pointer-events:none}' +
        '#psApp .bottom-deco{font-family:\'DecoFont\',serif;font-size:80px;font-weight:900;color:rgba(0,0,0,.018);position:absolute;bottom:-10px;right:-10px;user-select:none;pointer-events:none;z-index:0;letter-spacing:2px;line-height:1;white-space:nowrap}' +
        '#psApp .tabs{display:flex;gap:4px;padding:12px 14px 0;flex-shrink:0;width:100%;position:relative;z-index:2}' +
        '#psApp .tab{flex:1;padding:9px;border:none;background:rgba(42,40,48,.04);border-radius:12px 12px 0 0;font-size:11px;font-weight:800;color:var(--sub);cursor:pointer;transition:.2s;letter-spacing:.3px;text-transform:uppercase;white-space:nowrap}' +
        '#psApp .tab.on{background:#fff;color:var(--text);box-shadow:0 -3px 10px rgba(0,0,0,.04)}' +
        '#psApp .pane{flex:1;min-height:0;width:100%;display:none;flex-direction:column;overflow:hidden;position:relative;z-index:2}' +
        '#psApp .pane.on{display:flex}' +

        '#psApp .msgs{flex:1;padding:14px 16px;overflow-y:auto;scrollbar-width:none;display:flex;flex-direction:column;gap:10px;width:100%;contain:layout style;will-change:scroll-position}' +
        '#psApp .msgs::-webkit-scrollbar{display:none}' +
        '#psApp .mrow{display:flex;flex-direction:column;gap:3px;width:100%;animation:psMin .35s cubic-bezier(.16,1,.3,1);will-change:transform,opacity}' +
        '@keyframes psMin{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}' +
        '#psApp .mrow.me{align-items:flex-end}' +
        '#psApp .mrow.ai{align-items:flex-start}' +
        '#psApp .mrow.sys{align-items:center}' +
        '#psApp .sender{font-size:9px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--ai);padding-left:2px;margin-bottom:0}' +
        '#psApp .mrow.ai .bub{max-width:84%;background:var(--msg-ai);border-radius:4px 18px 18px 4px;border-left:3px solid var(--ai);padding:6px 12px;font-size:12.5px;line-height:1.55;word-break:break-word;color:var(--text)}' +
        '#psApp .mrow.me .bub{max-width:84%;background:var(--accent);color:#fff;border-radius:18px 4px 4px 18px;padding:6px 12px;font-size:12.5px;line-height:1.55;word-break:break-word;position:relative}' +
        '#psApp .mrow.sys .bub{background:transparent;border:1px solid var(--border);color:var(--sub);border-radius:40px;padding:3px 14px;font-size:10px;font-weight:500;font-family:\'DecoFont\',serif;letter-spacing:.5px}' +
        '#psApp .mrow.sys.sys-temp .bub{opacity:.5;border-style:dashed}' +
        '#psApp .mrow.sys.narr{align-items:center;margin:2px 0;cursor:default}' +
        '#psApp .mrow.sys.narr.selecting{cursor:pointer}' +
        '#psApp .mrow.sys.narr.selected .bub-narr{background:rgba(158,142,201,.12);border-radius:12px;outline:2px dashed var(--ai)}' +
        '#psApp .bub-narr{color:#9e8ec9;font-size:11.5px;font-style:italic;text-align:center;padding:3px 20px;opacity:.78;letter-spacing:.3px;line-height:1.7;font-weight:400}' +
        '#psApp .bub-narr i{font-style:italic}' +
        '#psApp .bub i{font-style:italic;font-size:11.5px}' +
        '#psApp .mrow.ai .bub i{color:#9e8ec9}' +
        '#psApp .mrow.me .bub i{color:rgba(255,255,255,.55)}' +
        '#psApp .bub-star{position:absolute;top:-10px;right:-10px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.22))}' +
        '#psApp .mmeta{display:flex;align-items:center;gap:6px;padding:2px 2px 0}' +
        '#psApp .mtag{background:var(--ai-soft);color:var(--ai);padding:2px 9px;border-radius:20px;font-size:10px;font-weight:700}' +
        '#psApp .mtime{font-size:10px;color:var(--sub)}' +

        '#psApp .qr-row{display:flex;gap:7px;padding:0 14px 10px;overflow-x:auto;scrollbar-width:none;flex-shrink:0;width:100%}' +
        '#psApp .qr-row::-webkit-scrollbar{display:none}' +
        '#psApp .qr-act{flex-shrink:0;display:flex;align-items:center;gap:7px;background:#fff;border:1px dashed rgba(42,40,48,.2);padding:8px 14px;border-radius:6px;font-size:10px;font-weight:700;color:#2a2830;letter-spacing:.3px;cursor:pointer;transition:all .2s;position:relative;white-space:nowrap}' +
        '#psApp .qr-act::before{content:attr(data-en);position:absolute;top:-7px;left:50%;transform:translateX(-50%);font-size:6px;font-weight:800;letter-spacing:2.5px;color:rgba(42,40,48,.15);text-transform:uppercase;background:var(--surface);padding:0 6px;white-space:nowrap}' +
        '#psApp .qr-act::after{content:\'\';position:absolute;inset:3px;border:0.5px solid rgba(42,40,48,.06);border-radius:4px;pointer-events:none}' +
        '#psApp .qr-act:hover{border-color:rgba(42,40,48,.35);background:rgba(42,40,48,.02)}' +
        '#psApp .qr-act:active{transform:scale(.93)}' +
        '#psApp .qr-act svg{width:14px;height:14px;stroke:#2a2830;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;opacity:.7}' +
        '#psApp .qr-act.danger{color:#c0392b;border-color:rgba(192,57,43,.2);background:rgba(192,57,43,.06)}' +
        '#psApp .qr-act.danger:active{background:rgba(192,57,43,.14)}' +
        '#psApp .multi-bar{display:flex;gap:8px;padding:0 14px 10px;flex-shrink:0}' +
        '#psApp .mrow.selecting{cursor:pointer}' +
        '#psApp .mrow.selecting .bub{outline:2px dashed transparent;border-radius:18px;transition:outline .15s}' +
        '#psApp .mrow.selected .bub{outline:2px dashed var(--ai);background:var(--ai-soft)!important}' +
        '#psApp .mrow.me .bub-star{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .2s}' +
        '#psApp .mrow.me .bub-star:active{transform:scale(1.3)}' +
        '#psApp .ps-rollback-confirm{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:#fff;border-radius:20px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.25);border:1px solid rgba(42,40,48,.1);width:260px;text-align:center;animation:psModalIn .3s cubic-bezier(.16,1,.3,1)}' +
        '#psApp .ps-rollback-confirm .ps-rb-title{font-size:13px;font-weight:800;color:var(--text);margin-bottom:6px}' +
        '#psApp .ps-rollback-confirm .ps-rb-sub{font-size:11px;color:var(--sub);margin-bottom:18px;line-height:1.5}' +
        '#psApp .ps-rollback-confirm .ps-rb-btns{display:flex;gap:8px}' +
        '#psApp .ps-rollback-confirm .ps-rb-btn{flex:1;padding:10px;border-radius:12px;border:none;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s}' +
        '#psApp .ps-rollback-confirm .ps-rb-btn:active{transform:scale(.95)}' +
        '#psApp .ps-rollback-confirm .ps-rb-cancel{background:rgba(42,40,48,.06);color:var(--text)}' +
        '#psApp .ps-rollback-confirm .ps-rb-do{background:#c0392b;color:#fff}' +
        '#psApp .ps-rb-overlay{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.2);animation:psRbFade .2s ease}' +
        '@keyframes psRbFade{from{opacity:0}to{opacity:1}}' +
        '@keyframes psModalIn{from{opacity:0;transform:translate(-50%,-50%) scale(.92)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}' +
        '#psApp .ps-sum-overlay{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.35);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:psRbFade .3s ease}' +
        '#psApp .ps-sum-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:#fff;border-radius:24px;padding:28px 24px;box-shadow:0 30px 80px rgba(0,0,0,.3);border:1px solid rgba(42,40,48,.08);width:290px;text-align:center;animation:psModalIn .35s cubic-bezier(.16,1,.3,1)}' +
        '#psApp .ps-sum-modal .ps-sum-icon{width:40px;height:40px;border-radius:50%;background:rgba(124,92,252,.1);display:flex;align-items:center;justify-content:center;margin:0 auto 12px}' +
        '#psApp .ps-sum-modal .ps-sum-icon svg{width:20px;height:20px;stroke:rgba(124,92,252,.7);fill:none;stroke-width:2}' +
        '#psApp .ps-sum-modal .ps-sum-title{font-size:14px;font-weight:800;color:var(--text);margin-bottom:4px}' +
        '#psApp .ps-sum-modal .ps-sum-sub{font-size:11px;color:var(--sub);margin-bottom:18px;line-height:1.5}' +
        '#psApp .ps-sum-modal .ps-sum-status{font-size:11px;color:var(--ai);margin-bottom:14px;min-height:16px;font-style:italic}' +
        '#psApp .ps-sum-modal .ps-sum-btns{display:flex;gap:8px}' +
        '#psApp .ps-sum-modal .ps-sum-btn{flex:1;padding:11px;border-radius:14px;border:none;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s}' +
        '#psApp .ps-sum-modal .ps-sum-btn:active{transform:scale(.95)}' +
        '#psApp .ps-sum-modal .ps-sum-cancel{background:rgba(42,40,48,.06);color:var(--text)}' +
        '#psApp .ps-sum-modal .ps-sum-do{background:var(--accent);color:#fff}' +
        '#psApp .ps-sum-modal .ps-sum-doing{opacity:.5;pointer-events:none}' +
        '#psApp .ps-mood-input{position:absolute;top:100%;right:0;margin-top:6px;background:#fff;border:1px solid rgba(42,40,48,.12);border-radius:14px;padding:10px 14px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:30;width:160px;animation:psMin .25s cubic-bezier(.16,1,.3,1)}' +
        '#psApp .ps-mood-input input{width:100%;border:none;border-bottom:1.5px solid rgba(42,40,48,.1);font-size:12px;font-weight:600;color:var(--text);outline:none;padding:4px 0;font-family:inherit}' +
        '#psApp .ps-mood-input input::placeholder{color:var(--sub)}' +
        '#psApp .ps-mood-input .ps-mood-save{margin-top:8px;width:100%;padding:7px;border-radius:10px;border:none;background:var(--accent);color:#fff;font-size:10px;font-weight:700;cursor:pointer}' +
        '#psApp .ps-mood-input .ps-mood-save:active{transform:scale(.95)}' +
        '@keyframes psStarSpin{0%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.4) rotate(180deg)}100%{transform:scale(1) rotate(360deg)}}' +
        '#psApp .bub-star.star-anim{animation:psStarSpin .6s cubic-bezier(.34,1.56,.64,1)}' +

        '#psApp .inp-bar{padding:10px 14px 20px;display:flex;gap:8px;align-items:center;flex-shrink:0;width:100%;border-top:none;position:relative}' +
        '#psApp .inp-bar::before{content:\'\';position:absolute;top:0;left:14px;right:14px;height:1px;background:repeating-linear-gradient(90deg,rgba(42,40,48,.06),rgba(42,40,48,.06) 3px,transparent 3px,transparent 8px)}' +
        '#psApp .inp{flex:1;min-width:0;background:var(--bg);border:none;padding:11px 17px;border-radius:30px;font-size:14px;outline:none;color:var(--text)}' +
        '#psApp .snd{width:44px;height:44px;flex-shrink:0;border-radius:14px;background:#2a2830;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;position:relative;box-shadow:3px 3px 0 rgba(42,40,48,.12)}' +
        '#psApp .snd::before{content:\'\';position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:50%;background:rgba(124,92,252,.5)}' +
        '#psApp .snd:active{transform:translate(2px,2px);box-shadow:0 0 0 transparent}' +
        '#psApp .exit-btn{width:32px;height:32px;flex-shrink:0;border-radius:50%;background:rgba(42,40,48,.05);border:1px solid rgba(42,40,48,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}' +
        '#psApp .exit-btn:active{transform:scale(.85);background:rgba(42,40,48,.1)}' +
        '#psApp .ps-loading-bar{position:absolute;top:0;left:0;right:0;z-index:25;display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 16px;background:rgba(42,40,48,.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:0 0 16px 16px;animation:psLoadIn .3s cubic-bezier(.16,1,.3,1);pointer-events:auto}' +
        '@keyframes psLoadIn{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}' +
        '#psApp .ps-loading-bar .ps-load-dots{display:flex;gap:4px;align-items:center}' +
        '#psApp .ps-loading-bar .ps-load-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.6);animation:psLoadDot 1.2s infinite ease-in-out both}' +
        '#psApp .ps-loading-bar .ps-load-dot:nth-child(1){animation-delay:-.24s}' +
        '#psApp .ps-loading-bar .ps-load-dot:nth-child(2){animation-delay:-.12s}' +
        '@keyframes psLoadDot{0%,80%,100%{transform:scale(.5);opacity:.3}40%{transform:scale(1.1);opacity:1}}' +
        '#psApp .ps-loading-bar .ps-load-text{font-size:11px;font-weight:700;color:rgba(255,255,255,.85);letter-spacing:.5px}' +
        '#psApp .ps-loading-bar .ps-load-cancel{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .2s}' +
        '#psApp .ps-loading-bar .ps-load-cancel:active{transform:scale(.85);background:rgba(255,255,255,.25)}' +
        '#psApp .ps-loading-bar .ps-load-cancel svg{width:10px;height:10px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round}' +
        '#psApp .act-paren-btn{width:32px;height:32px;flex-shrink:0;border-radius:50%;background:rgba(158,142,201,.08);border:1.5px dashed rgba(158,142,201,.35);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:12px;font-weight:800;color:rgba(158,142,201,.55);font-family:monospace;line-height:1}' +
        '#psApp .act-paren-btn:active{transform:scale(.85);background:rgba(158,142,201,.18);color:rgba(158,142,201,.9)}' +
        '#psApp .act-paren-btn.on{background:rgba(158,142,201,.15);border-style:solid;border-color:rgba(158,142,201,.5);color:rgba(158,142,201,.9)}' +

        '#psApp .act-scroll{flex:1;overflow-y:auto;scrollbar-width:none;padding:14px 16px 20px;width:100%}' +
        '#psApp .act-scroll::-webkit-scrollbar{display:none}' +
        '#psApp .sec{font-size:10px;font-weight:800;letter-spacing:.8px;color:var(--sub);text-transform:uppercase;margin:14px 0 9px;display:flex;align-items:center;gap:8px}' +
        '#psApp .sec:first-child{margin-top:0}' +
        '#psApp .sec-deco{font-family:\'DecoFont\',serif;font-size:10px;color:rgba(107,102,122,.3);letter-spacing:2px;font-weight:400}' +
        '#psApp .ag{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%}' +
        '#psApp .ab{background:transparent;border:1px solid rgba(42,40,48,.14);border-radius:16px;padding:13px 6px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;transition:.18s;width:100%}' +
        '#psApp .ab:active{transform:scale(.93);background:rgba(42,40,48,.04)}' +
        '#psApp .ab svg{width:21px;height:21px;fill:var(--text);flex-shrink:0}' +
        '#psApp .ab span{font-size:10px;font-weight:700;color:var(--text);white-space:nowrap}' +
        '#psApp .ab.hl{background:transparent;border:1px solid rgba(107,102,122,.22)}' +
        '#psApp .ab.hl svg{fill:var(--ai)}' +
        '#psApp .ab.hl span{color:var(--ai)}' +

        '#psApp .mv-wrap{flex:1;overflow-y:auto;scrollbar-width:none;padding:18px 16px;display:flex;flex-direction:column;align-items:center;gap:14px;width:100%}' +
        '#psApp .mv-wrap::-webkit-scrollbar{display:none}' +
        '#psApp .info-row{display:flex;gap:10px;width:100%}' +
        '#psApp .ic{flex:1;background:var(--bg);border-radius:18px;padding:12px 16px;text-align:center;min-width:0;position:relative;overflow:hidden}' +
        '#psApp .ic-deco{font-family:\'DecoFont\',serif;font-size:36px;font-weight:900;color:rgba(0,0,0,.04);position:absolute;right:-4px;bottom:-6px;line-height:1;user-select:none}' +
        '#psApp .ic .l{font-size:10px;font-weight:800;color:var(--sub);letter-spacing:.5px;text-transform:uppercase}' +
        '#psApp .ic .v{font-size:22px;font-weight:800;margin-top:3px}' +
        '#psApp .dbar{width:100%;background:var(--bg);border-radius:18px;padding:12px 18px;display:flex;align-items:center;gap:12px}' +
        '#psApp .dtrack{flex:1;height:5px;background:#e0e0e8;border-radius:10px;overflow:hidden;min-width:0}' +
        '#psApp .dfill{height:100%;background:var(--ai);border-radius:10px;transition:width .5s}' +
        '#psApp .dlbl{font-size:12px;font-weight:800;color:var(--ai);min-width:26px;text-align:right;flex-shrink:0}' +
        '#psApp .dpad{display:grid;grid-template-areas:". u ." "l c r" ". d .";gap:9px}' +
        '#psApp .mb{width:50px;height:50px;background:var(--bg);border:none;border-radius:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.14s}' +
        '#psApp .mb:active{background:var(--accent)}' +
        '#psApp .mb:active svg{fill:#fff}' +
        '#psApp .mb svg{width:20px;height:20px;fill:var(--text)}' +
        '#psApp .mc{width:50px;height:50px;background:var(--bg);border-radius:50%;display:flex;align-items:center;justify-content:center}' +
        '#psApp .ps-rounds-orb{width:36px;height:36px;flex-shrink:0;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .2s;display:flex;align-items:center;justify-content:center}' +
        '#psApp .ps-rounds-orb:active{transform:scale(.85)}' +
        '#psApp .ps-rounds-popup{position:fixed;bottom:auto;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:1px solid rgba(42,40,48,.12);border-radius:18px;padding:20px 22px;box-shadow:0 20px 60px rgba(0,0,0,.2);z-index:9999;width:220px;animation:psModalIn .3s cubic-bezier(.16,1,.3,1)}' +
        '#psApp .ps-rounds-popup .ps-rp-title{font-size:9px;font-weight:800;letter-spacing:1.5px;color:var(--sub);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}' +
        '#psApp .ps-rounds-popup .ps-rp-val{font-size:18px;font-weight:900;color:var(--text);text-align:center;margin-bottom:10px}' +
        '#psApp .ps-rounds-popup .ps-rp-slider{width:100%;height:4px;background:rgba(42,40,48,.08);border-radius:2px;outline:none;-webkit-appearance:none;margin-bottom:8px}' +
        '#psApp .ps-rounds-popup .ps-rp-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--accent);cursor:pointer;box-shadow:0 2px 6px rgba(42,40,48,.2)}' +
        '#psApp .ps-rounds-popup .ps-rp-range{display:flex;justify-content:space-between;font-size:9px;color:var(--sub)}' +
        '#psApp .ps-rounds-popup .ps-rp-close{width:18px;height:18px;border-radius:50%;background:rgba(42,40,48,.06);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:var(--sub);line-height:1}' +
        '#psApp .ps-rounds-popup .ps-rp-close:active{background:rgba(42,40,48,.12)}' +
        '';
    }

    function buildHTML(){
        var _psName=_psEntity.nickname||_psEntity.name||'Luna';
        return '<div id="psToasts"></div>' +

        '<div class="hdr">' +
            '<div class="hdr-capsule">' +
                '<div class="hdr-avatars">' +
                    '<div class="hdr-av hdr-av-me" id="psHdrMe"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>' +
                    '<div class="hdr-av hdr-av-luna" id="psHdrAi"><svg width="14" height="14" viewBox="0 0 24 24" fill="#6b667a"><path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/></svg></div>' +
                '</div>' +
                '<div class="hdr-cap-text">' +
                    '<span class="hdr-cap-title" style="font-family:\'DecoFont\',serif;letter-spacing:1px;">Private Room</span>' +
                    '<span class="hdr-cap-sub" id="psSubName">'+_psName+' · Room 01</span>' +
                '</div>' +
            '</div>' +
            '<div class="hdr-right">' +
                '<span class="hdr-tag" id="psTagName">'+_psName+' / '+_psUser.name+'</span>' +
                '<div class="hdr-mood" id="moodPill">平静</div>' +
            '</div>' +
        '</div>' +

        '<div class="stage" id="stage">' +
            '<div class="deco-layer"><div class="deco-main">Bedroom</div><div class="deco-sub">Private Space</div><div class="deco-corner">Room · 01</div><div class="deco-vert">Secret Place</div></div>' +
            '<div class="world" id="world">' +
                '<div class="floor" id="floor">' +
                    '<div class="furn f-rug"></div><div class="furn f-bed"></div><div class="furn f-desk"></div>' +
                    '<div class="furn f-wardrobe"><div class="handle-l"></div><div class="handle-r"></div></div>' +
                    '<div class="furn f-sofa"><div class="arm-l"></div><div class="arm-r"></div></div>' +
                '</div>' +
                '<div class="char char-me" id="cMe"><div class="av" id="psMeAv"><svg viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div><div class="av-name" id="psMeName">'+_psUser.name+'</div><div class="av-dot"></div><div class="av-shadow"></div></div>' +
                '<div class="char char-ai" id="cAi"><div class="av" id="psAiAv"><div class="av-ring"></div><svg viewBox="0 0 24 24" fill="#7c5cfc"><path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/></svg></div><div class="av-name" id="psAiName">'+_psName+'</div><div class="av-dot"></div><div class="av-shadow"></div></div>' +
            '</div>' +
            '<div id="fhint"></div>' +
            '<div class="minimap"><div class="minimap-label">Map</div><div class="mm-dot mm-me" id="mmMe"></div><div class="mm-dot mm-ai" id="mmAi"></div></div>' +
        '</div>' +

        '<div class="bottom">' +
            '<div class="bottom-deco">Dialogue</div>' +
            '<div class="tabs">' +
                '<button class="tab on" data-tab="chat">对话</button>' +
                '<button class="tab" data-tab="act">我的动作</button>' +
                '<button class="tab" data-tab="mv">移动</button>' +
            '</div>' +
            '<div class="pane on" id="pane-chat">' +
                '<div class="msgs" id="msgs"></div>' +
                '<div class="qr-row" id="qrRow">' +
                    '<button class="qr-act" id="btnRecall" data-en="RECALL"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" opacity=".06" fill="#2a2830" stroke="none"/><circle cx="12" cy="12" r="6"/><path d="M12 9v3l2 1.5"/><path d="M18 6l-1.5 1.5" opacity=".4"/></svg>调取</button>' +
                    '<button class="qr-act" id="btnRegen" data-en="REGEN"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" opacity=".06" fill="#2a2830" stroke="none"/><path d="M8 12a4 4 0 1 0 4-4"/><path d="M12 5v3h-3"/><circle cx="12" cy="12" r="1.5" fill="#2a2830" stroke="none" opacity=".3"/></svg>重回</button>' +
                    '<button class="qr-act" id="btnMulti" data-en="SELECT"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" opacity=".06" fill="#2a2830" stroke="none"/><path d="M8 8h2v2H8zM14 8h2v2h-2zM8 14h2v2H8z"/><path d="M14 15l1 1 2.5-2.5"/></svg>多选</button>' +
                    '<div class="ps-rounds-orb" id="psRoundsOrb"><svg viewBox="0 0 36 36" width="36" height="36"><circle cx="18" cy="18" r="16" fill="none" stroke="rgba(42,40,48,0.08)" stroke-width="2.5"/><circle cx="18" cy="18" r="16" fill="none" stroke="var(--ai)" stroke-width="2.5" stroke-dasharray="100.5" stroke-dashoffset="50" stroke-linecap="round" id="psRoundsArc" style="transition:stroke-dashoffset .3s;transform:rotate(-90deg);transform-origin:center;"/><text x="18" y="19" text-anchor="middle" dominant-baseline="middle" font-size="9" font-weight="800" fill="var(--text)" font-family="inherit" id="psRoundsOrbVal">10</text></svg></div>' +
                '</div>' +
                '<div class="multi-bar" id="multiBar" style="display:none;">' +
                    '<button class="qr-act danger" id="btnDel"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>删除所选</button>' +
                    '<button class="qr-act" id="btnMultiCancel"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>取消</button>' +
                '</div>' +
                '<div class="inp-bar">' +
                    '<button class="act-paren-btn" id="psParenBtn">( )</button>' +
                    '<input class="inp" id="inp" placeholder="说些什么…">' +
                    '<button class="exit-btn" id="psExitBtn" title="退出"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9a98a3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>' +
                    '<button class="snd" id="psSendBtn"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4z"/><circle cx="11" cy="13" r="1.5" fill="#7c5cfc" stroke="none"/><path d="M11 13l-5 5" stroke-dasharray="2 2" opacity=".4"/></svg></button>' +
                '</div>' +
            '</div>' +
            '<div class="pane" id="pane-act"><div class="act-scroll">' +
                '<div class="sec">靠近 · 姿态 <span class="sec-deco">Approach</span></div>' +
                '<div class="ag">' +
                    '<button class="ab" data-act="向对方走近了一步" data-anim="do-wobble"><svg viewBox="0 0 24 24"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/></svg><span>走近</span></button>' +
                    '<button class="ab" data-act="在对方旁边慢慢坐了下来" data-anim="do-wobble"><svg viewBox="0 0 24 24"><path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg><span>坐下</span></button>' +
                    '<button class="ab" data-act="停下脚步，静静看着对方" data-anim="do-wobble"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg><span>凝视</span></button>' +
                '</div>' +
                '<div class="sec">触碰 <span class="sec-deco">Touch</span></div>' +
                '<div class="ag">' +
                    '<button class="ab hl" data-act="伸手，指尖轻碰了对方的手背" data-anim="do-shake"><svg viewBox="0 0 24 24"><path d="M13.5 1.5c-1.1 0-2 .9-2 2v10.5l-1.3-.6c-.6-.3-1.3-.2-1.8.3L7 15l5.5 5.5c.5.5 1.2.8 1.9.8h7.1c1.4 0 2.5-1.1 2.5-2.5v-7.1c0-1.4-1.1-2.5-2.5-2.5h-1v-4c0-1.1-.9-2-2-2s-2 .9-2 2v4h-2v-8z"/></svg><span>触碰手</span></button>' +
                    '<button class="ab hl" data-act="将手搭上了对方的肩膀" data-anim="do-wobble"><svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg><span>搭肩</span></button>' +
                    '<button class="ab hl" data-act="从身后把对方轻轻抱住了" data-anim="do-bounce"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg><span>拥抱</span></button>' +
                '</div>' +
                '<div class="sec">表情 · 语气 <span class="sec-deco">Expression</span></div>' +
                '<div class="ag">' +
                    '<button class="ab" data-act="冲她笑了笑" data-anim="do-wobble"><svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg><span>微笑</span></button>' +
                    '<button class="ab" data-act="轻轻叹了口气" data-anim="do-wobble"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg><span>叹气</span></button>' +
                    '<button class="ab hl" data-act="凑到对方耳边，低声说了几个字" data-anim="do-shake"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg><span>耳语</span></button>' +
                    '<button class="ab" data-act="把手轻轻放在对方头上" data-anim="do-wobble"><svg viewBox="0 0 24 24"><path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/></svg><span>摸头</span></button>' +
                    '<button class="ab" data-act="拉住了对方的手，握着没松" data-anim="do-shake"><svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg><span>牵手</span></button>' +
                    '<button class="ab hl" data-act="用额头抵上了对方的额头" data-anim="do-wobble"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg><span>贴额头</span></button>' +
                '</div>' +
            '</div></div>' +
            '<div class="pane" id="pane-mv"><div class="mv-wrap">' +
                '<div class="info-row"><div class="ic"><div class="l">Position X</div><div class="v" id="px">0</div><div class="ic-deco">X</div></div><div class="ic"><div class="l">Position Y</div><div class="v" id="py">0</div><div class="ic-deco">Y</div></div></div>' +
                '<div class="dbar"><span style="font-family:\'DecoFont\',serif;font-size:11px;font-weight:700;color:var(--sub);letter-spacing:1px;white-space:nowrap;">Distance</span><div class="dtrack"><div class="dfill" id="dfill" style="width:40%"></div></div><span class="dlbl" id="dlbl">远</span></div>' +
                '<div class="dpad">' +
                    '<button class="mb" style="grid-area:u" data-dir="up"><svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg></button>' +
                    '<button class="mb" style="grid-area:l" data-dir="left"><svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg></button>' +
                    '<div class="mc" style="grid-area:c"><svg width="14" height="14" viewBox="0 0 24 24" fill="#ccc"><circle cx="12" cy="12" r="5"/></svg></div>' +
                    '<button class="mb" style="grid-area:r" data-dir="right"><svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg></button>' +
                    '<button class="mb" style="grid-area:d" data-dir="down"><svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg></button>' +
                '</div>' +
            '</div></div>' +
        '</div>';
    }

    /* ══ 核心逻辑（从原 HTML 的 <script> 搬过来，所有 ID 选择器加 #psApp 前缀或直接用变量引用） ══ */

    var meW,aiW,cam,camTarget,drag,followPaused,followTimer,moveTimer,moveAccum,aiMoveTimer,aiMoveAccum,lastNearKey;
    var stageEl,worldEl,floorEl,cMeEl,cAiEl,mmMeEl,mmAiEl,fhintEl;
    var _stW=0,_stH=0,_animating=false;
    var _prevCamT='',_prevMeL='',_prevMeT='',_prevAiL='',_prevAiT='';
    var _prevMmMeL='',_prevMmMeT='',_prevMmAiL='',_prevMmAiT='',_prevPx='',_prevPy='';
    var _lastDistLabel='',_lastBtnState=-1,_lastPct=-1;
    var multiMode=false;
    var anchoredFurn=null;

    var moods=['平静','期待','温柔','雀跃','羞涩','心动','慵懒'];
    var emoTags=['在意你','心跳加速','有点紧张','思考中','心动了','温柔'];

    var FURNS=[
        {key:'bed',label:'床',color:'#7c5cfc',cx:196,cy:-100,rx:130,ry:110,actions:[{label:'躺上去',myNarr:'*你在床上轻轻躺了下来，枕头柔软而熟悉*',anim:'do-bounce'},{label:'坐床沿',myNarr:'*你在床边缓缓坐下，弹簧轻轻下沉*',anim:'do-wobble'}]},
        {key:'desk',label:'桌子',color:'#5856d6',cx:210,cy:265,rx:100,ry:90,actions:[{label:'坐桌前',myNarr:'*你在桌前坐下，手指漫不经心敲着桌面*',anim:'do-wobble'},{label:'翻东西',myNarr:'*你随手翻了翻桌上散落的东西*',anim:'do-shake'}]},
        {key:'wardrobe',label:'衣柜',color:'#34aadc',cx:-193,cy:-8,rx:120,ry:110,actions:[{label:'打开衣柜',myNarr:'*你伸手拉开衣柜，一阵淡淡的香气飘散出来*',anim:'do-shake'},{label:'靠着衣柜',myNarr:'*你背靠衣柜站着，懒懒地看向对方*',anim:'do-wobble'}]},
        {key:'sofa',label:'沙发',color:'#ff9500',cx:644,cy:16,rx:190,ry:120,actions:[{label:'坐沙发',myNarr:'*你沉进沙发里，整个人放松下来*',anim:'do-bounce'},{label:'躺沙发',myNarr:'*你横躺在沙发上，腿搭在扶手边*',anim:'do-bounce'}]}
    ];

    var r=function(a){return a[Math.floor(Math.random()*a.length)];};
    function nowTime(){var d=new Date();return d.getHours()+':'+String(d.getMinutes()).padStart(2,'0');}
    function toastAi(msg){var a=document.getElementById('psToasts');var t=document.createElement('div');t.className='toast';t.innerText=msg;a.appendChild(t);while(a.children.length>2)a.removeChild(a.firstChild);setTimeout(function(){t.remove();sysMsg(msg);},2800);}
    function sysMsg(text,permanent){var c=document.getElementById('msgs');var row=document.createElement('div');row.className='mrow sys';if(!permanent)row.classList.add('sys-temp');row.innerHTML='<div class="bub">'+text+'</div>';c.appendChild(row);c.scrollTop=c.scrollHeight;if(permanent)psSaveConv();}

    var _sysMergeTimer=null;
    function sysMsgMerge(text){
        var c=document.getElementById('msgs');
        var row=document.createElement('div');row.className='mrow sys sys-temp';row.innerHTML='<div class="bub">'+text+'</div>';c.appendChild(row);c.scrollTop=c.scrollHeight;
        if(_sysMergeTimer)clearTimeout(_sysMergeTimer);
        _sysMergeTimer=setTimeout(function(){
            _sysMergeTimer=null;
            var temps=[].slice.call(c.querySelectorAll('.mrow.sys.sys-temp'));
            if(temps.length===0)return;
            var lastText=temps[temps.length-1].querySelector('.bub').innerText;
            temps.forEach(function(t,i){
                t.style.transition='opacity .3s,transform .3s';
                t.style.opacity='0';
                t.style.transform='translateY(-6px)';
            });
            setTimeout(function(){
                temps.forEach(function(t){t.remove();});
                var final=document.createElement('div');final.className='mrow sys';final.innerHTML='<div class="bub">'+lastText+'</div>';c.appendChild(final);c.scrollTop=c.scrollHeight;psSaveConv();
            },350);
        },3000);
    }

    function parseMoveCmd(text){
        var match=text.match(/\[MOVE:(CLOSER|AWAY|STAY|FOLLOW|PULL_USER)\]/i);
        var cleaned=text.replace(/\[MOVE:(CLOSER|AWAY|STAY|FOLLOW|PULL_USER)\]/gi,'').trim();
        return{cmd:match?match[1].toUpperCase():'STAY',text:cleaned};
    }

    function executeMove(cmd){
        var dx=meW.x-aiW.x,dy=meW.y-aiW.y,d=Math.sqrt(dx*dx+dy*dy);
        var targetAiX=aiW.x,targetAiY=aiW.y;
        var pullUserTarget=null;
        if(cmd==='CLOSER'){
            if(d>30){var nx=dx/d,ny=dy/d;targetAiX=meW.x-nx*35;targetAiY=meW.y-ny*35;}
        }else if(cmd==='AWAY'){
            var awayDist=Math.min(d+80,300);
            if(d>0){var nx2=dx/d,ny2=dy/d;targetAiX=meW.x-nx2*awayDist;targetAiY=meW.y-ny2*awayDist;}
        }else if(cmd==='FOLLOW'){
            targetAiX=meW.x+(Math.random()-.5)*50;
            targetAiY=meW.y+(Math.random()-.5)*50;
        }else if(cmd==='PULL_USER'){
            /* AI 选一个随机家具方向，带着用户一起过去 */
            var pullTarget=FURNS[Math.floor(Math.random()*FURNS.length)];
            targetAiX=pullTarget.cx+(Math.random()-.5)*40;
            targetAiY=pullTarget.cy+(Math.random()-.5)*40;
            pullUserTarget={x:targetAiX+(Math.random()-.5)*30,y:targetAiY+(Math.random()-.5)*30};
        }
        targetAiX=Math.max(-240,Math.min(660,targetAiX));
        targetAiY=Math.max(-280,Math.min(280,targetAiY));
        var steps=12;var step=0;
        var startX=aiW.x,startY=aiW.y;
        function animStep(){
            step++;
            var t=step/steps;
            var ease=1-Math.pow(1-t,3);
            aiW.x=startX+(targetAiX-startX)*ease;
            aiW.y=startY+(targetAiY-startY)*ease;
            applyWorld();
            if(step<steps)requestAnimationFrame(animStep);
            else{
                psSavePositions();
                if(pullUserTarget){
                    var pSteps=10,pStep=0;
                    var pStartX=meW.x,pStartY=meW.y;
                    var pTx=Math.max(-240,Math.min(660,pullUserTarget.x));
                    var pTy=Math.max(-280,Math.min(280,pullUserTarget.y));
                    function pullAnim(){
                        pStep++;var pt=pStep/pSteps;var pe=1-Math.pow(1-pt,3);
                        meW.x=pStartX+(pTx-pStartX)*pe;
                        meW.y=pStartY+(pTy-pStartY)*pe;
                        followPaused=false;_startAnim();
                        if(pStep<pSteps)requestAnimationFrame(pullAnim);
                        else psSavePositions();
                    }
                    setTimeout(function(){requestAnimationFrame(pullAnim);},200);
                }
            }
        }
        requestAnimationFrame(animStep);
        var _aiName=_psEntity.nickname||_psEntity.name;
        var moveDescs={CLOSER:_aiName+' 靠近了你',AWAY:_aiName+' 后退了一步',FOLLOW:_aiName+' 跟了过来',PULL_USER:_aiName+' 拉着你走了过去',STAY:''};
        if(moveDescs[cmd]){
            toastAi(moveDescs[cmd]);
            setTimeout(function(){sysMsgMerge(_aiName+' moved · ('+Math.round(targetAiX)+', '+Math.round(targetAiY)+')');},500);
        }
    }

    function appendMsg(role,html,tag){
        var _psName=_psEntity.nickname||_psEntity.name||'Luna';
        var c=document.getElementById('msgs');
        var moveCmd='STAY';
        var processedHtml=html;
        if(role==='ai'){
            var parsed=parseMoveCmd(html);
            moveCmd=parsed.cmd;
            processedHtml=parsed.text;
        }
        var narratRegex=/\*([^*]+)\*/g;var narrats=[];var match;
        while((match=narratRegex.exec(processedHtml))!==null)narrats.push(match[1]);
        var cleanHtml=processedHtml.replace(/\*([^*]+)\*/g,'').replace(/<br\s*\/?>\s*/g,'\n').replace(/<i>\s*<\/i>/g,'').replace(/<[^>]*>/g,'').trim();
        narrats.forEach(function(txt){var nr=document.createElement('div');nr.className='mrow sys narr';nr.innerHTML='<div class="bub-narr"><i>'+txt+'</i></div>';c.appendChild(nr);});
        if(cleanHtml){
            var sentences=cleanHtml.split(/\n+/).map(function(s){return s.trim();}).filter(function(s){return s.length>0;});
            if(role==='ai'&&sentences.length>1){
                var firstSent=true;
                sentences.forEach(function(sent,idx){
                    var row=document.createElement('div');row.className='mrow '+role;
                    var s='';
                    if(firstSent){s+='<div class="sender">'+_psName+'</div>';firstSent=false;}
                    s+='<div class="bub">'+sent+'</div>';
                    if(idx===sentences.length-1){
                        s+='<div class="mmeta">';
                        if(tag)s+='<span class="mtag">'+tag+'</span>';
                        s+='<span class="mtime">'+nowTime()+'</span></div>';
                    }
                    row.innerHTML=s;c.appendChild(row);
                });
            }else{
                var row=document.createElement('div');row.className='mrow '+role;
                var s='';
                if(role==='ai')s+='<div class="sender">'+_psName+'</div>';
                var starSvg=role==='me'?'<svg class="bub-star" data-rollback="1" viewBox="0 0 20 20" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><polygon points="10,1 12.4,7.2 19,7.2 13.8,11.2 15.8,17.6 10,13.8 4.2,17.6 6.2,11.2 1,7.2 7.6,7.2" fill="#2a2830" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/></svg>':'';
                s+='<div class="bub">'+starSvg+cleanHtml.replace(/\n/g,' ')+'</div><div class="mmeta">';
                if(tag&&role==='ai')s+='<span class="mtag">'+tag+'</span>';
                s+='<span class="mtime">'+nowTime()+'</span></div>';
                row.innerHTML=s;c.appendChild(row);
            }
        }
        if(role==='ai'&&moveCmd!=='STAY'){
            setTimeout(function(){executeMove(moveCmd);},600);
        }
        requestAnimationFrame(function(){c.scrollTop=c.scrollHeight;});
        psSaveConv();
    }

    function sw(name){
        document.querySelectorAll('#psApp .tab').forEach(function(t){t.classList.remove('on');});
        document.querySelectorAll('#psApp .pane').forEach(function(p){p.classList.remove('on');});
        document.querySelector('#psApp .tab[data-tab="'+name+'"]').classList.add('on');
        document.getElementById('pane-'+name).classList.add('on');
    }

    function checkFurn(){
        if(anchoredFurn)return;
        var hit=null;
        for(var i=0;i<FURNS.length;i++){var f=FURNS[i];var dx=meW.x-f.cx,dy=meW.y-f.cy;if((dx/f.rx)**2+(dy/f.ry)**2<1.0){hit=f;break;}}
        if(hit){if(hit.key!==lastNearKey){lastNearKey=hit.key;showHint(hit);}}else{if(lastNearKey){lastNearKey=null;hideHint();}}
    }
    function showHint(f){
        fhintEl.innerHTML='';
        var nameRow=document.createElement('div');nameRow.className='fhint-name';nameRow.innerHTML='<div class="fhint-dot" style="background:'+f.color+'"></div><span>'+f.label+' · 可以互动</span>';fhintEl.appendChild(nameRow);
        var btnRow=document.createElement('div');btnRow.className='fhint-btns';
        f.actions.forEach(function(a){var btn=document.createElement('button');btn.className='fhint-btn';btn.textContent=a.label;function doIt(e){e.preventDefault();e.stopPropagation();furnInteract(a);}btn.addEventListener('click',doIt);btn.addEventListener('touchend',doIt,{passive:false});btnRow.appendChild(btn);});
        fhintEl.appendChild(btnRow);fhintEl.classList.add('visible');
    }
    function hideHint(){fhintEl.classList.remove('visible');setTimeout(function(){if(!fhintEl.classList.contains('visible'))fhintEl.innerHTML='';},300);}
    function furnInteract(a){
        appendMsg('me','<i>'+a.myNarr+'</i>');
        cMeEl.classList.remove('do-bounce','do-shake','do-wobble');void cMeEl.offsetWidth;cMeEl.classList.add(a.anim);setTimeout(function(){cMeEl.classList.remove(a.anim);},1400);
        anchoredFurn=lastNearKey;
        cMeEl.classList.add('anchored');
        showLeaveHint();
        sw('chat');
    }

    function showLeaveHint(){
        if(!anchoredFurn)return;
        var f=FURNS.find(function(ff){return ff.key===anchoredFurn;});
        if(!f)return;
        fhintEl.innerHTML='';
        var nameRow=document.createElement('div');nameRow.className='fhint-name';
        nameRow.innerHTML='<div class="fhint-dot" style="background:'+f.color+'"></div><span>正在 '+f.label+' 上</span>';
        fhintEl.appendChild(nameRow);
        var btnRow=document.createElement('div');btnRow.className='fhint-btns';
        var leaveBtn=document.createElement('button');leaveBtn.className='fhint-leave';leaveBtn.textContent='起身离开';
        function doLeave(e){e.preventDefault();e.stopPropagation();leaveAnchor();}
        leaveBtn.addEventListener('click',doLeave);
        leaveBtn.addEventListener('touchend',doLeave,{passive:false});
        btnRow.appendChild(leaveBtn);
        fhintEl.appendChild(btnRow);
        fhintEl.classList.add('visible');
    }

    function leaveAnchor(){
        anchoredFurn=null;
        cMeEl.classList.remove('anchored');
        appendMsg('me','<i>*你从原来的位置上站了起来*</i>');
        lastNearKey=null;
        hideHint();
    }

    function applyWorld(){
        var w=_stW||stageEl.offsetWidth,h=_stH||stageEl.offsetHeight;
        var camT='translate('+(w/2-cam.x)+'px,'+(h/2-cam.y)+'px)';if(camT!==_prevCamT){_prevCamT=camT;worldEl.style.transform=camT;}
        var meL=(meW.x-26)+'px',meT=(meW.y-26)+'px';if(meL!==_prevMeL){_prevMeL=meL;cMeEl.style.left=meL;}if(meT!==_prevMeT){_prevMeT=meT;cMeEl.style.top=meT;}
        var aiL=(aiW.x-26)+'px',aiT=(aiW.y-26)+'px';if(aiL!==_prevAiL){_prevAiL=aiL;cAiEl.style.left=aiL;}if(aiT!==_prevAiT){_prevAiT=aiT;cAiEl.style.top=aiT;}
        var range=500,mmW=58,mmH=58;
        var toMM=function(wx,wy){return{x:Math.max(6,Math.min(mmW-6,wx/range*(mmW/2)+mmW/2)),y:Math.max(14,Math.min(mmH-6,wy/range*(mmH/2)+mmH/2))};};
        var mm=toMM(meW.x,meW.y),mai=toMM(aiW.x,aiW.y);
        var mmMeL=mm.x+'px',mmMeT=mm.y+'px';if(mmMeL!==_prevMmMeL){_prevMmMeL=mmMeL;mmMeEl.style.left=mmMeL;}if(mmMeT!==_prevMmMeT){_prevMmMeT=mmMeT;mmMeEl.style.top=mmMeT;}
        var mmAiL=mai.x+'px',mmAiT=mai.y+'px';if(mmAiL!==_prevMmAiL){_prevMmAiL=mmAiL;mmAiEl.style.left=mmAiL;}if(mmAiT!==_prevMmAiT){_prevMmAiT=mmAiT;mmAiEl.style.top=mmAiT;}
        var px=String(Math.round(meW.x)),py=String(Math.round(meW.y));
        if(px!==_prevPx){_prevPx=px;document.getElementById('px').innerText=px;}
        if(py!==_prevPy){_prevPy=py;document.getElementById('py').innerText=py;}
        updDist();checkFurn();
    }
    function _startAnim(){if(_animating)return;_animating=true;_runAnim();}
    function _runAnim(){
        if(!_stW){_stW=stageEl.offsetWidth;_stH=stageEl.offsetHeight;}
        if(!followPaused){camTarget.x=meW.x;camTarget.y=meW.y;}
        var dx=camTarget.x-cam.x,dy=camTarget.y-cam.y;
        if(Math.abs(dx)<0.5&&Math.abs(dy)<0.5){cam.x=camTarget.x;cam.y=camTarget.y;applyWorld();_animating=false;return;}
        cam.x+=dx*0.2;cam.y+=dy*0.2;applyWorld();requestAnimationFrame(_runAnim);
    }

    function updDist(){
        var dx=meW.x-aiW.x,dy=meW.y-aiW.y,d=Math.sqrt(dx*dx+dy*dy);
        var pct=Math.round(Math.max(0,Math.min(100,(1-d/320)*100)));
        if(pct!==_lastPct){_lastPct=pct;document.getElementById('dfill').style.width=pct+'%';}
        var newLabel=d<40?'极近':d<90?'近':d<160?'中':'远';
        if(newLabel!==_lastDistLabel){_lastDistLabel=newLabel;document.getElementById('dlbl').innerText=newLabel;}
        var newState=d<90?1:0;
        if(newState!==_lastBtnState){
            _lastBtnState=newState;
            var btns=document.getElementById('pane-act').querySelectorAll('.ab');
            btns.forEach(function(btn){if(newState){btn.style.opacity='1';btn.style.pointerEvents='auto';}else{btn.style.opacity='0.25';btn.style.pointerEvents='none';}});
        }
    }

    function mvDir(dir){
        if(anchoredFurn){leaveAnchor();}
        var s=22,limitL=-240,limitR=660,limitY=280;
        if(dir==='up')meW.y-=s;if(dir==='down')meW.y+=s;if(dir==='left')meW.x-=s;if(dir==='right')meW.x+=s;
        meW.x=Math.max(limitL,Math.min(limitR,meW.x));meW.y=Math.max(-limitY,Math.min(limitY,meW.y));
        followPaused=false;_startAnim();
        moveAccum++;clearTimeout(moveTimer);
        moveTimer=setTimeout(function(){var steps=moveAccum;moveAccum=0;var desc=steps<=2?'moved a little':steps<=5?'walked a few steps':'walked quite a distance';var nearF='';for(var fi=0;fi<FURNS.length;fi++){var ff=FURNS[fi];var fdx=meW.x-ff.cx,fdy=meW.y-ff.cy;if((fdx/ff.rx)**2+(fdy/ff.ry)**2<1.2){nearF=' · near '+ff.label;break;}}toastAi(desc+' → ('+Math.round(meW.x)+', '+Math.round(meW.y)+')');sysMsgMerge('You '+desc+' · ('+Math.round(meW.x)+', '+Math.round(meW.y)+')'+nearF);psSavePositions();},2000);
    }

    var _psAbort=null;

    function showLoadingBar(){
        hideLoadingBar();
        var bar=document.createElement('div');
        bar.className='ps-loading-bar';
        bar.id='psLoadingBar';
        bar.innerHTML='<div class="ps-load-dots"><div class="ps-load-dot"></div><div class="ps-load-dot"></div><div class="ps-load-dot"></div></div><span class="ps-load-text">'+(_psEntity.nickname||_psEntity.name)+' 正在回应…</span><div class="ps-load-cancel" id="psLoadCancel"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>';
        var bottom=document.querySelector('#psApp .bottom');
        if(bottom)bottom.appendChild(bar);
        document.getElementById('psLoadCancel').addEventListener('click',function(){
            if(_psAbort){_psAbort.abort();_psAbort=null;}
            hideLoadingBar();
            var btnEl=document.getElementById('btnRecall');
            if(btnEl){btnEl.disabled=false;btnEl.style.opacity='1';}
            toastAi('已取消调取');
        });
    }

    function hideLoadingBar(){
        var bar=document.getElementById('psLoadingBar');
        if(bar)bar.remove();
    }

    function recallLast(){
        var btnEl=document.getElementById('btnRecall');
        if(btnEl.disabled)return;btnEl.disabled=true;btnEl.style.opacity='.4';
        showLoadingBar();
        var cfg=_psActiveCfg();var apiKey=cfg.key||'';var apiUrl=cfg.endpoint||'';var apiModel=cfg.model||'';
        if(!apiKey){appendMsg('ai','*未找到API配置，请在聊天应用的 Profile → API Key 中配置*','提示');btnEl.disabled=false;btnEl.style.opacity='1';return;}
        var entity={};try{entity=JSON.parse(localStorage.getItem('ps-current-entity'))||{};}catch(e){}
        var charName=entity.nickname||entity.name||'Luna';var charPersona=entity.persona||entity.description||'';var charScenario=entity.scenario||'';var charNickForUser=entity.userNickname||_psUser.name||'';
        var memories=[];try{var memRaw=localStorage.getItem('ca-memories-'+entity.id);if(memRaw)memories=JSON.parse(memRaw);}catch(e){}
        var chatMsgs=[];
        /* 先从聊天室 conversations 取最近7条作为铺垫上下文 */
        try{
            var _convKey='ca-conv-'+(_psEntity.id||'');
            var _mainConvRaw=null;
            if(window._caConversations&&window._caConversations[_psEntity.id]){
                _mainConvRaw=window._caConversations[_psEntity.id];
            }else{
                var _idbRaw=localStorage.getItem(_convKey);
                if(_idbRaw)_mainConvRaw=JSON.parse(_idbRaw);
            }
            if(!_mainConvRaw&&window.ChatDB&&window.ChatDB._cache){
                _mainConvRaw=window.ChatDB._cache[_psEntity.id]||null;
            }
            if(_mainConvRaw&&_mainConvRaw.length){
                var _last7=_mainConvRaw.slice(-7);
                _last7.forEach(function(m){
                    if(m.role==='user'||m.role==='assistant'){
                        chatMsgs.push({role:m.role==='user'?'user':'assistant',content:m.text||''});
                    }
                });
            }
        }catch(e){}
        /* 再加 Private Space 内的对话 */
        document.getElementById('msgs').querySelectorAll('.mrow.ai,.mrow.me').forEach(function(row){var bub=row.querySelector('.bub');if(!bub)return;var role=row.classList.contains('me')?'user':'assistant';chatMsgs.push({role:role,content:bub.innerText.trim()});});
        var myPos='('+Math.round(meW.x)+','+Math.round(meW.y)+')';var aiPos='('+Math.round(aiW.x)+','+Math.round(aiW.y)+')';var dist=Math.round(Math.sqrt(Math.pow(meW.x-aiW.x,2)+Math.pow(meW.y-aiW.y,2)));var distDesc=dist<40?'极近，几乎贴在一起':dist<90?'很近，伸手可触':dist<160?'中等距离':dist<240?'有些远':'很远';
        var nearFurn='无';for(var fi=0;fi<FURNS.length;fi++){var ff=FURNS[fi];var fdx=meW.x-ff.cx,fdy=meW.y-ff.cy;if((fdx/ff.rx)**2+(fdy/ff.ry)**2<1.2){nearFurn=ff.label;break;}}
        var systemPrompt='你是'+charName+'。\n';if(charPersona)systemPrompt+='人设：'+charPersona+'\n';if(charScenario)systemPrompt+='场景：'+charScenario+'\n';if(memories.length)systemPrompt+='记忆：'+memories.map(function(m){return m.content||m;}).join('；')+'\n';
        systemPrompt+='对方的名字/称呼：'+charNickForUser+'\n';
        var userMood=_psEntity.id?localStorage.getItem('ps-mood-'+_psEntity.id):null;
        if(userMood)systemPrompt+='对方当前的状态/心情：'+userMood+'\n';
        systemPrompt+='当前场景：私人空间/房间内，你和对方独处。\n';
        systemPrompt+='【空间感知】\n';
        systemPrompt+='- 对方当前位置：'+myPos+'，你的位置：'+aiPos+'\n';
        systemPrompt+='- 你们的距离：约'+dist+'单位（'+distDesc+'）\n';
        systemPrompt+='- 对方靠近的家具：'+nearFurn+'\n';
        systemPrompt+='- 房间家具布局及坐标：\n';
        systemPrompt+='  · 床 Bed：位置(196,-100)，在房间右上方\n';
        systemPrompt+='  · 桌子 Desk：位置(210,265)，在房间右下方\n';
        systemPrompt+='  · 衣柜 Wardrobe：位置(-193,-8)，在房间左侧\n';
        systemPrompt+='  · 沙发 Sofa：位置(644,16)，在房间最右边\n';
        systemPrompt+='  · 中央地毯 Rug：位置(0,0)，房间正中央\n';
        systemPrompt+='- 坐标范围：X从-240到660，Y从-280到280。数值越近表示距离越近。\n\n';
        systemPrompt+='【行为指令 — 空间自主性】\n';
        systemPrompt+='你是一个有自己意志的人，你在这个房间里有自己想去的地方、想做的事。\n';
        systemPrompt+='你的移动决策必须基于你自己的性格、情绪和当前情境，而不是机械地跟随对方。\n';
        systemPrompt+='具体规则：\n';
        systemPrompt+='- 你可以主动走向房间里的任何家具（床、沙发、桌子、衣柜），不需要对方先去。\n';
        systemPrompt+='- 你可以因为害羞、生气、想独处而主动远离对方。\n';
        systemPrompt+='- 你可以因为好奇、想靠近、心动而主动走近。\n';
        systemPrompt+='- 禁止每次都选 FOLLOW 或 STAY。你必须像真人一样有自己的空间行为。\n';
        systemPrompt+='- 如果对方没有特别的动作，你也可以自己找事做（走到窗边、坐到沙发上、翻桌上的东西等），并在动作描写中体现。\n\n';
        systemPrompt+='在回复末尾，你必须附加一个移动指令标签：\n';
        systemPrompt+='- [MOVE:CLOSER] 你主动靠近对方\n';
        systemPrompt+='- [MOVE:AWAY] 你后退、拉开距离、或走向别的地方\n';
        systemPrompt+='- [MOVE:STAY] 你原地不动（只在你确实不想动时使用）\n';
        systemPrompt+='- [MOVE:FOLLOW] 你跟着对方走（只在对方刚移动且你确实想跟时使用）\n';
        systemPrompt+='- [MOVE:PULL_USER] 你拉着/带着对方一起移动到某个地方（比如拉着对方走向床边、沙发等）\n';
        systemPrompt+='这个标签必须出现且只出现一次，放在回复最末尾。\n';
        systemPrompt+='重要：不要总是选 CLOSER 或 FOLLOW，要根据你的情绪和性格自然选择。有时候保持距离、有时候主动走开，才像真人。\n\n';
        systemPrompt+='【回复格式】\n';
        systemPrompt+='1. 动作描写用星号包裹（如 *缓缓走近，指尖拂过桌沿*），要写得细腻、有画面感、至少2-3句，描写身体细节、光影、气息、触感等微观感受。\n';
        systemPrompt+='2. 对话部分要自然分句，每句话单独一行，不要把所有话挤在一起。像真人发消息一样，一句一句说。\n';
        systemPrompt+='3. 整体节奏：先一段沉浸的动作描写，再一到三句简短的对话，最后是移动标签。\n';
        systemPrompt+='4. 用中文回复，保持角色性格，语气亲密自然。\n';
        systemPrompt+='5. 你要对对方的每一个动作、每一句话都有明确的身体反应和情绪回应，不能无视任何细节。对方靠近你就感受到体温，对方触碰你就有生理反应（心跳、呼吸、皮肤触感），对方说了暧昧的话就脸热。反应要具体、即时、有层次。\n';
        systemPrompt+='6. 如果对方在家具上（床、沙发等），你要自然地回应这个场景，比如也坐过去、站在旁边看着、或评论这个动作。不要忽略对方与家具的互动。\n';
        if(anchoredFurn){var af=FURNS.find(function(ff){return ff.key===anchoredFurn;});if(af)systemPrompt+='7. 对方目前正在'+af.label+'上，请结合这个位置进行互动。\n';}
        var _psRounds=parseInt((_psEntity.id?localStorage.getItem('ps-rounds-'+_psEntity.id):null)||'10',10);
        var messages=[{role:'system',content:systemPrompt}];var recent=chatMsgs.slice(-_psRounds);recent.forEach(function(m){messages.push(m);});
        if(!recent.length||recent[recent.length-1].role!=='user'){messages.push({role:'user',content:'（对方走进了房间，看着你）'});}
        var url=_psNormEp(apiUrl);
        _psAbort=new AbortController();
        fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:apiModel||'gpt-3.5-turbo',messages:messages,max_tokens:400,temperature:0.92}),signal:_psAbort.signal}).then(function(res){return res.json();}).then(function(data){var text='';if(data.choices&&data.choices[0]){text=data.choices[0].message?data.choices[0].message.content:data.choices[0].text||'';}else if(data.error){text='*API错误：'+(data.error.message||JSON.stringify(data.error))+'*';}if(!text)text='*没有收到回复*';hideLoadingBar();toastAi((_psEntity.nickname||_psEntity.name)+' 回应了');appendMsg('ai',text,r(emoTags));var _userSetMood=_psEntity.id?localStorage.getItem('ps-mood-'+_psEntity.id):null;if(!_userSetMood)document.getElementById('moodPill').innerText=r(moods);}).catch(function(err){hideLoadingBar();if(err.name==='AbortError')return;toastAi('调取失败');appendMsg('ai','<i>*请求失败：'+err.message+'*</i>','错误');}).finally(function(){_psAbort=null;btnEl.disabled=false;btnEl.style.opacity='1';});
    }

    function regenLast(){
        var msgs=document.getElementById('msgs');var rows=[].slice.call(msgs.querySelectorAll('.mrow.ai'));if(!rows.length)return;
        rows[rows.length-1].remove();var narrs_before=[].slice.call(msgs.querySelectorAll('.mrow.sys.narr'));if(narrs_before.length)narrs_before[narrs_before.length-1].remove();
        psSaveConv();
    }

    function toggleMulti(){
        multiMode=!multiMode;var msgs=document.getElementById('msgs');var bar=document.getElementById('multiBar');var qrRow=document.getElementById('qrRow');
        if(multiMode){bar.style.display='flex';qrRow.style.display='none';msgs.querySelectorAll('.mrow').forEach(function(r){r.classList.add('selecting');r.onclick=function(){r.classList.toggle('selected');};});}
        else{bar.style.display='none';qrRow.style.display='flex';msgs.querySelectorAll('.mrow').forEach(function(r){r.classList.remove('selecting','selected');r.onclick=null;});}
    }
    function deleteSelected(){document.getElementById('msgs').querySelectorAll('.mrow.selected').forEach(function(r){r.remove();});toggleMulti();psSaveConv();}
    function psSend(){
        var inp=document.getElementById('inp');var v=inp.value.trim();if(!v)return;
        inp.value='';
        var parenBtn=document.getElementById('psParenBtn');
        if(parenBtn)parenBtn.classList.remove('on');
        var parts=[];var regex=/[（(]([^）)]+)[）)]/g;var lastIdx=0;var m;
        while((m=regex.exec(v))!==null){
            var before=v.substring(lastIdx,m.index).trim();
            if(before)parts.push({type:'text',content:before});
            parts.push({type:'act',content:m[1].trim()});
            lastIdx=regex.lastIndex;
        }
        var after=v.substring(lastIdx).trim();
        if(after)parts.push({type:'text',content:after});
        if(parts.length===0)parts.push({type:'text',content:v});
        var hasAct=parts.some(function(p){return p.type==='act';});
        if(!hasAct){
            appendMsg('me',v);
        }else{
            parts.forEach(function(p){
                if(p.type==='act'){
                    appendMsg('me','<i>*'+p.content+'*</i>');
                }else if(p.type==='text'&&p.content){
                    appendMsg('me',p.content);
                }
            });
        }
    }

    function actClick(btn){
        var myDesc=btn.dataset.act,myAnim=btn.dataset.anim;
        appendMsg('me','<i>*'+myDesc+'*</i>');
        cMeEl.classList.remove('do-bounce','do-shake','do-wobble');void cMeEl.offsetWidth;cMeEl.classList.add(myAnim);
        setTimeout(function(){cMeEl.classList.remove(myAnim);},1400);
        sw('chat');
        /* 自动调取对方回应 */
        setTimeout(function(){recallLast();},800);
    }

    var _psSaveTimer=null;
    function psLoadConv(){
        if(!_psEntity.id)return[];
        try{var raw=localStorage.getItem('ps-conv-'+_psEntity.id);if(raw)return JSON.parse(raw);}catch(e){}
        return[];
    }
    function psSaveConv(){
        if(!_psEntity.id)return;
        if(_psSaveTimer)clearTimeout(_psSaveTimer);
        _psSaveTimer=setTimeout(function(){
            _psSaveTimer=null;
            try{
                var msgs=document.getElementById('msgs');
                if(!msgs)return;
                var data=[];
                msgs.querySelectorAll('.mrow').forEach(function(row){
                    if(row.classList.contains('sys')&&row.classList.contains('narr')){
                        var narrEl=row.querySelector('.bub-narr');
                        if(narrEl)data.push({type:'narr',text:narrEl.innerText.trim()});
                    }else if(row.classList.contains('sys')){
                        var sysEl=row.querySelector('.bub');
                        if(sysEl)data.push({type:'sys',text:sysEl.innerText.trim()});
                    }else if(row.classList.contains('ai')){
                        var bubEls=row.querySelectorAll('.bub');
                        var tag='';var tagEl=row.querySelector('.mtag');if(tagEl)tag=tagEl.innerText.trim();
                        bubEls.forEach(function(b){data.push({type:'ai',text:b.innerText.trim(),tag:tag});});
                    }else if(row.classList.contains('me')){
                        var bub=row.querySelector('.bub');
                        if(bub)data.push({type:'me',text:bub.innerText.trim()});
                    }
                });
                localStorage.setItem('ps-conv-'+_psEntity.id,JSON.stringify(data));
            }catch(e){}
        },300);
    }
    function psSavePositions(){
        if(!_psEntity.id)return;
        localStorage.setItem('ps-pos-'+_psEntity.id,JSON.stringify({me:meW,ai:aiW}));
    }
    function psLoadPositions(){
        if(!_psEntity.id)return;
        try{var raw=localStorage.getItem('ps-pos-'+_psEntity.id);if(raw){var pos=JSON.parse(raw);if(pos.me){meW.x=pos.me.x;meW.y=pos.me.y;}if(pos.ai){aiW.x=pos.ai.x;aiW.y=pos.ai.y;}}}catch(e){}
    }

    function psRestoreConv(){
        var data=psLoadConv();
        if(!data.length)return;
        var c=document.getElementById('msgs');
        var _psName=_psEntity.nickname||_psEntity.name||'Luna';
        data.forEach(function(item){
            var row=document.createElement('div');
            if(item.type==='narr'){
                row.className='mrow sys narr';
                row.innerHTML='<div class="bub-narr"><i>'+item.text+'</i></div>';
            }else if(item.type==='sys'){
                row.className='mrow sys';
                row.innerHTML='<div class="bub">'+item.text+'</div>';
            }else if(item.type==='ai'){
                row.className='mrow ai';
                var s='<div class="sender">'+_psName+'</div>';
                s+='<div class="bub">'+item.text+'</div>';
                s+='<div class="mmeta">';
                if(item.tag)s+='<span class="mtag">'+item.tag+'</span>';
                s+='</div>';
                row.innerHTML=s;
            }else if(item.type==='me'){
                row.className='mrow me';
                row.innerHTML='<div class="bub"><svg class="bub-star" viewBox="0 0 20 20" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><polygon points="10,1 12.4,7.2 19,7.2 13.8,11.2 15.8,17.6 10,13.8 4.2,17.6 6.2,11.2 1,7.2 7.6,7.2" fill="#2a2830" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/></svg>'+item.text+'</div>';
            }
            c.appendChild(row);
        });
        requestAnimationFrame(function(){c.scrollTop=c.scrollHeight;});
        psSaveConv();
    }

    function initState(){
        meW={x:0,y:0};aiW={x:110,y:-50};cam={x:0,y:0};camTarget={x:0,y:0};
        drag={on:false,sx:0,sy:0,cx:0,cy:0};followPaused=false;followTimer=null;moveTimer=null;moveAccum=0;aiMoveTimer=null;aiMoveAccum=0;lastNearKey=null;
        _stW=0;_stH=0;_animating=false;_prevCamT='';_prevMeL='';_prevMeT='';_prevAiL='';_prevAiT='';_prevMmMeL='';_prevMmMeT='';_prevMmAiL='';_prevMmAiT='';_prevPx='';_prevPy='';_lastDistLabel='';_lastBtnState=-1;_lastPct=-1;
    }

    function setupAvatars(){
        var _psName=_psEntity.nickname||_psEntity.name||'Luna';
        var _hdrMe=document.getElementById('psHdrMe');
        if(_psUser.avatar)_hdrMe.innerHTML='<img src="'+_psUser.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
        var _hdrAi=document.getElementById('psHdrAi');
        if(_psEntity.avatar){_hdrAi.innerHTML='<img src="'+_psEntity.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';}
        else if(_psEntity.color){_hdrAi.style.background=_psEntity.color;_hdrAi.style.border='none';_hdrAi.innerHTML='<span style="font-size:12px;font-weight:700;color:#fff;">'+(_psName||'?').charAt(0).toUpperCase()+'</span>';}
        var _aiAvEl=document.getElementById('psAiAv');
        if(_psEntity.avatar){_aiAvEl.innerHTML='<div class="av-ring"></div><img src="'+_psEntity.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;inset:0;">';}
        else if(_psEntity.color){_aiAvEl.style.background=_psEntity.color;_aiAvEl.style.border='none';_aiAvEl.innerHTML='<div class="av-ring"></div><span style="font-size:20px;font-weight:700;color:#fff;">'+(_psName||'?').charAt(0).toUpperCase()+'</span>';}
        var _meAvEl=document.getElementById('psMeAv');
        if(_psUser.avatar){_meAvEl.innerHTML='<img src="'+_psUser.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;inset:0;">';}
        else{_meAvEl.innerHTML='<span style="font-size:20px;font-weight:700;color:#fff;">'+(_psUser.name||'U').charAt(0).toUpperCase()+'</span>';}
    }

    function showSummarizeModal(){
        var existing=document.querySelector('.ps-sum-overlay');if(existing)existing.remove();
        var existing2=document.querySelector('.ps-sum-modal');if(existing2)existing2.remove();
        var overlay=document.createElement('div');overlay.className='ps-sum-overlay';
        var modal=document.createElement('div');modal.className='ps-sum-modal';
        modal.innerHTML='<div class="ps-sum-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>'+
            '<div class="ps-sum-title">总结本次互动</div>'+
            '<div class="ps-sum-sub">将 Private Space 的对话总结为记忆<br>写入聊天室的记忆系统</div>'+
            '<div class="ps-sum-status" id="psSumStatus"></div>'+
            '<div class="ps-sum-btns">'+
                '<button class="ps-sum-btn ps-sum-cancel" id="psSumCancel">取消</button>'+
                '<button class="ps-sum-btn ps-sum-do" id="psSumDo">开始总结</button>'+
            '</div>';
        document.getElementById('psApp').appendChild(overlay);
        document.getElementById('psApp').appendChild(modal);
        function closeM(){overlay.remove();modal.remove();}
        overlay.addEventListener('click',closeM);
        document.getElementById('psSumCancel').addEventListener('click',closeM);
        document.getElementById('psSumDo').addEventListener('click',function(){
            var btn=this;btn.classList.add('ps-sum-doing');btn.textContent='总结中…';
            var status=document.getElementById('psSumStatus');status.textContent='正在分析对话…';
            doSummarize(function(ok,msg){
                if(ok){status.textContent='✓ '+msg;btn.textContent='完成';btn.classList.remove('ps-sum-doing');setTimeout(function(){closeM();var app=document.getElementById('psApp');if(app)app.style.display='none';},1200);}
                else{status.textContent='✕ '+msg;btn.textContent='重试';btn.classList.remove('ps-sum-doing');}
            });
        });
    }

    function doSummarize(cb){
        var cfg=_psActiveCfg();
        if(!cfg.key){cb(false,'未配置API');return;}
        var msgs=document.getElementById('msgs');
        var rows=[].slice.call(msgs.querySelectorAll('.mrow.ai,.mrow.me,.mrow.sys.narr'));
        if(rows.length<2){cb(false,'对话太少，无需总结');return;}
        var transcript=[];
        rows.forEach(function(row){
            var bub=row.querySelector('.bub')||row.querySelector('.bub-narr');
            if(!bub)return;
            var role=row.classList.contains('me')?'User':row.classList.contains('ai')?(_psEntity.nickname||_psEntity.name):'Narr';
            transcript.push(role+': '+bub.innerText.trim());
        });
        var now=new Date();
        var dateStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
        var prompt='你是一个记忆总结系统。请阅读以下 Private Space（私密空间）中的互动记录，提取关键记忆。\n\n'+
            '时间：'+dateStr+'\n'+
            '场景：私人房间内独处\n\n'+
            '【规则】\n'+
            '- 用 [user] 代替用户，[char] 代替角色\n'+
            '- 每条记忆必须包含时间、事件、双方情绪\n'+
            '- 输出格式：每行一条，前缀 HIGH: / MID: / LOW:\n'+
            '- HIGH: 关系转变、重要承诺、关键情绪节点\n'+
            '- MID: 互动细节、身体接触、专属默契\n'+
            '- LOW: 临时场景、当前情绪底色\n\n'+
            '对话记录：\n'+transcript.join('\n');
        var url=_psNormEp(cfg.endpoint);
        fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.key},body:JSON.stringify({model:cfg.model||'gpt-3.5-turbo',messages:[{role:'user',content:prompt}],max_tokens:600,temperature:0.4})})
        .then(function(res){return res.json();})
        .then(function(data){
            var text=data.choices&&data.choices[0]&&data.choices[0].message?data.choices[0].message.content:'';
            if(!text){cb(false,'未收到回复');return;}
            var parsed={high:[],mid:[],low:[]};
            text.split('\n').forEach(function(line){
                line=line.trim();
                if(line.toUpperCase().indexOf('HIGH:')===0)parsed.high.push(line.substring(5).trim());
                else if(line.toUpperCase().indexOf('MID:')===0)parsed.mid.push(line.substring(4).trim());
                else if(line.toUpperCase().indexOf('LOW:')===0)parsed.low.push(line.substring(4).trim());
            });
            var memKey='ca-memory-'+_psEntity.id;
            var existing={high:[],mid:[],low:[]};
            try{var raw=localStorage.getItem(memKey);if(raw)existing=JSON.parse(raw);}catch(e){}
            existing.high=existing.high.concat(parsed.high);
            existing.mid=existing.mid.concat(parsed.mid);
            existing.low=existing.low.concat(parsed.low);
            localStorage.setItem(memKey,JSON.stringify(existing));
            var total=parsed.high.length+parsed.mid.length+parsed.low.length;
            cb(true,'写入 '+total+' 条记忆');
        })
        .catch(function(err){cb(false,err.message);});
    }

    function showSummarizeModal(){
        var existing=document.querySelector('.ps-sum-overlay');if(existing)existing.remove();
        var existing2=document.querySelector('.ps-sum-modal');if(existing2)existing2.remove();
        var overlay=document.createElement('div');overlay.className='ps-sum-overlay';
        var modal=document.createElement('div');modal.className='ps-sum-modal';
        modal.innerHTML='<div class="ps-sum-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>'+
            '<div class="ps-sum-title">总结本次互动</div>'+
            '<div class="ps-sum-sub">将 Private Space 的对话总结为记忆<br>写入聊天室的记忆系统</div>'+
            '<div class="ps-sum-status" id="psSumStatus"></div>'+
            '<div class="ps-sum-btns">'+
                '<button class="ps-sum-btn ps-sum-cancel" id="psSumCancel">取消</button>'+
                '<button class="ps-sum-btn ps-sum-do" id="psSumDo">开始总结</button>'+
            '</div>';
        document.getElementById('psApp').appendChild(overlay);
        document.getElementById('psApp').appendChild(modal);
        function closeM(){overlay.remove();modal.remove();}
        overlay.addEventListener('click',closeM);
        document.getElementById('psSumCancel').addEventListener('click',closeM);
        document.getElementById('psSumDo').addEventListener('click',function(){
            var btn=this;btn.classList.add('ps-sum-doing');btn.textContent='总结中…';
            var status=document.getElementById('psSumStatus');status.textContent='正在分析对话…';
            doSummarize(function(ok,msg){
                if(ok){status.textContent='✓ '+msg;btn.textContent='完成';btn.classList.remove('ps-sum-doing');setTimeout(function(){closeM();var app=document.getElementById('psApp');if(app)app.style.display='none';},1200);}
                else{status.textContent='✕ '+msg;btn.textContent='重试';btn.classList.remove('ps-sum-doing');}
            });
        });
    }

    function doSummarize(cb){
        var cfg=_psActiveCfg();
        if(!cfg.key){cb(false,'未配置API');return;}
        var msgs=document.getElementById('msgs');
        var rows=[].slice.call(msgs.querySelectorAll('.mrow.ai,.mrow.me,.mrow.sys.narr'));
        if(rows.length<2){cb(false,'对话太少，无需总结');return;}
        var transcript=[];
        rows.forEach(function(row){
            var bub=row.querySelector('.bub')||row.querySelector('.bub-narr');
            if(!bub)return;
            var role=row.classList.contains('me')?'User':row.classList.contains('ai')?(_psEntity.nickname||_psEntity.name):'Narr';
            transcript.push(role+': '+bub.innerText.trim());
        });
        var now=new Date();
        var dateStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
        var prompt='你是一个记忆总结系统。请阅读以下 Private Space（私密空间）中的互动记录，提取关键记忆。\n\n'+
            '时间：'+dateStr+'\n'+
            '场景：私人房间内独处\n\n'+
            '【规则】\n'+
            '- 用 [user] 代替用户，[char] 代替角色\n'+
            '- 每条记忆必须包含时间、事件、双方情绪\n'+
            '- 输出格式：每行一条，前缀 HIGH: / MID: / LOW:\n'+
            '- HIGH: 关系转变、重要承诺、关键情绪节点\n'+
            '- MID: 互动细节、身体接触、专属默契\n'+
            '- LOW: 临时场景、当前情绪底色\n\n'+
            '对话记录：\n'+transcript.join('\n');
        var url=_psNormEp(cfg.endpoint);
        fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.key},body:JSON.stringify({model:cfg.model||'gpt-3.5-turbo',messages:[{role:'user',content:prompt}],max_tokens:600,temperature:0.4})})
        .then(function(res){return res.json();})
        .then(function(data){
            var text=data.choices&&data.choices[0]&&data.choices[0].message?data.choices[0].message.content:'';
            if(!text){cb(false,'未收到回复');return;}
            var parsed={high:[],mid:[],low:[]};
            text.split('\n').forEach(function(line){
                line=line.trim();
                if(line.toUpperCase().indexOf('HIGH:')===0)parsed.high.push(line.substring(5).trim());
                else if(line.toUpperCase().indexOf('MID:')===0)parsed.mid.push(line.substring(4).trim());
                else if(line.toUpperCase().indexOf('LOW:')===0)parsed.low.push(line.substring(4).trim());
            });
            var memKey='ca-memory-'+_psEntity.id;
            var existing={high:[],mid:[],low:[]};
            try{var raw=localStorage.getItem(memKey);if(raw)existing=JSON.parse(raw);}catch(e){}
            existing.high=existing.high.concat(parsed.high);
            existing.mid=existing.mid.concat(parsed.mid);
            existing.low=existing.low.concat(parsed.low);
            localStorage.setItem(memKey,JSON.stringify(existing));
            var total=parsed.high.length+parsed.mid.length+parsed.low.length;
            cb(true,'写入 '+total+' 条记忆');
        })
        .catch(function(err){cb(false,err.message);});
    }

    function showRollbackConfirm(targetRow){
        var existing=document.querySelector('.ps-rb-overlay');
        if(existing)existing.remove();
        var existing2=document.querySelector('.ps-rollback-confirm');
        if(existing2)existing2.remove();

        var c=document.getElementById('msgs');
        var allRows=[].slice.call(c.querySelectorAll('.mrow'));
        var idx=allRows.indexOf(targetRow);
        if(idx<0)return;
        var countAfter=allRows.length-idx-1;

        var overlay=document.createElement('div');
        overlay.className='ps-rb-overlay';
        var modal=document.createElement('div');
        modal.className='ps-rollback-confirm';
        modal.innerHTML='<div class="ps-rb-title">回溯到此处？</div>'+
            '<div class="ps-rb-sub">将删除此条之后的 '+countAfter+' 条记录<br>此操作不可撤销</div>'+
            '<div class="ps-rb-btns">'+
                '<button class="ps-rb-btn ps-rb-cancel">取消</button>'+
                '<button class="ps-rb-btn ps-rb-do">确认回溯</button>'+
            '</div>';

        document.getElementById('psApp').appendChild(overlay);
        document.getElementById('psApp').appendChild(modal);

        function closeModal(){
            overlay.remove();
            modal.remove();
        }

        overlay.addEventListener('click',closeModal);
        modal.querySelector('.ps-rb-cancel').addEventListener('click',closeModal);
        modal.querySelector('.ps-rb-do').addEventListener('click',function(){
            var rows=[].slice.call(c.querySelectorAll('.mrow'));
            var cutIdx=rows.indexOf(targetRow);
            if(cutIdx>=0){
                for(var i=rows.length-1;i>cutIdx;i--){
                    rows[i].style.transition='opacity .25s,transform .25s';
                    rows[i].style.opacity='0';
                    rows[i].style.transform='translateY(-10px)';
                }
                setTimeout(function(){
                    var rows2=[].slice.call(c.querySelectorAll('.mrow'));
                    var cutIdx2=rows2.indexOf(targetRow);
                    for(var j=rows2.length-1;j>cutIdx2;j--){
                        rows2[j].remove();
                    }
                    psSaveConv();
                },280);
            }
            closeModal();
        });
    }

    function bindAll(){
        stageEl=document.getElementById('stage');worldEl=document.getElementById('world');floorEl=document.getElementById('floor');
        cMeEl=document.getElementById('cMe');cAiEl=document.getElementById('cAi');mmMeEl=document.getElementById('mmMe');mmAiEl=document.getElementById('mmAi');fhintEl=document.getElementById('fhint');

        /* long press message → rollback with star animation */
        var _lpTimer=null;
        var msgsContainer=document.getElementById('msgs');
        function startLp(e){
            var mrow=e.target.closest('.mrow.me');
            if(!mrow)return;
            _lpTimer=setTimeout(function(){
                _lpTimer=null;
                var star=mrow.querySelector('.bub-star');
                if(star){star.classList.remove('star-anim');void star.offsetWidth;star.classList.add('star-anim');}
                showRollbackConfirm(mrow);
            },600);
        }
        function cancelLp(){if(_lpTimer){clearTimeout(_lpTimer);_lpTimer=null;}}
        msgsContainer.addEventListener('touchstart',startLp,{passive:true});
        msgsContainer.addEventListener('touchend',cancelLp,{passive:true});
        msgsContainer.addEventListener('touchmove',cancelLp,{passive:true});
        msgsContainer.addEventListener('mousedown',startLp);
        msgsContainer.addEventListener('mouseup',cancelLp);
        msgsContainer.addEventListener('mouseleave',cancelLp);

        /* mood pill - custom status */
        var moodPill=document.getElementById('moodPill');
        moodPill.style.cursor='pointer';
        moodPill.addEventListener('click',function(e){
            e.stopPropagation();
            var existing=document.querySelector('#psApp .ps-mood-input');
            if(existing){existing.remove();return;}
            var pop=document.createElement('div');pop.className='ps-mood-input';
            pop.innerHTML='<input type="text" id="psMoodInp" placeholder="输入你的状态…" maxlength="8"><button class="ps-mood-save" id="psMoodSave">确定</button>';
            moodPill.parentNode.style.position='relative';
            moodPill.parentNode.appendChild(pop);
            var inp=document.getElementById('psMoodInp');
            inp.value=moodPill.innerText;
            inp.focus();
            inp.select();
            document.getElementById('psMoodSave').addEventListener('click',function(){
                var val=inp.value.trim()||'平静';
                moodPill.innerText=val;
                if(_psEntity.id){
                    localStorage.setItem('ps-mood-'+_psEntity.id,val);
                    /* 写入聊天室作为 info 消息 */
                    if(window._caConversations&&window._caConversations[_psEntity.id]){
                        var _infoText='::SYSTEM_NOTE::{source:private_space,type:user_mood_change,is_user_speech:FALSE}:: [user] 当前的情绪/状态变为：「'+val+'」。这是 [user] 自己设定的状态，不是 [char] 的状态。';
                        window._caConversations[_psEntity.id].push({role:'info',text:_infoText,ai_visible:true,time:new Date().toISOString().slice(0,16).replace('T',' ')});
                        if(window.ChatDB&&window.ChatDB.saveConversation)window.ChatDB.saveConversation(_psEntity.id,window._caConversations[_psEntity.id]);
                    }
                }
                pop.remove();
            });
            inp.addEventListener('keydown',function(ev){if(ev.key==='Enter'){document.getElementById('psMoodSave').click();}});
            setTimeout(function(){document.addEventListener('click',function _cl(ev){if(!pop.contains(ev.target)&&ev.target!==moodPill){pop.remove();document.removeEventListener('click',_cl);}});},50);
        });

        /* tabs */
        document.querySelectorAll('#psApp .tab').forEach(function(t){t.addEventListener('click',function(){sw(t.dataset.tab);});});

        /* 轮数圆球 — 长按弹出调整 */
        var psOrb=document.getElementById('psRoundsOrb');
        var psOrbVal=document.getElementById('psRoundsOrbVal');
        var psOrbArc=document.getElementById('psRoundsArc');
        var _orbLpTimer=null;
        var _orbPopup=null;

        function updateOrbVisual(val){
            val=parseInt(val,10)||10;
            if(psOrbVal)psOrbVal.textContent=val;
            /* arc: full circle = 100.5 (2*PI*16), offset = 100.5 * (1 - val/20) */
            var pct=val/20;
            var offset=100.5*(1-pct);
            if(psOrbArc)psOrbArc.style.strokeDashoffset=offset;
        }

        function showRoundsPopup(){
            closeRoundsPopup();
            var savedR=_psEntity.id?localStorage.getItem('ps-rounds-'+_psEntity.id):null;
            var curVal=savedR||'10';

            var overlay=document.createElement('div');
            overlay.id='psRoundsOverlay';
            overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.15);z-index:9998;animation:psRbFade .2s ease;';
            overlay.addEventListener('click',closeRoundsPopup);

            var pop=document.createElement('div');
            pop.className='ps-rounds-popup';
            pop.id='psRoundsPopup';
            pop.innerHTML='<div class="ps-rp-title"><span>Context Rounds</span><button class="ps-rp-close" id="psRpClose">\u2715</button></div>'+
                '<div class="ps-rp-val" id="psRpVal">'+curVal+'</div>'+
                '<input type="range" class="ps-rp-slider" id="psRpSlider" min="4" max="20" value="'+curVal+'">'+
                '<div class="ps-rp-range"><span>4</span><span>20</span></div>';

            var psAppEl=document.getElementById('psApp');
            if(psAppEl){psAppEl.appendChild(overlay);psAppEl.appendChild(pop);}
            _orbPopup=pop;

            var slider=document.getElementById('psRpSlider');
            slider.addEventListener('input',function(){
                var v=slider.value;
                document.getElementById('psRpVal').textContent=v;
                updateOrbVisual(v);
                if(_psEntity.id)localStorage.setItem('ps-rounds-'+_psEntity.id,v);
            });
            document.getElementById('psRpClose').addEventListener('click',closeRoundsPopup);
        }

        function closeRoundsPopup(){
            if(_orbPopup&&_orbPopup.parentNode)_orbPopup.parentNode.removeChild(_orbPopup);
            _orbPopup=null;
            var ov=document.getElementById('psRoundsOverlay');
            if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);
        }

        /* 初始化圆球显示 */
        var _initRounds=_psEntity.id?localStorage.getItem('ps-rounds-'+_psEntity.id):null;
        updateOrbVisual(_initRounds||'10');

        /* 长按打开 */
        psOrb.addEventListener('touchstart',function(e){
            _orbLpTimer=setTimeout(function(){_orbLpTimer=null;showRoundsPopup();},500);
        },{passive:true});
        psOrb.addEventListener('touchend',function(){if(_orbLpTimer){clearTimeout(_orbLpTimer);_orbLpTimer=null;}},{passive:true});
        psOrb.addEventListener('touchmove',function(){if(_orbLpTimer){clearTimeout(_orbLpTimer);_orbLpTimer=null;}},{passive:true});
        psOrb.addEventListener('mousedown',function(){
            _orbLpTimer=setTimeout(function(){_orbLpTimer=null;showRoundsPopup();},500);
        });
        psOrb.addEventListener('mouseup',function(){if(_orbLpTimer){clearTimeout(_orbLpTimer);_orbLpTimer=null;}});
        psOrb.addEventListener('mouseleave',function(){if(_orbLpTimer){clearTimeout(_orbLpTimer);_orbLpTimer=null;}});
        /* 单击也打开（方便操作） */
        psOrb.addEventListener('click',function(e){
            e.stopPropagation();
            if(_orbPopup)closeRoundsPopup();
            else showRoundsPopup();
        });

        /* buttons */
        document.getElementById('btnRecall').addEventListener('click',recallLast);
        document.getElementById('btnRegen').addEventListener('click',regenLast);
        document.getElementById('btnMulti').addEventListener('click',toggleMulti);
        document.getElementById('btnDel').addEventListener('click',deleteSelected);
        document.getElementById('btnMultiCancel').addEventListener('click',toggleMulti);
        document.getElementById('psParenBtn').addEventListener('click',function(){
            var inp=document.getElementById('inp');
            var btn=document.getElementById('psParenBtn');
            var val=inp.value;
            var start=inp.selectionStart||val.length;
            inp.value=val.substring(0,start)+'（）'+val.substring(start);
            inp.focus();
            inp.setSelectionRange(start+1,start+1);
            btn.classList.add('on');
        });
        document.getElementById('psSendBtn').addEventListener('click',psSend);
        document.getElementById('inp').addEventListener('keydown',function(e){if(e.key==='Enter')psSend();});
        var _exitTimer=null;var _exitMoved=false;
        var exitBtn=document.getElementById('psExitBtn');
        exitBtn.addEventListener('click',function(){if(!_exitMoved){var app=document.getElementById('psApp');if(app)app.style.display='none';}});
        exitBtn.addEventListener('touchstart',function(){_exitMoved=false;_exitTimer=setTimeout(function(){_exitTimer=null;_exitMoved=true;showSummarizeModal();},800);},{passive:true});
        exitBtn.addEventListener('touchend',function(){if(_exitTimer){clearTimeout(_exitTimer);_exitTimer=null;}},{passive:true});
        exitBtn.addEventListener('touchmove',function(){if(_exitTimer){clearTimeout(_exitTimer);_exitTimer=null;_exitMoved=true;}},{passive:true});
        exitBtn.addEventListener('mousedown',function(){_exitMoved=false;_exitTimer=setTimeout(function(){_exitTimer=null;_exitMoved=true;showSummarizeModal();},800);});
        exitBtn.addEventListener('mouseup',function(){if(_exitTimer){clearTimeout(_exitTimer);_exitTimer=null;}});

        /* action buttons */
        document.querySelectorAll('#psApp .ab[data-act]').forEach(function(btn){btn.addEventListener('click',function(){actClick(btn);});});

        /* move buttons */
        document.querySelectorAll('#psApp .mb[data-dir]').forEach(function(btn){btn.addEventListener('click',function(){mvDir(btn.dataset.dir);});});

        /* keyboard movement */
        document.addEventListener('keydown',function(e){
            if(document.activeElement.tagName==='INPUT'||!document.getElementById('psApp')||document.getElementById('psApp').style.display==='none')return;
            if(e.key==='ArrowUp'||e.key==='w')mvDir('up');if(e.key==='ArrowDown'||e.key==='s')mvDir('down');if(e.key==='ArrowLeft'||e.key==='a')mvDir('left');if(e.key==='ArrowRight'||e.key==='d')mvDir('right');
        });

        /* drag on stage */
        var dragMoved=false,touchMoved=false;
        function dragStart(x,y){drag.on=true;drag.sx=x;drag.sy=y;drag.cx=cam.x;drag.cy=cam.y;followPaused=true;camTarget.x=cam.x;camTarget.y=cam.y;stageEl.classList.add('dragging');clearTimeout(followTimer);_startAnim();}
        function dragMove(x,y){if(!drag.on)return;cam.x=drag.cx-(x-drag.sx);cam.y=drag.cy-(y-drag.sy);camTarget.x=cam.x;camTarget.y=cam.y;applyWorld();}
        function dragEnd(){drag.on=false;stageEl.classList.remove('dragging');followTimer=setTimeout(function(){followPaused=false;_startAnim();},3000);}
        function clickMove(cx,cy){if(anchoredFurn){leaveAnchor();}var rect=stageEl.getBoundingClientRect();meW.x=cx-rect.left-rect.width/2+cam.x;meW.y=cy-rect.top-rect.height/2+cam.y;meW.x=Math.max(-240,Math.min(660,meW.x));meW.y=Math.max(-280,Math.min(280,meW.y));followPaused=false;_startAnim();var nearF='';for(var fi=0;fi<FURNS.length;fi++){var ff=FURNS[fi];var fdx=meW.x-ff.cx,fdy=meW.y-ff.cy;if((fdx/ff.rx)**2+(fdy/ff.ry)**2<1.2){nearF=' · near '+ff.label;break;}}toastAi('moved → ('+Math.round(meW.x)+', '+Math.round(meW.y)+')');sysMsgMerge('You moved · ('+Math.round(meW.x)+', '+Math.round(meW.y)+')'+nearF);psSavePositions();}

        stageEl.addEventListener('mousedown',function(e){if(e.target.closest('.fhint-btn,.minimap,.char'))return;dragMoved=false;dragStart(e.clientX,e.clientY);});
        window.addEventListener('mousemove',function(e){if(drag.on){dragMoved=true;dragMove(e.clientX,e.clientY);}});
        window.addEventListener('mouseup',function(e){if(!dragMoved&&drag.on)clickMove(e.clientX,e.clientY);dragEnd();});
        stageEl.addEventListener('touchstart',function(e){if(e.target.closest('.fhint-btn,.minimap,.char'))return;touchMoved=false;if(e.touches.length===1)dragStart(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
        stageEl.addEventListener('touchmove',function(e){touchMoved=true;if(e.touches.length===1)dragMove(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
        stageEl.addEventListener('touchend',function(e){if(!touchMoved&&drag.on){var t=e.changedTouches[0];clickMove(t.clientX,t.clientY);}dragEnd();});
    }

    function build(){
        loadEntityAndUser();
        var el=document.createElement('div');
        el.id='psApp';
        el.style.display='none';
        var styleEl=document.createElement('style');
        styleEl.textContent=buildCSS();
        el.appendChild(styleEl);
        var content=document.createElement('div');
        content.style.cssText='display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;';
        content.innerHTML=buildHTML();
        el.appendChild(content);
        document.body.appendChild(el);
        initState();
        setupAvatars();
        bindAll();
        if(!_stW){_stW=stageEl.offsetWidth;_stH=stageEl.offsetHeight;}
        cam.x=meW.x;cam.y=meW.y;camTarget.x=meW.x;camTarget.y=meW.y;
        applyWorld();
        built=true;
    }

    window.openPrivateSpace=function(){
        if(!built)build();
        loadEntityAndUser();
        var _psName=_psEntity.nickname||_psEntity.name||'Luna';
        var msgsEl2=document.getElementById('msgs');
        if(msgsEl2)msgsEl2.innerHTML='';
        document.getElementById('psSubName').textContent=_psName+' · Room 01';
        document.getElementById('psTagName').textContent=_psName+' / '+_psUser.name;
        document.getElementById('psAiName').textContent=_psName;
        document.getElementById('psMeName').textContent=_psUser.name;
        setupAvatars();
        var savedMood=_psEntity.id?localStorage.getItem('ps-mood-'+_psEntity.id):null;
        if(savedMood)document.getElementById('moodPill').innerText=savedMood;
        var app=document.getElementById('psApp');
        app.style.display='flex';
        psLoadPositions();
        applyWorld();
        var msgsEl=document.getElementById('msgs');
        if(msgsEl&&msgsEl.children.length===0){
            psRestoreConv();
        }
    };

})();
