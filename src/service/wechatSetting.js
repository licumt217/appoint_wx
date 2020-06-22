const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatConfig = require("../config/WechatConfig")
const logger = think.logger
const tableName = 'wechat_setting'
const request = require('request')

module.exports = {


    /**
     * 获取微信access_token
     * @returns {Promise<void>}
     */
    async getAccessToken() {

        try {

            let token=await think.model(tableName).where({
                type:'access_token'
            }).find().catch(e => {
                throw new Error(e)
            })

            logger.info(`数据库返回access_token:${JSON.stringify(token)}`)

            if(Util.isEmptyObject(token)){
                let access_token=await this.realGetAccessToken()

                await think.model(tableName).add({
                    content:access_token,
                    op_date:DateUtil.getNowStr(),
                    type:'access_token'
                }).catch(e => {
                    throw new Error(e)
                })
                return access_token;

            }else{

                if(token.content){

                    return token.content
                }else{
                    let access_token=await this.realGetAccessToken()

                    await think.model(tableName).where({

                        type:'access_token'
                    }).update({
                        content:access_token,
                        op_date:DateUtil.getNowStr(),
                    }).catch(e => {
                        throw new Error(e)
                    })
                    return access_token;
                }
            }

        } catch (e) {
            let msg = `获取微信access_token异常 msg:${e}`
            let returnMsg = `获取微信access_token接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },



    /**
     * 从数据库删除微信access_token
     * 每小时定时任务自动执行
     * @returns {Promise<void>}
     */
    async removeAccessToken() {

        try {

            await think.model(tableName).where({
                type:'access_token'
            }).delete().catch(e => {
                throw new Error(e)
            })

        } catch (e) {
            let msg = `从数据库删除微信access_token异常 msg:${e}`
            let returnMsg = `从数据库删除微信access_token接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

    /**
     * 通过数据库获取jsApi
     * @returns {Promise<void>}
     */
    async getJsApiTicket() {

        try {

            let token=await think.model(tableName).where({
                type:'jsApiTicket'
            }).find().catch(e => {
                throw new Error(e)
            })

            logger.info(`数据库返回jsApiTicket:${JSON.stringify(token)}`)

            if(Util.isEmptyObject(token)){
                let jsApiTicket=await this.realGetJsapiTicket()

                await think.model(tableName).add({
                    content:jsApiTicket,
                    op_date:DateUtil.getNowStr(),
                    type:'jsApiTicket'
                }).catch(e => {
                    throw new Error(e)
                })
                return jsApiTicket;

            }else{

                if(token.content){

                    return token.content
                }else{
                    let jsApiTicket=await this.realGetJsapiTicket()

                    await think.model(tableName).where({

                        type:'jsApiTicket'
                    }).update({
                        content:jsApiTicket,
                        op_date:DateUtil.getNowStr(),
                    }).catch(e => {
                        throw new Error(e)
                    })
                    return jsApiTicket;
                }
            }

        } catch (e) {
            let msg = `获取微信access_token异常 msg:${e}`
            let returnMsg = `获取微信access_token接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

    /**
     * 从数据库删除微信jsApiTicket
     * 每小时定时任务自动执行
     * @returns {Promise<void>}
     */
    async removeJsApiTicket() {

        try {

            await think.model(tableName).where({
                type:'jsApiTicket'
            }).delete().catch(e => {
                throw new Error(e)
            })

        } catch (e) {
            let msg = `从数据库删除微信jsApiTicket异常 msg:${e}`
            let returnMsg = `从数据库删除微信jsApiTicket接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },


    /**
     * 获取token
     * 基础支持的token
     * @returns {Promise<any>}
     */
    realGetAccessToken ()  {

        return new Promise(((resolve, reject) => {
            request.get(`${WechatConfig.URL_OF_GET_ACCESS_TOKEN}?grant_type=client_credential&appid=${WechatConfig.APP_ID}&secret=${WechatConfig.SECRET}`, (error, response, body) => {
                logger.info(`微信获取token返回信息 error:${error}， body:${body}， response:${response}`);
                if (error) {
                    logger.info(`微信获取token接口错误 error:${error}`);
                    resolve(null)
                } else {

                    resolve(JSON.parse(body).access_token)
                }
            })
        }))

    },

    /**
     * 通过接口获取jsapi_ticket
     * 基础支持的token
     * @returns {Promise<any>}
     */
    realGetJsapiTicket ()  {

        return new Promise((async (resolve, reject) => {

            let ACCESS_TOKEN = await this.getAccessToken();

            request.get(`${WechatConfig.URL_OF_GET_JSAPI_TICKET}?access_token=${ACCESS_TOKEN}&type=jsapi`, (error, response, body) => {

                if (error) {
                    resolve(null)
                } else {

                    resolve(JSON.parse(body).ticket)
                }
            })
        }))

    },


};
