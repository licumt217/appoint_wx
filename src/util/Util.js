const j2xParser = require("fast-xml-parser").j2xParser;
const x2jParser = require("fast-xml-parser");
const WechatConfig = require("../config/WechatConfig");

json2xmlParser = new j2xParser();
const defaultOptions = {
    // attributeNamePrefix : "@_",
    // attrNodeName: "@", //default is false
    // textNodeName : "#text",
    // ignoreAttributes : true,
    // cdataTagName: "__cdata", //default is false
    // cdataPositionChar: "\\c",
    // format: false,
    // indentBy: "  ",
    // supressEmptyNode: false,
};


let Util = {
    uuid: () => {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0,
                v = c == 'x' ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    },

    /**
     * 将对象转为xml字符串
     * @param obj
     * @returns {string}
     */
    obj2xml: (obj) => {


        let xml = json2xmlParser.parse(obj);

        xml = `<xml>${xml}</xml>`

        return xml;
    },

    xml2JsonObj(xml) {

        var options = {
            attributeNamePrefix: "@_",
            attrNodeName: "attr", //default is 'false'
            textNodeName: "#text",
            ignoreAttributes: true,
            ignoreNameSpace: false,
            allowBooleanAttributes: false,
            parseNodeValue: true,
            parseAttributeValue: false,
            trimValues: true,
            cdataTagName: "__cdata", //default is 'false'
            cdataPositionChar: "\\c",
            localeRange: "", //To support non english character in tag/attribute values.
            parseTrueNumberOnly: false,
            // attrValueProcessor: a => he.decode(a, {isAttributeValue: true}),//default is a=>a
            // tagValueProcessor : a => he.decode(a) //default is a=>a
        };


        let obj = x2jParser.parse(xml);

        if (obj.xml) {
            return obj.xml;
        } else {
            return obj.root;
        }

    },

    /**
     * 返回时间戳，签名算法用到
     * @returns {number}
     */
    getTimestamp() {
        return Math.floor(new Date().getTime() / 1000)
    },

    clone(obj) {
        if (typeof obj === 'object') {
            let returnObj = null
            if (Array.isArray(obj)) {
                returnObj = []
                for (let i = 0; i < obj.length; i++) returnObj.push(obj[i])
            } else {
                returnObj = {}
                for (let key in obj) {
                    returnObj[key] = Util.clone(obj[key])
                }
            }
            return returnObj
        }
        return obj
    },
    /**
     * 是否空对象
     * @param obj
     */
    isEmptyObject(obj) {
        return !obj || (JSON.stringify(obj) === "{}");
    },
    /**
     * 验证是否合法手机号
     * @param p
     * @returns {boolean}
     */
    isValidPhone(p) {
        let re = /^1\d{10}$/
        return re.test(p)
    },
    getAuthUrl(url) {

        if (url.indexOf("?") > -1) {
            url = encodeURIComponent(url.split('?')[0]) +'?'+ url.split("?")[1]
        } else {
            url = encodeURIComponent(url)
        }


        return `https://open.weixin.qq.com/connect/oauth2/authorize?appId=${WechatConfig.APP_ID}&redirect_uri=${url}&response_type=code&scope=snsapi_base&state=about#wechat_redirect`
    },

    getFirstDayOfGivenDate(date){

        console.log(date)

        let date2=new Date(date.getFullYear(),date.getMonth(),date.getDate());
        date2.setHours(date2.getHours()+8)
        date2.setDate(1);
        return date2;
    },
    getLastDayOfGivenDate(date){
        let currentMonth=date.getMonth();
        let nextMonth=++currentMonth;
        let nextMonthFirstDay=new Date(date.getFullYear(),nextMonth,1);
        nextMonthFirstDay.setHours(nextMonthFirstDay.getHours()+8)
        let oneDay=1000*60*60*24;
        return new Date(nextMonthFirstDay-oneDay);
    },
    getAppointmentPeriodStrFromArray(period) {
        if(Array.isArray(period)){
            period=period.join(',')
        }
        let str = '';
        period.split(',').forEach(item => {
            str += (`${Util.fixZero(item)}:00-${Util.fixZero(item)}:50 `)
        })


        return str;
    },

    fixZero(val) {
        if (val < 10) {
            return '0' + val;
        } else {
            return val;
        }
    }




}

Util.ZERO = 0;
Util.ONE = 1;


module.exports = Util;
