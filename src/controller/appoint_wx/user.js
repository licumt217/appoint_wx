const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger =think.logger;


module.exports = class extends Base {



    /**
     * 根据openid获取对应的c端用户信息
     * @param code
     * @returns {Promise<void>}
     */
    async getUserByOpenidAction() {

        let openid =this.get('openid')

        logger.info(`根据openid获取对应的c端用户信息参数 openid:${openid}`);

        try{

            let data = await this.model('weixin_user').where({
                openid
            }).find();

            logger.info(`根据openid查询user_id数据库返回：${JSON.stringify(data)}`)

            if(Util.isEmptyObject(data)){
                this.body = Response.success();
            }else{
                const user_id=data.user_id;

                data = await this.model('user').where({
                    id:user_id
                }).find();

                logger.info(`根据user_id查询用户信息数据库返回：${JSON.stringify(data)}`)

                this.body = Response.success(data);
            }

        }catch (e) {
            logger.info(`根据openid获取对应的c端用户信息异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 用户注册，同时将userId和openid绑定
     * @returns {Promise<void>}
     */
    async registerAndBindAction() {

        let openid              =this.post('openid'),
            phone               =this.post('phone'),
            identification_no   =this.post('identification_no'),
            gender              =this.post('gender'),
            email               =this.post('email'),
            name                =this.post('name'),
            birthday            =this.post('birthday');

        logger.info(`用户注册，同时将userId和openid绑定参数 openid:${openid}, phone:${phone}, identification_no:${identification_no}, gender:${gender}, email:${email}, birthday:${birthday},name:${name},`);

        if(!openid){
            this.body=Response.businessException(`openid不能为空！`)
            return false;
        }

        if(!phone){
            this.body=Response.businessException(`手机号不能为空！`)
            return false;
        }

        if(!identification_no){
            this.body=Response.businessException(`身份证号不能为空！`)
            return false;
        }

        if(!gender){
            this.body=Response.businessException(`性别不能为空！`)
            return false;
        }

        if(!email){
            this.body=Response.businessException(`电子邮件不能为空！`)
            return false;
        }

        if(!birthday){
            this.body=Response.businessException(`出生日期不能为空！`)
            return false;
        }

        try{

            let op_date=DateUtil.getNowStr()

            let user_id = await this.model('user').add({
                openid,
                phone,
                identification_no,
                gender,
                email,
                birthday:DateUtil.format(birthday,'date'),
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

        }catch (e) {
            logger.info(`用户注册，同时将userId和openid绑定异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }



    async indexAction() {

        let token= await this.getToken();

        this.json({token: token})


    }

    getToken() {

        return new Promise(((resolve, reject) => {
            request.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx983e6f0f3345a6c6&secret=bccf7d2d46b446ec5749fc173f1e051b`, (error, response, body) => {
                console.log(3333333,error)

                if (error) {
                    resolve(error)
                } else {

                    resolve(JSON.parse(body).access_token)
                }
            })
        }))

    }

};
