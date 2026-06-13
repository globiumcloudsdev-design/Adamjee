const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, primaryKey: true },
  email: DataTypes.STRING,
  first_name: DataTypes.STRING,
  role: DataTypes.STRING,
  branch_id: DataTypes.UUID,
  details: DataTypes.JSONB
}, { tableName: 'users', timestamps: false });

const Branch = sequelize.define('Branch', {
  id: { type: DataTypes.UUID, primaryKey: true },
  name: DataTypes.STRING
}, { tableName: 'branches', timestamps: false });

async function findStudents() {
  try {
    // 1. Find Admin
    const admin = await User.findOne({ where: { email: 'adamjeec35@gmail.com' } });
    if (!admin) {
      console.log('Admin adamjeec35@gmail.com not found!');
      process.exit(1);
    }
    
    console.log('Found Admin:', admin.first_name);
    console.log('Branch ID:', admin.branch_id);

    const branch = await Branch.findByPk(admin.branch_id);
    console.log('Branch Name:', branch ? branch.name : 'Unknown');

    // 2. Find Students in this branch
    const students = await User.findAll({ 
      where: { 
        branch_id: admin.branch_id,
        role: 'STUDENT'
      } 
    });

    console.log(`Total students in branch: ${students.length}`);

    let affectedStudents = 0;
    let studentsWithSubjectsCleared = 0;

    for (let u of students) {
      const rollNoStr = u.details?.academic_info?.roll_no;
      if (rollNoStr) {
        const rollNo = parseInt(rollNoStr, 10);
        // Only target GR No 35 and below
        if (!isNaN(rollNo) && rollNo <= 35) {
          affectedStudents++;
          const subjects = u.details?.academic_info?.subjects || [];
          console.log(`GR No: ${rollNo} | Name: ${u.first_name} | Subjects count: ${subjects.length}`);

          if (subjects.length > 0) {
             const newDetails = { ...u.details };
             if (!newDetails.academic_info) newDetails.academic_info = {};
             
             // ACTUALLY CLEAR THEM
             newDetails.academic_info.subjects = [];
             await User.update({ details: newDetails }, { where: { id: u.id } });
             
             studentsWithSubjectsCleared++;
          }
        }
      }
    }
    
    console.log(`\nFound exactly ${affectedStudents} students with GR No <= 35.`);
    console.log(`Cleared subjects for ${studentsWithSubjectsCleared} students.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findStudents();
