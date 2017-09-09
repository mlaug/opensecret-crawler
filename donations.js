const tabletojson = require('tabletojson');
const csv = require('fast-csv');
const fs = require('fs');

const output = []
const stream = fs.createReadStream("data.csv");
const csvStream = csv({delimiter: ';'})
  .on("data", function(line){
    const searchData = []
    searchData.push([line[0], '2012'])
    searchData.push([line[1], '2014'])
    searchData.map((searchTerm) => {

      if ( searchTerm[0].length === 0 ) {
        output.push([0,0,0,0,0,0])
      }
      else {
        const ceo = encodeURIComponent(searchTerm[0]);
        const year = searchTerm[1];
        console.log(`Searching for ${ceo} in ${year} election cycle`)
        tabletojson.convertUrl(
          `https://www.opensecrets.org/donor-lookup/results?cand=&cycle=${year}&employ=&name=${ceo}&state=&zip=`,
          (data) => {

            // TODO: no entry found

            //D
            output.push(data[0].filter((donation) => {
              (donation.Category === "Money to Candidates" || donation.Category === "Money to Parties")
              && donaation.Recipient.contains('(D)')
            }).reduce((donation, sum) => {
              sum += parseInt(donation.replace(/\D+/g, ''));
            }));

            // R
            output.push(data[0].filter((donation) => {
              (donation.Category === "Money to Candidates" || donation.Category === "Money to Parties")
              && donaation.Recipient.contains('(R)')
            }).reduce((donation, sum) => {
              sum += parseInt(donation.replace(/\D+/g, ''));
            }));

            // UN
            output.push(data[0].filter((donation) => donation.Category === "Money to PACs")
              .reduce((donation, sum) => {
                sum += parseInt(donation.replace(/\D+/g, ''));
              }));
          })
      }
    })
  })
  .on("end", function(){

  });

stream.pipe(csvStream);
console.log(output);

