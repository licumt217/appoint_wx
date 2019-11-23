const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Util = require('../../util/Util')
const WechatUtil = require('../../util/WechatUtil')
const ORDER_STATE = require('../../config/ORDER_STATE')
const DateUtil = require('../../util/DateUtil')
const WechatTemplates = require('../../config/WechatTemplates')
const moment = require('moment')
const therapistperiodService = require('../../service/therapistperiod')
const orderService = require('../../service/order')
const pushService = require('../../service/push')

const logger = think.logger

module.exports = class extends Base {

    /**
     * 微信支付
     * @returns {Promise<void>}
     */
    async payAction() {

        try {

            logger.info(`微信支付参数 ${JSON.stringify(this.post())}`);

            let order_id = this.post('order_id')

            if (!order_id) {
                this.body = Response.businessException(`订单ID不能为空！`)
                return false;
            }


            let order = await orderService.getOne({order_id});

            let prepay_id = await WechatUtil.unifiedOrder(order.openid, order_id, order.amount, this.ip).catch(error => {
                this.body = Response.businessException(error);
            })

            logger.info(`prepay_id ${prepay_id}`);

            await orderService.update({order_id}, {prepay_id})

            let paySign = await WechatUtil.getJsApiPaySign(prepay_id)

            logger.info(`微信支付接口返回前端参数 paySign:${JSON.stringify(paySign)}`);

            this.body = Response.success({
                secuParam: paySign
            });

        } catch (e) {
            logger.info(`微信支付接口异常 msg:${e}`);
            this.body = Response.businessException(e.message);
        }


    }

    /**
     * 咨询师接受预约
     * @returns {Promise<void>}
     */
    async acceptAction() {
        try {

            logger.info(`咨询师接受预约参数 ${JSON.stringify(this.post())}`);

            let order_id = this.post('order_id')

            await orderService.update({order_id}, {state: ORDER_STATE.AUDITED})

            //TODO 给用户推送让用户付款

            let url = Util.getAuthUrl(`http://www.zhuancaiqian.com/appointmobile/appointDetail?order_id=${order_id}`)

            let order = await orderService.getOne({order_id})

            await pushService.sendTemplateMsg(order.openid, url);



            this.body = Response.success();

        } catch (e) {
            logger.info(`咨询师接受预约异常 msg:${e}`);
            this.body = Response.businessException(e);
        }
    }

    /**
     * 咨询师拒绝预约
     * @returns {Promise<void>}
     */
    async denyAction() {
        try {

            logger.info(`咨询师拒绝预约参数 ${JSON.stringify(this.post())}`);

            let order_id = this.post('order_id')

            await orderService.update({order_id}, {state: ORDER_STATE.REJECTED})

            //TODO 给用户推送告知用户
            let url = Util.getAuthUrl(`http://www.zhuancaiqian.com/appointmobile/appointDetail?order_id=${order_id}`)

            let order = await orderService.getOne({order_id})

            await pushService.sendTemplateMsg(order.openid, url);

            this.body = Response.success();

        } catch (e) {
            logger.info(`咨询师拒绝预约异常 msg:${e}`);
            this.body = Response.businessException(e);
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
     * 微信支付统一下单接口
     * @returns {Promise<void>}
     */
    async unifiedOrderAction() {

        let openid = this.post('openid')
        let therapist_id = this.post('therapist_id')
        let order_id = Util.uuid()
        let amount = this.post('amount');

        let appoint_date = this.post('appoint_date')
        let periodArray = this.post('periodArray')
        let consult_type_id = this.post('consult_type_id')
        let manner_type_id = this.post('manner_type_id')

        logger.info(`微信支付统一下单接口参数 ${JSON.stringify(this.post())}`);

        if (!openid) {
            this.body = Response.businessException(`openid不能为空！`)
            return false;
        }

        if (!therapist_id) {
            this.body = Response.businessException(`咨询师不能为空！`)
            return false;
        }

        if (!appoint_date) {
            this.body = Response.businessException(`咨询日期不能为空！`)
            return false;
        }

        if (!periodArray || periodArray.length === 0) {
            this.body = Response.businessException(`咨询时段不能为空！`)
            return false;
        }

        if (!consult_type_id) {
            this.body = Response.businessException(`咨询类型不能为空！`)
            return false;
        }

        if (!manner_type_id) {
            this.body = Response.businessException(`咨询方式不能为空！`)
            return false;
        }

        let state = ORDER_STATE.COMMIT

        let create_date = DateUtil.getNowStr()

        try {


            //订单表存库
            await orderService.add({
                order_id,
                openid,
                therapist_id,
                amount,
                state,
                // prepay_id,
                create_date,
                consult_type_id,
                manner_type_id,
                user_id:this.ctx.state.userInfo.user_id
            })

            //将咨询师时间段存库
            await therapistperiodService.add(therapist_id, appoint_date, periodArray, order_id)

            // let paySign = await WechatUtil.getJsApiPaySign(prepay_id)

            // logger.info(`微信支付统一下单接口返回前端参数 paySign:${JSON.stringify(paySign)}`);

            //给咨询师发送模板消息，通知他审核

            let url = Util.getAuthUrl(`http://www.zhuancaiqian.com/appointmobile/therapistAppointConfirmPush?order_id=${order_id}`)

            let weixin_user_obj = await this.model('weixin_user').where({
                user_id: therapist_id
            }).find()


            //咨询师审核推送
            await pushService.sendTemplateMsg(weixin_user_obj.openid, url);

            this.body = Response.success();

        } catch (e) {
            logger.info(`微信支付统一下单接口异常 msg:${e}`);
            this.body = Response.businessException(e.message);
        }


    }

    /**
     * 获取c端用户的当前预约订单
     * @returns {Promise<void>}
     */
    async getCurAppointAction() {

        logger.info(`获取c端用户的当前预约订单参数 ${JSON.stringify(this.post())}`);

        let openid = this.post('openid')

        let data = await this.model('order').where({
            openid: ['=', openid],
            'appoint_order.state': ['in', [ORDER_STATE.PAYED, ORDER_STATE.COMMIT, ORDER_STATE.AUDITED]],
            'appoint_therapist_period.state': ['in', [Util.ZERO]]
        }).join([
            ` appoint_therapist_period on appoint_order.order_id=appoint_therapist_period.order_id`,
            `left JOIN appoint_user ON appoint_user.user_id=appoint_therapist_period.therapist_id`,
        ]).find();

        try {


            logger.info(`获取当前用户的订单列表数据库返回 :${data}`);

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取c端用户的当前预约订单异常 msg:${e}`);
            this.body = Response.businessException(e);
        }
    }

    /**
     * 获取预约详情
     * @returns {Promise<void>}
     */
    async getAppointDetailAction() {

        logger.info(`获取预约详情参数 :${JSON.stringify(this.post())}`);

        try {

            let order_id = this.post('order_id')

            let data = await this.model('order')
                .where({
                    'appoint_order.order_id': ['=', order_id],
                })
                .join([
                    ` appoint_user on appoint_user.user_id=appoint_order.therapist_id`,
                    `left JOIN appoint_therapist_period ON appoint_therapist_period.order_id=appoint_order.order_id`,
                ]).field(
                    `appoint_order.order_id,
                    appoint_order.state,
                    appoint_order.prepay_id,
                    appoint_user.name,
                    appoint_therapist_period.appoint_date,
                    appoint_therapist_period.period1,
                    appoint_therapist_period.period2,
                    appoint_therapist_period.period3,
                    appoint_therapist_period.period4,
                    appoint_therapist_period.period5,
                    appoint_therapist_period.period6,
                    appoint_therapist_period.period7,
                    appoint_therapist_period.period8`,
                )
                .find();


            logger.info(`获取预约详情数据库返回 orders:${JSON.stringify(data)}`);

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取预约详情异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 获取历史预约记录
     * @returns {Promise<void>}
     */
    async getAppointHistoryAction() {

        logger.info(`获取历史预约记录参数 :${JSON.stringify(this.post())}`);

        try {

            let openid = this.post('openid')

            let orders = await this.model('order').where({
                openid: ['=', openid],
                'appoint_order.state': ['in', [ORDER_STATE.CANCELED, ORDER_STATE.EXPIRED, ORDER_STATE.DONE, ORDER_STATE.UNFUNDED, ORDER_STATE.REJECTED]],
            }).join([
                ` appoint_user on appoint_user.user_id=appoint_order.therapist_id`,
                `left JOIN appoint_therapist_period ON appoint_therapist_period.order_id=appoint_order.order_id`,
            ]).select();


            logger.info(`获取历史预约记录数据库返回 orders:${JSON.stringify(orders)}`);

            this.body = Response.success(orders);

        } catch (e) {
            logger.info(`获取历史预约记录异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 获取当前用户的订单列表
     * @returns {Promise<void>}
     */
    async getOrderListAction() {

        logger.info(`获取当前用户的订单列表参数 :${JSON.stringify(this.post())}`);

        try {

            let orders = await orderService.getList(this.post())

            logger.info(`获取当前用户的订单列表数据库返回 orders:${JSON.stringify(orders)}`);

            this.body = Response.success(orders);

        } catch (e) {
            logger.info(`获取当前用户的订单列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 取消订单
     * @returns {Promise<void>}
     */
    async cancelOrderAction() {

        let order_id = this.post('order_id')

        logger.info(`取消订单参数 ${JSON.stringify(this.post())}`);

        try {


            let order = await orderService.getOne({order_id})

            if (Util.isEmptyObject(order)) {
                logger.info(`取消订单时根据订单号获取订单信息接口，未找到订单`);
                this.body = Response.businessException(response.errorMsg);
            }

            //TODO 后期添加完善的取消订单的限制

            //只有未支付和已支付状态的订单可以取消

            if (!(order.state === ORDER_STATE.COMMIT || order.state === ORDER_STATE.PAYED || order.state === ORDER_STATE.AUDITED)) {
                let msg = `订单状态是 ${order.state} ,不允许取消订单`
                logger.info(msg);
                this.body = Response.businessException(msg);
            }

            //更新订单状态
            await orderService.update({
                order_id
            }, {
                state: ORDER_STATE.CANCELED,
                cancel_date: DateUtil.getNowStr()
            })

            //将对应的咨询师时段占用释放掉
            await therapistperiodService.update({
                order_id: order_id
            }, {
                state: Util.ONE
            })

            //如果需要退款的话，进行退款操作。
            if (order.state === ORDER_STATE.PAYED) {
                await orderService.refund(order_id, order.amount, order.amount)
            }

            this.body = Response.success();

        } catch (e) {
            logger.info(`取消订单接口异常 msg:${e}`);
            this.body = Response.businessException(e);
        }

    }


};
