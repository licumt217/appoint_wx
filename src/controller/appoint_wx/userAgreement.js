const Base = require('./base.js');

const Response = require('../../config/response')

const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;

const entityName = '用户同意协议'
const tableName = 'user_agreement'


module.exports = class extends Base {



    /**
     * 用户同意用户协议
     * @returns {Promise<boolean>}
     */
    async acceptAction() {
        try {

            logger.info(`用户同意用户协议参数 :${JSON.stringify(this.post())}`)


            let user_id=this.ctx.state.userInfo.user_id
            //如果已经同意过，直接返回成功

            let entity=await this.model(tableName).where({
                user_id,
            }).find()

            if(Util.isEmptyObject(entity)){
                let op_date=DateUtil.getNowStr();
                await this.model(tableName).add({
                    user_agreement_id:Util.uuid(),
                    user_id:this.ctx.state.userInfo.user_id,
                    op_date
                })
            }

            this.body = Response.success();

        } catch (e) {
            let msg=`用户同意用户协议异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }

    /**
     * 根据用户id查询用户是否已同意协议
     * @returns {Promise<boolean>}
     */
    async isAgreeAction() {
        try {

            logger.info('根据用户id查询用户是否已同意协议')

            let user_id=this.ctx.state.userInfo.user_id

            let entity=await this.model(tableName).where({
                user_id
            }).find();

            if(Util.isEmptyObject(entity)){
                this.body=Response.success({
                    agree:false
                })
            }else{
                this.body=Response.success({
                    agree:true
                })
            }


        } catch (e) {
            let msg=`根据用户id查询用户是否已同意协议异常`
            logger.info(`${msg} msg:${e}`);
            this.body = Response.businessException(msg);
        }


    }




};
