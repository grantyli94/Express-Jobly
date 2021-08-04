const { BadRequestError } = require("../expressError");

/** Takes input data info, and stores keys in variable keys
 * Show what dataToUpdate and jsToSql looks like
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

/** Takes query parameters and converts to SQL filter logic
 * 
 * If no parameters are passed in, returns { filter: "", values: ""}
 * 
 * Else, returns { filter: WHERE ..., values: [...]}
*/

function sqlForCompanyFilter(params) {
  // const { minEmployees, maxEmployees, name } = params;
  // let values = [];
  // if (minEmployees !== undefined) {
  //   values.push(minEmployees);
  //   whereParts.push(`num_employees >= $${values.length}`)
  // }


  const keys = Object.keys(params);
  if (keys.length === 0) return { filter: "", values: ""};

  if (params["minEmployees"] > params["maxEmployees"]) {
    throw new BadRequestError("Impossible min and max filters");
  }
  
  const cols = keys.map((colName, idx) => {
    if (colName === "name") return `name ILIKE $${idx + 1}`;
    else if (colName === "minEmployees") return `num_employees >= $${idx + 1}`;
    else if (colName === "maxEmployees") return `num_employees <= $${idx + 1}`;
    else throw new BadRequestError("Can only filter name, minEmployees, and maxEmployees")
  });

  return {
    filter: "WHERE " + cols.join(" AND "),
    values: Object.values(params).map(val => {
      if (typeof val === "string") return `%${val}%`;
      return val;
    })
  }
}


module.exports = { sqlForPartialUpdate, sqlForCompanyFilter };
