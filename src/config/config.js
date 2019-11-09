// default config
module.exports = {
    port: 8350,
    workers: 1,
    caseManager: [
        "login",
    ],
    divisionManager: [
        "login"
    ],
    admin: [
        "login",
        "leveltype",
        "mannertype",
        "order",
        "push",
        "qualificationtype",
        "room",
        "roomoccupy",
        "schooltype",
        "user",
        "wechatApi",
    ],
    client: [
        "login"
    ]
};
