const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName='咨询类型'
const tableName='consult_type'


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let consult_type_name = this.post('consult_type_name')
            let remark = this.post('remark')

            logger.info(`新增${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!consult_type_name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            let op_date=DateUtil.getNowStr()

            let addJson={
                consult_type_id:Util.uuid(),
                consult_type_name,
                remark,
                op_date
            }

            let data = await this.model(tableName).add(addJson);

            logger.info(`新增${entityName}，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`新增${entityName}异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 删除
     * @returns {Promise<boolean>}
     */
    async deleteAction() {
        try {

            let consult_type_id = this.post('consult_type_id')

            logger.info(`删除${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!consult_type_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }


            let data = await this.model(tableName).where({
                consult_type_id,
            }).delete()

            logger.info(`删除${entityName}，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`删除${entityName}异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 修改
     * @returns {Promise<boolean>}
     */
    async updateAction() {
        try {

            let consult_type_id = this.post('consult_type_id')
            let consult_type_name = this.post('consult_type_name')
            let remark = this.post('remark')

            logger.info(`修改${entityName}参数 :${JSON.stringify(this.post())}`)

            let updateJson={}
            if (!consult_type_name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            updateJson.consult_type_name=consult_type_name
            updateJson.remark=remark

            updateJson.op_date=DateUtil.getNowStr();

            let data = await this.model(tableName).where({
                consult_type_id
            }).update(updateJson);

            logger.info(`修改${entityName}，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`修改${entityName}异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 列表
     * @returns {Promise<boolean>}
     */
    async listAction() {
        try {

            logger.info(`获取${entityName}列表参数 `)

            let data = await this.model(tableName).select();

            logger.info(`获取${entityName}列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取${entityName}列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }




};
