/**
 * 用户类型
 */
let Role = {
    admin: 0,      //超管
    divisionManager: 1,       //分部管理员
    caseManager: 2,       //案例管理员
    therapist: 3,    //咨询师
    client: 4,    //c端用户
};

Role.getKeyByValue=(value)=>{
    let map={
        0:'admin',
        1:'divisionManager',
        2:'caseManager',
        3:'therapist',
        4:'client',
    }
    return map[value]
}



module.exports = Role
