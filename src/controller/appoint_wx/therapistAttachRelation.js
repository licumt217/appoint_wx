const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const ROLE = require('../../config/constants/ROLE')
const Page = require('../../config/constants/PAGE')
const Constant = require('../../config/Constant')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const md5 = require('md5')
const logger = think.logger;


module.exports = class extends Base {





    /**
     * 根据咨询师ID新增预约相关配置
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let therapist_id = this.post('therapist_id')
            let school_type_id = this.post('school_type_id')
            let qualification_type_id = this.post('qualification_type_id')
            let manner_type_id = this.post('manner_type_id')
            let level_type_id = this.post('level_type_id')
            let emergency = this.post('emergency')||Constant.EMERGENCY.DISABLE

            logger.info(`根据咨询师ID新增预约相关配置参数 :${JSON.stringify(this.post())}`)

            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }

            if (!school_type_id) {
                this.body = Response.businessException(`流派类型ID不能为空！`)
                return false;
            }

            if (!qualification_type_id) {
                this.body = Response.businessException(`资历类型ID不能为空！`)
                return false;
            }

            if (!manner_type_id) {
                this.body = Response.businessException(`线上线下ID不能为空！`)
                return false;
            }

            if (!level_type_id) {
                this.body = Response.businessException(`等级类型ID不能为空！`)
                return false;
            }



            let data = await this.model('therapist_attach_relation').add({
                therapist_attach_relation_id:Util.uuid(),
                op_date:DateUtil.getNowStr(),
                therapist_id,
                school_type_id,
                qualification_type_id,
                manner_type_id,
                level_type_id,
                emergency
            })

            logger.info(`根据咨询师ID新增预约相关配置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`根据咨询师ID新增预约相关配置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 根据咨询师ID更新预约相关配置
     * @returns {Promise<boolean>}
     */
    async updateAction() {
        try {

            let therapist_id = this.post('therapist_id')

            logger.info(`根据咨询师ID更新预约相关配置参数 :${JSON.stringify(this.post())}`)

            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }

            let data = await this.model('therapist_attach_relation').where({
                therapist_id
            }).update({
                school_type_id:this.post('school_type_id'),
                qualification_type_id:this.post('qualification_type_id'),
                manner_type_id:this.post('manner_type_id'),
                level_type_id:this.post('level_type_id'),
                emergency:this.post('emergency')||Constant.EMERGENCY.DISABLE
            })

            logger.info(`根据咨询师ID更新预约相关配置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`根据咨询师ID更新预约相关配置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 根据咨询师ID获取预约相关配置
     * @returns {Promise<boolean>}
     */
    async getByTherapistIdAction() {
        try {

            let therapist_id = this.post('therapist_id')

            logger.info(`根据咨询师ID获取预约相关配置参数 :${JSON.stringify(this.post())}`)

            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }

            let data = await this.model('therapist_attach_relation').where({
                therapist_id
            }).join([
                'appoint_school_type        on appoint_school_type.school_type_id                   =appoint_therapist_attach_relation.school_type_id',
                'appoint_qualification_type on appoint_qualification_type.qualification_type_id     =appoint_therapist_attach_relation.qualification_type_id',
                'appoint_manner_type        on appoint_manner_type.manner_type_id                   =appoint_therapist_attach_relation.manner_type_id',
                'appoint_level_type         on appoint_level_type.level_type_id                     =appoint_therapist_attach_relation.level_type_id',
            ]).find();

            logger.info(`根据咨询师ID获取预约相关配置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`根据咨询师ID获取预约相关配置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }




};
