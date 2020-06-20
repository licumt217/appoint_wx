const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const logger = think.logger
const entityName = '黑名单'
const tableName = 'blacklist'

module.exports = {


    /**
     *新增黑名单
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async add(user_id,op_user_id,complaint_id) {


        let create_date = DateUtil.getNowStr()

        let op_date = create_date

        let addJson = {
            blacklist_id: Util.uuid(),
            user_id,
            add_date: op_date,
            op_date,
            op_user_id,
            complaint_id
        }


        try {

            await think.model(tableName).add(addJson).catch(e => {
                throw new Error(e)
            })

        } catch (e) {
            let msg = `新增${entityName}接口异常 msg:${e}`
            let returnMsg = `新增黑名单接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

    /**
     * 判断给定用户是否系统黑名单用户
     * @param user_id
     * @returns {Promise<void>}
     */
    async isBlacklistUser(user_id) {

        try {

            let data=await think.model(tableName).where({
                user_id
            }).find();

            if(Util.isEmptyObject(data)){
                return false;
            }else{
                return true;
            }

        } catch (e) {
            let msg = `判断给定用户是否系统黑名单用户接口异常 msg:${e}`
            let returnMsg = `判断给定用户是否系统黑名单用户接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

    /**
     *根据ID获取黑名单信息
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getById(blacklist_id) {

        try {

            let data = await think.model(tableName).where({
                blacklist_id
            }).find().catch(e => {
                throw new Error(e)
            })


            logger.info(`根据ID获取黑名单信息数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据ID获取黑名单信息接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },

};
