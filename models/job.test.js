"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
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
            title: "newJob",
            salary: 500,
            equity: "0.5",
            companyHandle: "c1"
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'newJob'`);
        expect(result.rows).toEqual([
            {
                title: "newJob",
                salary: 500,
                equity: "0.5",
                companyHandle: "c1"
            },
        ]);
    });

    // TODO: double check 
    // test("bad request with dupe", async function () {
    //     try {
    //         await Company.create(newCompany);
    //         await Company.create(newCompany);
    //         fail();
    //     } catch (err) {
    //         expect(err instanceof BadRequestError).toBeTruthy();
    //     }
    // });
});

