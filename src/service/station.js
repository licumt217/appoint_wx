const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatUtil = require('../util/WechatUtil')
const logger =think.logger
const entityName = '工作室'
const tableName = 'station'

module.exports =  {



    /**
     *根据case_manager_id查询对应的工作室ID
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getStationIdByCaseManagerId(case_manager_id){

        try{

            let data = await think.model(tableName).where({
                case_manager_id
            }).find().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据case_manager_id查询对应的工作室ID数据库返回：${JSON.stringify(data)}`)

            return data.station_id;

        }catch (e) {
            let msg=`根据case_manager_id查询对应的工作室ID接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },



};
