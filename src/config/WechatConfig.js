module.exports={

    APP_ID:"wx983e6f0f3345a6c6",

    SECRET:"bccf7d2d46b446ec5749fc173f1e051b",

    URL_OF_GET_ACCESS_TOKEN:"https://api.weixin.qq.com/cgi-bin/token",

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
    MCH_ID:"1494200172",

    /**
     * 微信支付下单URL
     */
    URL_OF_UNIFIED_ORDER:"https://api.mch.weixin.qq.com/pay/unifiedorder",

    /**
     * 微信支付通知URL
     * 异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
     */
    URL_OF_NOTIFY_URL:"http://47.92.74.29/appoint_wx/wechatApi/payNotifyUrl",



}
