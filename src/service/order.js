const Response = require('../config/response')
const Util = require('../util/Util')

const logger =think.logger

module.exports =  {


    /**
     * 根据订单id查询订单
     * @param orderId
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getOrderById(trade_no){

        if(!trade_no){
            return Response.businessException("业务订单号不能为空！")
        }

        try{

            let data = await think.model('order').where({
                trade_no
            }).find();

            logger.info(`根据订单id查询订单数据库返回：${JSON.stringify(data)}`)

            if(Util.isEmptyObject(data)){
                return Response.businessException("未找到对应订单！");
            }else{
                return Response.success(data)
            }

        }catch (e) {
            logger.info(`根据订单id查询订单接口异常 msg:${e}`);
            return Response.businessException(e);
        }



    }

};
