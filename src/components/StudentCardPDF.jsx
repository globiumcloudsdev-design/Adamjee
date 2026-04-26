import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Defs, LinearGradient, Stop, Rect } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  card: {
    width: 204,
    height: 340,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
  },
  frontSide: {},
  backSide: {},
  leftBorderSvg: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 4,
    height: 340,
  },
  rightBorderSvg: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 4,
    height: 340,
  },
  headerAccentSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
  },
  bottomAccentSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
  },
  header: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 1,
    paddingTop: 3,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#93C5FD',
    marginBottom: 4,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  titleContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
  },
  content: {
    padding: 12,
    flex: 1,
  },
  photoContainer: {
    width: 64,
    height: 80,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  photo: {
    width: 60,
    height: 76,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 1.2,
  },
  infoText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
    lineHeight: 1.2,
  },
  infoTextBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
    lineHeight: 1.2,
  },
  genderText: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 1.2,
  },
  qrContainer: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    alignSelf: 'center',
  },
  qrCode: {
    width: 76,
    height: 76,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  backContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  detailsSection: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    width: 40,
  },
  detailValue: {
    fontSize: 9,
    color: '#374151',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    borderStyle: 'dashed',
    minHeight: 12,
    paddingHorizontal: 2,
  },
  infoSection: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  infoList: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
    marginBottom: 2,
  },
  signatureSection: {
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    paddingTop: 8,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    borderStyle: 'dashed',
    height: 16,
  },
  foldLine: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  foldBar: {
    width: 2,
    height: '100%',
    backgroundColor: '#9CA3AF',
  },
  foldText: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 8,
    transform: 'rotate(-90deg)',
  },
  backLogoContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#93C5FD',
    marginBottom: 4,
  },
  backLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  backTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 2,
  },
  backSubtitle: {
    fontSize: 10,
    color: '#2563EB',
    textAlign: 'center',
  },
});

