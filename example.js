const alphaEssApi = require('./alphaEssApi.js');
const username = require('./config').username;
const password = require('./config').password;




async function start() {
    console.clear();
    const api = await new alphaEssApi(username, password);

    const loginResult = await api.login();
    if (loginResult.info != "success") {
        console.log("login failed")
        return;
    } else {
        console.log("login : ", loginResult)
    }

    console.log("sn : ", await api.getSn());


    console.log("realtime data : ", await api.getPower());


    console.log("energy today : ", await api.getEnergyToday());

    console.log("energy yesterday : ", await api.getEnergyYesterday());

    console.log("energy custom day : ", await api.getEnergyCustomDay("2021-08-21"));

    console.log("energy this month : ", await api.getEnergyThisMonth());

    console.log("energy period : ", await api.getEnergyByPeriod("2021-08-01", "2021-08-29"));

    console.log("energy total : ", await api.getEnergyTotal());



    console.log("income today : ", await api.getIncomeToday());

    console.log("income yesterday : ", await api.getIncomeYesterday());

    console.log("income custom date : ", await api.getIncomeCustomDay("2021-08-21"));

    console.log("income this month : ", await api.getIncomeThisMonth());

    console.log("income custom month : ", await api.getIncomeCustomMonth("2021-04-01"));

    console.log("income total : ", await api.getIncomeTotal());

}

start();