const Base = require('./base.js');
const WechatUtil = require('../../util/WechatUtil')

module.exports = class extends Base {
    /**
     * 验证消息来自微信服务器
     */
    executeAction() {

        //微信服务器发送的验证消息
        if(this.isGet){

            let echostr = this.get('echostr')

            if(WechatUtil.checkSignature(this.get('signature'),this.get('timestamp'),this.get('nonce'))){

                this.body = echostr

            }else{

                this.body = false
            }

        }else{


            //微信服务器发送的是xml格式的，thinkJs接收时自动转为json对象了
            WechatUtil.doMsg(this.post())

            this.body='';
        }


    }
};
