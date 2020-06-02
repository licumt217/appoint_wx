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
const userService = require('../../service/user')



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

            logger.info(`新增用户参数 :${JSON.stringify(this.post())}`)

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

            //新增咨询师，需要校验流派等

            let school_type_id, qualification_type_id, manner_type_id, level_type_id
            if (role === Role.therapist) {
                school_type_id = this.post('school_type_id')
                qualification_type_id = this.post('qualification_type_id')
                manner_type_id = this.post('manner_type_id')
                level_type_id = this.post('level_type_id')

                if (!school_type_id) {
                    this.body = Response.businessException(`流派类型不能为空！`)
                    return false;
                }

                if (!qualification_type_id) {
                    this.body = Response.businessException(`资历类型不能为空！`)
                    return false;
                }

                if (!manner_type_id) {
                    this.body = Response.businessException(`咨询方式类型不能为空！`)
                    return false;
                }

                if (!level_type_id) {
                    this.body = Response.businessException(`等级类型不能为空！`)
                    return false;
                }

            }

            let op_date = DateUtil.getNowStr()

            let user_id = Util.uuid();
            let addJson = {
                user_id,
                name,
                phone,
                gender,
                birthday,
                email,
                op_date,
                role,
                identification_no
            }

            if (role !== Role.client) {
                addJson.password = Constant.defaultPassword
            }

            await this.model('user').add(addJson);

            //新增咨询师，需要添加咨询师和流派、资历等的关系表
            if (role === Role.therapist) {
                await this.model('therapist_attach_relation').add({
                    therapist_attach_relation_id: Util.uuid(),
                    therapist_id: user_id,
                    school_type_id,
                    qualification_type_id,
                    manner_type_id,
                    level_type_id,
                    op_date,
                    emergency: Constant.EMERGENCY.DISABLE
                });
            }

            this.body = Response.success(user_id);

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

            let user_id = this.post('user_id')

            logger.info(`删除用户参数 :${JSON.stringify(this.post())}`)

            if (!user_id) {
                this.body = Response.businessException(`用户ID不能为空！`)
                return false;
            }


            let data = await this.model('user').where({
                user_id,
            }).delete()

            logger.info(`删除用户，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`删除用户异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 修改密码
     * @returns {Promise<any | Promise<any>>}
     */
    async updatePasswordAction() {
        let user_id = this.ctx.state.userInfo.user_id
        console.log(user_id)
        let password = this.post("password")
        let newPassword = this.post("newPassword")
        let confirmPassword = this.post("confirmPassword")

        logger.info(`修改密码参数 :${JSON.stringify(this.post())}`)

        if (!user_id) {
            this.body = Response.businessException(`用户ID不能为空！`)
            return false;
        }

        if (!password) {
            this.body = Response.businessException(`原始密码不能为空！`)
            return false;
        }

        if (!newPassword) {
            this.body = Response.businessException(`新密码不能为空！`)
            return false;
        }

        if (!confirmPassword) {
            this.body = Response.businessException(`确认新密码不能为空！`)
            return false;
        }

        if (password === newPassword) {
            this.body = Response.businessException(`新旧密码不能相同！`)
            return false;
        }

        if (confirmPassword !== newPassword) {
            this.body = Response.businessException(`新密码和确认密码不同！`)
            return false;
        }

        password = md5(password)

        const user = await this.model('user').where({user_id, password}).find()

        if (Util.isEmptyObject(user)) {
            this.body = Response.businessException(`原始密码错误！`)
        } else {
            await this.model('user').where({user_id}).update({password: md5(newPassword)});
            return this.json()
        }


    }

    /**
     * 修改用户信息
     * @returns {Promise<boolean>}
     */
    async updateAction() {
        try {

            let user_id = this.post('user_id')
            let name = this.post('name')
            let phone = this.post('phone')
            let gender = this.post('gender')
            let birthday = this.post('birthday')
            let email = this.post('email')
            let identification_no = this.post('identification_no') || ''

            logger.info(`修改用户信息参数 :${JSON.stringify(this.post())}`)

            let updateJson = {}
            if (name) {
                updateJson.name = name
            }

            if (phone) {
                updateJson.phone = phone
            }

            if (gender) {
                updateJson.gender = gender
            }

            if (birthday) {
                updateJson.birthday = DateUtil.format(birthday)
            }

            if (email) {
                updateJson.email = email
            }

            updateJson.identification_no = identification_no;

            let op_date = DateUtil.getNowStr()

            updateJson.op_date = op_date;

            let userInfo = await this.model('user').where({
                user_id
            }).find()

            let data = await this.model('user').where({
                user_id
            }).update(updateJson);

            logger.info(`修改用户信息，数据库返回：${JSON.stringify(data)}`)

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
            let manner_type_id = this.post('manner_type_id')
            let qualification_type_id = this.post('qualification_type_id')
            let school_type_id = this.post('school_type_id')
            let gender = this.post('gender')
            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize

            logger.info(`获取用户列表参数 :${JSON.stringify(this.post())}`)

            if (!role) {
                this.body = Response.businessException(`用户类型不能为空！`)
                return false;
            }

            //如果是加载咨询师列表，则将咨询师关联的等级、资历等关联加载
            let data = []
            if (role === Role.therapist) {

                let whereObj = {
                    role
                }

                let joinStr = 'appoint_therapist_attach_relation on appoint_user.user_id=appoint_therapist_attach_relation.therapist_id'

                //咨询方式：线上、线下
                if (manner_type_id) {
                    whereObj.manner_type_id = manner_type_id;
                    joinStr += ` and appoint_therapist_attach_relation.manner_type_id=${manner_type_id}`
                }

                if (school_type_id) {
                    whereObj.school_type_id = school_type_id;
                    joinStr += ` and appoint_therapist_attach_relation.school_type_id=${school_type_id}`
                }

                if (qualification_type_id) {
                    whereObj.qualification_type_id = qualification_type_id;
                    joinStr += ` and appoint_therapist_attach_relation.qualification_type_id=${qualification_type_id}`
                }

                if (gender) {
                    whereObj.gender = gender;
                }


                data = await this.model('user').where(whereObj).join(joinStr).page(page, pageSize).countSelect();

            } else {
                data = await this.model('user').where({
                    role
                }).page(page, pageSize).countSelect();
            }


            logger.info(`获取用户列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取用户列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 获取当前登录用户信息
     * @returns {Promise<boolean>}
     */
    async getByIdAction() {
        try {

            let user_id = this.ctx.state.userInfo.user_id;
            let role = this.ctx.state.userInfo.role;

            //如果是加载咨询师列表，则将咨询师关联的等级、资历等关联加载
            let data = []
            if (role === Role.therapist) {

                let whereObj = {
                    user_id
                }

                let joinStr = 'appoint_therapist_attach_relation on appoint_user.user_id=appoint_therapist_attach_relation.therapist_id'

                data = await this.model('user').where(whereObj).join(joinStr).find();

            } else {
                data = await this.model('user').where({
                    user_id
                }).find();
            }


            logger.info(`获取用户列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取用户列表异常 msg:${e}`);
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

            //已存在的手机号不允许注册

            let existUser = await userService.getByPhone(phone);

            if (!Util.isEmptyObject(existUser)) {
                this.body = Response.businessException(`该手机号对应用户已存在，请修改！`)
                return false;
            }

            let op_date = DateUtil.getNowStr()

            let user_id = await this.model('user').add({
                user_id: Util.uuid(),
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
                weixin_user_id: Util.uuid(),
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
