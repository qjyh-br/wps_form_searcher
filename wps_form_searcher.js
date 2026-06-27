// ==UserScript==
// @license      MIT
// @name         签到检查器
// @namespace    https://github.com/qjyh-br/wps_form_searcher
// @version      1.0
// @description  支持带搜索的WPS表单,批量查询,配置保存,导出结果
// @author       qjyh-br
// @match        https://f.wps.cn/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //存储键名
    const STORAGE_KEY = 'wps_checker_config';

    //默认配置
    const DEFAULT_CONFIG = {
        searchList: ['26520'],    // 搜索数组
        checkList: ['张三', '李四', '王五']  // 统计数组
    };

    //从 localStorage 加载配置
    function loadConfig() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const config = JSON.parse(raw);
                // 确保有 searchList 和 checkList
                if (Array.isArray(config.searchList) && Array.isArray(config.checkList)) {
                    return config;
                }
            }
        } catch (e) {}
        // 若无有效配置，保存默认并返回
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
        return DEFAULT_CONFIG;
    }

    //保存配置
    function saveConfig(searchList, checkList) {
        const config = { searchList, checkList };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    // setNativeValue
    function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

        if (valueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter?.call(element, value);
        } else {
            valueSetter?.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //执行搜索并收集结果
    async function performSearch(query) {
        const searchInput = document.querySelector('input.ant-input[placeholder="请搜索"]');
        if (!searchInput) {
            throw new Error('未找到搜索框');
        }

        //聚焦
        searchInput.focus();
        //清空
        setNativeValue(searchInput, '');
        await sleep(300);
        //输入查询
        setNativeValue(searchInput, query);
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        //模拟回车
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
            bubbles: true, cancelable: true
        });
        searchInput.dispatchEvent(enterEvent);
        searchInput.blur();

        // 等待结果加载,看你网络情况
        await sleep(2000);

        //获取所有
        const grids = document.querySelectorAll('div.ksapc-seat-layout-grid');
        const results = [];
        for (const grid of grids) {
            const idEl = grid.querySelector('.ksapc-seat-layout-presetValue');
            const nameEl = grid.querySelector('.ksapc-seat-layout-presetNumberValue');
            if (!idEl || !nameEl) continue;
            const id = idEl.textContent.trim();
            const name = nameEl.textContent.trim();
            const checked = grid.classList.contains('ksapc-seat-layout-grid-active');
            results.push({ id, name, checked });
        }
        return results;
    }

    //导出 CSV
    function downloadCSV(data, filename) {
        if (!data || data.length === 0) {
            alert('没有数据可导出');
            return;
        }
        const header = '学号,姓名,签到状态\n';
        const rows = data.map(item => {
            const status = item.checked ? '已签到' : '未签到';
            return `${item.id},${item.name},${status}`;
        }).join('\n');
        const csv = header + rows;
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); //加BOM处理中文
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename || '签到数据.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    //悬浮窗
    let panel = null;
    let showBtn = null;

    function createFloatingPanel() {
        if (panel) return panel;

        panel = document.createElement('div');
        panel.id = 'my-check-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 420px;
            max-height: 80vh;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            padding: 16px;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: auto;
            display: flex;
            flex-direction: column;
        `;
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="font-size: 15px;">📋 签到检查器</strong>
                <button id="close-panel-btn" style="background: none; border: none; cursor: pointer; font-size: 18px;">✕</button>
            </div>
            <div style="font-size: 13px; margin-bottom: 8px; color: #555;">
                <label>搜索列表（每行一项，如学号前缀或姓名）</label>
                <textarea id="search-list-input" rows="3" style="width:100%; padding:4px; font-size:13px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>
            </div>
            <div style="font-size: 13px; margin-bottom: 8px; color: #555;">
                <label>统计名单（每行一个姓名）</label>
                <textarea id="check-list-input" rows="3" style="width:100%; padding:4px; font-size:13px; border:1px solid #ccc; border-radius:4px; resize:vertical;"></textarea>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                <button id="save-config-btn" style="background: #52c41a; color:#fff; border:none; border-radius:4px; padding:4px 12px; cursor:pointer;">保存设置</button>
                <button id="start-check-btn" style="background: #1890ff; color:#fff; border:none; border-radius:4px; padding:4px 12px; cursor:pointer;">开始检查</button>
                <button id="export-all-btn" style="background: #faad14; color:#fff; border:none; border-radius:4px; padding:4px 12px; cursor:pointer;">导出全部</button>
                <button id="export-filtered-btn" style="background: #eb2f96; color:#fff; border:none; border-radius:4px; padding:4px 12px; cursor:pointer;">导出统计</button>
            </div>
            <div id="status-msg" style="font-size:13px; color:#333; margin-bottom:6px; min-height:20px;"></div>
            <div id="result-area" style="font-size:13px; max-height:300px; overflow-y:auto; border-top:1px solid #eee; padding-top:6px; display:none;"></div>
        `;
        document.body.appendChild(panel);

        //事件绑定
        const config = loadConfig();
        document.getElementById('search-list-input').value = config.searchList.join('\n');
        document.getElementById('check-list-input').value = config.checkList.join('\n');

        //关闭
        document.getElementById('close-panel-btn').addEventListener('click', () => {
            panel.style.display = 'none';
            showShowButton();
        });

        //保存设置
        document.getElementById('save-config-btn').addEventListener('click', () => {
            const searchText = document.getElementById('search-list-input').value;
            const checkText = document.getElementById('check-list-input').value;
            const searchList = searchText.split('\n').map(s => s.trim()).filter(s => s);
            const checkList = checkText.split('\n').map(s => s.trim()).filter(s => s);
            saveConfig(searchList, checkList);
            document.getElementById('status-msg').textContent = '配置已保存';
        });

        //开始检查
        document.getElementById('start-check-btn').addEventListener('click', startCheck);

        //导出全部
        document.getElementById('export-all-btn').addEventListener('click', () => {
            if (window._allResults && window._allResults.length > 0) {
                downloadCSV(window._allResults, '全部搜索结果.csv');
            } else {
                alert('请先执行检查');
            }
        });

        //导出统计
        document.getElementById('export-filtered-btn').addEventListener('click', () => {
            if (window._filteredResults && window._filteredResults.length > 0) {
                downloadCSV(window._filteredResults, '统计名单签到.csv');
            } else {
                alert('请先执行检查');
            }
        });

        return panel;
    }

    function showShowButton() {
        if (showBtn) return;
        showBtn = document.createElement('div');
        showBtn.id = 'show-panel-btn';
        showBtn.textContent = '📋 显示检查器';
        showBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1890ff;
            color: #fff;
            border: none;
            border-radius: 20px;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            z-index: 9998;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;
        document.body.appendChild(showBtn);
        showBtn.addEventListener('click', () => {
            showBtn.remove();
            showBtn = null;
            if (panel) {
                panel.style.display = 'flex';
            } else {
                createFloatingPanel();
            }
        });
    }

    //核心检查函数
    async function startCheck() {
        const startBtn = document.getElementById('start-check-btn');
        const statusMsg = document.getElementById('status-msg');
        const resultArea = document.getElementById('result-area');
        if (!startBtn || !statusMsg || !resultArea) return;

        //先保存当前设置
        const searchText = document.getElementById('search-list-input').value;
        const checkText = document.getElementById('check-list-input').value;
        const searchList = searchText.split('\n').map(s => s.trim()).filter(s => s);
        const checkList = checkText.split('\n').map(s => s.trim()).filter(s => s);
        if (searchList.length === 0) {
            statusMsg.textContent = '⚠️ 搜索列表不能为空';
            return;
        }
        if (checkList.length === 0) {
            statusMsg.textContent = '⚠️ 统计名单不能为空';
            return;
        }
        saveConfig(searchList, checkList);

        //禁用按钮
        startBtn.disabled = true;
        startBtn.textContent = '检查中...';
        statusMsg.textContent = '⏳ 正在搜索...';
        resultArea.style.display = 'block';
        resultArea.innerHTML = '';

        //收集所有结果
        const allResultsMap = new Map(); //key:学号,value:{id,name,checked}
        let totalSearches = searchList.length;
        let completed = 0;

        for (const query of searchList) {
            statusMsg.textContent = `⏳ 正在搜索 "${query}" (${completed+1}/${totalSearches})...`;
            try {
                const results = await performSearch(query);
                for (const item of results) {
                    if (!allResultsMap.has(item.id)) {
                        allResultsMap.set(item.id, item);
                    } else {
                        // 如果已存在,保留checked为true的.去重
                        const existing = allResultsMap.get(item.id);
                        if (item.checked && !existing.checked) {
                            existing.checked = true;
                        }
                    }
                }
                completed++;
            } catch (e) {
                statusMsg.textContent = `❌ 搜索 "${query}" 失败: ${e.message}`;
                startBtn.disabled = false;
                startBtn.textContent = '开始检查';
                return;
            }
        }

        //转换为数组
        const allResults = Array.from(allResultsMap.values());
        window._allResults = allResults; //存为全局供导出

        //建立姓名->签到状态的映射
        const nameStatusMap = {};
        for (const item of allResults) {
            nameStatusMap[item.name] = item.checked;
        }

        //根据统计名单过滤
        const filtered = [];
        for (const name of checkList) {
            const checked = nameStatusMap.hasOwnProperty(name) ? nameStatusMap[name] : null;
            filtered.push({
                id: checked !== null ? allResults.find(item => item.name === name)?.id || '' : '',
                name: name,
                checked: checked
            });
        }
        window._filteredResults = filtered;

        //显示统计结果
        let html = '<div style="font-weight:bold; margin-bottom:4px;">📊 统计名单签到状态</div>';
        filtered.forEach(item => {
            let statusText, color;
            if (item.checked === null) {
                statusText = '❓ 未搜索到';
                color = '#999';
            } else if (item.checked) {
                statusText = '✅ 已签到';
                color = '#52c41a';
            } else {
                statusText = '❌ 未签到';
                color = '#ff4d4f';
            }
            html += `<div style="display:flex; justify-content:space-between; padding:2px 0; border-bottom:1px solid #f0f0f0;">
                        <span>${item.name}</span>
                        <span style="color:${color};">${statusText}</span>
                    </div>`;
        });
        html += `<div style="margin-top:6px; font-size:12px; color:#888;">共搜索到 ${allResults.length} 条记录，统计 ${filtered.length} 人</div>`;
        resultArea.innerHTML = html;

        statusMsg.textContent = '✅ 检查完成';
        startBtn.disabled = false;
        startBtn.textContent = '重新检查';

        //控制台输出
        console.log('全部搜索结果:', allResults);
        console.log('统计结果:', filtered);
    }

    //init()
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createFloatingPanel();
            });
        } else {
            createFloatingPanel();
        }
    }

    init();
})();