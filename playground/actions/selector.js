const tools = require("../../methods/tools/tools");
const trend = require("../methods/trend");
const funcHandler = require('../methods/funcHandler')
const prompt = require('prompt-sync')();
const snp_500 = require('../../constants/snp_500')
let backtester = require('../../public/backtester.json')
const fs = require('fs');
const etfs = require("../../constants/ETFs");
const ls = require("../methods/ls");

var selector = {
    selector: function (tickerList, preSet, type) {
        console.log("1. Run \n2. Backtest \n3. run snp_500 \n4. backtest snp_500 and ETFs \n5. single backtest")
        let selector = prompt("Select: ")
        console.clear()

        if(selector == 1) funcHandler.runner(tickerList, {num: preSet, type:type})
        else if(selector==2) this.backTest(tickerList, preSet, type)
        else if(selector==3) {
            let newList = tickerList.filter(t=>(snp_500.includes(t.ticker) || etfs.includes(t.ticker)))
            funcHandler.runner(newList, {num: preSet, type:type})
        }
        else if(selector==4) {
            let newList = tickerList.filter(t=>snp_500.includes(t.ticker))
            this.backTest(newList, preSet, type)
        }
        else if(selector==5) this.singleBackTest(tickerList, preSet, type)
        

    },

    backTest: function (tickerList, preSet, type) {
        let period=10, dayRange=400
        let resRate=[]
        for(let i=period; i<dayRange; i++) {
            let rate = funcHandler.backTestRunner(tickerList, preSet, type, i, {period: period})
            if(rate) resRate.push(rate)
            process.stdout.write("\r\x1b[K")
            process.stdout.write(`iteration : ${i} / ${dayRange}, Rate: ${resRate.length>0 ? tools.mean(resRate) : 0}`)
        }

        let newBacktester = backtester.filter(e=> !(e.preSet==preSet))

        newBacktester.push({
            preSet: preSet,
            rate: tools.mean(resRate),
            period: period,
            range: dayRange,
            type: 'playground'
        })

        // let data = JSON.stringify(newBacktester, null, 2)

        // fs.writeFile('./public/backtester.json', data, (_) => {
        //     if(_) console.log(`-------ERROR-------\n${_}\n-------ERROR-------`)
        //     console.log(`\n\nComplete with a length of ${newBacktester.length}!!!\n\n`)
        // })


    },

    backTestResults: function (tickerList, json) {
        for(let i=0; i<json.length; i++) {
            let ticker = json.ticker, trend=json.trend;
            let bars = tickerList.filter(t => t.ticker == ticker)[0]
            
        }
    },

    singleBackTest: function (tickerList, preSet, type) {
        let period=5, total=0, succ=0
        let sym = prompt("Enter ticker (SPY): ")
        console.clear()
        if(sym=='') sym = 'SPY'
        let bars = tickerList.filter(t=>t.ticker==sym.toUpperCase())[0].bars

        for(let i=50; i<bars.length; i++) {
            let f= funcHandler.singleBackTestRunner(bars, preSet, type, i, {period: period})
            if(f.filter) total++
            if(f.succ) succ++

            process.stdout.write("\r\x1b[K")
            process.stdout.write(`iteration : ${i} / ${bars.length}, Rate: ${(succ/total)*100}`)
        }
        process.stdout.write("\r\x1b[K")

        console.log(`Rate: ${Number((succ/total)*100)} \nsuccess: ${succ} \ntotal: ${total}`)

    },

    ls: function (tickerList, preSet) {
        console.log("1. Run \n2. BackTest single ticker")
        let selector = prompt("Select: ")
        console.clear()

        // if(selector == 1) ls.runner(tickerList, {num: preSet, type:type})
        if(selector==2) ls.singleBackTest(tickerList, preSet)
          

    },
}

module.exports=selector;