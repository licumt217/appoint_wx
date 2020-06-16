const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatUtil = require('../util/WechatUtil')
const logger = think.logger
const entityName = '订单'
const tableName = 'order'
const appointmentService = require('../service/appointment')
const ORDER_STATE = require('../config/constants/ORDER_STATE')
const APPOINTMENT_STATE = require('../config/constants/APPOINTMENT_STATE')

module.exports = {


    /**
     *根据预约新增一条对应的订单
     * 只有状态是已审核的预约才可以新建订单
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async add(appointment_id) {

        try {

            const appointment = await appointmentService.getById(appointment_id);

            if (appointment.state !== APPOINTMENT_STATE.AUDITED) {
                throw new Error(`只有审核通过的预约才能生成订单！`)
            }

            //添加此条订单具体的预约日期
            let orderList = await this.getList({
                'appoint_order.appointment_id':appointment_id
            });
            let order_date = null;
            if (orderList && orderList.length > 0) {//最新订单的预约日期加一周
                let newestOrder = orderList[0]
                order_date = DateUtil.addDays(new Date(newestOrder.order_date), 7);
            } else {
                order_date = DateUtil.addDays(new Date(appointment.appoint_date), 0);
            }


            let op_date = DateUtil.getNowStr()

            let obj = {
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
                pay_manner:appointment.pay_manner
            }
            let data = await think.model(tableName).add(obj).catch(e => {
                throw new Error(e)
            });

            logger.info(`新增${entityName}数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `新增${entityName}接口异常 msg:${e}`
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

            let data = await think.model(tableName).where(whereObj).join([
                ` appoint_appointment on appoint_order.appointment_id=appoint_appointment.appointment_id`
            ]).select().catch(e => {
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
     *根据订单id数组获取订单列表
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getListByOrderIdArray(order_id_array) {

        try {

            let data = await think.model(tableName).where({
                order_id:['in',order_id_array]
            }).join([
                ` appoint_appointment on appoint_order.appointment_id=appoint_appointment.appointment_id`
            ]).select().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据订单id数组获取订单列表数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据订单id数组获取订单列表接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *根据预约id获取此预约对应的所有未完结的订单。未完结订单包括：已下单、已审核、已支付
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getUnDoneListByAppointmentId(appointment_id) {

        try {

            let data = await think.model(tableName).where({
                appointment_id,
                'appoint_order.state': ['in', [ORDER_STATE.COMMIT, ORDER_STATE.PAYED]],
            }).select().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据预约id获取此预约对应的所有未完结的订单，数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据预约id获取此预约对应的所有未完结的订单接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getDoneOrderListByTherapistId(therapist_id, page, pageSize) {

        try {

            let ORDER = think.model(tableName)
            ORDER._pk = 'order_id'
            let data = await ORDER.where({
                therapist_id,
                state: ORDER_STATE.DONE
            }).join([
                ` appoint_user as user on user.user_id=appoint_order.user_id`,
            ]).page(page, pageSize).countSelect().catch(e => {
                throw new Error(e)
            });

            logger.info(`查询咨询师收益列表数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `查询咨询师收益列表接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },
    /**
     *查询咨询师收益汇总
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getRevenueSumByTherapistId(therapist_id, page, pageSize) {

        try {

            let ORDER = think.model(tableName)
            ORDER._pk = 'order_id'

            let monthStart = DateUtil.getFirstDayStrOfCurrentMonth(),
                weekStart = DateUtil.getFirstDayStrOfCurrentWeek(), dateEnd = DateUtil.getNowStr();

            let allAmount = await ORDER.where({
                therapist_id,
                state: ORDER_STATE.DONE
            }).sum('amount')

            let monthAmount = await ORDER.where({
                therapist_id,
                state: ORDER_STATE.DONE,
                order_date: ['between', [monthStart,dateEnd]]
            }).sum('amount')

            let weekAmount = await ORDER.where({
                therapist_id,
                state: ORDER_STATE.DONE,
                order_date: ['between', [weekStart,dateEnd]]
            }).sum('amount')

            let data={
                allAmount:allAmount||0,
                monthAmount:monthAmount||0,
                weekAmount:weekAmount||0
            }

            logger.info(`查询咨询师收益汇总数据库返回：${JSON.stringify(data)}`)

            return data

        } catch (e) {
            let msg = `查询咨询师收益汇总接口异常 msg:${e}`
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
            }).join([
                ` appoint_user as user on user.user_id=appoint_order.user_id`,
            ]).page(page, pageSize).countSelect().catch(e => {
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
     * 根据订单id数组更新数据
     * @param order_id_array
     * @param updateObj
     * @returns {Promise<number>}
     */
    async updateByOrderIdArray(order_id_array, updateObj) {

        try {
            let op_date = DateUtil.getNowStr()

            updateObj.op_date = op_date

            let data = await think.model(tableName).where({
                order_id:['in',order_id_array]
            }).update(updateObj).catch(e => {
                throw new Error(e)
            });

            logger.info(`根据订单id数组更新数据，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `根据订单id数组更新数据异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
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

    /**
     * 将订单设置为已过期
     * @param order_id
     * @returns {Promise<number>}
     */
    async expire(order_id) {

        try {
            let op_date = DateUtil.getNowStr()

            updateObj.op_date = op_date

            let data = await think.model(tableName).where({
                order_id
            }).update({
                state:ORDER_STATE.EXPIRED
            }).catch(e => {
                throw new Error(e)
            });

            logger.info(`将订单设置为已过期数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `将订单设置为已过期异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }

    },

    /**
     * 将订单设置为已完结
     * @param order_id
     * @returns {Promise<number>}
     */
    async done(order_id) {

        try {
            let op_date = DateUtil.getNowStr()

            updateObj.op_date = op_date

            let data = await think.model(tableName).where({
                order_id
            }).update({
                state:ORDER_STATE.DONE
            }).catch(e => {
                throw new Error(e)
            });

            logger.info(`将订单设置为已完结数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `将订单设置为已完结异常 msg:${e}`
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
