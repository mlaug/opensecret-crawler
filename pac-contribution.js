const tabletojson = require('tabletojson');

const promises = []

const output = {}
const ids = ["C00197749"]
const years = ['2012','2014']

const add = (id, year, col, data) => {
  output[id] = output[id] || {}
  output[id][col.concat(year.substr(-2))] = data
}

ids.map((id) => {
  years.map((year) => {
    promises.push(tabletojson.convertUrl(`https://www.opensecrets.org/pacs/lookup2.php?strID=${id}&cycle=${year}`)
      .then((tables) => {
        const distribution = tables[1][0][0].match(/(\((\d+)% to Democrats, (\d+)% to Republicans\))/);
        add(id, year, 'PACTOT', tables[1][0][1])
        add(id, year, 'PAC_DEM', distribution[2])
        add(id, year, 'PAC_REP', distribution[3])
    }));
  });
});

Promise.all(promises).then(() => console.log(output));
