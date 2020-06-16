const Base = require('./base.js');

const Response = require('../../config/response')
const Page = require('../../config/constants/PAGE')
const Util = require('../../util/Util')
const APPOINTMENT_STATE = require('../../config/constants/APPOINTMENT_STATE')
const orderService = require('../../service/order')
const appointmentService =  require('../../service/appointment');
const userService =  require('../../service/user');
const pushService = require('../../service/push')
const roomService = require('../../service/room')

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
        let appoint_date = this.post('appoint_date')
        let periodArray = this.post('periodArray')
        let ismulti = this.post('ismulti')

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

        try {


            await appointmentService.add(appointment_id,openid,therapist_id,appoint_date,periodArray,ismulti,user_id);

            //给咨询师发送模板消息，通知他审核

            let url = Util.getAuthUrl(`http://www.zhuancaiqian.com/appointmobile/push/appointmentDetail?appointment_id=${appointment_id}`)

            let therapist = await userService.getWithOpenidByUserId(therapist_id)
            let user = await userService.getWithOpenidByUserId(user_id)

            //咨询师审核推送
            await pushService.sendAppointmentAuditTemplate(therapist.openid, url,{
                name:user.name,
                phone:user.phone,
                date:appoint_date,
                content:`预约申请`,
                remark:`预约时段 ${Util.getAppointmentPeriodStrFromArray(periodArray)}`
            });

            this.body = Response.success();

        } catch (e) {
            logger.info(`用户新建预约接口异常 msg:${e}`);
            this.body = Response.businessException(e.message);
        }


    }


    /**
     * 取消预约
     * @returns {Promise<boolean>}
     */
    async cancelAction() {

        let appointment_id = this.post('appointment_id')

        logger.info(`取消预约参数： ${JSON.stringify(this.post())}`);

        if (!appointment_id) {
            this.body = Response.businessException(`预约ID不能为空！`)
            return false;
        }

        const appointment=await appointmentService.getById(appointment_id);

        if(appointment.state!==APPOINTMENT_STATE.COMMIT){
            this.body = Response.businessException(`当前预约状态不可取消！`)
            return false;
        }

        try {


            await appointmentService.cancel(appointment_id);

            this.body = Response.success();

        } catch (e) {
            logger.info(`取消预约接口异常 msg:${e}`);
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
                this.body = Response.businessException(`预约ID不能为空！`)
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
            let pay_manner = this.post('pay_manner')

            if (!appointment_id) {
                this.body = Response.businessException(`预约ID不能为空！`)
                return false;
            }

            if (!pay_manner) {
                this.body = Response.businessException(`支付方式不能为空！`)
                return false;
            }

            //只有状态是已提交的预约才合法

            let appointment=await appointmentService.getById(appointment_id)
            if(appointment.state!==APPOINTMENT_STATE.COMMIT){
                this.body = Response.businessException(`预约状态不合法！`)
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

            await appointmentService.accept(appointment_id,room_id,pay_manner)

            let room=await roomService.getById(room_id)

            let url = Util.getAuthUrl(`http://www.zhuancaiqian.com/appointmobile/appoint/myAppoint`)

            //TODO 给用户推送让用户付款，如果是咨询前支付的话
            //审核通过后告知用户推送
            await pushService.sendAppointmentSuccess(appointment.openid, url,{
                content:`心理咨询`,
                date:appointment.appoint_date,
                address:room.name,
            });

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

            //只有状态是已提交的预约才合法

            let appointment=await appointmentService.getById(appointment_id)
            if(appointment.state!==APPOINTMENT_STATE.COMMIT){
                this.body = Response.businessException(`预约状态不合法！`)
                return false;
            }

            await appointmentService.deny(appointment_id)

            let url = Util.getAuthUrl(`http://www.zhuancaiqian.com/appointmobile/appoint/history`)

            //审核拒绝后告知用户推送
            await pushService.sendAppointmentReject(appointment.openid, url,{
                date:appointment.appoint_date,
            });

            this.body = Response.success();

        } catch (e) {
            logger.info(`咨询师拒绝预约异常 msg:${e}`);
            this.body = Response.businessException(e);
        }
    }

    /**
     * 咨询师确认完成预约（结束）
     * 当前预约对应的所有订单必须都是最终状态：已拒绝、已取消、已过期、已完结。
     */
    async doneAction() {
        try {

            logger.info(`咨询师确认完成预约参数 ${JSON.stringify(this.post())}`);

            let appointment_id = this.post('appointment_id')

            let orderList=await orderService.getUnDoneListByAppointmentId(appointment_id);

            if(orderList && orderList.length>0){
                this.body = Response.businessException(`当前预约有不是最终状态的订单，不能完成！`)
                return false;
            }else{
                await appointmentService.done(appointment_id)

                this.body = Response.success();
            }

        } catch (e) {
            logger.info(`咨询师确认完成预约异常 msg:${e}`);
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
     *根据房间ID获取生效中的预约列表
     * @returns {Promise<void>}
     */
    async getListOfUsingByRoomIdAction() {

        let room_id=this.post('room_id')

        logger.info(`根据房间ID获取生效中的预约列表参数 :${JSON.stringify(this.post())}`);

        try {

            let appointments = await appointmentService.getListOfUsingByRoomId(room_id)

            this.body = Response.success(appointments);

        } catch (e) {
            logger.info(`根据房间ID获取生效中的预约列表异常 msg:${e}`);
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

            let appointments = await appointmentService.getListOfUsingByStationId(station_id)

            this.body = Response.success(appointments);

        } catch (e) {
            logger.info(`根据工作室ID获取生效中的预约列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     *根据用户id获取进行中的预约列表
     * @returns {Promise<void>}
     */
    async getListOfUsingByUserIdAction() {

        let user_id=this.ctx.state.userInfo.user_id

        logger.info(`根据用户id获取进行中的预约列表参数 :${JSON.stringify(this.post())}`);

        try {

            let appointments = await appointmentService.getListOfUsingByUserId(user_id)

            this.body = Response.success(appointments);

        } catch (e) {
            logger.info(`根据用户id获取进行中的预约列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }



    /**
     *根据用户id获取预约历史
     * @returns {Promise<void>}
     */
    async getHistoryByUserIdAction() {

        let user_id=this.ctx.state.userInfo.user_id

        let page = this.post('page') || Page.currentPage
        let pageSize = this.post('pageSize') || Page.pageSize

        logger.info(`根据用户id获取预约历史参数 :${JSON.stringify(this.post())}`);

        try {

            let appointments = await appointmentService.getHistoryByUserId(user_id,page,pageSize)

            this.body = Response.success(appointments);

        } catch (e) {
            logger.info(`根据用户id获取预约历史异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     *根据咨询师id获取预约历史
     * @returns {Promise<void>}
     */
    async getHistoryByTherapistIdAction() {

        let therapist_id=this.ctx.state.userInfo.user_id

        logger.info(`根据咨询师id获取预约历史参数 :${JSON.stringify(this.post())}`);

        try {

            let appointments = await appointmentService.getHistoryByTherapistId(therapist_id)

            this.body = Response.success(appointments);

        } catch (e) {
            logger.info(`根据咨询师id获取预约历史异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }



};
