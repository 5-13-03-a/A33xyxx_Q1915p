// js/-A-20-multi-select.js · 多选删除模式（14聊天室用）
(function(){
'use strict';

var isMultiMode=false;
var selectToMode=false;
var firstSelectedIdx=-1;
var holdStart=null;
var isHolding=false;
var holdRaf=null;
var CIRC=2*Math.PI*24;
var HOLD_MS=800;

// 注入 DOM
function injectMultiBar(){
    if(document.getElementById('cdaMultiBar'))return;
    var bar=document.createElement('div');
    bar.className='cda-multi-bar';
    bar.id='cdaMultiBar';
    bar.innerHTML=
        '<div class="cda-mb-left">'+
            '<div class="cda-mb-cancel" id="cdaMbCancel">取消</div>'+
            '<div class="cda-mb-select-to" id="cdaMbSelectTo">'+
                '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></svg>'+
                '<span>到这里</span>'+
            '</div>'+
        '</div>'+
        '<div class="cda-mb-right">'+
            '<div class="cda-mb-count" id="cdaMbCount">0</div>'+
            '<div class="cda-mb-delete" id="cdaMbDelete">'+
                '<svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>'+
                '<div class="cda-mb-ring"><svg viewBox="0 0 54 54"><circle cx="27" cy="27" r="24" fill="none" stroke="rgba(26,26,31,0.08)" stroke-width="2.5"/><circle id="cdaMbArc" cx="27" cy="27" r="24" fill="none" stroke="#c0392b" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="'+CIRC.toFixed(1)+'" stroke-dashoffset="'+CIRC.toFixed(1)+'" transform="rotate(-90 27 27)"/></svg></div>'+
                '<div class="cda-mb-hint">HOLD</div>'+
            '</div>'+
        '</div>';
    var chatEl=document.getElementById('chatDetailAlt');
    if(chatEl)chatEl.appendChild(bar);
}

// 注入样式
function injectStyle(){
    if(document.getElementById('cda-multi-style'))return;
    var s=document.createElement('style');
    s.id='cda-multi-style';
    s.textContent=
        '.cda-multi-bar{position:fixed;bottom:0;left:0;right:0;max-width:430px;margin:0 auto;padding:14px 20px calc(env(safe-area-inset-bottom,8px) + 14px);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:0.5px solid rgba(26,26,31,0.06);transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);z-index:200;pointer-events:none;visibility:hidden;}'+
        '.cda-multi-bar.active{transform:translateY(0);pointer-events:auto;visibility:visible;}'+
        '.cda-mb-left{display:flex;align-items:center;gap:12px;}'+
        '.cda-mb-cancel{font-size:11px;font-weight:700;color:rgba(26,26,31,0.5);cursor:pointer;padding:8px 0;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;}'+
        '.cda-mb-cancel:active{opacity:0.5;}'+
        '.cda-mb-select-to{display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:50px;background:rgba(26,26,31,0.04);border:0.5px solid rgba(26,26,31,0.1);font-size:10px;font-weight:700;color:#1a1a1f;cursor:pointer;transition:all 0.2s;opacity:0;transform:scale(0.9);pointer-events:none;-webkit-tap-highlight-color:transparent;}'+
        '.cda-mb-select-to.show{opacity:1;transform:scale(1);pointer-events:auto;}'+
        '.cda-mb-select-to.on{background:#1a1a1f!important;color:#fff!important;border-color:#1a1a1f!important;}'+
        '.cda-mb-select-to.on svg{stroke:#fff!important;}'+
        '.cda-mb-select-to:active{transform:scale(0.95);}'+
        '.cda-mb-select-to svg{width:12px;height:12px;stroke:#1a1a1f;fill:none;stroke-width:2;stroke-linecap:round;}'+
        '.cda-mb-right{display:flex;align-items:center;gap:14px;}'+
        '.cda-mb-count{font-size:13px;font-weight:800;color:#1a1a1f;min-width:20px;text-align:center;opacity:0;transform:scale(0.8);transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);}'+
        '.cda-mb-count.show{opacity:1;transform:scale(1);}'+
        '.cda-mb-delete{width:48px;height:48px;border-radius:50%;background:#1a1a1f;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:visible;transition:transform 0.15s;-webkit-tap-highlight-color:transparent;}'+
        '.cda-mb-delete:active{transform:scale(0.92);}'+
        '.cda-mb-delete>svg{width:20px;height:20px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;position:relative;z-index:2;}'+
        '.cda-mb-ring{position:absolute;inset:-3px;border-radius:50%;pointer-events:none;}'+
        '.cda-mb-ring svg{width:100%;height:100%;}'+
        '.cda-mb-hint{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:7px;font-weight:800;letter-spacing:1.5px;color:rgba(26,26,31,0.3);pointer-events:none;opacity:0;transition:opacity 0.2s;text-transform:uppercase;}'+
        '.cda-mb-delete.has-sel .cda-mb-hint{opacity:1;}'+

        /* 选中态 */
        '.cda-multi-mode .cda-msg-row.ms-selected .cda-bubble{background:transparent!important;border:1.5px dashed #1a1a1f!important;color:#1a1a1f!important;box-shadow:none!important;transform:scale(0.97);transition:all 0.2s;}'+
        '.cda-multi-mode .cda-msg-row.sent.ms-selected .cda-bubble{border-color:rgba(26,26,31,0.6)!important;}'+
        '.cda-multi-mode .cda-narr-line.ms-selected{background:rgba(26,26,31,0.04)!important;border:1.5px dashed rgba(26,26,31,0.3)!important;border-radius:8px!important;transform:scale(0.97);}'+
        '.cda-multi-mode .cda-dc-notif-row.ms-selected .cda-dc-notif{border:1.5px dashed rgba(26,26,31,0.3)!important;transform:scale(0.97);}'+
        '.cda-multi-mode .cda-dc-notif-row.ms-selected>div{border:1.5px dashed rgba(26,26,31,0.3)!important;transform:scale(0.97);}'+

        /* 选中勾 */
        '.cda-ms-check{position:absolute;left:-4px;top:50%;transform:translateY(-50%) scale(0);width:16px;height:16px;border-radius:50%;background:#1a1a1f;display:flex;align-items:center;justify-content:center;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);z-index:10;pointer-events:none;}'+
        '.cda-msg-row.sent .cda-ms-check{left:auto;right:-4px;}'+
        '.ms-selected .cda-ms-check{transform:translateY(-50%) scale(1);}'+
        '.cda-ms-check svg{width:9px;height:9px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}'+

        /* 范围线 */
        '.cda-multi-mode .ms-in-range::after{content:"";position:absolute;left:-12px;top:0;bottom:0;width:2px;background:#1a1a1f;border-radius:2px;animation:cdaMsRangeIn 0.2s ease forwards;pointer-events:none;}'+
        '.cda-multi-mode .cda-msg-row.sent.ms-in-range::after{left:auto;right:-12px;}'+
        '@keyframes cdaMsRangeIn{from{transform:scaleY(0);}to{transform:scaleY(1);}}'+

        /* 隐藏输入栏 */
        '.cda-multi-mode .cda-input-bar{transform:translateY(100%)!important;pointer-events:none!important;}'+

        /* 删除动画 */
        '@keyframes cdaMsFly{0%{opacity:1;transform:translate(0,0) scale(1);}100%{opacity:0;transform:translate(var(--ms-tx),var(--ms-ty)) scale(0.7) rotate(var(--ms-tr));}}'+
        '.ms-deleting{animation:cdaMsFly 0.4s cubic-bezier(0.4,0,0.2,1) forwards!important;pointer-events:none!important;}'+

        /* 完成闪光 */
        '.cda-ms-flash{position:fixed;inset:0;max-width:430px;margin:0 auto;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.9);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:300;opacity:0;pointer-events:none;transition:opacity 0.3s;}'+
        '.cda-ms-flash.show{opacity:1;}'+
        '.cda-ms-flash path{stroke:#1a1a1f;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:80;stroke-dashoffset:80;}'+
        '.cda-ms-flash.show path{animation:cdaMsCheck 0.4s 0.1s ease forwards;}'+
        '@keyframes cdaMsCheck{to{stroke-dashoffset:0;}}'+

        /* 长按震动 */
        '@keyframes cdaMsShake{0%,100%{transform:rotate(0deg);}20%{transform:rotate(-6deg);}40%{transform:rotate(6deg);}60%{transform:rotate(-4deg);}80%{transform:rotate(4deg);}}';
    document.head.appendChild(s);
}

function getSelectableRows(){
    var area=document.getElementById('cdaMsgArea');
    if(!area)return[];
    return Array.from(area.querySelectorAll('.cda-msg-row,.cda-narr-line,.cda-dc-notif-row'));
}

function getSelectedRows(){
    var area=document.getElementById('cdaMsgArea');
    if(!area)return[];
    return Array.from(area.querySelectorAll('.ms-selected'));
}

function updateCount(){
    var count=getSelectedRows().length;
    var countEl=document.getElementById('cdaMbCount');
    var delBtn=document.getElementById('cdaMbDelete');
    var selTo=document.getElementById('cdaMbSelectTo');
    if(countEl){
        countEl.textContent=count;
        countEl.classList.toggle('show',count>0);
    }
    if(delBtn)delBtn.classList.toggle('has-sel',count>0);
    if(selTo)selTo.classList.toggle('show',count>0&&isMultiMode);
}

function enterMulti(){
    if(isMultiMode)return;
    isMultiMode=true;
    selectToMode=false;
    firstSelectedIdx=-1;
    var chatEl=document.getElementById('chatDetailAlt');
    if(chatEl)chatEl.classList.add('cda-multi-mode');
    var bar=document.getElementById('cdaMultiBar');
    if(bar)bar.classList.add('active');

    // 给所有可选行注入勾和定位
    getSelectableRows().forEach(function(row){
        row.style.position='relative';
        if(!row.querySelector('.cda-ms-check')){
            var check=document.createElement('div');
            check.className='cda-ms-check';
            check.innerHTML='<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
            row.appendChild(check);
        }
    });

    updateCount();
}

function exitMulti(){
    isMultiMode=false;
    selectToMode=false;
    firstSelectedIdx=-1;
    var chatEl=document.getElementById('chatDetailAlt');
    if(chatEl)chatEl.classList.remove('cda-multi-mode');
    var bar=document.getElementById('cdaMultiBar');
    if(bar)bar.classList.remove('active');
    var selTo=document.getElementById('cdaMbSelectTo');
    if(selTo){selTo.classList.remove('show','on');}

    // 清除选中
    getSelectableRows().forEach(function(row){
        row.classList.remove('ms-selected','ms-in-range');
    });
    updateCount();

    // 确保输入栏恢复可见
    var inputBar=document.querySelector('.cda-input-bar');
    if(inputBar){
        inputBar.style.transform='';
        inputBar.style.pointerEvents='';
    }
    // 确保消息区域滚动正常
    var area=document.getElementById('cdaMsgArea');
    if(area){
        area.style.overflowY='auto';
        area.style.paddingBottom='';
    }
}

function getRowIndex(row){
    var all=getSelectableRows();
    return all.indexOf(row);
}

// 点击选择
function handleRowClick(e){
    if(!isMultiMode)return;
    var area=document.getElementById('cdaMsgArea');
    if(!area)return;
    var row=e.target.closest('.cda-msg-row,.cda-narr-line,.cda-dc-notif-row');
    if(!row||!area.contains(row))return;

    e.stopPropagation();
    e.preventDefault();

    var idx=getRowIndex(row);

    if(selectToMode){
        // 范围选择
        var from=Math.min(firstSelectedIdx,idx);
        var to=Math.max(firstSelectedIdx,idx);
        var all=getSelectableRows();
        for(var i=from;i<=to;i++){
            all[i].classList.add('ms-selected','ms-in-range');
        }
        selectToMode=false;
        var selTo=document.getElementById('cdaMbSelectTo');
        if(selTo)selTo.classList.remove('on');
        updateCount();
    }else{
        // 普通切换
        row.classList.toggle('ms-selected');
        row.classList.remove('ms-in-range');

        // 记录第一个选中的索引
        var selected=getSelectedRows();
        if(selected.length>0){
            firstSelectedIdx=getRowIndex(selected[0]);
        }
        updateCount();
    }
}

// "到这里"
function handleSelectTo(){
    if(!isMultiMode)return;
    var selected=getSelectedRows();
    if(selected.length===0)return;
    firstSelectedIdx=getRowIndex(selected[0]);
    selectToMode=!selectToMode;
    var selTo=document.getElementById('cdaMbSelectTo');
    if(selTo)selTo.classList.toggle('on',selectToMode);
}

// 长按删除
function holdTick(ts){
    if(!isHolding)return;
    if(!holdStart)holdStart=ts;
    var elapsed=ts-holdStart;
    var p=Math.min(elapsed/HOLD_MS,1);
    var arc=document.getElementById('cdaMbArc');
    if(arc)arc.style.strokeDashoffset=CIRC*(1-p);
    var delBtn=document.getElementById('cdaMbDelete');
    if(delBtn){
        var shake=p>0.3?(Math.random()-0.5)*p*3:0;
        delBtn.style.transform='scale('+(1+p*0.06)+') translateX('+shake+'px)';
    }
    if(p>=1){
        isHolding=false;
        resetHold();
        executeDelete();
        return;
    }
    holdRaf=requestAnimationFrame(holdTick);
}

function resetHold(){
    isHolding=false;
    holdStart=null;
    cancelAnimationFrame(holdRaf);
    var arc=document.getElementById('cdaMbArc');
    if(arc){
        arc.style.transition='stroke-dashoffset 0.3s ease';
        arc.style.strokeDashoffset=CIRC;
        setTimeout(function(){if(arc)arc.style.transition='';},350);
    }
    var delBtn=document.getElementById('cdaMbDelete');
    if(delBtn){delBtn.style.transform='';delBtn.style.animation='';}
}

function startHold(e){
    if(e.cancelable)e.preventDefault();

    // 不在多选模式 → 进入多选
    if(!isMultiMode){
        enterMulti();
        return;
    }

    // 没选中 → 不触发
    if(getSelectedRows().length===0)return;

    isHolding=true;
    holdStart=null;
    var delBtn=document.getElementById('cdaMbDelete');
    if(delBtn)delBtn.style.animation='cdaMsShake 0.4s ease';
    if(navigator.vibrate)navigator.vibrate(6);
    holdRaf=requestAnimationFrame(holdTick);
}

function endHold(){
    if(isHolding)resetHold();
}

function executeDelete(){
    var selected=getSelectedRows();
    if(selected.length===0)return;

    // 粒子
    var delBtn=document.getElementById('cdaMbDelete');
    if(delBtn){
        var rect=delBtn.getBoundingClientRect();
        var cx=rect.left+rect.width/2;
        var cy=rect.top+rect.height/2;
        for(var i=0;i<10;i++){
            var angle=(i/10)*Math.PI*2+Math.random()*0.4;
            var dist=30+Math.random()*25;
            var size=3+Math.random()*4;
            var p=document.createElement('div');
            p.style.cssText='position:fixed;left:'+cx+'px;top:'+cy+'px;width:'+size+'px;height:'+size+'px;background:#c0392b;border-radius:50%;pointer-events:none;z-index:999;transition:all 0.5s cubic-bezier(0.16,1,0.3,1);opacity:1;';
            document.body.appendChild(p);
            (function(el,a,d){
                requestAnimationFrame(function(){
                    el.style.transform='translate('+Math.cos(a)*d+'px,'+Math.sin(a)*d+'px) scale(0)';
                    el.style.opacity='0';
                });
                setTimeout(function(){el.remove();},550);
            })(p,angle,dist);
        }
    }

    // 飞散
    selected.forEach(function(row,i){
        var tx=(Math.random()-0.5)*80;
        var ty=-40-Math.random()*50;
        var tr=(Math.random()-0.5)*25;
        row.style.setProperty('--ms-tx',tx+'px');
        row.style.setProperty('--ms-ty',ty+'px');
        row.style.setProperty('--ms-tr',tr+'deg');
        row.style.animationDelay=(i*30)+'ms';
        row.classList.add('ms-deleting');
    });

    // 从数据中删除（和 cut 一样的流程：改内存→写DB→渲染→通知05）
    var entId=window._cdaCurrentEntId;
    setTimeout(function(){
        deleteFromData(selected);

        // 立即同步写 DB（确保退出重进也能读到最新数据）
        if(entId&&window._caConversations&&window._caConversations[entId]){
            if(typeof ChatDB!=='undefined'&&ChatDB.saveConversation){
                ChatDB.saveConversation(entId,window._caConversations[entId]);
            }
        }

        // 标记内存已修改，防止 renderMessages 从 DB 覆盖
        if(entId&&window._caConversations){
            window._caConversations['__dirty_'+entId]=true;
        }

        // 闪光
        var flash=document.getElementById('cdaMsFlash');
        if(!flash){
            flash=document.createElement('div');
            flash.className='cda-ms-flash';
            flash.id='cdaMsFlash';
            flash.innerHTML='<svg viewBox="0 0 60 60" width="60" height="60"><path d="M15 32 L25 42 L45 18"/></svg>';
            document.body.appendChild(flash);
        }
        flash.classList.add('show');
        setTimeout(function(){
            flash.classList.remove('show');
            exitMulti();
            var area=document.getElementById('cdaMsgArea');
            if(area){
                var ghosts=area.querySelectorAll('.ms-deleting');
                ghosts.forEach(function(g){if(g.parentNode)g.parentNode.removeChild(g);});
            }
            // 直接用内存数据重新渲染（不走 DB 加载）
            if(entId&&window._caConversations&&window._caConversations[entId]){
                var area3=document.getElementById('cdaMsgArea');
                if(area3){
                    var entities=window._caEntities||[];
                    var ent=entities.find(function(e){return e.id===entId;});
                    if(ent&&typeof window._cdaDoRenderMessages==='function'){
                        window._cdaDoRenderMessages(area3,ent);
                    }else if(typeof renderMessagesNoAnim==='function'){
                        renderMessagesNoAnim();
                    }
                }
            }else if(typeof renderMessagesNoAnim==='function'){
                renderMessagesNoAnim();
            }
            var area2=document.getElementById('cdaMsgArea');
            if(area2)area2.scrollTop=area2.scrollHeight;
            if(entId){
                window.dispatchEvent(new CustomEvent('ca-conv-updated',{detail:{entId:entId}}));
            }
        },1000);
    },450);
}

function deleteFromData(selectedEls){
    var entId=window._cdaCurrentEntId;
    if(!entId||!window._caConversations||!window._caConversations[entId])return;

    var msgs=window._caConversations[entId];
    var area=document.getElementById('cdaMsgArea');
    if(!area)return;

    // 直接从选中 DOM 元素的 data-msg-idx 属性读取消息索引
    var msgIndicesHit={};
    var msgTotalInDom={};

    // 统计 DOM 中每个 msgIdx 出现了多少次
    var allTagged=area.querySelectorAll('[data-msg-idx]');
    allTagged.forEach(function(row){
        var idx=row.getAttribute('data-msg-idx');
        if(idx===null||idx==='undefined')return;
        if(!msgTotalInDom[idx])msgTotalInDom[idx]=0;
        msgTotalInDom[idx]++;
    });

    // 统计选中行中每个 msgIdx 被选了多少次
    selectedEls.forEach(function(el){
        var idx=el.getAttribute('data-msg-idx');
        if(idx===null||idx===undefined||idx==='undefined')return;
        if(!msgIndicesHit[idx])msgIndicesHit[idx]=0;
        msgIndicesHit[idx]++;
    });

    // 收集每条消息中哪些气泡文本被选中删除
    var msgDeleteTexts={};
    var msgDeleteIsSpecial={};
    selectedEls.forEach(function(el){
        var idx=el.getAttribute('data-msg-idx');
        if(idx===null||idx===undefined||idx==='undefined')return;
        // 只有通知（info消息）是独立消息，直接整条删
        var isNotif=el.classList.contains('cda-dc-notif-row');
        if(isNotif){
            msgDeleteIsSpecial[idx]=true;
            return;
        }
        // 转账卡片：标记为删除 TRANSFER_CARD 行
        var isTf=el.classList.contains('cda-tf-row')||!!el.querySelector('.cda-tf-ticket');
        if(isTf){
            if(!msgDeleteTexts[idx])msgDeleteTexts[idx]=[];
            msgDeleteTexts[idx].push('__TRANSFER__');
            return;
        }
        // 图片：标记为删除 IMAGE 行
        var isImg=!!el.querySelector('.cda-bubble-img');
        if(isImg){
            if(!msgDeleteTexts[idx])msgDeleteTexts[idx]=[];
            msgDeleteTexts[idx].push('__IMAGE__');
            return;
        }
        // 旁白行：按文本匹配删除
        // 获取该行显示的文本
        var bubble=el.querySelector('.cda-bubble');
        var text='';
        if(el.classList.contains('cda-narr-line')){
            text=el.getAttribute('data-original-text')||el.textContent||'';
        }else if(bubble){
            text=bubble.getAttribute('data-original-text')||bubble.textContent||'';
        }else{
            text=el.textContent||'';
        }
        text=text.trim();
        if(!text)return;
        if(!msgDeleteTexts[idx])msgDeleteTexts[idx]=[];
        msgDeleteTexts[idx].push(text);
    });

    console.log('[MultiDel] msgIndicesHit:', JSON.stringify(msgIndicesHit));
    console.log('[MultiDel] msgTotalInDom:', JSON.stringify(msgTotalInDom));
    console.log('[MultiDel] msgDeleteIsSpecial:', JSON.stringify(msgDeleteIsSpecial));

    // 处理每条被涉及的消息
    var toDeleteWhole=[];
    Object.keys(msgIndicesHit).forEach(function(idx){
        var miNum=parseInt(idx,10);
        if(miNum<0||miNum>=msgs.length)return;
        // 特殊类型（转账、图片、通知）：直接删整条
        if(msgDeleteIsSpecial[idx]){
            toDeleteWhole.push(miNum);
            return;
        }
        // 如果该消息的所有气泡都被选中，直接删除整条
        if(msgIndicesHit[idx]>=msgTotalInDom[idx]){
            toDeleteWhole.push(miNum);
            return;
        }
        // 否则只删选中的行：从消息文本中移除对应行
        var msg=msgs[miNum];
        if(!msg||!msg.text)return;
        var lines=msg.text.split('\n');
        var textsToRemove=msgDeleteTexts[idx]||[];
        if(textsToRemove.length===0){
            toDeleteWhole.push(miNum);
            return;
        }

        // 逐个要删的文本，从 lines 中找到并移除
        textsToRemove.forEach(function(delText){
            if(!delText)return;
            for(var li=lines.length-1;li>=0;li--){
                var lineClean=lines[li].trim();
                // 转账卡片：匹配 [TRANSFER_CARD:: 开头的行
                if(delText==='__TRANSFER__'&&lineClean.indexOf('[TRANSFER_CARD::')===0){
                    lines.splice(li,1);
                    break;
                }
                // 图片：匹配 [IMAGE] 开头的行
                if(delText==='__IMAGE__'&&lineClean.indexOf('[IMAGE]')===0){
                    lines.splice(li,1);
                    break;
                }
                if(delText==='__TRANSFER__'||delText==='__IMAGE__')continue;
                // 去掉系统标签和翻译后缀再比较
                var cmp=lineClean.replace(/^\[SYS_TIME:[^\]]*\]\s*/i,'');
                if(cmp.indexOf('|||TRANS|||')!==-1)cmp=cmp.split('|||TRANS|||')[0].trim();
                // 旁白行：提取旁白内容比较
                if(cmp.indexOf('[♪♫]')!==-1){
                    var narrMatch=cmp.match(/\[♪♫\]([\s\S]*?)\[\/♪♫\]/);
                    if(narrMatch&&narrMatch[1].trim()===delText){
                        lines.splice(li,1);
                        break;
                    }
                }
                if(cmp===delText){
                    lines.splice(li,1);
                    break;
                }
            }
        });

        var newText=lines.filter(function(l){return l.trim().length>0;}).join('\n').trim();
        if(!newText){
            toDeleteWhole.push(miNum);
        }else{
            msgs[miNum].text=newText;
        }
    });

    // 从后往前删除整条消息
    toDeleteWhole.sort(function(a,b){return b-a;});
    toDeleteWhole.forEach(function(idx){
        if(idx>=0&&idx<msgs.length){
            msgs.splice(idx,1);
        }
    });

    window._caConversations[entId]=msgs;
    console.log('[MultiDel] After delete, msgs.length:', msgs.length);
}

function countDomRowsForMsg(m){
    if(!m||!m.text)return 0;
    if(m.role==='info')return 1;
    if(m.role!=='user'&&m.role!=='assistant')return 0;

    var text=String(m.text);
    text=text.replace(/\[SYS_TIME:[^\]]*\]/gi,'').replace(/\[CURRENT TIME:[^\]]*\]/gi,'').replace(/\[SET_USER_NICKNAME:[^\]]*\]/gi,'').replace(/\[INVITE_MEET:[^\]]*\]/gi,'').trim();
    if(!text)return 0;

    var lines=text.replace(/\|\|\|\|/g,'\n').split('\n');
    var count=0;

    lines.forEach(function(line){
        var t=line.trim();
        if(!t)return;

        if(m.role==='assistant'&&t.indexOf('[♪♫]')!==-1){
            var narrRegex=/\[♪♫\]([\s\S]*?)\[\/♪♫\]/g;
            var lastIdx2=0;
            var match2;
            while((match2=narrRegex.exec(t))!==null){
                if(match2.index>lastIdx2){
                    var before=t.substring(lastIdx2,match2.index).trim();
                    if(before)count++;
                }
                count++;
                lastIdx2=match2.index+match2[0].length;
            }
            if(lastIdx2<t.length){
                var after=t.substring(lastIdx2).trim();
                if(after)count++;
            }
        }else{
            count++;
        }
    });

    return count;
}

