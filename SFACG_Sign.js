function log(message) {
    console.log(`[菠萝包轻小说签到] ${message}`);
}

function notify(title, message) {
    $notification.post(`[菠萝包轻小说签到], ${title}, ${message}`)
}

function loadCredentials() {
    const credentials = {
        cookie: $persistentStore.read("sfacgCookie"),
        authorization: $persistentStore.read("sfacgAuth"),
        sfsecurity: $persistentStore.read("sfacgSecurity")
    };

    return credentials;
}

function getSignDate(){
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function prepareRequest(credentials){
    const body = {
        signDate: getSignDate()
    };
    log(`nody:${body}`)

    const headers = {
        "accept": "application/vnd.sfacg.api+json;version=1",
        "content-type": "application/json",
        "cookie": `${credentials.cookie}`,
        "sfsecurity": `${credentials.sfsecurity}`,
        "authorization": `${credentials.authorization}`,
        "User-Agent": "boluobao/5.0.24(iOS;18.2)/appStore",

    }

    return {
        url: "https://api.sfacg.com/user/newSignInfo",
        headers: headers,
        body: JSON.stringify(body),
        method: "PUT"
    };
}

function headleSignResult(error, response, data) {
    if (error) {
        log(`签到请求失败: ${error}`);
        notify("签到请求失败", error);
        $done({});
        return;
    }

    log(`签到响应: ${data}`)

    try{
        const result = JSON.parse(data);

        if (result.status && result.status.httpCode === 200) {
            const rewards = result.data;
            let rewardText = "";

            if (rewards && rewards.length > 0) {
                rewards.forEach(reward => {
                    rewardText += `${reward.name}: ${reward.num}\n`
                });

                notify("签到成功", `获得奖励:${rewardText}`);
            }else{
                notify("签到成功", "无奖励");
            }
        }else {
            const errorMsg = result.status ? result.status.msg : "未知错误";
            nontify("签到失败", errorMsg);
        }
    }catch (e) {
        log(`解析响应出错: ${e}`);
        notify("处理签到响应出错", e.message);
    }

    $done({});
}

function main(){
    log("开始执行签到脚本");

    const credentials = loadCredentials();
    if(!credentials) {
        nofity("签到失败", "缺少必要的Cookie，请先获取Cookie");
        $done({});
        return;
    }

    const request = prepareRequest(credentials);
    $httpClient.put(request, handleSignResult);
}

main();
