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


/************************************** GET /companies */

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
                        equity: "0.3",
                        companyHandle: "c3",
                    },
                ],
        });
    });

//     test("successfully filters names", async function () {
//         let name = "1"
//         const resp = await request(app).get(`/companies?name=${name}`);
//         expect(resp.body).toEqual({
//             companies:
//                 [
//                     {
//                         handle: "c1",
//                         name: "C1",
//                         description: "Desc1",
//                         numEmployees: 1,
//                         logoUrl: "http://c1.img",
//                     }
//                 ],
//         });
//     });

//     test("successfully filters num of employees", async function () {
//         let minEmployees = 3
//         const resp = await request(app).get(`/companies?minEmployees=${minEmployees}`);
//         expect(resp.body).toEqual({
//             companies:
//                 [
//                     {
//                         handle: "c3",
//                         name: "C3",
//                         description: "Desc3",
//                         numEmployees: 3,
//                         logoUrl: "http://c3.img",
//                     }
//                 ],
//         });
//     });

//     test("successfully filters num of employees", async function () {
//         let maxEmployees = 1
//         const resp = await request(app).get(`/companies?maxEmployees=${maxEmployees}`);
//         expect(resp.body).toEqual({
//             companies:
//                 [
//                     {
//                         handle: "c1",
//                         name: "C1",
//                         description: "Desc1",
//                         numEmployees: 1,
//                         logoUrl: "http://c1.img",
//                     }
//                 ],
//         });
//     });

    // test("throws error if received invalid properties", async function () {
    //     let invalidParam = "BAD"
    //     const resp = await request(app).get(`/companies?invalidParam=${invalidParam}`);
    //     expect(resp.body.error).toEqual({
    //         "message": [
    //             "instance is not allowed to have the additional property \"invalidParam\""
    //         ],
    //         "status": 400
    //     });
    // });

    // test("throws error if minEmployees is not a number", async function () {
    //     let minEmployees = "BAD"
    //     const resp = await request(app).get(`/companies?minEmployees=${minEmployees}`);
    //     expect(resp.body.error).toEqual({
    //         "message": [
    //             "instance.minEmployees is not of a type(s) integer"
    //         ],
    //         "status": 400
    //     });
    // });

    // test("throws error if maxEmployees is not a number", async function () {
    //     let maxEmployees = "BAD"
    //     const resp = await request(app).get(`/companies?maxEmployees=${maxEmployees}`);
    //     expect(resp.body.error).toEqual({
    //         "message": [
    //             "instance.maxEmployees is not of a type(s) integer"
    //         ],
    //         "status": 400
    //     });
    // });

    // test("fails: test next() handler", async function () {
    //     // there's no normal failure event which will cause this route to fail ---
    //     // thus making it hard to test that the error-handler works with it. This
    //     // should cause an error, all right :)
    //     await db.query("DROP TABLE companies CASCADE");
    //     const resp = await request(app)
    //         .get("/companies")
    //         .set("authorization", `Bearer ${u1Token}`);
    //     expect(resp.statusCode).toEqual(500);
    // });
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