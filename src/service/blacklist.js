const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const logger = think.logger
const entityName = '黑名单'
const tableName = 'blacklist'

module.exports = {


    /**
     *新增黑名单
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async add(user_id,op_user_id) {


        let create_date = DateUtil.getNowStr()

        let op_date = create_date

        let addJson = {
            blacklist_id: Util.uuid(),
            user_id,
            add_date: op_date,
            op_date,
            op_user_id,
        }


        try {

            await think.model(tableName).add(addJson).catch(e => {
                throw new Error(e)
            })

        } catch (e) {
            let msg = `新增${entityName}接口异常 msg:${e}`
            let returnMsg = `新增黑名单接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

};