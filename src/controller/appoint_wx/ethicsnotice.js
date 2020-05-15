const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName = '伦理公告'
const tableName = 'ethicsnotice'


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {
            logger.info(`新增${entityName}参数 :${JSON.stringify(this.post())}`)

            let therapist_id = this.post('therapist_id')
            let show_manner = this.post('show_manner')
            let end_date = this.post('end_date')
            let content = this.post('content')


            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }

            if (!show_manner && show_manner !== 0) {
                this.body = Response.businessException(`显示方式不能为空！`)
                return false;
            }

            if (show_manner === 2 && !end_date) {
                this.body = Response.businessException(`显示截止日期不能为空！`)
            }
            if (!content) {
                this.body = Response.businessException(`公告内容不能为空！`)
                return false;
            }

            //判断当前咨询师是否已经被添加过黑名单了

            let existData=await this.model(tableName).where({
                therapist_id
            }).find();

            if(!Util.isEmptyObject(existData)){
                this.body = Response.businessException(`所选咨询师已存在伦理公告！`)
                return false;
            }


            let op_date = DateUtil.getNowStr()

            let addJson = {
                ethicsnotice_id: Util.uuid(),
                therapist_id,
                show_manner,
                content,
                op_date,
                add_date:op_date
            }
            if(end_date){
                addJson.end_date=end_date;
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

            let ethicsnotice_id = this.post('ethicsnotice_id')

            logger.info(`删除${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!ethicsnotice_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }


            let data = await this.model(tableName).where({
                ethicsnotice_id,
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

            let ethicsnotice_id = this.post('ethicsnotice_id')
            let show_manner = this.post('show_manner')
            let end_date = this.post('end_date')
            let content = this.post('content')

            if (!ethicsnotice_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }

            if (!show_manner && show_manner !== 0) {
                this.body = Response.businessException(`显示方式不能为空！`)
                return false;
            }

            if (show_manner === 2 && !end_date) {
                this.body = Response.businessException(`显示截止日期不能为空！`)
                return false;
            }

            if (!content) {
                this.body = Response.businessException(`公告内容不能为空！`)
                return false;
            }



            let op_date = DateUtil.getNowStr()

            let updateJson = {
                op_date,
                content,
                show_manner,
                end_date
            }

            if(end_date){
                updateJson.end_date=end_date;
            }


            let data = await this.model(tableName).where({
                ethicsnotice_id
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


            logger.info(`获取${entityName}列表参数 `)

            let page = this.post('page') || Page.currentPage

            let pageSize = this.post('pageSize') || Page.pageSize

            let joinStr = 'appoint_user on appoint_user.user_id=appoint_ethicsnotice.therapist_id'

            let data = await this.model(tableName).join(joinStr).page(page, pageSize).countSelect();

            logger.info(`获取${entityName}列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取${entityName}列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


};
