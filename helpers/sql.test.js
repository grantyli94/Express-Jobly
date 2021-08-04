const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilterGetAll } = require("./sql");

describe("SQL partial update", function () {
    const testData = {"name": "testCompany", "description": "test description"};
    const jsToSQL = {
                    numEmployees: "num_employees",
                    logoUrl: "logo_url",
                    };
    const badData = {};
    
    test("builds correct SQL for partial update", function () {
        const { setCols, values } =  sqlForPartialUpdate(testData, jsToSQL)
        
        expect(setCols).toEqual(`"name"=$1, "description"=$2`);
        expect(values).toEqual(["testCompany", "test description"]);
    });

    test("throws error with empty data input", function () {
        try {
            const { setCols, values } = sqlForPartialUpdate(badData, jsToSQL)
        } catch(err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});


describe("SQL filter get all queries", function () {
    const testParams = { "name": "net", "minEmployees": 5 };
    const badParams = { "maxEmployees": 10, "minEmployees": 40 };
    const invalidParams = { "name": "net", "description": "tech" };

    test("builds correct SQL for filtering getAll", function () {
        const setCols = sqlForFilterGetAll(testParams);
        
        expect(setCols).toEqual(`name ILIKE "%net%" AND num_employees > 5`);
    });

    test("throws error with impossible min and max", function () {
        try {
            const setCols = sqlForFilterGetAll(badParams);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("throws error when filtering with a property that is not allowed", function () {
        try {
            const setCols = sqlForFilterGetAll(invalidParams);
        } catch (err) {
            console.log(err);
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});