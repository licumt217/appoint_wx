const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const ONLINE_PAY = require('../config/constants/ONLINE_PAY')
const logger = think.logger
const entityName = '退款记录'
const tableName = 'refund_record'

module.exports = {


    /**
     * 新增一条退款记录
     * @param openid
     * @param total_fee
     * @returns {Promise<number>}
     */
    async add(obj) {
        obj.refund_record_id=Util.uuid();
        obj.op_date=DateUtil.getNowStr();

        try {

            let data = await think.model(tableName).add(obj).catch(e => {
                throw new Error(e)
            });

            logger.info(`新增一条退款记录，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `新增一条退款记录异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     * 根据订单iD查询退款记录详情
     * 暂时不支持单个订单部分退款
     * @param order_id
     * @returns {Promise<number>}
     */
    async getByOrderId(order_id) {

        try {

            let data = await think.model(tableName).where({
                order_id
            }).find().catch(e => {
                throw new Error(e)
            });

            logger.info(`根据订单iD查询退款记录详情，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `根据订单iD查询退款记录详情 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },




};
