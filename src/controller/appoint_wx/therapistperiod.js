const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const therapistperiodService = require('../../service/therapistperiod')
const logger = think.logger;

const entityName = '咨询师可用时间段'
const tableName = 'therapist_period'


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let therapist_id = this.post('therapist_id'),
                appoint_date = this.post('appoint_date'),
                periodArray = this.post('periodArray')

            logger.info(`新增${entityName}参数 therapist_id:${therapist_id}, appoint_date:${appoint_date}, periodArray:${JSON.stringify(periodArray)}`)

            if (!therapist_id) {
                this.body = Response.businessException(`${entityName}咨询师不能为空！`)
                return false;
            }

            if (!appoint_date) {
                this.body = Response.businessException(`${entityName}咨询日期不能为空！`)
                return false;
            }

            if (!periodArray || periodArray.length === 0) {
                this.body = Response.businessException(`${entityName}咨询时段不能为空！`)
                return false;
            }

            let response = therapistperiodService.add(therapist_id, appoint_date, periodArray)

            if (response.isSuccessful()) {
                this.body = response;
            } else {
                logger.info(`新增${entityName}异常 msg:${response.errorMsg}`);
                this.body = Response.businessException(response.errorMsg);
            }

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


            //TODO 改为软删除
            let therapist_period_id = this.post('therapist_period_id')

            logger.info(`删除${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!therapist_period_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }


            let data = await this.model(tableName).where({
                therapist_period_id,
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

            let therapist_id = this.post('therapist_id'),
                appoint_date = this.post('appoint_date'),
                period1 = this.post('period1'),
                period2 = this.post('period2'),
                period3 = this.post('period3'),
                period4 = this.post('period4'),
                period5 = this.post('period5'),
                period6 = this.post('period6'),
                period7 = this.post('period7'),
                period8 = this.post('period8')

            logger.info(`修改${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!therapist_id) {
                this.body = Response.businessException(`${entityName}咨询师不能为空！`)
                return false;
            }

            if (!appoint_date) {
                this.body = Response.businessException(`${entityName}咨询日期不能为空！`)
                return false;
            }

            let updateJson = {}
            if (period1 || period1 === 0) {
                updateJson.period1 = period1;
            }
            if (period2 || period2 === 0) {
                updateJson.period2 = period2
            }
            if (period3 || period3 === 0) {
                updateJson.period3 = period3
            }
            if (period4 || period4 === 0) {
                updateJson.period4 = period4
            }
            if (period5 || period5 === 0) {
                updateJson.period5 = period5
            }
            if (period6 || period6 === 0) {
                updateJson.period6 = period6
            }
            if (period7 || period7 === 0) {
                updateJson.period7 = period7
            }
            if (period8 || period8 === 0) {
                updateJson.period8 = period8
            }

            updateJson.op_date = DateUtil.getNowStr();

            let op_date = DateUtil.getNowStr()

            let data = await this.model(tableName).where({
                therapist_id,
                appoint_date,
                op_date
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
            let therapist_id = this.post('therapist_id'),
                appoint_date = this.post('appoint_date')


            logger.info(`获取${entityName}列表参数 ：${JSON.stringify(this.post())}`)

            let data = await this.model(tableName).where({
                therapist_id,
                state: Util.ZERO,
                appoint_date
            }).select();

            logger.info(`获取${entityName}列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取${entityName}列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 列表,根据给定日期的月份查询当月的
     * @returns {Promise<boolean>}
     */
    async listByMonthAction() {
        try {
            let therapist_id = this.post('therapist_id'),
                appoint_date = this.post('appoint_date');

            let begin_date = Util.getFirstDayOfGivenDate(new Date(appoint_date))
            let end_date = Util.getLastDayOfGivenDate(new Date(appoint_date))

            logger.info('begin:', begin_date)
            logger.info('end_date:', end_date)


            logger.info(`获取${entityName}列表参数 ：${JSON.stringify(this.post())}`)

            let data = await this.model(tableName).where({
                therapist_id,
                // state: Util.ZERO,//TODO 此处0是默认值，1代表已取消了这条时段预约
                appoint_date: ['between', DateUtil.format(begin_date), DateUtil.format(end_date)]
            }).select();

            logger.info(`获取${entityName}列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取${entityName}列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


};
