const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName='房间'
const tableName='room'


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let name = this.post('name')
            let position = this.post('position')

            logger.info(`新增${entityName}参数 name:${name}, position:${position},`)

            if (!name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            if (!position) {
                this.body = Response.businessException(`${entityName}位置不能为空！`)
                return false;
            }

            let op_date=DateUtil.getNowStr()

            let addJson={
                room_id:Util.uuid(),
                name,
                position,
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

            let room_id = this.post('room_id')

            logger.info(`删除${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!room_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }


            let data = await this.model(tableName).where({
                room_id,
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

            let room_id = this.post('room_id')
            let name = this.post('name')
            let position = this.post('position')

            logger.info(`修改${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            if (!position) {
                this.body = Response.businessException(`${entityName}位置不能为空！`)
                return false;
            }

            let op_date=DateUtil.getNowStr();

            let data = await this.model(tableName).where({
                room_id
            }).update({
                name,
                position,
                op_date
            })

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

            let page = this.post('page')||Page.currentPage
            let pageSize = this.post('pageSize')||Page.pageSize

            logger.info(`获取${entityName}列表参数 :${JSON.stringify(this.post())}`)

            let data = await this.model(tableName).page(page,pageSize).countSelect();


            logger.info(`获取${entityName}列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取${entityName}列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }







};
