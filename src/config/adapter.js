const fileCache = require('think-cache-file');
const nunjucks = require('think-view-nunjucks');
const fileSession = require('think-session-file');
const mysql = require('think-model-mysql');
const { Console, File, DateFile } = require('think-logger3');
const path = require('path');
const isDev = think.env === 'development';
const { Basic } = require('think-logger3');

/**
 * cache adapter config
 * @type {Object}
 */
exports.cache = {
    type: 'file',
    common: {
        timeout: 24 * 60 * 60 * 1000 // millisecond
    },
    file: {
        handle: fileCache,
        cachePath: path.join(think.ROOT_PATH, 'runtime/cache'), // absoulte path is necessarily required
        pathDepth: 1,
        gcInterval: 24 * 60 * 60 * 1000 // gc interval
    }
};

/**
 * model adapter config
 * @type {Object}
 */
exports.model = {
    type: 'mysql',
    common: {
        logConnect: isDev,
        logSql: true,
        logger: msg => think.logger.info(msg)
    },
    mysql: {
        handle: mysql,
        database: 'appoint',
        prefix: 'appoint_',
        encoding: 'utf8',
        host: '47.108.78.245',
        port: '3307',
        user: 'root',
        password: 'y2pe2NF7',
        dateStrings: true
    }
};

/**
 * session adapter config
 * @type {Object}
 */
exports.session = {
    type: 'file',
    common: {
        cookie: {
            name: 'thinkjs'
            // keys: ['werwer', 'werwer'],
            // signed: true
        }
    },
    file: {
        handle: fileSession,
        sessionPath: path.join(think.ROOT_PATH, 'runtime/session')
    }
};

/**
 * view adapter config
 * @type {Object}
 */
exports.view = {
    type: 'nunjucks',
    common: {
        viewPath: path.join(think.ROOT_PATH, 'view'),
        sep: '_',
        extname: '.html'
    },
    nunjucks: {
        handle: nunjucks
    }
};

/**
 * logger adapter config
 * @type {Object}
 */
exports.logger = {
    // type: isDev ? 'console' : 'dateFile',
    // console: {
    //     handle: Console
    // },
    // file: {
    //     handle: File,
    //     backups: 10, // max chunk number
    //     absolute: true,
    //     maxLogSize: 50 * 1024, // 50M
    //     filename: path.join(think.ROOT_PATH, 'logs/app.log')
    // },
    // dateFile: {
    //     handle: DateFile,
    //     level: 'ALL',
    //     absolute: true,
    //     pattern: '-yyyy-MM-dd',
    //     alwaysIncludePattern: false,
    //     filename: path.join(think.ROOT_PATH, 'logs/app.log')
    // },


    type: isDev ? 'console' : 'advanced',
    console: {
        handle: Console
    },
    advanced: {
        handle: Basic,
        appenders: {
            everything: {
                type: 'dateFile',
                pattern: 'yyyy-MM-dd',
                filename: path.join(think.ROOT_PATH, 'logs/app.log')
            },
            emergencies: {
                type: 'dateFile',
                pattern: 'yyyy-MM-dd',
                filename: path.join(think.ROOT_PATH, 'logs/app-error.log')
            },
            'just-errors': {
                type: 'logLevelFilter',
                appender: 'emergencies',
                level: 'error'
            }
        },
        categories: {
            default: {
                appenders: ['just-errors', 'everything'],
                level: 'debug'
            }
        }
    }


};
