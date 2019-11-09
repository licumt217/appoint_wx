const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const md5 = require('md5')
const logger = think.logger;


module.exports = class extends Base {

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


};