const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const logger = think.logger
const entityName = '操作日志'
const tableName = 'operate_log'

module.exports = class extends think.Service{

    /**
     *新增操作日志
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async add(user_id,operate_type,detail) {

        let op_date = DateUtil.getNowStr()

        let addJson = {
            operate_log_id: Util.uuid(),
            user_id,
            op_date,
            operate_type,
            detail,
        }

        try {

            await think.model(tableName).add(addJson).catch(e => {
                throw new Error(e)
            })

        } catch (e) {
            let msg = `新增${entityName}接口异常 msg:${e}`
            let returnMsg = `新增操作日志接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    }



};
