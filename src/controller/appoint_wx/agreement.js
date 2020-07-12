const Base = require('./base.js');

const Response = require('../../config/response')

const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName = '用户协议'
const tableName = 'agreement'


module.exports = class extends Base {



    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            logger.info(`新增${entityName}参数 :${JSON.stringify(this.post())}`)

            let content = this.post('content')



            if (!content) {
                this.body = Response.businessException(`协议内容不能为空！`)
                return false;
            }

            let op_date=DateUtil.getNowStr();
            await this.model(tableName).add({
                agreement_id:Util.uuid(),
                op_date,
                create_date:op_date,
                content
            })

            this.body = Response.success();

        } catch (e) {
            let msg=`新增${entityName}异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }

    /**
     * 移除
     * @returns {Promise<boolean>}
     */
    async deleteAction() {
        try {

            let agreement_id = this.post('agreement_id')

            logger.info(`移除${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!agreement_id) {
                this.body = Response.businessException(`id不能为空！`)
                return false;
            }

            await this.model(tableName).where({
                agreement_id
            }).delete();

            this.body = Response.success();

        } catch (e) {
            let msg=`移除${entityName}异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }

    /**
     * 修改用户协议
     * @returns {Promise<boolean>}
     */
    async updateAction() {
        try {

            logger.info(`修改${entityName}参数 :${JSON.stringify(this.post())}`)

            let agreement_id = this.post('agreement_id')
            let content = this.post('content')

            if (!agreement_id) {
                this.body = Response.businessException(`协议ID不能为空！`)
                return false;
            }

            if (!content) {
                this.body = Response.businessException(`协议内容不能为空！`)
                return false;
            }

            let op_date=DateUtil.getNowStr();
            await this.model(tableName).where({
                agreement_id
            }).update({
                content,
                op_date
            })

            this.body = Response.success();

        } catch (e) {
            let msg=`修改${entityName}异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }



    /**
     * 查询用户协议列表
     * @returns {Promise<boolean>}
     */
    async getListAction() {
        try {

            logger.info(`查询用户协议列表参数: ${JSON.stringify(this.post())}`)



            let data = await this.model(tableName).select();

            logger.info(`查询用户协议列表数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`查询用户协议列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }

    }


};
