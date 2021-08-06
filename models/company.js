"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
        `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
        `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(params={}) {
    const { filter, values } = Company._sqlForCompanyFilter(params);
    const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ${filter}
           ORDER BY name`,
           values);
    
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   * 
   **/

  static async get(handle) {
    const companyRes = await db.query(
        `SELECT c.handle,
                c.name,
                c.description,
                c.num_employees AS "numEmployees",
                c.logo_url AS "logoUrl",
                j.id,
                j.title,
                j.salary,
                j.equity,
                j.company_handle
           FROM companies AS c
           JOIN jobs AS j ON c.handle = j.company_handle
           WHERE c.handle = $1`,
        [handle]);
      
    const jobsRes = await db.query(
      `SELECT   id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs 
           WHERE company_handle = $1`,
      [handle]);

    const jobs = jobsRes.rows;

    const result = companyRes.rows.map((c) => ({
      handle: c.handle,
      name: c.name,
      description: c.description,
      numEmployees: c.numEmployees,
      logoUrl: c.logoUrl,
      jobs
    }));

    const company = result[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
        `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }


  /** Takes query parameters and converts to SQL filter logic
 * 
 * If no parameters are passed in, returns { filter: "", values: ""}
 * 
 * Else, returns { filter: WHERE ..., values: [...]}
*/

  static _sqlForCompanyFilter(params) {
    const keys = Object.keys(params);
    if (keys.length === 0) return { filter: "", values: "" };
    
    const { minEmployees, maxEmployees, name } = params;
    
    if (minEmployees > maxEmployees) {
      throw new BadRequestError("Impossible min and max filters");
    }
    
    const values = [];
    const whereParts = [];

    if (minEmployees !== undefined) {
      values.push(minEmployees);
      whereParts.push(`num_employees >= $${values.length}`)
    }
    if (maxEmployees !== undefined) {
      values.push(maxEmployees);
      whereParts.push(`num_employees <= $${values.length}`)
    }
    if (name !== undefined) {
      values.push(`%${name}%`);
      whereParts.push(`name ILIKE $${values.length}`)
    }

    if (whereParts.length === 0) return { filter: "", values: "" };

    return {
      filter: "WHERE " + whereParts.join(" AND "),
      values
    }
  }
}




module.exports = Company;
