const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatUtil = require('../util/WechatUtil')
const ORDER_STATE = require('../config/ORDER_STATE')
const PERIOD_STATE = require('../config/PERIOD_STATE')
const logger = think.logger
const entityName = '工作室房间预约时段设置'
const tableName = 'room_period_set'

module.exports = {




    /**
     *根据工作室ID获取房间可用时段配置
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getByStationId(station_id) {

        try {

            let data = await think.model(tableName).where({
                station_id
            }).find().catch(e => {
                throw new Error(e)
            })


            logger.info(`根据工作室ID获取房间可用时段配置数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据工作室ID获取房间可用时段配置异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },


};
