// js/-A-24-page2.js · Page 2 桌面
function renderPage2(){
var page=document.getElementById('page2');
if(!page)return;
page.innerHTML=
'<div class="p2-arch"></div>'+
'<div class="p2-grain"></div>'+
'<div class="p2-wm">Dashboard</div>'+
'<div class="spark" style="top:55px;left:30px;font-size:12px;">✦</div>'+
'<div class="spark dark" style="top:60px;right:40px;font-size:10px;">☆</div>'+
'<div class="spark" style="top:200px;left:18px;font-size:9px;">✧</div>'+
'<div class="spark dark" style="top:350px;right:16px;font-size:8px;">♪</div>'+
'<div class="spark" style="top:480px;left:24px;font-size:10px;">♫</div>'+
'<div class="spark dark" style="top:600px;right:28px;font-size:9px;">✦</div>'+
'<div class="spark" style="top:720px;left:36px;font-size:7px;">☆</div>'+
'<div class="spark dark" style="top:560px;left:50%;font-size:7px;">✶</div>'+
'<div class="p2-scroll">'+
'<div class="p2-card" id="p2ProfileCard">'+
'<!-- 资料卡自定义背景图 -->'+
'<div class="p2-card-bg-img" id="p2CardBgImg"></div>'+
'<input type="file" accept="image/*" id="p2CardBgInput" style="display:none;">'+
'<!-- 瑞士精密仪表装饰 -->'+
'<div class="swiss-crosshair swiss-ch-tl"></div><div class="swiss-crosshair swiss-ch-tr"></div><div class="swiss-scale"></div><div class="swiss-coords">SYS.LOC // 48.8566</div>'+
'<!-- 浪漫星轨装饰 -->'+
'<div class="celestial-orbit-bg"><div class="celestial-star" style="top: 25px; left: 40px;">✦</div><div class="celestial-star" style="top: 80px; right: 50px; font-size: 6px;">★</div><div class="celestial-star" style="top: 150px; left: 30px; font-size: 5px;">✦</div></div>'+
'<!-- 经典铜版植物装饰 -->'+
'<svg class="botanical-overlay" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M10,95 Q30,60 15,10 Q10,35 30,30 Q45,25 25,60" fill="none" stroke="#151517" stroke-width="0.5"/><path d="M90,95 Q70,70 80,20 Q85,45 65,40 Q50,35 70,65" fill="none" stroke="#151517" stroke-width="0.5"/></svg>'+
'<!-- 建筑蓝图装饰 -->'+
'<div class="blueprint-grid"></div><div class="blueprint-line"></div>'+
'<!-- 解构主义标签装饰 -->'+
'<div class="tag-barcode"></div><div class="tag-stamp">STUDIO</div>'+
'<div class="p2-banner" id="p2Banner"><div class="p2-banner-img" id="p2BannerImg"></div><div class="p2-banner-overlay"></div><div class="p2-banner-wm">Aesthetic</div><input type="file" accept="image/*" id="p2BannerInput" style="display:none;"></div>'+
'<div class="p2-avatar" id="p2AvatarWrap"><div class="p2-avatar-star-arch"></div><div class="p2-star-scatter" style="top:-75px;left:-15px;font-size:12px;">★</div><div class="p2-star-scatter" style="top:-55px;right:-18px;font-size:8px;">★</div><div class="p2-star-scatter" style="top:-30px;left:-25px;font-size:7px;">★</div><div class="p2-star-scatter" style="top:-15px;right:-28px;font-size:10px;">★</div><div class="p2-avatar-inner" id="p2AvatarInner">◠‿◠</div><input type="file" accept="image/*" id="p2AvatarInput" style="display:none;"></div>'+
'<div class="p2-info">'+
'<input class="p2-editable p2-name-edit" id="p2EditName" value="'+(localStorage.getItem('p2-profile-name')||'A0nynx_3i')+'" spellcheck="false">'+
'<input class="p2-editable p2-tag-edit" id="p2EditTag" value="'+(localStorage.getItem('p2-profile-tag')||'☆ · stay with me Forever · ☆')+'" spellcheck="false">'+
'<input class="p2-editable p2-bio-edit" id="p2EditBio" value="'+(localStorage.getItem('p2-profile-bio')||'那一夜的雨在我的灵魂筑巢。')+'" spellcheck="false">'+
'<div class="p2-loc"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><input class="p2-editable p2-loc-edit" id="p2EditLoc" value="'+(localStorage.getItem('p2-profile-loc')||'Studio Zero')+'" spellcheck="false"></div>'+
'</div>'+
'<div class="p2-cal">'+
'<div class="p2-cal-row">'+
'<div class="p2-cal-d">SUN</div><div class="p2-cal-d">MON</div><div class="p2-cal-d">TUE</div><div class="p2-cal-d">WED</div><div class="p2-cal-d">THU</div><div class="p2-cal-d">FRI</div><div class="p2-cal-d">SAT</div>'+
'<div class="p2-cal-n">15</div><div class="p2-cal-n">16</div><div class="p2-cal-n"><span class="p2-cal-n today">17</span></div><div class="p2-cal-n">18</div><div class="p2-cal-n">19</div><div class="p2-cal-n">20</div><div class="p2-cal-n">21</div>'+
'</div>'+
'</div>'+
'</div>'+
'<div class="p2-apps">'+
'<div class="p2-apps-title">✦ Applications ✦</div>'+
'<div class="p2-grid">'+
'<div class="p2-w-music"><div class="p2-wm-box" id="p2MusicCardLeft"><div class="p2-wm-cover">'+
'<div class="p2-wm-bg-img" id="p2WmBgImg"></div>'+
'<div class="p2-np-header"><span class="p2-np-badge">playing</span><span class="p2-np-serial">N° 309</span></div>'+
'<div class="p2-np-meta"><h2 class="p2-np-title" id="p2NpTitle">Clair de Lune</h2><p class="p2-np-artist" id="p2NpArtist">Claude Debussy</p></div>'+
'<div class="p2-np-progress"><div class="p2-np-time"><span>01:45</span><span>04:52</span></div><div class="p2-np-bar-bg"><div class="p2-np-bar-fill"></div><div class="p2-np-bar-point"></div></div></div>'+
'<div class="p2-vinyl-wrap" id="p2VinylSwitch">'+
'<div class="p2-vinyl p2-vinyl-a active" data-vinyl="0"><div class="p2v-hole"></div></div>'+
'<div class="p2-vinyl p2-vinyl-b" data-vinyl="1"><div class="p2v-label"><div class="p2v-text">PLAY</div></div></div>'+
'<div class="p2-vinyl p2-vinyl-c" data-vinyl="2"><div class="p2v-center"></div></div>'+
'<div class="p2-vinyl p2-vinyl-d" data-vinyl="3"><div class="p2v-center"><div class="p2v-title">Couture</div><div class="p2v-dot"></div></div></div>'+
'<div class="p2-vinyl p2-vinyl-e" data-vinyl="4"><div class="p2v-ring"></div><div class="p2v-label"><div class="p2v-title">Nocturne</div><div class="p2v-sub">Side A</div><div class="p2v-hole"></div></div></div>'+
'</div>'+
'</div></div><div class="p2-wm-label">Now Playing</div>'+
'<input type="file" accept="image/*" id="p2MusicBgInput" style="display:none;"></div>'+
'<div class="p2-app"><div class="p2-ico glass"><span class="p2-ico-star">★</span><svg viewBox="0 0 24 24" fill="none" stroke="#151517" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="4" fill="rgba(21,21,23,0.02)"/><circle cx="12" cy="12" r="3.5"/><path d="M7 6 L9 3 L15 3 L17 6"/><circle cx="12" cy="12" r="1" fill="#151517"/><circle cx="18" cy="9" r="0.7" fill="#151517" stroke="none"/></svg></div><div class="p2-app-l">相机</div></div>'+
'<div class="p2-app"><div class="p2-ico outline"><svg viewBox="0 0 24 24" fill="none" stroke="#151517" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11C7 4 10 2 11 6C12 9 12 9 13 6C14 2 17 4 17 11C20 13 20 18 17 20C14 22 10 22 7 20C4 18 4 13 7 11Z" fill="rgba(21,21,23,0.02)"/><circle cx="9" cy="15" r="1" fill="#151517"/><circle cx="15" cy="15" r="1" fill="#151517"/><path d="M11 16Q12 18 13 16"/></svg></div><div class="p2-app-l">商店</div></div>'+
'<div class="p2-app" onclick="if(window.openSettingsCustomizer) window.openSettingsCustomizer();"><div class="p2-ico dark"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 1 1 4 0v.09"/></svg></div><div class="p2-app-l">设置</div></div>'+
'<div class="p2-app"><div class="p2-ico glass"><span class="p2-ico-star">❄</span><svg viewBox="0 0 24 24" fill="none" stroke="#151517" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3" fill="rgba(21,21,23,0.02)"/><path d="M4 15 L9 10 L13 14 L17 9 L20 12"/><circle cx="15" cy="7.5" r="1" fill="#151517" stroke="none"/></svg></div><div class="p2-app-l">照片</div></div>'+
'<div class="p2-ico glass" style="grid-column:span 2;width:100%;height:60px;border-radius:16px;justify-content:flex-start;gap:10px;padding:0 14px;"><svg viewBox="0 0 24 24" fill="none" stroke="#151517" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M3 6h5l1.5 2h11.5v10h-18z" fill="rgba(21,21,23,0.02)"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14" stroke-dasharray="2 2"/><circle cx="12" cy="14" r="1" fill="#151517"/></svg><div><div style="font-size:11px;font-weight:700;color:var(--ink);">Folder</div><div style="font-size:7px;color:rgba(21,21,23,0.3);letter-spacing:0.3px;">Worldbook · Personas</div></div></div>'+
'<div class="p2-app"><div class="p2-ico dark"><svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13" fill="rgba(255,255,255,0.08)"/><circle cx="6" cy="18" r="3" fill="rgba(255,255,255,0.1)"/><circle cx="18" cy="16" r="3" fill="rgba(255,255,255,0.1)"/></svg></div><div class="p2-app-l">音乐</div></div>'+
'<div class="p2-app"><div class="p2-ico outline"><svg viewBox="0 0 24 24" fill="none" stroke="#151517" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 4 A 4 8 0 0 1 12 20 A 4 8 0 0 1 12 4 Z" fill="rgba(21,21,23,0.02)"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="12" cy="12" r="1.2" fill="#151517" stroke="none"/></svg></div><div class="p2-app-l">浏览器</div></div>'+
'<div class="p2-app"><div class="p2-ico glass"><svg viewBox="0 0 24 24" fill="none" stroke="#151517" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" fill="rgba(21,21,23,0.02)"/><line x1="9" y1="13" x2="15" y2="13" stroke-width="0.9"/><line x1="9" y1="17" x2="13" y2="17" stroke-width="0.9"/><circle cx="15" cy="17" r="0.8" fill="#151517" stroke="none"/></svg></div><div class="p2-app-l">备忘</div></div>'+
'<div class="p2-search"><div class="p2-search-bar"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><line x1="16" y1="16" x2="20" y2="20"/></svg>搜索</div></div>'+
'</div>'+
'</div>'+
'</div>'+
'';

// ── 头像加载与上传 ──
var savedAvatar=localStorage.getItem('p2-avatar-img');
if(savedAvatar){
    var avEl=document.getElementById('p2AvatarInner');
    if(avEl){avEl.innerHTML='<img src="'+savedAvatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">';}
}

// ── Banner 加载与上传（采用无限存储，点击 Banner 区域即可上传） ──
var bannerArea=document.getElementById('p2Banner');
var bannerInput=document.getElementById('p2BannerInput');
var bannerImgEl=document.getElementById('p2BannerImg');

if(bannerArea && bannerInput && bannerImgEl){
    if(window.SystemSettingsDB){
        window.SystemSettingsDB.get('p2-banner-img', function(savedBanner){
            if(savedBanner){
                bannerImgEl.style.backgroundImage='url('+savedBanner+')';
                bannerImgEl.style.opacity='1';
            }
        });
    }

    bannerArea.addEventListener('click', function(e){
        e.stopPropagation();
        bannerInput.click();
    });

    bannerInput.addEventListener('change', function(ev){
        var file = ev.target.files[0]; if(!file)return;
        var reader = new FileReader();
        reader.onload = function(event){
            var dataUrl = event.target.result;
            if(window.SystemSettingsDB){
                window.SystemSettingsDB.set('p2-banner-img', dataUrl, function(){
                    bannerImgEl.style.backgroundImage='url('+dataUrl+')';
                    bannerImgEl.style.opacity='1';
                });
            }
        };
        reader.readAsDataURL(file);
    });
}

// ── Avatar 上传（点击头像） ──
var avWrap=document.getElementById('p2AvatarWrap');
var avInput=document.getElementById('p2AvatarInput');
if(avWrap&&avInput){
    avWrap.addEventListener('click',function(e){e.stopPropagation();avInput.click();});
    avInput.addEventListener('change',function(ev){
        var file=ev.target.files[0];if(!file)return;
        var img=new Image();
        img.onload=function(){
            var canvas=document.createElement('canvas');
            var size=Math.min(img.width,img.height);
            canvas.width=256;canvas.height=256;
            var ctx=canvas.getContext('2d');
            var sx=(img.width-size)/2,sy=(img.height-size)/2;
            ctx.drawImage(img,sx,sy,size,size,0,0,256,256);
            var dataUrl=canvas.toDataURL('image/jpeg',0.85);
            localStorage.setItem('p2-avatar-img',dataUrl);
            var avInner=document.getElementById('p2AvatarInner');
            if(avInner){avInner.innerHTML='<img src="'+dataUrl+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">';}
        };
        img.src=URL.createObjectURL(file);
    });
}

// ── 文案编辑自动保存 ──
var editFields=[
    {id:'p2EditName',key:'p2-profile-name'},
    {id:'p2EditTag',key:'p2-profile-tag'},
    {id:'p2EditBio',key:'p2-profile-bio'},
    {id:'p2EditLoc',key:'p2-profile-loc'}
];
editFields.forEach(function(f){
    var el=document.getElementById(f.id);
    if(!el)return;
    el.addEventListener('input',function(){
        localStorage.setItem(f.key,el.value);
    });
    el.addEventListener('keydown',function(e){
        if(e.key==='Enter'){e.preventDefault();el.blur();}
    });
    el.addEventListener('click',function(e){
        e.stopPropagation();
    });
});

// ── 唱片切换 ──
var vinylWrap=document.getElementById('p2VinylSwitch');
if(vinylWrap){
    var savedVinyl=parseInt(localStorage.getItem('p2-vinyl-style')||'0',10);
    var allVinyls=vinylWrap.querySelectorAll('.p2-vinyl');
    if(savedVinyl>0&&savedVinyl<allVinyls.length){
        allVinyls.forEach(function(v){v.classList.remove('active');});
        allVinyls[savedVinyl].classList.add('active');
    }
    vinylWrap.addEventListener('click',function(e){
        e.stopPropagation();
        var current=-1;
        allVinyls.forEach(function(v,i){if(v.classList.contains('active'))current=i;});
        var next=(current+1)%allVinyls.length;
        allVinyls.forEach(function(v){v.classList.remove('active');});
        allVinyls[next].classList.add('active');
        localStorage.setItem('p2-vinyl-style',String(next));
    });
}

// ── Now Playing 左侧卡片背景图上传与无限存储 ──
var musicCardLeft=document.getElementById('p2MusicCardLeft');
var musicBgInput=document.getElementById('p2MusicBgInput');
var wmBgImgEl=document.getElementById('p2WmBgImg');

if(musicCardLeft&&musicBgInput&&wmBgImgEl){
    // 初始化加载已保存的背景图（使用全局 SystemSettingsDB 解决 5MB 限制）
    if(window.SystemSettingsDB){
        window.SystemSettingsDB.get('a0-music-card-bg', function(savedBg){
            if(savedBg){
                wmBgImgEl.style.backgroundImage = 'url('+savedBg+')';
                wmBgImgEl.style.opacity = '1';
            }
        });
    }

    // 点击卡片左侧触发上传
    musicCardLeft.addEventListener('click', function(e){
        musicBgInput.click();
    });

    musicBgInput.addEventListener('change', function(ev){
        var file = ev.target.files[0]; if(!file)return;
        var reader = new FileReader();
        reader.onload = function(event){
            var dataUrl = event.target.result;
            if(window.SystemSettingsDB){
                window.SystemSettingsDB.set('a0-music-card-bg', dataUrl, function(){
                    wmBgImgEl.style.backgroundImage = 'url('+dataUrl+')';
                    wmBgImgEl.style.opacity = '1';
                });
            }
        };
        reader.readAsDataURL(file);
    });
}

// ── 个人资料卡背景图上传与无限存储 ──
var p2ProfileCard = document.getElementById('p2ProfileCard');
var p2CardBgInput = document.getElementById('p2CardBgInput');
var p2CardBgImg = document.getElementById('p2CardBgImg');
var p2InfoSection = p2ProfileCard ? p2ProfileCard.querySelector('.p2-info') : null;

if(p2ProfileCard && p2CardBgInput && p2CardBgImg && p2InfoSection){
    if(window.SystemSettingsDB){
        window.SystemSettingsDB.get('a0-profile-card-bg', function(savedBg){
            if(savedBg){
                p2CardBgImg.style.backgroundImage = 'url('+savedBg+')';
                p2CardBgImg.style.opacity = '1';
            }
        });
    }

    // 点击资料卡信息区域（排除文字输入框）触发上传
    p2InfoSection.addEventListener('click', function(e){
        if(e.target.tagName !== 'INPUT'){
            e.stopPropagation();
            p2CardBgInput.click();
        }
    });

    p2CardBgInput.addEventListener('change', function(ev){
        var file = ev.target.files[0]; if(!file)return;
        var reader = new FileReader();
        reader.onload = function(event){
            var dataUrl = event.target.result;
            if(window.SystemSettingsDB){
                window.SystemSettingsDB.set('a0-profile-card-bg', dataUrl, function(){
                    p2CardBgImg.style.backgroundImage = 'url('+dataUrl+')';
                    p2CardBgImg.style.opacity = '1';
                });
            }
        };
        reader.readAsDataURL(file);
    });
}
}
