const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Util = require('../../util/Util')
const ORDER_STATE =require('../../config/ORDER_STATE')

const logger =think.logger;

module.exports = class extends Base {

    /**
     * 发送模板消息
     * @param openId
     * @param templateName 根据模板名称获取对应的模板ID
     * @param dataArray 模板的数据数组，数组中是对象，每个对象有value和color两个属性，color可以没有，没有的话用系统默认
     * @param url 可以为空，空的话不跳转
     * @param top 顶部提示文字
     * @param bottom 底部提示文字
     * @returns {Promise<any>}
     */
    async sendTemplateMsgAction(){

        let openId=this.post("openId")
        let templateName=this.post("templateName")
        let dataArray=this.post("dataArray")
        let url=this.post("url")
        let top=this.post("top")
        let bottom=this.post("bottom")

        let data= await WechatUtil.sendTemplateMsg(openId,templateName,dataArray,url,top,bottom);

        this.body=data;

    }

};
