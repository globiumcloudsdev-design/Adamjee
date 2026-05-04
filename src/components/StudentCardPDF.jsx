import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// VIP Design Styles (react-pdf compatible)
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  card: {
    width: 204,
    height: 340,
    backgroundColor: '#000000',
    borderRadius: 15,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  goldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#FFD700',
  },
  logoContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  goldCircle: {
    width: 90,
    height: 90,
    backgroundColor: '#FFD700',
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  headerTextContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  coachingName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  coachingTagline: {
    fontSize: 5,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 1,
  },
  content: {
    marginTop: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  photoWrapper: {
    width: 100,
    height: 110,
    borderWidth: 3,
    borderColor: '#FFD700',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontSize: 8,
    color: '#000000',
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 2,
  },
  regNo: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoGrid: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 8,
    borderWidth: 0.5,
    borderColor: '#222222',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 6,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 7,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 25,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000000',
  },
  backContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWrapper: {
    width: 150,
    height: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  backStudentName: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  backRegNo: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 2,
  },
  instructions: {
    marginTop: 30,
    width: '100%',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  instructionText: {
    fontSize: 5,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 2,
  },
  website: {
    marginTop: 10,
    fontSize: 7,
    color: '#FFD700',
    fontWeight: 'bold',
  }
});

const looksLikeIdValue = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  return (
    /^\d+$/.test(trimmed) ||
    /^[0-9a-f]{24}$/i.test(trimmed) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)
  );
};

const resolveSectionName = (student) => {
  const details = student?.details || {};
  const academicInfo = details?.academic_info || {};

  const candidates = [
    student?.section_name,
    student?.sectionName,
    student?.section?.name,
    academicInfo?.section_name,
    academicInfo?.section?.name,
    details?.section_name,
    details?.section?.name,
    student?.section,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed && !looksLikeIdValue(trimmed)) return trimmed;
    }
  }

  return 'N/A';
};

const StudentCardPDF = ({ student, qrCodeUrl, coachingLogo }) => {
  if (!student) return null;

  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student Name";
  const regNo = student.registration_no || "N/A";
  const className = student.class_name || "N/A";
  const sectionName = resolveSectionName(student);
  const groupName = student.group_name || "N/A";
  const branchName = student.branch_name || "Main Campus";

  return (
    <Document>
      <Page size={[500, 800]} style={styles.page}>
        {/* FRONT SIDE */}
        <View style={styles.card}>
          <View style={styles.goldBar} />
          <View style={styles.logoContainer}>
            <View style={styles.goldCircle}>
              {coachingLogo ? (
                <Image style={styles.logo} src={coachingLogo} />
              ) : (
                <Text style={styles.placeholderText}>LOGO</Text>
              )}
            </View>
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.coachingName}>ADAMJEE COACHING CENTRE</Text>
            <Text style={styles.coachingTagline}>THE BEST IN COACHING</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.photoWrapper}>
              {student.avatar_url ? (
                <Image style={styles.photo} src={student.avatar_url} />
              ) : (
                <Text style={{ fontSize: 8, color: '#000' }}>PHOTO</Text>
              )}
            </View>

            <Text style={styles.studentName}>{fullName}</Text>
            <Text style={styles.regNo}>ID NO. {regNo}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>CLASS</Text>
                <Text style={styles.infoValue}>{className}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>SECTION</Text>
                <Text style={styles.infoValue}>{sectionName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>GROUP</Text>
                <Text style={styles.infoValue}>{groupName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.branchName}>{branchName}</Text>
          </View>
        </View>

        {/* BACK SIDE */}
        <View style={styles.card}>
          <View style={styles.backContent}>
            <View style={styles.qrWrapper}>
              {qrCodeUrl ? (
                <Image style={styles.qrImage} src={qrCodeUrl} />
              ) : (
                <Text style={{ fontSize: 10, color: '#000' }}>QR</Text>
              )}
            </View>

            <Text style={styles.backStudentName}>{fullName}</Text>
            <Text style={styles.backRegNo}>ID: {regNo}</Text>

            <View style={styles.instructions}>
              <Text style={styles.instructionText}>• This card is non-transferable</Text>
              <Text style={styles.instructionText}>• Must be carried at all times for attendance</Text>
              <Text style={styles.instructionText}>• Valid for academic session 2025-26</Text>
            </View>

            <Text style={styles.website}>www.adamjee.edu.pk</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default StudentCardPDF;





