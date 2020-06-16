const Base = require('./base.js');

const Response = require('../../config/response')
const ROLE = require('../../config/constants/ROLE')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const orderService = require('../../service/order')
const logger = think.logger;

const entityName = '咨询效果反馈'
const tableName = 'feedback'


module.exports = class extends Base {


    /**
     * 新增
     * 如果已存在，则更新。
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let order_id = this.post('order_id')
            let content = this.post('content')

            logger.info(`新增${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!order_id) {
                this.body = Response.businessException(`订单id不能为空！`)
                return false;
            }

            if (!content) {
                this.body = Response.businessException(`${entityName}内容不能为空！`)
                return false;
            }

            let feedback=await this.model(tableName).where({
                order_id,
            }).find()

            let feedback_date = DateUtil.getNowStr()

            if(Util.isEmptyObject(feedback)){//新增

                let order = await orderService.getOne({order_id})

                let addJson = {
                    feedback_id: Util.uuid(),
                    content,
                    feedback_date,
                    order_id,
                    op_date: feedback_date,
                    user_id: order.user_id,
                    therapist_id: order.therapist_id,
                }

                await this.model(tableName).add(addJson);

            }else{//更新

                await this.model(tableName).where({
                    feedback_id:feedback.feedback_id
                }).update({
                    content,
                    feedback_date,
                    op_date: feedback_date,
                })

            }

            this.body = Response.success();

        } catch (e) {
            let msg=`新增${entityName}异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }

    /**
     * 根据订单ID获取咨询反馈内容
     * @returns {Promise<boolean>}
     */
    async getByOrderIdAction() {
        try {

            let order_id = this.post('order_id')

            logger.info(`根据订单ID获取咨询反馈内容参数 :${JSON.stringify(this.post())}`)

            if (!order_id) {
                this.body = Response.businessException(`订单id不能为空！`)
                return false;
            }

            let data = await this.model(tableName).where({
                order_id,
            }).find();

            logger.info(`根据订单ID获取咨询反馈内容，数据库返回：${JSON.stringify(data)}`)

            data=Util.isEmptyObject(data)?null:data

            this.body = Response.success(data);

        } catch (e) {
            let msg=`根据订单ID获取咨询反馈内容异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }




};
