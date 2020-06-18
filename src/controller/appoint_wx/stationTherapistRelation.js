const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const ROLE = require('../../config/constants/ROLE')
const Constant = require('../../config/Constant')
const logger = think.logger;
const ETHICSNOTICE_STATE=require('../../config/constants/ETHICSNOTICE_STATE')
const entityName = '工作室和咨询师关联'
const tableName = 'station_therapist_relation'
const userService = require('../../service/user')


module.exports = class extends Base {


    /**
     * 工作室添加关联咨询师
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let station_id = this.post('station_id')
            let therapist_id = this.post('therapist_id')

            logger.info(`工作室添加关联咨询师参数 ${JSON.stringify(this.post())}`)



            if (!station_id) {
                this.body = Response.businessException(`工作室ID不能为空！`)
                return false;
            }

            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }

            let data = await this.model(tableName).where({
                station_id,
                therapist_id
            }).find();

            if(!Util.isEmptyObject(data)){
                this.body = Response.businessException(`当前咨询师已关联了，请检查！`)
                return false;
            }




            let op_date = DateUtil.getNowStr()

            let station_therapist_relation_id = Util.uuid();
            let addJson = {
                station_therapist_relation_id,
                station_id,
                therapist_id,
                op_date,
            }

            await this.model(tableName).add(addJson);

            this.body = Response.success();

        } catch (e) {
            logger.info(`工作室添加关联咨询师异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 移除工作室和咨询师关联
     * @returns {Promise<boolean>}
     */
    async deleteAction() {
        try {

            let station_id = this.post('station_id')
            let therapist_id = this.post('therapist_id')

            logger.info(`移除工作室和咨询师关联参数 ${JSON.stringify(this.post())}`)



            if (!station_id) {
                this.body = Response.businessException(`工作室ID不能为空！`)
                return false;
            }

            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }

            await this.model(tableName).where({
                station_id,
                therapist_id
            }).delete()


            this.body = Response.success();

        } catch (e) {
            logger.info(`移除工作室和咨询师关联异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 获取工作室关联的咨询师
     * @returns {Promise<boolean>}
     */
    async listAction() {
        try {

            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize
            let station_id = this.post('station_id')

            logger.info(`获取工作室关联的咨询师参数 :${JSON.stringify(this.post())}`)

            if (!station_id) {
                this.body = Response.businessException(`工作室ID不能为空！`)
                return false;
            }


            let joinStr = 'appoint_station_therapist_relation on appoint_user.user_id=appoint_station_therapist_relation.therapist_id'

            let data = await this.model('user').join(joinStr).where({
                'appoint_station_therapist_relation.station_id': station_id,
            }).page(page,pageSize).countSelect().catch(e => {
                logger.info(`获取工作室关联的咨询师异常 msg:${e}`);
                this.body = Response.systemException(e);
                return false;
            })


            logger.info(`获取工作室关联的咨询师，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取工作室关联的咨询师异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 获取没有关联工作室的咨询师列表【目前限制一个咨询师只能关联一个工作室】
     * 此咨询师必须已设置相关预约设置：收费类型、预约设置等
     * @returns {Promise<boolean>}
     */
    async getNotRelatedTherapistAction() {
        try {

            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize

            logger.info(`获取当前工作室没有关联的咨询师列表参数 :${JSON.stringify(this.post())}`)


            let idArray=await this.model(tableName).getField('therapist_id');

            let whereObj={
                'appoint_user.role': ROLE.therapist
            }
            if(idArray && idArray.length>0){
                whereObj['appoint_user.user_id']=['NOTIN',idArray]
            }

            let data = await this.model('user').where(whereObj).join({
                table: 'therapist_fee_set',
                join: 'inner',
                on: ['user_id', 'therapist_id']
            }).join({
                table: 'therapist_attach_relation',
                join: 'inner',
                on: ['user_id', 'therapist_id']
            }).page(page,pageSize).countSelect().catch(e => {
                logger.info(`获取当前工作室没有关联的咨询师列表异常 msg:${e}`);
                this.body = Response.systemException(e);
                return false;
            })


            logger.info(`获取当前工作室没有关联的咨询师列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取当前工作室没有关联的咨询师列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 获取所有已关联了工作室的咨询师列表
     * c端用户搜索咨询师时使用：未关联工作室的咨询师搜索不到；未关联微信公众号的咨询师搜索不到。
     * 此接口只限制C端使用
     * @returns {Promise<boolean>}
     */
    async getAllTherapistAction() {
        try {

            let role = ROLE.therapist
            let manner_type_id = this.post('manner_type_id')
            let qualification_type_id = this.post('qualification_type_id')
            let school_type_id = this.post('school_type_id')
            let area = this.post('area')
            let gender = this.post('gender')
            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize

            logger.info(`获取所有已关联了工作室的咨询师列表参数 :${JSON.stringify(this.post())}`)

            let data = []
            let whereObj = {
                role,
            }

            //咨询方式：线上、线下
            if (manner_type_id) {
                whereObj.manner_type_id = manner_type_id;
            }

            if (school_type_id) {
                whereObj.school_type_id = school_type_id;
            }

            if (qualification_type_id) {
                whereObj.qualification_type_id = qualification_type_id;
            }

            if (gender) {
                whereObj.gender = gender;
            }
            if (area) {
                area=area.join(',')
                whereObj.area = area;
            }


            data = await this.model(tableName).where(whereObj).join({
                table: 'user',
                join: 'inner',
                as: 'user',
                on: ['therapist_id', 'user_id']
            }).join({
                table: 'therapist_attach_relation',
                join: 'inner',
                as: 'attach',
                on: ['therapist_id', 'therapist_id']
            }).join({
                table: 'therapist_fee_set',
                join: 'left',
                as: 'feeset',
                on: ['therapist_id', 'therapist_id']
            }).join({
                table: 'ethicsnotice',
                join: 'left',
                on: ['therapist_id', 'therapist_id']
            }).join({
                table: 'weixin_user',
                join: 'inner',
                on: ['therapist_id', 'user_id']
            }).page(page, pageSize).countSelect();


            logger.info(`获取所有已关联了工作室的咨询师列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取所有已关联了工作室的咨询师列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }




};
