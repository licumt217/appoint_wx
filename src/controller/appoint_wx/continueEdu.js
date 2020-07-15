const Base = require('./base.js');

const Response = require('../../config/response')

const Page = require('../../config/constants/PAGE')
const continueEduItemService = require('../../service/continueEduItem')
const stationCasemanagerRelationService = require('../../service/stationCasemanagerRelation')
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
     * 获取继续教育分页列表
     * 分部管理员和咨询师查看
     * @returns {Promise<void>}
     */
    async queryListAction() {
        try {

            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize

            let name=this.post('name')||""
            let year=this.post('year')||""

            let user_id = this.ctx.state.userInfo.user_id;
            let role = this.ctx.state.userInfo.role;

            let data = await continueEduService.queryList(role,user_id,page,pageSize,name,year)

            this.body = Response.success(data);

        } catch (e) {
            let msg = `获取继续教育分页列表异常`
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
            let year = String(new Date().getFullYear()-1)

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
            let year = String(new Date().getFullYear()-1);


            let data=this.post('data')

            let continue_edu_id=await continueEduService.add({
                user_id,
                year
            })


            await continueEduItemService.addMany(data,continue_edu_id)

            this.body = Response.success();

        } catch (e) {
            let msg = `咨询师新增继续教育异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }

    /**
     * 修改咨询师继续教育信息
     * @returns {Promise<void>}
     */
    async updateAction() {
        try {

            logger.info(`修改咨询师继续教育信息参数：${JSON.stringify(this.post())}`)


            let continue_edu_id=this.post('continue_edu_id')

            let data=this.post('data')

            await continueEduService.update({continue_edu_id})

            await continueEduItemService.deleteByContinueEduId(continue_edu_id)

            await continueEduItemService.addMany(data,continue_edu_id)

            this.body = Response.success();

        } catch (e) {
            let msg = `修改咨询师继续教育信息异常`
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