// StudentCardPDF Component
const StudentCardPDF = ({ student, qrCodeUrl, classes = [] }) => {
  const studentName = `${student.firstName} ${student.lastName}`;
  const studentId = student.studentProfile?.registrationNumber || student.admissionNumber || 'Not Assigned';
  const studentClass = (() => {
    const classId = student.studentProfile?.classId?._id || student.studentProfile?.classId || student.classId;
    const classObj = classes.find(c => c._id === classId);
    return classObj?.name || student.studentProfile?.classId?.name || student.classId?.name || 'Not Assigned';
  })();
  const fatherName = student.parentInfo?.fatherName || student.guardianInfo?.name || student.studentProfile?.father?.name || student.studentProfile?.guardian?.name || '';
  const parentLabel = (() => {
    const guardianName = student.guardianInfo?.name || student.studentProfile?.guardian?.name;
    const fatherName = student.parentInfo?.fatherName || student.studentProfile?.father?.name;
    if (guardianName) return 'Guardian:';
    if (fatherName) return 'Father:';
    return 'Parent:';
  })();
  const dob = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const bloodGroup = student.bloodGroup || '';

  return (
    <Document>
      <Page size={[468, 740]} style={styles.page}>
        {/* Front Side */}
        <View style={[styles.card, styles.frontSide]}>
          {/* Left border line */}
          <View style={styles.leftBorderSvg}>
            <Svg width="4" height="340">
              <Defs>
                <LinearGradient id="leftBorderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#2563EB" />
                  <Stop offset="50%" stopColor="#16A34A" />
                  <Stop offset="100%" stopColor="#2563EB" />
                </LinearGradient>
              </Defs>
              <Rect width="4" height="340" fill="url(#leftBorderGradient)" />
            </Svg>
          </View>

          {/* Header with curved accents */}
          <View style={styles.headerAccentSvg}>
            <Svg width="204" height="8">
              <Defs>
                <LinearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#2563EB" />
                  <Stop offset="100%" stopColor="#16A34A" />
                </LinearGradient>
              </Defs>
              <Rect width="204" height="8" fill="url(#headerGradient)" rx="8" ry="8" />
            </Svg>
          </View>

          {/* Header */}
          <View style={styles.header}>
            {/* Institute Logo - Larger Size */}
            <View style={styles.logoContainer}>
              <Image
                style={styles.logo}
                src="/easeacademy_logo.jpg"
                // Fallback if image fails
                onError={() => {
                  return (
                    <View style={{ width: 56, height: 56, backgroundColor: '#3B82F6', borderRadius: 28, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>EA</Text>
                    </View>
                  );
                }}
              />
            </View>

            {/* Program Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>ADAMJEE COACHING</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={{ flexDirection: 'row' }}>
              {/* Student Photo */}
              <View style={styles.photoContainer}>
                {student.profilePhoto?.url ? (
                  <Image style={styles.photo} src={student.profilePhoto.url} />
                ) : (
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Photo</Text>
                )}
              </View>

              {/* Student Details */}
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{studentName}</Text>
                <Text style={styles.infoText}>
                  <Text style={{ fontWeight: 'bold' }}>Class: </Text>
                  {studentClass}
                </Text>
                <Text style={styles.infoTextBold}>
                  <Text style={{ fontWeight: 'normal', color: '#374151' }}>ID: </Text>
                  {studentId}
                </Text>
                <Text style={styles.genderText}>
                  <Text style={{ fontWeight: 'bold' }}>Gender: </Text>
                  {student.gender}
                </Text>
              </View>
            </View>

            {/* QR Code at Bottom - Larger Size */}
            <View style={styles.qrContainer}>
              {qrCodeUrl ? (
                <Image style={styles.qrCode} src={qrCodeUrl} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, color: '#6B7280' }}>QR CODE</Text>
                  <Text style={{ fontSize: 7, color: '#9CA3AF' }}>(Scan for details)</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom accent */}
          <View style={styles.bottomAccentSvg}>
            <Svg width="204" height="12">
              <Defs>
                <LinearGradient id="backBottomGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#2563EB" />
                  <Stop offset="100%" stopColor="#16A34A" />
                </LinearGradient>
              </Defs>
              <Rect width="204" height="12" fill="url(#backBottomGradient)" rx="8" ry="8" />
            </Svg>
          </View>
        </View>

        {/* Fold Line */}
        <View style={styles.foldLine}>
          <View style={styles.foldBar} />
          <Text style={styles.foldText}>FOLD HERE</Text>
        </View>

        {/* Back Side */}
        <View style={[styles.card, styles.backSide]}>
          {/* Right border line */}
          <View style={styles.rightBorderSvg}>
            <Svg width="4" height="340">
              <Defs>
                <LinearGradient id="rightBorderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#2563EB" />
                  <Stop offset="50%" stopColor="#16A34A" />
                  <Stop offset="100%" stopColor="#2563EB" />
                </LinearGradient>
              </Defs>
              <Rect width="4" height="340" fill="url(#rightBorderGradient)" />
            </Svg>
          </View>

          {/* Header with curved accents */}
          <View style={styles.headerAccentSvg}>
            <Svg width="204" height="8">
              <Defs>
                <LinearGradient id="backHeaderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#2563EB" />
                  <Stop offset="100%" stopColor="#16A34A" />
                </LinearGradient>
              </Defs>
              <Rect width="204" height="8" fill="url(#backHeaderGradient)" rx="8" ry="8" />
            </Svg>
          </View>

          {/* Header */}
          <View style={styles.header}>
            {/* Coaching Logo - Larger Size */}
            <View style={styles.backLogoContainer}>
              <Image
                style={styles.backLogo}
                src="/easeacademy_logo.jpg"
                // Fallback if image fails
                onError={() => {
                  return (
                    <View style={{ width: 48, height: 48, backgroundColor: '#3B82F6', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' }}>EA</Text>
                    </View>
                  );
                }}
              />
            </View>

            <Text style={styles.backTitle}>ADAMJEE COACHING</Text>
            <Text style={styles.backSubtitle}>Student ID Card</Text>
          </View>

          {/* Content */}
          <View style={styles.backContent}>
            {/* Student Details - Top Section */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Student Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{parentLabel}</Text>
                <Text style={styles.detailValue}>{fatherName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>DOB:</Text>
                <Text style={styles.detailValue}>{dob}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Blood Group:</Text>
                <Text style={styles.detailValue}>{bloodGroup}</Text>
              </View>
            </View>

            {/* Important Information - Middle Section */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Important Information</Text>
              <Text style={styles.infoList}>• This card is non-transferable</Text>
              <Text style={styles.infoList}>• Must be carried at all times</Text>
              <Text style={styles.infoList}>• Report loss immediately to office</Text>
              <Text style={styles.infoList}>• Valid for academic year only</Text>
            </View>

            {/* Signature Area */}
            <View style={styles.signatureSection}>
              <Text style={styles.signatureLabel}>Authorized Signature</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>

          {/* Bottom accent */}
          <View style={styles.bottomAccentSvg}>
            <Svg width="204" height="12">
              <Defs>
                <LinearGradient id="frontBottomGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#2563EB" />
                  <Stop offset="100%" stopColor="#16A34A" />
                </LinearGradient>
              </Defs>
              <Rect width="204" height="12" fill="url(#frontBottomGradient)" rx="8" ry="8" />
            </Svg>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default StudentCardPDF;





