const WechatUtil = require('../util/WechatUtil')
const DateUtil = require('../util/DateUtil')
const logger = think.logger

module.exports = {


    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async sendTemplateMsg(openid, url) {

        let top = {
            value: '你好，我是头部',
            color: '#FFFABC'
        }
        let bottom = {
            value: '我是底部',
            color: '#EEDDAA'
        }
        let templateName='appoint_audit'

        let dataArray=[{
            value: '李强',
        }, {
            value: '18601965856',
            color: '#FFEACD'

        }, {
            value: DateUtil.getNowStr()

        }, {
            value: '看病',

        }, {
            value: '备注'
        }]


        logger.info(`发送模板消息参数 openid:${openid}, templateName:${templateName}, dataArray:${dataArray}, url:${url}, top:${top}, bottom:${bottom},`)

        await WechatUtil.sendTemplateMsg(openid, templateName, dataArray, url, top, bottom).catch(e => {
            logger.info(e);
            throw new Error(e)
        });


    },


};
