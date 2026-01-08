// Multiplugin v4 — с исправленным сохранением description в changelog

(function () {
    'use strict';

    const syncUrl = 'https://dl.dropboxusercontent.com/scl/fi/1iqq9u75lsjta1h8q3o8f/plugins_list.js?rlkey=jhttw50k2zxx76nygh3ua16ac&st=n99lsokd';

    const STORAGE_KEY = 'multi_plugins_list';
    const ENABLED_KEY = 'multi_enabled_plugins';
    const INFO_KEY = 'multi_last_update';

    let pluginList = [];

    function loadEnabledPlugins() {
        const enabled = new Set(Lampa.Storage.get(ENABLED_KEY, []));

        const urls = pluginList
            .filter(p => enabled.has(p.url))
            .map(p => p.url);

        if (urls.length === 0) return;

        Lampa.Utils.putScriptAsync(urls, () => {}, () => {}, false);
    }

    function savePluginList(list) {
        Lampa.Storage.set(STORAGE_KEY, list);
        pluginList = list;
    }

    function getPluginList() {
        return Lampa.Storage.get(STORAGE_KEY, []);
    }

    function saveUpdateInfo(date, added, removed) {
        const info = {
            date: date || '—',
            added: added || [],
            removed: removed || []
        };
        Lampa.Storage.set(INFO_KEY, info, true);
    }

    function getUpdateInfo() {
        return Lampa.Storage.get(INFO_KEY, { date: '—', added: [], removed: [] });
    }

    function showInfo() {
        const info = getUpdateInfo();

        let html = '<div class="about" style="text-align:left">';
        html += `<div><b>Последнее обновление:</b> ${info.date}</div><br>`;

        if (info.added.length) {
            html += '<b>Добавлено:</b><br>';
            info.added.forEach(p => {
                const name = p.name || p.url.split('/').pop();
                html += '• <b>' + name + '</b><br>';
                if (p.description) {
                    html += '<div style="color:#bfbfbf; font-size:0.9em; margin-left:18px;">' + p.description + '</div>';
                }
                html += '<br>';
            });
            html += '<br>';
        }

        if (info.removed.length) {
            html += '<b>Удалено:</b><br>';
            info.removed.forEach(p => {
                const name = p.name || p.url.split('/').pop();
                html += '• <b>' + name + '</b><br>';
                if (p.description) {
                    html += '<div style="color:#bfbfbf; font-size:0.9em; margin-left:18px;">' + p.description + '</div>';
                }
                html += '<br>';
            });
            html += '<br>';
        }

        if (!info.added.length && !info.removed.length) {
            html += '<div>Новых изменений нет</div>';
        }

        html += '</div>';

        const prev = Lampa.Controller.enabled().name;

        Lampa.Modal.open({
            title: 'Информация об обновлении',
            align: 'center',
            html: $(html),
            buttons: [{
                name: 'OK',
                onSelect: function () {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle(prev);
                }
            }]
        });
    }

    function showCategory(category) {
        const plugins = pluginList.filter(p => (p.category || 'Разное') === category);

        if (plugins.length === 0) {
            Lampa.Noty.show(`В категории "${category}" нет плагинов`);
            return;
        }

        const enabled = new Set(Lampa.Storage.get(ENABLED_KEY, []));

        const items = plugins.map(p => ({
            title: p.name || p.url.split('/').pop(),
            subtitle: p.description || '',
            checkbox: true,
            checked: enabled.has(p.url),
            url: p.url
        }));

        Lampa.Select.show({
            title: category,
            items: items,
            onCheck: function (item) {
                const enabledSet = new Set(Lampa.Storage.get(ENABLED_KEY, []));

                if (item.checked) {
                    enabledSet.add(item.url);
                    Lampa.Noty.show(item.title + ' включён');
                } else {
                    enabledSet.delete(item.url);
                    Lampa.Noty.show(item.title + ' отключён');
                }

                Lampa.Storage.set(ENABLED_KEY, Array.from(enabledSet));
            },
            onBack: function () {
                Lampa.Controller.toggle('settings_component');
            }
        });
    }

    function showEnabledPlugins() {
        const enabled = new Set(Lampa.Storage.get(ENABLED_KEY, []));

        const active = pluginList.filter(p => enabled.has(p.url));

        if (active.length === 0) {
            Lampa.Noty.show('Включённых плагинов нет');
            return;
        }

        const items = active.map(p => ({
            title: p.name || p.url.split('/').pop(),
            subtitle: p.description || '',
            checkbox: true,
            checked: true,
            url: p.url
        }));

        Lampa.Select.show({
            title: 'Текущие плагины',
            items: items,
            onCheck: function (item) {
                if (!item.checked) {
                    const enabledSet = new Set(Lampa.Storage.get(ENABLED_KEY, []));
                    enabledSet.delete(item.url);
                    Lampa.Storage.set(ENABLED_KEY, Array.from(enabledSet));
                    Lampa.Noty.show(item.title + ' отключён');
                }
            },
            onBack: function () {
                Lampa.Controller.toggle('settings_component');
            }
        });
    }

    function disableAllPlugins() {
        const prev = Lampa.Controller.enabled().name;

        Lampa.Modal.open({
            title: 'Выключить все',
            align: 'center',
            html: $('<div class="about">Вы уверены? Все плагины будут отключены</div>'),
            buttons: [
                {
                    name: 'Отмена',
                    onSelect: function () {
                        Lampa.Modal.close();
                        Lampa.Controller.toggle(prev);
                    }
                },
                {
                    name: 'Выключить',
                    onSelect: function () {
                        Lampa.Storage.set(ENABLED_KEY, []);
                        Lampa.Noty.show('Все плагины отключены');
                        Lampa.Modal.close();
                        Lampa.Controller.toggle(prev);
                    }
                }
            ]
        });
    }

    function exportToLampa() {
        const prev = Lampa.Controller.enabled().name;

        Lampa.Modal.open({
            title: 'Экспорт плагинов',
            align: 'center',
            html: $('<div class="about">Включённые плагины будут добавлены в Lampa как обычные расширения.<br><br>После этого они:<br>• не будут зависеть от мультиплагина<br>• останутся даже после его удаления<br>• удаляются только вручную<br><br>После экспорта Lampa автоматически перезагрузится.</div>'),
            buttons: [
                {
                    name: 'Отмена',
                    onSelect: function () {
                        Lampa.Modal.close();
                        Lampa.Controller.toggle(prev);
                    }
                },
                {
                    name: 'OK',
                    onSelect: function () {
                        Lampa.Modal.close();

                        const enabledUrls = Lampa.Storage.get(ENABLED_KEY, []);
                        const installed = Lampa.Plugins.get() || [];

                        let added = 0;

                        enabledUrls.forEach(url => {
                            const plugin = pluginList.find(p => p.url === url);
                            if (!plugin) return;

                            const exists = installed.find(p => p.url === plugin.url);
                            if (exists) return;

                            Lampa.Plugins.add({
                                url: plugin.url,
                                status: 1,
                                name: plugin.name || plugin.url.split('/').pop()
                            });

                            added++;
                        });

                        if (added > 0) {
                            Lampa.Plugins.save();
                        }

                        window.location.reload();
                    }
                }
            ]
        });
    }

    function confirmAndSync() {
        const prev = Lampa.Controller.enabled().name;

        Lampa.Modal.open({
            title: 'Синхронизация',
            align: 'center',
            html: $('<div class="about">Синхронизировать актуальные плагины с облака?</div>'),
            buttons: [
                {
                    name: 'Отмена',
                    onSelect: function () {
                        Lampa.Modal.close();
                        Lampa.Controller.toggle(prev);
                    }
                },
                {
                    name: 'OK',
                    onSelect: function () {
                        Lampa.Modal.close();
                        synchronize(() => Lampa.Controller.toggle(prev));
                    }
                }
            ]
        });
    }

    function confirmAndLoadOnline() {
        const prev = Lampa.Controller.enabled().name;

        Lampa.Modal.open({
            title: 'Онлайн-плагины',
            align: 'center',
            html: $('<div class="about">Загрузить и включить только плагины категории "Онлайн"?</div>'),
            buttons: [
                {
                    name: 'Отмена',
                    onSelect: function () {
                        Lampa.Modal.close();
                        Lampa.Controller.toggle(prev);
                    }
                },
                {
                    name: 'OK',
                    onSelect: function () {
                        Lampa.Modal.close();
                        loadOnlyOnline(() => Lampa.Controller.toggle(prev));
                    }
                }
            ]
        });
    }

    function loadOnlyOnline(callback = () => {}) {
        Lampa.Loading.start();

        fetch(syncUrl, { cache: 'no-cache' })
            .then(response => response.text())
            .then(text => {
                const listMatch = text.match(/const\s+remotePlugins\s*=\s*(\[[\s\S]*?\])/);
                if (listMatch && listMatch[1]) {
                    const remoteObjects = eval('(' + listMatch[1] + ')');
                    const newList = remoteObjects.map(item => ({
                        url: item.url,
                        name: item.name || item.url.split('/').pop(),
                        description: typeof item.description === 'string' ? item.description : '',
                        category: item.category || 'Разное'
                    }));

                    savePluginList(newList);

                    const enabledSet = new Set(Lampa.Storage.get(ENABLED_KEY, []));
                    newList
                        .filter(p => p.category === 'Онлайн')
                        .forEach(p => enabledSet.add(p.url));

                    Lampa.Storage.set(ENABLED_KEY, Array.from(enabledSet));

                    Lampa.Noty.show('Онлайн-плагины включены');
                }
            })
            .catch(() => {
                Lampa.Noty.show('Ошибка загрузки');
            })
            .finally(() => {
                Lampa.Loading.stop();
                callback();
            });
    }

    function synchronize(callback = () => {}) {
        Lampa.Loading.start();

        fetch(syncUrl, { cache: 'no-cache' })
            .then(response => response.text())
            .then(text => {
                const dateMatch = text.match(/const\s+updateDate\s*=\s*['"]([^'"]+)['"]/);
                const listMatch = text.match(/const\s+remotePlugins\s*=\s*(\[[\s\S]*?\])/);

                if (listMatch && listMatch[1]) {
                    const remoteObjects = eval('(' + listMatch[1] + ')');
                    const newList = remoteObjects.map(item => ({
                        url: item.url,
                        name: item.name || item.url.split('/').pop(),
                        description: typeof item.description === 'string' ? item.description : '',
                        category: item.category || 'Разное'
                    }));

                    const prevList = getPluginList();
                    const prevUrls = prevList.map(p => p.url);
                    const newUrls = newList.map(p => p.url);

                    const added = newUrls.filter(x => !prevUrls.includes(x));
                    const removed = prevUrls.filter(x => !newUrls.includes(x));

                    savePluginList(newList);

                    const oldEnabled = new Set(Lampa.Storage.get(ENABLED_KEY, []));
                    const validEnabled = prevUrls.filter(u => oldEnabled.has(u) && newUrls.includes(u));
                    Lampa.Storage.set(ENABLED_KEY, validEnabled);

                    Lampa.Noty.show('Синхронизация завершена');
                }
            })
            .catch(() => {
                Lampa.Noty.show('Ошибка синхронизации');
            })
            .finally(() => {
                Lampa.Loading.stop();
                callback();
            });
    }

    function checkUpdatesOnStart() {
        fetch(syncUrl, { cache: 'no-cache' })
            .then(r => r.text())
            .then(text => {
                const dateMatch = text.match(/const\s+updateDate\s*=\s*['"]([^'"]+)['"]/);
                const listMatch = text.match(/const\s+remotePlugins\s*=\s*(\[[\s\S]*?\])/);

                if (!dateMatch || !listMatch) return;

                const remoteDate = dateMatch[1];
                const currentInfo = Lampa.Storage.get(INFO_KEY, null);
                if (currentInfo && currentInfo.date === remoteDate) return;

                const remoteObjects = eval('(' + listMatch[1] + ')');
                const remoteList = remoteObjects.map(item => ({
                    url: item.url,
                    name: item.name || item.url.split('/').pop(),
                    description: typeof item.description === 'string' ? item.description : ''
                }));

                const localList = getPluginList();
                const localUrls = localList.map(p => p.url);
                const remoteUrls = remoteList.map(p => p.url);

                const added = remoteList
                    .filter(p => !localUrls.includes(p.url))
                    .map(p => ({
                        url: p.url,
                        name: p.name,
                        description: p.description
                    }));

                const removed = localList
                    .filter(p => !remoteUrls.includes(p.url))
                    .map(p => ({
                        url: p.url,
                        name: p.name || p.url.split('/').pop(),
                        description: p.description || ''
                    }));

                saveUpdateInfo(remoteDate, added, removed);
            })
            .catch(() => {});
    }

    function addCategoryButtons() {
        const categories = [...new Set(pluginList.map(p => p.category || 'Разное'))].sort();

        categories.forEach(cat => {
            Lampa.SettingsApi.addParam({
                component: 'multi_plugin',
                param: { type: 'button' },
                field: { name: cat },
                onChange: () => showCategory(cat)
            });
        });
    }

    Lampa.SettingsApi.addComponent({
        component: 'multi_plugin',
        icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#fff" stroke-width="2"/><rect x="8" y="8" width="8" height="8" rx="1" stroke="#fff" stroke-width="2"/></svg>',
        name: 'Мультиплагин'
    });

    Lampa.SettingsApi.addParam({
        component: 'multi_plugin',
        param: { type: 'button' },
        field: { name: 'Обновлено: ' + getUpdateInfo().date },
        onChange: showInfo
    });

    Lampa.SettingsApi.addParam({
        component: 'multi_plugin',
        param: { type: 'button' },
        field: { name: 'Синхронизировать плагины' },
        onChange: confirmAndSync
    });

    Lampa.SettingsApi.addParam({
        component: 'multi_plugin',
        param: { type: 'button' },
        field: { name: 'Загрузить только онлайн' },
        onChange: confirmAndLoadOnline
    });

    Lampa.SettingsApi.addParam({
        component: 'multi_plugin',
        param: { type: 'title' },
        field: { name: 'Управление' }
    });

    Lampa.SettingsApi.addParam({
        component: 'multi_plugin',
        param: { type: 'button' },
        field: { name: 'Текущие плагины' },
        onChange: showEnabledPlugins
    });

    Lampa.SettingsApi.addParam({
        component: 'multi_plugin',
        param: { type: 'button' },
        field: { name: 'Экспорт плагинов в Lampa' },
        onChange: exportToLampa
    });

    Lampa.SettingsApi.addParam({
        component: 'multi_plugin',
        param: { type: 'button' },
        field: { name: 'Выключить все плагины' },
        onChange: disableAllPlugins
    });

    Lampa.SettingsApi.addParam({
        component: 'multi_plugin',
        param: { type: 'button' },
        field: { name: 'Перезагрузить Lampa' },
        onChange: function () {
            const prev = Lampa.Controller.enabled().name;

            Lampa.Modal.open({
                title: 'Перезагрузка',
                align: 'center',
                html: $('<div class="about">Перезапустить приложение?</div>'),
                buttons: [
                    {
                        name: 'Отмена',
                        onSelect: function () {
                            Lampa.Modal.close();
                            Lampa.Controller.toggle(prev);
                        }
                    },
                    {
                        name: 'OK',
                        onSelect: function () {
                            Lampa.Modal.close();
                            window.location.reload();
                        }
                    }
                ]
            });
        }
    });

    Lampa.SettingsApi.addParam({
        component: 'multi_plugin',
        param: { type: 'title' },
        field: { name: 'Категории плагинов' }
    });

    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') {
            pluginList = getPluginList();

            checkUpdatesOnStart();

            if (pluginList.length === 0) {
                synchronize();
            } else {
                loadEnabledPlugins();
                addCategoryButtons();
            }
        }
    });

    console.log('Мультиплагин v4');

})();
