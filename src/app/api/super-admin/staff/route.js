import { NextResponse } from "next/server";
import { withAuth, requireRole } from "@/backend/middleware/auth";
import { User } from "@/backend/models/postgres";
import { Branch } from "@/backend/models/postgres";
import { generateStaffQR } from "@/lib/qr-generator";
import { uploadQR } from "@/backend/utils/cloudinary";

// GET - List all staff
async function listStaff(request, currentUser, userDoc) {
  try {
    
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    let filter = { role: "staff" };

    if (branchId) {
      filter.branchId = branchId;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "staffProfile.employeeId": { $regex: search, $options: "i" } },
      ];
    }

    const staff = await User.find(filter)
      .populate("branchId", "name code")
      .select("-passwordHash -refreshToken")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: staff,
      count: staff.length,
    });
  } catch (error) {
    console.error("List staff error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// POST - Create new staff
async function createStaff(request, currentUser, userDoc) {
  try {
    
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      alternatePhone,
      dateOfBirth,
      gender,
      cnic,
      bloodGroup,
      religion,
      nationality,
      address,
      branchId,
      joiningDate,
      staffType,
      designation,
      shift,
      departmentId,
      basicSalary,
      salaryType,
      allowances,
      deductions,
      emergencyContact,
      workingHours,
      uniformDetails,
      bankAccount,
      specializedInfo,
      profilePhoto,
      documents,
    } = body;

    // Validate required fields
    if (!firstName || !email || !branchId || !staffType) {
      return NextResponse.json(
        {
          success: false,
          message: "First name, email, branch, and staff type are required",
        },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 400 },
      );
    }

    // Get branch details for employee ID generation
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return NextResponse.json(
        { success: false, message: "Branch not found" },
        { status: 404 },
      );
    }

    // Generate employee ID
    const year = new Date().getFullYear();
    const staffCount = await User.countDocuments({
      role: "staff",
      branchId: branchId,
    });
    const employeeId = `${branch.code}-S-${year}-${String(staffCount + 1).padStart(3, "0")}`;

    // Create default password
    const defaultPassword = `Staff@${year}`;

    // Create staff user
    const staff = new User({
      role: "staff",
      firstName,
      lastName,
      fullName: `${firstName} ${lastName || ""}`.trim(),
      email,
      phone,
      alternatePhone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      cnic,
      bloodGroup,
      religion,
      nationality: nationality || "Pakistani",
      address,
      branchId,
      passwordHash: defaultPassword, // Will be hashed by pre-save middleware
      profilePhoto: profilePhoto
        ? {
            url: profilePhoto.url,
            publicId: profilePhoto.publicId,
            uploadedAt: new Date(),
          }
        : undefined,
      staffProfile: {
        employeeId,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        staffType,
        designation: designation || undefined,
        shift: shift || undefined,
        departmentId: departmentId || undefined,
        salaryDetails: {
          basicSalary: basicSalary || 0,
          salaryType: salaryType || "monthly",
          allowances: {
            houseRent: allowances?.houseRent || 0,
            medical: allowances?.medical || 0,
            transport: allowances?.transport || 0,
            uniform: allowances?.uniform || 0,
            other: allowances?.other || 0,
          },
          deductions: {
            tax: deductions?.tax || 0,
            providentFund: deductions?.providentFund || 0,
            insurance: deductions?.insurance || 0,
            loan: deductions?.loan || 0,
            other: deductions?.other || 0,
          },
        },
        workingHours:
          workingHours?.startTime ||
          workingHours?.endTime ||
          workingHours?.workingDays?.length > 0
            ? {
                startTime: workingHours.startTime || undefined,
                endTime: workingHours.endTime || undefined,
                breakDuration: workingHours.breakDuration || 60,
                workingDays: workingHours.workingDays || [],
              }
            : undefined,
        uniformDetails:
          uniformDetails?.size ||
          uniformDetails?.quantityIssued ||
          uniformDetails?.lastIssuedDate
            ? {
                size: uniformDetails.size || undefined,
                quantityIssued: uniformDetails.quantityIssued || 2,
                lastIssuedDate: uniformDetails.lastIssuedDate
                  ? new Date(uniformDetails.lastIssuedDate)
                  : undefined,
              }
            : undefined,
        bankAccount:
          bankAccount?.bankName ||
          bankAccount?.accountNumber ||
          bankAccount?.iban
            ? {
                bankName: bankAccount.bankName || undefined,
                accountNumber: bankAccount.accountNumber || undefined,
                iban: bankAccount.iban || undefined,
                branchCode: bankAccount.branchCode || undefined,
              }
            : undefined,
        specializedInfo:
          specializedInfo &&
          Object.keys(specializedInfo).some((key) => {
            if (key === "driverLicense") {
              const dl = specializedInfo.driverLicense;
              return dl && (dl.number || dl.type || dl.expiryDate);
            }
            return specializedInfo[key];
          })
            ? {
                ...(specializedInfo.driverLicense?.number ||
                specializedInfo.driverLicense?.type ||
                specializedInfo.driverLicense?.expiryDate
                  ? {
                      driverLicense: {
                        ...(specializedInfo.driverLicense.number && {
                          number: specializedInfo.driverLicense.number,
                        }),
                        ...(specializedInfo.driverLicense.type && {
                          type: specializedInfo.driverLicense.type,
                        }),
                        ...(specializedInfo.driverLicense.expiryDate && {
                          expiryDate: new Date(
                            specializedInfo.driverLicense.expiryDate,
                          ),
                        }),
                      },
                    }
                  : {}),
                ...(specializedInfo.securityBadgeNumber && {
                  securityBadgeNumber: specializedInfo.securityBadgeNumber,
                }),
                ...(specializedInfo.medicalQualification && {
                  medicalQualification: specializedInfo.medicalQualification,
                }),
                ...(specializedInfo.tradeCertificate && {
                  tradeCertificate: specializedInfo.tradeCertificate,
                }),
                ...(specializedInfo.foodHandlingCertificate && {
                  foodHandlingCertificate:
                    specializedInfo.foodHandlingCertificate,
                }),
              }
            : undefined,
        emergencyContact: emergencyContact
          ? {
              name: emergencyContact.name || undefined,
              relationship: emergencyContact.relationship || undefined,
              phone: emergencyContact.phone || undefined,
              alternatePhone: emergencyContact.alternatePhone || undefined,
              address: emergencyContact.address || undefined,
            }
          : undefined,
        documents: documents || [],
      },
      status: "active",
      isActive: true,
      createdBy: currentUser.userId,
    });

    await staff.save();

    // Generate and upload QR code
    try {
      const qrDataURL = await generateStaffQR(staff);
      const qrUpload = await uploadQR(qrDataURL, staff._id.toString(), "staff");

      staff.staffProfile.qr = {
        url: qrUpload.url,
        publicId: qrUpload.publicId,
        uploadedAt: new Date(),
      };
      await staff.save();
    } catch (qrError) {
      console.error("QR generation error:", qrError);
    }

    // Populate branch for response
    await staff.populate("branchId", "name code");

    return NextResponse.json(
      {
        success: true,
        message: "Staff created successfully",
        data: staff,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// PUT - Update staff
async function updateStaff(request, currentUser, userDoc) {
  try {
    
    const staffId = request.nextUrl.pathname.split("/").pop();
    const body = await request.json();

    console.log("Update staff - received data:", {
      staffId,
      staffType: body.staffType,
      hasStaffProfile: !!body.staffType,
    });

    const {
      firstName,
      lastName,
      phone,
      alternatePhone,
      dateOfBirth,
      gender,
      cnic,
      bloodGroup,
      religion,
      nationality,
      address,
      branchId,
      joiningDate,
      staffType,
      designation,
      shift,
      departmentId,
      basicSalary,
      salaryType,
      allowances,
      deductions,
      emergencyContact,
      workingHours,
      uniformDetails,
      bankAccount,
      specializedInfo,
      profilePhoto,
      documents,
    } = body;

    // Find staff member
    const staff = await User.findOne({ _id: staffId, role: "staff" });
    if (!staff) {
      return NextResponse.json(
        { success: false, message: "Staff member not found" },
        { status: 404 },
      );
    }

    // Update basic fields
    if (firstName) staff.firstName = firstName;
    if (lastName !== undefined) staff.lastName = lastName;
    staff.fullName = `${staff.firstName} ${staff.lastName || ""}`.trim();
    if (phone !== undefined) staff.phone = phone;
    if (alternatePhone !== undefined) staff.alternatePhone = alternatePhone;
    if (dateOfBirth !== undefined)
      staff.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    if (gender !== undefined) staff.gender = gender;
    if (cnic !== undefined) staff.cnic = cnic;
    if (bloodGroup !== undefined) staff.bloodGroup = bloodGroup;
    if (religion !== undefined) staff.religion = religion;
    if (nationality !== undefined) staff.nationality = nationality;
    if (address !== undefined) staff.address = address;
    if (branchId !== undefined) staff.branchId = branchId;
    if (profilePhoto !== undefined)
      staff.profilePhoto = profilePhoto
        ? {
            url: profilePhoto.url,
            publicId: profilePhoto.publicId,
            uploadedAt: new Date(),
          }
        : undefined;

    // Update staff profile fields
    if (!staff.staffProfile) staff.staffProfile = {};

    if (joiningDate !== undefined) {
      staff.staffProfile.joiningDate = joiningDate
        ? new Date(joiningDate)
        : undefined;
    }

    // Validate staffType if provided
    if (staffType !== undefined) {
      if (!staffType) {
        return NextResponse.json(
          { success: false, message: "Staff type cannot be empty" },
          { status: 400 },
        );
      }
      staff.staffProfile.staffType = staffType;
    }

    if (designation !== undefined)
      staff.staffProfile.designation = designation || undefined;
    if (shift !== undefined) staff.staffProfile.shift = shift || undefined;
    if (departmentId !== undefined)
      staff.staffProfile.departmentId = departmentId || undefined;

    // Update salary details
    if (
      basicSalary !== undefined ||
      salaryType !== undefined ||
      allowances !== undefined ||
      deductions !== undefined
    ) {
      if (!staff.staffProfile.salaryDetails)
        staff.staffProfile.salaryDetails = {};

      if (basicSalary !== undefined)
        staff.staffProfile.salaryDetails.basicSalary = basicSalary || 0;
      if (salaryType !== undefined)
        staff.staffProfile.salaryDetails.salaryType = salaryType || "monthly";

      if (allowances !== undefined) {
        staff.staffProfile.salaryDetails.allowances = {
          houseRent: allowances.houseRent || 0,
          medical: allowances.medical || 0,
          transport: allowances.transport || 0,
          uniform: allowances.uniform || 0,
          other: allowances.other || 0,
        };
      }

      if (deductions !== undefined) {
        staff.staffProfile.salaryDetails.deductions = {
          tax: deductions.tax || 0,
          providentFund: deductions.providentFund || 0,
          insurance: deductions.insurance || 0,
          loan: deductions.loan || 0,
          other: deductions.other || 0,
        };
      }
    }

    // Update working hours
    if (workingHours !== undefined) {
      if (
        workingHours.startTime ||
        workingHours.endTime ||
        workingHours.workingDays?.length > 0
      ) {
        staff.staffProfile.workingHours = {
          startTime: workingHours.startTime || undefined,
          endTime: workingHours.endTime || undefined,
          breakDuration: workingHours.breakDuration || 60,
          workingDays: workingHours.workingDays || [],
        };
      } else {
        staff.staffProfile.workingHours = undefined;
      }
    }

    // Update uniform details
    if (uniformDetails !== undefined) {
      if (
        uniformDetails.size ||
        uniformDetails.quantityIssued ||
        uniformDetails.lastIssuedDate
      ) {
        staff.staffProfile.uniformDetails = {
          size: uniformDetails.size || undefined,
          quantityIssued: uniformDetails.quantityIssued || 2,
          lastIssuedDate: uniformDetails.lastIssuedDate
            ? new Date(uniformDetails.lastIssuedDate)
            : undefined,
        };
      } else {
        staff.staffProfile.uniformDetails = undefined;
      }
    }

    // Update bank account
    if (bankAccount !== undefined) {
      if (
        bankAccount.bankName ||
        bankAccount.accountNumber ||
        bankAccount.iban
      ) {
        staff.staffProfile.bankAccount = {
          bankName: bankAccount.bankName || undefined,
          accountNumber: bankAccount.accountNumber || undefined,
          iban: bankAccount.iban || undefined,
          branchCode: bankAccount.branchCode || undefined,
        };
      } else {
        staff.staffProfile.bankAccount = undefined;
      }
    }

    // Update specialized info
    if (specializedInfo !== undefined) {
      staff.staffProfile.specializedInfo =
        specializedInfo && Object.keys(specializedInfo).length > 0
          ? specializedInfo
          : undefined;
    }

    // Update emergency contact
    if (emergencyContact !== undefined) {
      staff.staffProfile.emergencyContact = emergencyContact
        ? {
            name: emergencyContact.name || undefined,
            relationship: emergencyContact.relationship || undefined,
            phone: emergencyContact.phone || undefined,
            alternatePhone: emergencyContact.alternatePhone || undefined,
            address: emergencyContact.address || undefined,
          }
        : undefined;
    }

    // Update documents
    if (documents !== undefined) {
      staff.staffProfile.documents = documents || [];
    }

    staff.updatedBy = currentUser.userId;
    await staff.save();

    // Populate branch for response
    await staff.populate("branchId", "name code");

    return NextResponse.json({
      success: true,
      message: "Staff updated successfully",
      data: staff,
    });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export const GET = withAuth(listStaff, [requireRole(["super_admin"])]);
export const POST = withAuth(createStaff, [requireRole(["super_admin"])]);
export const PUT = withAuth(updateStaff, [requireRole(["super_admin"])]);
