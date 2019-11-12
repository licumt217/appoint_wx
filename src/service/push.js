const WechatUtil = require('../util/WechatUtil')
const logger =think.logger

module.exports =  {


    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async sendTemplateMsg(openid,templateName,dataArray,url,top,bottom){

        try{

            logger.info(`发送模板消息参数 openid:${openid}, templateName:${templateName}, dataArray:${dataArray}, url:${url}, top:${top}, bottom:${bottom},`)

            await WechatUtil.sendTemplateMsg(openid,templateName,dataArray,url,top,bottom);

        }catch (e) {
            let msg=`发送模板消息接口异常 msg:${e}`
            logger.info(msg);
            throw Error(msg)
        }



    },


};
