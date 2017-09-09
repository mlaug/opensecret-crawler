const tabletojson = require('tabletojson');

const promises = []
const cols = [
  ["Accounting", "IS_ACC", "RE_ACC"],
  ["Advertising", "IS_ADV", "RE_ADV"],
  ["Alcohol & Drugs", "IS_ALC", "RE_ALC"],
  ["Animals", "IS_ANI", "RE_ANI"],
  ["Budget & Appr.", "IS_BUD", "RE_BUD"],
  ["Civil Rights & Lib.", "IS_CIV", "RE_CIV"],
  ["Clean air & water", "IS_CAW", "RE_CAW"],
  ["Consum prod. Safety", "IS_CSP", "RE_CSP"],
  ["Copyright, Patent & Trademark", "IS_CPT", "RE_CPT"],
  ["Environment & Superfund", "IS_ENV", "RE_ENV"],
  ["Food Industry", "IS_FOO", "RE_FOO"],
  ["Indian/native am.", "IS_IND", "RE_IND"],
  ["Labor issues", "IS_LBR", "RE_LBR"],
  ["Natural resources", "IS_NAT", "RE_NAT"],
  ["Retirment", "IS_RET", "RE_RET"],
  ["Taxes", "IS_TAX", "RE_TAX"],
  ["Unemployment", "IS_UNM", "RE_UNM"],
  ["Waste", "IS_WAS", "RE_WAS"],
  ["Welfare", "IS_WEL", "RE_WEL"],
  ["Health issues", "IS_HEA", "RE_HEA"]
]
const output = {}
const ids = ["D000000128"]
const years = ['2012','2013','2014','2015']

const add = (id, year, col, data) => {
  output[id] = output[id] || {}
  output[id][col.concat(year.substr(-2))] = data
}

ids.map((id) => {
  years.map((year) => {
    promises.push(tabletojson.convertUrl(`https://www.opensecrets.org/lobby/clientissues.php?id=${id}&year=${year}`)
      .then((data) => {
      data[0].map((issrep) => {
        const col = cols.find(col => col[0] === issrep.Issue);
        if ( col ) {
          add(id, year, col[1], issrep['Specific Issues'])
          add(id, year, col[2], issrep['No. of Reports*'])
        }
        else {
          console.log("NOT FOUND: ", issrep.Issue);
        }
      });
    }));
  });
});

Promise.all(promises).then(() => console.log(output));
