/**
 * 用户信息
 */
const systemException = "网络繁忙请稍等";

let Response = {}, json = {};

function reset(isException) {
    json = {
        isSuccess: '0',
        errorMsg: '',
        data: null,
        isSuccessful: () => {
            return json.isSuccess === '0';
        }
    }

    if (isException) {
        delete json.data;
    }
}

Response.success = (data) => {
    reset();
    if (data) {
        json.data = data;
    }

    return json;
}

Response.businessException = (errorMsg) => {
    reset(true);
    json.isSuccess = '1';
    if (errorMsg) {
        json.errorMsg = errorMsg;
    }

    return json;
}
Response.systemException = (errorMsg) => {
    reset(true);
    json.isSuccess = '2';
    json.errorMsg = systemException;

    return json;
}


module.exports = Response
