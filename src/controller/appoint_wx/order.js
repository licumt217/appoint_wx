const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Util = require('../../util/Util')
const WechatUtil = require('../../util/WechatUtil')
const ORDER_STATE =require('../../config/ORDER_STATE')
const moment =require('moment')

const logger =think.logger

module.exports = class extends Base {

    /**
     * 微信支付统一下单接口
     * @returns {Promise<void>}
     */
    async unifiedOrderAction(){

        let openid=this.post('openid')
        let therapist_id=this.post('therapist_id')
        let trade_no=Util.uuid()
        let amount=this.post('amount')

        logger.info(`微信支付统一下单接口参数 openid:${openid}， therapist_id:${therapist_id}， amount:${amount}`);

        let state=ORDER_STATE.UN_PAYED

        let create_date=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

        try{

            let prepay_id=await WechatUtil.unifiedOrder(openid,trade_no,Number(amount)*100,this.ip)

            logger.info(`微信支付统一下单接口订单存库参数 state:${state}， create_date:${create_date}， prepay_id:${prepay_id}`);

            //订单表存库
            await this.model('order').add({
                openid,
                therapist_id,
                amount,
                state,
                prepay_id,
                create_date,
                trade_no
            })

            let paySign=await WechatUtil.getJsApiPaySign(prepay_id)

            logger.info(`微信支付统一下单接口返回前端参数 paySign:${JSON.stringify(paySign)}`);

            this.body=Response.success({
                secuParam:paySign
            });

        }catch (e) {
            logger.info(`微信支付统一下单接口异常 msg:${e}`);
            this.body = Response.businessException(e);
        }



    }


    /**
     * 微信支付统一下单接口
     * @returns {Promise<void>}
     */
    async getOrderByIdAction(){

        let openid=this.post('openid')
        let therapist_id=this.post('therapist_id')
        let trade_no=Util.uuid()
        let amount=this.post('amount')

        logger.info(`微信支付统一下单接口参数 openid:${openid}， therapist_id:${therapist_id}， amount:${amount}`);

        let state=ORDER_STATE.UN_PAYED

        let create_date=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

        try{

            let prepay_id=await WechatUtil.unifiedOrder(openid,trade_no,Number(amount)*100,this.ip)

            logger.info(`微信支付统一下单接口订单存库参数 state:${state}， create_date:${create_date}， prepay_id:${prepay_id}`);

            //订单表存库
            await this.model('order').add({
                openid,
                therapist_id,
                amount,
                state,
                prepay_id,
                create_date,
                trade_no
            })

            let paySign=await WechatUtil.getJsApiPaySign(prepay_id)

            logger.info(`微信支付统一下单接口返回前端参数 paySign:${JSON.stringify(paySign)}`);

            this.body=Response.success({
                secuParam:paySign
            });

        }catch (e) {
            logger.info(`微信支付统一下单接口异常 msg:${e}`);
            this.body = Response.businessException(e);
        }



    }

};
