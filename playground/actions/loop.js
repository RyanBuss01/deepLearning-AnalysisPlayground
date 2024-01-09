let masterBars = require('../../public/bars.json');
const masterBars2 = require('../../public/bars2.json');
const prompt = require('prompt-sync')();
const menu = require('../actions/menu')
// const mainMenu = require('../../actions/menu')


masterBars.push(...masterBars2)


    var loop = async function (tickerList=masterBars) {

        console.log("\n-------------LOOP-------------\n")
        console.log(`Bars length: ${tickerList.length ?? 0}, Last update: ${tickerList.length>1? tickerList[0].bars.slice(-1)[0].Timestamp : ''}`)
        console.log("\n\nSelect menu or enter ticker symbol....\n\n0. End program \n1. Trends \n2. Heikin Ashi \n3. algo \n4. Long Short algos \n5. bar manager\n\n9. technicals\n\n")
        let act = prompt("Select Menu: ")
        console.clear()
    
        switch (act) {
            case "0":  break;
            case "1": menu.trends(tickerList); break;
            case "2" : menu.ha(tickerList); break;
            case "3" : menu.algo(tickerList); break;
            case "4" : menu.lsAlgos(tickerList); break;
            // case "5": mainMenu.barMngr(tickerList); break;

            case "9" : menu.technicals(tickerList); break;
            // case "99" : tester.test(tickerList); break;
            default: {console.log("Not a valid action"); loop(tickerList)}
        }
    }

exports.loop=loop;