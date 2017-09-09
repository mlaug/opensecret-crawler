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
    promises.push(axios.get(`https://www.opensecrets.org/lobby/clientsum.php?id=${id}&year=${year}`).then((response) => {
      add(id, year, 'LOBEXP', response.data.match(/(Total Lobbying Expenditures: (.*)<\/strong>)/)[2])
    }))
  });
});

Promise.all(promises).then(() => {
  console.log(output);
})