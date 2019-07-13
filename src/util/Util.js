const j2xParser = require("fast-xml-parser").j2xParser;
const x2jParser = require("fast-xml-parser");

json2xmlParser=new j2xParser();
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


let Util={
    uuid:()=>{
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
    obj2xml:(obj)=>{



        let xml = json2xmlParser.parse(obj);

        xml=`<xml>${xml}</xml>`

        return xml;
    },

    xml2JsonObj(xml){

        var options = {
            attributeNamePrefix : "@_",
            attrNodeName: "attr", //default is 'false'
            textNodeName : "#text",
            ignoreAttributes : true,
            ignoreNameSpace : false,
            allowBooleanAttributes : false,
            parseNodeValue : true,
            parseAttributeValue : false,
            trimValues: true,
            cdataTagName: "__cdata", //default is 'false'
            cdataPositionChar: "\\c",
            localeRange: "", //To support non english character in tag/attribute values.
            parseTrueNumberOnly: false,
            // attrValueProcessor: a => he.decode(a, {isAttributeValue: true}),//default is a=>a
            // tagValueProcessor : a => he.decode(a) //default is a=>a
        };



        let obj= x2jParser.parse(xml);

        return obj.xml;
    },

    /**
     * 返回时间戳，签名算法用到
     * @returns {number}
     */
    getTimestamp(){
        return new Date().getTime()/1000
    }

}





module.exports=Util;
