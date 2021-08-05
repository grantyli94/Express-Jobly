"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
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

  static async findAll() { // add params={} back in later
    // const { filter, values } = Company._sqlForCompanyFilter(params);
    const jobsRes = await db.query(
        `SELECT id, 
                title,
                salary, 
                equity, 
                company_handle AS "companyHandle"
          FROM jobs
          ORDER BY title`);
    
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
}

module.exports = Job;