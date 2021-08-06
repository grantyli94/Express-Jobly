"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "newJob",
    salary: 500,
    equity: .500,
    companyHandle: "c1"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "newJob",
        salary: 500,
        equity: "0.5",
        companyHandle: "c1"
      }
    });
  });

  test("not ok for non-admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 1000,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});


/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "j1",
            salary: 100,
            equity: "0.1",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "j2",
            salary: 200,
            equity: "0.2",
            companyHandle: "c2",
          },
          {
            id: expect.any(Number),
            title: "j3",
            salary: 300,
            equity: "0",
            companyHandle: "c3",
          },
        ],
    });
  });

  test("successfully filters title", async function () {
    let title = "1"
    const resp = await request(app).get(`/jobs?title=${title}`);
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: 1,
            title: "j1",
            salary: 100,
            equity: "0.1",
            companyHandle: "c1",
          }
        ],
    });
  });

  test("successfully filters minSalary", async function () {
    let minSalary = 300
    const resp = await request(app).get(`/jobs?minSalary=${minSalary}`);
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: 3,
            title: "j3",
            salary: 300,
            equity: "0",
            companyHandle: "c3",
          }
        ],
    });
  });

  test("successfully filters hasEquity", async function () {
    let hasEquity = true;
    const resp = await request(app).get(`/jobs?hasEquity=${hasEquity}`);
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: 1,
            title: "j1",
            salary: 100,
            equity: "0.1",
            companyHandle: "c1",
          },
          {
            id: 2,
            title: "j2",
            salary: 200,
            equity: "0.2",
            companyHandle: "c2",
          }
        ],
    });
  });

  test("works if hasEquity is false", async function () {
    let hasEquity = false;
    const resp = await request(app).get(`/jobs?hasEquity=${hasEquity}`);
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: 1,
            title: "j1",
            salary: 100,
            equity: "0.1",
            companyHandle: "c1",
          },
          {
            id: 2,
            title: "j2",
            salary: 200,
            equity: "0.2",
            companyHandle: "c2",
          },
          {
            id: 3,
            title: "j3",
            salary: 300,
            equity: "0",
            companyHandle: "c3",
          }
        ],
    });
  });

  test("throws error if received invalid properties", async function () {
    let invalidParam = "BAD"
    const resp = await request(app).get(`/jobs?invalidParam=${invalidParam}`);
    expect(resp.body.error).toEqual({
      "message": [
        "instance is not allowed to have the additional property \"invalidParam\""
      ],
      "status": 400
    });
  });

  test("throws error if minSalary is not a number", async function () {
    let minSalary = "BAD"
    const resp = await request(app).get(`/jobs?minSalary=${minSalary}`);
    expect(resp.body.error).toEqual({
      "message": [
        "instance.minSalary is not of a type(s) integer"
      ],
      "status": 400
    });
  });

  test("throws error if hasEquity is not a boolean", async function () {
    let hasEquity = "BAD"
    const resp = await request(app).get(`/jobs?hasEquity=${hasEquity}`);
    console.log(resp.body);
    expect(resp.body.error).toEqual({
      "message": [
        "instance.hasEquity is not of a type(s) boolean"
      ],
      "status": 400
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
      .get("/companies")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});


/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {

    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "New",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "New",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
    });
  });

  test("does not works for non-admin users", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "New",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "New",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "New",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        id: 0,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        salary: "string",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "job id: 1" });
  });

  test("does not work for non-admin users", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
