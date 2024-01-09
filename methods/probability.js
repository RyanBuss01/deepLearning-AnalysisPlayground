const ta = require("./ta")

var prob = {
    probability: function (symbol) {

        let bars = tickerList.filter(t=>t.ticker==symbol)[0].bars
        let json= {
            lastBar: {
                close: bars[bars.length-1].ClosePrice
            },
            ribbons: {
                _50: ta.getEMA(bars, 50),
                _100: ta.getEMA(bars, 100),
                _200: ta.getEMA(bars, 200),
            }
        }

        let target = 100, period = 10, vPeriod=20
        let t = prompt("Target Price [1> for precentage] (100): ")
        if(t!='') target=Number(t)
        let p = prompt("Enter Period (10): ")
        if(p!='') period=Number(p)

        

        if(target<1) target=json.lastBar.close*(1+target)

        let prob = toolsPredict.probability(bars, target, period)
        let tProb = toolsPredict.trendProbability(bars, target, period)
        let total = tProb.total; tProb= tProb.rate
        let vProb = toolsPredict.volatilityProbability(bars, target, period, vPeriod)

        let trendMatch = (json.ribbons._100<json.lastBar.close && json.ribbons._50<json.lastBar.close) ? true: false

        console.log(`\n\n\n-------probability-------\n\n`, 
        `\nStock:`, json.ticker,
        `\nLast Price:`, bars[bars.length-1].ClosePrice,
        `\nTarget Price`, target,
        `\nTarget Precentage`, tools.pDiff(bars[bars.length-1].ClosePrice, target),
        `\nDays: `, period,
        `\nAll Probability: `, Number(prob.toFixed(3)),
        `\nTrend Probability:`, Number(tProb.toFixed(3)),
        `\nVolatility Probability:`, Number(vProb.toFixed(3)),
        `\nTotal Trend:`, Number(total),
        `\nTrend Match:`, trendMatch,
        `\n\n\n`)

        
    }
}

module.exports=prob