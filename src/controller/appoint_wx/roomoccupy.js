const Base = require('./base.js');

const Response = require('../../config/response')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName='房间占用状态'
const tableName='room_occupy'


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let room_id = this.post('room_id')
            let year = this.post('year')
            let month = this.post('month')
            let day = this.post('day')
            let period = this.post('period')
            let state = this.post('state')

            logger.info(`新增${entityName}参数 :${this.post()}`)

            if (!room_id) {
                this.body = Response.businessException(`${entityName}房间不能为空！`)
                return false;
            }

            if (!year) {
                this.body = Response.businessException(`${entityName}年份不能为空！`)
                return false;
            }

            if (!month && month!==0) {
                this.body = Response.businessException(`${entityName}月份不能为空！`)
                return false;
            }

            if (!day) {
                this.body = Response.businessException(`${entityName}天不能为空！`)
                return false;
            }

            if (!period) {
                this.body = Response.businessException(`${entityName}占用时间段不能为空！`)
                return false;
            }

            state=state||0;

            let op_date=DateUtil.getNowStr()

            let addJson={
                room_occupy_id:Util.uuid(),
                room_id,
                year,
                month,
                day,
                period,
                state,
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

            let room_occupy_id = this.post('room_occupy_id')

            logger.info(`删除${entityName}参数 :${this.post()}`)

            if (!room_occupy_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }


            let data = await this.model(tableName).where({
                room_occupy_id,
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

            let room_occupy_id = this.post('room_occupy_id')
            let room_id = this.post('room_id')
            let year = this.post('year')
            let month = this.post('month')
            let day = this.post('day')
            let period = this.post('period')
            let state = this.post('state')

            logger.info(`修改${entityName}参数 :${this.post()}`)

            if (!room_occupy_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }

            if (!room_id) {
                this.body = Response.businessException(`${entityName}房间不能为空！`)
                return false;
            }

            if (!year) {
                this.body = Response.businessException(`${entityName}年份不能为空！`)
                return false;
            }

            if (!month && month!==0) {
                this.body = Response.businessException(`${entityName}月份不能为空！`)
                return false;
            }

            if (!day) {
                this.body = Response.businessException(`${entityName}天不能为空！`)
                return false;
            }

            if (!period) {
                this.body = Response.businessException(`${entityName}占用时间段不能为空！`)
                return false;
            }

            state=state||0;

            let op_date=DateUtil.getNowStr()

            let data = await this.model(tableName).where({
                room_occupy_id
            }).update({
                room_id,
                year,
                month,
                day,
                state,
                period,
                op_date
            });

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

            let room_id = this.post('room_id')
            let year = this.post('year')
            let month = this.post('month')

            logger.info(`获取${entityName}列表参数 room_id:${room_id}，year:${year}，month:${month}，`)

            let data = await this.model(tableName).where({
                room_id,
                year,
                month
            }).select();

            logger.info(`获取${entityName}列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取${entityName}列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }




};
