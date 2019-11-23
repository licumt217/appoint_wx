const Base = require('./base.js');

const Response = require('../../config/response')
const Role = require('../../config/Role')
const COMPLAINT_TYPE = require('../../config/COMPLAINT_TYPE')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const orderService = require('../../service/order')
const logger = think.logger;

const entityName='投诉'
const tableName='complaint'


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let order_id = this.post('order_id')
            let content = this.post('content')

            logger.info(`新增${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!order_id) {
                this.body = Response.businessException(`$订单id不能为空！`)
                return false;
            }

            if (!content) {
                this.body = Response.businessException(`${entityName}内容不能为空！`)
                return false;
            }

            let op_date=DateUtil.getNowStr()

            let order= await orderService.getOne({order_id})

            let userInfo=this.ctx.state.userInfo

            let addJson={
                complaint_id:Util.uuid(),
                content,
                op_date,
                order_id,
                type:userInfo.role===Role.therapist?COMPLAINT_TYPE.THERAPIST_USER:COMPLAINT_TYPE.USER_THERAPIST,
                user_id:order.user_id,
                therapist_id:order.therapist_id,
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

            let complaint_id = this.post('complaint_id')

            logger.info(`删除${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!complaint_id) {
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
