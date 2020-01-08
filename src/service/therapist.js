const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')

const logger = think.logger
const entityName = '咨询师'
const tableName = 'therapist'

module.exports = {


    async add(therapist_id) {

        try {
            let period='8,9,10,11,13,14,15,16'

            logger.info(`新增咨询师可用时段设置参数 :${therapist_id}`)

            let data = await think.model('therapist_period_set').add({
                therapist_id,
                period,
                op_date:DateUtil.getNowStr(),
                therapist_period_set_id:Util.uuid()
            }).catch(e=>{
                throw new Error(e)
            });

            logger.info(`新增咨询师可用时段设置，数据库返回：${JSON.stringify(data)}`)

            return data
        } catch (e) {
            let msg=`新增咨询师可用时段设置异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }

    },



};
