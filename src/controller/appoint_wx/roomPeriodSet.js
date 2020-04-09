const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;
const stationService = require('../../service/station')
const roomPeriodSetService = require('../../service/roomPeriodSet')
const entityName='工作室房间可用时段设置'
const tableName='room_period_set'


module.exports = class extends Base {


    /**

    /**
     * 根据工作室ID获取房间可用时段设置
     * @returns {Promise<void>}
     */
    async getByStationIdAction() {
        try {

            let station_id=this.post('station_id')

            logger.info(`根据工作室ID获取房间可用时段设置参数 :${JSON.stringify(this.post())}`)

            if(!station_id){
                this.body=Response.businessException('工作室ID不能为空！')
                return;
            }


            let data = await roomPeriodSetService.getByStationId(station_id)


            logger.info(`根据工作室ID获取房间可用时段设置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`根据工作室ID获取房间可用时段设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }













};
