const Base = require('./base.js');

const Response = require('../../config/response')
const ROLE = require('../../config/constants/ROLE')

const divisionAdminRelationService = require('../../service/divisionAdminRelation')
const continueEduSettingService = require('../../service/continueEduSetting')
const logger = think.logger;
const DateUtil = require('../../util/DateUtil')

const entityName = '继续教育设置'
const tableName = 'continue_edu_setting'


module.exports = class extends Base {


    /**
     * 超管初始化一条继续教育设置记录
     * @returns {Promise<boolean>}
     */
    async initAction() {
        try {

            await continueEduSettingService.init()

            this.body = Response.success();

        } catch (e) {
            let msg = `超管初始化一条继续教育设置记录异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }

    /**
     * 获取继续教育设置情况
     * @returns {Promise<boolean>}
     */
    async getAction() {
        try {

            let data = await continueEduSettingService.get()

            this.body = Response.success(data);

        } catch (e) {
            let msg = `获取继续教育设置情况异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }


    /**
     * 更新继续教育设置
     * @returns {Promise<boolean>}
     */
    async updateAction() {
        try {

            logger.info(`更新继续教育设置参数: ${JSON.stringify(this.post())}`)

            let setting_id = this.post('setting_id')
            let start_date = this.post('start_date')
            let end_date = this.post('end_date')
            let continue_edu_state = this.post('continue_edu_state')

            if (!setting_id) {
                this.body = Response.businessException('ID不能为空！')
                return false;
            }

            if (!start_date) {
                this.body = Response.businessException('开始日期不能为空！')
                return false;
            }

            if (!end_date) {
                this.body = Response.businessException('结束日期不能为空！')
                return false;
            }

            let data = await continueEduSettingService.update({
                setting_id
            }, {
                start_date,
                end_date,
                continue_edu_state,
                op_date: DateUtil.getNowStr()
            });

            logger.info(`更新继续教育设置数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`更新继续教育设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }

    }


};
