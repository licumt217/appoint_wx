/**
 * 用户信息
 */
const systemException="网络繁忙请稍等";

let response ={
    isSuccess:'0',
    errorMsg:''
};

function reset() {
    response ={
        isSuccess:'0',
        errorMsg:''
    };
}

response.success=(data)=>{
    reset();
    if(data){
        response.data=data;
    }

    return response;
}

response.businessException=(errorMsg)=>{
    reset();
    response.isSuccess='1';
    if(errorMsg){
        response.errorMsg=errorMsg;
    }

    return response;
}
response.systemException=(errorMsg)=>{
    reset();
    response.isSuccess='2';
    response.errorMsg=systemException;

    return response;
}




module.exports = response
