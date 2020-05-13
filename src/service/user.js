const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatUtil = require('../util/WechatUtil')
const logger =think.logger
const entityName = '用户'
const tableName = 'user'

module.exports =  {



    /**
     *根据手机号获取对应用户
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getByPhone(phone){

        try{

            let data = await think.model(tableName).where({
                phone
            }).find().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据手机号获取对应用户数据库返回：${JSON.stringify(data)}`)

            return data;

        }catch (e) {
            let msg=`根据手机号获取对应用户接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },

    /**
     * 根据用户id删除对应用户
     * @param user_id
     * @returns {Promise<T>}
     */
    async deleteById(user_id){

        try{

            let data = await think.model(tableName).where({
                user_id
            }).delete().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据用户id删除对应用户数据库返回：${JSON.stringify(data)}`)

            return data;

        }catch (e) {
            let msg=`根据用户id删除对应用户接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },


};
