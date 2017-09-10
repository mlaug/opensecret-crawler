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

const output = {}
const ids = require('./ids').ids
const years = ['2012','2013','2014','2015']

const add = (id, year, col, data) => {
  output[id] = output[id] || {id}
  if ( col && data )
    output[id][col.concat(year.substr(-2))] = data
}

ids.map((id) => {
  years.map((year) => {
    promises.push(tabletojson.convertUrl(`https://www.opensecrets.org/lobby/clientissues.php?id=${id}&year=${year}`)
      .then((data) => {
      if ( data.length > 0 ){
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
      }
      else {
        add(id, year)
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
    headers: ['id'].concat(headers),
    delimiter: ';'
  })
  const writableStream = fs.createWriteStream("data/lobbying-issues.csv");
  csvStream.pipe(writableStream);
  Object.keys(output).forEach(id => {
    csvStream.write(output[id])
  });
  csvStream.end();
});
