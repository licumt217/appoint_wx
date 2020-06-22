const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Util = require('../../util/Util')
const Page = require('../../config/constants/PAGE')
const WechatUtil = require('../../util/WechatUtil')
const ORDER_STATE = require('../../config/constants/ORDER_STATE')
const DateUtil = require('../../util/DateUtil')
const WechatTemplates = require('../../config/WechatTemplates')
const moment = require('moment')
const orderService = require('../../service/order')
const payRecordService = require('../../service/payRecord')
const pushService = require('../../service/push')

const logger = think.logger

module.exports = class extends Base {

    /**
     * 根据预约id获取订单记录
     * @returns {Promise<void>}
     */
    async getListByAppointmentIdAction() {

        logger.info(`根据预约id获取订单记录参数 ${JSON.stringify(this.post())}`);

        let appointment_id = this.post('appointment_id')

        if (!appointment_id) {
            this.body = Response.businessException(`预约ID不能为空！`)
            return false;
        }

        try {
            let data = await orderService.getListByAppointmentId(appointment_id);
            this.body = Response.success(data);

        } catch (e) {
            logger.info(`根据预约id获取订单记录异常 msg:${e}`);
            this.body = Response.businessException(e);
        }
    }

    /**
     * 订单支付
     * @returns {Promise<void>}
     */
    async payAction() {

        try {

            logger.info(`订单支付参数 ${JSON.stringify(this.post())}`);

            let order_id = this.post('order_id')

            if (!order_id) {
                this.body = Response.businessException(`订单ID不能为空！`)
                return false;
            }


            let order = await orderService.getOne({order_id});

            let out_trade_no=Util.uuid();

            let prepay_id = await WechatUtil.unifiedOrder(order.openid, out_trade_no, order.amount, this.ip).catch(error => {
                this.body = Response.businessException(error);
                return false;
            })

            logger.info(`prepay_id ${prepay_id}`);

            await orderService.update({order_id}, {
                out_trade_no,
                prepay_id,
            })

            let paySign = await WechatUtil.getJsApiPaySign(prepay_id)

            logger.info(`微信支付接口返回前端参数 paySign:${JSON.stringify(paySign)}`);

            this.body = Response.success({
                secuParam: paySign
            });

        } catch (e) {
            logger.info(`订单支付接口异常 msg:${e}`);
            this.body = Response.businessException(e.message);
        }


    }

    /**
     * 订单线下支付
     * @returns {Promise<void>}
     */
    async offlinePayAction() {

        try {

            logger.info(`订单线下支付参数 ${JSON.stringify(this.post())}`);

            let order_id = this.post('order_id')

            if (!order_id) {
                this.body = Response.businessException(`订单ID不能为空！`)
                return false;
            }

            let order = await orderService.getOne({order_id});

            let op_date=DateUtil.getNowStr()

            await orderService.update({order_id},{
                op_date,
                state:ORDER_STATE.PAYED
            })

            await payRecordService.addOfflinePayRecord(order.openid,order.amount)

            this.body = Response.success();

        } catch (e) {
            logger.info(`订单线下支付接口异常 msg:${e}`);
            this.body = Response.businessException(e.message);
        }


    }

    /**
     * 微信多订单批量支付
     * @returns {Promise<void>}
     */
    async batchPayAction() {

        try {

            logger.info(`微信多订单批量支付参数 ${JSON.stringify(this.post())}`);

            let order_id_array = this.post('order_id_array')

            if (!order_id_array || order_id_array.length===0) {
                this.body = Response.businessException(`订单不能为空！`)
                return false;
            }

            let order_array = await orderService.getListByOrderIdArray(order_id_array);

            let out_trade_no=Util.uuid();
            let allAmount=0;
            order_array.forEach(order=>{
                allAmount+=order.amount;
            })
            allAmount=allAmount.toFixed(2);

            let prepay_id = await WechatUtil.unifiedOrder(order_array[0].openid, out_trade_no, allAmount, this.ip).catch(error => {
                this.body = Response.businessException(error);
                return false;
            })

            logger.info(`prepay_id ${prepay_id}`);

            await orderService.updateByOrderIdArray(order_id_array, {
                prepay_id,
                out_trade_no
            })

            let paySign = await WechatUtil.getJsApiPaySign(prepay_id)

            logger.info(`微信多订单批量支付返回前端参数 paySign:${JSON.stringify(paySign)}`);

            this.body = Response.success({
                secuParam: paySign
            });

        } catch (e) {
            logger.info(`微信多订单批量支付异常 msg:${e}`);
            this.body = Response.businessException(e.message);
        }


    }

    /**
     * 多订单线下批量支付
     * @returns {Promise<void>}
     */
    async offlineBatchPayAction() {

        try {

            logger.info(`多订单线下批量支付参数 ${JSON.stringify(this.post())}`);

            let order_id_array = this.post('order_id_array')

            if (!order_id_array || order_id_array.length===0) {
                this.body = Response.businessException(`订单不能为空！`)
                return false;
            }

            let order_array = await orderService.getListByOrderIdArray(order_id_array);

            let allAmount=0;
            order_array.forEach(order=>{
                allAmount+=order.amount;
            })
            allAmount=allAmount.toFixed(2);

            let op_date=DateUtil.getNowStr()

            await orderService.updateByOrderIdArray(order_id_array, {
                op_date,
                state:ORDER_STATE.PAYED
            })


            await payRecordService.addOfflinePayRecord(order_array[0].openid,allAmount)

            this.body = Response.success();

        } catch (e) {
            logger.info(`多订单线下批量支付异常 msg:${e}`);
            this.body = Response.businessException(e.message);
        }


    }


    /**
     * 咨询师确认完成
     * @returns {Promise<void>}
     */
    async doneAction() {
        try {

            logger.info(`咨询师确认完成参数 ${JSON.stringify(this.post())}`);

            let order_id = this.post('order_id')

            await orderService.update({order_id}, {state: ORDER_STATE.DONE})

            //TODO 给用户推送告知用户
            let url = Util.getAuthUrl(`http://www.zhuancaiqian.com/appointmobile/appointDetail?order_id=${order_id}`)

            let order = await orderService.getOne({order_id})

            await pushService.sendTemplateMsg(order.openid, url);

            this.body = Response.success();

        } catch (e) {
            logger.info(`咨询师确认完成异常 msg:${e}`);
            this.body = Response.businessException(e);
        }
    }


    /**
     * 获取咨询师对应的订单列表
     * @returns {Promise<void>}
     */
    async getOrderListByTherapistIdAction() {

        let therapist_id = this.post('therapist_id')

        let page = this.post('page') || Page.currentPage
        let pageSize = this.post('pageSize') || Page.pageSize

        logger.info(`获取咨询师对应的订单列表参数 :${JSON.stringify(this.post())}`);

        try {

            let orders = await orderService.getOrderListByTherapistId(therapist_id, page, pageSize)

            logger.info(`获取咨询师对应的订单列表参数数据库返回 orders:${JSON.stringify(orders)}`);

            this.body = Response.success(orders);

        } catch (e) {
            logger.info(`获取咨询师对应的订单列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 查询咨询师收益列表
     * @returns {Promise<void>}
     */
    async getDoneOrderListByTherapistIdAction() {

        let therapist_id = this.post('therapist_id')

        let page = this.post('page') || Page.currentPage
        let pageSize = this.post('pageSize') || Page.pageSize

        logger.info(`查询咨询师收益列表参数 :${JSON.stringify(this.post())}`);

        try {

            let orders = await orderService.getDoneOrderListByTherapistId(therapist_id, page, pageSize)

            this.body = Response.success(orders);

        } catch (e) {
            logger.info(`查询咨询师收益列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 查询咨询师收益汇总
     * @returns {Promise<void>}
     */
    async getRevenueSumByTherapistIdAction() {

        let therapist_id = this.post('therapist_id')

        logger.info(`查询咨询师收益汇总参数 :${JSON.stringify(this.post())}`);

        try {

            let orders = await orderService.getRevenueSumByTherapistId(therapist_id)

            this.body = Response.success(orders);

        } catch (e) {
            logger.info(`查询咨询师收益汇总异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 取消订单
     * @returns {Promise<void>}
     */
    async cancelAction() {

        let order_id = this.post('order_id')

        logger.info(`取消订单参数 ${JSON.stringify(this.post())}`);

        try {

            if (!order_id) {
                this.body = Response.businessException('订单ID不能为空');
                return;
            }


            let order = await orderService.getOne({order_id})

            if (Util.isEmptyObject(order)) {
                let msg=`取消订单时根据订单号获取订单信息接口，未找到订单`
                logger.info(msg);
                this.body = Response.businessException(msg);
                return false;

            }

            //当前时间早于订单开始时间一天或以上，才允许取消；且只有状态是commit的订单允许取消
            if (order.state !== ORDER_STATE.COMMIT) {
                let msg = `订单当前状态不允许取消`
                logger.info(msg);
                this.body = Response.businessException(msg);
                return false;
            }

            let order_date=new Date(order.order_date)
            if(DateUtil.afterNowMoreThanOneDay(order_date)){

            }else{
                let msg = `订单开始前24小时不允许取消订单`
                logger.info(msg);
                this.body = Response.businessException(msg);
                return false;
            }

            await orderService.cancel(order_id)

            this.body = Response.success();

        } catch (e) {
            logger.info(`取消订单接口异常 msg:${e}`);
            this.body = Response.businessException(e);
        }

    }


};
