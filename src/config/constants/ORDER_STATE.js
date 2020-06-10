/**
 * 订单状态
 * 最终状态：已退款、已过期、已完结、已取消
 * @type {{PAYED: number, UNFUNDED: number, DONE: number, COMMIT: number, EXPIRED: number}}
 */
let ORDER_STATE = {
    COMMIT: 0,      //已下单
    PAYED: 1,       //已支付
    UNFUNDED: 2,    //已退款
    EXPIRED: 3,     //已过期
    CANCELED: 4,     //已取消
    DONE: 5,     //已完结


};



module.exports = ORDER_STATE
