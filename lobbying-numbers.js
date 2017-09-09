const axios = require('axios')

const promises = []
const output = {}
const ids = ["D000000128"]
const years = ['2012','2013','2014','2015']

const add = (id, year, col, data) => {
  output[id] = output[id] || {}
  output[id][col.concat(year.substr(-2))] = data
}

ids.map((id) => {
  years.map((year) => {
    promises.push(axios.get(`https://www.opensecrets.org/lobby/clientlbs.php?id=${id}&year=${year}`).then((response) => {
      add(id, year, 'LOBNUM', response.data.match(/(Total number of lobbyists: (\d+)<br \/>)/)[2])
      add(id, year, 'REVNUM', response.data.match(/(Total number of revolvers: (\d+) \()/)[2])
    }))
  });
});

Promise.all(promises).then(() => {
  console.log(output)
})