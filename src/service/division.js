const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const logger = think.logger
const entityName = '分部'
const tableName = 'division'
const stationTherapistRelationService = require('./stationTherapistRelation');
const stationService = require('./station');

module.exports = {


    /**
     * 根据工作室ID获取对应的分部
     * @param station_id
     * @returns {Promise<any>}
     */
    async getByStationId(station_id) {

        try {

            let station=await stationService.getById(station_id);

            let division=await this.getById(station.division_id)

            return division
        } catch (e) {
            let msg = `根据工作室ID获取对应的分部异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     * 根据工作室和咨询师关系ID获取对应的分部
     * @param station_therapist_id
     * @returns {Promise<any>}
     */
    async getByStationTherapistRelationId(station_therapist_relation_id) {

        try {

            let stationTherapistRelation=await stationTherapistRelationService.getById(station_therapist_relation_id)

            let station=await stationService.getById(stationTherapistRelation.station_id);

            let division=await this.getById(station.division_id)

            return division
        } catch (e) {
            let msg = `根据工作室和咨询师关系ID获取对应的分部异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     * 根据id获取分部详情
     * @param division_id
     * @returns {Promise<any>}
     */
    async getById(division_id) {


        try {

            let data = await think.model(tableName).where({
                division_id
            }).find().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据id获取分部详情，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `根据id获取分部详情异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     * 根据订单id获取分部详情
     * @param division_id
     * @returns {Promise<any>}
     */
    async getByOrderId(order_id) {


        try {

            let data = await think.model(tableName).where({
                'appoint_order.order_id':order_id
            }).join({
                table:'station',
                join:'inner',
                on:['division_id','division_id'],
            }).join({
                table:'appointment',
                join:'inner',
                on:['station_id','station_id'],
            }).join({
                table:'order',
                join:'inner',
                on:['appointment_id','appointment_id'],
            }).find().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据订单id获取分部详情，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `根据订单id获取分部详情异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },



};
