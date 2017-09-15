const tabletojson = require('tabletojson');
const csv = require('fast-csv');
const fs = require('fs');

const promises = []

const output = {}
const ids = require('./ids').pacIds
const years = ['2012','2014']

const add = (id, year, col, data) => {
  output[id] = output[id] || {id}
  output[id][col.concat(year.substr(-2))] = data
}

ids.map((id) => {
  years.map((year) => {
    promises.push(tabletojson.convertUrl(`https://www.opensecrets.org/pacs/lookup2.php?strID=${id}&cycle=${year}`)
      .then((tables) => {
     if ( tables.length > 0 ){
       const distribution = tables[1][0][0].match(/(\((\d+)% to Democrats, (\d+)% to Republicans\))/);
       if ( !distribution ){
         add(id, year, 'PACTOT', 0)
         add(id, year, 'PAC_DEM', 0)
         add(id, year, 'PAC_REP', 0)
       }
       else {
         add(id, year, 'PACTOT', parseInt(tables[1][0][1].replace(/\D+/g, '')))
         add(id, year, 'PAC_DEM', parseInt(distribution[2].replace(/\D+/g, '')))
         add(id, year, 'PAC_REP', parseInt(distribution[3].replace(/\D+/g, '')))
       }
     }
     else {
       add(id, year, 'PACTOT', 0)
       add(id, year, 'PAC_DEM', 0)
       add(id, year, 'PAC_REP', 0)
     }
    }));
  });
});

Promise.all(promises).then(() => {
  const csvStream = csv.createWriteStream({
    headers: ['id', 'PAC_DEM12', 'PAC_REP12', 'PACTOT12', 'PAC_DEM14', 'PAC_REP14', 'PACTOT14'],
    delimiter: ';'
  })
  const writableStream = fs.createWriteStream("data/pac-contribution.csv");
  csvStream.pipe(writableStream);
  Object.keys(output).forEach(id => {
    csvStream.write(output[id])
  });
  csvStream.end();
});
