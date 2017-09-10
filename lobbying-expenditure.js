const axios = require('axios')
const csv = require('fast-csv');
const fs = require('fs');

const promises = []
const output = {}
const years = ['2012','2013','2014','2015']

const ids = require('./ids').ids

const add = (id, year, col, data) => {
  output[id] = output[id] || {id}
  output[id][col.concat(year.substr(-2))] = data
}

ids.map((id) => {
  years.map((year) => {
    promises.push(axios.get(`https://www.opensecrets.org/lobby/clientsum.php?id=${id}&year=${year}`).then((response) => {
      const exp = response.data.match(/(Total Lobbying Expenditures: (.*)<\/strong>)/)
      if ( exp )
        add(id, year, 'LOBEXP', parseInt(exp[2].replace(/\D+/g, '')))
      else
        add(id, year, 'LOBEXP', 0)
    }))
  });
});

Promise.all(promises).then(() => {
  const csvStream = csv.createWriteStream({headers: ['id', 'LOBEXP12', 'LOBEXP13', 'LOBEXP14', 'LOBEXP15'], delimiter: ';'})
  const writableStream = fs.createWriteStream("data/lobbying-expenditure.csv");
  csvStream.pipe(writableStream);
  Object.keys(output).forEach(id => {
    csvStream.write(output[id])
  });
  csvStream.end();
})