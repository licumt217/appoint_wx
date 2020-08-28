
const businessSchedule=require('../schedule/business')
const wechatSchedule=require('../schedule/wechat')
module.exports = [{
    cron:'1 1 * * * *',
    immediate: false,
    handle: () => {
        wechatSchedule();
        businessSchedule()
    },

}]