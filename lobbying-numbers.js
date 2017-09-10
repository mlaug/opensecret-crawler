const axios = require('axios')
const csv = require('fast-csv');
const fs = require('fs');

const promises = []
const output = {}
const ids = require('./ids').ids
const years = ['2012', '2013', '2014', '2015']

const add = (id, year, col, data) => {
  output[id] = output[id] || {id}
  output[id][col.concat(year.substr(-2))] = data
}

ids.map((id) => {
  years.map((year) => {
    promises.push(axios.get(`https://www.opensecrets.org/lobby/clientlbs.php?id=${id}&year=${year}`).then((response) => {
      const lobnum = response.data.match(/(Total number of lobbyists: (\d+)<br \/>)/)
      const revnum = response.data.match(/(Total number of revolvers: (\d+) \()/)
      if (lobnum) {
        add(id, year, 'LOBNUM', lobnum[2])
        add(id, year, 'REVNUM', revnum[2])
      }
      else {
        add(id, year, 'LOBNUM', 0)
        add(id, year, 'REVNUM', 0)
      }
    }).catch(() => null))
  });
});

Promise.all(promises).then(() => {
  const csvStream = csv.createWriteStream({
    headers: ['id', 'LOBNUM12', 'REVNUM12', 'LOBNUM13', 'REVNUM13', 'LOBNUM14', 'REVNUM14', 'LOBNUM15', 'REVNUM15'],
    delimiter: ';'
  })
  const writableStream = fs.createWriteStream("data/lobbying-numbers.csv");
  csvStream.pipe(writableStream);
  Object.keys(output).forEach(id => {
    csvStream.write(output[id])
  });
  csvStream.end();
})