// 绑定事件
function bindEvents(){
    // 消息区点击（多选模式下）
    document.addEventListener('click',function(e){
        if(!isMultiMode)return;
        var area=document.getElementById('cdaMsgArea');
        if(!area)return;
        var row=e.target.closest('.cda-msg-row,.cda-narr-line,.cda-dc-notif-row');
        if(row&&area.contains(row)){
            handleRowClick(e);
        }
    },true);

    // 取消
    document.addEventListener('click',function(e){
        if(e.target.id==='cdaMbCancel'||e.target.closest('#cdaMbCancel')){
            exitMulti();
        }
    });

    // "到这里"
    document.addEventListener('click',function(e){
        if(e.target.id==='cdaMbSelectTo'||e.target.closest('#cdaMbSelectTo')){
            e.stopPropagation();
            handleSelectTo();
        }
    });

    // 删除按钮长按
    var delBtn=null;
    function getDelBtn(){
        if(!delBtn)delBtn=document.getElementById('cdaMbDelete');
        return delBtn;
    }

    document.addEventListener('touchstart',function(e){
        var btn=e.target.closest('#cdaMbDelete');
        if(btn)startHold(e);
    },{passive:false});
    document.addEventListener('touchend',function(e){
        if(e.target.closest('#cdaMbDelete'))endHold();
    });
    document.addEventListener('touchcancel',function(e){
        if(e.target.closest('#cdaMbDelete'))endHold();
    });
    document.addEventListener('mousedown',function(e){
        var btn=e.target.closest('#cdaMbDelete');
        if(btn)startHold(e);
    });
    document.addEventListener('mouseup',function(e){
        if(e.target.closest('#cdaMbDelete'))endHold();
    });
}

// 暴露给 14 的长按菜单调用
window.enterCdaMultiSelect=function(){
    injectMultiBar();
    enterMulti();
};

// 初始化
function init(){
    injectStyle();
    injectMultiBar();
    bindEvents();
}

// 等 DOM ready
if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
}else{
    init();
}

// 暴露当前 entId（14 需要设置这个）
// 14 的 render 函数里需要加: window._cdaCurrentEntId = currentEntId;

})();
