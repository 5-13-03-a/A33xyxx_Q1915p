// js/cloud-sync.js · 云同步模块
(function() {
    'use strict';

    var API_BASE = 'https://chat-api.vsfstnku8b5.workers.dev';
    var SYNC_CODE_KEY = 'ca-sync-code';

    // 获取或生成同步码
    function getSyncCode() {
        var code = localStorage.getItem(SYNC_CODE_KEY);
        if (!code) {
            code = generateCode();
            localStorage.setItem(SYNC_CODE_KEY, code);
        }
        return code;
    }

    function generateCode() {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var code = '';
        for (var i = 0; i < 8; i++) {
            if (i === 4) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    function setSyncCode(code) {
        localStorage.setItem(SYNC_CODE_KEY, code.trim().toUpperCase());
    }

    // API 调用
    function safeParseJSON(r, cb) {
        return r.text().then(function(text) {
            if (!text || text.trim().length === 0) {
                throw new Error('Empty response from server');
            }
            var first = text.trim().charAt(0);
            if (first !== '{' && first !== '[') {
                throw new Error('Server returned non-JSON: ' + text.substring(0, 80));
            }
            return JSON.parse(text);
        });
    }

    function saveToCloud(dataKey, dataValue, cb) {
        var code = getSyncCode();
        fetch(API_BASE + '/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sync_code: code, data_key: dataKey, data_value: dataValue })
        })
        .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + r.statusText);
            return safeParseJSON(r);
        })
        .then(function(d) { if (cb) cb(null, d); })
        .catch(function(e) { if (cb) cb(e); });
    }

    function loadFromCloud(dataKey, cb) {
        var code = getSyncCode();
        fetch(API_BASE + '/load', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sync_code: code, data_key: dataKey || undefined })
        })
        .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + r.statusText);
            return safeParseJSON(r);
        })
        .then(function(d) { if (cb) cb(null, d.data); })
        .catch(function(e) { if (cb) cb(e); });
    }

    function deleteFromCloud(dataKey, cb) {
        var code = getSyncCode();
        fetch(API_BASE + '/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sync_code: code, data_key: dataKey })
        })
        .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + r.statusText);
            return safeParseJSON(r);
        })
        .then(function(d) { if (cb) cb(null, d); })
        .catch(function(e) { if (cb) cb(e); });
    }

    // 上传全部数据
    function uploadAll(entities, conversations, cb) {
        var code = getSyncCode();
        var psConvs = {};
        var memoryData = {};
        var lensData = {};
        var theatreData = {};
        var miscData = {};
        // 已显式处理的 key（不放进 miscData，避免重复）
        var explicitKeys = ['ca-sync-code','ca-user-masks','ca-api-config','ca-trans-config','ca-av-config','ca-time-config','ca-custom-css','ca-dec-config','ca-theatres','ca-anim-config','ca-watermark-config','ca-avatar-config','ca-pinned'];
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (!k) continue;
            if (k.indexOf('ps-conv-') === 0 || k.indexOf('ps-pos-') === 0) {
                psConvs[k] = localStorage.getItem(k);
                continue;
            }
            if (k.indexOf('ca-memory-') === 0 || k.indexOf('ca-mem-') === 0 || k.indexOf('ca-auto-sum-') === 0) {
                memoryData[k] = localStorage.getItem(k);
                continue;
            }
            if (k.indexOf('lens-') === 0) {
                lensData[k] = localStorage.getItem(k);
                continue;
            }
            if (k.indexOf('theatre-') === 0) {
                var val = localStorage.getItem(k);
                if (k.indexOf('theatre-bg-') === 0 && val && val.length > 500000) {
                    continue;
                }
                theatreData[k] = val;
                continue;
            }
            // 兜底：所有 ca- 开头的（除了已显式处理的）都进 miscData
            if (k.indexOf('ca-') === 0 && explicitKeys.indexOf(k) < 0) {
                miscData[k] = localStorage.getItem(k);
                continue;
            }
            // api-fab 相关
            if (k.indexOf('api-fab-') === 0 || k === 'sh-api-fab') {
                miscData[k] = localStorage.getItem(k);
                continue;
            }
        }

        /* 收集 Lens IndexedDB 对话数据 */
        collectLensDB(function(lensConvs) {
            var payload = {
                entities: entities,
                conversations: conversations,
                masks: localStorage.getItem('ca-user-masks'),
                apiConfig: localStorage.getItem('ca-api-config'),
                transConfig: localStorage.getItem('ca-trans-config'),
                avConfig: localStorage.getItem('ca-av-config'),
                timeConfig: localStorage.getItem('ca-time-config'),
                customCss: localStorage.getItem('ca-custom-css'),
                decConfig: localStorage.getItem('ca-dec-config'),
                wbEntries: localStorage.getItem('wb-entries'),
                psConvs: psConvs,
                memoryData: memoryData,
                lensData: lensData,
                lensConvs: lensConvs,
                theatreData: theatreData,
                theatres: localStorage.getItem('ca-theatres'),
                animConfig: localStorage.getItem('ca-anim-config'),
                watermarkConfig: localStorage.getItem('ca-watermark-config'),
                avatarConfig: localStorage.getItem('ca-avatar-config'),
                pinned: localStorage.getItem('ca-pinned'),
                miscData: miscData
            };
            saveToCloud('full-backup', JSON.stringify(payload), cb);
        });
    }

    // 收集 LensConvDB 中的所有对话
    function collectLensDB(cb) {
        try {
            var req = indexedDB.open('LensConvDB', 1);
            req.onupgradeneeded = function(e) {
                var d = e.target.result;
                if (!d.objectStoreNames.contains('convs')) d.createObjectStore('convs');
            };
            req.onsuccess = function(e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains('convs')) { cb({}); return; }
                var tx = db.transaction('convs', 'readonly');
                var store = tx.objectStore('convs');
                var result = {};
                var cursorReq = store.openCursor();
                cursorReq.onsuccess = function(ev) {
                    var cursor = ev.target.result;
                    if (cursor) {
                        result[cursor.key] = cursor.value;
                        cursor.continue();
                    } else {
                        cb(result);
                    }
                };
                cursorReq.onerror = function() { cb({}); };
            };
            req.onerror = function() { cb({}); };
        } catch(e) { cb({}); }
    }

    // 下载全部数据
    function downloadAll(cb) {
        loadFromCloud('full-backup', function(err, raw) {
            if (err) { if (cb) cb(err); return; }
            if (!raw) { if (cb) cb(null, null); return; }
            try {
                var data = JSON.parse(raw);
                if (cb) cb(null, data);
            } catch(e) {
                if (cb) cb(e);
            }
        });
    }

    function restoreExtra(data) {
        if (!data) return;
        if (data.psConvs) {
            var keys = Object.keys(data.psConvs);
            for (var i = 0; i < keys.length; i++) {
                if (data.psConvs[keys[i]]) {
                    localStorage.setItem(keys[i], data.psConvs[keys[i]]);
                }
            }
        }
        if (data.memoryData) {
            var mkeys = Object.keys(data.memoryData);
            for (var j = 0; j < mkeys.length; j++) {
                if (data.memoryData[mkeys[j]]) {
                    localStorage.setItem(mkeys[j], data.memoryData[mkeys[j]]);
                }
            }
        }
        if (data.lensData) {
            var lkeys = Object.keys(data.lensData);
            for (var l = 0; l < lkeys.length; l++) {
                if (data.lensData[lkeys[l]]) {
                    localStorage.setItem(lkeys[l], data.lensData[lkeys[l]]);
                }
            }
        }
        if (data.theatreData) {
            var tkeys = Object.keys(data.theatreData);
            for (var t = 0; t < tkeys.length; t++) {
                if (data.theatreData[tkeys[t]]) {
                    localStorage.setItem(tkeys[t], data.theatreData[tkeys[t]]);
                }
            }
        }
        if (data.theatres) localStorage.setItem('ca-theatres', data.theatres);
        if (data.decConfig) localStorage.setItem('ca-dec-config', data.decConfig);
        if (data.wbEntries) localStorage.setItem('wb-entries', data.wbEntries);
        if (data.animConfig) localStorage.setItem('ca-anim-config', data.animConfig);
        if (data.watermarkConfig) localStorage.setItem('ca-watermark-config', data.watermarkConfig);
        if (data.avatarConfig) localStorage.setItem('ca-avatar-config', data.avatarConfig);
        if (data.pinned) localStorage.setItem('ca-pinned', data.pinned);

        /* 兜底恢复：所有 ca-* 杂项 */
        if (data.miscData) {
            var xkeys = Object.keys(data.miscData);
            for (var x = 0; x < xkeys.length; x++) {
                if (data.miscData[xkeys[x]]) {
                    localStorage.setItem(xkeys[x], data.miscData[xkeys[x]]);
                }
            }
        }

        /* 恢复 Lens IndexedDB 对话 */
        if (data.lensConvs) {
            restoreLensDB(data.lensConvs);
        }
    }

    // 恢复 LensConvDB 数据
    function restoreLensDB(convs) {
        if (!convs || typeof convs !== 'object') return;
        try {
            var req = indexedDB.open('LensConvDB', 1);
            req.onupgradeneeded = function(e) {
                var d = e.target.result;
                if (!d.objectStoreNames.contains('convs')) d.createObjectStore('convs');
            };
            req.onsuccess = function(e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains('convs')) return;
                var tx = db.transaction('convs', 'readwrite');
                var store = tx.objectStore('convs');
                var keys = Object.keys(convs);
                for (var i = 0; i < keys.length; i++) {
                    store.put(convs[keys[i]], keys[i]);
                }
            };
            req.onerror = function() {};
        } catch(e) {}
    }

    // 暴露到全局
    window.CloudSync = {
        getSyncCode: getSyncCode,
        setSyncCode: setSyncCode,
        generateCode: generateCode,
        save: saveToCloud,
        load: loadFromCloud,
        del: deleteFromCloud,
        uploadAll: uploadAll,
        downloadAll: downloadAll,
        restoreExtra: restoreExtra
    };

})();
