"use strict";

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
      `INSERT INTO jobs(
                       title,
                       salary,
                       equity,
                       company_handle)
           VALUES
             ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        companyHandle
      ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
 *
 * Returns [{ id, title, salary, equity, companyHandle }, ...]
 * */

  static async findAll(params = {}) {
    const { filter, values } = Job._sqlForJobFilter(params);
    const jobsRes = await db.query(
      `SELECT id, 
              title,
              salary, 
              equity, 
              company_handle AS "companyHandle"
          FROM jobs
          ${filter}
          ORDER BY title`,
      values);

    return jobsRes.rows;
  }

  /** Given a job id, return data about company.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id, 
              title,
              salary, 
              equity, 
              company_handle AS "companyHandle"
          FROM jobs
          WHERE id = $1`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        companyHandle: "company_handle"
      });
    if (setCols.includes("id")) throw new BadRequestError(`Cannot update id: ${id}`)
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
        SET ${setCols}
        WHERE id = ${handleVarIdx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

  /** Takes query parameters and converts to SQL filter logic
   * 
   * If no parameters or invalid parameters are passed in, returns { filter: "", values: ""}
   * 
   * Else, returns { filter: WHERE ..., values: [...]}
  */

  static _sqlForJobFilter(params) {
    const keys = Object.keys(params);
    const initialData = { filter: "" , values: ""};
    if (keys.length === 0) return initialData;

    const { title, minSalary, hasEquity } = params;
    const whereParts = [];
    const values = [];

    if (title !== undefined) {
      values.push(`%${title}%`);
      whereParts.push(`title ILIKE $${values.length}`);
    }

    if (minSalary !== undefined) {
      values.push(minSalary);
      whereParts.push(`salary >= $${values.length}`);
    }
    // if hasEquity === true, then we push 0 to values array
    // to include equity > 0 in whereParts
    if (hasEquity) {
      values.push(0);
      whereParts.push(`equity > $${values.length}`);
    }

    if (whereParts.length === 0) return initialData;

    return {
      filter: "WHERE " + whereParts.join(" AND "),
      values
    }
  }
}

module.exports = Job;