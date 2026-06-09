// file to test queries separately
const mongoose = require('mongoose');
require('dotenv').config();
const Tour = require('./models/Tour');
const Artist = require('./models/Artist');
const Ticket = require('./models/Ticket');

async function runLiveQuery() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected for live query...\n');

//   const result = await collectionName.find({ queryField: "queryValue" }).
//                                       populate('fieldToPopulate', 'fieldsToSelect');

  const result = await Tour.find({ title: "DOMINATE World Tour" });

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

runLiveQuery();