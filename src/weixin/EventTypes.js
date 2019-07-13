module.exports={

    SUBSCRIBE:"subscribe",

    UNSUBSCRIBE:"unsubscribe",

    /**
     * 扫描带参数二维码事件。已关注的人再扫的话是SCAN事件，否则是关注事件
     * 用户扫描带场景值二维码时，可能推送以下两种事件：
     * 如果用户还未关注公众号，则用户可以关注公众号，关注后微信会将带场景值关注事件推送给开发者。
     * 如果用户已经关注公众号，则微信会将带场景值扫描事件推送给开发者。
     */
    SCAN:"SCAN",


    /**
     * 用户地理位置上报
     */
    LOCATION:"LOCATION",

    /**
     * 自定义菜单点击
     */
    CLICK:"CLICK",




}
