const { BadRequestError } = require("../expressError");
const { findAll } = require("../models/user");
const { sqlForPartialUpdate } = require("./sql");

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


