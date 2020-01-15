const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName='紧急联系人'
const tableName='emergency_contack'


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let name = this.post('name')
            let relation = this.post('relation')
            let phone = this.post('phone')
            let email = this.post('email')

            logger.info(`新增${entityName}参数 :${JSON.stringify(this.post())}`)


            if (!name) {
                this.body = Response.businessException(`${entityName}姓名不能为空！`)
                return false;
            }

            if (!relation) {
                this.body = Response.businessException(`${entityName}关系不能为空！`)
                return false;
            }

            if (!phone) {
                this.body = Response.businessException(`${entityName}手机号不能为空！`)
                return false;
            }

            if (!email) {
                this.body = Response.businessException(`${entityName}电子邮箱不能为空！`)
                return false;
            }

            let op_date=DateUtil.getNowStr()

            let addJson={
                emergency_contack_id:Util.uuid(),
                name,
                phone,
                relation,
                email,
                user_id:this.ctx.state.userInfo.user_id,
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

            let emergency_contack_id = this.post('emergency_contack_id')

            logger.info(`删除${entityName}参数 :${JSON.stringify(this.post())}`)

            if(!emergency_contack_id){
                this.body=Response.businessException(`${entityName}ID不能为空`)
                return false
            }

            let data = await this.model(tableName).where({
                emergency_contack_id
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

            let emergency_contack_id = this.post('emergency_contack_id')
            let name = this.post('name')
            let relation = this.post('relation')
            let phone = this.post('phone')
            let email = this.post('email')

            logger.info(`修改${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!name) {
                this.body = Response.businessException(`${entityName}姓名不能为空！`)
                return false;
            }

            if (!relation) {
                this.body = Response.businessException(`${entityName}关系不能为空！`)
                return false;
            }

            if (!phone) {
                this.body = Response.businessException(`${entityName}手机号不能为空！`)
                return false;
            }

            if (!email) {
                this.body = Response.businessException(`${entityName}电子邮箱不能为空！`)
                return false;
            }




            let op_date=DateUtil.getNowStr();

            let data = await this.model(tableName).where({
                emergency_contack_id
            }).update({
                name,
                relation,
                phone,
                email,
                op_date,
            });

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

            let user_id=this.ctx.state.userInfo.user_id

            let data = await this.model(tableName).where({
                user_id
            }).select();

            logger.info(`获取${entityName}列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取${entityName}列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }




};
