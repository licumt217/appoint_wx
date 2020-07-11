const Base = require('./base.js');
var moment = require('moment');
const Response = require('../../config/response')
const ROLE = require('../../config/constants/ROLE')
const logger =think.logger;

module.exports = class extends Base {
    async getMeasureListAction() {
        let organization_id = this.post('organization_id')
        let user_id = this.ctx.state.userInfo["user_id"]
        let answer = await this.model('answer').where({user_id, organization_id}).select()
        let roleAnswer = await this.model('answer_role').where({user_id, role: 0}).select()
        if ((!think.isEmpty(answer) && answer.length > 0 && answer[0].finish == 2) && (!think.isEmpty(roleAnswer) && roleAnswer.length > 0 && roleAnswer[0].finish == 2)) {
            this.body = Response.success({
                data: [],
                status: 1
            })
        } else if ((!think.isEmpty(roleAnswer) && roleAnswer.length > 0 && roleAnswer[0].finish == 2) && think.isEmpty(answer)) {
            let curMeasure = await this.model("measure").where({user_id: organization_id}).select()
            if (!think.isEmpty(curMeasure) && curMeasure.length > 0) {
                let questionList = await this.model('question').setRelation('children').where({'measureId': curMeasure[0].id}).order('indexSort ASC').select()
                this.body = Response.success({
                    status: 0,
                    organizationAnswer: questionList
                })
            }else{
              this.body=Response.success({
                status:1,
              })
            }
        } else {
            let data = {}
            let roleMeasure = await this.model("measure").where({role: 0}).select()
            if (!think.isEmpty(roleMeasure) && roleMeasure.length > 0) {
                let questionList = await this.model('question').setRelation('children').where({'measureId': roleMeasure[0].id}).order('indexSort ASC').select()
                data.roleAnswer = questionList
                //roleMeasure.answerlist=JSON.parse(JSON.stringify(questionList))
            }
            let curMeasure = await this.model("measure").where({user_id: organization_id}).select()
            if (think.isEmpty(curMeasure) && curMeasure.length > 0) {
                let questionList = await this.model('question').setRelation('children').where({'measureId': curMeasure[0].id}).order('indexSort ASC').select()
                data.organizationAnswer = questionList
                //curMeasure.answerlist=JSON.parse(JSON.stringify(questionList))
            }
            //return this.json({success:0,data:data,status:1})
            this.body = Response.success({
                status: 0,
                organizationAnswer: data.organizationAnswer,
                roleAnswer: data.roleAnswer
            })
        }
    }

    /**
     * 保存预检表
     * @returns {Promise<void>}
     */
    async saveAnswerAction() {
        logger.info(`保存预检表参数：${JSON.stringify(this.post())}`)
        let organization_id = this.post('organization_id')
        let organizationAnswer = this.post('organizationAnswer')
        let roleAnswer = this.post('roleAnswer')
        let user_id = this.ctx.state.userInfo["user_id"]
        if (!think.isEmpty(roleAnswer)) {
            await this.model('answer_role').add({
                user_id,
                answerlist: roleAnswer,
                organization_id,
                finish: 2,
                role: 0
            })
        }
        if (!think.isEmpty(organizationAnswer)) {
            await this.model('answer').add({
                user_id,
                answerlist: organizationAnswer,
                organization_id,
                finish: 2
            })
        }
        this.body = Response.success({
            status: 0,
        })
    }


    /**
     * 获取用户在某个分部下回答的预检表
     * @returns {Promise<void>}
     */
    async getAnswerMeasureListAction() {


        let organization_id = this.post('organization_id')

        let user_id = this.post('user_id')

        let answer = await this.model('answer').where({user_id, organization_id}).select()

        let roleAnswer = await this.model('answer_role').where({user_id, role: ROLE.admin}).select()

        let data = {}

        if (!think.isEmpty(roleAnswer) && roleAnswer.length > 0) {
            data.roleAnswer = JSON.parse(roleAnswer[0].answerlist)
        }
        if (!think.isEmpty(answer) && answer.length > 0) {
            data.organizationAnswer = JSON.parse(answer[0].answerlist)
        }
        this.body = Response.success({
            organizationAnswer: data.organizationAnswer,
            roleAnswer: data.roleAnswer
        })
    }
};
