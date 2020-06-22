const logger =think.logger
const entityName = '工作室和咨询师关联'
const tableName = 'station_therapist_relation'

module.exports =  {


    /**
     * 根据条件获取一条工作室和咨询师关联
     * @param whereObj
     * @returns {Promise<void>}
     */
    async getOne(whereObj){

        try{

            let data = await think.model(tableName).where(whereObj).find().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据条件获取一条工作室和咨询师关联数据库返回：${JSON.stringify(data)}`)

            return data.station_id;

        }catch (e) {
            let msg=`根据条件获取一条工作室和咨询师关联异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },


};
