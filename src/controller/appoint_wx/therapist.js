const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Role = require('../../config/Role')
const Page = require('../../config/Page')
const Constant = require('../../config/Constant')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const stationService = require('../../service/station')
const md5 = require('md5')
const logger = think.logger;


module.exports = class extends Base {




    /**
     * 根据当前登录用户角色获取咨询师列表
     * @returns {Promise<boolean>}
     */
    async listRelateAction() {
        try {

            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize
            let station_id=this.post('station_id')

            logger.info(`根据当前登录用户角色获取咨询师列表参数 :${JSON.stringify(this.post())}`)

            let user_id=this.ctx.state.userInfo.user_id
            let role=this.ctx.state.userInfo.role


            if(role===Role.caseManager){

                station_id=await stationService.getStationIdByCaseManagerId(user_id)

            }else if(role===Role.divisionManager){
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
     * 关联咨询师到工作室
     * @returns {Promise<boolean>}
     */
    async relateAction() {
        try {

            let therapist_id = this.post('therapist_id')
            let station_id = this.post('station_id')

            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }
            let user_id=this.ctx.state.userInfo.user_id
            let role=this.ctx.state.userInfo.role


            if(role===Role.caseManager){

                station_id=await stationService.getStationIdByCaseManagerId(user_id)

            }else if(role===Role.divisionManager){
                if (!station_id) {
                    this.body = Response.businessException(`工作室ID不能为空！`)
                    return false;
                }
            }



            logger.info(`关联咨询师参数 :${JSON.stringify(this.post())}`)

            await this.model('station_therapist_relation').add({
                station_therapist_relation_id:Util.uuid(),
                station_id,
                therapist_id,
                op_date:DateUtil.getNowStr(),
                op_user_id:user_id
            })

            this.body = Response.success();

        } catch (e) {
            logger.info(`关联咨询师异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 取消关联咨询师
     * @returns {Promise<boolean>}
     */
    async removeRelateAction() {
        try {

            let therapist_id = this.post('therapist_id')
            let station_id = this.post('station_id')



            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }

            let user_id=this.ctx.state.userInfo.user_id
            let role=this.ctx.state.userInfo.role


            if(role===Role.caseManager){

                station_id=await stationService.getStationIdByCaseManagerId(user_id)

            }else if(role===Role.divisionManager){
                if (!station_id) {
                    this.body = Response.businessException(`工作室ID不能为空！`)
                    return false;
                }
            }

            logger.info(`取消关联咨询师参数 :${JSON.stringify(this.post())}`)

            await this.model('station_therapist_relation').where({
                station_id,
                therapist_id,
            }).delete();

            this.body = Response.success();

        } catch (e) {
            logger.info(`取消关联咨询师异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 获取咨询师可用时段设置
     * @returns {Promise<void>}
     */
    async getUseablePeriodSetAction() {
        try {

            let therapist_id = this.post('therapist_id')



            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }

            let data = await this.model('therapist_period_set').where({
                therapist_id
            }).find();


            logger.info(`获取咨询师可用时段设置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取咨询师可用时段设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 更新咨询师可用时段设置
     * @returns {Promise<void>}
     */
    async updateUseablePeriodSetAction() {
        try {

            let period=this.post('period')
            let therapist_id=this.ctx.state.userInfo.user_id

            if (!period) {
                this.body = Response.businessException(`时段设置不能为空！`)
                return false;
            }

            logger.info(`更新咨询师可用时段设置参数 :${JSON.stringify(this.post())}`)

            let data = await this.model('therapist_period_set').where({
                therapist_id
            }).update({
                period
            })


            logger.info(`更新咨询师可用时段设置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`更新咨询师可用时段设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 新增咨询师可用时段设置
     * @returns {Promise<void>}
     */
    async addUseablePeriodSetAction(therapist_id) {
        try {

            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }

            let period='8,9,10,11,13,14,15,16'

            logger.info(`新增咨询师可用时段设置参数 :${therapist_id}`)

            let data = await this.model('room_period_set').add({
                therapist_id,
                period,
                op_date:DateUtil.getNowStr(),
                therapist_period_set_id:Util.uuid()
            });


            logger.info(`新增咨询师可用时段设置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`新增咨询师可用时段设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }



};
