const Sha1SignUtil = require('./Sha1SignUtil')


/**
 * 校验微信签名
 * @param s
 */
function checkSignature(signature,timestamp,nonce) {

    let token = "tingcheeasy"

    let array = [token, timestamp, nonce]

    array.sort();

    let content = array.join("");

    content = Sha1SignUtil.sha1(content).toUpperCase();

    if (content === signature.toUpperCase()) {
        return true;
    } else {
        return false
    }

}


module.exports.checkSignature=checkSignature;
