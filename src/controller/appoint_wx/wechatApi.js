const Base = require('./base.js');

const WechatUtil = require('../../util/WechatUtil')
const WechatConfig = require('../../config/WechatConfig')
const ORDER_STATE = require('../../config/constants/ORDER_STATE')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const SignUtil = require('../../util/SignUtil')
const Response = require('../../config/response')
const orderService = require('../../service/order')
const payRecordService = require('../../service/payRecord')
const logger = think.logger;


module.exports = class extends Base {

    /**
     * 验证消息来自微信服务器
     */
    async getAccessTokenAction() {

        this.body = await WechatUtil.getAccessToken();

    }

    /**
     * 根据code获取openid
     * @param code
     * @returns {Promise<void>}
     */
    async getOpenidAction() {

        let code = this.post('code')

        logger.info(`根据code获取openid参数 :${JSON.stringify(this.post())}`);

        try {

            let openid = await WechatUtil.getOpenid(code);

            this.body = Response.success(openid);

        } catch (e) {
            logger.info(`根据code获取openid异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
     * @returns {Promise<void>}
     */
    async payNotifyUrlAction() {

        this.handlePayNotifyCommon(this.post())

    }

    async handlePayNotifyCommon(params,isServiceMerchantModel){
        try {

            let returnData = Util.obj2xml({
                return_code: "SUCCESS",
                return_msg: "OK"
            })

            logger.info(`异步接收微信支付结果通知参数：${JSON.stringify(params)}，是否服务商：${!!isServiceMerchantModel}`)

            let flag = WechatUtil.checkWechatMessageSignature(params.xml,isServiceMerchantModel)

            logger.info(`异步接收微信支付结果通知验证签名结果：${flag}`)

            if (flag) {
                this.body = returnData

                let data = params.xml;

                let out_trade_no = data.out_trade_no;

                logger.info("更改订单状态")

                await orderService.update({out_trade_no},{state: ORDER_STATE.PAYED});

                logger.info("添加支付记录")

                let payRecord=await payRecordService.getByOutTradeNo(out_trade_no)
                if(Util.isEmptyObject(payRecord)){
                    let op_date=DateUtil.getNowStr()

                    //在支付记录表添加一条支付记录
                    await this.model('pay_record').add({
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

            } else {

                logger.info("支付回调签名错误！")

                this.body = returnData
            }

        } catch (e) {
            logger.info(`异步接收微信支付结果通知异常：${e}`)
        }
    }

    /**
     * 异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。[服务商模式]
     * @returns {Promise<void>}
     */
    async payNotifyUrlOfSmmAction() {

        this.handlePayNotifyCommon(this.post(),true)


    }

    /**
     * 异步接收微信退款结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
     * 退款结果对重要的数据进行了加密，商户需要用商户秘钥进行解密后才能获得结果通知的内容
     * @returns {Promise<void>}
     */
    async refundNotifyUrlAction() {

        this.handleRefundNotifyCommon(this.post(),this.post('xml'))





    }

    async handleRefundNotifyCommon(params,xml,isServiceMerchantModel){
        try{
            let return_code = xml.return_code[0]


            logger.info("退款通知内容：" + JSON.stringify(params))


            if (return_code === "SUCCESS") {


                let req_info = xml.req_info[0]

                const data = WechatUtil.decryptRefundNotifyParam(req_info,isServiceMerchantModel);

                logger.info("解密出来的内容：" + JSON.stringify(data))

                this.body = Util.obj2xml({
                    return_code: "SUCCESS",
                    return_msg: "OK"
                });

                //如果库里已经记录过了，则直接返回成功

                let record = await this.model('refund_record').where({
                    out_refund_no:data.out_refund_no
                }).find()

                //验证参数后，更新退款记录
                await this.model('refund_record').where({
                    out_refund_no:data.out_refund_no
                }).update({
                    out_refund_no:data.out_refund_no,
                    out_trade_no:data.out_trade_no,
                    refund_account:data.refund_account,
                    refund_fee:Number(data.refund_fee)/100,
                    refund_id:data.refund_id,
                    refund_recv_accout:data.refund_recv_accout,
                    refund_request_source:data.refund_request_source,
                    refund_status:data.refund_status,
                    settlement_refund_fee:Number(data.settlement_refund_fee)/100,
                    settlement_total_fee:Number(data.settlement_total_fee)/100,
                    success_time:data.success_time,
                    total_fee:Number(data.total_fee)/100,
                    transaction_id:data.transaction_id,
                })
                logger.info(`退款记录更新成功`)

                //将订单状态改为已退款
                await orderService.update({
                    order_id:record.order_id
                },{

                    state:ORDER_STATE.UNFUNDED
                })

            } else {

                this.body = Util.obj2xml({
                    return_code: "FAIL",
                    return_msg: ""
                });
            }
        }catch (e) {
            logger.error(`退款通知接口异常：${e}`)
            this.body = Util.obj2xml({
                return_code: "FAIL",
                return_msg: ""
            });
        }
    }

    /**
     * 异步接收微信退款结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。[服务商模式]
     * 退款结果对重要的数据进行了加密，商户需要用商户秘钥进行解密后才能获得结果通知的内容
     * @returns {Promise<void>}
     */
    async refundNotifyUrlOfSmmAction() {

        this.handleRefundNotifyCommon(this.post(),this.post('xml'),true)





    }


    /**
     * 查询退款
     * @returns {Promise<void>}
     */
    async refundQueryAction() {

        //商户退款订单号
        let out_refund_no = this.post('out_refund_no')

        let data = await WechatUtil.refundQuery(out_refund_no);

        this.body = Response.success(data);

    }

    /**
     * 查询订单接口
     * @returns {Promise<void>}
     */
    async orderQueryAction() {

        let out_trade_no = this.post("out_trade_no")

        console.log("订单查询订单号：" + out_trade_no)

        let json = await WechatUtil.orderQuery(out_trade_no);

        this.body = Response.success(json);

    }

    /**
     * 发送客服消息，默认文本消息
     * @returns {Promise<void>}
     */
    async sendCustomerServiceMsgAction() {

        let json = await WechatUtil.sendCustomerServiceMsg(null, "你好啊");

        this.body = Response.success(json);

    }

    /**
     * 前端调用微信jssdk 时要用到的签名
     * 例如分享朋友圈等，暂时没有使用
     * @returns {Promise<void>}
     */
    async getJsSdkSignatureAction() {

        let url = this.post('url')

        let signatureObj = await WechatUtil.getJsSdkSignature(url);

        this.body = Response.success(signatureObj);

    }


}



