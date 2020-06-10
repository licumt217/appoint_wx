const Base = require('./base.js');

const Response = require('../../config/response')
const logger = think.logger;
const tableName='therapist_period_set'

module.exports = class extends Base {

    /**
     * 获取咨询师可用时段设置
     * @returns {Promise<void>}
     */
    async getByTherapistIdAction() {
        try {

            let therapist_id = this.post('therapist_id')
            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }

            let data = await this.model(tableName).where({
                therapist_id
            }).find();


            logger.info(`获取咨询师可用时段设置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取咨询师可用时段设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 更新咨询师可用时段设置
     * @returns {Promise<void>}
     */
    async updateByTherapistIdAction() {
        try {

            let period=this.post('period')
            let therapist_id=this.ctx.state.userInfo.user_id

            if (!period) {
                this.body = Response.businessException(`时段设置不能为空！`)
                return false;
            }

            logger.info(`更新咨询师可用时段设置参数 :${JSON.stringify(this.post())}`)

            let data = await this.model(tableName).where({
                therapist_id
            }).update({
                period
            })


            logger.info(`更新咨询师可用时段设置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`更新咨询师可用时段设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }



};
