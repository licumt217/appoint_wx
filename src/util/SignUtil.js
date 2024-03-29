const md5=require("md5")
const base64=require("base64-url")
const crypto = require('crypto')

let Util={
    encodeUTF8:(s)=> {
        var i, r = [], c, x;
        for (i = 0; i < s.length; i++)
            if ((c = s.charCodeAt(i)) < 0x80) r.push(c);
            else if (c < 0x800) r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F));
            else {
                if ((x = c ^ 0xD800) >> 10 == 0) //对四字节UTF-16转换为Unicode
                    c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000,
                        r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F));
                else r.push(0xE0 + (c >> 12 & 0xF));
                r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
            };
        return r;
    },

    /**
     * 字符串加密成 hex 字符串
     * @param s
     * @returns {string}
     */
    sha1:(s)=> {
        var data = new Uint8Array(Util.encodeUTF8(s))
        var i, j, t;
        var l = ((data.length + 8) >>> 6 << 4) + 16, s = new Uint8Array(l << 2);
        s.set(new Uint8Array(data.buffer)), s = new Uint32Array(s.buffer);
        for (t = new DataView(s.buffer), i = 0; i < l; i++)s[i] = t.getUint32(i << 2);
        s[data.length >> 2] |= 0x80 << (24 - (data.length & 3) * 8);
        s[l - 1] = data.length << 3;
        var w = [], f = [
                function () { return m[1] & m[2] | ~m[1] & m[3]; },
                function () { return m[1] ^ m[2] ^ m[3]; },
                function () { return m[1] & m[2] | m[1] & m[3] | m[2] & m[3]; },
                function () { return m[1] ^ m[2] ^ m[3]; }
            ], rol = function (n, c) { return n << c | n >>> (32 - c); },
            k = [1518500249, 1859775393, -1894007588, -899497514],
            m = [1732584193, -271733879, null, null, -1009589776];
        m[2] = ~m[0], m[3] = ~m[1];
        for (i = 0; i < s.length; i += 16) {
            var o = m.slice(0);
            for (j = 0; j < 80; j++)
                w[j] = j < 16 ? s[i + j] : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1),
                    t = rol(m[0], 5) + f[j / 20 | 0]() + m[4] + w[j] + k[j / 20 | 0] | 0,
                    m[1] = rol(m[1], 30), m.pop(), m.unshift(t);
            for (j = 0; j < 5; j++)m[j] = m[j] + o[j] | 0;
        };
        t = new DataView(new Uint32Array(m).buffer);
        for (var i = 0; i < 5; i++)m[i] = t.getUint32(i << 2);

        var hex = Array.prototype.map.call(new Uint8Array(new Uint32Array(m).buffer), function (e) {
            return (e < 16 ? "0" : "") + e.toString(16);
        }).join("");
        return hex;
    },

    /**
     * 将对象按照key进行ascii升序排序后组合成类似url参数a=xx&b=&&的形式
     * @param obj
     */
    transObj2UrlKeyValueByAscii:(obj)=>{
        let array=[],returnStr='';

        for(let key in obj){
            array.push(key);
        }

        array.sort();

        for(let i=0;i<array.length;i++){

            let key=array[i]

            if(i===0){
                returnStr=(key+'='+obj[key])
            }else{
                returnStr+=('&'+key+'='+obj[key])
            }
        }

        return returnStr;

    },

    md5:(param)=>{
        return md5(param);
    },

    /**
     * base64编码
     * @param param
     * @returns {*}
     */
    base64encode:(param)=>{
        return base64.encode(param)
    },

    /**
     * base64解码
     * @param param
     * @returns {*}
     */
    base64decode:(param)=>{
        return base64.decode(param)
    },

    /**
     * aes加密
     * @param data 待加密内容
     * @param key 必须为32位私钥
     * @returns {string}
     */
    encryption :function (data, key, iv) {
        iv = iv || "";
        var clearEncoding = 'utf8';
        var cipherEncoding = 'base64';
        var cipherChunks = [];
        var cipher = crypto.createCipheriv('aes-256-ecb', key, iv);
        cipher.setAutoPadding(true);
        cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
        cipherChunks.push(cipher.final(cipherEncoding));
        return cipherChunks.join('');
    },

    /**
     * aes解密
     * @param data 待解密内容
     * @param key 必须为32位私钥
     * @returns {string}
     */
    decryption :function (data, key, iv) {
        if (!data) {
            return "";
        }
        iv = iv || "";
        var clearEncoding = 'utf8';
        var cipherEncoding = 'base64';
        var cipherChunks = [];
        var decipher = crypto.createDecipheriv('aes-256-ecb', key, iv);
        decipher.setAutoPadding(true);
        cipherChunks.push(decipher.update(data, cipherEncoding, clearEncoding));

        console.log(222)


        cipherChunks.push(decipher.final(clearEncoding));

        console.log(cipherChunks.join(''))
        return cipherChunks.join('');
    }


}







module.exports=Util;
