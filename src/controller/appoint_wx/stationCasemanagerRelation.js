const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const ROLE = require('../../config/constants/ROLE')
const Constant = require('../../config/Constant')
const logger = think.logger;

const entityName = '案例管理员'
const tableName = 'station_casemanager_relation'
const userService = require('../../service/user')


module.exports = class extends Base {


    /**
     * 新增案例管理员
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let name = this.post('name')
            let phone = this.post('phone')
            let gender = this.post('gender')
            let birthday = this.post('birthday')
            let email = this.post('email')
            let station_id = this.post('station_id')

            logger.info(`新增案例管理员参数 ${JSON.stringify(this.post())}`)

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


            if (!station_id) {
                this.body = Response.businessException(`工作室ID不能为空！`)
                return false;
            }

            let user = await userService.getByPhone(phone);

            if (!Util.isEmptyObject(user)) {
                this.body = Response.businessException(`该手机号对应用户已存在，请修改！`)
                return false;
            }


            //TODO 添加事务
            let op_date = DateUtil.getNowStr()

            let user_id = Util.uuid();
            let addJson = {
                user_id,
                name,
                phone,
                gender,
                birthday: DateUtil.format(birthday, 'date'),
                email,
                op_date,
                role: ROLE.caseManager
            }

            addJson.password = Constant.defaultPassword

            await this.model('user').add(addJson);

            //新增工作室和案例管理员关系
            await this.model(tableName).add({
                station_casemanager_id: Util.uuid(),
                casemanager_id: user_id,
                station_id,
                op_date,
            })


            this.body = Response.success(user_id);

        } catch (e) {
            logger.info(`新增案例管理员异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 获取工作室对应的案例管理员
     * @returns {Promise<boolean>}
     */
    async listAction() {
        try {

            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize
            let station_id = this.post('station_id')

            logger.info(`获取工作室对应的案例管理员参数 :${JSON.stringify(this.post())}`)

            if (!station_id) {
                this.body = Response.businessException(`工作室ID不能为空！`)
                return false;
            }


            let joinStr = 'appoint_station_casemanager_relation on appoint_user.user_id=appoint_station_casemanager_relation.casemanager_id'

            let data = await this.model('user').join(joinStr).where({
                'appoint_station_casemanager_relation.station_id': station_id,
            }).page(page,pageSize).countSelect().catch(e => {
                logger.info(`获取工作室对应的案例管理员异常 msg:${e}`);
                this.body = Response.systemException(e);
                return false;
            })


            logger.info(`获取工作室对应的案例管理员，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取工作室对应的案例管理员异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 删除
     * @returns {Promise<boolean>}
     */
    async deleteAction() {
        try {

            let station_id = this.post('station_id')
            let casemanager_id = this.post('casemanager_id')

            logger.info(`删除${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!station_id) {
                this.body = Response.businessException(`工作室ID不能为空！`)
                return false;
            }

            if (!casemanager_id) {
                this.body = Response.businessException(`案例管理员ID不能为空！`)
                return false;
            }


            //TODO 事务
            let data = await this.model(tableName).where({
                station_id,
                casemanager_id
            }).delete()

            await userService.deleteById(casemanager_id)

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

            let station_id = this.post('station_id')
            let station_name = this.post('station_name')
            let address = this.post('address')
            let phone = this.post('phone')


            logger.info(`修改${entityName}参数 :${JSON.stringify(this.post())}`)

            let updateJson = {}
            if (!station_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }

            if (!station_name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            if (!address) {
                this.body = Response.businessException(`${entityName}地址不能为空！`)
                return false;
            }

            if (!phone) {
                this.body = Response.businessException(`${entityName}电话不能为空！`)
                return false;
            }

            updateJson.station_name = station_name
            updateJson.address = address
            updateJson.phone = phone

            updateJson.op_date = DateUtil.getNowStr();

            let data = await this.model(tableName).where({
                station_id
            }).update(updateJson);

            logger.info(`修改${entityName}，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`修改${entityName}异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


};
