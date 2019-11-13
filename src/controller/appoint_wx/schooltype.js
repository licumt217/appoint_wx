const Base = require('./base.js');

const Response = require('../../config/response')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName='流派类型'
const tableName='school_type'


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let school_type_name = this.post('school_type_name')

            logger.info(`新增${entityName}参数 :${this.post()}`)

            if (!school_type_name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            let op_date=DateUtil.getNowStr()

            let addJson={
                school_type_id:Util.uuid(),
                school_type_name,
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

            let school_type_id = this.post('school_type_id')

            logger.info(`删除${entityName}参数 :${this.post()}`)

            if (!school_type_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }


            let data = await this.model(tableName).where({
                school_type_id,
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

            let school_type_id = this.post('school_type_id')
            let school_type_name = this.post('school_type_name')

            logger.info(`修改${entityName}参数 :${this.post()}`)

            let updateJson={}
            if (!school_type_name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            updateJson.school_type_name=school_type_name

            updateJson.op_date=DateUtil.getNowStr();

            let data = await this.model(tableName).where({
                school_type_id
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
