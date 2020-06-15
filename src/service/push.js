const WechatUtil = require('../util/WechatUtil')
const DateUtil = require('../util/DateUtil')
const WechatTemplates = require("../config/WechatTemplates")
const logger = think.logger

module.exports = {


    /**
     * 用户提交预约后，给咨询师发推送进行审核
     * @param openid
     * @param url
     * 访客姓名：{{keyword1.DATA}}
     *访客电话：{{keyword2.DATA}}
     *来访时间：{{keyword3.DATA}}
     *事由：{{keyword4.DATA}}
     *备注：{{keyword5.DATA}}
     * @returns {Promise<void>}
     */
    async sendAppointmentAuditTemplate(openid, url, obj) {
        let dataArray = [{
            value: obj.name,
        }, {
            value: obj.phone
        }, {
            value: obj.date
        }, {
            value: obj.content,
        }, {
            value: obj.remark||''
        }]


        logger.info(`用户提交预约后，给咨询师发推送进行审核参数 openid:${openid}, dataArray:${dataArray}, url:${url}`)

        await WechatUtil.sendTemplateMsg(openid, WechatTemplates.APPOINTMENT_AUDIT,url, dataArray ).catch(e => {
            logger.info(e);
            throw new Error(e)
        });


    },

    /**
     * 咨询师审批通过后，推送告知用户
     * @param openid
     * @param url
     * @param obj
     * @returns {Promise<void>}
     */
    async sendAppointmentSuccess(openid, url, obj) {
        let dataArray = [{
            value: obj.content,
        }, {
            value: obj.date
        }, {
            value: obj.address
        }]


        logger.info(`咨询师审批通过后，推送告知用户参数 openid:${openid}, dataArray:${dataArray}, url:${url}`)

        await WechatUtil.sendTemplateMsg(openid, WechatTemplates.APPOINTMENT_SUCCESS,url, dataArray ).catch(e => {
            logger.info(e);
            throw new Error(e)
        });


    },

    /**
     * 咨询师审批拒绝后，推送告知用户
     * @param openid
     * @param url
     * @param obj
     * @returns {Promise<void>}
     */
    async sendAppointmentReject(openid, url, obj) {
        let dataArray = [ {
            value: obj.result||`已拒绝`
        }, {
            value: obj.content||`心理咨询`
        },{
            value: obj.date,
        },{
            value: obj.personCount||1,
        }]


        logger.info(`咨询师审批拒绝后，推送告知用户参数 openid:${openid}, dataArray:${dataArray}, url:${url}`)

        await WechatUtil.sendTemplateMsg(openid, WechatTemplates.APPOINTMENT_REJECT,url, dataArray ).catch(e => {
            logger.info(e);
            throw new Error(e)
        });


    },


};
