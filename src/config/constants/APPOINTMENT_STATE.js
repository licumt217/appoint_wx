/**
 * 预约状态
 * 最终转态包括：已拒绝、已取消、已过期、已完结
 * @type {{DONE: number, COMMIT: number, CANCELED: number, EXPIRED: number, AUDITED: number, REJECTED: number}}
 */
let APPOINTMENT_STATE = {
    COMMIT: 0,        //已提交
    AUDITED: 1,       //已审核
    REJECTED: 2,      //已拒绝
    CANCELED: 3,      //已取消
    EXPIRED: 4,       //已过期
    DONE: 5,          //已完结


};



module.exports = APPOINTMENT_STATE
