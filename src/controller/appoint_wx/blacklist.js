const Base = require('./base.js');

const Response = require('../../config/response')
const ROLE = require('../../config/constants/ROLE')
const COMPLAINT_TYPE = require('../../config/constants/COMPLAINT_TYPE')
const Complaint_STATE = require('../../config/constants/COMPLAINT_STATE')

const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const orderService = require('../../service/order')
const logger = think.logger;

const entityName = '黑名单'
const tableName = 'blacklist'


module.exports = class extends Base {



    /**
     * 移除黑名单
     * @returns {Promise<boolean>}
     */
    async deleteAction() {
        try {

            let blacklist_id = this.post('blacklist_id')

            logger.info(`移除${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!blacklist_id) {
                this.body = Response.businessException(`id不能为空！`)
                return false;
            }

            await this.model(tableName).where({
                blacklist_id
            }).delete();

            this.body = Response.success();

        } catch (e) {
            let msg=`移除${entityName}异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }



    /**
     * 查询黑名单列表
     * @returns {Promise<boolean>}
     */
    async getListAction() {
        try {

            logger.info(`查询黑名单列表参数: ${JSON.stringify(this.post())}`)

            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize


            let data = await this.model(tableName).join({
                table: 'user',
                join: 'left',
                on: ['user_id', 'user_id']
            }).page(page, pageSize).countSelect();

            logger.info(`查询黑名单列表数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`查询黑名单列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }

    }


};
