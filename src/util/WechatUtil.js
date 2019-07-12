const request = require('request');

const WechatConfig=require("../config/WechatConfig")

const WechatTemplates=require("../config/WechatTemplates")

const SignUtil = require('./SignUtil')

const BaseUtil = require('./Util')

const fs = require("fs")
const path = require("path")

schedule = require('node-schedule')

let scheduleJob=null;


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

}


module.exports=Util;
