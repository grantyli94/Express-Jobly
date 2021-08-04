const { BadRequestError } = require("../expressError");
const { findAll } = require("../models/user");
const { sqlForPartialUpdate, sqlForCompanyFilter } = require("./sql");

describe("SQL partial update", function () {
    const testData = {"name": "testCompany", "description": "test description", "numEmployees": 10};
    const jsToSQL = {
                    numEmployees: "num_employees",
                    logoUrl: "logo_url",
                    };
    const badData = {};
    
    test("builds correct SQL for partial update", function () {
        const { setCols, values } = sqlForPartialUpdate(testData, jsToSQL)
        
        expect(setCols).toEqual(`"name"=$1, "description"=$2, "num_employees"=$3`);
        expect(values).toEqual(["testCompany", "test description", 10]);
    });

    test("throws error with empty data input", function () {
        try {
            sqlForPartialUpdate(badData, jsToSQL);
            fail();
        } catch(err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});


describe("SQL filter for get all queries", function () {
    const testParams = { "name": "net", "minEmployees": 5 };
    const badParams = { "maxEmployees": 10, "minEmployees": 40 };
    const invalidParams = { "name": "net", "description": "tech" };

    test("builds correct WHERE clause and values for filtering getAll", function () {
        const { filter, values } = sqlForCompanyFilter(testParams);
        
        expect(filter).toEqual(`WHERE name ILIKE $1 AND num_employees >= $2`);
        expect(values).toEqual(["%net%", 5]);
    });

    test("returns empty filter and values if params is empty", function () {
        const { filter, values } = sqlForCompanyFilter({});
    
        expect(filter).toEqual("");
        expect(values).toEqual("");
    });

    test("throws error with impossible min and max", function () {
        try {
          sqlForCompanyFilter(badParams);
          fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("throws error when filtering with a property that is not allowed", function () {
        try {
            sqlForCompanyFilter(invalidParams);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});