const Base = require('./base.js');

const request = require('request');
const Response = require('../../config/response')
const Util = require('../../util/Util')

module.exports = class extends Base {

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

    /**
     * 根据openid获取对应的c端用户信息
     * @param code
     * @returns {Promise<void>}
     */
    async getUserByOpenidAction() {

        let openid =this.get('openid')

        think.logger.info(`根据openid获取对应的c端用户信息参数 openid:${openid}`);

        try{

            let data = await this.model('weixin_user').where({
                openid
            }).find();

            think.logger.info(`根据openid查询user_id数据库返回：${JSON.stringify(data)}`)

            if(Util.isEmptyObject(data)){
                this.body = Response.success();
            }else{
                const user_id=data.user_id;

                data = await this.model('user').where({
                    id:user_id
                }).find();

                think.logger.info(`根据user_id查询用户信息数据库返回：${JSON.stringify(data)}`)

                this.body = Response.success(data);
            }

        }catch (e) {
            think.logger.info(`根据openid获取对应的c端用户信息异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 新增用户，手机号和openid必传，同时建立openid和user_id的关联关系
     * @returns {Promise<void>}
     */
    async addAction() {

        let phone =this.post('phone'),
            openid =this.post('openid')

        think.logger.info(`新增用户参数 phone:${phone}， openid:${openid}`);

        if(!phone){
            think.logger.error(1)
            this.body=Response.businessException(`手机号不能为空！`)
            return false;
        }

        if(!openid){
            this.body=Response.businessException(`openid不能为空！`)
            return false;
        }

        if(!Util.isValidPhone(phone)){
            this.body=Response.businessException(`手机号不合法！`)
            return false;
        }

        try{

            let user_id = await this.model('user').add({
                openid,
                phone,
            })

            think.logger.info(`新增用户数据库返回：${user_id}`)


            let data = await this.model('weixin_user').add({
                openid,
                user_id,
            })

            think.logger.info(`添加user_id和openid关系数据库返回：${data}`)

            this.body = Response.success();

        }catch (e) {
            think.logger.info(`新增用户异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    async indexAction() {

        let token= await this.getToken();

        this.json({token: token})


    }

};
