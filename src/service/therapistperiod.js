const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')

const logger = think.logger
const entityName = '咨询师可用时间段'
const tableName = 'therapist_period'

module.exports = {


    async add(therapist_id,
              appoint_date,
              periodArray,big_order_id) {

        try {
            let op_date = DateUtil.getNowStr()

            let addJson = {
                therapist_period_id:Util.uuid(),
                therapist_id,
                appoint_date,
                big_order_id,
                op_date,
                period:periodArray.join(',')
            }

            let data = await think.model(tableName).add(addJson).catch(e=>{
                throw new Error(e)
            });

            logger.info(`新增${entityName}，数据库返回：${JSON.stringify(data)}`)

            return data
        } catch (e) {
            let msg=`新增${entityName}异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }

    },

    /**
     * 批量新增
     * @param arrays
     * @returns {Promise<T>}
     */
    async addMany(arrays) {

        try {

            // therapist_id,
            //     appoint_date,
            //     periodArray,big_order_id

            let orders=[]
            let op_date = DateUtil.getNowStr()

            arrays.forEach(item=>{
                item.therapist_period_id=Util.uuid();
                item.op_date=op_date
                item.period=item.period.join(',')
                orders.push(item);

            })


            // let addJson = {
            //     therapist_period_id:Util.uuid(),
            //     therapist_id,
            //     appoint_date,
            //     big_order_id,
            //     op_date,
            //     period:periodArray.join(',')
            // }

            let data = await think.model(tableName).addMany(orders).catch(e=>{
                throw new Error(e)
            });

            logger.info(`批量新增${entityName}，数据库返回：${JSON.stringify(data)}`)

            return data
        } catch (e) {
            let msg=`批量新增${entityName}异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }

    },

    async update(whereObj,updateObj) {

        try {
            let op_date = DateUtil.getNowStr()

            updateObj.op_date=op_date

            //将对应的咨询师时段占用释放掉
            let data = await think.model(tableName).where(whereObj).update(updateObj).catch(e=>{
                throw new Error(e)
            });

            logger.info(`更新${entityName}，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg=`更新${entityName}异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }

    }

};
