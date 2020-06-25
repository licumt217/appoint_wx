const request = require('request');

const WechatConfig = require("../config/WechatConfig")
const RECEIVE_SIDE = require("../config/constants/RECEIVE_SIDE")

const SignUtil = require('./SignUtil')

const BaseUtil = require('./Util')

const MsgTypes = require("../weixin/MsgTypes")
const EventTypes = require("../weixin/EventTypes")

const fs = require("fs")
const path = require("path")

const wechatSettingService = require('../service/wechatSetting')
const refundRecordService = require('../service/refundRecord')

const logger = think.logger

let Util = {
    /**
     * 获取token
     * 基础支持的token
     * @returns {Promise<any>}
     */
    getAccessToken: async () => {

        let token = await wechatSettingService.getAccessToken();

        return token;

    },


    /**
     * 获取jsapi_ticket
     * @returns {Promise<*>}
     */
    getJsapiTicket: async () => {

        let ticket = await wechatSettingService.getJsApiTicket()

        return ticket;

    },


    /**
     * 校验微信签名
     * @param signature
     * @param timestamp
     * @param nonce
     * @returns {boolean}
     */
    checkSignature: (signature, timestamp, nonce) => {

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
    getUserInfo: (openId) => {

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
     * 根据code获取openid
     * @param code
     * @returns {Promise<any>}
     */
    getOpenid: (code) => {

        return new Promise(((resolve, reject) => {

            const url = `${WechatConfig.URL_OF_GET_OPENID}?appid=${WechatConfig.APP_ID}&secret=${WechatConfig.SECRET}&code=${code}&grant_type=authorization_code`

            logger.info(`根据code获取openid调用微信接口URL：${url}`);

            request.get(url, (error, response, body) => {

                logger.info(`根据code获取openid返回信息 error:${error}， body:${body}， response:${response}`);

                body = JSON.parse(body)

                if (error) {
                    reject(error)
                } else {
                    if (body.errcode) {
                        reject(body.errmsg)
                    } else {
                        resolve(body.openid)
                    }
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
    sendTemplateMsg: (openId, templateName, url, dataArray, top, bottom) => {

        let data = {}

        if (top) {
            data.first = {
                "value": top.value,
                "color": top.color || WechatConfig.DEFAULT_COLOR
            }
        }

        if (bottom) {
            data.remark = {
                "value": bottom.value,
                "color": bottom.color || WechatConfig.DEFAULT_COLOR
            }
        }

        for (let i = 0; i < dataArray.length; i++) {

            let obj = dataArray[i];

            data[`keyword${i + 1}`] = {
                "value": obj.value,
                "color": obj.color || WechatConfig.DEFAULT_COLOR
            }

        }

        let form = {
            "touser": openId,
            "template_id": templateName,
            "url": url || "",
            "data": data
        };


        return new Promise((async (resolve, reject) => {

            let ACCESS_TOKEN = await Util.getAccessToken();

            request.post({
                    url: `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${ACCESS_TOKEN}`,
                    form: JSON.stringify(form)
                }, (error, response, body) => {

                    try {
                        logger.info(`模板消息接口返回 error:${error}, response:${JSON.stringify(response)}, body:${body}`)

                        body = JSON.parse(body)

                        if (error) {
                            reject(`发送模板消息错误 ${error}`)
                        } else {

                            let errcode = body.errcode
                            let errmsg = body.errmsg

                            if (errcode === 0) {
                                resolve()
                            } else {
                                reject(`发送模板消息接口异常 ${errmsg}`)
                            }
                        }
                    } catch (e) {
                        reject(`发送模板消息接口异常 ${e}`)
                    }
                }
            )
        }))
    },

    /**
     * 获取微信支付签名算法sign
     * isServiceMerchantModel 是否服务商模式
     * @param obj
     * @returns {string}
     */
    getPaySign(obj, isServiceMerchantModel) {

        let key = isServiceMerchantModel ? WechatConfig.SERVICE_MERCHANT_KEY : WechatConfig.KEY
        return SignUtil.md5(SignUtil.transObj2UrlKeyValueByAscii(obj) + `&key=${key}`).toUpperCase()
    },

    /**
     * 校验微信服务器发送的异步通知消息：比如支付回调校验
     * @param json
     * @returns {boolean}
     */
    checkWechatMessageSignature(json, isServiceMerchantModel) {

        for (let key in json) {
            if (typeof json[key] === 'object') {//array
                json[key] = json[key][0]
            }

            if (json[key] === "") {
                delete json[key]
            }
        }


        if (!json.sign) {
            return false;
        } else {
            let sign = json.sign;

            delete json.sign;

            let calculatedSign = Util.getPaySign(json, isServiceMerchantModel);

            if (sign === calculatedSign) {
                return true;
            } else {
                return false;
            }
        }

    },

    /**
     * 判断指定分部是否是服务商模式
     * 在线支付
     * @param division
     * @returns {boolean}
     */
    isServiceMerchantModel: (division) => {
        if (division.receive_side === RECEIVE_SIDE.SELF) {
            return true;
        }
        return false;
    },

    /**
     * 微信支付统一下单
     * @param xml
     * @returns {Promise<any>}
     */
    unifiedOrder: (division, openid, out_trade_no, total_fee, ip) => {

        let trade_type = "JSAPI"

        let body = "北大-心理咨询"

        total_fee = Number(total_fee) * 100
        let obj = {
            openid: openid,
            nonce_str: BaseUtil.uuid(),
            body: body,
            out_trade_no: out_trade_no,//商户订单号
            total_fee: total_fee,//单位分
            spbill_create_ip: ip,
            trade_type: trade_type
        }

        //服务商模式
        if (Util.isServiceMerchantModel(division)) {
            obj = Object.assign(obj, {
                appid: WechatConfig.APP_ID,
                mch_id: WechatConfig.MCH_ID_OF_SERVICE_MERCHANT,
                notify_url: WechatConfig.URL_OF_NOTIFY_URL_OF_SMM,
                sub_mch_id: division.sub_mch_id,
            })
        } else {
            obj = Object.assign(obj, {
                appid: WechatConfig.APP_ID,
                mch_id: WechatConfig.MCH_ID,
                notify_url: WechatConfig.URL_OF_NOTIFY_URL,
            })
        }

        let sign = Util.getPaySign(obj, Util.isServiceMerchantModel(division));

        obj.sign = sign;

        let xml = BaseUtil.obj2xml(obj)

        logger.info("统一下单参数：" + xml)

        return new Promise(((resolve, reject) => {

            request.post(
                {
                    url: WechatConfig.URL_OF_UNIFIED_ORDER,
                    form: xml
                },
                (error, response, body) => {
                    logger.info(`下单接口微信返回：response:${JSON.stringify(response)},body:${JSON.stringify(body)}`)

                    if (error) {
                        logger.info(`微信下单接口错误：${error}`)
                        resolve(`微信下单接口错误`)
                    } else {
                        let json = BaseUtil.xml2JsonObj(body)

                        let return_code = json.return_code;

                        if (return_code === "SUCCESS") {
                            resolve(json.prepay_id)
                        } else {
                            reject(json.return_msg)
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
     * @param total_fee 总金额 参数的金额是元，需要*100后进行退款
     * @param refund_fee 退款金额
     * @returns {Promise<any>}
     * 需要双向签名
     */
    refund: async (division, out_trade_no, total_fee, refund_fee, order_id) => {
        let out_refund_no = BaseUtil.uuid()

        logger.info(`退款接口参数：out_trade_no：${out_trade_no},total_fee：${total_fee},：refund_fee：${refund_fee}`)

        total_fee = Number(total_fee) * 100
        refund_fee = Number(refund_fee) * 100

        let obj = {
            appid: WechatConfig.APP_ID,
            nonce_str: BaseUtil.uuid(),
            out_trade_no: out_trade_no,
            out_refund_no: out_refund_no,
            total_fee: total_fee,//单位分
            refund_fee: refund_fee,
        }

        if (Util.isServiceMerchantModel(division)) {
            obj = Object.assign(obj, {
                mch_id: WechatConfig.MCH_ID_OF_SERVICE_MERCHANT,
                sub_mch_id: division.sub_mch_id,
                notify_url: WechatConfig.URL_OF_REFUND_NOTIFY_URL_OF_SMM
            })
        } else {
            obj = Object.assign(obj, {
                mch_id: WechatConfig.MCH_ID,
                notify_url: WechatConfig.URL_OF_REFUND_NOTIFY_URL
            })
        }

        //新增一条退款记录
        await refundRecordService.add({
            order_id,
            out_refund_no
        })

        logger.info(`微信退款加密前参数 obj:${JSON.stringify(obj)}`)

        let sign = Util.getPaySign(obj, Util.isServiceMerchantModel(division));

        obj.sign = sign;

        let xml = BaseUtil.obj2xml(obj)

        logger.info(`微信退款xml数据 xml:${xml}`)

        return new Promise((async (resolve, reject) => {

            let agentOptions={}
            if(Util.isServiceMerchantModel(division) ){
                agentOptions={
                    pfx:fs.readFileSync(path.join(__dirname, '../config/cert/smm/apiclient_cert.p12')),//微信商户平台证书,
                    passphrase:WechatConfig.MCH_ID_OF_SERVICE_MERCHANT
                }
            }else{
                agentOptions={
                    pfx:fs.readFileSync(path.join(__dirname, '../config/cert/apiclient_cert.p12')),
                    passphrase:WechatConfig.MCH_ID
                }
            }

            request.post(
                {
                    url: WechatConfig.URL_OF_REFUND,
                    form: xml,
                    agentOptions
                },
                (error, response, body) => {
                    logger.info(`退款接口微信返回 error:${error},response:${JSON.stringify(response)},body:${JSON.stringify(body)}`)

                    if (error) {
                        resolve({"退款失败": error})
                    } else {

                        let json = BaseUtil.xml2JsonObj(body)

                        logger.info("退款接口返回信息：" + JSON.stringify(json))

                        //再次校验签名
                        if (Util.checkWechatMessageSignature(json, Util.isServiceMerchantModel(division))) {
                            let return_code = json.return_code;
                            let return_msg = json.return_msg;
                            let result_code = json.result_code;

                            if (return_code === "SUCCESS") {

                                if (result_code === "SUCCESS") {


                                    resolve(json)
                                } else {
                                    reject(return_msg)
                                }

                            } else {
                                reject(return_msg)
                            }
                        } else {
                            reject("退款接口微信返回信息签名校验错误！")
                        }


                    }
                }
            )
        }))
    },
    /**
     * 退款查询
     * @param out_refund_no 商户退款订单号
     * @returns {Promise<any>}
     */
    refundQuery: (division, out_refund_no) => {

        let obj = {
            appid: WechatConfig.APP_ID,
            nonce_str: BaseUtil.uuid(),
            out_refund_no: out_refund_no
        }

        if (Util.isServiceMerchantModel(division)) {
            obj = Object.assign(obj,{

                mch_id: WechatConfig.MCH_ID_OF_SERVICE_MERCHANT,
                sub_mch_id: division.sub_mch_id
            })
        } else {
            obj = Object.assign(obj,{
                mch_id: WechatConfig.MCH_ID,
            })
        }

        let sign = Util.getPaySign(obj, Util.isServiceMerchantModel(division));


        obj.sign = sign;

        let xml = BaseUtil.obj2xml(obj)

        return new Promise((async (resolve, reject) => {

            request.post(
                {
                    url: WechatConfig.URL_OF_REFUND_QUERY,
                    form: xml,
                },
                (error, response, body) => {
                    logger.info(`微信退款查询返回信息 error:${error}， body:${body}， response:${response}`);
                    if (error) {
                        reject({"退款查询失败": error})
                    } else {

                        let json = BaseUtil.xml2JsonObj(body)

                        //再次校验签名
                        if (Util.checkWechatMessageSignature(json, Util.isServiceMerchantModel(division))) {
                            let return_code = json.return_code;
                            let return_msg = json.return_msg;
                            let result_code = json.result_code;

                            if (return_code === "SUCCESS") {

                                if (result_code === "SUCCESS") {


                                    resolve(json)
                                } else {
                                    reject(return_msg)
                                }

                            } else {
                                reject(return_msg)
                            }
                        } else {
                            reject("退款查询接口微信返回信息签名校验错误！")
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
    getJsApiPaySign: (division, prepay_id) => {

        let obj = {
            appId: WechatConfig.APP_ID,
            timeStamp: BaseUtil.getTimestamp(),
            nonceStr: BaseUtil.uuid(),
            package: `prepay_id=${prepay_id}`,
            signType: 'MD5'
        }

        let paySign = Util.getPaySign(obj, Util.isServiceMerchantModel(division));

        obj.paySign = paySign;

        return obj;
    },


    /**
     * 解密微信退款参数
     * 解密步骤如下：
     （1）对加密串A做base64解码，得到加密串B
     （2）对商户key做md5，得到32位小写key* ( key设置路径：微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置 )
     （3）用key*对加密串B做AES-256-ECB解密（PKCS7Padding）
     */
    decryptRefundNotifyParam: (req_info, isServiceMerchantModel) => {

        logger.info(`退款解密参数：req_info:${req_info}`)

        let shanghuKey = isServiceMerchantModel ? WechatConfig.SERVICE_MERCHANT_KEY : WechatConfig.KEY

        shanghuKey = SignUtil.md5(shanghuKey)

        logger.info(`md5加密后的商户key:${shanghuKey}`)

        let returnStr = SignUtil.decryption(req_info, shanghuKey);

        logger.info(`解密后的数据： returnStr:${returnStr}`)

        return BaseUtil.xml2JsonObj(returnStr)
    },
    /**
     * 查询订单
     * @param out_trade_no
     * @returns {Promise<any>}
     *
     * trade_state：交易状态
     * SUCCESS—支付成功

     REFUND—转入退款

     NOTPAY—未支付

     CLOSED—已关闭

     REVOKED—已撤销（付款码支付）

     USERPAYING--用户支付中（付款码支付）

     PAYERROR--支付失败(其他原因，如银行返回失败)

     */
    orderQuery: (division, out_trade_no) => {

        let obj = {
            appid: WechatConfig.APP_ID,
            nonce_str: BaseUtil.uuid(),
            out_trade_no: out_trade_no,
        }

        if (Util.isServiceMerchantModel(division)) {
            obj = Object.assign(obj,{
                mch_id: WechatConfig.MCH_ID_OF_SERVICE_MERCHANT,
                sub_mch_id: division.sub_mch_id
            })
        } else {
            obj = Object.assign(obj,{
                mch_id: WechatConfig.MCH_ID,
            })
        }
        let sign = Util.getPaySign(obj, Util.isServiceMerchantModel(division));

        obj.sign = sign;

        let xml = BaseUtil.obj2xml(obj)


        return new Promise((async (resolve, reject) => {

            request.post({
                    url: WechatConfig.URL_OF_ORDER_QUERY,
                    form: xml
                }, (error, response, body) => {
                    logger.info(`微信查询订单返回信息 error:${error}， body:${body}， response:${response}`);
                    if (error) {
                        reject(error)
                    } else {
                        let json = BaseUtil.xml2JsonObj(body)

                        let return_code = json.return_code;
                        let return_msg = json.return_msg;
                        let result_code = json.result_code;

                        if (return_code === "SUCCESS" && result_code === "SUCCESS") {
                            resolve(json)
                        } else {
                            reject(return_msg)
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
    doMsg: (data) => {

        logger.info("接收到微信服务器普通消息：" + JSON.stringify(data))

        // let json=BaseUtil.xml2JsonObj(xml)

        data = data.xml

        let msgType = data.MsgType[0]

        switch (msgType) {

            case MsgTypes.TEXT:
                logger.info("......文本消息：" + JSON.stringify(data))
                break;

            case MsgTypes.EVENT:

                logger.info("......事件消息：")

                let eventType = data.Event[0]

                switch (eventType) {

                    case EventTypes.SCAN:
                        logger.info("扫描带参数二维码事件。。")
                        break;
                    case EventTypes.SUBSCRIBE:
                        logger.info("SUBSCRIBE。。")
                        break;
                    case EventTypes.UNSUBSCRIBE:
                        logger.info("UNSUBSCRIBE。。")
                        break;
                    case EventTypes.LOCATION:
                        logger.info("LOCATION。。")
                        break;
                    case EventTypes.CLICK:
                        logger.info("CLICK。。")
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
    sendCustomerServiceMsg: (openId, msg) => {

        openId = "ohZcctykmVT2Lx3eOTX-DQKKwomw"

        let json = {

            "touser": openId,
            "msgtype": "text",
            "text":
                {
                    "content": msg
                }
        }


        return new Promise((async (resolve, reject) => {

            let ACCESS_TOKEN = await Util.getAccessToken();

            request.post(
                {
                    url: `${WechatConfig.URL_OF_CUSTOMER_SERVICE_MSG}?access_token=${ACCESS_TOKEN}`,
                    form: JSON.stringify(json)
                },
                (error, response, body) => {
                    logger.info(`微信退款返回信息 error:${error}， body:${body}， response:${response}`);
                    if (error) {
                        resolve({"error": "error"})
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
    getJsSdkSignature: async (url) => {

        let jsapi_ticket = await Util.getJsapiTicket()

        let obj = {
            timeStamp: BaseUtil.getTimestamp(),
            jsapi_ticket: jsapi_ticket,
            noncestr: BaseUtil.uuid(),
            url: url
        }


        let signature = SignUtil.sha1(SignUtil.transObj2UrlKeyValueByAscii(obj))

        obj.signature = signature;

        return obj;

    },

}

module.exports = Util;
