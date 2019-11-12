const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')

const logger =think.logger
const entityName = '订单'
const tableName = 'order'

module.exports =  {


    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async add(obj){

        try{

            let op_date = DateUtil.getNowStr()

            obj.op_date=op_date

            let data = await think.model(tableName).add(obj).catch(e=>{
                throw new Error(e)
            });;

            logger.info(`新增${entityName}数据库返回：${JSON.stringify(data)}`)

            return data;

        }catch (e) {
            let msg=`新增${entityName}接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },

    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getOne(whereObj){

        try{

            let data = await think.model(tableName).where(whereObj).find().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据条件查询单个${entityName}数据库返回：${JSON.stringify(data)}`)

            return data;

        }catch (e) {
            let msg=`根据条件查询单个${entityName}接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },

    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getList(whereObj){

        try{

            let data = await think.model(tableName).where(whereObj).select().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据条件查询${entityName}列表：${JSON.stringify(data)}`)

            return data;

        }catch (e) {
            let msg=`根据条件查询${entityName}列表接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },

    async update(whereObj,updateObj) {

        try {
            let op_date = DateUtil.getNowStr()

            updateObj.op_date=op_date

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
