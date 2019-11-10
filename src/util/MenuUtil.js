const request = require('request');
const WechatConfig = require('../config/WechatConfig')

let buttons={
    "button": [
        {
            "name": "扫码",
            "sub_button": [
                {
                    "type": "scancode_waitmsg",
                    "name": "扫码带提示",
                    "key": "rselfmenu_0_0",
                    "sub_button": [ ]
                },
                {
                    "type": "scancode_push",
                    "name": "扫码推事件",
                    "key": "rselfmenu_0_1",
                    "sub_button": [ ]
                }
            ]
        },
        {
            "name": "发送位置",
            "type": "location_select",
            "key": "rselfmenu_2_0"
        },
        {
            "type": "view",
            "name": "测试菜单2",
            "url": getAuthUrl(WechatConfig.APP_ID,'http://www.zhuancaiqian.com/appointmobile/myAppoint')
        }
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






