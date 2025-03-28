// 日志函数
function log(message) {
    console.log(`[日志] ${message}\n`);
}
// 通知函数
function notify(title, message) {
    $notification.post("[菠萝包轻小说签到]", title, message);
}

// function loadCredentials() {
//     const sfacgData = $persistentStore.read("sfacg_data");
//     log($persistentStore.read("sfacg_data"));
//     const credentials = {
//         accept: sfacgData.accept,
//         contentType: sfacgData.contentType,
//         cookie: sfacgData.cookie,
//         sfsecurity: sfacgData.sfSecurity,
//         authorization: sfacgData.authorization,
//         userAgent: sfacgData.userAgent
//     };
//     log(credentials);

//     return credentials;
// }

function getSignDate(){
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// 准备请求函数
function prepareRequest(){
    // 读取必要信息
    const sfacgData = JSON.parse($persistentStore.read("sfacg_data"));

    const body = {
        signDate: getSignDate()
    };

    const headers = {
        "accept": `${sfacgData.accept}`,
        "content-type": "application/json",
        "cookie": `${sfacgData.cookie}`,
        "sfsecurity": `${sfacgData.sfSecurity}`,
        "authorization": `${sfacgData.authorization}`,
        "user-agent": `${sfacgData.userAgent}`
    };

    return {
        url: "https://api.sfacg.com/user/newSignInfo",
        headers: headers,
        body: JSON.stringify(body),
        method: "PUT"
    };
}

// 处理结果函数
function handleSignResult(error, response, data) {
    if (error) {
        log(`签到请求失败: ${error}`);
        notify("签到请求失败", error);
        $done({});
        return;
    }

    log(`error:${error}`);
    log(`response:${JSON.stringify(response)}`);
    log(`data:${data}`);

    log(`签到响应: ${data}`);

    try{
        const result = JSON.parse(data);

        // 状态判断
        if (result.status && result.status.httpCode === 200) {
            const rewards = result.data;
            let rewardText = "";

            if (rewards && rewards.length > 0) {
                rewards.forEach(reward => {
                    rewardText += `${reward.num}${reward.name}\n`
                });

                notify("签到成功", `获得奖励:${rewardText}`);
            }// else{
            //     notify("签到成功", "无奖励");
            // }
        }else {
            const errorMsg = result.status ? result.status.msg : "未知错误";
            notify("签到失败", errorMsg);
            log(`签到失败 ${errorMsg}`);
        }
    
    }catch (e) {
        log(`解析响应出错: ${e}`);
        notify("处理签到响应出错", e.message);
    }

    $done({});
}

// 主要请求函数
function main(){
    log("开始执行签到脚本");

    // 信息判断
    if(!$persistentStore.read("sfacg_data")) {
        notify("签到失败", "缺少必要的信息，请先获取Cookie");
        log(`缺少必要信息 sfacg_data:${$persistentStore.read("sfacg_data")} ,请先获取Cookie`)
        $done({});
        return;
    }

    const request = prepareRequest();
    $httpClient.put(request, handleSignResult);
}

// Run
main();
