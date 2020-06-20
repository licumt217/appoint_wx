const schedule = require('node-schedule');

const orderService =  require('../service/order');
const appointmentService =  require('../service/appointment');

const ORDER_STATE = require('../config/constants/ORDER_STATE')
const APPOINTMENT_STATE = require('../config/constants/APPOINTMENT_STATE')
const PAY_MANNER = require('../config/constants/PAY_MANNER')
const APPOINTMENT_MULTI = require('../config/constants/APPOINTMENT_MULTI')
const ORDER_GENERATED_NEXT = require('../config/constants/ORDER_GENERATED_NEXT')
const DateUtil = require('../util/DateUtil')
const logger = think.logger
const job='1 46 * * * *';


const  scheduleCronstyle = async ()=>{
    schedule.scheduleJob(job,async ()=>{
        logger.info(`定时任务开始执行：`)
        await scheduleOrder();
        // await scheduleAppointment();
    });
}


/**
 * 每小时执行任务，订单：
 */
const scheduleOrder=async ()=>{
    await handleCommitedOrders();
    // await handlePayedOrders();
}

/**
 * 每小时执行任务，预约：
 */
const scheduleAppointment=async ()=>{
    await handleCommitedAppointments();
}

/**
 * 已下单
 * 1、咨询师超过24小时未处理，默认拒绝
 * @returns {Promise<void>}
 */
const handleCommitedAppointments=async ()=>{
    let appointments=await appointmentService.getList({
        'state':APPOINTMENT_STATE.COMMIT
    });

    logger.info(`已提交状态预约数:${appointments.length}`)

    if(appointments && appointments.length>0){
        for(let i=0;i<appointments.length;i++){
            let appointment=appointments[i]
            let create_date=new Date(appointment.create_date);
            if(DateUtil.beforeNowMoreThanOneDay(create_date)){
                await appointmentService.reject(appointment.appointment_id)
            }
        }
    }
}


/**
 * 已支付：
 * 1、预约前按单支付：超过预约结束时间，如果是持续预约，则生成新单子；否则单子状态设置为已完结，同时预约设置为已完结。
 * 2、预约后按单支付：超过预约结束时间24小时，如果是持续预约，则生成新单子；否则单子状态设置为已完结,同时预约设置为已完结。
 * 3、预约后按月支付：不处理
 * @returns {Promise<void>}
 */
const handlePayedOrders=async ()=>{
    let orders=await orderService.getList({
        'appoint_order.state':ORDER_STATE.PAYED
    });

    logger.info(`已支付状态订单数:${orders.length}`)

    if(orders && orders.length>0){
        let appointment=await appointmentService.getById(orders[0].appointment_id)

        for(let i=0;i<orders.length;i++){
            let order=orders[i]

            if(order.pay_manner===PAY_MANNER.BEFORE_SINGLE){
                let order_date=new Date(order.order_date);

                if(DateUtil.isOrderExpired(order_date,order.period)){
                    if(appointment.ismulti===APPOINTMENT_MULTI.SINGLE){
                        await orderService.done(order.order_id)
                        await appointmentService.done(order.appointment_id)
                    }else{
                        await orderService.add(order.appointment_id)
                    }
                }

            }else if(order.pay_manner===PAY_MANNER.AFTER_SINGLE){
                let order_date=new Date(order.order_date);
                //未精确到具体时段。暂时以天计算
                if(DateUtil.beforeNowMoreThanOneDay(order_date)){
                    if(appointment.ismulti===APPOINTMENT_MULTI.SINGLE){
                        await orderService.done(order.order_id)
                        await appointmentService.done(order.appointment_id)
                    }else{
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
const handleCommitedOrders=async ()=>{
    let orders=await orderService.getList({
        'appoint_order.state':ORDER_STATE.COMMIT
    });

    logger.info(`已下单状态订单数:${orders.length}`)

    if(orders && orders.length>0){
        for(let i=0;i<orders.length;i++){
            let order=orders[i]

            if(order.pay_manner===PAY_MANNER.BEFORE_SINGLE){
                let order_date=new Date(order.order_date);
                let now_date=new Date();
                //未精确到具体时段。暂时以天计算
                if(DateUtil.before(order_date,now_date)){
                    await orderService.expire(order.order_id)
                    await appointmentService.done(order.appointment_id)
                }
            }else if(order.pay_manner===PAY_MANNER.AFTER_SINGLE){
                let order_date=new Date(order.order_date);

                if(DateUtil.beforeNowMoreThanOneDay(order_date)){
                    await orderService.expire(order.order_id)
                    await appointmentService.done(order.appointment_id)
                }
            }else if(order.pay_manner===PAY_MANNER.AFTER_MONTH){
                let order_date=new Date(order.order_date);
                if(DateUtil.beforeNowMoreThanOneDay(order_date) && order.generated_next===ORDER_GENERATED_NEXT.NO){
                    await orderService.update({
                        order_id:order.order_id
                    },{
                        generated_next:ORDER_GENERATED_NEXT.YES
                    })
                    await orderService.add(order.appointment_id)
                }
            }
        }
    }
}

scheduleCronstyle();