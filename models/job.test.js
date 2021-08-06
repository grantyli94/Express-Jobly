"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "newJob",
        salary: 500,
        equity: 0.500,
        companyHandle: "c1"
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            id: expect.any(Number),  
            title: "newJob",
            salary: 500,
            equity: "0.5",
            companyHandle: "c1"
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'newJob'`);
        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                title: "newJob",
                salary: 500,
                equity: "0.5",
                companyHandle: "c1"
            },
        ]);
    });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300,
        equity: "0",
        companyHandle: "c3"
      }
    ]);
  });

  test("works: with title filter", async function () {
    let testParams = {title: "1"}
    let jobs = await Job.findAll(testParams);
    expect(jobs).toEqual([
      {
        id: 1,
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      }
    ]);
  });

  test("works: with minSalary filter", async function () {
    let testParams = { minSalary: 300 }
    let jobs = await Job.findAll(testParams);
    expect(jobs).toEqual([
      {
        id: 3,
        title: "j3",
        salary: 300,
        equity: "0",
        companyHandle: "c3"
      }
    ]);
  });

  test("works: with minSalary filter", async function () {
    let testParams = { minSalary: 300 }
    let jobs = await Job.findAll(testParams);
    expect(jobs).toEqual([
      {
        id: 3,
        title: "j3",
        salary: 300,
        equity: "0",
        companyHandle: "c3"
      }
    ]);
  });

  test("works: with hasEquity = true", async function () {
    let testParams = { hasEquity: true }
    let jobs = await Job.findAll(testParams);
    expect(jobs).toEqual([
      {
        id: 1,
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
      {
        id: 2,
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2"
      }
    ]);
  });

  test("works: with hasEquity = false", async function () {
    let testParams = { hasEquity: false }
    let jobs = await Job.findAll(testParams);
    expect(jobs).toEqual([
      {
        id: 1,
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
      {
        id: 2,
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2"
      },
      {
        id: 3,
        title: "j3",
        salary: 300,
        equity: "0",
        companyHandle: "c3"
      }
    ]);
  });

  test("works: with no filter results", async function () {
    let testParams = { title: "does_not_exist" }
    let jobs = await Job.findAll(testParams);
    expect(jobs).toEqual([]);
  });

  test("works: with multiple filters", async function () {
    let testParams = { minSalary: 200, hasEquity: true }
    let jobs = await Job.findAll(testParams);
    expect(jobs).toEqual([
      {
        id: 2,
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2"
      }
    ]);
  });
  
  test("works: with non-existent filters", async function () {
    let badParams = { badParam: "does_not_exist" }
    let jobs = await Job.findAll(badParams);
    expect(jobs).toEqual([
      {
        id: 1,
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
      {
        id: 2,
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2"
      },
      {
        id: 3,
        title: "j3",
        salary: 300,
        equity: "0",
        companyHandle: "c3"
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      id: 1,
      title: "j1",
      salary: 100,
      equity: "0.1",
      companyHandle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 1000,
    equity: 0.750
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      title: "New",
      salary: 1000,
      equity: "0.75",
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = 1`);
    expect(result.rows).toEqual([{
      id: 1,
      title: "New",
      salary: 1000,
      equity: "0.75",
      companyHandle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: 1,
      title: "New",
      salary: null,
      equity: null,
      companyHandle: "c1"
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE id = 1`);
    expect(result.rows).toEqual([{
      id: 1,
      title: "New",
      salary: null,
      equity: null,
      companyHandle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request when trying to update id", async function () {
    try {
      await Job.update(1, {id: 1000});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove(1);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=1");
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** sqlForCompanyFilter */

describe("SQL filter for get all queries", function () {
  const testParams = { "title": "test", "minSalary": 100, "hasEquity": true };
  const invalidParams = { "invalid": "param" };

  test("builds correct WHERE clause and values for filtering", function () {
    const { filter, values } = Job._sqlForJobFilter(testParams);

    expect(filter).toEqual(`WHERE title ILIKE $1 AND salary >= $2 AND equity > $3`);
    expect(values).toEqual(['%test%', 100, 0]);
  });

  test("returns empty filter and values if params is empty", function () {
    const { filter, values } = Job._sqlForJobFilter({});

    expect(filter).toEqual("");
    expect(values).toEqual("");
  });

  test("throws error when filtering with a property that is not allowed", function () {
    const { filter, values } = Job._sqlForJobFilter({invalidParams});
    expect(filter).toEqual("");
    expect(values).toEqual("");
  });
});