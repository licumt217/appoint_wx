
const orderService = require('../service/order');
const appointmentService = require('../service/appointment');
const refundRecordService = require('../service/refundRecord');
const payRecordService = require('../service/payRecord');
const divisionService = require('../service/division');
const Util = require('../util/Util');
const WechatUtil = require('../util/WechatUtil');

const ORDER_STATE = require('../config/constants/ORDER_STATE')
const TRADE_STATE = require('../config/constants/TRADE_STATE')
const APPOINTMENT_STATE = require('../config/constants/APPOINTMENT_STATE')
const PAY_MANNER = require('../config/constants/PAY_MANNER')
const APPOINTMENT_MULTI = require('../config/constants/APPOINTMENT_MULTI')
const ORDER_GENERATED_NEXT = require('../config/constants/ORDER_GENERATED_NEXT')
const DateUtil = require('../util/DateUtil')
const logger = think.logger


const scheduleCronstyle = async () => {
        logger.info(`定时任务开始执行：`)
        await scheduleOrder();
        await scheduleAppointment();
        await scheduleRefundQuery()
        await schedulePayingQuery()
}


/**
 * 每小时执行任务，订单：
 */
const scheduleOrder = async () => {
    await handleCommitedOrders();
    await handlePayedOrders();
}

/**
 *退款查询
 * 定时查询退款中的订单，防止有些退款通知没有接收到的问题
 */
const scheduleRefundQuery = async () => {
    let orders = await orderService.getList({
        'appoint_order.state': ORDER_STATE.REFUNDING
    });

    logger.info(`退款中状态订单数:${orders.length}`)

    if (orders && orders.length > 0) {
        for (let i = 0; i < orders.length; i++) {
            let order = orders[i]
            let division=await divisionService.getByOrderId(order.order_id)
            let refundRecord=await refundRecordService.getByOrderId(order.order_id)
            WechatUtil.refundQuery(division,refundRecord.out_refund_no).then(async data=>{

                //验证参数后，更新退款记录
                await think.model('refund_record').where({
                    out_refund_no:refundRecord.out_refund_no
                }).update({
                    out_trade_no:data.out_trade_no,
                    refund_account:data.refund_account||data.refund_account_0,
                    refund_fee:Number(data.refund_fee || data.refund_fee_0)/100,
                    refund_id:data.refund_id||data.refund_id_0,
                    refund_recv_accout:data.refund_recv_accout || data.refund_recv_accout_0,
                    refund_request_source:data.refund_request_source,
                    refund_status:data.refund_status || data.refund_status_0,
                    settlement_refund_fee:Number(data.settlement_refund_fee)/100,
                    settlement_total_fee:Number(data.settlement_total_fee)/100,
                    success_time:data.refund_success_time || data.refund_success_time_0,
                    total_fee:Number(data.total_fee)/100,
                    transaction_id:data.transaction_id,
                })
                logger.info(`定时任务中退款记录更新成功`)

                orderService.update({
                    order_id:order.order_id
                },{
                    state:ORDER_STATE.UNFUNDED,
                    op_date:DateUtil.getNowStr()
                })
            },err=>{
                logger.info(`定时退款查询接口错误：${err}`)
            })

        }
    }
}

/**
 *支付中订单查询
 * 定时查询已下单的订单，防止有些支付通知没有接收到的问题
 */
const schedulePayingQuery = async () => {
    let orders = await orderService.getList({
        'appoint_order.state': ORDER_STATE.COMMIT
    });

    logger.info(`支付中状态订单数:${orders.length}`)

    if (orders && orders.length > 0) {
        for (let i = 0; i < orders.length; i++) {
            let order = orders[i]
            let division=await divisionService.getByOrderId(order.order_id)
            WechatUtil.orderQuery(division,order.out_trade_no).then(async (data)=>{
                if(data.trade_state===TRADE_STATE.SUCCESS){

                    let payRecord=await payRecordService.getByOutTradeNo(order.out_trade_no)

                    let op_date=DateUtil.getNowStr();
                    if(Util.isEmptyObject(payRecord)){
                        let op_date=DateUtil.getNowStr()

                        //在支付记录表添加一条支付记录
                        await think.model('pay_record').add({
                            pay_record_id:Util.uuid(),
                            bank_type: data.bank_type,
                            cash_fee: Number(data.cash_fee) / 100,
                            openid: data.openid,
                            out_trade_no: data.out_trade_no,
                            time_end: data.time_end,
                            total_fee: Number(data.total_fee) / 100,
                            transaction_id: data.transaction_id,
                            mch_id: data.mch_id,
                            is_subscribe: data.is_subscribe,
                            appid: data.appid,
                            trade_type: data.trade_type,
                            op_date
                        })
                    }


                    orderService.update({
                        order_id:order.order_id
                    },{
                        state:ORDER_STATE.PAYED,
                        op_date
                    })
                }

            },err=>{
                logger.info(`定时支付中订单查询接口错误：${err}`)
            })

        }
    }
}

