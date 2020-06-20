/**
 * 订单是否已经根据当前单子生成过下一周的订单
 * 主要用于定时任务中，需要监控未支付的订单，如果是预约后按月支付的话，需要自动生成下一周的单子
 * @type {{NO: number, YES: number}}
 */
let ORDER_GENERATED_NEXT = {
    NO: 0,      //未生成
    YES: 1,       //已生成


};



module.exports = ORDER_GENERATED_NEXT
