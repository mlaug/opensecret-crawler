const tabletojson = require('tabletojson');
const csv = require('fast-csv');
const fs = require('fs');

const promises = []
const output = {}

const add = (id, year, col, data) => {
  output[id] = output[id] || {id}
  output[id][col.concat(year.substr(-2))] = isNaN(data) ? data : data
}

const searchData = []

const stream = fs.createReadStream("data/data.csv");
const csvStream = csv({delimiter: '\t'})
  .on("data", function (line) {
    searchData.push([line[0], line[1], '2012'])
    searchData.push([line[0], line[2], '2014'])
  })
  .on("end", function () {

    searchData.map((searchTerm) => {
      const id = searchTerm[0]
      const ceo = encodeURIComponent(searchTerm[1]);
      const year = searchTerm[2];
      console.log(`Searching for ${ceo} in ${year} election cycle`)
      promises.push(tabletojson.convertUrl(`https://www.opensecrets.org/donor-lookup/results?cand=&cycle=${year}&employ=&name=${ceo}&state=&zip=`)
        .then((tables) => {

          if (tables.length === 0) {
            add(id, year, 'DEM', "###");
            add(id, year, 'REP', "###");
            add(id, year, 'UN', "###");
          }
          else {

            //D
            add(id, year, 'DEM', tables[0].filter((donation) => {
              return (donation.Category === "Money to Candidates" || donation.Category === "Money to Parties")
                && donation.Recipient.includes('(D)')
            }).reduce((sum, donation) => {
              return sum += parseInt(donation.Amount.replace(/[$,]/g, ''));
            }, 0));

            // R
            add(id, year, 'REP', tables[0].filter((donation) => {
              return (donation.Category === "Money to Candidates" || donation.Category === "Money to Parties")
                && donation.Recipient.includes('(R)')
            }).reduce((sum, donation) => {
              return sum += parseInt(donation.Amount.replace(/[$,]/g, ''));
            }, 0));

            // UN
            add(id, year, 'UN', tables[0].filter((donation) => donation.Category === "Money to PACs")
              .reduce((sum, donation) => {
                return sum += parseInt(donation.Amount.replace(/[$,]/g, ''));
              }, 0));
          }

        }))
    })

    Promise.all(promises).then(() => {
      console.log(output)
      const csvStream = csv.createWriteStream({
        headers: ['id', 'DEM12', 'REP12', "UN12", 'DEM14', 'REP14', "UN14"],
        delimiter: ';'
      })
      const writableStream = fs.createWriteStream("data/donations.csv");
      csvStream.pipe(writableStream);
      Object.keys(output).forEach(id => {
        csvStream.write(output[id])
      });
      csvStream.end();
    });
  });
stream.pipe(csvStream);

