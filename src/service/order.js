const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatUtil = require('../util/WechatUtil')
const logger = think.logger
const entityName = '订单'
const tableName = 'order'
const appointmentService = require('../service/appointment')
const payRecordService = require('../service/payRecord')
const divisionService = require('../service/division')
const divisionAdminRelationService = require('../service/divisionAdminRelation')
const stationService = require('../service/station')
const ORDER_STATE = require('../config/constants/ORDER_STATE')
const APPOINTMENT_MULTI = require('../config/constants/APPOINTMENT_MULTI')
const APPOINTMENT_STATE = require('../config/constants/APPOINTMENT_STATE')
const ROLE=require('../config/constants/ROLE')

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
                'appoint_order.appointment_id': appointment_id
            });

            let obj = this.getAddObj(appointment, orderList)
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
     * 组装新增订单的对象
     * @param appointment
     * @param orderList
     * @returns {{op_date: string, pay_manner, order_date: string, amount, user_id, openid, appointment_id, state, create_date, order_id: string, therapist_id}}
     */
    getAddObj(appointment, orderList) {
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
            appointment_id: appointment.appointment_id,
            pay_manner: appointment.pay_manner,
            room_id:appointment.room_id,
            period:appointment.period,
            function_level:appointment.function_level,
            division_id:appointment.division_id
        }

        return obj;
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

            logger.info(`根据条件查询${entityName}列表返回数量：${data.length}`)

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
                order_id: ['in', order_id_array]
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
     * 根据预约id获取订单记录
     * @param appointment_id
     * @returns {Promise<any>}
     */
    async getListByAppointmentId(appointment_id) {

        try {

            let data = await think.model(tableName).where({
                'appoint_appointment.appointment_id': appointment_id
            }).join([
                ` appoint_user as therapist on therapist.user_id=appoint_order.therapist_id`,
                ` appoint_user as user on user.user_id=appoint_order.user_id`,
                ` appoint_room as room on room.room_id=appoint_order.room_id`,
                ` appoint_appointment on appoint_appointment.appointment_id=appoint_order.appointment_id`
            ]).field(
                `appoint_order.*,
                room.name as room_name,
            appoint_appointment.period,
            user.name as user_name,
            therapist.name as therapist_name `,
            ).select()

            logger.info(`根据预约id获取订单记录，数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据预约id获取订单记录接口异常 msg:${e}`
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
                'appoint_order.state': ['in', [ORDER_STATE.COMMIT, ORDER_STATE.PAYED,ORDER_STATE.PAYING,ORDER_STATE.REFUNDING]],
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
    async getDoneOrderList(role,user_id, page, pageSize) {

        try {

            let ORDER = think.model(tableName)

            ORDER._pk = 'order_id'

            let division_id=null;

            let baseWhereObj={
                state: ORDER_STATE.DONE
            }
            if(role===ROLE.divisionManager){
                division_id=await divisionAdminRelationService.getDivisionIdByAdminId(user_id)

                baseWhereObj.division_id=division_id;

            }else{

                baseWhereObj.therapist_id=user_id;

            }

            let data = await ORDER.where(baseWhereObj).join([
                ` appoint_user as user on user.user_id=appoint_order.user_id`,
                ` appoint_user as therapist on therapist.user_id=appoint_order.therapist_id`,
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
    async getRevenueSum(role,user_id) {

        try {

            let ORDER = think.model(tableName)
            ORDER._pk = 'order_id'

            let monthStart = DateUtil.getFirstDayStrOfCurrentMonth(),
                weekStart = DateUtil.getFirstDayStrOfCurrentWeek(), dateEnd = DateUtil.getNowStr();

            let division_id=null;
            let therapist_id=null;
            let baseWhereObj={
                state: ORDER_STATE.DONE
            }
            let allWhereObj={};
            let monthWhereObj={};
            let weekWhereObj={};
            if(role===ROLE.divisionManager){
                division_id=await divisionAdminRelationService.getDivisionIdByAdminId(user_id)
                allWhereObj=Object.assign(baseWhereObj,{
                    division_id
                })

                monthWhereObj=Object.assign(baseWhereObj,{
                    division_id,
                    order_date: ['between', [monthStart, dateEnd]]
                })

                weekWhereObj=Object.assign(baseWhereObj,{
                    division_id,
                    order_date: ['between', [weekStart, dateEnd]]
                })

            }else{
                therapist_id=user_id;
                allWhereObj=Object.assign(baseWhereObj,{
                    therapist_id
                })

                monthWhereObj=Object.assign(baseWhereObj,{
                    therapist_id,
                    order_date: ['between', [monthStart, dateEnd]]
                })

                weekWhereObj=Object.assign(baseWhereObj,{
                    therapist_id,
                    order_date: ['between', [weekStart, dateEnd]]
                })
            }


            let allAmount = await ORDER.where(allWhereObj).sum('amount')

            let monthAmount = await ORDER.where(monthWhereObj).sum('amount')

            let weekAmount = await ORDER.where(weekWhereObj).sum('amount')

            let data = {
                allAmount: allAmount || 0,
                monthAmount: monthAmount || 0,
                weekAmount: weekAmount || 0
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
                ` appoint_room as room on room.room_id=appoint_order.room_id`,
            ]).field(
                `appoint_order.*,
                room.name as room_name,
            user.* `,
            ).page(page, pageSize).countSelect().catch(e => {
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
     *获取分部对应的订单列表
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getOrderListByDivisionAdminId(division_admin_id, page, pageSize) {

        try {

            let division_id=await divisionAdminRelationService.getDivisionIdByAdminId(division_admin_id)

            let stationIdArray=await stationService.getStationIdArrayByDivisionId(division_id)

            let data = await think.model(tableName).where({
                'appoint_appointment.station_id':['in',stationIdArray]
            }).join({
                table:'appointment',
                join:'inner',
                on:['appointment_id','appointment_id']
            }).join({
                table:'user',
                join:'inner',
                on:['user_id','user_id']
            }).join({
                table:'room',
                join:'inner',
                on:['room_id','room_id']
            }).field(
                `appoint_order.*,
                appoint_room.name as room_name,
            appoint_user.* `,
            ).page(page, pageSize).countSelect().catch(e => {
                throw new Error(e)
            });

            logger.info(`获取分部对应的订单列表数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `获取分部对应的订单列表接口异常 msg:${e}`
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
                order_id: ['in', order_id_array]
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

            let data = await think.model(tableName).where({
                order_id
            }).update({
                state: ORDER_STATE.EXPIRED,
                op_date
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

            let data = await think.model(tableName).where({
                order_id
            }).update({
                state: ORDER_STATE.DONE,
                op_date
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

    /**
     * 取消订单
     * 取消订单后：如果是单次预约，同步将预约设置为已完结；否则，生成下一条订单
     * @param order_id
     * @returns {Promise<number>}
     */
    async cancel(order_id) {

        try {
            let op_date = DateUtil.getNowStr()

            let order = await think.model(tableName).where({order_id}).find();

            let model = think.model(tableName);

            await model.transaction(async () => {
                let data = await model.where({
                    order_id
                }).update({
                    state: ORDER_STATE.CANCELED,
                    cancel_date: op_date,
                    op_date
                }).catch(e => {
                    throw new Error(e)
                });

                let appointmentCate = think.model('appointment').db(model.db())

                const appointment = await appointmentCate.where({appointment_id: order.appointment_id}).find();

                if (appointment.ismulti === APPOINTMENT_MULTI.SINGLE) {

                    data = await appointmentCate.where({
                        appointment_id: order.appointment_id
                    }).update({
                        state: APPOINTMENT_STATE.DONE
                    })
                } else {

                    //添加此条订单具体的预约日期

                    let orderList = await model.where({
                        'appoint_order.appointment_id': order.appointment_id
                    }).join([
                        ` appoint_appointment on appoint_order.appointment_id=appoint_appointment.appointment_id`
                    ]).select().catch(e => {
                        throw new Error(e)
                    });

                    let obj = this.getAddObj(appointment, orderList)
                    data = await model.add(obj).catch(e => {
                        throw new Error(e)
                    });

                    logger.info(`新增${entityName}数据库返回：${JSON.stringify(data)}`)
                }
                return data;
            })
        } catch (e) {
            let msg = `取消订单异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }

    },

    /**
     * 订单退款
     * //TODO 需要使用事务
     * @param order_id
     * @returns {Promise<void>}
     */
    async refund(order_id) {

        try {

            let order=await this.getOne({order_id})

            let payRecord=await payRecordService.getByOutTradeNo(order.out_trade_no)


            let op_date=DateUtil.getNowStr()
            await this.update({
                order_id
            },{
                state:ORDER_STATE.REFUNDING,
                op_date
            });

            let division=await divisionService.getByOrderId(order_id)
            await WechatUtil.refund(division,order.out_trade_no, payRecord.total_fee, order.amount,order.order_id).catch((e) => {
                throw new Error(e)
            })

        } catch (e) {
            let msg = `退款接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }

    }

};
