const Base = require('./base.js');

var request = require('request');

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

    async indexAction() {

        let token= await this.getToken();

        this.json({token: token})


    }

};
