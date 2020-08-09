const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName='个人简历'
const tableName='cv'


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let user_id = this.ctx.state.userInfo.user_id;

            logger.info(`新增${entityName}参数 :${JSON.stringify(this.post())}`)

            let qualification = this.post('qualification')
            let field = this.post('field')
            let experience = this.post('experience')
            let train = this.post('train')

            if (!qualification) {
                this.body = Response.businessException(`资质不能为空！`)
                return false;
            }
            if (!field) {
                this.body = Response.businessException(`擅长领域不能为空！`)
                return false;
            }
            if (!experience) {
                this.body = Response.businessException(`临床经验不能为空！`)
                return false;
            }
            if (!train) {
                this.body = Response.businessException(`受训经历不能为空！`)
                return false;
            }

            let op_date=DateUtil.getNowStr()

            let addJson={
                cv_id:Util.uuid(),
                user_id,
                qualification,
                field,
                experience,
                train,
                op_date
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

            logger.info(`删除${entityName}参数 :${JSON.stringify(this.post())}`)

            let cv_id = this.post('cv_id')

            if (!cv_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }


            let data = await this.model(tableName).where({
                cv_id,
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


            logger.info(`修改${entityName}参数 :${JSON.stringify(this.post())}`)

            let qualification = this.post('qualification')
            let field = this.post('field')
            let experience = this.post('experience')
            let train = this.post('train')
            let cv_id = this.post('cv_id')

            if (!cv_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }
            if (!qualification) {
                this.body = Response.businessException(`资质不能为空！`)
                return false;
            }
            if (!field) {
                this.body = Response.businessException(`擅长领域不能为空！`)
                return false;
            }
            if (!experience) {
                this.body = Response.businessException(`临床经验不能为空！`)
                return false;
            }
            if (!train) {
                this.body = Response.businessException(`受训经历不能为空！`)
                return false;
            }

            let op_date=DateUtil.getNowStr()

            let updateJson={
                qualification,
                field,
                experience,
                train,
                op_date
            }

            let data = await this.model(tableName).where({
                cv_id
            }).update(updateJson);

            logger.info(`修改${entityName}，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`修改${entityName}异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 查询咨询师简历
     * @returns {Promise<boolean>}
     */
    async getByTherapistIdAction() {
        try {

            logger.info(`获取${entityName}参数 `)

            let user_id = this.post('therapist_id')

            if (!user_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }


            let data = await this.model(tableName).where({
                user_id
            }).find();

            if(Util.isEmptyObject(data)){
                this.body=Response.success()
            }else{
                logger.info(`获取${entityName}，数据库返回：${JSON.stringify(data)}`)

                this.body = Response.success(data);
            }

        } catch (e) {
            logger.info(`获取${entityName}列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }




};
