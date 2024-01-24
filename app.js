const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const ReturningAllStates = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

// API 1 returning all states from the state table

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
      * 
    FROM 
      state 
    ORDER BY state_id `;
  const statesArray = await db.all(getStatesQuery);
  const result = statesArray.map((eachState) => {
    return ReturningAllStates(eachState);
  });
  response.send(result);
});

// API 2 Returning the state based on stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
  SELECT 
   * 
  FROM state 
  WHERE state_id=${stateId}`;
  const state = await db.get(getStateQuery);
  const result = ReturningAllStates(state);
  response.send(result);
});

// API 3 creating new district in district table

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
  INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
  VALUES 
       (
           ${districtName},
           ${stateId},
           ${cured},
           ${active},
           ${deaths},
       )
  `;
  const dbResponse = await db.run(addDistrictQuery);
  const stateId = dbResponse.last_ID;
  response.send("District Successfully Added");
});

// API 4 returning district based on district Id

const ReturningDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/districts/districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT 
    * 
 FROM district 
 WHERE district_id=${districtId}`;
  const district = await db.get(getDistrictQuery);
  const result = ReturningDistrict(district);
  response.send(result);
});

// API 5 delete a district from district table based on the district Id

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const DeleteDistrictQuery = `
   DELETE  FROM 
   district 
   WHERE district_id=${districtId}`;
  await db.run(DeleteDistrictQuery);
  response.send("District Removed");
});

//  API 6 update district in district table
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
  UPDATE district 
   SET 
     district_name=${districtName},
     state_id=${stateId},
     cases=${cases},
     cured=${cured},
     active=${active},
     deaths=${deaths}
    WHERE 
        district_id=${districtId}`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API 7 Returning the stats of state

const ReturningStateStats = (dbObject) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  };
};
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateReport = `
  SELECT 
         SUM(cases) AS cases,
         SUM(cured) AS cured,
         SUM(active) AS active,
         SUM(deaths) AS deaths 
  FROM 
       district 
  WHERE state_id=${stateId}`;
  const stateReport = await db.get(getStateReport);
  const result = ReturningStateStats(stateReport);
  response.send(result);
});

// API 8 Returning state Name based on district Id

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateDetails = `
  SELECT 
     state_name 
  FROM state JOIN district ON state.state_id=district.state_id 
  WHERE 
      district.district_id=${districtId}`;
  const stateName = await db.get(stateDetails);
  response.send({ stateName: stateName.state_name });
});
module.exports = app;
