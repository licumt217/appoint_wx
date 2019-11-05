const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Util = require('../../util/Util')
const WechatUtil = require('../../util/WechatUtil')
const ORDER_STATE =require('../../config/ORDER_STATE')
const DateUtil = require('../../util/DateUtil')
const moment =require('moment')
const orderService = require('../../service/order')

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

        let create_date=DateUtil.getNowStr()

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
     * 获取当前用户的订单列表
     * @returns {Promise<void>}
     */
    async getOrderListAction(){

        let openid=this.post('openid')

        logger.info(`获取当前用户的订单列表参数 openid:${openid}`);

        try{

            //订单表存库
            let orders=await this.model('order').where({
                openid,
            }).select();

            logger.info(`获取当前用户的订单列表数据库返回 orders:${JSON.stringify(orders)}`);

            this.body=Response.success(orders);

        }catch (e) {
            logger.info(`获取当前用户的订单列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }



    }

    /**
     * 取消订单
     * @returns {Promise<void>}
     */
    async cancelOrderAction(){

        let trade_no=this.post('trade_no')

        logger.info(`取消订单参数 trade_no:${trade_no}`);

        try{

            //更新订单状态
            await this.model('order').where({
                trade_no
            }).update({
                state:ORDER_STATE.CANCELED,
                cancel_date:DateUtil.getNowStr()
            })

            let response = await orderService.getOrderByTradeNo(trade_no)

            if(response.isSuccessful()){
                let order = response.data;
                //退款
                await WechatUtil.refund(trade_no,Util.uuid(),Number(order.amount)*100,Number(order.amount)*100)

                this.body=Response.success();
            }else{
                logger.info(`取消订单接口异常 msg:${response.errorMsg}`);
                this.body = Response.businessException(response.errorMsg);
            }




        }catch (e) {
            logger.info(`取消订单接口异常 msg:${e}`);
            this.body = Response.businessException(e);
        }

    }




};
