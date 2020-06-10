const request = require('request');
const WechatConfig = require('../config/WechatConfig')

let buttons={
    "button": [
        {
            "type": "view",
            "name": "我的预约",
            "url": getAuthUrl(WechatConfig.APP_ID,'http://www.zhuancaiqian.com/appointmobile/appoint/myAppoint')
        },
        {
            "type": "view",
            "name": "预约历史",
            "url": getAuthUrl(WechatConfig.APP_ID,'http://www.zhuancaiqian.com/appointmobile/appoint/history')
        },
        {
            "name": "个人中心",
            "sub_button": [
                {
                    "type": "view",
                    "name": "个人信息",
                    "url": getAuthUrl(WechatConfig.APP_ID,'http://www.zhuancaiqian.com/appointmobile/user/center')
                },
                {
                    "type": "view",
                    "name": "设置",
                    "url": getAuthUrl(WechatConfig.APP_ID,'http://www.zhuancaiqian.com/appointmobile/user/setting')
                },
            ]
        },
    ]
}

function getAuthUrl(appId,url){

    if(url.indexOf("?")>-1){
        url=encodeURIComponent(url.split('?')[0])+url.split("?")[1]
    }else{
        url=encodeURIComponent(url)
    }




    return `https://open.weixin.qq.com/connect/oauth2/authorize?appId=${appId}&redirect_uri=${url}&response_type=code&scope=snsapi_base&state=about#wechat_redirect`
}

request.get(`http://www.zhuancaiqian.com/appoint_wx/wechatApi/getAccessToken`, (error, response, body) => {

    if (error) {
        console.log("获取token出错")
    } else {

        request.post(
            {
                url:`https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${body}`,
                form:JSON.stringify(buttons)
            },
            (error, response, body)=>{
                if (error) {
                    console.log("生成菜单出错")
                } else {

                    console.log(body)
                }
            }
        )

    }
})






