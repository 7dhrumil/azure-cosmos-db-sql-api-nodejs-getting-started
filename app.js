// @ts-check
//  <ImportConfiguration>
const CosmosClient = require("@azure/cosmos").CosmosClient;
const config = require("./config");
const dbContext = require("./data/databaseContext");
//  </ImportConfiguration>

//  <DefineNewItem>
const newItem = {
  id: "3",
  category: "fun",
  name: "Cosmos DB",
  description: "Complete Cosmos DB Node.js Quickstart ⚡",
  isComplete: false
};
//  </DefineNewItem>

async function main() {

  // <CreateClientObjectDatabaseContainer>
  const { endpoint, key, databaseId, containerId } = config;

  const client = new CosmosClient({ endpoint, key });

  const database = client.database(databaseId);
  const container = database.container(containerId);

  // Make sure Tasks database is already setup. If not, create it.
  await dbContext.create(client, databaseId, containerId);
  // </CreateClientObjectDatabaseContainer>

  try {
    // <QueryItems>
    console.log(`Querying container: Items`);

    const dateFrom = new Date('2021-06-16T00:00:00.0000000Z').toISOString();
    const dateTo = new Date('2021-06-17T00:00:00.0000000Z').toISOString();
    // query to return all items
    // const querySpec = {
    //   query: `SELECT c.id,c.Resource,c.Power,TimestampToDateTime(c.Date*1000) as Date from c 
    //   Where TimestampToDateTime(c.Date*1000) > '${dateFrom}' And TimestampToDateTime(c.Date*1000) < '${dateTo}'`
    // };
    
    
    // const querySpec = {
    //   query: `SELECT top 5 c._ts,c.id,c.Resource,c.Power from c 
    //   Where c.Date > DateTimeToTimestamp('${dateFrom}') And c.Date*1000 < DateTimeToTimestamp('${dateTo}') `
    // };

    const querySpec = {
      query: `SELECT top 100 * from c Where c.Resource ='Metric' And TimestampToDateTime(c.Date*1000) > '${dateFrom}' And TimestampToDateTime(c.Date*1000) < '${dateTo}'`
    };
//
    console.time('doSomething');
    // read all items in the Items container
      const result = await container.items
      .query(querySpec, { populateQueryMetrics: true, maxItemCount: -1, maxDegreeOfParallelism: -1 })
      .fetchAll();
      console.timeEnd('doSomething');
    
      console.log('doSomething', result.resources[0].items, JSON.stringify(result.queryMetrics));
    // items.forEach(item => {
    //   console.log(`${item.Resource} ${item.total} - ${item.toD}- ${item.Resource} - ${item.Power}`);
    // });
    // </QueryItems>

  } catch (err) {
    console.log(err.message);
  }
}

main();
