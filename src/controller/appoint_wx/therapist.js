const Base = require('./base.js');

const Response = require('../../config/response')
const ROLE = require('../../config/constants/ROLE')
const Page = require('../../config/constants/PAGE')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const stationService = require('../../service/station')
const logger = think.logger;
const stationTherapistRelationService = require('../../service/stationTherapistRelation')

module.exports = class extends Base {




    /**
     * 根据咨询师id获取咨询师详情
     * @returns {Promise<boolean>}
     */
    async getByIdAction() {
        try {

            let therapist_id=this.post('therapist_id')

            logger.info(`根据咨询师id获取咨询师详情参数 :${JSON.stringify(this.post())}`)

            if(!therapist_id){
                this.body=Response.businessException('咨询师ID不能为空！')
                return;
            }

            let whereObj = {
                user_id:therapist_id
            }

            let joinStr = 'appoint_therapist_attach_relation on appoint_user.user_id=appoint_therapist_attach_relation.therapist_id'

            let data = await this.model('user').where(whereObj).join(joinStr).find();

            this.body=Response.success(data)

        } catch (e) {
            logger.info(`根据咨询师id获取咨询师详情异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


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


            if(role===ROLE.caseManager){

                station_id=await stationService.getStationIdByCaseManagerId(user_id)

            }else if(role===ROLE.divisionManager){
                if (!station_id) {
                    this.body = Response.businessException(`工作室ID不能为空！`)
                    return false;
                }
            }

            let obj=await stationTherapistRelationService.getOne({
                station_id,
                therapist_id
            })

            if(!Util.isEmptyObject(obj)){
                this.body = Response.businessException(`已关联！`)
                return false;
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


            if(role===ROLE.caseManager){

                station_id=await stationService.getStationIdByCaseManagerId(user_id)

            }else if(role===ROLE.divisionManager){
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





};
