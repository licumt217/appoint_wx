const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Role = require('../../config/Role')
const Page = require('../../config/Page')
const Constant = require('../../config/Constant')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const md5 = require('md5')
const logger = think.logger;


module.exports = class extends Base {


    /**
     * 新增用户
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let name = this.post('name')
            let phone = this.post('phone')
            let gender = this.post('gender')
            let birthday = this.post('birthday')
            let email = this.post('email')
            let role = this.post('role')
            let isEmergency = this.post('isEmergency')

            logger.info(`新增用户参数 name:${name}， phone:${phone}， gender:${gender}， birthday:${birthday}， email:${email}， role:${role}, isEmergency:${isEmergency},`)

            if (!name) {
                this.body = Response.businessException(`姓名不能为空！`)
                return false;
            }

            if (!phone) {
                this.body = Response.businessException(`手机号不能为空！`)
                return false;
            }

            if (!gender) {
                this.body = Response.businessException(`性别不能为空！`)
                return false;
            }

            if (!birthday) {
                this.body = Response.businessException(`出生日期不能为空！`)
                return false;
            }

            if (!email) {
                this.body = Response.businessException(`电子邮件不能为空！`)
                return false;
            }

            if (!role) {
                this.body = Response.businessException(`用户类型不能为空！`)
                return false;
            }

            isEmergency=isEmergency||0;

            //新增咨询师，需要校验流派等

            let schoolTypeId, qualificationTypeId, mannerTypeId, levelTypeId
            if(role===Role.therapist){
                schoolTypeId = this.post('schoolTypeId')
                qualificationTypeId = this.post('qualificationTypeId')
                mannerTypeId = this.post('mannerTypeId')
                levelTypeId = this.post('levelTypeId')

                if (!schoolTypeId) {
                    this.body = Response.businessException(`流派类型不能为空！`)
                    return false;
                }

                if (!qualificationTypeId) {
                    this.body = Response.businessException(`资历类型不能为空！`)
                    return false;
                }

                if (!mannerTypeId) {
                    this.body = Response.businessException(`咨询方式类型不能为空！`)
                    return false;
                }

                if (!levelTypeId) {
                    this.body = Response.businessException(`等级类型不能为空！`)
                    return false;
                }

            }

            let op_date=DateUtil.getNowStr()

            let addJson={
                name,
                phone,
                gender,
                birthday,
                email,
                op_date,
                role,
                isEmergency
            }

            if(role!==Role.client){
                addJson.password=Constant.defaultPassword
            }

            let userId = await this.model('user').add(addJson);

            logger.info(`新增用户，数据库返回：${JSON.stringify(userId)}`)

            //新增咨询师，需要添加咨询师和流派、资历等的关系表
            if(role===Role.therapist){
                await this.model('therapist_attach_relation').add({
                    therapist_id:userId,
                    schoolTypeId,
                    qualificationTypeId,
                    mannerTypeId,
                    levelTypeId,
                    op_date
                });
            }

            this.body = Response.success(userId);

        } catch (e) {
            logger.info(`新增用户异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 删除用户
     * @returns {Promise<boolean>}
     */
    async deleteAction() {
        try {

            let id = this.post('id')

            logger.info(`删除用户参数 id:${id}`)

            if (!id) {
                this.body = Response.businessException(`用户ID不能为空！`)
                return false;
            }


            let data = await this.model('user').where({
                id,
            }).delete()

            logger.info(`删除用户，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`删除用户异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 修改用户信息
     * @returns {Promise<boolean>}
     */
    async updateAction() {
        try {

            let id = this.post('id')
            let name = this.post('name')
            let phone = this.post('phone')
            let gender = this.post('gender')
            let birthday = this.post('birthday')
            let email = this.post('email')
            let isEmergency = this.post('isEmergency')

            logger.info(`修改用户信息参数 id:${id}，name:${name}， phone:${phone}， gender:${gender}， birthday:${birthday}， email:${email},isEmergency:${isEmergency}`)

            isEmergency=isEmergency||0

            let updateJson={}
            if (name) {
                updateJson.name=name
            }

            if (phone) {
                updateJson.phone=phone
            }

            if (gender) {
                updateJson.gender=gender
            }

            if (birthday) {
                updateJson.birthday=birthday
            }

            if (email) {
                updateJson.email=email
            }

            let op_date=DateUtil.getNowStr()

            updateJson.op_date=op_date;
            updateJson.isEmergency=isEmergency;

            let userInfo=await this.model('user').where({
                id:id
            }).find()

            //修改咨询师，需要添加咨询师和流派、资历等的关系表
            let schoolTypeId, qualificationTypeId, mannerTypeId, levelTypeId
            if(userInfo.role===Role.therapist){
                schoolTypeId = this.post('schoolTypeId')
                qualificationTypeId = this.post('qualificationTypeId')
                mannerTypeId = this.post('mannerTypeId')
                levelTypeId = this.post('levelTypeId')

                if (!schoolTypeId) {
                    this.body = Response.businessException(`流派类型不能为空！`)
                    return false;
                }

                if (!qualificationTypeId) {
                    this.body = Response.businessException(`资历类型不能为空！`)
                    return false;
                }

                if (!mannerTypeId) {
                    this.body = Response.businessException(`咨询方式类型不能为空！`)
                    return false;
                }

                if (!levelTypeId) {
                    this.body = Response.businessException(`等级类型不能为空！`)
                    return false;
                }
            }



            let data = await this.model('user').where({
                id
            }).update(updateJson);

            logger.info(`修改用户信息，数据库返回：${JSON.stringify(data)}`)

            //修改咨询师和流派、资历等的关系表
            if(userInfo.role===Role.therapist){
                await this.model('therapist_attach_relation').where({
                    therapist_id: id
                }).update({
                    schoolTypeId,
                    qualificationTypeId,
                    mannerTypeId,
                    levelTypeId,
                    op_date
                });
            }

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`修改用户信息异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 获取用户列表
     * @returns {Promise<boolean>}
     */
    async listAction() {
        try {

            let role = this.post('role')
            let isEmergency = this.post('isEmergency')
            let page = this.post('page')||Page.currentPage
            let pageSize = this.post('pageSize')||Page.pageSize

            logger.info(`获取用户列表参数 role:${role}, page:${page}, pageSize:${pageSize}, isEmergency:${isEmergency}`)

            if (!role) {
                this.body = Response.businessException(`用户类型不能为空！`)
                return false;
            }

            //如果是加载咨询师列表，则将咨询师关联的等级、资历等关联加载
            let data=[]
            if(role===Role.therapist){

                let whereObj={
                    role
                }

                //添加紧急咨询条件
                if(isEmergency===1){
                    whereObj.isEmergency=isEmergency;
                }

                data = await this.model('user').where(whereObj).join('appoint_therapist_attach_relation on appoint_user.id=appoint_therapist_attach_relation.therapist_id').page(page,pageSize).countSelect();
            }else{
                data = await this.model('user').where({
                    role
                }).page(page,pageSize).countSelect();
            }


            logger.info(`获取用户列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取用户列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * pc端用户登录
     * @returns {Promise<void>}
     */
    async loginAction() {
        try {

            let phone = this.post('phone')
            let password = this.post('password')

            logger.info(`pc端用户登录参数 phone:${phone}， password:${password}`)

            if (!phone) {
                this.body = Response.businessException(`手机号不能为空！`)
                return false;
            }

            if (!password) {
                this.body = Response.businessException(`密码不能为空！`)
                return false;
            }

            password=md5(password)


            let data = await this.model('user').where({
                phone
            }).find();

            logger.info(`pc端用户登录根据手机号查询，数据库返回：${JSON.stringify(data)}`)

            if (Util.isEmptyObject(data)) {
                this.body = Response.businessException(`手机号不存在！`);
            } else {

                data = await this.model('user').where({
                    phone,
                    password
                }).find();

                logger.info(`pc端用户登录根据手机号和密码查询，数据库返回：${JSON.stringify(data)}`)

                if (Util.isEmptyObject(data)) {
                    this.body = Response.businessException(`密码不正确！`);
                } else {
                    const TokenSerivce = this.service('token');

                    const token = await TokenSerivce.create({userInfo:data});

                    this.body = Response.success({
                        userInfo:data,
                        token
                    });
                }
            }

        } catch (e) {
            logger.info(`pc端用户登录异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }





    /**
     * 用户注册，同时将userId和openid绑定
     * @returns {Promise<void>}
     */
    async registerAndBindAction() {

        let openid = this.post('openid'),
            phone = this.post('phone'),
            identification_no = this.post('identification_no'),
            gender = this.post('gender'),
            email = this.post('email'),
            name = this.post('name'),
            birthday = this.post('birthday');

        logger.info(`用户注册，同时将userId和openid绑定参数 openid:${openid}, phone:${phone}, identification_no:${identification_no}, gender:${gender}, email:${email}, birthday:${birthday},name:${name},`);

        if (!openid) {
            this.body = Response.businessException(`openid不能为空！`)
            return false;
        }

        if (!phone) {
            this.body = Response.businessException(`手机号不能为空！`)
            return false;
        }

        if (!identification_no) {
            this.body = Response.businessException(`身份证号不能为空！`)
            return false;
        }

        if (!gender) {
            this.body = Response.businessException(`性别不能为空！`)
            return false;
        }

        if (!email) {
            this.body = Response.businessException(`电子邮件不能为空！`)
            return false;
        }

        if (!birthday) {
            this.body = Response.businessException(`出生日期不能为空！`)
            return false;
        }

        try {

            let op_date = DateUtil.getNowStr()

            let user_id = await this.model('user').add({
                openid,
                phone,
                identification_no,
                gender,
                email,
                birthday: DateUtil.format(birthday, 'date'),
                name,
                op_date
            })

            logger.info(`用户注册数据库返回：user_id:${user_id}`)

            await this.model('weixin_user').add({
                openid,
                user_id,
                op_date
            })


            this.body = Response.success(user_id);

        } catch (e) {
            logger.info(`用户注册，同时将userId和openid绑定异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    async indexAction() {

        let token = await this.getToken();

        this.json({token: token})


    }

    getToken() {

        return new Promise(((resolve, reject) => {
            request.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx983e6f0f3345a6c6&secret=bccf7d2d46b446ec5749fc173f1e051b`, (error, response, body) => {
                console.log(3333333, error)

                if (error) {
                    resolve(error)
                } else {

                    resolve(JSON.parse(body).access_token)
                }
            })
        }))

    }

};
