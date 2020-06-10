const Response = require('../../config/response')
const ROLE = require('../../config/constants/ROLE')

module.exports = class extends think.Controller {

    async __before() {

        const token = this.ctx.header['token'] || '';

        const TokenSerivce = think.service('token');

        const userInfo = await TokenSerivce.getLoginUser(token);

        this.ctx.state.token = token

        this.ctx.state.userInfo = userInfo;

        const currentController = this.ctx.controller.split('/')[1]

        console.log('===> currentController:'+currentController)

        if (currentController !== 'login' &&
            currentController !== 'wechatApi' &&
            currentController !== 'mannertype' &&
            currentController !== 'schooltype' &&
            currentController !== 'qualificationtype' &&
            currentController !== 'leveltype' &&
            currentController !== 'wechatExecute'
        ) {

            if (!userInfo) {

                return this.json(Response.businessException('用户未登录！'))

            } else {

                const menuGroups = this.config(ROLE.getKeyByValue(userInfo.role));

                if (!menuGroups.includes(currentController)) {
                    return this.json(Response.businessException('您没有权限！'))
                }

            }

        }
    }

};
