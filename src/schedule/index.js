const schedule = require('node-schedule');

const orderService =  require('../service/order');
const appointmentService =  require('../service/appointment');

const ORDER_STATE = require('../config/ORDER_STATE')
const FEE_TYPE = require('../config/FEE_TYPE')
const DateUtil = require('../util/DateUtil')
const logger = think.logger
const job='* * 0 * * *';


const  scheduleCronstyle = async ()=>{
    schedule.scheduleJob(job,async ()=>{
        logger.info(`定时任务开始执行：`)
        await scheduleOrder();
        await scheduleAppointment();
    });
}


/**
 * 每小时执行任务，订单：
 * 1、已审核（待支付）：预约前支付，超过预约开始时间，状态改为已取消；预约后支付，订单结束后下一天，如果是连续预约，则自动生成下一条订单。
 * 2、已支付：预约前支付，超过预约结束时间24小时，状态改为已完结。
 */
const scheduleOrder=async ()=>{
    await handleAuditedOrders();
    await handlePayedOrders();
}

/**
 * 每小时执行任务，预约：
 * 1、已下单：咨询师超过24小时未处理，默认拒绝
 */
const scheduleAppointment=async ()=>{
    await handleCommitedAppoments();
}

/**
 * 1、已下单：咨询师超过24小时未处理，默认拒绝
 * @returns {Promise<void>}
 */
const handleCommitedAppoments=async ()=>{
    let appointments=await appointmentService.getList({
        'state':ORDER_STATE.COMMIT
    });

    logger.info(`已下单预约:${appointments}`)

    if(appointments && appointments.length>0){
        for(let i=0;i<appointments.length;i++){
            let appointment=appointments[i]
            let create_date=new Date(appointment.create_date);
            let now_date=new Date();
            //未精确到具体时段。暂时以天计算
            if(DateUtil.before(create_date,DateUtil.addDays(now_date,-1))){
                await appointmentService.update({
                    order_id:appointment.appointment_id
                },{
                    state:ORDER_STATE.REJECTED
                })
            }
        }
    }
}


/**
 * 2、已支付：预约前支付，超过预约结束时间24小时，状态改为已完结。
 * @returns {Promise<void>}
 */
const handlePayedOrders=async ()=>{
    let orders=await orderService.getList({
        'appoint_order.state':ORDER_STATE.PAYED
    });

    logger.info(`已支付订单:${orders}`)

    if(orders && orders.length>0){
        for(let i=0;i<orders.length;i++){
            let order=orders[i]
            if(order.fee_type===FEE_TYPE.BEFORE_SINGLE){
                let order_date=new Date(order.order_date);
                let now_date=new Date();
                //未精确到具体时段。暂时以天计算
                if(DateUtil.before(order_date,now_date)){
                    await orderService.update({
                        order_id:order.order_id
                    },{
                        state:ORDER_STATE.DONE
                    })

                    //如果预约时单次预约，同步将预约设置为已完结
                    await appointmentService.done(order.appointment_id)
                }

            }
        }
    }
}
/**
 * 1、已审核（待支付）：预约前支付，超过预约开始时间，状态改为已取消；预约后支付，订单结束后下一天，如果是连续预约，则自动生成下一条订单。
 * @returns {Promise<void>}
 */
const handleAuditedOrders=async ()=>{
    let orders=await orderService.getList({
        'appoint_order.state':ORDER_STATE.AUDITED
    });

    logger.info(`已审核订单:${orders}`)

    if(orders && orders.length>0){
        for(let i=0;i<orders.length;i++){
            let order=orders[i]
            if(order.fee_type===FEE_TYPE.BEFORE_SINGLE){
                let order_date=new Date(order.order_date);
                let now_date=new Date();
                //未精确到具体时段。暂时以天计算
                if(DateUtil.before(order_date,now_date)){
                    await orderService.update({
                        order_id:order.order_id
                    },{
                        state:ORDER_STATE.CANCELED
                    })
                    //如果预约时单次预约，同步将预约设置为已取消
                    await appointmentService.cancel(order.appointment_id)
                }

            }else if(order.fee_type===FEE_TYPE.AFTER_MONTH || order.fee_type===FEE_TYPE.AFTER_SINGLE){
                let order_date=new Date(order.order_date);

                let now_date=new Date();
                now_date.setDate(now_date.getDate()-1)
                //未精确到具体时段。暂时以天计算。生成一个新的订单
                if(DateUtil.before(order_date,now_date)){
                    await orderService.add(order.appointment_id)
                }
            }
        }
    }
}

scheduleCronstyle();