const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const ROLE = require('../../config/constants/ROLE')
const Constant = require('../../config/Constant')
const logger = think.logger;

const entityName = '工作室'
const tableName = 'station'
const userService = require('../../service/user')


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let station_name = this.post('station_name')
            let address = this.post('address')
            let phone = this.post('phone')
            let area = this.post('area')

            logger.info(`新增${entityName}参数 :${JSON.stringify(this.post())}`)

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

            let station_province=area[0];
            let station_city=area[1];

            let op_date = DateUtil.getNowStr()

            //获取分部id
            let user_id = this.ctx.state.userInfo.user_id

            let data = await this.model('division_admin_relation').where({
                admin_id: user_id
            }).find()

            let division_id = data.division_id

            let station_id = Util.uuid()

            let addJson = {
                station_id,
                division_id,
                station_name,
                address,
                phone,
                op_date,
                station_province,
                station_city
            }

            data = await this.model(tableName).add(addJson);

            logger.info(`新增${entityName}，数据库返回：${JSON.stringify(data)}`)

            //新增工作室后自动创建默认房间时段配置

            await this.model('room_period_set').add({
                room_period_set_id: Util.uuid(),
                op_date,
                op_user_id: this.ctx.state.userInfo.user_id,
                station_id,
                period: '8,9,10,11,13,14,15,16'
            })

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`新增${entityName}异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 新增案例管理员
     * @returns {Promise<boolean>}
     */
    async addCaseManagerAction() {
        try {

            let name = this.post('name')
            let phone = this.post('phone')
            let gender = this.post('gender')
            let birthday = this.post('birthday')
            let email = this.post('email')
            let role = this.post('role')
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

            if (!role) {
                this.body = Response.businessException(`用户类型不能为空！`)
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
                role,
            }

            addJson.password = Constant.defaultPassword

            await this.model('user').add(addJson);

            //新增工作室和案例管理员关系
            await this.model(tableName).where({
                station_id
            }).update({
                case_manager_id: user_id
            });


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
    async getCaseManagerAction() {
        try {

            let station_id = this.post('station_id')

            logger.info(`获取工作室对应的案例管理员参数 :${JSON.stringify(this.post())}`)

            if (!station_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }

            let data = await this.model('station').where({
                station_id
            }).find()

            let case_manager_id = data.case_manager_id;

            if (!case_manager_id) {
                logger.info(`未设置案例管理员！`)
                this.body = Response.success();
            } else {
                data = await this.model('user').where({
                    user_id: case_manager_id
                }).find()

                logger.info(`获取工作室对应的案例管理员，数据库返回：${JSON.stringify(data)}`)

                this.body = Response.success(data);
            }

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

            logger.info(`删除${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!station_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }


            let data = await this.model(tableName).where({
                station_id,
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

            let station_id = this.post('station_id')
            let station_name = this.post('station_name')
            let address = this.post('address')
            let phone = this.post('phone')
            let area = this.post('area')

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

            updateJson.station_province = area[0];
            updateJson.station_city = area[1];
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

    /**
     * 列表
     * @returns {Promise<boolean>}
     */
    async listAction() {
        try {

            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize


            logger.info(`获取${entityName}列表参数 :${JSON.stringify(this.post())}`)

            //获取分部id
            let user_id = this.ctx.state.userInfo.user_id

            let data = await this.model('division_admin_relation').where({
                admin_id: user_id
            }).find();

            let division_id = data.division_id

            data = await this.model(tableName).where({
                division_id
            }).page(page, pageSize).select()

            logger.info(`获取${entityName}列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取${entityName}列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


};
