const moment=require('moment')

let DateUtil = {

    /**
     * 返回当前日期时间的字符串 2019-11-01 12：12：12的形式
     * @param p
     * @returns {string}
     */
    getNowStr(type){

        let formatStr="";
        if(type==='date'){
            formatStr="YYYY-MM-DD"
        }else if(type==='time'){
            formatStr="HH:mm:ss"
        }else{
            formatStr="YYYY-MM-DD HH:mm:ss"
        }

        let nowDateStr= moment(new Date()).format(formatStr)

        return nowDateStr;
    },
    /**
     * 格式化给定日期
     * @param type
     */
    format(date,type){
        let formatStr="";
        if(type==='date'){
            formatStr="YYYY-MM-DD"
        }else if(type==='time'){
            formatStr="HH:mm:ss"
        }else{
            formatStr="YYYY-MM-DD HH:mm:ss"
        }

        let returnStr= moment(date).format(formatStr)

        return returnStr;
    }





}


module.exports = DateUtil;
