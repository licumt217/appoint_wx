const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const logger = think.logger
const entityName = '设置'
const tableName = 'continue_edu_setting'

module.exports = {


    /**
     *新建分部时初始化一条配置信息
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async add(division_id) {


        let op_date = DateUtil.getNowStr()

        let start_date=new Date();
        start_date.setMonth(0)
        start_date.setDate(1);
        start_date=DateUtil.format(start_date)

        let end_date=new Date();
        end_date.setMonth(0)
        end_date.setDate(31);
        end_date=DateUtil.format(end_date)

        try {

            await think.model(tableName).add({
                setting_id:Util.uuid(),
                division_id,
                op_date,
                start_date,
                end_date
            }).catch(e => {
                throw new Error(e)
            })

        } catch (e) {
            let msg = `新建分部时初始化一条配置信息接口异常 msg:${e}`
            let returnMsg = `新建分部时初始化一条配置信息接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

    /**
     * 更新设置信息
     * @param user_id
     * @returns {Promise<void>}
     */
    async update(whereObj,updateObj) {

        try {

            await think.model(tableName).where(whereObj).update(updateObj)

        } catch (e) {
            let msg = `更新设置信息接口异常 msg:${e}`
            let returnMsg = `更新设置信息接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

    /**
     *根据分部ID获取设置信息
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getByDivisionId(division_id) {

        try {

            let data = await think.model(tableName).where({
                division_id
            }).find().catch(e => {
                throw new Error(e)
            })


            logger.info(`根据分部ID获取设置信息数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据分部ID获取设置信息接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

};
