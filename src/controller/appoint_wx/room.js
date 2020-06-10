const Base = require('./base.js');

const Response = require('../../config/response')
const Util = require('../../util/Util')
const DateUtil = require('../../util/DateUtil')
const logger = think.logger;
const stationService = require('../../service/station')
const stationTherapistRelationService = require('../../service/stationTherapistRelation')
const stationCasemanagerRelationService = require('../../service/stationCasemanagerRelation')
const roomService = require('../../service/room')
const appointmentService = require('../../service/appointment')
const ROOM_STATE = require('../../config/constants/ROOM_STATE')
const entityName = '房间'
const tableName = 'room'


module.exports = class extends Base {


    /**
     * 新增
     * @returns {Promise<boolean>}
     */
    async addAction() {
        try {

            let name = this.post('name')
            let position = this.post('position')

            logger.info(`新增${entityName}参数 name:${name}, position:${position},`)

            if (!name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            if (!position) {
                this.body = Response.businessException(`${entityName}位置不能为空！`)
                return false;
            }

            //只查询对应工作室下边的
            let user_id = this.ctx.state.userInfo.user_id;
            let station_id = await stationService.getStationIdByCaseManagerId(user_id)

            let op_date = DateUtil.getNowStr()

            let addJson = {
                room_id: Util.uuid(),
                name,
                position,
                op_date,
                station_id,
                op_user_id: user_id
            }

            let data = await this.model(tableName).add(addJson);

            logger.info(`新增${entityName}，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`新增${entityName}异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 删除
     * @returns {Promise<boolean>}
     */
    async deleteAction() {
        try {

            let room_id = this.post('room_id')

            logger.info(`删除${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!room_id) {
                this.body = Response.businessException(`${entityName}ID不能为空！`)
                return false;
            }


            let data = await this.model(tableName).where({
                room_id,
            }).delete()

            logger.info(`删除${entityName}，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`删除${entityName}异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 修改
     * @returns {Promise<boolean>}
     */
    async updateAction() {
        try {

            let room_id = this.post('room_id')
            let name = this.post('name')
            let position = this.post('position')

            logger.info(`修改${entityName}参数 :${JSON.stringify(this.post())}`)

            if (!name) {
                this.body = Response.businessException(`${entityName}名称不能为空！`)
                return false;
            }

            if (!position) {
                this.body = Response.businessException(`${entityName}位置不能为空！`)
                return false;
            }

            let op_date = DateUtil.getNowStr();

            let data = await this.model(tableName).where({
                room_id
            }).update({
                name,
                position,
                op_date
            })

            logger.info(`修改${entityName}，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`修改${entityName}异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 房间启用停用
     * @returns {Promise<boolean>}
     */
    async onOffAction() {
        try {

            let room_id = this.post('room_id')
            let state = this.post('state')

            logger.info(`房间启用停用参数 :${JSON.stringify(this.post())}`)

            //停用的话，需要判断此方便有没有进行中的预约，有的话不能停用

            let appointments = await appointmentService.getListOfUsingByRoomId(room_id)

            if(appointments && appointments.length>0){
                this.body = Response.businessException(`当前房间有进行中的预约，不能停用！`)
                return false;
            }

            let op_date = DateUtil.getNowStr();

            let data = await this.model(tableName).where({
                room_id
            }).update({
                op_date,
                state: state === ROOM_STATE.ON ? ROOM_STATE.OFF : ROOM_STATE.ON,
            })

            logger.info(`房间启用停用，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`房间启用停用异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 只查询对应工作室下边的房间列表
     * @returns {Promise<boolean>}
     */
    async listAction() {
        try {

            let page = this.post('page') || Page.currentPage
            let pageSize = this.post('pageSize') || Page.pageSize
            logger.info(`只查询对应工作室下边的房间列表参数 :${JSON.stringify(this.post())}`)

            //只查询对应工作室下边的
            let user_id = this.ctx.state.userInfo.user_id;
            let station_id = await stationCasemanagerRelationService.getStationIdByCasemanagerId(user_id)

            console.log(user_id, station_id)

            let data = await this.model(tableName).where({
                station_id
            }).page(page, pageSize).countSelect();


            logger.info(`只查询对应工作室下边的房间列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`只查询对应工作室下边的房间列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 查询咨询师所在工作室的房间列表
     * @returns {Promise<boolean>}
     */
    async listByTherapistNoPageAction() {
        try {

            logger.info(`查询咨询师所在工作室的房间列表参数 :${JSON.stringify(this.post())}`)

            //只查询对应工作室下边的
            let user_id = this.ctx.state.userInfo.user_id;
            let therapist_id = this.post('therapist_id')

            if (!therapist_id) {
                this.body = Response.businessException(`咨询师ID不能为空！`)
                return false;
            }


            let station_id = await stationTherapistRelationService.getStationIdByTherapistId(therapist_id)

            console.log(user_id, station_id)

            let data = await roomService.getListByStationIdNoPage(station_id)


            logger.info(`查询咨询师所在工作室的房间列表，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`查询咨询师所在工作室的房间列表异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


    /**
     * 获取房间可用时段设置（工作室为单位）
     * @returns {Promise<void>}
     */
    async getUseablePeriodSetAction() {
        try {

            //只查询对应工作室下边的
            let user_id = this.ctx.state.userInfo.user_id;
            let station_id = await stationCasemanagerRelationService.getStationIdByCasemanagerId(user_id)

            let data = await this.model('room_period_set').where({
                station_id
            }).find();


            logger.info(`获取房间可用时段设置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取房间可用时段设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }

    /**
     * 更新房间可用时段设置（工作室为单位）
     * @returns {Promise<void>}
     */
    async updateUseablePeriodSetAction() {
        try {

            let period = this.post('period')

            logger.info(`更新房间可用时段设置参数 :${JSON.stringify(this.post())}`)

            if (!period) {
                this.body = Response.businessException('时段设置不能为空！')
                return;
            }

            let user_id = this.ctx.state.userInfo.user_id;
            let station_id = await stationService.getStationIdByCaseManagerId(user_id);

            let data = await this.model('room_period_set').where({
                station_id
            }).update({
                period
            })


            logger.info(`获取房间可用时段设置，数据库返回：${JSON.stringify(data)}`)

            this.body = Response.success(data);

        } catch (e) {
            logger.info(`获取房间可用时段设置异常 msg:${e}`);
            this.body = Response.businessException(e);
        }


    }


};
