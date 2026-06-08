const { Sequelize } = require('sequelize');

// Make sure dotenv is loaded so process.env.DATABASE_URL is available
require('dotenv').config({ path: '.env.local' });

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/adamjee_db', { logging: false });

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected.');
    
    await sequelize.query('ALTER TYPE enum_exams_exam_type RENAME TO enum_exams_exam_type_old;');
    await sequelize.query(`CREATE TYPE enum_exams_exam_type AS ENUM ('monthly', 'mid_term', 'comprehensive');`);
    await sequelize.query('ALTER TABLE exams ALTER COLUMN exam_type DROP DEFAULT;');
    await sequelize.query(`
      ALTER TABLE exams 
      ALTER COLUMN exam_type TYPE enum_exams_exam_type 
      USING (
        CASE 
          WHEN exam_type::text = 'midterm' THEN 'mid_term'::enum_exams_exam_type
          WHEN exam_type::text = 'final' THEN 'comprehensive'::enum_exams_exam_type
          WHEN exam_type::text = 'quiz' THEN 'monthly'::enum_exams_exam_type
          ELSE 'monthly'::enum_exams_exam_type
        END
      );
    `);
    await sequelize.query(`ALTER TABLE exams ALTER COLUMN exam_type SET DEFAULT 'monthly'::enum_exams_exam_type;`);
    await sequelize.query('DROP TYPE enum_exams_exam_type_old;');
    
    console.log('ENUM updated successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await sequelize.close();
  }
}
run();
