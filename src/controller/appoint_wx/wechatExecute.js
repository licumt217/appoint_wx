const Base = require('./base.js');
const WechatUtil = require('../../util/WechatUtil')

module.exports = class extends Base {
    /**
     * 验证消息来自微信服务器
     */
    executeAction() {

        let echostr = this.get('echostr')

        if(WechatUtil.checkSignature(this.get('signature'),this.get('timestamp'),this.get('nonce'))){
            this.body = echostr
        }else{
            this.body = false
        }

    }
};
