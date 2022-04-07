import { defineConfig } from 'umi';

export default defineConfig({
    publicPath: '/mfe/h5/',
    outputPath: '../mfe/h5',
    nodeModulesTransform: {
        type: 'none',
    },
    // https://umijs.org/zh-CN/plugins/plugin-locale
    locale: {
        // default zh-CN
        default: 'zh_CN',
        antd: true,
        // default true, when it is true, will use `navigator.language` overwrite default
        baseNavigator: true,
        baseSeparator: '_',
    },
    routes: [{
        // path: '/', component: '@/pages/index'
        path: '/',
        redirect: '/main',
    }, {
        path: '/login',
        name: 'login',
        component: '@/pages/esh/login',
        layout: false,
    }, {
        path: '/main',
        name: 'EHSHome',
        layout: false,
        // access: 'ESH_VIEW',
        // component: '@/pages/esh/main',
    }],
    alias: {
        component: '@/eshcommon/component',
    },
    fastRefresh: {},
    qiankun: {
        slave: {}
    }
});
