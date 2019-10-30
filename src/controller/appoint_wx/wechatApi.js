const Base = require('./base.js');

const WechatUtil = require('../../util/WechatUtil')
const WechatConfig = require('../../config/WechatConfig')
const Util = require('../../util/Util')
const SignUtil = require('../../util/SignUtil')
const Response = require('../../config/response')




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

        let code =this.get('code')

        think.logger.info(`根据code获取openid参数 code:${code}`);

        try{

            let response = await WechatUtil.getOpenid(code);

            this.body = response;

        }catch (e) {
            think.logger.info(`根据code获取openid异常 msg:${JSON.stringify(e)}`);
            this.body = e;
        }


    }



    /**
     * 发送模板消息
     * @param openId
     * @param templateName 根据模板名称获取对应的模板ID
     * @param dataArray 模板的数据数组，数组中是对象，每个对象有value和color两个属性，color可以没有，没有的话用系统默认
     * @param url 可以为空，空的话不跳转
     * @param top 顶部提示文字
     * @param bottom 底部提示文字
     * @returns {Promise<any>}
     */
    async sendTemplateMsgAction(){

        let openId=this.post("openId")
        let templateName=this.post("templateName")
        let dataArray=this.post("dataArray")
        let url=this.post("url")
        let top=this.post("top")
        let bottom=this.post("bottom")

        let data= await WechatUtil.sendTemplateMsg(openId,templateName,dataArray,url,top,bottom);

        this.body=data;

    }

    /**
     * 异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
     * @returns {Promise<void>}
     */
    async payNotifyUrlAction(){

        console.log("支付结果通知：")
        console.log("支付结果通知："+this.post())
        console.log("支付结果通知："+JSON.stringify(this.post()))

        let flag=WechatUtil.checkWechatMessageSignature(this.post().xml)

        if(flag){

            let json=this.post().xml;

            let out_trade_no=json.out_trade_no;

            //TODO 更新支付订单的状态，存储微信订单号等


            this.body=Util.obj2xml({
                return_code:"SUCCESS",
                return_msg:"OK"
            });
        }else{
            this.body=Response.businessException("支付回调签名错误！")
        }



    }

    /**
     * 异步接收微信退款结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
     * 退款结果对重要的数据进行了加密，商户需要用商户秘钥进行解密后才能获得结果通知的内容
     * @returns {Promise<void>}
     */
    async refundNotifyUrlAction(){

        console.log("-------")
        console.log(JSON.stringify(this.post()))

        let return_code=this.post('xml').return_code[0]


        console.log("退款通知内容："+JSON.stringify(this.post()))


        if(return_code==="SUCCESS"){

            let req_info=this.post('xml').req_info[0]

            console.log('222222')

            req_info=WechatUtil.decryptRefundNotifyParam(req_info);

            console.log("解密出来的内容："+req_info)
            console.log("解密出来的内容："+JSON.stringify(req_info))


            //验证参数后，更改数据库中的订单状态，改为已退款之类的等

            this.body=Util.obj2xml({
                return_code:"SUCCESS",
                return_msg:"OK"
            });
        }else{

            this.body=Util.obj2xml({
                return_code:"FAIL",
                return_msg:""
            });
        }





    }

    /**
     * 微信支付统一下单接口
     * @returns {Promise<void>}
     */
    async unifiedOrderAction(){

        let openid=this.post('openid')
        let out_trade_no=this.post('out_trade_no')
        let total_fee=Number(this.post('total_fee'))*100

        let prepay_id=await WechatUtil.unifiedOrder(openid,out_trade_no,total_fee,this.ip)

        this.body=Response.success(WechatUtil.getJsApiPaySign(prepay_id));

    }


    /**
     * 退款
     * @returns {Promise<void>}
     */
    async refundAction(){

        let out_trade_no=this.post('out_trade_no')
        let out_refund_no=this.post('out_refund_no')
        let total_fee=Number(this.post('total_fee'))*100
        let refund_fee=Number(this.post('refund_fee'))*100
        let notify_url=this.post('notify_url')


        let data=await WechatUtil.refund(out_trade_no,out_refund_no,total_fee,refund_fee,notify_url);

        this.body=Response.success(data);

    }

    /**
     * 查询退款
     * @returns {Promise<void>}
     */
    async refundQueryAction(){

        //商户退款订单号
        let out_refund_no=this.post('out_refund_no')

        let data=await WechatUtil.refundQuery(out_refund_no);

        this.body=Response.success(data);

    }

    /**
     * 查询订单接口
     * @returns {Promise<void>}
     */
    async orderQueryAction(){

        let out_trade_no=this.post("out_trade_no")

        console.log("订单查询订单号："+out_trade_no)

        let trade_state=await WechatUtil.orderQuery(out_trade_no);

        this.body=Response.success(trade_state);

    }

    /**
     * 发送客服消息，默认文本消息
     * @returns {Promise<void>}
     */
    async sendCustomerServiceMsgAction(){

        let json=await WechatUtil.sendCustomerServiceMsg(null,"你好啊");

        this.body=Response.success(json);

    }

    /**
     * 前端调用微信jssdk 时要用到的签名
     * @returns {Promise<void>}
     */
    async getJsSdkSignatureAction(){

        let url=this.post('url')

        let signatureObj=await WechatUtil.getJsSdkSignature(url);

        this.body=Response.success(signatureObj);

    }




}



