const Base = require('./base.js');

const Response = require('../../config/response')
const ROLE = require('../../config/constants/ROLE')

const divisionAdminRelationService = require('../../service/divisionAdminRelation')
const continueEduService = require('../../service/continueEdu')
const logger = think.logger;
const DateUtil = require('../../util/DateUtil')
const fs=require('fs')

const entityName = '继续教育'
const tableName = 'continue_edu'


module.exports = class extends Base {


    /**
     * 获取继续教育列表
     * @returns {Promise<void>}
     */
    async listAction() {
        try {

            let user_id = this.ctx.state.userInfo.user_id;
            let data = await continueEduService.listByUserId(user_id)

            this.body = Response.success(data);

        } catch (e) {
            let msg = `获取继续教育列表异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }

    /**
     * 根据咨询师ID和年份获取继续教育详情
     * @returns {Promise<void>}
     */
    async getByUserIdAndYearAction() {
        try {

            let user_id = this.ctx.state.userInfo.user_id;
            let year = this.post('year')

            let data = await continueEduService.getByUserIdAndYear(user_id, year)

            this.body = Response.success(data);

        } catch (e) {
            let msg = `根据咨询师ID和年份获取继续教育详情异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }

    /**
     * 咨询师新增继续教育
     * @returns {Promise<void>}
     */
    async addAction() {
        try {

            let user_id = this.ctx.state.userInfo.user_id;
            let year = String(new Date().getFullYear());

            let name=this.post('name')

            let attachment=this.post('attachment')

            let data = await continueEduService.add({
                name,
                attachment,
                user_id,
                year
            })

            this.body = Response.success(data);

        } catch (e) {
            let msg = `咨询师新增继续教育异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }

    /**
     * 上传继续教育信息附件
     * @returns {Promise<void>}
     */
    async uploadAction() {
        try {

            logger.info(`上传继续教育信息附件参数：${this.post()}`)

            if (!think.isEmpty(this.file('file'))) {
                let file = think.extend({}, this.file('file'));
                let savepath = think.ROOT_PATH + '/www/static/files/';
                let filepath = file.path; //文件路径
                let filename = file.name; //文件名
                let suffix = filename.substr(filename.lastIndexOf('.') + 1); //文件后缀
                let newfilename = think.uuid() + '.' + suffix;

                let datas = fs.readFileSync(filepath);

                fs.writeFileSync(savepath + newfilename, datas);
                this.body = Response.success({url: '/static/files/' + newfilename})
            } else {
                this.body = Response.businessException("文件不能为空")
            }

        } catch (e) {
            let msg = `上传继续教育信息附件异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }


};
