const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatUtil = require('../util/WechatUtil')
const APPOINTMENT_STATE = require('../config/constants/APPOINTMENT_STATE')
const ORDER_STATE = require('../config/constants/ORDER_STATE')
const logger = think.logger
const entityName = '预约'
const tableName = 'appointment'
const roomPeriodSetService = require('./roomPeriodSet');
const stationTherapistRelationService = require('./stationTherapistRelation');
const therapistFeeSetService = require('./therapistFeeSet');
const roomService = require('./room');

module.exports = {


    /**
     *新增预约
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async add(appointment_id, openid, therapist_id, appoint_date, period, ismulti, user_id) {


        let station_id = await stationTherapistRelationService.getStationIdByTherapistId(therapist_id);
        const therapistFeeSet = await therapistFeeSetService.getByTherapistId(therapist_id)
        let create_date = DateUtil.getNowStr()

        let op_date = create_date

        period = period.join(',')

        let appointment = {
            appointment_id,
            openid,
            therapist_id,
            create_date,
            appoint_date,
            op_date,
            period,
            ismulti,
            user_id,
            amount: therapistFeeSet.fee,
            station_id,
            fee_type: therapistFeeSet.fee_type
        }

        logger.info(`新增预约参数：${JSON.stringify(appointment)}`)

        try {

            await think.model(tableName).add(appointment).catch(e => {
                throw new Error(e)
            })

        } catch (e) {
            let msg = `新增${entityName}接口异常 msg:${e}`
            let returnMsg = `新增预约接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

    /**
     *取消预约
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async cancel(appointment_id) {

        try {


            let data = await think.model(tableName).where({
                appointment_id
            }).update({
                state: APPOINTMENT_STATE.CANCELED
            }).catch(e => {
                throw new Error(e)
            });
            ;

            logger.info(`取消预约数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `取消预约接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *过期预约
     * 用户未按时支付
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async expire(appointment_id) {

        try {


            let data = await think.model(tableName).where({
                appointment_id
            }).update({
                state: APPOINTMENT_STATE.EXPIRED
            }).catch(e => {
                throw new Error(e)
            });
            ;

            logger.info(`过期预约数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `过期预约接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *咨询师完成预约
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async done(appointment_id) {

        try {


            let data = await think.model(tableName).where({
                appointment_id
            }).update({
                state: APPOINTMENT_STATE.DONE
            }).catch(e => {
                throw new Error(e)
            });

            logger.info(`咨询师完成预约数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `咨询师完成预约接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *咨询师拒绝预约
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async reject(appointment_id) {

        try {


            let data = await think.model(tableName).where({
                appointment_id
            }).update({
                state: APPOINTMENT_STATE.REJECTED
            }).catch(e => {
                throw new Error(e)
            });

            logger.info(`咨询师拒绝预约数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `咨询师拒绝预约接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    isRoomPeriodsContainsAppointPeriods(appointment, allAvailablePeriodArray) {

        let periods = appointment.period.split(',')

        let flag = true;
        for (let i = 0; i < periods.length; i++) {
            if (!allAvailablePeriodArray.includes(periods[i])) {
                flag = false;
                break;
            }
        }
        return flag;
    },

    /**
     * 看给定日期能否预约房间
     * @param date
     * @param usedPeriodArray 已经长期预约的时段，此时不可用
     * @returns {[]}
     */
    canAppointRoom(appointment, singleMap, usedPeriodArray, allAvailablePeriodArray) {

        let periodDateMap = {}

        let dateWeek = DateUtil.getWeekOfDate(appointment.appoint_date)

        for (let date2 in singleMap) {
            date2 = new Date(date2)
            let w = DateUtil.getWeekOfDate(date2)


            let period2 = singleMap[date2]
            if (w === dateWeek) {
                period2.forEach(item => {
                    if (periodDateMap[item]) {
                        if (periodDateMap[item].getTime() < date2.getTime()) {
                            periodDateMap[item] = date2;
                        }
                    } else {
                        periodDateMap[item] = date2;
                    }
                })
            }
        }

        let appoint_periods = appointment.period.split(',');
        let flag = true;
        for (let m = 0; m < appoint_periods.length; m++) {
            let the_period = appoint_periods[m];

            if (usedPeriodArray && usedPeriodArray.includes(the_period)) {
                flag = false;
                break;
            }

            if (periodDateMap[the_period] && new Date(appointment.appoint_date).getTime() < periodDateMap[the_period].getTime()) {
                flag = false;
                break;
            }

        }

        return flag && this.isRoomPeriodsContainsAppointPeriods(appointment, allAvailablePeriodArray);


    },

    /**
     *咨询师同意预约时，自动分配对应工作室的房间
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async autoAssignRoomId(appointment_id) {


        try {

            let appointment = await this.getById(appointment_id);

            let allAvailablePeriodArray = await roomPeriodSetService.getByStationId(appointment.station_id);
            allAvailablePeriodArray = allAvailablePeriodArray.period.split(',')

            let allRoomList = await roomService.getListByStationIdNoPage(appointment.station_id)

            let data = await this.getListOfUsingByStationId(appointment.station_id)

            let roomList = [];

            //说明没有别人占用的，所有都可以预约
            if (data.length === 0 && this.isRoomPeriodsContainsAppointPeriods(appointment, allAvailablePeriodArray)) {
                roomList = allRoomList;
            } else {

                let weekMap = {}
                let singleMap = {}
                data.forEach(item => {

                    let date = new Date(item.appoint_date)

                    let week = DateUtil.getWeekOfDate(date)


                    let periodArray = item.period.split(',')

                    //持续的预约
                    if (item.ismulti === 1) {
                        if (weekMap[week]) {
                            weekMap[week] = weekMap[week].concat(periodArray);
                        } else {
                            weekMap[week] = periodArray
                        }
                    } else {//单次预约
                        if (singleMap[date]) {
                            singleMap[date].concat(periodArray);
                        } else {
                            singleMap[date] = periodArray
                        }
                    }
                })


                allRoomList.forEach((item, index) => {

                    let week = DateUtil.getWeekOfDate(appointment.appoint_date);

                    if (this.canAppointRoom(appointment, singleMap, weekMap[week], allAvailablePeriodArray)) {
                        roomList.push(item);
                    }

                })

            }

            if (roomList.length > 0) {
                return roomList[0].room_id;
            } else {
                return null;
            }

        } catch (e) {
            let msg = `咨询师同意预约时，自动分配对应工作室的房间接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *获取预约详情
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getById(appointment_id) {

        try {

            let data = await think.model(tableName).where({
                appointment_id
            }).join([
                ` appoint_user as therapist on therapist.user_id=appoint_appointment.therapist_id`,
                ` appoint_user as userInfo on userInfo.user_id=appoint_appointment.user_id`,
            ]).field(
                `appoint_appointment.*,
                    therapist.name as therapist_name,
                    userInfo.name as user_name `,
            ).find().catch(e => {
                throw new Error(e)
            })


            logger.info(`根据ID获取大订单详情数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据ID获取大订单详情接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getOne(whereObj) {

        try {

            let data = await think.model(tableName).where(whereObj).find().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据条件查询单个${entityName}数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据条件查询单个${entityName}接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getList(whereObj) {

        try {

            let data = await think.model(tableName).where(whereObj).select().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据条件查询${entityName}列表：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据条件查询${entityName}列表接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *根据咨询师ID获取生效中的预约列表
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getListOfUsingByTherapistId(therapist_id) {

        try {

            let data = await think.model(tableName).where({
                'appoint_appointment.therapist_id': therapist_id,
                'appoint_appointment.state': ['in', [APPOINTMENT_STATE.COMMIT, APPOINTMENT_STATE.AUDITED]],
            }).join([
                ` appoint_user as therapist on therapist.user_id=appoint_appointment.therapist_id`,
                ` appoint_room as room on room.room_id=appoint_appointment.room_id`,
            ]).field(
                `appoint_appointment.*,
                room.name as room_name,
                    therapist.name as therapist_name`,
            ).order('create_date desc ').select().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据咨询师ID获取生效中的预约列表数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据咨询师ID获取生效中的预约列表异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },
    /**
     *根据房间ID获取生效中的预约列表
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getListOfUsingByRoomId(room_id) {

        try {

            let data = await think.model(tableName).where({
                'appoint_appointment.room_id': room_id,
                'appoint_appointment.state': ['in', [APPOINTMENT_STATE.COMMIT, APPOINTMENT_STATE.AUDITED]],
            }).join([
                ` appoint_room as room on room.room_id=appoint_appointment.room_id`
            ]).field(
                `appoint_appointment.*,
                room.name as room_name`,
            ).order('create_date desc ').select().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据房间ID获取生效中的预约列表数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据房间ID获取生效中的预约列表异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },


    /**
     *根据用户id获取历史预约记录
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getHistoryByUserId(user_id,page,pageSize) {

        try {


            let data = await think.model(tableName).where({
                'appoint_appointment.user_id': user_id,
                'appoint_appointment.state': ['in', [APPOINTMENT_STATE.CANCELED, APPOINTMENT_STATE.REJECTED, APPOINTMENT_STATE.DONE, APPOINTMENT_STATE.EXPIRED]],
            }).join([
                ` appoint_user as therapist on therapist.user_id=appoint_appointment.therapist_id`,
                ` appoint_room as room on room.room_id=appoint_appointment.room_id`,
            ]).field(
                `appoint_appointment.*,
                room.name as room_name,
                    therapist.name as therapist_name`,
            ).order('create_date desc ').page(page,pageSize).countSelect().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据用户id获取历史预约记录数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据用户id获取历史预约记录异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },
    /**
     *根据咨询师id获取历史预约记录
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getHistoryByTherapistId(therapist_id) {

        try {


            let data = await think.model(tableName).where({
                'appoint_appointment.therapist_id': therapist_id,
                'appoint_appointment.state': ['in', [APPOINTMENT_STATE.CANCELED, APPOINTMENT_STATE.REJECTED, APPOINTMENT_STATE.DONE, APPOINTMENT_STATE.EXPIRED]],
            }).join([
                ` appoint_user as therapist on therapist.user_id=appoint_appointment.therapist_id`,
                ` appoint_room as room on room.room_id=appoint_appointment.room_id`,
            ]).field(
                `appoint_appointment.*,
                room.name as room_name,
                    therapist.name as therapist_name`,
            ).order('create_date desc ').select().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据咨询师id获取历史预约记录数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据咨询师id获取历史预约记录异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *根据用户ID获取生效中的预约列表
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getListOfUsingByUserId(user_id) {

        try {


            let data = await think.model(tableName).where({
                'appoint_appointment.user_id': user_id,
                'appoint_appointment.state': ['in', [APPOINTMENT_STATE.COMMIT, APPOINTMENT_STATE.AUDITED]],
            }).join([
                ` appoint_user as therapist on therapist.user_id=appoint_appointment.therapist_id`,
                ` appoint_room as room on room.room_id=appoint_appointment.room_id`,
            ]).field(
                `appoint_appointment.*,
                room.name as room_name,
                    therapist.name as therapist_name`,
            ).order('create_date desc ').select().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据用户ID获取生效中的预约列表数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据用户ID获取生效中的预约列表异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *根据咨询师ID获取生效中的预约列表
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getListOfUsingByTherapistId(therapist_id) {

        try {


            let data = await think.model(tableName).where({
                'appoint_appointment.therapist_id': therapist_id,
                'appoint_appointment.state': ['in', [APPOINTMENT_STATE.COMMIT, APPOINTMENT_STATE.AUDITED]],
            }).join([
                ` appoint_user as therapist on therapist.user_id=appoint_appointment.therapist_id`,
            ]).field(
                `appoint_appointment.*,
                    therapist.name as therapist_name`,
            ).order('create_date desc ').select().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据咨询师ID获取生效中的预约列表数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据咨询师ID获取生效中的预约列表异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     * 根据工作室ID获取生效中的预约列表
     * @param station_id
     * @returns {Promise<T>}
     */
    async getListOfUsingByStationId(station_id) {

        try {

            let data = await think.model(tableName).where({
                station_id,
                'appoint_appointment.state': ['in', [APPOINTMENT_STATE.COMMIT, APPOINTMENT_STATE.AUDITED]],
            }).select().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据工作室ID获取生效中的预约列表数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据工作室ID获取生效中的预约列表接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getOrderListByTherapistId(therapist_id, page, pageSize) {

        try {

            let ORDER = think.model(tableName)
            ORDER._pk = 'order_id'
            let data = await ORDER.where({
                therapist_id
            }).page(page, pageSize).countSelect().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据条件查询${entityName}列表：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据条件查询${entityName}列表接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },


    /**
     * 咨询师接受预约，同步生成一条订单记录
     * @param appointment_id
     * @param room_id
     * @param pay_manner
     * @returns {Promise<any>}
     */
    async accept(appointment_id, room_id, pay_manner) {

        let op_date = DateUtil.getNowStr()

        try {

            let model = think.model(tableName);
            let appointment_return = await model.transaction(async () => {

                let data = await model.where({
                    appointment_id
                }).update({
                    state: APPOINTMENT_STATE.AUDITED,
                    op_date,
                    room_id,
                    pay_manner
                }).catch(e => {
                    throw new Error(e)
                })

                //接受预约后生成一条订单
                const appointment = await model.where({appointment_id}).find();
                const orderCate = think.model('order').db(model.db());

                //添加此条订单具体的预约日期
                let orderList = await orderCate.where({
                    'appoint_order.appointment_id': appointment_id
                }).join([
                    ` appoint_appointment on appoint_order.appointment_id=appoint_appointment.appointment_id`
                ]).select().catch(e => {
                    throw new Error(e)
                });
                let order_date;
                if (orderList && orderList.length > 0) {//最新订单的预约日期加一周
                    let newestOrder = orderList[0]
                    order_date = DateUtil.addDays(new Date(newestOrder.order_date), 7);
                } else {
                    order_date = DateUtil.addDays(new Date(appointment.appoint_date), 0);
                }

                let order = {
                    op_date,
                    order_date: DateUtil.format(order_date),
                    order_id: Util.uuid(),
                    openid: appointment.openid,
                    therapist_id: appointment.therapist_id,
                    user_id: appointment.user_id,
                    amount: appointment.amount,
                    state: ORDER_STATE.COMMIT,
                    create_date: op_date,
                    appointment_id,
                    pay_manner: appointment.pay_manner
                }
                data = await orderCate.add(order).catch(e => {
                    throw new Error(e)
                });

                logger.info(`新增订单数据库返回：${JSON.stringify(data)}`)

                logger.info(`同意${entityName}数据库返回：${JSON.stringify(data)}`)

                return data;
            })

            return appointment_return;

        } catch (e) {
            let msg = `同意${entityName}接口异常 msg:${e}`
            let returnMsg = `同意订单接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

    /**
     * 咨询师拒绝用户预约申请
     * @param appointment_id
     * @returns {Promise<any>}
     */
    async deny(appointment_id) {

        let op_date = DateUtil.getNowStr()

        try {

            let data = await think.model(tableName).where({
                appointment_id
            }).update({
                state: APPOINTMENT_STATE.REJECTED,
                op_date
            }).catch(e => {
                throw new Error(e)
            });

            logger.info(`咨询师拒绝用户预约申请数据库返回：${JSON.stringify(data)}`)

        } catch (e) {
            let msg = `咨询师拒绝用户预约申请异常 msg:${e}`
            let returnMsg = `咨询师拒绝用户预约申请异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

    async update(whereObj, updateObj) {

        try {
            let op_date = DateUtil.getNowStr()

            updateObj.op_date = op_date

            let data = await think.model(tableName).where(whereObj).update(updateObj).catch(e => {
                throw new Error(e)
            });

            logger.info(`更新${entityName}，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `更新${entityName}异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }

    },

    async refund(order_id, total_amount, refund_amount) {

        try {

            await WechatUtil.refund(order_id, total_amount, refund_amount).catch((e) => {
                throw new Error(e)
            })

        } catch (e) {
            let msg = `退款接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }

    }

};
