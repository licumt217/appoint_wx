const logger =think.logger
const tableName = 'station_casemanager_relation'

module.exports =  {




    /**
     *根据案例管理者ID查询对应的工作室ID
     * @returns {Promise<{isSuccess, errorMsg}>}
     */
    async getStationIdByCasemanagerId(casemanager_id){

        try{

            let data = await think.model(tableName).where({
                casemanager_id
            }).find().catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据案例管理者ID查询对应的工作室ID数据库返回：${JSON.stringify(data)}`)

            return data.station_id;

        }catch (e) {
            let msg=`根据案例管理者ID查询对应的工作室ID异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },



};