/**
 * 每小时执行任务，预约：
 */
const scheduleAppointment = async () => {
    await handleCommitedAppointments();
}

/**
 * 已下单
 * 1、咨询师超过24小时未处理，默认拒绝
 * @returns {Promise<void>}
 */
const handleCommitedAppointments = async () => {
    let appointments = await appointmentService.getList({
        'state': APPOINTMENT_STATE.COMMIT
    });

    logger.info(`已提交状态预约数:${appointments.length}`)

    if (appointments && appointments.length > 0) {
        for (let i = 0; i < appointments.length; i++) {
            let appointment = appointments[i]
            let create_date = new Date(appointment.create_date);
            if (DateUtil.beforeNowMoreThanOneDay(create_date)) {
                await appointmentService.reject(appointment.appointment_id)
            }
        }
    }
}


/**
 * 已支付：
 * 1、预约前按单支付：超过预约结束时间24小时，如果是持续预约，则生成新单子；否则单子状态设置为已完结,同时预约设置为已完结。
 * 2、预约后按单支付：超过预约结束时间24小时，如果是持续预约，则生成新单子；否则单子状态设置为已完结,同时预约设置为已完结。
 * 3、预约后按月支付：不处理
 * @returns {Promise<void>}
 */
const handlePayedOrders = async () => {
    let orders = await orderService.getList({
        'appoint_order.state': ORDER_STATE.PAYED
    });

    logger.info(`已支付状态订单数:${orders.length}`)

    if (orders && orders.length > 0) {
        let appointment = await appointmentService.getById(orders[0].appointment_id)

        for (let i = 0; i < orders.length; i++) {
            let order = orders[i]

            if (order.pay_manner === PAY_MANNER.BEFORE_SINGLE || order.pay_manner === PAY_MANNER.AFTER_SINGLE) {
                let order_date = new Date(order.order_date);

                if (appointment.ismulti === APPOINTMENT_MULTI.SINGLE) {
                    if (DateUtil.isOrderExpired(order_date, order.period)) {
                        await orderService.done(order.order_id)
                        await appointmentService.done(order.appointment_id)
                    }
                } else {
                    if (DateUtil.beforeNowMoreThanOneDay(order_date)) {
                        await orderService.add(order.appointment_id)
                    }

                }

            }
        }
    }
}
/**
 * 1、已下单（待支付）：
 * 1.1 预约前按单支付，超过预约开始时间，状态改为已过期，同时预约改为已完结。
 * 1.2 预约后按单支付，订单结束后下一天，状态改为已过期，同时预约改为已完结。
 * 1.3 预约后按月支付，订单结束后下一天，如果当前单子没有生成过下一周订单，则自动生成下一条订单，且将是否已生成订单字段更新。
 * @returns {Promise<void>}
 */
const handleCommitedOrders = async () => {
    let orders = await orderService.getList({
        'appoint_order.state': ORDER_STATE.COMMIT
    });

    logger.info(`已下单状态订单数:${orders.length}`)

    if (orders && orders.length > 0) {
        for (let i = 0; i < orders.length; i++) {
            let order = orders[i]

            if (order.pay_manner === PAY_MANNER.BEFORE_SINGLE) {
                let order_date = new Date(order.order_date);
                let now_date = new Date();
                //未精确到具体时段。暂时以天计算
                if (DateUtil.before(order_date, now_date)) {
                    await orderService.expire(order.order_id)
                    await appointmentService.done(order.appointment_id)
                }
            } else if (order.pay_manner === PAY_MANNER.AFTER_SINGLE) {
                let order_date = new Date(order.order_date);

                if (DateUtil.beforeNowMoreThanOneDay(order_date)) {
                    await orderService.expire(order.order_id)
                    await appointmentService.done(order.appointment_id)
                }
            } else if (order.pay_manner === PAY_MANNER.AFTER_MONTH) {
                let order_date = new Date(order.order_date);
                if (DateUtil.beforeNowMoreThanOneDay(order_date) && order.generated_next === ORDER_GENERATED_NEXT.NO) {
                    await orderService.update({
                        order_id: order.order_id
                    }, {
                        generated_next: ORDER_GENERATED_NEXT.YES
                    })
                    await orderService.add(order.appointment_id)
                }
            }
        }
    }
}

// scheduleCronstyle();

module.exports=scheduleCronstyle;