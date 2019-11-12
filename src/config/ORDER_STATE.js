/**
 * 订单状态
 * @type {{UN_PAY: number, PAYED: number, UNFUNDED: number, CANCELED: number, EXPIRED: number}}
 */
let ORDER_STATE = {
    UN_PAYED: 0,      //未支付
    PAYED: 1,       //已支付
    UNFUNDED: 2,    //已退款
    CANCELED: 3,    //已取消
    EXPIRED: 4,     //已过期
    DONE: 5,     //已完结
};



module.exports = ORDER_STATE
