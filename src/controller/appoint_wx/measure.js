const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Util = require('../../util/Util')
const Page = require('../../config/constants/PAGE')
const WechatUtil = require('../../util/WechatUtil')
const ORDER_STATE = require('../../config/constants/ORDER_STATE')
const DateUtil = require('../../util/DateUtil')
const WechatTemplates = require('../../config/WechatTemplates')
const moment = require('moment')
const orderService = require('../../service/order')
const pushService = require('../../service/push')
const logger = think.logger

module.exports = class extends Base {
  //设定管理员可用量表
  async roleMeasureAction(){
    let userId=this.post("userId")
    let measureIds=this.post("measureIds")
    if(!think.isEmpty(userId)&&!think.isEmpty(measureIds)){
      let measureIdArr=JSON.parse(measureIds)
      await this.model("role_measure").where({userId:userId}).delete()
      for(let i=0;i<measureIdArr.length;i++){
        await this.model("role_measure").add({userId:userId,measureId:measureIdArr[i]})
      }
       return this.json({success:0,data:[]});
    }
    return this.json({success:1,error:'用户id或者量表为空'});
  }
  async getRoleMeasureAction(){
     let userId=this.post("userId")
     if(!think.isEmpty(userId)){
        let data=[]
        let measure=await this.model("role_measure").where({userId:userId}).getField("measureId")
        /*if(!think.isEmpty(measure)&&!think.isEmpty(measure["measureId"])&&measure["measureId"].length>0){
          data=await this.model("measure").where({id:["in",measure["measureId"]]})
        }*/
         return this.json({success:0,data:measure});
     }
     return this.json({success:1,error:'用户id不存在'});
  }
  async getRoleMeasureList(isAll,userId,data){
    let list=[]
    if(isAll===true){
      let measure=await this.model("role_measure").where({userId:userId}).getField("measureId")
      if(!think.isEmpty(measure)&&measure.length>0){
        let measureList =await this.model('measure').where({id:["in",measure]}).order('createtime DESC').select();   
        list=data.concat(measureList)
      }else{
        list=data
      }
     
    }else{
      list=data
    }
    return list
  }
  /**量表管理*/
  async listAction() {
    var userId=this.ctx.state.userInfo["user_id"]
    var role=this.ctx.state.userInfo["role"]
    var condition={}
    let roleData=[]
    if(role!==0){
      let roleUser=await this.model('user').where({role:0}).select()
      if(roleUser&&roleUser[0]){
        roleData =await this.model('measure').where({user_id:roleUser[0]["user_id"]}).order('createtime DESC').select()
      }
    }
    const data =await this.model('measure').where({user_id:userId}).order('createtime DESC').select()
    return this.json({success:0,data:data,roleData:roleData,total:1});
  }
  async listAllAction() {
    var userId=this.post("userId")
    var isAll=this.post("isAll")
    var condition={}
    var role=this.ctx.state.userInfo["role"]
    condition["user_id"]=this.ctx.state.userInfo["user_id"]
    let data =await this.model('measure').where(condition).order('createtime DESC').select();
    let list=[]
    if(isAll===true&&role==1){
       list=await this.getRoleMeasureList(isAll,this.ctx.state.userInfo["user_id"],data)
    }else{
      list=data
    }
    const json={success:0,data:list,total:list.length}
    return this.json(json);
  }
  async getByIdAction(){
    const id = this.post('id');
    const data =await this.model('measure').where({id:id}).select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async addAction(){
    const values = this.post()
    let userId=this.ctx.state.userInfo["user_id"]
    let role=this.ctx.state.userInfo["role"]
    values['role']=role
    let userMeasure=await this.model('measure').where({user_id:userId}).select()
    if(userMeasure&&userMeasure.length>0){
      return this.json({success:1,error:'只能添加一个预检表'})
    }
    values["user_id"]=userId
    values["createtime"]=moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss');
    const measureId=await this.model('measure').add(values)
    const data =await this.model('measure').where({id:measureId}).select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async updateAction(){
    const values = this.post()
    const id = this.post('id');
    const data=await this.model('measure').where({id:id}).find()
    let userId=this.ctx.state.userInfo["user_id"]
    if(userId!=data['user_id']){
      return this.json({success:1,error:'您无权限更新'})
    }
    delete values["id"]
    const measureId = await this.model('measure').where({id: id}).update(values);
    const json={success:0,data:[],total:1}
    return this.json(json);
  }
  async deleteAction(){
    const id = this.post('id');
    const data=await this.model('measure').where({id:id}).find()
    let userId=this.ctx.state.userInfo["user_id"]
    if(userId!=data['user_id']){
      return this.json({success:1,error:'您无权限删除'})
    }
    this.model('measure').where({id: id}).delete()
    this.model('question').where({measureId: id}).delete()
    this.model('measure_factor_rule').where({measureId: id}).delete()
    this.model("measure_factor_factor_rule").where({measureId: id}).delete()
    return this.json({success:0,error:''});
  }
  /**量表计算因子*/
  async listFactorAction() {
    const measureId = this.post('measureId');
    const data =await this.model('measure_factor_rule').where({measureId:measureId}).order('dataIndex DESC').select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async getByIdFactorAction(){
    const measureId = this.post("measureId")
    const data =await this.model('measure_factor_rule').where({measureId:measureId}).order('dataIndex DESC').select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async addFactorAction(){
    const values = this.post()
    delete values["id"]
    const id=await this.model('measure_factor_rule').add(values)
    const data =await this.model('measure_factor_rule').where({id:id}).order('dataIndex DESC').select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async updateFactorAction(){
    const values = this.post()
    const id = this.post('id');

    delete values["id"]
    const newMeasuerId = await this.model('measure_factor_rule').where({id:id}).update(values)
    const json={success:0,data:newMeasuerId,total:1}
    return this.json(json);
  }
  async deleteFactorAction(){
    const id = this.post('id');
    this.model('measure_factor_rule').where({id: id}).delete()
    return this.json({success:0});
  }
    /**因子与因子的计算规则*/
  async listFactorAndFactorAction() {
    const measureId = this.post('measureId');
    const data =await this.model('measure_factor_factor_rule').where({measureId:measureId}).select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async getByIdFactorAndFactorAction(){
    const measureId = this.post("measureId")
    const data =await this.model('measure_factor_factor_rule').where({measureId:measureId}).select()
    
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async addFactorAndFactorAction(){
    const values = this.post()
    delete values["id"]
    const id=await this.model('measure_factor_factor_rule').add(values)
    const data =await this.model('measure_factor_factor_rule').where({id:id}).select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async updateFactorAndFactorAction(){
    const values = this.post()
    const id = this.post('id');
    delete values["id"]
    const measureIds = await this.model('measure_factor_factor_rule').where({id:id}).update(values);
    const json={success:0,data:measureIds,total:1}
    return this.json(json);
  }
  async deleteFactorAndFactorAction(){
    const id = this.post('id');
    const measureId = this.post('measureId');
    const data=await this.model('measure').where({id:measureId}).find()
    this.model('measure_factor_factor_rule').where({id: id}).delete()
    return this.json({success:0});
  }
  /**量表跳转规则*/
  async listJumpAction() {
    const questionnaireId=this.post('questionnaireId')
    const data =await this.model('measure_jump_rule').where({measureId:measureId}).select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async getByIdJumpAction(){
    const id=this.post('id')
    const data =await this.model('measure_jump_rule').where({id:id}).select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async addJumpAction(){
    const values = this.post()
    const id=await this.model('measure_jump_rule').add(values)
    const data =await this.model('measure_jump_rule').where({id:id}).select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async updateJumpAction(){
    const values = this.post()
    const id = this.post('id');
    delete values["id"]
    await this.model('measure_jump_rule').where({id:id}).update(values);
    const json={success:0,data:[],total:1}
    return this.json(json);
  }
  async deleteJumpAction(){
    const id = this.post('id');
    this.model('measure_jump_rule').where({id: id}).delete()
    return this.json({success:0});
  }
  async getMeasureSpecificItemAction(){
    const id = this.post('id');
    var measure=await this.model("measure").where({id:id}).select()
    var specificeItem=await this.model("question").where({measureId:id,givenAnswer:['>=', 0]}).select()
    if(!think.isEmpty(measure)&&measure.length>0){
      measure[0]["specificeItems"]=specificeItem
      return this.json({success:0,data:measure});
    }else{
       return this.json({success:0,error:"此量表不存在"});
    }
  }
  async copeFactorFathor(ruleMap,oldMeasureId,newMeasuerId){
    let rules=await this.model("measure_factor_factor_rule").where({'measureId':oldMeasureId}).select()
     if(!think.isEmpty(rules)&&rules.length>0){
      for(let i=0;i<rules.length;i++){
          let rule=rules[i]
          let ruleCondition=rule["ruleCondition"]
          let isFactor=rule["isFactor"]
           if(!think.isEmpty(ruleCondition)){
              ruleCondition=JSON.parse(ruleCondition)
              if(isFactor=="0"){
                let factorRule=ruleCondition["rule"]
                if(!think.isEmpty(factorRule)&&factorRule.length>0){
                  for(let m=0;m<factorRule.length;m++){
                    let factorRules=factorRule[m]["rules"]
                    if(!think.isEmpty(factorRules)&&factorRules.length>0){
                      for(let n=0;n<factorRules.length;n++){
                          factorRules[n]["id"]=ruleMap[factorRules[n]["id"]]
                      }
                    }
                  }
                }
                let newruleCondition=JSON.stringify(ruleCondition)
                rule["ruleCondition"]=newruleCondition
              }else if(isFactor=="1"){
                let factors=ruleCondition["factors"]
                if(!think.isEmpty(factors)&&factors.length>0){
                  for(let m=0;m<factors.length;m++){
                    let factorOperation=factors[m]["factorOperation"]
                    if(!think.isEmpty(factorOperation)&&factorOperation.length>0){
                      for(let n=0;n<factorOperation.length;n++){
                        factorOperation[n]["factorId"]=ruleMap[factorOperation[n]["factorId"]]
                      }
                    }
                  }
                }
                let adjustFactors=ruleCondition["adjustFactors"]
                if(!think.isEmpty(adjustFactors)&&adjustFactors.length>0){
                  for(let j=0;j<adjustFactors.length;j++){
                    adjustFactors[j]["factorId"]=ruleMap[adjustFactors[j]["factorId"]]
                  }
                }
                 let newruleCondition=JSON.stringify(ruleCondition)
                rule["ruleCondition"]=newruleCondition

              }
             
              //
            }
            rule["measureId"]=newMeasuerId
            delete rule["id"]
            await this.model("measure_factor_factor_rule").add(rule)
        }
     }
  }
  async copyRelation(ruleMap,relation){
    for(let i=0;i<relation.length;i++){
        let childFactorIdArray=relation[i]["childFactorIdArray"]
        if(!think.isEmpty(childFactorIdArray)&&childFactorIdArray.length>0){
            for(let m=0;m<childFactorIdArray.length;m++){
              childFactorIdArray[m]=ruleMap[childFactorIdArray[m]]
            }
        }
        let fathor=relation[i]["factor"]
        if(!think.isEmpty(fathor)){
          fathor["factorId"]=ruleMap[fathor["factorId"]]
        }
        let children=relation[i]["children"]
        if(!think.isEmpty(children)&&children.length>0){
            for(let m=0;m<children.length;m++){
              children[m]["factorId"]=ruleMap[children[m]["factorId"]]
            }
        }
    }
  }
  async copeFactor(questionMap,oldMeasureId,newMeasuerId,relation){
      let ruleMap={}//跳转中间值
      let rules=await this.model("measure_factor_rule").where({'measureId':oldMeasureId}).select()
      if(!think.isEmpty(rules)&&rules.length>0){
        for(let i=0;i<rules.length;i++){
          let rule=rules[i]
          let ruleCondition=rule["ruleCondition"]
           if(!think.isEmpty(ruleCondition)){
              ruleCondition=JSON.parse(ruleCondition)
              //rule的special特殊规则
              let specialRules=ruleCondition["rules"]
              if(!think.isEmpty(specialRules)&&specialRules.length>0){
                for(let m=0;m<specialRules.length;m++){
                  let specialRule=specialRules[m]
                  if(!think.isEmpty(specialRule)&&!think.isEmpty(specialRule["special"])&&!think.isEmpty(specialRule["operators"])){
                    let specialOperator=specialRule["operators"]
                    for(let n=0;n<specialOperator.length;n++){
                      specialOperator[n]["itemId"]=questionMap[specialOperator[n]["itemId"]]
                    }
                  }
                }
              }
              //条目列表
              let items=ruleCondition["items"]
              if(!think.isEmpty(items)&&items.length>0){
                for(let j=0;j<items.length;j++){
                  items[j]["itemId"]=questionMap[items[j]["itemId"]]
                }
              }
              //
              let newruleCondition=JSON.stringify(ruleCondition)
              rule["ruleCondition"]=newruleCondition
           }
           let stId=rule["id"]
           delete rule["id"]
           rule["measureId"]=newMeasuerId
           let newId=await this.model("measure_factor_rule").add(rule)
           ruleMap[stId]=newId
        }
      }
      this.copeFactorFathor(ruleMap,oldMeasureId,newMeasuerId)
      if(!think.isEmpty(relation)){
        let newrelation=JSON.parse(relation)
        this.copyRelation(ruleMap,newrelation)
        await this.model("measure").where({id:newMeasuerId}).update({factor_relation:JSON.stringify(newrelation)})
      }
      
  }
  async copyMeasureAction(){
    const id=this.post("id")
    var time=moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss');
    var measure=await this.model("measure").where({id:id}).find()
    let questionMap={}//复制前条目和复制后条目对应
    delete measure["id"]
    measure["name"]=measure["name"]+"-复制"
    measure["createtime"]=time
    measure["user_id"]=this.ctx.state.userInfo["user_id"]
    var measureid=await this.model("measure").add(measure)
    var questions=await this.model('question').setRelation('children').where({'measureId':id}).select()
    //条目复制
    if(!think.isEmpty(questions)&&questions.length>0){
      for(let i=0;i<questions.length;i++){
        var question=questions[i]
        var questionId=question["id"]
        var children=question["children"]
        let stId=question["id"]

        delete question["children"]
        delete question["id"]
        question["createtime"]=time
        question["measureId"]=measureid
        //子条目复制
        var newId=await this.model('question').add(question)
        questionMap[stId]=newId
        if(!think.isEmpty(children)&&children.length>0){
          for(let j=0;j<children.length;j++){
            delete children[j]["id"]
            children[j]["createtime"]=time
            children[j]["parentId"]=newId
            await this.model('question_children').add(question)
          }
        }
      }
    }
    //更新量表特定值
    let specificItems=measure["specificItem"]
    if(!think.isEmpty(specificItems)){
      specificItems=JSON.parse(specificItems)
      for(let k=0;k<specificItems.length;k++){
        let specificItem=specificItems[k]
        let specificlist=[]
        if(!think.isEmpty(specificItem["specificList"])){
          for(let z=0;z<specificItem["specificList"].length;z++){
              if(!think.isEmpty(questionMap[specificItem["specificList"][z]])){
                specificlist.push(questionMap[specificItem["specificList"][z]])
              }
          }
        }
        specificItem["specificList"]=specificlist
      }
      
      let newspecificItem=JSON.stringify(specificItems)
      await this.model("measure").where({id:measureid}).update({specificItem:JSON.stringify(newspecificItem)})
    }
    //普通因子复制
    this.copeFactor(questionMap,id,measureid,measure["factor_relation"])
  }
};
