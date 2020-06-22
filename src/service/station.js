const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatUtil = require('../util/WechatUtil')
const logger =think.logger
const entityName = '工作室'
const tableName = 'station'

module.exports =  {


    /**
     * 根据id获取工作室详情
     * @param station_id
     * @returns {Promise<any>}
     */
    async getById(station_id) {


        try {

            let data = await think.model(tableName).where({
                station_id
            }).find().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据id获取工作室详情，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `根据id获取工作室详情异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },



};
