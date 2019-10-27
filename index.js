const axios = require('axios');
const versionChecker = require('sw-exporter-plugin-version-checker');

module.exports = {
    defaultConfig: {
        enabled: true,
        key: '',
    },
    defaultConfigDetails: {
        key: {
            label: 'API Key',
            type: 'input'
        },
    },
    pluginName: 'RTA',
    pluginDescription: 'Synchronize real-time arena matches data with rtapicks.info.',
    init (proxy, config) {
        const pluginConfig = config.Config.Plugins[this.pluginName];

        versionChecker.proceed({
            name: this.pluginName,
            config: require('./package.json'),
            proxy: proxy
        });

        ['getRtpvpReplayList'].forEach(event => {
            proxy.on(event, (request, response) => {
                if (! pluginConfig.enabled || ! pluginConfig.key) {
                    return;
                }

                proxy.log({
                    name: this.pluginName,
                    source: 'plugin',
                    type: 'debug',
                    message: `Dispatching ${event} to server...`,
                });

                axios[this.getRequestMethod(event)](
                    this.getRequestEndpoint(event, response),
                    {
                        event: response
                    },
                    this.getRequestHeaders(pluginConfig.key)
                ).then(response => {
                    proxy.log({
                        name: this.pluginName,
                        source: 'plugin',
                        type: 'success',
                        message: response.data.message,
                    });
                }).catch(error => {
                    proxy.log({
                        name: this.pluginName,
                        source: 'plugin',
                        type: 'error',
                        message: 'Unable to synchronize data with the server.',
                    });

                    proxy.log({
                        name: this.pluginName,
                        source: 'plugin',
                        type: 'debug',
                        message: JSON.stringify(error.response.data),
                    });
                });
            });
        });
    },
    getRequestMethod (event) {
        return 'post';
    },
    getRequestEndpoint (event, response) {
        return 'https://www.rtapicks.info/api/replays/self';
    },
    getRequestHeaders (key) {
        return {
            headers: {
                Authorization: `Bearer ${key}`
            },
        };
    },
};
