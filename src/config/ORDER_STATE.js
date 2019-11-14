/**
 * 订单状态
 * @type {{UN_PAY: number, PAYED: number, UNFUNDED: number, CANCELED: number, EXPIRED: number}}
 */
let ORDER_STATE = {
    COMMIT: 0,      //已下单
    AUDITED: 1,      //已审核
    REJECTED: 2,      //已拒绝
    PAYED: 3,       //已支付
    UNFUNDED: 4,    //已退款
    CANCELED: 5,    //已取消
    EXPIRED: 6,     //已过期
    DONE: 7,     //已完结


};



module.exports = ORDER_STATE
