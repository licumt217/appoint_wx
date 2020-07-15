const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const logger = think.logger
const entityName = '继续教育记录'
const tableName = 'continue_edu_item'

module.exports = {


    /**
     *批量新增咨询师继续教育记录
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async addMany(array,continue_edu_id) {

        try {
            let op_date=DateUtil.getNowStr();

            array.forEach(item=>{
                item.continue_edu_item_id=Util.uuid();
                item.op_date=op_date;
                item.continue_edu_id=continue_edu_id;
            })

            let data = await think.model(tableName).addMany(array).catch(e => {
                throw new Error(e)
            })


            logger.info(`批量新增咨询师继续教育记录数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `批量新增咨询师继续教育记录接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     *批量删除咨询师继续教育记录
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async deleteByContinueEduId(continue_edu_id) {

        try {

            let data = await think.model(tableName).where({
                continue_edu_id
            }).delete().catch(e => {
                throw new Error(e)
            })


            logger.info(`批量删除咨询师继续教育记录数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `批量删除咨询师继续教育记录接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

    /**
     * 获取某咨询师某年度的继续教育条目
     * @returns {Promise<any>}
     */
    async list(continue_edu_id) {

        try {

            let data = await think.model(tableName).where({
                continue_edu_id,
            }).select().catch(e => {
                throw new Error(e)
            })


            logger.info(`获取某咨询师某年度的继续教育条目数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `获取某咨询师某年度的继续教育条目接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },


};
