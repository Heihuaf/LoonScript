// Date:2025-03-29 13:38:10
// 日志函数
function log(message) {
    console.log(`[日志] ${message}\n`);
}
// 通知函数
function notify(title, message) {
    $notification.post("[菠萝包轻小说签到]", title, message);
}
// 读取必要信息
function loadCredentials() {
    const sfacgData = JSON.parse($persistentStore.read("sfacg_data"));
    log($persistentStore.read("sfacg_data"));
    const headers = {
        "accept": sfacgData.accept,
        // contentType: sfacgData.contentType,
        "cookie": sfacgData.cookie,
        "sfsecurity": sfacgData.sfSecurity,
        "authorization": sfacgData.authorization,
        //"user-agent": sfacgData.userAgent
    };

    return headers;
}
// 获取日期
function getSignDate(){
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const signDate = {
        signDate: `${year}-${month}-${day}`
    };

    return signDate;
}

// 准备签到请求函数
function prepareRequest(){
    const body = getSignDate();
    const headers = loadCredentials();

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

    // log(`error:${error}`);
    log(`response: ${JSON.stringify(response)}`);
    // log(`data:${data}`);

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
        }else if(result.status && result.status.httpCode === 400){
            const errorMsg = result.status ? result.status.msg : "未知错误";
            log(`今日已签到 Info:${errorMsg}`);
            
            log(`准备调用getCoupon函数查询代券`);
            getCoupon(function(result){
                log(`getCoupon回调函数执行，结果: ${result}`);
                notify("今日已经签到过了",`剩余有效代券:${result}`);

                $done({});
            });

            return;
        }else{
            const errorMsg = result.status ? result.status.msg : "未知错误";
            notify("签到失败", errorMsg);
            log(`签到失败 ${errorMsg}`);

            $done({});
        }
        
    
    }catch (e) {
        log(`解析响应出错: ${e}`);
        notify("处理签到响应出错", e.message);
    }

    $done({});
}

// 获取有效代券
function getCoupon(callback){
    try{
        log("开始获取代券数量");
        const sfacgData = JSON.parse($persistentStore.read("sfacg_data"));

        log("读取到数据: " + $persistentStore.read("sfacg_data").substring(0, 50) + "...");

        const headers = {
            "cookie": `${sfacgData.cookie}`,
            "authorization": `${sfacgData.authorization}`,
            "user-agent": `${sfacgData.userAgent}`
        };

        log("构建请求头");

        const request = {
            url: "https://api.sfacg.com/user/coupons",
            headers: headers,
            method: "GET"
        };

        log("开始发送HTTP请求");

        $httpClient.get(request, function(error, response, data){
            try{
                if (error) {
                    log(`获取火券数量请求失败 Error:${error}`);
                    callback("获取失败");
                    return;
                }

                log("收到HTTP请求");

                //添加响应数据的检查
                if(!data){
                    log("响应数据为空");
                    callback("空数据");
                    return;
                }

                log(`响应数据: ${data.substring(0,50)}...`);

                const result = JSON.parse(data).data;
                let coupons = 0;

                if(!result || !Array.isArray(result)){
                    log(`解析结果异常: ${JSON.stringify(result)}`);
                    callback("数据异常");
                    return;
                }

                result.forEach(coupon => {
                    coupons += (coupon.coupon - coupon.usedCoupon);
                });

                log(`剩余有效代券: ${coupons}`);
                callback(coupons);
                
            }catch(e){
                log(`代券回调处理出错: ${e.message}`);
                callback("处理出错");
            }
        });
    }catch(e){
        log(`代券函数执行出错 ${e.message}`);
        callback("函数错误");
    }
    
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

