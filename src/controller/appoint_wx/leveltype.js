const Base = require('./base.js');

const Response = require('../../config/response')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName='等级类型'
const tableName='level_type'


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let level_type_name = this.post('level_type_name')
            let divide_ratio = this.post('divide_ratio')

            logger.info(`新增${entityName}参数 :${this.post()}`)

            if (!level_type_name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            if (!divide_ratio) {
                this.body = Response.businessException(`分成比例不能为空！`)
                return false;
            }

            let op_date=DateUtil.getNowStr()

            let addJson={
                level_type_id:Util.uuid(),
                level_type_name,
                divide_ratio,
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

            let level_type_id = this.post('level_type_id')

            logger.info(`删除${entityName}参数 :${this.post()}`)

            if (!level_type_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }


            let data = await this.model(tableName).where({
                level_type_id,
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

            let level_type_id = this.post('level_type_id')
            let level_type_name = this.post('level_type_name')
            let divide_ratio = this.post('divide_ratio')

            logger.info(`修改${entityName}参数 :${this.post()}`)

            let updateJson={}
            if (!level_type_name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            if (!divide_ratio) {
                this.body = Response.businessException(`分成比例不能为空！`)
                return false;
            }

            updateJson.level_type_name=level_type_name
            updateJson.divide_ratio=divide_ratio

            updateJson.op_date=DateUtil.getNowStr();

            let data = await this.model(tableName).where({
                level_type_id
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
