/**
 * 用户类型
 */
let ROLE = {
    admin: 0,      //超管
    divisionManager: 1,       //分部管理员
    caseManager: 2,       //案例管理员
    therapist: 3,    //咨询师
    client: 4,    //c端用户
    receptionist: 5,    //接待员
};

ROLE.getKeyByValue=(value)=>{
    let map={
        0:'admin',
        1:'divisionManager',
        2:'caseManager',
        3:'therapist',
        4:'client',
        5:'receptionist',
    }
    return map[value]
}



module.exports = ROLE
