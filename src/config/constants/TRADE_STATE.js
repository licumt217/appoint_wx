/**
 * 支付交易状态
 * @type {{REVOKED: string, REFUND: string, SUCCESS: string, CLOSED: string, PAYERROR: string, USERPAYING: string, NOTPAY: string}}
 */
let TRADE_STATE = {
    SUCCESS: "SUCCESS",      //支付成功
    REFUND: "REFUND",      //转入退款
    NOTPAY: "NOTPAY",      //未支付
    CLOSED: "CLOSED",      //已关闭
    REVOKED: "REVOKED",      //已撤销（付款码支付）
    USERPAYING: "USERPAYING",      //用户支付中（付款码支付）
    PAYERROR: "PAYERROR",      //支付失败(其他原因，如银行返回失败)


};



module.exports = TRADE_STATE
