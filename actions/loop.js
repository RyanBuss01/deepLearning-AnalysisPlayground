let masterBars = require('../public/bars.json');
const masterBars2 = require('../public/bars2.json');
const prompt = require('prompt-sync')();
const tools = require('../methods/tools/tools')
const ta = require('../methods/ta')
const menu = require('../actions/menu')


masterBars.push(...masterBars2)
// const l = require("../playground/actions/loop.js");


    var loop = async function (tickerList=masterBars) {

        console.log("\n-------------LOOP-------------\n")
        console.log(`Bars length: ${tickerList.length ?? 0}, Last update: ${tickerList.length>1? tickerList[0].bars.slice(-1)[0].Timestamp : ''}`)
        console.log("\n\nSelect menu or enter ticker symbol....\n\n0. End program \n1. Alert Menu \n2. Bar Manager \n3. Probability Tool \n4. playground\n\n")
        let act = prompt("Select Menu: ")
        console.clear()
    
        if(act!='' && tools.isString(act)) { ta.singleTicker(tickerList, act); }
        else switch (act) {
            case "0":  break;
            case "1": menu.alerts(tickerList); break;
            case "2": menu.barMngr(tickerList); break;
            case "3" : menu.probability(tickerList); break;
            // case "4" : l.loop(tickerList); break;
            // case "99" : tester.test(tickerList); break;
            default: {console.log("Not a valid action"); loop(tickerList)}
        }
    }

exports.loop=loop;