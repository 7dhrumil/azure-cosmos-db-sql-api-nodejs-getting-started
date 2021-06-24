// @ts-check
//  <ImportConfiguration>
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const app = express();
const port = 3005;

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
  isComplete: false,
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

    const dateFrom = new Date("2021-06-16T00:00:00.0000000Z").toISOString();
    const dateTo = new Date("2021-06-17T00:00:00.0000000Z").toISOString();
    // query to return all items
    // const querySpec = {
    //   query: `SELECT c.id,c.Resource,c.Power,TimestampToDateTime(c.Date*1000) as Date from c
    //   Where TimestampToDateTime(c.Date*1000) > '${dateFrom}' And TimestampToDateTime(c.Date*1000) < '${dateTo}'`
    // };
    const querySpec = {
      query: `SELECT  c.id,c.Resource,c.Power from c 
      Where c.Date > DateTimeToTimestamp('${dateFrom}')/1000 And c.Date < DateTimeToTimestamp('${dateTo}')/1000 `,
    };

    //
    console.time("doSomething");
    // read all items in the Items container
    //const { resources: items } = await container.items
    //.query(querySpec)
    //.fetchAll();
    console.timeEnd("doSomething");

    // items.forEach(item => {
    //   console.log(`${item.total} ${item.fromD} - ${item.toD}- ${item.Resource} - ${item.Power}`);
    // });
    // </QueryItems>

    app.get("/api/pumpdata", async (req, res) => {
      try {
        var toDate = req.query.toDate;
        var fromDate = req.query.fromDate;

        const querySpec2 = {
          query: `SELECT top 2000 c.id,c.Resource,c.Power from c 
          Where c.Date > DateTimeToTimestamp('${toDate}')/1000 And c.Date < DateTimeToTimestamp('${fromDate}')/1000 `,
        };
        const data = await container.items.query(querySpec2).fetchAll();
        console.log(data.resources.length);
        return res.status(200).send({
          message: "Success",
          data: data.resources,
        });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });
  } catch (err) {
    console.log(err.message);
  }
}

app.listen(port, () => console.log(`App listening on port ${port}!`));
main();
