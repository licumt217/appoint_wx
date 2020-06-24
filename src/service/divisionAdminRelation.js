const logger =think.logger
const tableName = 'division_admin_relation'

module.exports =  {


    /**
     * 根据分部管理员ID获取分部ID
     * @param admin_id
     * @returns {Promise<*>}
     */
    async getDivisionIdByAdminId(admin_id){

        try{

            let data = await think.model(tableName).where({
                admin_id
            }).getField('division_id').catch(e=>{
                throw new Error(e)
            });

            logger.info(`根据分部管理员ID获取分部ID数据库返回：${JSON.stringify(data)}`)

            return data[0];

        }catch (e) {
            let msg=`根据分部管理员ID获取分部ID异常 msg:${e}`
            logger.info(msg);
            throw new Error(msg)
        }



    },




};
