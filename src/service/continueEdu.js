const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const logger = think.logger
const entityName = '继续教育'
const tableName = 'continue_edu'

module.exports = {


    /**
     *根据用户Id获取继续教育列表
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async listByUserId(user_id) {

        try {

            let data = await think.model(tableName).where({user_id}).select().catch(e => {
                throw new Error(e)
            })


            logger.info(`根据用户Id获取继续教育列表数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据用户Id获取继续教育列表接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *咨询师新增继续教育
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async add(obj) {

        try {

            let continue_edu_id=Util.uuid()
            obj.continue_edu_id=continue_edu_id
            obj.op_date=DateUtil.getNowStr();

            let data=await think.model(tableName).where({
                year:obj.year,
                user_id:obj.user_id
            }).find().catch(e => {
                throw new Error(e)
            })

            if(!Util.isEmptyObject(data)){
                throw new Error(`该年度的继续教育记录已存在！不能重复添加！`)
            }else{
                data = await think.model(tableName).add(obj).catch(e => {
                    throw new Error(e)
                })

                logger.info(`咨询师新增继续教育数据库返回：${JSON.stringify(data)}`)

                return continue_edu_id;
            }

        } catch (e) {
            let msg = `咨询师新增继续教育接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *咨询师修改继续教育
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async update(whereObj={},updateObj={}) {

        try {

            updateObj.op_date=DateUtil.getNowStr();

            let data = await think.model(tableName).where(whereObj).update(updateObj).catch(e => {
                throw new Error(e)
            })


            logger.info(`咨询师修改继续教育数据库返回：${JSON.stringify(data)}`)

        } catch (e) {
            let msg = `咨询师修改继续教育接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     * 根据咨询师ID和年份获取继续教育详情
     * @param user_id
     * @param year
     * @returns {Promise<any>}
     */
    async getByUserIdAndYear(user_id,year) {

        try {

            let data = await think.model(tableName).where({
                user_id,
                year
            }).find().catch(e => {
                throw new Error(e)
            })


            logger.info(`根据咨询师ID和年份获取继续教育详情数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据咨询师ID和年份获取继续教育详情接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },


};
