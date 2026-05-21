// js/-A-13-chat-room.js · 主聊天室（独立样式，接通 entities 数据）
(function(){
'use strict';

var built = false;

function getEntities(){
    return window._caEntities || [];
}
function getConversations(){
    return window._caConversations || {};
}

function getPinned(){try{return JSON.parse(localStorage.getItem('ca-pinned')||'[]');}catch(e){return[];}}
function savePinned(arr){localStorage.setItem('ca-pinned',JSON.stringify(arr));}
function pickColor(name){var sum=0;for(var i=0;i<name.length;i++)sum+=name.charCodeAt(i);return['#1C1C1E','#2C3E50','#4a6741','#5c4a3a','#3a4a5c','#6b7b8a'][sum%6];}
function getInitial(name){return(name||'?').trim().charAt(0).toUpperCase();}

function buildStars(){
    var sizes=[12,7,9,5,6];
    var bots=[8,18,24,6,30];
    var rights=[12,28,8,38,20];
    var ops=[1,0.6,0.75,0.4,0.5];
    var html='';
    for(var i=0;i<5;i++){
        html+='<svg viewBox="0 0 24 24" style="width:'+sizes[i]+'px;height:'+sizes[i]+'px;bottom:'+bots[i]+'px;right:'+rights[i]+'px;opacity:'+ops[i]+';"><polygon points="12,2 15,9 22,9 16.5,13.5 18.5,21 12,16.5 5.5,21 7.5,13.5 2,9 9,9"/></svg>';
    }
    return html;
}

function render(){
    var el=document.getElementById('chatRoomApp');
    if(!el)return;

    var entities=getEntities();
    var conversations=getConversations();

    // 拍立得 · 只显示已置顶（最多 4 个）
    var pinnedIds=getPinned();
    var pinnedEntities=pinnedIds.map(function(id){
        return entities.find(function(e){return e.id===id;});
    }).filter(function(e){return e;});
    var polaroidHtml='';
    var rotations=[-3,2,-1,2.5,-2,1];
    pinnedEntities.slice(0,4).forEach(function(ent,i){
        var dispName=ent.nickname||ent.name;
        var isDark=i%2===0;
        var avHtml=ent.avatar
            ?'<img src="'+ent.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
            :'<div class="cr-p-av" style="background:'+(ent.color||pickColor(ent.name))+';">'+getInitial(dispName)+'</div>';
        var onlineHtml=ent.unread>0?'<div class="cr-polaroid-online"></div>':'';
        var label=ent.unread>0?'online':'offline';
        polaroidHtml+='<div class="cr-polaroid-item" data-id="'+ent.id+'">'+
            '<div class="cr-polaroid-frame'+(isDark?' dark':'')+'" data-label="'+label+'">'+
                '<div class="cr-polaroid-tape"></div>'+
                '<div class="cr-polaroid-photo">'+avHtml+'</div>'+
                onlineHtml+
            '</div>'+
            '<div class="cr-polaroid-name">'+escapeHtml(dispName.split(' ')[0])+'</div>'+
        '</div>';
    });
    var polaroidSectionHtml='';
    if(pinnedEntities.length>0){
        var scrollStyle=pinnedEntities.length===1?' style="justify-content:center;display:flex;"':'';
        polaroidSectionHtml='<div class="cr-polaroid-section"><div class="cr-polaroid-scroll"'+scrollStyle+'>'+polaroidHtml+'</div></div>';
    }

    // 聊天列表
    var listHtml='';
    var sorted=entities.slice().sort(function(a,b){
        var ca=conversations[a.id]||[];
        var cb=conversations[b.id]||[];
        var ta=ca.length?ca[ca.length-1].time:a.created||'';
        var tb=cb.length?cb[cb.length-1].time:b.created||'';
        return tb>ta?1:-1;
    });

    sorted.forEach(function(ent){
        var msgs=conversations[ent.id]||[];
        var lastMsg=msgs.length?msgs[msgs.length-1]:null;
        var _prevRaw='';
        if(lastMsg){
            var _pt=lastMsg.text.replace(/^\[SYS_TIME:[^\]]*\]\s*/i,'');
            var _pSegs=_pt.split('||||');
            var _pLast=_pSegs[_pSegs.length-1]||'';
            if(_pLast.indexOf('|||TRANS|||')!==-1)_pLast=_pLast.split('|||TRANS|||')[0];
            _pLast=_pLast.replace(/\[IMAGE\].*/,'[图片]').replace(/\[TRANSFER_CARD::[^\]]*\]/,'[转账]').trim();
            _prevRaw=_pLast;
        }
        var preview=lastMsg?(lastMsg.role==='user'?'You: ':'')+(_prevRaw||'...').substring(0,30):'Tap to start chatting...';
        var timeStr=lastMsg?(lastMsg.time||'').split(' ')[1]||'':'';
        var dispName=ent.nickname||ent.name;
        var avStyle='background:'+(ent.color||pickColor(ent.name))+';position:relative;overflow:hidden;';
        var avHtml=ent.avatar
            ?'<img src="'+ent.avatar+'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:14px;">'
            :'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">'+getInitial(dispName)+'</div>';
        var onlineHtml='';
        var badgeHtml=ent.unread>0?'<div class="cr-chat-badge">'+ent.unread+'</div>':'';

        listHtml+='<div class="cr-chat-item" data-id="'+ent.id+'">'+
            '<div class="cr-chat-avatar" style="'+avStyle+'">'+avHtml+onlineHtml+'</div>'+
            '<div class="cr-chat-info">'+
                '<div class="cr-chat-name">'+escapeHtml(dispName)+'</div>'+
                '<div class="cr-chat-preview">'+escapeHtml(preview)+'</div>'+
            '</div>'+
            '<div class="cr-chat-meta">'+
                '<span class="cr-chat-time">'+timeStr+'</span>'+
                badgeHtml+
            '</div>'+
            '<div class="cr-item-stars">'+buildStars()+'</div>'+
        '</div>';
    });

    var onlineCount=entities.filter(function(e){return e.unread>0;}).length;

    el.innerHTML=
        '<div class="cr-side-deco"></div>'+
        '<div class="cr-side-strip">'+
            '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+
            '<span class="cr-side-strip-label">Chat</span>'+
            '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>'+
        '</div>'+

        '<div class="cr-header" style="overflow:visible;">'+
            '<div class="cr-header-top">'+
                '<div>'+
                    '<div class="cr-header-title">Messages</div>'+
                    '<div class="cr-header-sub">'+entities.length+' conversations</div>'+
                '</div>'+
                '<div class="cr-header-actions">'+
                    '<div class="cr-header-btn" id="crBackBtn"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></div>'+
                '</div>'+
            '</div>'+
        '</div>'+

        '<div class="cr-filter-bar">'+
            '<div class="cr-filter-chip active">All</div>'+
            '<div class="cr-filter-chip">置顶</div>'+
            '<div class="cr-filter-chip">未读</div>'+
            '<div class="cr-filter-chip">群聊</div>'+
        '</div>'+

        polaroidSectionHtml+

        '<div class="cr-capsule"><div class="cr-capsule-inner">'+
            '<div class="cr-capsule-dot active"></div>'+
            '<div class="cr-capsule-dot"></div>'+
            '<div class="cr-capsule-dot"></div>'+
            '<span class="cr-capsule-text">Online</span>'+
            '<span class="cr-capsule-count">'+onlineCount+'</span>'+
        '</div></div>'+

        '<div class="cr-divider">'+
            '<div class="cr-divider-line"></div>'+
            '<div class="cr-divider-dot"></div>'+
            '<div class="cr-divider-text">Recent</div>'+
            '<div class="cr-divider-dot"></div>'+
            '<div class="cr-divider-line"></div>'+
        '</div>'+

        '<div class="cr-chat-list">'+listHtml+'</div>'+

        '<div class="cr-tab-capsule">'+
            '<div class="cr-tab-item active" data-tab="chat">'+
                '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+
                '<span class="cr-tab-label">Chat</span>'+
                '<div class="cr-tab-dot"></div>'+
            '</div>'+
            '<div class="cr-tab-item" data-tab="explore">'+
                '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>'+
                '<span class="cr-tab-label">Explore</span>'+
            '</div>'+
            '<div class="cr-tab-item" data-tab="entity">'+
                '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'+
                '<span class="cr-tab-label">Entity</span>'+
            '</div>'+
            '<div class="cr-tab-item" data-tab="me">'+
                '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'+
                '<span class="cr-tab-label">Me</span>'+
            '</div>'+
        '</div>';

    // 绑定事件
    document.getElementById('crBackBtn').addEventListener('click',closeChatRoom);

    el.querySelectorAll('.cr-chat-item').forEach(function(item){
        var id=item.dataset.id;
        var pressTimer=null;
        var longPressed=false;
        var handlePin=function(){
            longPressed=true;
            if(navigator.vibrate)navigator.vibrate(15);
            var ent=entities.find(function(e){return e.id===id;});
            if(!ent)return;
            var dispName=ent.nickname||ent.name;
            var pinned=getPinned();
            var isPinned=pinned.indexOf(id)>=0;
            showActionSheet(dispName,isPinned,function(confirmed){
                if(!confirmed)return;
                var p=getPinned();
                var i=p.indexOf(id);
                if(i>=0)p.splice(i,1);
                else p.push(id);
                savePinned(p);
                render();
            });
        };
        item.addEventListener('touchstart',function(){
            longPressed=false;
            pressTimer=setTimeout(handlePin,500);
        },{passive:true});
        item.addEventListener('touchmove',function(){clearTimeout(pressTimer);});
        item.addEventListener('touchend',function(){clearTimeout(pressTimer);});
        item.addEventListener('contextmenu',function(e){
            e.preventDefault();
            handlePin();
        });
        item.addEventListener('click',function(){
            if(longPressed)return;
            if(typeof window.openChatDetailAlt==='function') window.openChatDetailAlt(id);
        });
    });

    el.querySelectorAll('.cr-polaroid-item').forEach(function(item){
        item.addEventListener('click',function(){
            var id=item.dataset.id;
            if(typeof window.openChatDetailAlt==='function') window.openChatDetailAlt(id);
        });
    });

    // Tab Capsule 切换（聊天室底栏不变胶囊）
    el.querySelectorAll('.cr-tab-item').forEach(function(tab){
        tab.addEventListener('click',function(){
            var tabName=tab.dataset.tab;
            // 切 active 播展开动效
            el.querySelectorAll('.cr-tab-item').forEach(function(t){t.classList.remove('active');});
            tab.classList.add('active');
            if(tabName==='chat')return;
            // 跳转后立刻复原（用户看不到聊天室底栏，但保证下次返回时显示正确）
            setTimeout(function(){
                if(tabName==='entity'&&typeof window.openEntityList==='function') window.openEntityList();
                else if(tabName==='me'&&typeof window.openMePage==='function') window.openMePage();
                setTimeout(function(){
                    el.querySelectorAll('.cr-tab-item').forEach(function(t){t.classList.remove('active');});
                    var chatTab=el.querySelector('[data-tab="chat"]');
                    if(chatTab)chatTab.classList.add('active');
                },50);
            },120);
        });
    });
}

