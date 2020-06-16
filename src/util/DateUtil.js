const moment = require('moment')
const logger = think.logger
let DateUtil = {

    /**
     * 返回当前日期时间的字符串 2019-11-01 12：12：12的形式
     * @param p
     * @returns {string}
     */
    getNowStr(type) {

        let formatStr = "";
        if (type === 'date') {
            formatStr = "YYYY-MM-DD"
        } else if (type === 'time') {
            formatStr = "HH:mm:ss"
        } else {
            formatStr = "YYYY-MM-DD HH:mm:ss"
        }

        let nowDateStr = moment(new Date()).format(formatStr)

        return nowDateStr;
    },
    /**
     * 返回本周的周一的日期字符串
     * @param date
     * @param weeks
     */
    getFirstDayStrOfCurrentWeek() {
        let nowDate = new Date();
        let day = nowDate.getDay();
        let date = nowDate.getDate();
        day = day === 0 ? 6 : day - 1;//处理周日
        date = date - day;
        nowDate.setDate(date);

        return DateUtil.format(nowDate, 'date') + " 00:00:00"
    },

    /**
     * 返回本月一号的日期字符串
     * @param date
     * @param weeks
     */
    getFirstDayStrOfCurrentMonth() {
        let nowDate = new Date();
        nowDate.setDate(1);
        return DateUtil.format(nowDate, 'date') + " 00:00:00"
    },

    /**
     * 返回给定日期几周后的日期
     * @param date
     * @param weeks
     */
    getDateOfNextWeeks(date, weeks) {
        let date2 = new Date(date);
        let days = date2.getDate();
        date2.setDate(days + weeks * 7);
        console.log(this.format(date2))
        return this.format(date2, 'date')
    },

    /**
     * 格式化给定日期
     * @param type
     */
    format(date, type) {
        let formatStr = "";
        if (type === 'date') {
            formatStr = "YYYY-MM-DD"
        } else if (type === 'time') {
            formatStr = "HH:mm:ss"
        } else {
            formatStr = "YYYY-MM-DD HH:mm:ss"
        }

        let returnStr = moment(date).format(formatStr)

        return returnStr;
    },

    /**
     * 获取给定日期是周几
     * @param date
     * @returns {number}
     */
    getWeekOfDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }

        return date.getDay();
    },

    /**
     * 给定日期加减对应天数
     * @param date
     * @param days
     * @returns {*}
     */
    addDays(date, days) {
        date.setDate(date.getDate() + days);
        return date;
    },

    /**
     * date1是否早于date2
     * @param date1
     * @param date2
     * @returns {boolean}
     */
    before(date1, date2) {
        return date1.getTime() < date2.getTime();
    },
    /**
     * 判断给定日期是否晚于当前时间1天或更久
     * @param date
     * @returns {boolean}
     */
    afterNowMoreThanOneDay(date){

        let now_date=new Date();
        now_date.setDate(now_date.getDate()+1)
        //未精确到具体时段。暂时以天计算
        return DateUtil.before(now_date,date);
    },

    /**
     * 判断给定日期是否早于当前时间1天或更久
     * @param date
     * @returns {boolean}
     */
    beforeNowMoreThanOneDay(date){

        let now_date=new Date();
        now_date.setDate(now_date.getDate()-1)
        //未精确到具体时段。暂时以天计算
        return DateUtil.before(date,now_date);
    }




}


module.exports = DateUtil;
