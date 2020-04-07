const Response = require('../config/response')
const Util = require('../util/Util')
const DateUtil = require('../util/DateUtil')
const WechatUtil = require('../util/WechatUtil')
const ORDER_STATE = require('../config/ORDER_STATE')
const PERIOD_STATE = require('../config/PERIOD_STATE')
const logger =think.logger
const entityName = '大订单'
const tableName = 'big_order'

module.exports =  {


    /**
     *新增大订单
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async addWithRelations(openid,therapist_id,appoint_date,period,weeks,amount,user_id){


        let big_order_id=Util.uuid();

        let create_date = DateUtil.getNowStr()

        let op_date = create_date

        let state = ORDER_STATE.COMMIT

        period=period.join(',')

        let orders=[],therapistPeriods=[];

        let big_order={
            big_order_id,
            openid,
            therapist_id,
            create_date,
            appoint_date,
            op_date,
            period,
            weeks,
            user_id
        }




        for(let i=0;i<weeks;i++){
            let order_id=Util.uuid()
            let tempAppointDate=DateUtil.getDayOfNextWeeks(appoint_date,i);
            orders.push({
                big_order_id,
                order_id,
                openid,
                therapist_id,
                amount,
                state,
                create_date,
                op_date,
                user_id,
                appoint_date:tempAppointDate
            })

            therapistPeriods.push({
                therapist_id,
                appoint_date:tempAppointDate,
                period,
                order_id,
                op_date,
                therapist_period_id:Util.uuid(),
            })

        }


        try{


            //一个事务将大订单、小订单、咨询师预约时间段一起存库

            let model=think.model(tableName);
            let big_order_return = await model.transaction(async () => {

                let data = await model.add(big_order).catch(e=>{
                    throw new Error(e)
                })

                // 通过 db 方法让 user_cate 模型复用当前模型的数据库连接
                const orderCate = think.model('order').db(model.db());

                let order_data = await orderCate.addMany(orders).catch(e=>{
                    throw new Error(e)
                });

                const periodCate = think.model('therapist_period').db(model.db());

                let period_data = await periodCate.addMany(therapistPeriods).catch(e=>{
                    throw new Error(e)
                });

                logger.info(`新增${entityName}数据库返回：${JSON.stringify(data)}`)
                logger.info(`新增关联小订单数据库返回：${JSON.stringify(order_data)}`)
                logger.info(`新增关联咨询师时段数据库返回：${JSON.stringify(period_data)}`)

                return data;
            })


            logger.info(`新增${entityName}数据库返回：${JSON.stringify(big_order_return)}`)

            return big_order_return;

        }catch (e) {
            let msg=`新增${entityName}接口异常 msg:${e}`
            let returnMsg=`新增订单接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }



    },

    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async add(obj){

        try{

            let op_date = DateUtil.getNowStr()

            obj.op_date=op_date

            let data = await think.model(tableName).add(obj).catch(e=>{
                throw new Error(e)
            });;

            logger.info(`新增${entityName}数据库返回：${JSON.stringify(data)}`)

            return data;

        }catch (e) {
            let msg=`新增${entityName}接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },

    /**
     *根据ID获取大订单详情
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getById(big_order_id){

        try{

            let data = await think.model(tableName).where({
                big_order_id
            }).join([
                ` appoint_user as therapist on therapist.user_id=appoint_big_order.therapist_id`,
                ` appoint_user as userInfo on userInfo.user_id=appoint_big_order.user_id`,
                ` appoint_therapist_fee_set as fee_set on fee_set.therapist_id=appoint_big_order.therapist_id`,
            ]).field(
                `appoint_big_order.*,
                    therapist.name as therapist_name,
                    fee_set.fee_type,
                    userInfo.name as user_name `,
            ).find().catch(e=>{
                throw new Error(e)
            })






            logger.info(`根据ID获取大订单详情数据库返回：${JSON.stringify(data)}`)

            return data;

        }catch (e) {
            let msg=`根据ID获取大订单详情接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },

    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getOne(whereObj){

        try{

            let data = await think.model(tableName).where(whereObj).find().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据条件查询单个${entityName}数据库返回：${JSON.stringify(data)}`)

            return data;

        }catch (e) {
            let msg=`根据条件查询单个${entityName}接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },

    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getList(whereObj){

        try{

            let data = await think.model(tableName).where(whereObj).select().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据条件查询${entityName}列表：${JSON.stringify(data)}`)

            return data;

        }catch (e) {
            let msg=`根据条件查询${entityName}列表接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },

    /**
     *
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getOrderListByTherapistId(therapist_id,page,pageSize){

        try{

            let ORDER=think.model(tableName)
            ORDER._pk='order_id'
            let data = await ORDER.where({
                therapist_id
            }).page(page, pageSize).countSelect().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据条件查询${entityName}列表：${JSON.stringify(data)}`)

            return data;

        }catch (e) {
            let msg=`根据条件查询${entityName}列表接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },

    async accept(big_order_id) {


        let op_date =  DateUtil.getNowStr()

        try{


            //一个事务将大订单、小订单、咨询师预约时间段一起存库

            let model=think.model(tableName);
            let big_order_return = await model.transaction(async () => {

                let data = await model.where({
                    big_order_id
                }).update({
                    state:ORDER_STATE.AUDITED,
                    op_date
                }).catch(e=>{
                    throw new Error(e)
                })

                // 通过 db 方法让 user_cate 模型复用当前模型的数据库连接
                const orderCate = think.model('order').db(model.db());

                let order_data = await orderCate.where({
                    big_order_id
                }).update({
                    state:ORDER_STATE.AUDITED,
                    op_date
                }).catch(e=>{
                    throw new Error(e)
                });

                const periodCate = think.model('therapist_period').db(model.db());

                let period_data = await periodCate.where({
                    big_order_id
                }).update({
                    state:PERIOD_STATE.YES,
                    op_date
                }).catch(e=>{
                    throw new Error(e)
                });

                logger.info(`同意${entityName}数据库返回：${JSON.stringify(data)}`)
                logger.info(`同意关联小订单数据库返回：${JSON.stringify(order_data)}`)
                logger.info(`同意关联咨询师时段数据库返回：${JSON.stringify(period_data)}`)

                return data;
            })


            logger.info(`同意${entityName}数据库返回：${JSON.stringify(big_order_return)}`)

            return big_order_return;

        }catch (e) {
            let msg=`同意${entityName}接口异常 msg:${e}`
            let returnMsg=`同意订单接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

    async deny(big_order_id) {


        let op_date =  DateUtil.getNowStr()

        try{


            //一个事务将大订单、小订单、咨询师预约时间段一起存库

            let model=think.model(tableName);
            let big_order_return = await model.transaction(async () => {

                let data = await model.where({
                    big_order_id
                }).update({
                    state:ORDER_STATE.REJECTED,
                    op_date
                }).catch(e=>{
                    throw new Error(e)
                })

                // 通过 db 方法让 user_cate 模型复用当前模型的数据库连接
                const orderCate = think.model('order').db(model.db());

                let order_data = await orderCate.where({
                    big_order_id
                }).update({
                    state:ORDER_STATE.REJECTED,
                    op_date
                }).catch(e=>{
                    throw new Error(e)
                });

                const periodCate = think.model('therapist_period').db(model.db());

                let period_data = await periodCate.where({
                    big_order_id
                }).update({
                    state:PERIOD_STATE.NO,
                    op_date
                }).catch(e=>{
                    throw new Error(e)
                });

                logger.info(`拒绝${entityName}数据库返回：${JSON.stringify(data)}`)
                logger.info(`拒绝关联小订单数据库返回：${JSON.stringify(order_data)}`)
                logger.info(`拒绝关联咨询师时段数据库返回：${JSON.stringify(period_data)}`)

                return data;
            })


            logger.info(`拒绝${entityName}数据库返回：${JSON.stringify(big_order_return)}`)

            return big_order_return;

        }catch (e) {
            let msg=`拒绝${entityName}接口异常 msg:${e}`
            let returnMsg=`拒绝订单接口异常`
            logger.info(msg);
            throw new Error(returnMsg)
        }


    },

    async update(whereObj,updateObj) {

        try {
            let op_date = DateUtil.getNowStr()

            updateObj.op_date=op_date

            let data = await think.model(tableName).where(whereObj).update(updateObj).catch(e=>{
                throw new Error(e)
            });

            logger.info(`更新${entityName}，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg=`更新${entityName}异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }

    },

    async refund(order_id, total_amount, refund_amount) {

        try {

            await WechatUtil.refund(order_id, total_amount, refund_amount).catch((e)=>{
                throw new Error(e)
            })

        } catch (e) {
            let msg=`退款接口异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }

    }

};
