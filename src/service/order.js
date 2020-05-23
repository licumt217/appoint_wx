const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatUtil = require('../util/WechatUtil')
const logger = think.logger
const entityName = '订单'
const tableName = 'order'
const appointmentService = require('../service/appointment')
const ORDER_STATE = require('../config/ORDER_STATE')

module.exports = {


    /**
     *根据预约新增一条对应的订单
     * 只有状态是已审核的预约才可以新建订单
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async add(appointment_id) {

        try {

            const appointment=await appointmentService.getById(appointment_id);

            if(appointment.state!==ORDER_STATE.AUDITED){
                throw new Error(`只有审核通过的预约才能生成订单！`)
            }


            let op_date = DateUtil.getNowStr()

            let obj={
                op_date,
                order_id:Util.uuid(),
                openid:appointment.openid,
                therapist_id:appointment.therapist_id,
                amount:appointment.amount,
                state:ORDER_STATE.COMMIT,
                create_date:op_date,
                appointment_id,
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
     *批量新增
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async addMany(orders) {

        try {


            let data = await think.model(tableName).addMany(orders).catch(e => {
                throw new Error(e)
            });
            ;

            logger.info(`批量新增${entityName}数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `批量新增${entityName}接口异常 msg:${e}`
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
