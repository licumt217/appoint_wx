const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const ROLE = require('../../config/constants/ROLE')
const Page = require('../../config/constants/PAGE')
const Constant = require('../../config/Constant')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const stationService = require('../../service/station')
const therapistFeeSetService = require('../../service/therapistFeeSet')
const md5 = require('md5')
const logger = think.logger;
const entityName='咨询师收费设置'
const tableName='therapist_fee_set'

module.exports = class extends Base {




    /**
     * 案例管理员获取管辖的咨询师的收费配置列表
     * @returns {Promise<boolean>}
     */
    async listAction() {
        //TODO 此方法还未开始，
        try {

            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize
            let station_id=this.post('station_id')

            logger.info(`根据当前登录用户角色获取咨询师列表参数 :${JSON.stringify(this.post())}`)

            let user_id=this.ctx.state.userInfo.user_id
            let role=this.ctx.state.userInfo.role


            if(role===ROLE.caseManager){

                station_id=await stationService.getStationIdByCaseManagerId(user_id)

            }else if(role===ROLE.divisionManager){
                if (!station_id) {
                    this.body = Response.businessException(`工作室ID不能为空！`)
                    return false;
                }
            }

            let therapist_idList= await this.model('station_therapist_relation').where({
                station_id
            }).getField('therapist_id')

            console.log(33)
            console.log(therapist_idList)
            console.log(therapist_idList.length)


            if(!therapist_idList || therapist_idList.length===0){
                this.body = Response.success({
                    data:[],
                    count:0,
                })
            }else{
                let data = await this.model('user').where({
                    'user_id':['in',therapist_idList]
                }).page(page,pageSize).countSelect();

                logger.info(`根据当前登录用户角色获取咨询师列表，数据库返回：${JSON.stringify(data)}`)

                this.body=Response.success(data)
            }

        } catch (e) {
            logger.info(`根据当前登录用户角色获取咨询师列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 获取某个咨询师的收费设置
     * @returns {Promise<void>}
     */
    async getByTherapistIdAction() {
        try {


            let therapist_id= this.post('therapist_id')

            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }

            logger.info(`获取某个咨询师的收费设置参数 :${JSON.stringify(this.post())}`)

            let data = await therapistFeeSetService.getByTherapistId(therapist_id)

            logger.info(`获取某个咨询师的收费设置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取某个咨询师的收费设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 新增咨询师收费设置
     * @returns {Promise<void>}
     */
    async addAction() {
        try {
            logger.info(`新增咨询师收费设置参数 :${JSON.stringify(this.post())}`)

            let fee= this.post('fee')
            let therapist_id= this.post('therapist_id')

            if (!fee) {
                this.body = Response.businessException(`每个时段费用不能为空！`)
                return false;
            }

            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }



            let data = await this.model(tableName).add({
                therapist_fee_set_id:Util.uuid(),
                therapist_id,
                op_date:DateUtil.getNowStr(),
                op_user_id:this.ctx.state.userInfo.user_id,
                fee,
            });


            logger.info(`新增咨询师收费设置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`新增咨询师收费设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 修改咨询师收费设置，修改后需要别人确认。【咨询师修改需要案例管理员确认，案例修改需要咨询师确认】
     * @returns {Promise<void>}
     */
    async updateAction() {
        try {
            logger.info(`修改咨询师收费设置参数 :${JSON.stringify(this.post())}`)

            let fee= this.post('fee')
            let therapist_fee_set_id= this.post('therapist_fee_set_id')
            if (!therapist_fee_set_id) {
                this.body = Response.businessException(`收费设置ID不能为空！`)
                return false;
            }

            if (!fee) {
                this.body = Response.businessException(`每个时段费用不能为空！`)
                return false;
            }



            let data = await this.model(tableName).where({
                therapist_fee_set_id
            }).update({
                op_user_id:this.ctx.state.userInfo.user_id,
                fee,
                op_date:DateUtil.getNowStr(),
                state:0
            })

            logger.info(`修改咨询师收费设置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`修改咨询师收费设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 确认咨询师收费配置修改【对方确认：咨询师、案例管理员】
     * @returns {Promise<void>}
     */
    async confirmAction() {
        try {


            let therapist_fee_set_id= this.post('therapist_fee_set_id')
            let op_user_id= this.ctx.state.userInfo.user_id
            if (!therapist_fee_set_id) {
                this.body = Response.businessException(`收费设置ID不能为空！`)
                return false;
            }

            if (!op_user_id) {
                this.body = Response.businessException(`操作人ID不能为空！`)
                return false;
            }

            logger.info(`确认咨询师收费配置修改参数 :${therapist_id}`)

            let data = await this.model(tableName).where({
                therapist_fee_set_id
            }).update({
                op_user_id,
                op_date:DateUtil.getNowStr(),
                state:1
            })

            logger.info(`确认咨询师收费配置修改，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`确认咨询师收费配置修改异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }



};
