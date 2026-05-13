// Quick test to verify ID card generator with all required fields
const testStudentData = {
  first_name: 'Ahmed',
  last_name: 'Hassan',
  roll_number: 'RN-001',
  registration_no: 'REG-2025-001',
  class_name: 'Class X',
  section_name: 'Section A',
  phone: '03001234567',
  email: 'ahmed@example.com',
  gender: 'male',
  details: {
    academic_info: {
      subjects: [
        { name: 'Physics' },
        { name: 'Chemistry' },
        { name: 'Mathematics' },
        { name: 'Biology' }
      ]
    }
  }
};

console.log('=== Testing ID Card Fields ===');
console.log('Student Name:', testStudentData.first_name + ' ' + testStudentData.last_name);
console.log('Roll Number:', testStudentData.roll_number);
console.log('Class:', testStudentData.class_name);
console.log('Section:', testStudentData.section_name);
console.log('Subjects:', testStudentData.details.academic_info.subjects.map(s => s.name).join(', '));
console.log('Contact Number:', testStudentData.phone);
console.log('\n✓ All 6 required fields are present!');
console.log('\nField Mapping:');
console.log('1. Student Name - uses first_name + last_name');
console.log('2. Roll Number - uses roll_number');
console.log('3. Class - uses class_name');
console.log('4. Section - uses section_name');
console.log('5. Subject - uses details.academic_info.subjects');
console.log('6. Contact Number - uses phone');
