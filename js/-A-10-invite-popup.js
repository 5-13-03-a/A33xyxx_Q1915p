// js/-A-10-invite-popup.js · 邀请见面弹窗系统

(function() {
    'use strict';

    /* 注入样式 */
    var style = document.createElement('style');
    style.id = 'invite-popup-style';
    style.textContent =
        '.inv-overlay{position:fixed;inset:0;background:rgba(20,18,26,.72);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:2147483646;animation:invFadeIn .4s ease;opacity:1;transition:opacity .3s;}' +
        '@keyframes invFadeIn{from{opacity:0}to{opacity:1}}' +
        '.inv-card{width:260px;background:rgba(248,247,249,.97);border-radius:24px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.08);animation:invSlideUp .5s cubic-bezier(.16,1,.3,1);position:relative;}' +
        '@keyframes invSlideUp{from{transform:translateY(40px) scale(.94);opacity:0}to{transform:none;opacity:1}}' +
        '.inv-stripe{height:5px;background:repeating-linear-gradient(-45deg,#6b667a,#6b667a 8px,#8c879e 8px,#8c879e 16px);}' +
        '.inv-scene{padding:20px 16px 10px;display:flex;flex-direction:column;align-items:center;position:relative;background:linear-gradient(180deg,#f0eef5 0%,#f8f7f9 100%);}' +
        '.inv-stars{position:absolute;inset:0;pointer-events:none;overflow:hidden;}' +
        '.inv-star{position:absolute;border-radius:50%;background:#6b667a;animation:invTwinkle 2s ease-in-out infinite;}' +
        '@keyframes invTwinkle{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}' +
        '.inv-moon{position:absolute;top:10px;right:18px;}' +
        '.inv-avatars{display:flex;align-items:flex-end;justify-content:center;position:relative;z-index:2;margin-bottom:-24px;}' +
        '.inv-av-wrap{display:flex;flex-direction:column;align-items:center;}' +
        '.inv-av-circle{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.15);position:relative;overflow:hidden;}' +
        '.inv-av-me{background:#2a2830;}' +
        '.inv-av-entity{background:#fff;border:2px solid #6b667a;}' +
        '.inv-av-label{font-size:7px;font-weight:800;letter-spacing:.8px;color:#9a98a3;text-transform:uppercase;margin-top:4px;}' +
        '.inv-connector{width:24px;height:24px;position:relative;z-index:3;margin:0 -4px;margin-bottom:20px;flex-shrink:0;}' +
        '.inv-house-wrap{position:relative;z-index:1;margin-top:2px;animation:invHouseGlow 2.5s ease-in-out infinite;}' +
        '@keyframes invHouseGlow{0%,100%{filter:drop-shadow(0 4px 12px rgba(107,102,122,.2))}50%{filter:drop-shadow(0 6px 18px rgba(107,102,122,.38))}}' +
        '.inv-path-anim{stroke-dasharray:120;stroke-dashoffset:120;animation:invDrawPath 1.2s cubic-bezier(.4,0,.2,1) .3s forwards;}' +
        '@keyframes invDrawPath{to{stroke-dashoffset:0}}' +
        '.inv-body{padding:8px 18px 4px;text-align:center;}' +
        '.inv-label{font-size:8px;font-weight:800;letter-spacing:2px;color:#9a98a3;text-transform:uppercase;font-family:monospace;margin-bottom:4px;}' +
        '.inv-title{font-size:14px;font-weight:800;color:#2a2830;line-height:1.35;margin-bottom:4px;}' +
        '.inv-sub{font-size:11px;color:#9a98a3;font-style:italic;line-height:1.5;}' +
        '.inv-divider{margin:10px 18px 0;height:1px;background:repeating-linear-gradient(90deg,transparent,transparent 4px,rgba(107,102,122,.12) 4px,rgba(107,102,122,.12) 8px);}' +
        '.inv-btn-row{display:flex;gap:6px;padding:10px 14px 14px;}' +
        '.inv-btn{flex:1;padding:10px;border:none;border-radius:50px;font-size:11px;font-weight:800;cursor:pointer;transition:all .18s;letter-spacing:.3px;}' +
        '.inv-btn-accept{background:#2a2830;color:#fff;box-shadow:0 4px 14px rgba(42,40,48,.25);}' +
        '.inv-btn-accept:active{transform:scale(.95);background:#1a1820;}' +
        '.inv-btn-decline{background:rgba(107,102,122,.09);color:#6b667a;border:1px solid rgba(107,102,122,.15);}' +
        '.inv-btn-decline:active{transform:scale(.95);background:rgba(107,102,122,.16);}' +
        '.inv-sig{text-align:center;padding:0 0 10px;font-family:Georgia,serif;font-style:italic;font-size:9px;color:rgba(107,102,122,.35);letter-spacing:1px;}' +
        '@keyframes invSmoke{0%,100%{transform:translateX(0)}50%{transform:translateX(-3px)}}';
    document.head.appendChild(style);

    /**
     * 显示邀请弹窗
     * @param {Object} opts
     * @param {string} opts.entId - 实体ID
     * @param {string} opts.entName - 实体名称
     * @param {string} opts.entAvatar - 实体头像URL（可选）
     * @param {string} opts.entColor - 实体颜色
     * @param {string} opts.direction - 'come_to_me' | 'go_to_them'
     * @param {string} opts.message - 附带消息（可选）
     * @param {function} opts.onAccept - 接受回调
     * @param {function} opts.onDecline - 拒绝回调
     */
    window.showInvitePopup = function(opts) {
        var existing = document.querySelector('.inv-overlay');
        if (existing) existing.remove();

        var entName = opts.entName || 'Entity';
        var entInitial = (entName).trim().charAt(0).toUpperCase();
        var entColor = opts.entColor || '#6b667a';

        /* 实体头像 */
        var entAvHtml = opts.entAvatar
            ? '<img src="' + opts.entAvatar + '" style="width:100%;height:100%;object-fit:cover;">'
            : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:' + entColor + ';color:#fff;font-size:18px;font-weight:700;">' + entInitial + '</div>';

        /* 用户头像 */
        var masks = [];
        try { masks = JSON.parse(localStorage.getItem('ca-user-masks') || '[]'); } catch(e) {}
        var activeMask = masks.find(function(m) { return m.active; });
        var meInitial = activeMask && activeMask.name ? activeMask.name.trim().charAt(0).toUpperCase() : 'U';
        var meAvHtml = activeMask && activeMask.avatar
            ? '<img src="' + activeMask.avatar + '" style="width:100%;height:100%;object-fit:cover;">'
            : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#2a2830;color:#fff;font-size:18px;font-weight:700;">' + meInitial + '</div>';

        /* 标题文案 */
        var titleText = '';
        var subText = opts.message || '';
        if (opts.direction === 'come_to_me') {
            titleText = entName + ' 想来你家坐坐';
            if (!subText) subText = '*轻轻敲了敲门…*';
        } else {
            titleText = entName + ' 邀请你去ta家';
            if (!subText) subText = '*向你发出了邀请…*';
        }

        var overlay = document.createElement('div');
        overlay.className = 'inv-overlay';
        overlay.innerHTML =
            '<div class="inv-card">' +
                '<div class="inv-stripe"></div>' +
                '<div class="inv-scene">' +
                    '<div class="inv-stars">' +
                        '<div class="inv-star" style="width:2px;height:2px;top:14px;left:24px;animation-delay:.2s;"></div>' +
                        '<div class="inv-star" style="width:3px;height:3px;top:24px;left:65px;animation-delay:.8s;"></div>' +
                        '<div class="inv-star" style="width:2px;height:2px;top:10px;left:120px;animation-delay:1.2s;"></div>' +
                        '<div class="inv-star" style="width:2px;height:2px;top:32px;right:32px;animation-delay:.5s;"></div>' +
                        '<div class="inv-star" style="width:3px;height:3px;top:16px;right:72px;animation-delay:1.5s;"></div>' +
                    '</div>' +
                    '<div class="inv-moon"><svg width="18" height="18" viewBox="0 0 22 22"><path d="M18 11.5A7 7 0 1 1 10.5 4a5.5 5.5 0 0 0 7.5 7.5z" fill="#c4bfd8" opacity=".6"/></svg></div>' +
                    '<div class="inv-avatars" style="margin-top:14px;">' +
                        '<div class="inv-av-wrap">' +
                            '<div class="inv-av-circle inv-av-entity">' + entAvHtml + '</div>' +
                            '<div class="inv-av-label">' + entName.split(' ')[0] + '</div>' +
                        '</div>' +
                        '<div class="inv-connector">' +
                            '<svg width="24" height="24" viewBox="0 0 28 28" fill="none">' +
                                '<path class="inv-path-anim" d="M4 14 Q14 4 24 14" stroke="#6b667a" stroke-width="1.5" stroke-linecap="round" fill="none"/>' +
                                '<path class="inv-path-anim" d="M4 14 Q14 24 24 14" stroke="#c4bfd8" stroke-width="1.5" stroke-linecap="round" fill="none" style="animation-delay:.5s"/>' +
                                '<circle cx="14" cy="14" r="3" fill="#6b667a" opacity=".7" style="animation:invTwinkle 1.8s ease-in-out infinite"/>' +
                            '</svg>' +
                        '</div>' +
                        '<div class="inv-av-wrap">' +
                            '<div class="inv-av-circle inv-av-me">' + meAvHtml + '</div>' +
                            '<div class="inv-av-label">You</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="inv-house-wrap">' +
                        '<svg width="100" height="75" viewBox="0 0 120 90" fill="none">' +
                            '<line x1="10" y1="82" x2="110" y2="82" stroke="#c4bfd8" stroke-width="1" stroke-dasharray="4 3" opacity=".5"/>' +
                            '<rect x="32" y="50" width="56" height="32" rx="2" fill="#eceaf0" stroke="#6b667a" stroke-width="1.5"/>' +
                            '<path class="inv-path-anim" d="M24 52 L60 22 L96 52" stroke="#2a2830" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                            '<path d="M26 52 L60 24 L94 52 Z" fill="#2a2830" opacity=".08"/>' +
                            '<rect x="72" y="28" width="8" height="14" rx="1" fill="#6b667a" opacity=".6"/>' +
                            '<path d="M76 26 Q74 20 76 16 Q78 12 76 8" stroke="#c4bfd8" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".5" style="animation:invSmoke 2s ease-in-out infinite"/>' +
                            '<rect x="51" y="60" width="18" height="22" rx="9 9 2 2" fill="#6b667a" opacity=".18" stroke="#6b667a" stroke-width="1.2"/>' +
                            '<circle cx="66" cy="72" r="1.5" fill="#6b667a" opacity=".5"/>' +
                            '<rect x="36" y="56" width="12" height="10" rx="2" fill="#d4d0e0" stroke="#6b667a" stroke-width="1" opacity=".7"/>' +
                            '<line x1="42" y1="56" x2="42" y2="66" stroke="#6b667a" stroke-width=".8" opacity=".4"/>' +
                            '<line x1="36" y1="61" x2="48" y2="61" stroke="#6b667a" stroke-width=".8" opacity=".4"/>' +
                            '<rect x="72" y="56" width="12" height="10" rx="2" fill="#d4d0e0" stroke="#6b667a" stroke-width="1" opacity=".7"/>' +
                            '<line x1="78" y1="56" x2="78" y2="66" stroke="#6b667a" stroke-width=".8" opacity=".4"/>' +
                            '<line x1="72" y1="61" x2="84" y2="61" stroke="#6b667a" stroke-width=".8" opacity=".4"/>' +
                            '<rect x="73" y="57" width="4" height="3" rx="1" fill="#fff" opacity=".5"/>' +
                            '<rect x="37" y="57" width="4" height="3" rx="1" fill="#fff" opacity=".5"/>' +
                            '<line x1="18" y1="82" x2="18" y2="64" stroke="#6b667a" stroke-width="1.2" opacity=".4"/>' +
                            '<circle cx="18" cy="60" r="7" fill="#6b667a" opacity=".12" stroke="#6b667a" stroke-width="1" opacity=".3"/>' +
                            '<line x1="102" y1="82" x2="102" y2="68" stroke="#6b667a" stroke-width="1.2" opacity=".4"/>' +
                            '<circle cx="102" cy="64" r="5" fill="#6b667a" opacity=".12" stroke="#6b667a" stroke-width="1" opacity=".3"/>' +
                        '</svg>' +
                    '</div>' +
                '</div>' +
                '<div class="inv-body">' +
                    '<div class="inv-label">Incoming Invite</div>' +
                    '<div class="inv-title">' + titleText + '</div>' +
                    '<div class="inv-sub">' + subText + '</div>' +
                '</div>' +
                '<div class="inv-divider"></div>' +
                '<div class="inv-btn-row">' +
                    '<button class="inv-btn inv-btn-decline" id="invDeclineBtn">拒绝</button>' +
                    '<button class="inv-btn inv-btn-accept" id="invAcceptBtn">接受邀请</button>' +
                '</div>' +
                '<div class="inv-sig">Private Space · Meet</div>' +
            '</div>';

        document.body.appendChild(overlay);

        function closePopup(cb) {
            overlay.style.opacity = '0';
            setTimeout(function() {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                if (cb) cb();
            }, 300);
        }

        overlay.querySelector('#invDeclineBtn').addEventListener('click', function() {
            closePopup(opts.onDecline || null);
        });

        overlay.querySelector('#invAcceptBtn').addEventListener('click', function() {
            closePopup(function() {
                if (opts.onAccept) opts.onAccept();
            });
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closePopup(opts.onDecline || null);
        });
    };

    /**
     * 解析 AI 回复中的见面邀请标签
     * AI 回复中包含 [INVITE_MEET: come_to_me] 或 [INVITE_MEET: go_to_them] 时触发弹窗
     * 不立即弹出，而是返回信息，由外层在最后一个分句渲染完成后调用 triggerInvitePopup
     */
    window.parseInviteTag = function(replyText, entId) {
        var match = replyText.match(/\[INVITE_MEET:\s*(come_to_me|go_to_them)\]/i);
        if (!match) return { text: replyText, hasInvite: false, direction: null };

        var direction = match[1].toLowerCase();
        var cleanText = replyText.replace(/\[INVITE_MEET:\s*(come_to_me|go_to_them)\]/gi, '').trim();

        return { text: cleanText, hasInvite: true, direction: direction };
    };

    /**
     * 在最后一个气泡渲染完成后调用此函数弹出邀请
     */
    window.triggerInvitePopup = function(entId, direction, messageText) {
        var inviteConfig = JSON.parse(localStorage.getItem('ca-invite-config-' + entId) || '{"allow":false}');
        if (!inviteConfig.allow) return;

        var ent = null;
        if (window._caEntities) {
            ent = window._caEntities.find(function(e) { return e.id === entId; });
        }
        if (!ent) {
            var signText = document.getElementById('cdSignText');
            ent = {
                id: entId,
                name: signText ? signText.textContent : 'Entity',
                avatar: '',
                color: '#6b667a'
            };
        }

        setTimeout(function() {
            window.showInvitePopup({
                entId: entId,
                entName: ent.nickname || ent.name,
                entAvatar: ent.avatar || '',
                entColor: ent.color || '#6b667a',
                direction: direction,
                message: messageText || '',
                onAccept: function() {
                    localStorage.setItem('ps-current-entity', JSON.stringify(ent));
                    localStorage.setItem('ps-meet-direction', direction);
                    if (typeof openPrivateSpace === 'function') {
                        openPrivateSpace();
                    }
                },
                onDecline: function() {}
            });
        }, 800);
    };

})();
