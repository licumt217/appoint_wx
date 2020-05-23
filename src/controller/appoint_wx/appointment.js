const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Util = require('../../util/Util')
const Page = require('../../config/Page')
const WechatUtil = require('../../util/WechatUtil')
const ORDER_STATE = require('../../config/ORDER_STATE')
const DateUtil = require('../../util/DateUtil')
const WechatTemplates = require('../../config/WechatTemplates')
const moment = require('moment')
const therapistperiodService = require('../../service/therapistperiod')
const orderService = require('../../service/order')
const appointmentService =  require('../../service/appointment');
const pushService = require('../../service/push')

const table_text='预约'

const logger = think.logger

module.exports = class extends Base {

    /**
     * 用户新建预约
     * @returns {Promise<boolean>}
     */
    async addAction() {

        let openid = this.post('openid')
        let therapist_id = this.post('therapist_id')
        let appointment_id = Util.uuid()
        let amount = this.post('amount');

        let appoint_date = this.post('appoint_date')
        let periodArray = this.post('periodArray')
        let isMulti = this.post('isMulti')
        let consult_type_id = this.post('consult_type_id')
        let manner_type_id = this.post('manner_type_id')

        let user_id=this.ctx.state.userInfo.user_id

        logger.info(`用户新增${table_text}参数： ${JSON.stringify(this.post())}`);

        if (!openid) {
            this.body = Response.businessException(`openid不能为空！`)
            return false;
        }

        if (!therapist_id) {
            this.body = Response.businessException(`咨询师ID不能为空！`)
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

        // if (!consult_type_id) {
        //     this.body = Response.businessException(`咨询类型不能为空！`)
        //     return false;
        // }
        //
        // if (!manner_type_id) {
        //     this.body = Response.businessException(`咨询方式不能为空！`)
        //     return false;
        // }

        try {


            let appointment_data=await appointmentService.addWithRelations(appointment_id,openid,therapist_id,appoint_date,periodArray,isMulti,amount,user_id);

            // let paySign = await WechatUtil.getJsApiPaySign(prepay_id)

            // logger.info(`微信支付统一下单接口返回前端参数 paySign:${JSON.stringify(paySign)}`);

            //给咨询师发送模板消息，通知他审核

            let url = Util.getAuthUrl(`http://www.zhuancaiqian.com/appointmobile/push/appointmentDetail?appointment_id=${appointment_id}`)

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
     * 获取详情
     * @returns {Promise<void>}
     */
    async getDetailAction() {

        logger.info(`获取${table_text}详情参数 :${JSON.stringify(this.post())}`);

        try {

            let appointment_id = this.post('appointment_id')

            if (!appointment_id) {
                this.body = Response.businessException(`订单ID不能为空！`)
                return false;
            }


            let data = await appointmentService.getById(appointment_id)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取${table_text}详情异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 咨询师接受预约。接受预约后生成一条订单。
     * @returns {Promise<void>}
     */
    async acceptAction() {
        try {

            logger.info(`咨询师接受预约参数 ${JSON.stringify(this.post())}`);

            let appointment_id = this.post('appointment_id')
            let assign_room_type = this.post('assign_room_type')
            let room_id = this.post('room_id')

            if (!appointment_id) {
                this.body = Response.businessException(`预约ID不能为空！`)
                return false;
            }

            //判断是否可分配有效房间
            if(assign_room_type===0){//自动分配
                room_id=await appointmentService.autoAssignRoomId(appointment_id);

                if (!room_id) {
                    this.body = Response.businessException(`无可用房间！`)
                    return false;
                }
            }else{
                if (!room_id) {
                    this.body = Response.businessException(`房间ID不能为空！`)
                    return false;
                }
            }

            await appointmentService.accept(appointment_id,room_id)

            //接受预约后生成一条订单
            await orderService.add(appointment_id)

            //TODO 给用户推送让用户付款，如果是咨询前支付的话

            /**
             *

             let url = Util.getAuthUrl(`http://www.zhuancaiqian.com/appointmobile/push/appointmentDetail?appointment_id=${appointment_id}`)

             let order = await appointmentService.getById(appointment_id)

             await pushService.sendTemplateMsg(order.openid, url);

             *
             */



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

            let appointment_id = this.post('appointment_id')

            await appointmentService.deny(appointment_id)

            //TODO 给用户推送，通知用户

            /**
             *

             let url = Util.getAuthUrl(`http://www.zhuancaiqian.com/appointmobile/push/appointmentDetail?appointment_id=${appointment_id}`)

             let order = await appointmentService.getById(appointment_id)

             await pushService.sendTemplateMsg(order.openid, url);

             *
             */



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
     *根据咨询师ID获取生效中的预约列表
     * @returns {Promise<void>}
     */
    async getListOfUsingByTherapistIdAction() {

        let therapist_id=this.post('therapist_id')

        logger.info(`根据咨询师ID获取生效中的预约列表参数 :${JSON.stringify(this.post())}`);

        try {

            let orders = await appointmentService.getListOfUsingByTherapistId(therapist_id)

            this.body = Response.success(orders);

        } catch (e) {
            logger.info(`根据咨询师ID获取生效中的预约列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     *根据工作室ID获取生效中的预约列表
     * @returns {Promise<void>}
     */
    async getListOfUsingByStationIdAction() {

        let station_id=this.post('station_id')

        logger.info(`根据工作室ID获取生效中的预约列表参数 :${JSON.stringify(this.post())}`);

        try {

            let orders = await appointmentService.getListOfUsingByStationId(station_id)

            this.body = Response.success(orders);

        } catch (e) {
            logger.info(`根据工作室ID获取生效中的预约列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     *根据用户id获取预约列表
     * @returns {Promise<void>}
     */
    async getListOfUsingByUserIdAction() {

        let user_id=this.ctx.state.userInfo.user_id

        logger.info(`根据用户id获取预约列表参数 :${JSON.stringify(this.post())}`);

        try {

            let orders = await appointmentService.getListByUserId(user_id)

            this.body = Response.success(orders);

        } catch (e) {
            logger.info(`根据用户id获取预约列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }



};
