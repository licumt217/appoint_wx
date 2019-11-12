const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')

const logger = think.logger
const entityName = '咨询师可用时间段'
const tableName = 'therapist_period'

module.exports = {


    async add(therapist_id,
              appoint_date,
              periodArray) {

        try {
            let op_date = DateUtil.getNowStr()

            let addJson = {
                therapist_id,
                appoint_date,
                op_date
            }

            periodArray.forEach((item) => {
                addJson[item] = 1;
            })

            let data = await think.model(tableName).add(addJson);

            logger.info(`新增${entityName}，数据库返回：${JSON.stringify(data)}`)

            return data
        } catch (e) {
            let msg=`新增${entityName}异常 msg:${e}`
            logger.info(msg);
            throw Error(msg)
        }

    },

    async update(whereObj,updateObj) {

        try {
            let op_date = DateUtil.getNowStr()

            updateObj.op_date=op_date

            //将对应的咨询师时段占用释放掉
            let data = await think.model(tableName).where(whereObj).update(updateObj)

            logger.info(`更新${entityName}，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg=`更新${entityName}异常 msg:${e}`
            logger.info(msg);
            throw Error(msg)
        }

    }

};
