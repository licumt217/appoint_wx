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

    /**
     * 根据id获取工作室和咨询师关系
     * @param station_therapist_relation_id
     * @returns {Promise<*>}
     */
    async getById(station_therapist_relation_id){

        try{

            let data = await think.model(tableName).where({
                station_therapist_relation_id
            }).find().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据id获取工作室和咨询师关系数据库返回：${JSON.stringify(data)}`)

            return data;

        }catch (e) {
            let msg=`根据id获取工作室和咨询师关系异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },

    /**
     * 获取给定工作室ID对应的咨询师列表
     * @param division_id
     * @returns {Promise<any>}
     */
    async getTherapistIdArrayByStationIds(station_ids) {


        try {

            let data = await think.model(tableName).where({
                station_id:['in',station_ids]
            }).getField('therapist_id').catch(e => {
                throw new Error(e)
            });

            logger.info(`获取给定工作室ID对应的咨询师列表，数据库返回：${data}`)

            return data
        } catch (e) {
            let msg = `获取给定工作室ID对应的咨询师列表异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }


    },


};
