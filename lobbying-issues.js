const tabletojson = require('tabletojson');
const csv = require('fast-csv');
const fs = require('fs');
const promises = []
const cols = [
  ["Accounting", "IS_ACC", "RE_ACC"],
  ["Advertising", "IS_ADV", "RE_ADV"],
  ["Alcohol & Drugs", "IS_ALC", "RE_ALC"],
  ["Animals", "IS_ANI", "RE_ANI"],
  ["Fed Budget & Appropriations", "IS_BUD", "RE_BUD"],
  ["Civil Rights & Civil Liberties", "IS_CIV", "RE_CIV"],
  ["Clean Air & Water", "IS_CAW", "RE_CAW"],
  ["Consumer Product Safety", "IS_CSP", "RE_CSP"],
  ["Copyright, Patent & Trademark", "IS_CPT", "RE_CPT"],
  ["Environment & Superfund", "IS_ENV", "RE_ENV"],
  ["Food Industry", "IS_FOO", "RE_FOO"],
    ["Indian/Native American Affairs", "IS_IND", "RE_IND"],
  ["Labor, Antitrust & Workplace", "IS_LBR", "RE_LBR"],
  ["Natural resources", "IS_NAT", "RE_NAT"],
  ["Retirment", "IS_RET", "RE_RET"],
  ["Taxes", "IS_TAX", "RE_TAX"],
  ["Unemployment", "IS_UNM", "RE_UNM"],
  ["Hazardous & Solid Waste", "IS_WAS", "RE_WAS"],
  ["Welfare", "IS_WEL", "RE_WEL"],
  ["Health Issues", "IS_HEA", "RE_HEA"]
]

const totalRep = {}
const totalIssues = {}
const output = {}
const ids = require('./ids').ids
const years = ['2012','2013','2014','2015']

function sortNumber(a,b) {
  return a - b;
}

const sum = (data) => {
  let sum = {}
  Object.keys(data).forEach(year => {
    sum[year] = data[year].reduce((sum, val) => sum + val)
  })
  return sum
}

const maxOfYear = (data, replace, withh) => {
  let top = {}
  Object.keys(data).forEach(year => {
    top[year.replace(replace, withh)] = data[year]
      .sort(sortNumber)
      .slice(-3)
      .reduce((sum, val) => sum + val)
  });
  return top
}

const addTotal = (id, year, issue, report) => {
  totalIssues[id] = totalIssues[id] || {}
  totalRep[id] = totalRep[id] || {}

  let colIss = year.substr(-2).concat("TOT_IS");
  totalIssues[id][colIss] = totalIssues[id][colIss] || []

  let colRep = year.substr(-2).concat("TOT_REP");
  totalRep[id][colRep] = totalRep[id][colRep] || []

  totalIssues[id][colIss].push(isNaN(issue) ? 0 : parseInt(issue))
  totalRep[id][colRep].push(isNaN(report) ? 0 : parseInt(report))
}

const add = (id, year, col, data) => {
  if ( col && data )
    output[id][col.concat(year.substr(-2))] = data
}

ids.map((id) => {
  output[id] = {id}
  totalRep[id] = {}
  totalIssues[id] = {}
  years.map((year) => {
    promises.push(tabletojson.convertUrl(`https://www.opensecrets.org/lobby/clientissues.php?id=${id}&year=${year}`)
      .then((data) => {
      if ( data.length > 0 ){
        data[0].map((issrep) => {
          const col = cols.find(col => col[0] === issrep.Issue);
          addTotal(id, year, issrep['Specific Issues'], issrep['No. of Reports*']);
          if ( col ) {
            add(id, year, col[1], issrep['Specific Issues'])
            add(id, year, col[2], issrep['No. of Reports*'])
          }
        });
      }
    }));
  });
});

Promise.all(promises).then(() => {
  const headers =
    cols.reduce((reduced, col) => reduced.concat(
      years.map(year => [col[1].concat(year.substr(-2)), col[2].concat(year.substr(-2))])
    ), [])
      .reduce((reduced, col) => reduced.concat(col), []);
  const csvStream = csv.createWriteStream({
    headers: ['id'].concat(headers).concat(
      ["12TOT_IS", "12TOT_REP", "12TOPIS", "12TOPRE"],
      ["13TOT_IS", "13TOT_REP", "13TOPIS", "13TOPRE"],
      ["14TOT_IS", "14TOT_REP", "14TOPIS", "14TOPRE"],
      ["15TOT_IS", "15TOT_REP", "15TOPIS", "15TOPRE"]
    ),
    delimiter: ';'
  })
  const writableStream = fs.createWriteStream("data/lobbying-issues.csv");
  csvStream.pipe(writableStream);
  Object.keys(output).forEach(id => {
    const combined = Object.assign(
      output[id],
      sum(totalIssues[id] || {}),
      sum(totalRep[id] || {}),
      maxOfYear(totalRep[id], "TOT_REP", "TOPRE") || {},
      maxOfYear(totalIssues[id], "TOT_IS", "TOPIS") || {}
    )
    csvStream.write(combined)
  });
  csvStream.end();
}).catch(err => console.log(err));
