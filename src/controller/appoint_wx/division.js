const Base = require('./base.js');

const Response = require('../../config/response')
const FUNCTION_LEVEL = require('../../config/constants/FUNCTION_LEVEL')
const RECEIVE_SIDE = require('../../config/constants/RECEIVE_SIDE')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName = '分部'
const tableName = 'division'
const divisionService = require('../../service/division')
const continueEduSettingService = require('../../service/continueEduSetting')


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let division_name = this.post('division_name')
            let function_level = this.post('function_level')
            let receive_side = this.post('receive_side')
            let sub_mch_id = this.post('sub_mch_id')

            function_level = function_level || FUNCTION_LEVEL.BASE;

            logger.info(`新增${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!division_name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            if (function_level === FUNCTION_LEVEL.ONLINEPAY && receive_side === undefined) {
                this.body = Response.businessException(`收款方不能为空！`)
                return false;
            }

            if (function_level === FUNCTION_LEVEL.ONLINEPAY && receive_side === RECEIVE_SIDE.SELF && !sub_mch_id) {
                this.body = Response.businessException(`收款微信商户号不能为空！`)
                return false;
            }

            let create_date = DateUtil.getNowStr()

            let division_id = Util.uuid()
            let addJson = {
                division_id,
                division_name,
                create_date,
                op_date: create_date,
                function_level,
                receive_side: receive_side || RECEIVE_SIDE.SYSTEM,
                sub_mch_id
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

            let division_id = this.post('division_id')

            logger.info(`删除${entityName}参数 :${JSON.stringify(this.post())}`)

            let updateJson = {}
            if (!division_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }

            updateJson.op_date = DateUtil.getNowStr();
            updateJson.state = 1

            let data = await this.model(tableName).where({
                division_id
            }).update(updateJson);

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

            let division_id = this.post('division_id')
            let division_name = this.post('division_name')
            let function_level = this.post('function_level')
            let receive_side = this.post('receive_side')
            let sub_mch_id = this.post('sub_mch_id')
            function_level = function_level || FUNCTION_LEVEL.BASE

            logger.info(`修改${entityName}参数 :${JSON.stringify(this.post())}`)

            let updateJson = {}
            if (!division_name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }
            if (function_level === FUNCTION_LEVEL.ONLINEPAY && receive_side === undefined) {
                this.body = Response.businessException(`收款方不能为空！`)
                return false;
            }

            if (function_level === FUNCTION_LEVEL.ONLINEPAY && receive_side === RECEIVE_SIDE.SELF && !sub_mch_id) {
                this.body = Response.businessException(`收款微信商户号不能为空！`)
                return false;
            }

            updateJson.division_name = division_name

            updateJson.op_date = DateUtil.getNowStr();
            updateJson.function_level = function_level

            let data = await this.model(tableName).where({
                division_id
            }).update({
                division_name,
                op_date: DateUtil.getNowStr(),
                function_level,
                receive_side: receive_side || RECEIVE_SIDE.SYSTEM,
                sub_mch_id
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

            logger.info(`获取${entityName}列表参数 `)

            let data = await this.model(tableName).where({
                state: 0
            }).order({
                create_date: "DESC"
            }).select();

            logger.info(`获取${entityName}列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取${entityName}列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 根据工作室和咨询师关系ID获取对应的分部
     * @returns {Promise<boolean>}
     */
    async getByStationTherapistRelationIdAction() {
        try {

            logger.info(`根据工作室和咨询师关系ID获取对应的分部参数：${JSON.stringify(this.post())} `)

            let station_therapist_relation_id = this.post('station_therapist_relation_id')

            let data = await divisionService.getByStationTherapistRelationId(station_therapist_relation_id)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`根据工作室和咨询师关系ID获取对应的分部异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 根据工作室ID获取对应的分部
     * @returns {Promise<boolean>}
     */
    async getByStationIdAction() {
        try {

            logger.info(`根据工作室ID获取对应的分部参数：${JSON.stringify(this.post())} `)

            let station_id = this.post('station_id')

            let data = await divisionService.getByStationId(station_id)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`根据工作室ID获取对应的分部异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


};
