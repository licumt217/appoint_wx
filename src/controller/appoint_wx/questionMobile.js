const Base = require('./base.js');
var moment = require('moment');
const Response = require('../../config/response')
module.exports = class extends Base{
   async getMeasureListAction(){
    let organizationId=this.post('organizationId')
    let userId=this.ctx.state.userInfo["user_id"]
    //userId="sdfsdfsdfsf"
    let answer=await this.model('answer').where({user_id:userId,organization_id:organizationId}).select()
    let roleAnwer=await this.model('answer_role').where({user_id:userId,role:0}).select()
    if((!think.isEmpty(answer)&&answer.length>0&&answer[0].finsh==2)&&(!think.isEmpty(roleAnwer)&&roleAnwer.length>0&&roleAnwer[0].finsh==2)){
      //return this.json({success:0,data:[],status:0})
      this.body=Response.success({
        data:[],
        status:0
      })
    }else if((!think.isEmpty(roleAnwer)&&roleAnwer.length>0&&roleAnwer[0].finish==2)&&think.isEmpty(answer)){
      let curMeasure=await this.model("measure").where({user_id:organizationId}).select()
      if(curMeasure&&curMeasure.length>0){
        let questionList=await this.model('question').setRelation('children').where({'measureId':curMeasure[0].id}).order('indexSort ASC').select()
        //return this.json({success:0,data:{organizationAnswer:questionList},status:1})
        //curMeasure.answerlist=JSON.parse(JSON.stringify(questionList))
        this.body=Response.success({
          data:[],
          status:0,
          organizationAnswer:questionList
        })
      }
    }else{
      let data={}
      let roleMeasure=await this.model("measure").where({role:0}).select()
      if(roleMeasure&&roleMeasure.length>0){
        let questionList=await this.model('question').setRelation('children').where({'measureId':roleMeasure[0].id}).order('indexSort ASC').select()
        data.roleAnwer=questionList
        //roleMeasure.answerlist=JSON.parse(JSON.stringify(questionList))
      }
      let curMeasure=await this.model("measure").where({user_id:organizationId}).select()
      if(curMeasure&&curMeasure.length>0){
        let questionList=await this.model('question').setRelation('children').where({'measureId':curMeasure[0].id}).order('indexSort ASC').select()
        data.organizationAnswer=questionList
        //curMeasure.answerlist=JSON.parse(JSON.stringify(questionList))
      }
      //return this.json({success:0,data:data,status:1})
        this.body=Response.success({
          data:[],
          status:0,
          organizationAnswer:data.organizationAnswer,
          roleAnwer:data.roleAnwer
        })
    }
    //return this.json({success:0,data:[],status:1})
    //let roleMeasure=await this.model("measure").where({role:0}).select()

  }
  async saveAnswerAction(){
    let organizationId=this.post('organizationId')
    let organizationAnswer=this.post('organizationAnswer')
    let roleAnwer=this.post('roleAnwer')
    let userId=this.ctx.state.userInfo["user_id"]
    //userId="sdfsdfsdfsf"
    if(!think.isEmpty(roleAnwer)){
      await this.model('answer_role').add({user_id:userId,answerlist:roleAnwer,organization_id:organizationId,finish:2,role:0})
    }
    if(!think.isEmpty(organizationAnswer)){
      await this.model('answer').add({user_id:userId,answerlist:organizationAnswer,organization_id:organizationId,finish:2})
    }
    this.body=Response.success({
      data:[],
      status:0,
    })
  }
  async getAnswerMeasureListAction(){
    let organizationId=this.post('organizationId')
    let userId=this.post('userId')
    //userId="sdfsdfsdfsf"
    let answer=await this.model('answer').where({user_id:userId,organization_id:organizationId}).select()
    let roleAnwer=await this.model('answer_role').where({user_id:userId,role:0}).select()
    let data={}
    if(!think.isEmpty(roleAnwer)&&roleAnwer.length>0){
       data.roleAnwer=JSON.parse(roleAnwer[0].answerlist)
    }
    if(!think.isEmpty(answer)&&answer.length>0){
       data.organizationAnswer=JSON.parse(answer[0].answerlist)
    }
    this.body=Response.success({
      data:[],
      status:0,
      organizationAnswer:data.organizationAnswer,
      roleAnwer:data.roleAnwer
    })
  }
};
