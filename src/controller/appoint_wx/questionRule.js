const Base = require('./base.js');

module.exports = class extends Base {
  /**子条目计算规则*/
  async listAction() {
    const questionId = this.post('questionId')
   	const data =await this.model('question_calculation_rule').where({'questionId':questionId}).select()
   	const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async getByIdAction(){
    const id = this.post("id")
    const data =await this.model('question_calculation_rule').where({'id':id}).select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async addAction(){
  	const values = this.post()
  	const id=await this.model('question_calculation_rule').add(values)
  	const data =await this.model('question_calculation_rule').where({'id':id}).select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async updateAction(){
	  const values = this.post()
  	const id = this.post('id');
  	delete values["id"]
  	const questionId = await this.model('question_calculation_rule').where({id: id}).update(values);
  	const data =await this.model('question_calculation_rule').where({'id':id}).select()
    const json={success:0,data:data,total:1}
    return this.json(json);
  }
  async deleteAction(){
  	const id = this.post('id');
  	this.model('question_calculation_rule').where({id: id}).delete()
  	return this.json({success:0});
  }
};