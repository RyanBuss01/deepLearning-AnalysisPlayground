const etfs = require("../constants/ETFs")
const meme_stocks = require("../constants/meme_stocks")
const snp_400MC = require("../constants/snp_400MC")
const snp_500 = require("../constants/snp_500")
const snp_600SC = require('../constants/snp_600SC')
const blacklist = require("../constants/blacklist")
const dow = require("../constants/dow")
const fs = require('fs');


var tickerMngr = {
    createMasterList: function() {
        let master = []
        let fullTickers =  [snp_500, etfs, meme_stocks, snp_400MC, snp_600SC, dow]

        for (let l=0; l<fullTickers.length; l++) {
            for(let i=0; i<fullTickers[l].length; i++) {
                let index = l==0? "snp_500" : l==1? "etfs" :l==2? "meme_stocks" :l==3? "snp_400MC" :''
                let ticker = fullTickers[l][i]
                let json = {ticker: ticker, index: index}


                let repeat = master.find(e=>e.ticker == json.ticker)
                let black = blacklist.find(e=> e==json.ticker)
                if(!repeat && !black) master.push(json)
            }
        }

        let data = JSON.stringify(master, null, 2)

    fs.writeFile('./public/master.json', data, (_) => {
        if(_) console.log(`-------ERROR-------\n${_}\n-------ERROR-------`)
        console.log(`\n\nComplete with a length of ${master.length}!!!\n\n`)
    })
    },
}

module.exports=tickerMngr