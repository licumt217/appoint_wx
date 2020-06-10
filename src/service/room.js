const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatUtil = require('../util/WechatUtil')
const ORDER_STATE = require('../config/constants/ORDER_STATE')
const PERIOD_STATE = require('../config/constants/PERIOD_STATE')
const logger = think.logger
const entityName = '房间'
const tableName = 'room'

module.exports = {




    /**
     *根据工作室ID获取房间列表
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getListByStationIdNoPage(station_id) {

        try {

            let data = await think.model(tableName).where({
                station_id
            }).select().catch(e => {
                throw new Error(e)
            })


            logger.info(`根据工作室ID获取房间列表数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据工作室ID获取房间列表异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },


};
