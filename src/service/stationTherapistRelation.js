const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatUtil = require('../util/WechatUtil')
const logger =think.logger
const entityName = '工作室和咨询师关联'
const tableName = 'station_therapist_relation'

module.exports =  {



    /**
     *根据咨询师ID查询对应的工作室ID
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getStationIdByTherapistId(therapist_id){

        try{

            let data = await think.model(tableName).where({
                therapist_id
            }).find().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据咨询师ID查询对应的工作室ID数据库返回：${JSON.stringify(data)}`)

            return data.station_id;

        }catch (e) {
            let msg=`根据咨询师ID查询对应的工作室ID异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },



};
