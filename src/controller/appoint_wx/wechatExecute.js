const Base = require('./base.js');
const Util = require('../../util/Util')

module.exports = class extends Base {
    /**
     * 验证消息来自微信服务器
     */
    executeAction() {

        let echostr = this.get('echostr')

        if(Util.checkSignature(this.get('signature'),this.get('timestamp'),this.get('nonce'))){
            this.body = echostr
        }else{
            this.body = false
        }

    }
};
