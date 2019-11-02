const Base = require('./base.js');

const WechatUtil = require('../../util/WechatUtil')
const WechatConfig = require('../../config/WechatConfig')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const SignUtil = require('../../util/SignUtil')
const Response = require('../../config/response')
const orderService = require('../../service/order')
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

        let code = this.get('code')

        logger.info(`根据code获取openid参数 code:${code}`);

        try {

            let response = await WechatUtil.getOpenid(code);

            this.body = response;

        } catch (e) {
            logger.info(`根据code获取openid异常 msg:${JSON.stringify(e)}`);
            this.body = e;
        }


    }


    /**
     * 异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
     * @returns {Promise<void>}
     */
    async payNotifyUrlAction() {

        try {

            let returnData = Util.obj2xml({
                return_code: "SUCCESS",
                return_msg: "OK"
            })

            const params = this.post();

            logger.info(`异步接收微信支付结果通知参数：${JSON.stringify(params)}`)

            let flag = WechatUtil.checkWechatMessageSignature(params.xml)

            logger.info(`异步接收微信支付结果通知验证签名结果：${flag}`)

            if (flag) {

                let data = params.xml;

                let out_trade_no = data.out_trade_no;

                let response = await orderService.getOrderById(out_trade_no)


                if (response.isSuccessful()) {

                    let order = response.data;

                    //只有订单状态是未支付时，将状态设置为已支付
                    if (order.state === 0) {

                        logger.info("更改订单状态")

                        await this.model('order').where({
                            id: order.id
                        }).update({
                            state: 1
                        })

                        logger.info("添加支付记录")

                        //在支付记录表添加一条支付记录
                        await this.model('pay_record').add({
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
                            trade_type: data.trade_type
                        })

                        this.body = returnData
                    } else {
                        logger.info("当前订单状态不需要更新")
                        this.body = returnData
                    }

                } else {
                    logger.info(response.errorMsg)
                    this.body = returnData
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
     * 异步接收微信退款结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
     * 退款结果对重要的数据进行了加密，商户需要用商户秘钥进行解密后才能获得结果通知的内容
     * @returns {Promise<void>}
     */
    async refundNotifyUrlAction() {


        let return_code = this.post('xml').return_code[0]


        console.log("退款通知内容：" + JSON.stringify(this.post()))


        if (return_code === "SUCCESS") {

            let req_info = this.post('xml').req_info[0]

            console.log('222222')

            req_info = WechatUtil.decryptRefundNotifyParam(req_info);

            console.log("解密出来的内容：" + req_info)
            console.log("解密出来的内容：" + JSON.stringify(req_info))


            //验证参数后，更改数据库中的订单状态，改为已退款之类的等

            this.body = Util.obj2xml({
                return_code: "SUCCESS",
                return_msg: "OK"
            });
        } else {

            this.body = Util.obj2xml({
                return_code: "FAIL",
                return_msg: ""
            });
        }


    }


    /**
     * 退款
     * @returns {Promise<void>}
     */
    async refundAction() {

        let out_trade_no = this.post('out_trade_no')
        let out_refund_no = this.post('out_refund_no')
        let total_fee = Number(this.post('total_fee')) * 100
        let refund_fee = Number(this.post('refund_fee')) * 100
        let notify_url = this.post('notify_url')


        let data = await WechatUtil.refund(out_trade_no, out_refund_no, total_fee, refund_fee, notify_url);

        this.body = Response.success(data);

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

        let trade_state = await WechatUtil.orderQuery(out_trade_no);

        this.body = Response.success(trade_state);

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
     * @returns {Promise<void>}
     */
    async getJsSdkSignatureAction() {

        let url = this.post('url')

        let signatureObj = await WechatUtil.getJsSdkSignature(url);

        this.body = Response.success(signatureObj);

    }


}



