const Base = require('./base.js');
const Response = require('../../config/response')
var moment = require('moment');
const fs = require('fs');
const logger = think.logger
module.exports = class extends Base {
    /**条目管理*/
    async listAction() {
        const measureId = this.post('measureId')
        const data = await this.model('question').setRelation('children').where({'measureId': measureId}).order('indexSort ASC').select()
        let measure = await this.model("measure").where({id: measureId}).find()
        const json = {success: 0, data: data, total: data.length, role: measure.role}
        this.body = Response.success(json)
    }

    async getByIdAction() {
        const id = this.post('id');
        const data = await this.model('question').setRelation('children').where({id: id}).select()
        const json = {success: 0, data: data, total: 1}
        this.body = Response.success(json)
    }

    async addBatchAction() {
        const batch = this.post()
        var json = {}
        var jsonData = []
        if (batch["values"]) {
            const list = JSON.parse(batch["values"])
            if (!think.isEmpty(list) && list.length > 0) {
                for (let i = 0; i < list.length; i++) {
                    var values = list[i]
                    var qustionCondition = {measureId: values["measureId"]}
                    if (!think.isEmpty(values["questionIndex"])) {
                        qustionCondition["questionIndex"] = values["questionIndex"]
                    }
                    const isQuestionSort = await this.model('question').where(qustionCondition).getField('indexSort');

                    if ((values['type'] == "0" || values['type'] == "1") || think.isEmpty(isQuestionSort)) {
                        const maxSort = await this.model('question').where({measureId: values["measureId"]}).order('indexSort DESC').limit(1).getField('indexSort');
                        if (maxSort) {
                            values['indexSort'] = maxSort[0] + 1
                        } else {
                            values['indexSort'] = 0
                        }
                        values["createtime"] = moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss');
                        const questionId = await this.model('question').add(values)

                        values["id"] = questionId

                        jsonData.push(values)
                    }
                }
            }
            json = {success: 0, error: '', data: jsonData}
        } else {
            json = {success: '1', error: '没有量表参数'}
        }
        this.body = Response.success(json)
    }

    async addAction() {
        const values = this.post()
        if (values["measureId"]) {
            var qustionCondition = {measureId: values["measureId"]}
            if (!think.isEmpty(values["questionIndex"])) {
                qustionCondition["questionIndex"] = values["questionIndex"]
            }
            const isQuestionSort = await this.model('question').where(qustionCondition).getField('indexSort');
            if ((values['type'] == "0" || values['type'] == "1") || think.isEmpty(isQuestionSort)) {
                const maxSort = await this.model('question').where({measureId: values["measureId"]}).order('indexSort DESC').limit(1).getField('indexSort');
                if (maxSort) {
                    values['indexSort'] = maxSort[0] + 1
                } else {
                    values['indexSort'] = 0
                }
                values["createtime"] = moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss');
                const children = values["children"]
                delete values["children"]
                const questionId = await this.model('question').add(values)
                if (children && values["isParent"]) {
                    this.addChildrenObj(children, questionId)
                }
                const data = await this.model('question').setRelation('children').where({id: questionId}).select()
                const json = {success: 0, data: data, total: 1}
                this.body = Response.success(json)
            } else {
                this.body = Response.businessException("出现重复排序")
            }

        } else {
            this.body = Response.businessException("没有量表参数")
        }

    }

    async addChildrenObj(children, questionId) {
        const arr = JSON.parse(children)
        for (let i = 0; i < arr.length; i++) {
            var obj = arr[i]
            obj["createtime"] = moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss')
            obj['parentId'] = questionId
            obj['indexSort'] = i
            if (!think.isEmpty(obj["id"])) {
                delete obj["id"]
            }
            await this.model('question_children').add(obj)
        }
    }

    async updateAction() {
        const values = this.post()
        const id = this.post('id');
        const measureId = this.post('measureId');
        const data = await this.model('measure').where({id: measureId}).find()
        if (!think.isEmpty(data)) {
            if (data["user_id"] !== this.ctx.state.userInfo["id"]) {
                return this.json({success: 1, error: "您没有权限修改"})
            }
        }
        delete values["id"]
        if (!think.isEmpty(values["children"])) {
            await this.model('question_children').where({parentId: id}).delete();
            this.addChildrenObj(values["children"], id)
        }
        const questionId = await this.model('question').where({id: id}).update(values);
        //const data =await this.model('question').setRelation('children').where({id:id}).select()
        const json = {success: 0, data: questionId, total: 1}
        return this.json(json);
    }

    async updateBatchAction() {
        const params = this.post("values")
        if (!think.isEmpty(params)) {
            var param = JSON.parse(params)
            for (let i = 0; i < param.length; i++) {
                const values = param[i]
                const id = values["id"]
                delete values["id"]
                if (values["children"]) {
                    await this.model('question_children').where({parentId: id}).delete();
                    this.addChildrenObj(values["children"], id)
                }
                const questionId = await this.model('question').where({id: id}).update(values);
            }
        }


        return this.json({success: 0});
    }

    async deleteAction() {
        const id = this.post('id');
        const measureId = this.post('measureId');
        const data = await this.model('measure').where({id: measureId}).find()
        this.model('question').where({id: id}).delete()
        this.model('question_children').where({parentId: id}).delete()
        return this.json({success: 0, error: ''});
    }

    /**子条目管理*/
    async listChildrenAction() {
        const questionId = this.post("parentId")
        const data = await this.model('question_children').where({parentId: questionId}).select()
        const json = {success: 0, data: data, total: data.length}
        return this.json(json);
    }

    async getByIdChildrenAction() {
        const id = this.post("id")
        const data = await this.model('question_children').where({id: id}).select()
        const json = {success: 0, data: data, total: data.length}
        return this.json(json);
    }

    async addChildrenAction() {
        const values = this.post()
        values["createtime"] = moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss');
        const questionId = await this.model('question_children').add(values)
        const data = await this.model('question_children').where({id: questionId}).select()
        const json = {success: 0, data: data, total: 1}
        return this.json(json);
    }

    async updateChildrenAction() {
        const values = this.post()
        const id = this.post('id');
        const measureId = this.post('measureId');
        const data = await this.model('measure').where({id: measureId}).find()
        delete values["id"]
        const questionId = await this.model('question_children').where({id: id}).update(values);
        //const data =await this.model('question_children').where({id:id}).select()
        const json = {success: 0, data: questionId, total: 1}
        return this.json(json);
    }

    async deleteChildrenAction() {
        const id = this.post('id');
        const measureId = this.post('measureId');
        this.model('question_children').where({id: id}).delete()
        return this.json({success: 0, error: ''});
    }

    async upLoadFileAction() {
        logger.info(`文件上传参数：${this.post()}`)
        logger.info(`文件上传参数：${this.file('file')}`)
        if (!think.isEmpty(this.file('file'))) {
            let file = think.extend({}, this.file('file'));
            let savepath = think.ROOT_PATH + '/www/static/image/';
            let filepath = file.path; //文件路径
            let filename = file.name; //文件名
            let suffix = filename.substr(filename.lastIndexOf('.') + 1); //文件后缀
            let newfilename = think.uuid() + '.' + suffix;

            let datas = fs.readFileSync(filepath);

            fs.writeFileSync(savepath + newfilename, datas);
            this.body = Response.success({url: '/static/image/' + newfilename})
        }else{
            this.body=Response.businessException("上传失败")
        }
    }
};
