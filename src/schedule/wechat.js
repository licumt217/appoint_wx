
const wechatSettingService =  require('../service/wechatSetting');

const logger = think.logger


const  scheduleCronstyle = async ()=>{
        logger.info(`微信相关定时任务开始执行：`)
        await realSchedule();
}



/**
 * 定时删除数据库中的access_token和jsApiTicket
 * @returns {Promise<void>}
 */
const realSchedule=async ()=>{

    logger.info(`定时删除数据库中的access_token和jsApiTicket`)

    await wechatSettingService.removeAccessToken();
    await wechatSettingService.removeJsApiTicket()

}

module.exports=scheduleCronstyle;