function showActionSheet(targetName,isPinned,cb){
    var existing=document.getElementById('crActionSheet');
    if(existing&&existing.parentNode)existing.parentNode.removeChild(existing);

    var actionLabel=isPinned?'取下':'置顶';
    var actionSub=isPinned?'Unpin from wall':'Pin to wall';
    var actionIcon=isPinned
        ?'<svg viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="4"/><path d="M14.5 9.5L9 4l-3 3 5.5 5.5"/><path d="M14.5 9.5l3.5 3.5"/><path d="M11.5 12.5L8 16l-2-2 3.5-3.5"/></svg>'
        :'<svg viewBox="0 0 24 24"><path d="M12 2L9 5v6L5 15v2h6v5l1 1 1-1v-5h6v-2l-4-4V5z"/></svg>';

    var sheet=document.createElement('div');
    sheet.className='cr-action-sheet';
    sheet.id='crActionSheet';
    sheet.innerHTML=
        '<div class="cr-action-sheet-card">'+
            '<div class="cr-action-sheet-target">'+
                '<div class="cr-action-sheet-target-name">'+escapeHtml(targetName)+'</div>'+
                '<div class="cr-action-sheet-target-sub">Long-press Action</div>'+
            '</div>'+
            '<button class="cr-action-sheet-btn" id="casConfirm">'+
                actionIcon+
                '<span class="cr-action-sheet-btn-label">'+actionLabel+'</span>'+
                '<span class="cr-action-sheet-target-sub">'+actionSub+'</span>'+
            '</button>'+
            '<button class="cr-action-sheet-btn cancel" id="casCancel">'+
                '<span class="cr-action-sheet-btn-label">Cancel</span>'+
            '</button>'+
        '</div>';
    document.body.appendChild(sheet);
    requestAnimationFrame(function(){sheet.classList.add('show');});

    var hide=function(result){
        sheet.classList.remove('show');
        setTimeout(function(){
            if(sheet.parentNode)sheet.parentNode.removeChild(sheet);
            if(cb)cb(result);
        },200);
    };

    document.getElementById('casConfirm').addEventListener('click',function(){hide(true);});
    document.getElementById('casCancel').addEventListener('click',function(){hide(false);});
    sheet.addEventListener('click',function(e){if(e.target===sheet)hide(false);});
}

function escapeHtml(str){var d=document.createElement('div');d.textContent=str;return d.innerHTML;}

function build(){
    if(built)return;
    built=true;
    var el=document.createElement('div');
    el.className='chat-room-window';
    el.id='chatRoomApp';
    document.body.appendChild(el);
}

function closeChatRoom(){
    var el=document.getElementById('chatRoomApp');
    if(!el)return;
    el.classList.remove('active');
    el.classList.add('closing');
    setTimeout(function(){el.classList.remove('closing');},350);
}

window.openChatRoom=function(){
    build();
    // 每次打开都从 ChatDB 加载最新数据
    if(typeof ChatDB!=='undefined'){
        ChatDB.loadEntities(function(ents){
            if(ents&&ents.length)window._caEntities=ents;
            ChatDB.loadAllConversations(function(convs){
                if(convs)window._caConversations=convs;
                render();
                var el=document.getElementById('chatRoomApp');
                el.classList.remove('closing');
                el.classList.add('active');
            });
        });
    }else{
        render();
        var el=document.getElementById('chatRoomApp');
        el.classList.remove('closing');
        el.classList.add('active');
    }
};

window.closeChatRoom=closeChatRoom;

})();
