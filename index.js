// @ts-check
//  <ImportConfiguration>
const express = require("express");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const bodyParser = require("body-parser");
const app = express();
const port = 3005;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const CosmosClient = require("@azure/cosmos").CosmosClient;
const config = require("./config");
const dbContext = require("./data/databaseContext");

async function main() {
  // <CreateClientObjectDatabaseContainer>
  const { endpoint, key, databaseId, containerId } = config;

  const client = new CosmosClient({ endpoint, key });

  const database = client.database(databaseId);
  const container = database.container(containerId);

  // Make sure Tasks database is already setup. If not, create it.
  await dbContext.create(client, databaseId, containerId);
  // </CreateClientObjectDatabaseContainer>

  app.get("/api/pumpdata", async (req, res) => {
    try {
      var toDate = req.query.toDate;
      var fromDate = req.query.fromDate;

      const querySpec2 = {
        query: `SELECT top 2000 c.id,c.Resource,c.Power from c 
          Where c.Date > DateTimeToTimestamp('${toDate}')/1000 And c.Date < DateTimeToTimestamp('${fromDate}')/1000 `,
      };
      console.time("doSomething");
      const data = await container.items.query(querySpec2).fetchAll();
      console.timeEnd("doSomething");

      console.log(data.resources.length);
      return res.status(200).send({
        message: "Success",
        data: data.resources,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/pumpdata/metrics", async (req, res) => {
    try {
      var body = req.body;
      let response = {
        "info": body.info,
        "config": {
          "type": body.config.type,
          "widgetsetup": body.config.widgetsetup,
          "Metrics": {}
        }
      };


      if (body.config.widgetsetup == 'no') {
        const mextricsQuery = body.config.metrics.map(async (m) => {
          const querySpec = {
            query: `SELECT c.${m.metric} as MatricValue,c.Date from c  Where c.Date > ${m.start} And c.Date < ${m.end}`,
          };
          const data = await container.items.query(querySpec).fetchAll();
          return { [m.metric]: data.resources };

        });

        let responseObj = {};
        const result = await Promise.all(mextricsQuery);
        result.forEach(r => {
          responseObj[Object.keys(r)[0]] = r[Object.keys(r)[0]];
        });
        response.config.Metrics = responseObj;
        return res.status(200).send(response);
      } else {
        let responseObj = {};
        body.config.metrics.map((m) => {
          responseObj[m.metric] = [
            {
              'MatricValue': 130,
              Date: 1624549326000
            }
          ];
        });
        response.config.Metrics = responseObj;
      }
      return res.status(200).send(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });

}
app.listen(port, () => console.log(`App listening on port ${port}!`));
main();
