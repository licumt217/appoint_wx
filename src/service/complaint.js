const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const logger = think.logger
const entityName = '投诉'
const tableName = 'complaint'

module.exports = {


    /**
     * 更新投诉
     * @param whereObj
     * @param updateObj
     * @returns {Promise<void>}
     */
    async update(whereObj,updateObj) {


        try {
            let op_date = DateUtil.getNowStr()

            updateObj.op_date = op_date

            let data = await think.model(tableName).where(whereObj).update(updateObj).catch(e => {
                throw new Error(e)
            });

            logger.info(`更新${entityName}，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `更新${entityName}异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },



};
