const Base = require('./base.js');

const WechatUtil = require('../../util/WechatUtil')
const WechatConfig = require('../../config/WechatConfig')
const Util = require('../../util/Util')
const SignUtil = require('../../util/SignUtil')




module.exports = class extends Base {

    /**
     * 验证消息来自微信服务器
     */
    async getAccessTokenAction() {

        this.body = WechatUtil.getAccessToken();

    }

    /**
     * 根据code获取openId
     * @param code
     * @returns {Promise<void>}
     */
    async getOpenIdAction() {

        // 我的openID，对应一圈一圈的。

        // ohZcctykmVT2Lx3eOTX-DQKKwomw

        let code =this.get('code')

        let openId = await WechatUtil.getOpenId(code);

        this.body = openId;
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

        let return_code=this.post('return_code')
        let return_msg=this.post('return_msg')
        let transaction_id=this.post('transaction_id')
        let out_trade_no=this.post('out_trade_no')
        let total_fee=this.post('total_fee')

        //接收通知后，更改数据库中的订单状态，改为已支付等

        this.body=Util.obj2xml({
            return_code:"SUCCESS",
            return_msg:"OK"
        });

    }

    /**
     * 异步接收微信退款结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
     * 退款结果对重要的数据进行了加密，商户需要用商户秘钥进行解密后才能获得结果通知的内容
     * @returns {Promise<void>}
     */
    async refundNotifyUrlAction(){

        let return_code=this.post('return_code')
        let return_msg=this.post('return_msg')
        let req_info=this.post('req_info')//需要解密


        req_info=WechatUtil.decryptRefundNotifyParam(req_info);

        //验证参数后，更改数据库中的订单状态，改为已退款之类的等

        this.body=Util.obj2xml({
            return_code:"SUCCESS",
            return_msg:"OK"
        });

    }

    /**
     * 微信支付统一下单接口
     * @returns {Promise<void>}
     */
    async unifiedOrderAction(){

        let prepay_id=await WechatUtil.unifiedOrder("xxxxx",2,this.ip)

        this.body=WechatUtil.getJsApiPaySign(prepay_id);

    }


    /**
     * 退款
     * @returns {Promise<void>}
     */
    async refundAction(){

        let out_trade_no=""
        let out_refund_no=""
        let total_fee=""
        let refund_fee=""


        await WechatUtil.refund(out_trade_no,out_refund_no,total_fee,refund_fee);

        this.body=null;

    }

    /**
     * 查询订单接口
     * @returns {Promise<void>}
     */
    async orderQueryAction(out_trade_no){

        let json=await WechatUtil.orderQuery(out_trade_no);

        this.body=data;

    }

    /**
     * 发送客服消息，默认文本消息
     * @returns {Promise<void>}
     */
    async sendCustomerServiceMsgAction(){

        let json=await WechatUtil.sendCustomerServiceMsg(null,"你好啊");

        this.body=json;

    }

    /**
     * 前端调用微信jssdk 时要用到的签名
     * @returns {Promise<void>}
     */
    async getJsSdkSignatureAction(){

        let url=this.post('url')

        let signatureObj=await WechatUtil.getJsSdkSignature(url);

        this.body=signatureObj;

    }




}



