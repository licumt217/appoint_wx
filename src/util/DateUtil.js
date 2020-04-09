const moment=require('moment')
const logger = think.logger
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
     * 返回给定日期几周后的日期
     * @param date
     * @param weeks
     */
    getDayOfNextWeeks(date,weeks){
        let date2=new Date(date);
        let days=date2.getDate();
        date2.setDate(days+weeks*7);
        console.log(this.format(date2))
        return this.format(date2,'date')
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
    },

    /**
     * 获取给定日期是周几
     * @param date
     * @returns {number}
     */
    getWeekOfDate(date){
        if(typeof date==='string'){
            date=new Date(date);
        }

        return date.getDay();
    }





}


module.exports = DateUtil;
