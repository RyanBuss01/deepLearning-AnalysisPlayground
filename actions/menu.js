const prompt = require('prompt-sync')();
const barMngr = require('../methods/barMngr');
const tickerMngr = require('../methods/tickerMngr');
const l = require('./loop')
const prob = require('../methods/probability')
let masterList = require('../public/master.json')
const blacklist = require("../constants/blacklist")
const cosineSim = require("../methods/algos/cosineSim.js")


menu = {
    alerts: function(tickerList) {
        console.log("Select Alert... \n\n1. Cosine similarity \n") // collects tickers over a set dollar amount
        let act = prompt("Select Menu: ")
        console.clear()


        switch (act) {
            case "1" : cosineSim(tickerList); break;
            default: {console.log("Not a valid action"); l.loop()}
        }
    },

    barMngr: async function (tickerList) {
        console.log("Bar Manager... \n\n1. Refresh bars \n2. Loop Menus (1 day) \n3. Ticker Manager \n") // collects tickers over a set dollar amount

        const act = prompt("Select action: ");
        console.clear()

        let stocks

        if(masterList.length>0) stocks=masterList.map(e=>e.ticker).filter(t=> !blacklist.includes(t.ticker))
        // let index=masterList.map(e=>e.index)

        switch (act) {
            
            case "1" : {
                await barMngr.getMultiBarsRefresh(stocks, tickerList)
                }; break
            case "2" : {
                await barMngr.getMultiBars(stocks);
                }; break;
            case "3" : tickerMngr.createMasterList(); break;
            default: {console.log("Not a valid action"); l.loop()}
        }
    },
    
    probability: function (tickerList) {
        console.log("\nSelect....\n\n1. Find best probabilities\n\n")
        let act = prompt("Select Menu (or enter ticker): ")
        console.clear()
  
        if(act!='' && tools.isString(act)) { prob.probability(act.toUpperCase()) }
        else switch (act) {
            case "1": prob.probability(tickerList); break;
            default: {console.log("Not a valid action"); this.menuLoop(tickerList)}
        }
    },

   
}

module.exports=menu