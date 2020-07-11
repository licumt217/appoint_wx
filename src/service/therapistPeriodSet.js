const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')

const logger = think.logger
const entityName = '咨询师时段设置'
const tableName = 'therapist_period_set'

module.exports = {

    /**
     * 初始化咨询师可用时段设置
     * @param therapist_id
     * @returns {Promise<T>}
     */
    async initPeriodSet(therapist_id) {

        try {
            let weeks='1,2,3,4,5'
            let period='8,9,10,11,13,14,15,16'

            logger.info(`新增咨询师可用时段设置参数 :${therapist_id}`)

            let data = await think.model(tableName).add({
                therapist_id,
                period,
                weeks,
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
