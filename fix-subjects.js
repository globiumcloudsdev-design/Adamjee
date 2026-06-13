const { Sequelize, DataTypes, Op } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

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

async function analyzeAndFix() {
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
          
          // Print current state
          console.log(`GR No: ${rollNo} | Name: ${u.first_name} | Subjects: ${JSON.stringify(subjects)}`);

          // If you want to automatically clean ghosts instead of fully clearing, we can filter out strings:
          // const cleanedSubjects = subjects.filter(s => typeof s === 'object' && s.id);
          // But user said: "srf subjects remove hon", so let's just clear them.
          
          if (subjects.length > 0) {
             const newDetails = { ...u.details };
             if (!newDetails.academic_info) newDetails.academic_info = {};
             
             // UNCOMMENT NEXT TWO LINES TO ACTUALLY CLEAR THEM
             // newDetails.academic_info.subjects = [];
             // await User.update({ details: newDetails }, { where: { id: u.id } });
             
             studentsWithSubjectsCleared++;
          }
        }
      }
    }
    
    console.log(`Total students with GR <= 35: ${affectedStudents}`);
    console.log(`Total that would be cleared: ${studentsWithSubjectsCleared}`);
    console.log('\nNOTE: The script is currently in DRY RUN mode. It only printed the data. Edit the script to uncomment the update lines to clear subjects.');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

analyzeAndFix();
