const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Util = require('../../util/Util')
const WechatUtil = require('../../util/WechatUtil')
const ORDER_STATE = require('../../config/ORDER_STATE')
const DateUtil = require('../../util/DateUtil')
const WechatTemplates = require('../../config/WechatTemplates')
const moment = require('moment')
const orderService = require('../../service/order')
const therapistperiodService = require('../../service/therapistperiod')
const orderService = require('../../service/order')
const pushService = require('../../service/push')

const logger = think.logger

module.exports = class extends Base {

    /**
     * 微信支付统一下单接口
     * @returns {Promise<void>}
     */
    async unifiedOrderAction() {

        let openid = this.post('openid')
        let therapist_id = this.post('therapist_id')
        let trade_no = Util.uuid()
        let amount = this.post('amount');

        let appoint_date = this.post('appoint_date')
        let periodArray = this.post('periodArray')

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

        if (!periodArray || periodArray.length===0) {
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

        let state = ORDER_STATE.UN_PAYED

        let create_date = DateUtil.getNowStr()

        try {

            let prepay_id = await WechatUtil.unifiedOrder(openid, trade_no, Number(amount) * 100, this.ip)


            logger.info(`微信支付统一下单接口订单存库参数 state:${state}， create_date:${create_date}， prepay_id:${prepay_id}`);

            //订单表存库
            let order_id=await orderService.add({
                openid,
                therapist_id,
                amount,
                state,
                prepay_id,
                create_date,
                trade_no,
                consult_type_id,
                manner_type_id
            })

            //将咨询师时间段存库
            let therapistperiodResponse=await therapistperiodService.add(therapist_id,appoint_date,periodArray)

            if (!therapistperiodResponse.isSuccessful()) {
                logger.info(`取消订单接口异常 msg:${response.errorMsg}`);
                this.body = Response.businessException(response.errorMsg);
            }

            let paySign = await WechatUtil.getJsApiPaySign(prepay_id)

            logger.info(`微信支付统一下单接口返回前端参数 paySign:${JSON.stringify(paySign)}`);

            //给咨询师发送模板消息，通知他审核

            let url='http://www.baidu.com'
            let top='你好，我是头部'
            let bottom='你好，我是底部'



            await pushService.sendTemplateMsg(openid,WechatTemplates.appoint_audit,['李强','18601965856',DateUtil.getNowStr(),'看病','备注'],url,top,bottom);

            this.body = Response.success({
                secuParam: paySign
            });

        } catch (e) {
            logger.info(`微信支付统一下单接口异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 获取当前用户的订单列表
     * @returns {Promise<void>}
     */
    async getOrderListAction() {

        let openid = this.post('openid')

        logger.info(`获取当前用户的订单列表参数 openid:${openid}`);

        try {

            //订单表存库
            let orders = await orderService.getList({openid})

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

        let trade_no = this.post('trade_no')

        logger.info(`取消订单参数 ${JSON.stringify(this.post())}`);

        try {


            let order = await orderService.getOrder({trade_no})

            if (Util.isEmptyObject(order)) {
                logger.info(`取消订单时根据订单号获取订单信息接口，未找到订单`);
                this.body = Response.businessException(response.errorMsg);
            }

            //TODO 后期添加完善的取消订单的限制

            //只有未支付和已支付状态的订单可以取消

            if(!(order.state===ORDER_STATE.UN_PAYED || order.state===ORDER_STATE.PAYED)){
                let msg=`订单状态是 ${order.state} ,不允许取消订单`
                logger.info(msg);
                this.body = Response.businessException(msg);
            }

            //更新订单状态
            await orderService.update({
                trade_no
            },{
                state: ORDER_STATE.CANCELED,
                cancel_date: DateUtil.getNowStr()
            })

            //将对应的咨询师时段占用释放掉
            await therapistperiodService.update({
                order_id:order.id
            },{
                state: Util.ONE
            })

            //如果需要退款的话，进行退款操作
            if(order.state===ORDER_STATE.PAYED){
                await WechatUtil.refund(trade_no, order.amount,order.amount)
            }




            this.body = Response.success();




        } catch (e) {
            logger.info(`取消订单接口异常 msg:${e}`);
            this.body = Response.businessException(e);
        }

    }


};
