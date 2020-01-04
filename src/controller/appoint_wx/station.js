const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName='工作室'
const tableName='station'


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

            let op_date=DateUtil.getNowStr()

            //获取分部id
            let user_id = this.ctx.state.userInfo.user_id

            let data=await this.model('division_admin_relation').where({
                admin_id:user_id
            }).find()

            let division_id=data.division_id

            let addJson={
                station_id:Util.uuid(),
                division_id,
                station_name,
                address,
                phone,
                op_date
            }

            data = await this.model(tableName).add(addJson);

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


            logger.info(`修改${entityName}参数 :${JSON.stringify(this.post())}`)

            let updateJson={}
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

            updateJson.station_name=station_name
            updateJson.address=address
            updateJson.phone=phone

            updateJson.op_date=DateUtil.getNowStr();

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

            let page = this.post('page')||Page.currentPage
            let pageSize = this.post('pageSize')||Page.pageSize


            logger.info(`获取${entityName}列表参数 :${JSON.stringify(this.post())}`)

            //获取分部id
            let user_id = this.ctx.state.userInfo.user_id

            let data=await this.model('division_admin_relation').where({
                admin_id:user_id
            }).find();

            let division_id=data.division_id

            data = await this.model(tableName).where({
                division_id
            }).page(page,pageSize).select()

            logger.info(`获取${entityName}列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取${entityName}列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }




};
