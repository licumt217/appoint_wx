const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const ONLINE_PAY = require('../config/constants/ONLINE_PAY')
const logger = think.logger
const entityName = '支付记录'
const tableName = 'pay_record'

module.exports = {


    /**
     * 新增一条线下支付记录
     * @param obj
     * @returns {Promise<number>}
     */
    async addOfflinePayRecord(openid,total_fee) {
        let op_date = DateUtil.getNowStr()
        let obj={
            pay_record_id:Util.uuid(),
            pay_type:ONLINE_PAY.NO,
            openid,
            total_fee,
            op_date
        }

        try {

            let data = await think.model(tableName).add(obj).catch(e => {
                throw new Error(e)
            });

            logger.info(`新增一条线下支付记录，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `新增一条线下支付记录异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },



};
