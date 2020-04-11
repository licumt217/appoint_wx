const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;
const Role = require('../../config/Role')
const Constant = require('../../config/Constant')
const entityName='分部和分部管理员关系'
const tableName='division_admin_relation'
const userService = require('../../service/user')


module.exports = class extends Base {


    /**
     * 新增用户
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let name = this.post('name')
            let phone = this.post('phone')
            let gender = this.post('gender')
            let birthday = this.post('birthday')
            let email = this.post('email')
            let role = this.post('role')
            let division_id = this.post('division_id')

            logger.info(`新增分部管理员参数 ${JSON.stringify(this.post())}`)

            if (!name) {
                this.body = Response.businessException(`姓名不能为空！`)
                return false;
            }

            if (!phone) {
                this.body = Response.businessException(`手机号不能为空！`)
                return false;
            }

            if (!gender) {
                this.body = Response.businessException(`性别不能为空！`)
                return false;
            }

            if (!birthday) {
                this.body = Response.businessException(`出生日期不能为空！`)
                return false;
            }

            if (!email) {
                this.body = Response.businessException(`电子邮件不能为空！`)
                return false;
            }

            if (!role) {
                this.body = Response.businessException(`用户类型不能为空！`)
                return false;
            }

            let user=await userService.getByPhone(phone);

            if(!Util.isEmptyObject(user)){
                this.body = Response.businessException(`该手机号对应用户已存在，请修改！`)
                return false;
            }

            let op_date=DateUtil.getNowStr()

            let user_id=Util.uuid();
            let addJson={
                user_id,
                name,
                phone,
                gender,
                    birthday: DateUtil.format(birthday, 'date'),
                email,
                op_date,
                role,
            }

            if(role!==Role.client){
                addJson.password=Constant.defaultPassword
            }

            await this.model('user').add(addJson);

            //新增分部和分部管理员关系
            await this.model(tableName).add({
                division_admin_relation_id:Util.uuid(),
                admin_id:user_id,
                division_id,
                op_date:DateUtil.getNowStr()
            })


            this.body = Response.success(user_id);

        } catch (e) {
            logger.info(`新增分部管理员异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 删除分部管理员
     * @returns {Promise<boolean>}
     */
    async deleteAction() {
        try {

            let user_id = this.post('user_id')
            let division_id = this.post('division_id')

            logger.info(`删除分部管理员参数 :${JSON.stringify(this.post())}`)

            if (!user_id) {
                this.body = Response.businessException(`分部管理员ID不能为空！`)
                return false;
            }


            let data = await this.model('user').where({
                user_id,
            }).delete()

            logger.info(`删除分部管理员，数据库返回：${JSON.stringify(data)}`)

            data = await this.model(tableName).where({
                admin_id:user_id,
                division_id
            }).delete()

            logger.info(`删除分部管理员和分部关系，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success();

        } catch (e) {
            logger.info(`删除分部管理员异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 获取列表
     * @returns {Promise<boolean>}
     */
    async listAction() {
        try {

            let division_id = this.post('division_id')
            let page = this.post('page')||Page.currentPage
            let pageSize = this.post('pageSize')||Page.pageSize

            logger.info(`获取分部管理员列表参数 :${JSON.stringify(this.post())}`)

            if (!division_id) {
                this.body = Response.businessException(`分部ID不能为空！`)
                return false;
            }

            let adminUserIdList= await this.model(tableName).where({
                division_id
            }).getField('admin_id')

            if(!adminUserIdList || adminUserIdList.length===0){
                this.body = Response.success({
                    data:[],
                    count:0,
                })
                return;
            }

            let data = await this.model('user').where({
                'user_id':['in',adminUserIdList]
            }).page(page,pageSize).countSelect();


            logger.info(`获取分部管理员列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取分部管理员列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }




};
