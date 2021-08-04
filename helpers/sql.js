const { BadRequestError } = require("../expressError");

/** Takes input data info, and stores keys in variable keys
 * 
 *  If data was empty (keys.length === 0) then throw error
 * 
 * Returns object: { setCols: sql string, values: updated values array }
  */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // setCols: `"first_name"=$1, "age"=$2`
  // values: ['Aliya', 32]
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}


function sqlForFilterGetAll(params) {
  const keys = Object.keys(params);
  if (params["minEmployees"] > params["maxEmployees"]) {
    throw new BadRequestError("Impossible min and max filters");
  }
  
  const cols = keys.map((colName, idx) => {
    if (colName === "name") {
      return `name ILIKE "%${params[colName]}%"`;
    } 
    else if (colName === "minEmployees") {
      return `num_employees > ${params[colName]}`;
    }
    else if (colName === "maxEmployees") {
      return `num_employees < ${params[colName]}`;
    } 
    else {
      throw new BadRequestError("Can only filter name, minEmployees, and maxEmployees");
    }
  });

  return cols.join(" AND ");
}


module.exports = { sqlForPartialUpdate, sqlForFilterGetAll };
