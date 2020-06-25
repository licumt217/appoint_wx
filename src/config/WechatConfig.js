module.exports={

    APP_ID:"wxb4a0f8c89361efe2",

    SECRET:"9baa2dca71483cb0c268d2d332d20219",

    /**
     * 普通商户ID
     */
    MCH_ID:"1545814681",

    /**
     * 服务商模式下的商户ID
     */
    MCH_ID_OF_SERVICE_MERCHANT:"1573357691",

    /**
     * 商户平台秘钥key
     */
    KEY:"xinhangtuadmin007xinhangtuadmin0",
    /**
     * 服务商模式下的KEY
     */
    SERVICE_MERCHANT_KEY:"klmxue202ad35ei93xnmqb3148ypc247",

    /**
     * 接口调用token
     */
    URL_OF_GET_ACCESS_TOKEN:"https://api.weixin.qq.com/cgi-bin/token",

    /**
     * jsapi_ticket
     */
    URL_OF_GET_JSAPI_TICKET:"https://api.weixin.qq.com/cgi-bin/ticket/getticket",

    /**
     * 返回access_token和openId,网页授权接口调用凭证,注意：此access_token与基础支持的access_token不同
     */
    URL_OF_GET_OPENID:"https://api.weixin.qq.com/sns/oauth2/access_token",

    /**
     * 发送模板消息
     */
    URL_OF_SEND_TEMPLATE_MSG:"https://api.weixin.qq.com/cgi-bin/message/template/send",

    /**
     * 加解密用的，在公众号后台配置的
     */
    TOKEN:"tingcheeasy",

    /**
     * 模板消息默认字体颜色
     */
    DEFAULT_COLOR:"#173177",

    /**
     * 商户号
     */
    MCH_ID:"1545814681",

    /**
     * 微信支付下单URL
     */
    URL_OF_UNIFIED_ORDER:"https://api.mch.weixin.qq.com/pay/unifiedorder",

    /**
     * 微信退款接口
     */
    URL_OF_REFUND:"https://api.mch.weixin.qq.com/secapi/pay/refund",
    /**
     * 微信退款查询接口
     */
    URL_OF_REFUND_QUERY:"https://api.mch.weixin.qq.com/pay/refundquery",

    /**
     * 微信查询订单接口
     */
    URL_OF_ORDER_QUERY:"https://api.mch.weixin.qq.com/pay/orderquery",

    /**
     * 发送客服消息接口
     */
    URL_OF_CUSTOMER_SERVICE_MSG:"https://api.weixin.qq.com/cgi-bin/message/custom/send",


    /**
     * 微信支付通知URL
     * 异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
     */
    URL_OF_NOTIFY_URL:"http://www.zhuancaiqian.com/appoint_wx/wechatApi/payNotifyUrl",

    /**
     * 微信支付通知URL(服务商模式)
     * Smm:ServiceMerchantModel
     * 异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
     */
    URL_OF_NOTIFY_URL_OF_SMM:"http://www.zhuancaiqian.com/appoint_wx/wechatApi/payNotifyUrlOfSmm",

    /**
     * 退款通知URL
     */
    URL_OF_REFUND_NOTIFY_URL:"http://www.zhuancaiqian.com/appoint_wx/wechatApi/refundNotifyUrl",

    /**
     * 退款通知URL(服务商模式)
     * Smm:ServiceMerchantModel
     */
    URL_OF_REFUND_NOTIFY_URL_OF_SMM:"http://www.zhuancaiqian.com/appoint_wx/wechatApi/refundNotifyUrlOfSmm",



}
