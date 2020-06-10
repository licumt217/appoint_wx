const logger = think.logger
const entityName = '咨询师收费设置'
const tableName = 'therapist_fee_set'

module.exports = {


    /**
     * 根据咨询师ID获取此咨询师的收费设置
     * @param therapist_id
     * @returns {Promise<any>}
     */
    async getByTherapistId(therapist_id) {

        try {

            let data = await think.model(tableName).where({
                therapist_id
            }).find();


            logger.info(`根据咨询师ID获取此咨询师的收费设置数据库返回：${JSON.stringify(data)}`)

            return data;

        } catch (e) {
            let msg = `根据咨询师ID获取此咨询师的收费设置接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },





};
