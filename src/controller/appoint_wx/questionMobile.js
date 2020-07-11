const Base = require('./base.js');
var moment = require('moment');
const Response = require('../../config/response')
const logger =think.logger;

module.exports = class extends Base {
    async getMeasureListAction() {
        let organizationId = this.post('organizationId')
        let userId = this.ctx.state.userInfo["user_id"]
        //userId="sdfsdfsdfsf"
        let answer = await this.model('answer').where({user_id: userId, organization_id: organizationId}).select()
        let roleAnswer = await this.model('answer_role').where({user_id: userId, role: 0}).select()
        if ((!think.isEmpty(answer) && answer.length > 0 && answer[0].finish == 2) && (!think.isEmpty(roleAnswer) && roleAnswer.length > 0 && roleAnswer[0].finish == 2)) {
            this.body = Response.success({
                data: [],
                status: 1
            })
        } else if ((!think.isEmpty(roleAnswer) && roleAnswer.length > 0 && roleAnswer[0].finish == 2) && think.isEmpty(answer)) {
            let curMeasure = await this.model("measure").where({user_id: organizationId}).select()
            if (!think.isEmpty(curMeasure) && curMeasure.length > 0) {
                let questionList = await this.model('question').setRelation('children').where({'measureId': curMeasure[0].id}).order('indexSort ASC').select()
                this.body = Response.success({
                    data: [],
                    status: 0,
                    organizationAnswer: questionList
                })
            }else{
              this.body=Response.success({
                data:[],
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
            let curMeasure = await this.model("measure").where({user_id: organizationId}).select()
            if (think.isEmpty(curMeasure) && curMeasure.length > 0) {
                let questionList = await this.model('question').setRelation('children').where({'measureId': curMeasure[0].id}).order('indexSort ASC').select()
                data.organizationAnswer = questionList
                //curMeasure.answerlist=JSON.parse(JSON.stringify(questionList))
            }
            //return this.json({success:0,data:data,status:1})
            this.body = Response.success({
                data: [],
                status: 0,
                organizationAnswer: data.organizationAnswer,
                roleAnswer: data.roleAnswer
            })
        }
    }

    async saveAnswerAction() {
        let organizationId = this.post('organizationId')
        let organizationAnswer = this.post('organizationAnswer')
        let roleAnswer = this.post('roleAnswer')
        let userId = this.ctx.state.userInfo["user_id"]
        //userId="sdfsdfsdfsf"
        if (!think.isEmpty(roleAnswer)) {
            await this.model('answer_role').add({
                user_id: userId,
                answerlist: roleAnswer,
                organization_id: organizationId,
                finish: 2,
                role: 0
            })
        }
        if (!think.isEmpty(organizationAnswer)) {
            await this.model('answer').add({
                user_id: userId,
                answerlist: organizationAnswer,
                organization_id: organizationId,
                finish: 2
            })
        }
        this.body = Response.success({
            data: [],
            status: 0,
        })
    }

    async getAnswerMeasureListAction() {
        let organizationId = this.post('organizationId')
        let userId = this.post('userId')
        // userId="sdfsdfsdfsf"
        let answer = await this.model('answer').where({user_id: userId, organization_id: organizationId}).select()
        let roleAnswer = await this.model('answer_role').where({user_id: userId, role: 0}).select()
        let data = {}
        if (!think.isEmpty(roleAnswer) && roleAnswer.length > 0) {
            data.roleAnswer = JSON.parse(roleAnswer[0].answerlist)
        }
        if (!think.isEmpty(answer) && answer.length > 0) {
            data.organizationAnswer = JSON.parse(answer[0].answerlist)
        }
        this.body = Response.success({
            data: [],
            status: 0,
            organizationAnswer: data.organizationAnswer,
            roleAnswer: data.roleAnswer
        })
    }
};
