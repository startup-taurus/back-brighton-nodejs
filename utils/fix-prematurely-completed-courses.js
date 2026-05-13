if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { Sequelize, QueryTypes } = require('sequelize');

const formatDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : 'N/A');

const classify = (lastClassDate, hasActiveTwin) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lastClassDate) {
    const last = new Date(lastClassDate);
    last.setHours(0, 0, 0, 0);
    if (last < today) {
      return { action: 'keep', target: 'completed', reason: 'last_class_date already passed' };
    }
  }

  if (hasActiveTwin) {
    return {
      action: 'update',
      target: 'inactive',
      reason: 'another active course with same course_number exists',
    };
  }

  return {
    action: 'update',
    target: 'active',
    reason: lastClassDate
      ? 'last_class_date is in the future and no active twin'
      : 'no schedule and no active twin',
  };
};

const fixPrematurelyCompletedCourses = async ({ apply = false, sequelize, verbose = false } = {}) => {
  const ownsSequelize = !sequelize;
  const db = sequelize || new Sequelize({
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  });

  try {
    const completedCourses = await db.query(
      `SELECT id, course_number, course_name, start_date, status
       FROM course
       WHERE status = 'completed'`,
      { type: QueryTypes.SELECT }
    );

    if (completedCourses.length === 0) {
      if (verbose) console.log('[fix-completed] no courses with status=completed found');
      return { keep: [], to_active: [], to_inactive: [], applied: false };
    }

    const courseIds = completedCourses.map((c) => c.id);
    const courseNumbers = [...new Set(completedCourses.map((c) => c.course_number))];

    const lastDates = await db.query(
      `SELECT course_id, MAX(scheduled_date) AS last_class_date
       FROM course_schedule
       WHERE course_id IN (:ids)
       GROUP BY course_id`,
      { type: QueryTypes.SELECT, replacements: { ids: courseIds } }
    );
    const lastDateByCourse = lastDates.reduce((acc, row) => {
      acc[row.course_id] = row.last_class_date;
      return acc;
    }, {});

    const activeTwins = await db.query(
      `SELECT id, course_number
       FROM course
       WHERE status = 'active' AND course_number IN (:nums)`,
      { type: QueryTypes.SELECT, replacements: { nums: courseNumbers } }
    );
    const activeTwinByNumber = activeTwins.reduce((acc, row) => {
      acc[row.course_number] = (acc[row.course_number] || 0) + 1;
      return acc;
    }, {});

    const buckets = { keep: [], to_active: [], to_inactive: [] };

    for (const course of completedCourses) {
      const lastClassDate = lastDateByCourse[course.id] || null;
      const hasActiveTwin = (activeTwinByNumber[course.course_number] || 0) > 0;
      const decision = classify(lastClassDate, hasActiveTwin);

      const row = {
        id: course.id,
        course_number: course.course_number,
        course_name: course.course_name,
        start_date: formatDate(course.start_date),
        last_class_date: formatDate(lastClassDate),
        has_active_twin: hasActiveTwin,
        target: decision.target,
        reason: decision.reason,
      };

      if (decision.action === 'keep') buckets.keep.push(row);
      else if (decision.target === 'active') buckets.to_active.push(row);
      else buckets.to_inactive.push(row);
    }

    if (verbose) {
      const print = (title, items) => {
        console.log(`\n=== ${title} (${items.length}) ===`);
        if (items.length > 0) console.table(items);
      };
      print('LEGITIMATELY COMPLETED (no change)', buckets.keep);
      print('TO REVERT -> active', buckets.to_active);
      print('TO REVERT -> inactive (active twin exists)', buckets.to_inactive);
    }

    const hasUpdates = buckets.to_active.length > 0 || buckets.to_inactive.length > 0;

    if (!apply || !hasUpdates) {
      return { ...buckets, applied: false };
    }

    const transaction = await db.transaction();
    try {
      if (buckets.to_active.length > 0) {
        await db.query(
          `UPDATE course SET status = 'active' WHERE id IN (:ids)`,
          {
            replacements: { ids: buckets.to_active.map((r) => r.id) },
            transaction,
          }
        );
      }
      if (buckets.to_inactive.length > 0) {
        await db.query(
          `UPDATE course SET status = 'inactive' WHERE id IN (:ids)`,
          {
            replacements: { ids: buckets.to_inactive.map((r) => r.id) },
            transaction,
          }
        );
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    console.log(
      `[fix-completed] applied: ${buckets.to_active.length} -> active, ${buckets.to_inactive.length} -> inactive`
    );

    return { ...buckets, applied: true };
  } finally {
    if (ownsSequelize) await db.close();
  }
};

module.exports = fixPrematurelyCompletedCourses;

if (require.main === module) {
  const apply = process.argv.includes('--apply');
  fixPrematurelyCompletedCourses({ apply, verbose: true })
    .then((result) => {
      console.log(
        `\nSummary: keep=${result.keep.length}, to_active=${result.to_active.length}, to_inactive=${result.to_inactive.length}, applied=${result.applied}`
      );
      if (!apply) {
        console.log('\nDry-run only. Re-run with --apply to update the database.');
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error running fix-prematurely-completed-courses:', err);
      process.exit(1);
    });
}
