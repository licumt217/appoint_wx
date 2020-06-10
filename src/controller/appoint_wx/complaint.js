const Base = require('./base.js');

const Response = require('../../config/response')
const ROLE = require('../../config/constants/ROLE')
const COMPLAINT_TYPE = require('../../config/constants/COMPLAINT_TYPE')
const Complaint_STATE = require('../../config/constants/COMPLAINT_STATE')
const Util = require('../../util/Util')
const Page = require('../../config/constants/PAGE')
const DateUtil = require('../../util/DateUtil')
const orderService = require('../../service/order')
const blacklistService = require('../../service/blacklist')
const logger = think.logger;

const entityName = '投诉'
const tableName = 'complaint'


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
                this.body = Response.businessException(`订单id不能为空！`)
                return false;
            }

            if (!content) {
                this.body = Response.businessException(`${entityName}内容不能为空！`)
                return false;
            }

            let complaint_date = DateUtil.getNowStr()

            let order = await orderService.getOne({order_id})

            let userInfo = this.ctx.state.userInfo

            console.log(userInfo)

            let addJson = {
                complaint_id: Util.uuid(),
                content,
                complaint_date,
                order_id,
                op_date: complaint_date,
                type: userInfo.role === ROLE.therapist ? COMPLAINT_TYPE.THERAPIST_USER : COMPLAINT_TYPE.USER_THERAPIST,
                user_id: order.user_id,
                therapist_id: order.therapist_id,
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
     * 保存调查报告
     * @returns {Promise<boolean>}
     */
    async saveResearchReportAction() {
        try {

            let complaint_id = this.post('complaint_id')
            let report_content = this.post('report_content')

            logger.info(`保存调查报告参数 :${JSON.stringify(this.post())}`)

            if (!complaint_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }
            let op_date = DateUtil.getNowStr()

            let data = await this.model(tableName).where({
                complaint_id,
            }).update({
                report_content,
                op_date
            })

            logger.info(`保存调查报告，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`保存调查报告异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 驳回咨询师的投诉
     * @returns {Promise<boolean>}
     */
    async rejectAction() {
        try {

            let complaint_id = this.post('complaint_id')

            logger.info(`驳回咨询师的投诉参数 :${JSON.stringify(this.post())}`)

            if (!complaint_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }
            let op_date = DateUtil.getNowStr()

            let data = await this.model(tableName).where({
                complaint_id,
            }).update({
                state: Complaint_STATE.REJECTED,
                op_date
            })

            logger.info(`驳回咨询师的投诉，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`驳回咨询师的投诉异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 添加黑名单
     * @returns {Promise<boolean>}
     */
    async addBlacklistAction() {
        try {

            let complaint_id = this.post('complaint_id')
            let user_id = this.post('user_id')

            logger.info(`添加黑名单参数 :${JSON.stringify(this.post())}`)

            if (!complaint_id) {
                this.body = Response.businessException(`投诉id不能为空！`)
                return false;
            }

            if (!user_id) {
                this.body = Response.businessException(`用户id不能为空！`)
                return false;
            }

            let op_date = DateUtil.getNowStr()

            let op_user_id = this.ctx.state.userInfo.user_id

            let data = await this.model(tableName).where({
                complaint_id,
            }).update({
                state: Complaint_STATE.ADD_BLACKLIST,
                op_date
            })

            await blacklistService.add(user_id,op_user_id);

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`添加黑名单异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 查询用户投诉咨询师列表
     * @returns {Promise<boolean>}
     */
    async getUserComplaintsAction() {
        try {

            logger.info(`查询用户投诉咨询师列表参数: ${JSON.stringify(this.post())}`)

            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize

            let startDate = this.post('startDate')
            let endDate = this.post('endDate')
            let userName = this.post('userName')
            let therapistName = this.post('therapistName')

            let dateWhere = {}

            if (startDate && endDate) {
                dateWhere = {
                    'complaint_date': ['between', [startDate, endDate]]
                }
            } else if (startDate && !endDate) {
                dateWhere = {
                    'complaint_date': ['>', startDate]
                }
            } else if (!startDate && endDate) {
                dateWhere = {
                    'complaint_date': ['<', endDate]
                }
            }

            let data = await this.model(tableName).where(Object.assign({
                'type': COMPLAINT_TYPE.USER_THERAPIST,
                'user.name': ['like', `%${userName || ''}%`],
                'therapist.name': ['like', `%${therapistName || ''}%`],
            }, dateWhere)).join({
                table: 'user',
                join: 'inner',
                as: 'user',
                on: ['user_id', 'user_id']
            }).join({
                table: 'user',
                join: 'inner',
                as: 'therapist',
                on: ['therapist_id', 'user_id']
            }).field(`appoint_complaint.*,user.*,
            therapist.name as therapist_name,
            therapist.phone as therapist_phone`).page(page, pageSize).countSelect();

            logger.info(`查询用户投诉咨询师列表数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`查询用户投诉咨询师列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 查询咨询师投诉用户列表
     * @returns {Promise<boolean>}
     */
    async getTherapistComplaintsAction() {
        try {

            logger.info(`查询咨询师投诉用户列表参数: ${JSON.stringify(this.post())}`)

            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize

            let startDate = this.post('startDate')
            let endDate = this.post('endDate')
            let userName = this.post('userName')
            let therapistName = this.post('therapistName')

            let dateWhere = {}

            if (startDate && endDate) {
                dateWhere = {
                    'complaint_date': ['between', [startDate, endDate]]
                }
            } else if (startDate && !endDate) {
                dateWhere = {
                    'complaint_date': ['>', startDate]
                }
            } else if (!startDate && endDate) {
                dateWhere = {
                    'complaint_date': ['<', endDate]
                }
            }

            let data = await this.model(tableName).where(Object.assign({
                'type': COMPLAINT_TYPE.THERAPIST_USER,
                'user.name': ['like', `%${userName || ''}%`],
                'therapist.name': ['like', `%${therapistName || ''}%`],
            }, dateWhere)).join({
                table: 'user',
                join: 'inner',
                as: 'user',
                on: ['user_id', 'user_id']
            }).join({
                table: 'user',
                join: 'inner',
                as: 'therapist',
                on: ['therapist_id', 'user_id']
            }).field(`appoint_complaint.*,user.*,
            therapist.name as therapist_name,
            therapist.phone as therapist_phone`).page(page, pageSize).countSelect();

            logger.info(`查询咨询师投诉用户列表数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`查询咨询师投诉用户列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }

    }

    /**
     * 根据咨询师ID查询咨询师投诉用户列表
     * @returns {Promise<boolean>}
     */
    async getTherapistComplaintsByTIdAction() {
        try {

            logger.info(`根据咨询师ID查询咨询师投诉用户列表参数: ${JSON.stringify(this.post())}`)
            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize
            let therapist_id = this.post('therapist_id')

            let data = await this.model(tableName).where({
                'type': COMPLAINT_TYPE.THERAPIST_USER,
                'therapist_id': therapist_id,
            }).join({
                table: 'user',
                as: 'user',
                on: ['user_id', 'user_id']
            }).field(`appoint_complaint.*,user.*`).page(page, pageSize).countSelect();

            logger.info(`根据咨询师ID查询咨询师投诉用户列表数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`根据咨询师ID查询咨询师投诉用户列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }

    }


};
