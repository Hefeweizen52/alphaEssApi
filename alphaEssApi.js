const fetch = require('node-fetch');

class alphaEssApi {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.sn = "";
        this.accessTokenExpiresIn = "";
        this.accessTokenExpiresInMillis = 0;
        this.accessToken = "";
    }

    /*
    returns a access token *needed* for the upcoming API requests, 
    as well as infomation about how long the token is valid
    @param --none--
    */
    async login() {
        var info = ""
        var now = Date.now();
        if (now < this.accessTokenExpiresInMillis) return "already logged in";

        try {
            let response = await fetch("https://www.alphaess.com/api/Account/Login", {
                method: "POST",
                headers: {
                    "content-Type": "application/json;charset=UTF-8"
                },
                body: JSON.stringify({
                    "username": this.username,
                    "password": this.password
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info == "Incorrect User Name or Password!") {
                info = "wrong user data"
                return ({ "info": info, "accessToken": this.accessToken });
            } else {
                this.accessToken = data.data.AccessToken

                var expiresIn = data.data.ExpiresIn;
                var sum = now + expiresIn * 1000;
                var t = new Date(sum);

                this.accessTokenExpiresInMillis = sum;
                this.accessTokenExpiresIn = t.toLocaleString();

                info = "success"
            }

        } catch (error) {
            console.log(error)
        }
        return ({ "info": info, "accessToken": this.accessToken });
    }

    /*
    returns the serial number of your system which is necessary for
    the upcoming API requests as well
    @param --none--
    */
    async getSn() {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        try {
            let response = await fetch("https://www.alphaess.com/api/Account/GetCustomMenuESSlist", {
                method: "GET",
                headers: {
                    "authorization": "Bearer " + this.accessToken,
                },
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data == undefined || data.info != "Success") {
                console.log("error");
                return "error";
            } else {
                this.sn = data.data[0].sys_sn;
            }

        } catch (error) {
            console.log(error);
        }
        return this.sn
    }

    /*
    returns the realtime data of your system
    @param --none--
    */
    async getPower() {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();
        try {
            let response = await fetch(`https://www.alphaess.com/api/ESS/GetSecondDataBySn?sys_sn=${this.sn}&noLoading=true`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`
                }
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {
                return ({ "info": "success", "data": data.data });
            }

        } catch (error) {
            console.log(error)
        }

    }

    /*
    returns the energy data of the current day
    @param --none--
    */
    async getEnergyToday() {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();
        var t = new Date().toISOString().split('T')[0]
        try {
            let response = await fetch('https://www.alphaess.com/api/Power/SticsByPeriod', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    SN: this.sn,
                    beginDay: t,
                    endDay: t,
                    tday: t,
                    isOEM: 0,
                    noLoading: true
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {
                return ({ "info": "success", "data": data.data });
            }

        } catch (error) {
            console.log(error)
        }
    }

    /*
    returns the energy data of the last day
    @param --none--
    */
    async getEnergyYesterday() {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();

        var todayStr = new Date().toISOString().split('T')[0];
        var yesterdayMillis = Date.now() - 86400000;
        var yesterdayStr = new Date(yesterdayMillis).toISOString().split('T')[0]

        try {
            let response = await fetch('https://www.alphaess.com/api/Power/SticsByPeriod', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    SN: this.sn,
                    beginDay: yesterdayStr,
                    endDay: yesterdayStr,
                    tday: todayStr,
                    isOEM: 0,
                    noLoading: true
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {
                return ({ "info": "success", "data": data.data });
            }

        } catch (error) {
            console.log(error)
        }
    }

    /*
    returns the energy data of a apecific day
    @param customDateInput: a ISO-String representing the date. Format: YYYY-MM-DD
    */
    async getEnergyCustomDay(customDateInput) {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();

        var customDate = customDateInput.split('-')[2]
        var customDateArray = customDate - 1;

        try {

            let response = await fetch('https://www.alphaess.com/api/Statistic/SystemStatistic', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    sn: this.sn,
                    sDate: customDateInput,
                    statisticBy: "month",
                    isOEM: 0,
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {

                let obj = {
                    "Epv": data.data.Epvs[customDateArray],
                    "Eoutput": data.data.Eoutputs[customDateArray],
                    "Eload": data.data.Eloads[customDateArray],
                    "Einput": data.data.Einputs[customDateArray],
                    "ECharge": data.data.ECharge[customDateArray],
                    "EDischarge": data.data.EDischarge[customDateArray],
                    "EChargingPile": data.data.EChargingPile[customDateArray],
                    "StatisticIndex": data.data.StatisticIndex[customDateArray],
                    "hasChargingPile": data.data.hasChargingPile
                }
                return ({ "info": "success", "data": obj });
            }

        } catch (error) {
            console.log(error);
        }
    }

    /*
    returns the energy data of the current month
    @param --none--
    */
    async getEnergyThisMonth() {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();

        var thisMonth = new Date().toISOString().split('T')[0].split('-')[1]
        var thisYear = new Date().toISOString().split('T')[0].split('-')[0]
        var thisMonthArray = thisMonth - 1;
        var str = `${thisYear}-${thisMonth}-1`

        try {
            let response = await fetch('https://www.alphaess.com/api/Statistic/SystemStatistic', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    sn: this.sn,
                    sDate: str,
                    statisticBy: "year",
                    isOEM: 0,
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {

                let obj = {
                    "Epv": data.data.Epvs[thisMonthArray],
                    "Eoutput": data.data.Eoutputs[thisMonthArray],
                    "Eload": data.data.Eloads[thisMonthArray],
                    "Einput": data.data.Einputs[thisMonthArray],
                    "ECharge": data.data.ECharge[thisMonthArray],
                    "EDischarge": data.data.EDischarge[thisMonthArray],
                    "EChargingPile": data.data.EChargingPile[thisMonthArray],
                    "StatisticIndex": data.data.StatisticIndex[thisMonthArray],
                    "hasChargingPile": data.data.hasChargingPile
                }

                return ({ "info": "success", "data": obj });
            }

        } catch (error) {
            console.log(error)
        }
    }

    /*
    returns the energy data of a apecific period
    @param startDate: a ISO-String representing the start date. Format: YYYY-MM-DD
    @param endDate:   a ISO-String representing the end date. Format: YYYY-MM-DD
    */
    async getEnergyByPeriod(startDate, endDate) {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();
        var t = new Date().toISOString().split('T')[0]
        try {
            let response = await fetch('https://www.alphaess.com/api/Power/SticsByPeriod', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    SN: this.sn,
                    beginDay: startDate,
                    endDay: endDate,
                    tday: t,
                    isOEM: 0,
                    noLoading: true
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {
                return ({ "info": "success", "data": data.data });
            }

        } catch (error) {
            console.log(error)
        }
    }

    /*
    returns the total energy data
    @param --none--
    */
    async getEnergyTotal() {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();
        var t = new Date().toISOString().split('T')[0]
        try {
            let response = await fetch('https://www.alphaess.com/api/Statistic/SystemStatistic', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    sn: this.sn,
                    sDate: t,
                    statisticBy: "years",
                    isOEM: 0,
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {

                var vals = Object.values(data.data)
                let sums = [0, 0, 0, 0, 0, 0, 0, vals[7], vals[8]];
                var newObj = {}
                let i;

                for (i = 0; i < vals.length - 2; i++) {
                    for (var j = 0; j < vals[j].length; j++) {
                        sums[i] += parseFloat(vals[i][j])
                    }
                }

                for (var k = 0; k < sums.length; k++) {
                    newObj[Object.keys(data.data)[k]] = sums[k];
                }

                return ({ "info": "success", "data": newObj });
            }

        } catch (error) {
            console.log(error)
        }
    }



    /*
    returns the income data of the current day
    */
    async getIncomeToday() {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();

        var t = new Date().toISOString().split('T')[0]
        try {

            let response = await fetch('https://www.alphaess.com/api/Income/PayoffStatistic', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    sn: this.sn,
                    sDate: t,
                    tData: t,
                    statisticBy: "month",
                    isOEM: 0,
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {

                var today = (new Date().getDate()) - 1;

                var sumToday = data.data.SellIncome[today] + data.data.BuyIncome[today] +
                    data.data.ChargeIncome[today] + data.data.DemandCharge[today];

                var today = {
                    "sum": sumToday,
                    "details": {
                        "sellIncome": data.data.SellIncome[today],
                        "buyIncome": data.data.BuyIncome[today],
                        "chargeIncome": data.data.ChargeIncome[today],
                        "demandCharge": data.data.DemandCharge[today]
                    }
                }

                return ({ "info": "success", "data": today });
            }

        } catch (error) {
            console.log(error);
        }
    }

    /*
    returns the income data of the last day
    */
    async getIncomeYesterday() {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();

        var todayMillis = Date.now();
        var yesterdayMillis = todayMillis - 86400000;
        var tArray = new Date(todayMillis - 172800000).toISOString().split('T')[0].split('-')[2]
        var t = new Date(yesterdayMillis).toISOString().split('T')[0]

        try {

            let response = await fetch('https://www.alphaess.com/api/Income/PayoffStatistic', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    sn: this.sn,
                    sDate: t,
                    tData: t,
                    statisticBy: "month",
                    isOEM: 0,
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {

                var date = tArray

                var sum = data.data.SellIncome[date] + data.data.BuyIncome[date] +
                    data.data.ChargeIncome[date] + data.data.DemandCharge[date];

                var obj = {
                    "sum": sum,
                    "details": {
                        "sellIncome": data.data.SellIncome[date],
                        "buyIncome": data.data.BuyIncome[date],
                        "chargeIncome": data.data.ChargeIncome[date],
                        "demandCharge": data.data.DemandCharge[date]
                    }
                }

                return ({ "info": "success", "data": obj });
            }

        } catch (error) {
            console.log(error);
        }
    }

    /*
    returns the income data of a apecific day
    @param customDateInput: a ISO-String representing the date. Format: YYYY-MM-DD
    */
    async getIncomeCustomDay(customDateInput) {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();

        var customDate = customDateInput.split('-')[2]
        var customMonth = customDateInput.split('-')[1]
        var customYear = customDateInput.split('-')[0]

        var customMonthArray = customMonth - 1;
        var customDateArray = customDate - 1;


        try {

            let response = await fetch('https://www.alphaess.com/api/Income/PayoffStatistic', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    sn: this.sn,
                    sDate: customDateInput,
                    tData: customDateInput,
                    statisticBy: "month",
                    isOEM: 0,
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {

                var date = customDateArray;

                var sum = data.data.SellIncome[date] + data.data.BuyIncome[date] +
                    data.data.ChargeIncome[date] + data.data.DemandCharge[date];

                var obj = {
                    "sum": sum,
                    "details": {
                        "sellIncome": data.data.SellIncome[date],
                        "buyIncome": data.data.BuyIncome[date],
                        "chargeIncome": data.data.ChargeIncome[date],
                        "demandCharge": data.data.DemandCharge[date]
                    }
                }

                return ({ "info": "success", "data": obj });
            }

        } catch (error) {
            console.log(error);
        }
    }

    /*
    returns the income data of the current month
    */
    async getIncomeThisMonth() {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();

        let t = new Date().toISOString().split('T')[0]
        let thisMonth = t.split('-')[1];

        try {
            let response = await fetch('https://www.alphaess.com/api/Income/PayoffStatistic', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    sn: this.sn,
                    sDate: t,
                    tData: t,
                    statisticBy: "year",
                    isOEM: 0,
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {

                var thisMonthArray = thisMonth - 1;

                if (thisMonthArray < 0) {
                    thisMonthArray = 11;
                }

                //console.log(thisMonthArray);

                var sum = data.data.SellIncome[thisMonthArray] + data.data.BuyIncome[thisMonthArray] +
                    data.data.ChargeIncome[thisMonthArray] + data.data.DemandCharge[thisMonthArray];

                var obj = {
                    "sum": sum,
                    "details": {
                        "sellIncome": data.data.SellIncome[thisMonthArray],
                        "buyIncome": data.data.BuyIncome[thisMonthArray],
                        "chargeIncome": data.data.ChargeIncome[thisMonthArray],
                        "demandCharge": data.data.DemandCharge[thisMonthArray]
                    }
                }

                return ({ "info": "success", "data": obj });
            }


        } catch (error) {
            console.log(error);
        }
    }

    /*
    returns the income data of a apecific period
    @param startDate: a ISO-String representing the start date. Format: YYYY-MM-DD
    @param endDate:   a ISO-String representing the end date. Format: YYYY-MM-DD
    */
    async getIncomeCustomMonth(startDate) {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();
        var t = new Date().toISOString().split('T')[0];
        var customMonthArray = startDate.split('-')[1] - 1;
        try {
            let response = await fetch('https://www.alphaess.com/api/Income/PayoffStatistic', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    sn: this.sn,
                    sDate: startDate,
                    tDate: t,
                    isOEM: 0,
                    statisticBy: "year",
                    userId: ""
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {

                var sum = data.data.SellIncome[customMonthArray] + data.data.BuyIncome[customMonthArray] +
                    data.data.ChargeIncome[customMonthArray] + data.data.DemandCharge[customMonthArray];

                var obj = {
                    "sum": sum,
                    "details": {
                        "sellIncome": data.data.SellIncome[customMonthArray],
                        "buyIncome": data.data.BuyIncome[customMonthArray],
                        "chargeIncome": data.data.ChargeIncome[customMonthArray],
                        "demandCharge": data.data.DemandCharge[customMonthArray]
                    }
                }

                return ({ "info": "success", "data": obj });
            }

        } catch (error) {
            console.log(error)
        }
    }

    /*
    returns the total income data
    @param --none--
    */
    async getIncomeTotal() {
        if (Date.now() > this.accessTokenExpiresInMillis) await this.login();
        if (this.sn == '' || undefined) await this.getSn();
        var t = new Date().toISOString().split('T')[0];

        const d = new Date();
        var month = (d.getMonth() + 1);
        if (month < 10) { month = "0" + month; }
        const startDay = d.getFullYear() + '-' + month + '-' + '01';
        const dateString = d.getFullYear() + '-' + month + '-' + d.getDate();

        try {
            let response = await fetch('https://www.alphaess.com/api/Income/PayoffStatistic', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "content-type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    sn: this.sn,
                    sDate: startDay,
                    tDate: dateString,
                    isOEM: 0,
                    statisticBy: "years",
                    userId: ""
                }),
                "rejectUnauthorized": false
            })

            let data = await response.json();

            if (data.info != "Success") {
                return ({ "info": "error", "data": '' });
            } else {

                var vals = Object.values(data.data)
                let sums = [0, 0, 0, 0, 0, vals[5]];
                var newObj = {}
                let i;

                for (i = 0; i < vals.length - 1; i++) {
                    for (var j = 0; j < vals[1].length; j++) {
                        sums[i] += parseFloat(vals[i][j])
                    }
                }

                sums[0] = data.data.InputCost;

                for (var k = 0; k < sums.length; k++) {
                    newObj[Object.keys(data.data)[k]] = sums[k];
                }


                var sum = newObj.SellIncome + newObj.BuyIncome +
                    newObj.ChargeIncome + newObj.DemandCharge;

                var obj = {
                    "sum": sum,
                    "details": {
                        "sellIncome": newObj.SellIncome,
                        "buyIncome": newObj.BuyIncome,
                        "chargeIncome": newObj.ChargeIncome,
                        "demandCharge": newObj.DemandCharge
                    }
                }

                return ({ "info": "success", "data": obj });
            }

        } catch (error) {
            console.log(error)
        }
    }
}

module.exports = alphaEssApi