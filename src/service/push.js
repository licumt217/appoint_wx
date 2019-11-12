const WechatUtil = require('../util/WechatUtil')
const DateUtil = require('../util/DateUtil')
const logger = think.logger

module.exports = {


    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async sendTemplateMsg(openid, templateName, dataArray, url, top, bottom) {


        logger.info(`发送模板消息参数 openid:${openid}, templateName:${templateName}, dataArray:${dataArray}, url:${url}, top:${top}, bottom:${bottom},`)

        await WechatUtil.sendTemplateMsg(openid, templateName, dataArray, url, top, bottom).catch(e => {
            logger.info(e);
            throw new Error(e)
        });


    },


};
