const request = require('request');

const WechatConfig=require("../config/WechatConfig")

const WechatTemplates=require("../config/WechatTemplates")

const SignUtil = require('./SignUtil')

const BaseUtil = require('./Util')

const MsgTypes = require("../weixin/MsgTypes")
const EventTypes = require("../weixin/EventTypes")

const fs = require("fs")
const path = require("path")

schedule = require('node-schedule')

let scheduleJob=null;

let scheduleJobOfJsapiTicket=null;


let Util={
    /**
     * 获取token
     * 基础支持的token
     * @returns {Promise<any>}
     */
    getAccessToken:async ()=> {

        let token=null;

        console.log(__dirname)

        //说明执行过此方法，直接文件中获取token
        if(scheduleJob){

            token=fs.readFileSync(path.join(__dirname,'../config/access_token'));

        }else{//首次进入，通过接口获取

            token = await Util.realGetAccessToken();

            fs.writeFileSync(path.join(__dirname,'../config/access_token'), token);

            console.log("-------->access_token写入文件，然后每100分钟刷新token");

            scheduleJob=schedule.scheduleJob('* 30 * * * *', async ()=>{
                token = await Util.realGetAccessToken();

                fs.writeFileSync(path.join(__dirname,'../config/access_token'), token);
            })
        }

        return token;

    },

    /**
     * 获取token
     * 基础支持的token
     * @returns {Promise<any>}
     */
    realGetAccessToken:()=> {

        return new Promise(((resolve, reject) => {
            request.get(`${WechatConfig.URL_OF_GET_ACCESS_TOKEN}?grant_type=client_credential&appid=${WechatConfig.APP_ID}&secret=${WechatConfig.SECRET}`, (error, response, body) => {

                if (error) {
                    console.log(error)
                    resolve(null)
                } else {

                    resolve(JSON.parse(body).access_token)
                }
            })
        }))

    },

    /**
     * 获取jsapi_ticket
     * @returns {Promise<*>}
     */
    getJsapiTicket:async ()=> {

        let jsapiTicket=null;

        //说明执行过此方法，直接文件中获取token
        if(scheduleJobOfJsapiTicket){

            jsapiTicket=fs.readFileSync(path.join(__dirname,'../config/jsapi_ticket'));

        }else{//首次进入，通过接口获取

            jsapiTicket = await Util.realGetJsapiTicket();

            fs.writeFileSync(path.join(__dirname,'../config/jsapi_ticket'), jsapiTicket);

            console.log("-------->jsapi_ticket写入文件，然后每100分钟刷新jsapi_ticket")

            scheduleJobOfJsapiTicket=schedule.scheduleJob('* 40 * * * *', async ()=>{
                jsapiTicket = await Util.realGetJsapiTicket();

                fs.writeFileSync(path.join(__dirname,'../config/jsapi_ticket'), jsapiTicket);
            })
        }

        return jsapiTicket;

    },

    /**
     * 通过接口获取jsapi_ticket
     * @returns {Promise<any>}
     */
    realGetJsapiTicket:()=> {

        return new Promise((async (resolve, reject) => {

            let ACCESS_TOKEN=await Util.getAccessToken();

            request.get(`${WechatConfig.URL_OF_GET_JSAPI_TICKET}?access_token=${ACCESS_TOKEN}&type=jsapi`, (error, response, body) => {

                if (error) {
                    console.log(error)
                    resolve(null)
                } else {

                    resolve(JSON.parse(body).ticket)
                }
            })
        }))

    },

    /**
     * 校验微信签名
     * @param signature
     * @param timestamp
     * @param nonce
     * @returns {boolean}
     */
    checkSignature:(signature,timestamp,nonce)=> {

        let array = [WechatConfig.TOKEN, timestamp, nonce]

        array.sort();

        let content = array.join("");

        content = SignUtil.sha1(content).toUpperCase();

        if (content === signature.toUpperCase()) {
            return true;
        } else {
            return false
        }

    },
    /**
     * 根据openId获取微信用户信息
     * //TODO
     * @param openId
     * @returns {Promise<any>}
     */
    getUserInfo:(openId)=> {

        return new Promise(((resolve, reject) => {
            request.get(`${WechatConfig.URL_OF_GET_ACCESS_TOKEN}?grant_type=client_credential&appid=${WechatConfig.APP_ID}&secret=${WechatConfig.SECRET}`, (error, response, body) => {

                if (error) {
                    resolve(null)
                } else {

                    resolve(JSON.parse(body).access_token)
                }
            })
        }))

    },

    /**
     * 根据code获取openId
     * @param code
     * @returns {Promise<any>}
     */
    getOpenId:(code)=> {

        return new Promise(((resolve, reject) => {
            request.get(`${WechatConfig.URL_OF_GET_OPENID}?appid=${WechatConfig.APP_ID}&secret=${WechatConfig.SECRET}&code=${code}&grant_type=authorization_code`, (error, response, body) => {

                if (error) {
                    resolve(null)
                } else {

                    resolve(JSON.parse(body).openid)
                }
            })
        }))

    },

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
    sendTemplateMsg:(openId,templateName,dataArray,url,top,bottom)=>{

        let data={}

        if(top){
            data.first={
                "value":top.value,
                "color":top.color||WechatConfig.DEFAULT_COLOR
            }
        }

        if(bottom){
            data.remark={
                "value":bottom.value,
                "color":bottom.color||WechatConfig.DEFAULT_COLOR
            }
        }

        for(let i=0;i<dataArray.length;i++){

            let obj=dataArray[i];

                data[`keyword${i+1}`]={
                    "value":obj.value,
                    "color":obj.color||WechatConfig.DEFAULT_COLOR
                }

        }

        let form={
            "touser":openId,
            "template_id":WechatTemplates[templateName],
            "url":url || "",
            "data":data
        };


        return new Promise((async (resolve, reject) =>  {

            let ACCESS_TOKEN=await Util.getAccessToken();

            console.log("token"+ACCESS_TOKEN);

            request.post(
                {
                    url:`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${ACCESS_TOKEN}`,
                    form:JSON.stringify(form)
                },
                (error, response, body)=>{
                    if (error) {
                        resolve(null)
                    } else {

                        resolve({})
                    }
                }
            )
        }))
    },

    /**
     * 获取微信支付签名算法sign
     * @param obj
     * @returns {string}
     */
    getPaySign(obj){
        return SignUtil.md5(SignUtil.transObj2UrlKeyValueByAscii(obj)+`&key=`).toUpperCase()
    },

    /**
     * 微信支付统一下单
     * @param xml
     * @returns {Promise<any>}
     */
    unifiedOrder:(out_trade_no,total_fee,ip)=>{

        let trade_type="JSAPI"

        let body="北大-心理咨询"

        let obj={
            appid:WechatConfig.APP_ID,
            mch_id:WechatConfig.MCH_ID,
            nonce_str:BaseUtil.uuid(),
            body:body,
            out_trade_no:out_trade_no,//商户订单号
            total_fee:total_fee,//单位分
            spbill_create_ip:ip,
            notify_url:WechatConfig.NOTIFY_URL,
            trade_type:trade_type
        }

        let sign=Util.getPaySign(obj);

        obj.sign=sign;

        let xml=BaseUtil.obj2xml(obj)


        return new Promise((async (resolve, reject) =>  {

            request.post(
                {
                    url:WechatConfig.URL_OF_UNIFIED_ORDER,
                    form:xml
                },
                (error, response, body)=>{
                    if (error) {
                        console.log(1)
                        resolve({"error":"error"})
                    } else {
                        console.log(2,body)
                        let json=BaseUtil.xml2JsonObj(body)

                        console.log(json)

                        let return_code=json.return_code;
                        let return_msg=json.return_msg;

                        if(return_code==="FAIL"){
                            resolve({"error":return_msg})
                        }else{
                            resolve({"error":return_msg})
                        }



                    }
                }
            )
        }))
    },

    /**
     * 微信退款
     * @param out_trade_no 订单号
     * @param out_refund_no 退款单号
     * @param total_fee 总金额
     * @param refund_fee 退款金额
     * @returns {Promise<any>}
     */
    refund:(out_trade_no,out_refund_no,total_fee,refund_fee)=>{

        let obj={
            appid:WechatConfig.APP_ID,
            mch_id:WechatConfig.MCH_ID,
            nonce_str:BaseUtil.uuid(),
            out_trade_no:out_trade_no,
            out_refund_no:out_refund_no,
            total_fee:total_fee,//单位分
            refund_fee:refund_fee,
        }

        let sign=Util.getPaySign(obj);

        obj.sign=sign;

        let xml=BaseUtil.obj2xml(obj)


        return new Promise((async (resolve, reject) =>  {

            request.post(
                {
                    url:WechatConfig.URL_OF_REFUND,
                    form:xml
                },
                (error, response, body)=>{
                    if (error) {
                        console.log(1)
                        resolve({"error":"error"})
                    } else {
                        console.log(2,body)
                        let json=BaseUtil.xml2JsonObj(body)

                        console.log(json)

                        let return_code=json.return_code;
                        let return_msg=json.return_msg;

                        if(return_code==="FAIL"){
                            resolve({"error":return_msg})
                        }else{
                            resolve({"error":return_msg})
                        }



                    }
                }
            )
        }))
    },

    /**
     * 前端微信JsApi支付时用到的支付参数
     * @param prepay_id
     * @returns {Promise<any>}
     */
    getJsApiPaySign:(prepay_id)=>{

        let obj={
            appId:WechatConfig.APP_ID,
            timeStamp:BaseUtil.getTimestamp(),
            nonceStr:BaseUtil.uuid(),
            package:`prepay_id=${prepay_id}`,
            signType:'MD5'
        }

        let paySign=Util.getPaySign(obj);

        obj.paySign=paySign;

        return obj;
    },


    /**
     * 解密微信退款参数
     * 解密步骤如下：
     （1）对加密串A做base64解码，得到加密串B
     （2）对商户key做md5，得到32位小写key* ( key设置路径：微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置 )
     （3）用key*对加密串B做AES-256-ECB解密（PKCS7Padding）
     */
    decryptRefundNotifyParam:(req_info)=>{

        let shanghuKey="xxx"

        req_info=SignUtil.base64decode(req_info)

        shanghuKey=SignUtil.md5(shanghuKey)

        //TODO 此处解密用的aes-256,不一定行，需要试试
        let returnStr=SignUtil.aes256decrypt(shanghuKey,req_info);

        return BaseUtil.xml2JsonObj(returnStr)
    },
    /**
     * 微信退款
     * @param out_trade_no 订单号
     * @param out_refund_no 退款单号
     * @param total_fee 总金额
     * @param refund_fee 退款金额
     * @returns {Promise<any>}
     */
    orderQuery:(out_trade_no)=>{

        let obj={
            appid:WechatConfig.APP_ID,
            mch_id:WechatConfig.MCH_ID,
            nonce_str:BaseUtil.uuid(),
            out_trade_no:out_trade_no,
        }

        let sign=Util.getPaySign(obj);

        obj.sign=sign;

        let xml=BaseUtil.obj2xml(obj)


        return new Promise((async (resolve, reject) =>  {

            request.post(
                {
                    url:WechatConfig.URL_OF_ORDER_QUERY,
                    form:xml
                },
                (error, response, body)=>{
                    if (error) {
                        console.log(1)
                        resolve({"error":"error"})
                    } else {
                        console.log(2,body)
                        let json=BaseUtil.xml2JsonObj(body)

                        console.log(json)

                        let return_code=json.return_code;
                        let return_msg=json.return_msg;

                        if(return_code==="FAIL"){
                            resolve({"error":return_msg})
                        }else{
                            resolve({"error":return_msg})
                        }



                    }
                }
            )
        }))
    },

    /**
     * 接收普通用户给公众号发送的消息
     * @param xml
     */
    doMsg:(data)=>{

        console.log("接收到微信服务器普通消息："+JSON.stringify(data))

        // let json=BaseUtil.xml2JsonObj(xml)

        data=data.xml

        let msgType=data.MsgType[0]

        switch (msgType) {

            case MsgTypes.TEXT:
                console.log("......文本消息："+JSON.stringify(data))
                break;

            case MsgTypes.EVENT:

                console.log("......事件消息：")

                let eventType=data.Event[0]

                switch (eventType) {

                    case EventTypes.SCAN:
                        console.log("扫描带参数二维码事件。。")
                        break;
                    case EventTypes.SUBSCRIBE:
                        console.log("SUBSCRIBE。。")
                        break;
                    case EventTypes.UNSUBSCRIBE:
                        console.log("UNSUBSCRIBE。。")
                        break;
                    case EventTypes.LOCATION:
                        console.log("LOCATION。。")
                        break;
                    case EventTypes.CLICK:
                        console.log("CLICK。。")
                        break;
                }


        }


    },
    /**
     * 微信退款
     * @param out_trade_no 订单号
     * @param out_refund_no 退款单号
     * @param total_fee 总金额
     * @param refund_fee 退款金额
     * @returns {Promise<any>}
     */
    sendCustomerServiceMsg:(openId,msg)=>{

        openId="ohZcctykmVT2Lx3eOTX-DQKKwomw"

        let json={

            "touser":openId,
            "msgtype":"text",
            "text":
                {
                    "content":msg
                }
        }



        return new Promise((async (resolve, reject) =>  {

            let ACCESS_TOKEN=await Util.getAccessToken();

            request.post(
                {
                    url:`${WechatConfig.URL_OF_CUSTOMER_SERVICE_MSG}?access_token=${ACCESS_TOKEN}`,
                    form:JSON.stringify(json)
                },
                (error, response, body)=>{
                    if (error) {
                        console.log(1)
                        resolve({"error":"error"})
                    } else {
                        resolve("")

                    }
                }
            )
        }))
    },

    /**
     * 前端调用微信jssdk 时要用到的签名
     * @param url 调用js sdk所在的网页地址
     * @returns {Promise<any>}
     */
    getJsSdkSignature:async (url)=>{

        let jsapi_ticket=await Util.getJsapiTicket()

        let obj={
            timeStamp:BaseUtil.getTimestamp(),
            jsapi_ticket:jsapi_ticket,
            noncestr:BaseUtil.uuid(),
            url:url
        }



        let signature=SignUtil.sha1(SignUtil.transObj2UrlKeyValueByAscii(obj))

        obj.signature=signature;

        return obj;

    },

}


module.exports=Util;
