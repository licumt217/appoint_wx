const Base = require('./base.js');

const Response = require('../../config/response')
const ROLE = require('../../config/constants/ROLE')

const continueEduItemService = require('../../service/continueEduItem')
const divisionAdminRelationService = require('../../service/divisionAdminRelation')
const continueEduService = require('../../service/continueEdu')
const logger = think.logger;
const DateUtil = require('../../util/DateUtil')
const fs=require('fs')

const entityName = '继续教育条目'
const tableName = 'continue_edu_item'


module.exports = class extends Base {


    /**
     * 获取继续教育条目
     * @returns {Promise<void>}
     */
    async listAction() {
        try {

            let continue_edu_id=this.post('continue_edu_id')

            let data = await continueEduItemService.list(continue_edu_id)

            this.body = Response.success(data);

        } catch (e) {
            let msg = `获取继续教育条目异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }




};
