const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const Role = require('../../config/Role')
const DateUtil = require('../../util/DateUtil')
const md5 = require('md5')
const logger = think.logger;
const therapistService = require('../../service/therapist')
const userService = require('../../service/user')
const stationCasemanagerRelationService = require('../../service/stationCasemanagerRelation')
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

            password = md5(password)


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

                    const token = await TokenSerivce.create({userInfo: data});

                    let station = {}

                    if (data.role === Role.caseManager) {
                        station = await stationCasemanagerRelationService.getStationInfoByCasemanagerId(data.user_id)
                        logger.info(JSON.stringify(station))
                    }

                    this.body = Response.success({
                        userInfo: Object.assign(data, station),
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
     * 根据openid获取对应的c端用户信息
     * @param code
     * @returns {Promise<void>}
     */
    async getUserByOpenidAction() {

        let openid = this.post('openid')

        logger.info(`根据openid获取对应的c端用户信息参数 openid:${openid}`);

        try {

            let data = await this.model('weixin_user').where({
                openid
            }).find();

            logger.info(`根据openid查询user_id数据库返回：${JSON.stringify(data)}`)
            logger.info(`data:：${JSON.stringify(data)}`)
            logger.info(Util.isEmptyObject(data))


            if (Util.isEmptyObject(data)) {
                this.body = Response.success();
            } else {
                const user_id = data.user_id;


                data = await this.model('user').where({
                    user_id
                }).find();

                logger.info(`根据user_id查询用户信息数据库返回：${JSON.stringify(data)}`)

                if (Util.isEmptyObject(data)) {
                    this.body = Response.success();
                    return;
                }


                const TokenSerivce = this.service('token');

                const token = await TokenSerivce.create({userInfo: data});

                logger.info(`当前登录用户token:${token}`)

                this.body = Response.success({
                    userInfo: data,
                    token
                });
            }

        } catch (e) {
            logger.info(`根据openid获取对应的c端用户信息异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 用户注册，同时将userId和openid绑定
     * @returns {Promise<void>}
     */
    async registerAndBindAction() {
        try {

            let openid = this.post('openid'),
                phone = this.post('phone'),
                identification_no = this.post('identification_no'),
                gender = this.post('gender'),
                email = this.post('email'),
                name = this.post('name'),
                birthday = this.post('birthday');

            logger.info(`用户注册，同时将userId和openid绑定参数 ${JSON.stringify(this.post())}`);

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

            //手机号已存在时不允许注册
            //已存在的手机号不允许注册

            let existUser=await userService.getByPhone(phone);

            if(!Util.isEmptyObject(existUser)){
                this.body = Response.businessException(`该手机号对应用户已存在，请修改！`)
                return false;
            }


            let op_date = DateUtil.getNowStr()

            let user_id=Util.uuid();

            await this.model('user').add({
                user_id,
                openid,
                phone,
                identification_no,
                gender,
                email,
                birthday: DateUtil.format(birthday, 'date'),
                name,
                op_date,
                role: Role.client
            })

            let userInfo = await this.model('user').where({
                user_id
            }).find()

            logger.info(`用户注册数据库返回：user_id:${user_id}`)

            await this.model('weixin_user').add({
                weixin_user_id: Util.uuid(),
                openid,
                user_id,
                op_date
            })

            const TokenSerivce = this.service('token');

            const token = await TokenSerivce.create({userInfo: userInfo});

            this.body = Response.success({
                userInfo: userInfo,
                token
            });

        } catch (e) {
            logger.info(`用户注册，同时将userId和openid绑定异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * PC端已注册的咨询师在微信端登录，和微信号建立绑定关系
     * @returns {Promise<void>}
     */
    async bindAction() {
        try {

            let openid = this.post('openid'),
                phone = this.post('phone'),
                password = this.post('password')

            logger.info(`PC端已注册的咨询师在微信端登录，和微信号建立绑定关系参数 ${JSON.stringify(this.post())}`);

            if (!openid) {
                this.body = Response.businessException(`openid不能为空！`)
                return false;
            }

            if (!phone) {
                this.body = Response.businessException(`手机号不能为空！`)
                return false;
            }


            if (!password) {
                this.body = Response.businessException(`密码不能为空！`)
                return false;
            }

            //根据手机号获取用户。如果用户已存在，则绑定和openid的关联
            let joinStr = 'appoint_station_therapist_relation on appoint_user.user_id=appoint_station_therapist_relation.therapist_id'

            let userInfo = await this.model('user').where({
                phone,
                password:md5(password)
            }).join(joinStr).find();

            let op_date = DateUtil.getNowStr()

            if (Util.isEmptyObject(userInfo)) {

                this.body = Response.businessException(`用户不存在或密码不正确！`);

            }else{
                await this.model('weixin_user').add({
                    weixin_user_id: Util.uuid(),
                    openid,
                    user_id: userInfo.user_id,
                    op_date
                })

                const TokenSerivce = this.service('token');

                const token = await TokenSerivce.create({userInfo: userInfo});

                this.body = Response.success({
                    userInfo: userInfo,
                    token
                });
            }



        } catch (e) {
            logger.info(`PC端已注册的咨询师在微信端登录，和微信号建立绑定关系异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * c端用户微信和用户id解绑
     * @returns {Promise<boolean>}
     */
    async unbindAction() {
        try {

            let user_id=this.ctx.state.userInfo.user_id

            logger.info(`c端用户微信和用户id解绑参数 ${JSON.stringify(this.post())}`);

            await this.model('weixin_user').delete({
                user_id
            })

            this.body = Response.success();

        } catch (e) {
            logger.info(`c端用户微信和用户id解绑异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * pc端咨询注册
     * @returns {Promise<boolean>}
     */
    async registerAction() {
        try {

            let phone = this.post('phone'),
                identification_no = this.post('identification_no'),
                gender = this.post('gender'),
                email = this.post('email'),
                password = this.post('password'),
                name = this.post('name'),
                birthday = this.post('birthday');

            logger.info(`pc端咨询注册参数 ${JSON.stringify(this.post())}`);

            if (!phone) {
                this.body = Response.businessException(`手机号不能为空！`)
                return false;
            }

            if (!identification_no) {
                this.body = Response.businessException(`身份证号不能为空！`)
                return false;
            }

            if (!password) {
                this.body = Response.businessException(`密码不能为空！`)
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

            //根据手机号获取用户。如果用户已存在，则提醒用户
            let userInfo = await this.model('user').where({
                phone
            }).find();

            let op_date = DateUtil.getNowStr()

            if (Util.isEmptyObject(userInfo)) {

                let user_id = Util.uuid()

                await this.model('user').add({
                    user_id,
                    phone,
                    identification_no,
                    gender,
                    email,
                    birthday: DateUtil.format(birthday, 'date'),
                    name,
                    op_date,
                    password: md5(password),
                    role: Role.therapist
                })

                //如果是咨询师的话，初始化可用时段设置
                await therapistService.initPeriodSet(user_id)


                this.body = Response.success()

            } else {
                this.body = Response.businessException(`用户已存在！`)
            }

        } catch (e) {
            logger.info(`pc端咨询注册异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


};
