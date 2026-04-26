"use client";
import { Button } from "@/components/ui/button";
import Tabs from "@/components/ui/tabs";
import Dropdown from "@/components/ui/dropdown";
import BloodGroupSelect from "@/components/ui/blood-group";
import GenderSelect from "@/components/ui/gender-select";
import ClassSelect from "@/components/ui/class-select";
import DepartmentSelect from "@/components/ui/department-select";
import BranchSelect from "@/components/ui/branch-select";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
// import Textarea from '@/components/ui/textarea';
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  Upload,
  FileText,
  X,
  Plus,
  GraduationCap,
  User,
  Users,
  Activity,
  CreditCard,
  Heart,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";

const STUDENT_FORM_TABS = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "academic", label: "Academic Info", icon: GraduationCap },
  { id: "parent", label: "Father Information", icon: Users },
  { id: "medical", label: "Medical & Emergency", icon: Activity },
  { id: "fee", label: "Fees & Transport", icon: CreditCard },
  { id: "documents", label: "Documents", icon: FileText },
];

const StudentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingStudent = null,
  isSubmitting = false,
  branches = [],
  classes = [],
  groups = [],
  academicYears = [],
  departments = [],
  userRole = "BRANCH_ADMIN",
  currentBranchId = null,
}) => {
  const formRef = useRef(null);
  const isInitialLoad = useRef(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [uploading, setUploading] = useState(false);
  const [pendingProfileFile, setPendingProfileFile] = useState(null);
  const [currentBranchIdState, setCurrentBranchIdState] = useState("");
  const [currentGroupIdState, setCurrentGroupIdState] = useState("");
  const [currentClassIdState, setCurrentClassIdState] = useState("");
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [documentsToDelete, setDocumentsToDelete] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [profilePreview, setProfilePreview] = useState(null);

  // Initialize form data
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    dateOfBirth: "",
    gender: "male",
    bloodGroup: "",
    nationality: "Pakistani",
    religion: "",
    cnic: "",

    // Address
    address: {
      street: "",
      city: "",
      state: "",
      country: "Pakistan",
    },

    // Branch → Group → Class → Section → Subjects
    branchId: userRole === "SUPER_ADMIN" ? "" : currentBranchId,
    groupId: "",
    classId: "",
    departmentId: "",
    section: "",
    selectedSubjects: [], // [{id, name, subject_code, fee}]

    // Academic
    rollNumber: "",
    registrationNumber: "",
    admissionDate: new Date().toISOString().split("T")[0],
    academicYear: "", // UUID from academic_years API

    // Parent/Guardian
    father: {
      name: "",
      phone: "",
      cnic: "",
    },
    guardianType: "parent",

    // Fees
    feeMention: "Monthly", // Lump Sum, Instalment, Monthly
    feeDiscount: {
      type: "fixed",
      amount: 0,
      reason: "",
    },
    transportFee: {
      enabled: false,
      routeId: "",
      amount: 0,
    },

    // Medical
    medicalInfo: {
      allergies: "",
      chronicConditions: "",
      medications: "",
      doctorName: "",
      doctorPhone: "",
    },

    // Status
    status: "active",

    // Uploads
    profilePhoto: null,
    documents: [],
  });

  // Load editing student data
  useEffect(() => {
    if (editingStudent && isOpen) {
      setFormData({
        // Personal Info
        firstName: editingStudent.firstName || "",
        lastName: editingStudent.lastName || "",
        email: editingStudent.email || "",
        phone: editingStudent.phone || "",
        alternatePhone: editingStudent.alternatePhone || "",
        dateOfBirth:
          editingStudent.dateOfBirth &&
          !isNaN(new Date(editingStudent.dateOfBirth))
            ? new Date(editingStudent.dateOfBirth).toISOString().split("T")[0]
            : "",
        gender: editingStudent.gender || "male",
        bloodGroup: editingStudent.bloodGroup || "",
        nationality: editingStudent.nationality || "Pakistani",
        religion: editingStudent.religion || "",
        cnic: editingStudent.cnic || "",

        // Address
        address: editingStudent.address || {
          street: "",
          city: "",
          state: "",
          country: "Pakistan",
        },

        // Branch → Group → Class → Section → Subjects
        branchId:
          editingStudent.branchId?._id ||
          editingStudent.branchId ||
          (userRole === "SUPER_ADMIN" ? "" : currentBranchId),
        groupId:
          editingStudent.studentProfile?.groupId ||
          editingStudent.groupId ||
          "",
        classId:
          editingStudent.studentProfile?.classId?._id ||
          editingStudent.studentProfile?.classId ||
          editingStudent.classId ||
          "",
        departmentId: editingStudent.studentProfile?.departmentId?._id || editingStudent.departmentId || "",
        section: editingStudent.studentProfile?.section || editingStudent.section || "",
        selectedSubjects:
          editingStudent.studentProfile?.selectedSubjects ||
          editingStudent.selectedSubjects ||
          [],

        // Academic
        rollNumber: editingStudent.studentProfile?.rollNumber || "",
        registrationNumber: editingStudent.registrationNo || editingStudent.registration_no || "",
        admissionDate:
          editingStudent.studentProfile?.admissionDate &&
          !isNaN(new Date(editingStudent.studentProfile.admissionDate))
            ? new Date(editingStudent.studentProfile.admissionDate)
                .toISOString()
                .split("T")[0]
            : new Date().toISOString().split("T")[0],
        academicYear: editingStudent.studentProfile?.academicYear || "",

        // Parent/Guardian
        father: editingStudent.studentProfile?.father || {
          name: "",
          phone: "",
          cnic: "",
        },
        guardianType: "parent",

        // Academic History
        previousCoaching: editingStudent.studentProfile?.previousCoaching || {
          name: "",
          lastClass: "",
          marks: 0,
          leavingDate: "",
        },

        // Fees
        feeDiscount: editingStudent.studentProfile?.feeDiscount || {
          type: "fixed",
          amount: 0,
          reason: "",
        },
        transportFee: editingStudent.studentProfile?.transportFee || {
          enabled: false,
          routeId: "",
          amount: 0,
        },

        // Medical
        medicalInfo: editingStudent.medicalInfo || {
          allergies: "",
          chronicConditions: "",
          medications: "",
          doctorName: "",
          doctorPhone: "",
        },

        // Emergency Contact
        emergencyContact: editingStudent.emergencyContact || {
          name: "",
          relationship: "",
          phone: "",
        },

        // Status
        status: editingStudent.status || "active",
        feeMention: editingStudent.studentProfile?.feeMention || "Monthly",

        // Uploads
        profilePhoto: editingStudent.profilePhoto || null,
        documents: editingStudent.studentProfile?.documents || editingStudent.details?.documents || [],
      });

      isInitialLoad.current = true;

      // Set profile preview if exists
      if (editingStudent.profilePhoto?.url) {
        setProfilePreview(editingStudent.profilePhoto.url);
      }

      // Initialize cascading states
      const bId = editingStudent.branchId?._id || editingStudent.branchId || (userRole === "SUPER_ADMIN" ? "" : currentBranchId);
      const gId = editingStudent.studentProfile?.groupId || editingStudent.groupId || "";
      const cId = editingStudent.studentProfile?.classId?._id || editingStudent.studentProfile?.classId || "";

      setCurrentBranchIdState(bId);
      setCurrentGroupIdState(gId);
      setCurrentClassIdState(cId);

      // Aggressively populate available lists for editing
      if (groups.length > 0) {
        const filteredGroups = userRole === "BRANCH_ADMIN" ? groups : groups.filter(g => String(g.branch_id || g.branchId) === String(bId));
        setAvailableGroups(filteredGroups);
      }
      if (classes.length > 0) {
        const filteredClasses = classes.filter(cls => String(cls.group_id || cls.groupId) === String(gId));
        setAvailableClasses(filteredClasses);
      }
    } else if (!editingStudent && isOpen) {
      // Reset form for new student
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        alternatePhone: "",
        dateOfBirth: "",
        gender: "male",
        bloodGroup: "",
        nationality: "Pakistani",
        religion: "",
        cnic: "",
        address: {
          street: "",
          city: "",
          state: "",
          country: "Pakistan",
        },
        branchId: userRole === "SUPER_ADMIN" ? "" : currentBranchId,
        groupId: "",
        classId: "",
        departmentId: "",
        section: "",
        selectedSubjects: [],
        rollNumber: "",
        registrationNumber: "",
        admissionDate: new Date().toISOString().split("T")[0],
        academicYear: "",
        father: {
          name: "",
          phone: "",
          cnic: "",
        },
        guardianType: "parent",
        feeMention: "Monthly",
        feeDiscount: {
          type: "fixed",
          amount: 0,
          reason: "",
        },
        transportFee: {
          enabled: false,
          routeId: "",
          amount: 0,
        },
        status: "active",
        profilePhoto: null,
        documents: [],
      });
      setProfilePreview(null);
    }
  }, [editingStudent, isOpen, userRole, currentBranchId]);

  // Update current state trackers when formData changes
  useEffect(() => {
    setCurrentBranchIdState(formData.branchId || "");
    setCurrentGroupIdState(formData.groupId || "");
    setCurrentClassIdState(formData.classId || "");
  }, [formData.branchId, formData.groupId, formData.classId]);

  // Step 1: Filter GROUPS based on selected BRANCH
  useEffect(() => {
    if (userRole === "BRANCH_ADMIN") {
      setAvailableGroups(groups);

      // Reset group if not in groups list AND modal is not in initial load AND groups are already loaded
      if (
        !isInitialLoad.current &&
        currentGroupIdState &&
        groups.length > 0 &&
        !groups.some((g) => String(g.id) === String(currentGroupIdState) || String(g._id) === String(currentGroupIdState))
      ) {
        setFormData((prev) => ({
          ...prev,
          groupId: "",
          classId: "",
          section: "",
          selectedSubjects: [],
        }));
        setCurrentGroupIdState("");
        setCurrentClassIdState("");
      }
    } else if (currentBranchIdState && groups.length > 0) {
      const filtered = groups.filter(
        (g) => String(g.branch_id) === String(currentBranchIdState) || String(g.branchId) === String(currentBranchIdState)
      );
      setAvailableGroups(filtered);

      // Reset group if not in filtered list
      if (
        currentGroupIdState &&
        !filtered.some((g) => String(g.id) === String(currentGroupIdState) || String(g._id) === String(currentGroupIdState))
      ) {
        setFormData((prev) => ({
          ...prev,
          groupId: "",
          classId: "",
          section: "",
          selectedSubjects: [],
        }));
        setCurrentGroupIdState("");
        setCurrentClassIdState("");
      }
    } else {
      setAvailableGroups([]);
    }
  }, [currentBranchIdState, groups, userRole, currentGroupIdState]);

  // Step 2: Filter CLASSES based on selected GROUP
  useEffect(() => {
    if (currentGroupIdState && classes.length > 0) {
      const filtered = classes.filter((cls) => {
        const matchesGroup = String(cls.group_id || cls.groupId) === String(currentGroupIdState);
        const matchesBranch = userRole === "BRANCH_ADMIN" || String(cls.branch_id || cls.branchId) === String(currentBranchIdState);
        return matchesGroup && matchesBranch;
      });
      setAvailableClasses(filtered);

      // Reset class if not in filtered list AND modal is not in initial load AND classes are already loaded
      if (
        !isInitialLoad.current &&
        currentClassIdState &&
        classes.length > 0 &&
        !filtered.some((c) => String(c.id) === String(currentClassIdState) || String(c._id) === String(currentClassIdState))
      ) {
        setFormData((prev) => ({
          ...prev,
          classId: "",
          section: "",
          selectedSubjects: [],
        }));
        setCurrentClassIdState("");
      }
    } else {
      setAvailableClasses([]);
    }
  }, [currentGroupIdState, classes, currentBranchIdState, userRole, currentClassIdState]);

  // Step 3: When CLASS changes, get available SUBJECTS from that class
  useEffect(() => {
    // Determine the class object from either availableClasses (cascaded) or all classes (fallback)
    const allClsList = availableClasses.length > 0 ? availableClasses : classes;
    
    if (currentClassIdState && allClsList.length > 0) {
      const cls = allClsList.find(
        (c) =>
          String(c.id) === String(currentClassIdState) ||
          String(c._id) === String(currentClassIdState),
      );
      setAvailableSubjects(cls?.subjects || []);
    } else {
      setAvailableSubjects([]);
    }

    // Mark initial load as complete after effects have had a chance to run
    if (isInitialLoad.current) {
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 500);
    }
  }, [currentClassIdState, availableClasses]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      if (parent === "transportFee" && child === "enabled") {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: checked,
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === "number" ? parseFloat(value) || 0 : value,
          },
        }));
      }
    } else {
      const newValue = type === "number" ? parseFloat(value) || 0 : value;
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }));

      // Update separate state for cascading dropdowns
      if (name === "branchId") {
        setCurrentBranchIdState(newValue);
        // Reset downstream
        setFormData((prev) => ({
          ...prev,
          groupId: "",
          classId: "",
          section: "",
          selectedSubjects: [],
        }));
        setCurrentGroupIdState("");
        setCurrentClassIdState("");
      } else if (name === "groupId") {
        setCurrentGroupIdState(newValue);
        // Reset downstream
        setFormData((prev) => ({
          ...prev,
          classId: "",
          section: "",
          selectedSubjects: [],
        }));
        setCurrentClassIdState("");
      } else if (name === "classId") {
        setCurrentClassIdState(newValue);
        // Reset downstream
        setFormData((prev) => ({ ...prev, section: "", selectedSubjects: [] }));
      }
    }
  };

  const handleNestedObjectChange = (parent, child, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value,
      },
    }));
  };

  // Derived sections for the currently selected class
  const classSections = useMemo(() => {
    const allClsList = (availableClasses && availableClasses.length > 0) ? availableClasses : (classes || []);
    if (!formData.classId || allClsList.length === 0) return [];
    
    const cls = allClsList.find(
      (c) =>
        String(c.id) === String(formData.classId) ||
        String(c._id) === String(formData.classId),
    );
    return cls?.sections || cls?.Sections || [];
  }, [formData.classId, availableClasses, classes]);

  // When class changes, if section no longer exists, set default to first section or empty
  useEffect(() => {
    if (formData.classId) {
      if (classSections.length > 0) {
        const exists = classSections.some(
          (s) => String(s.name) === String(formData.section),
        );
        if (!exists) {
          setFormData((prev) => ({ ...prev, section: classSections[0].name }));
        }
      } else {
        setFormData((prev) => ({ ...prev, section: "" }));
      }
    }
  }, [formData.classId, classSections]);

  const handleProfileUpload = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Store file for later upload
      setPendingProfileFile(file);
    } catch (error) {
      toast.error("Failed to process profile photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = (file, customName = "") => {
    if (!file) return;

    const newDocument = {
      file,
      type: customName || "other",
      name: customName || file.name,
      customName: customName,
      size: file.size,
      preview: URL.createObjectURL(file),
    };

    setPendingDocuments((prev) => [...prev, newDocument]);
  };

  const removePendingDocument = (index) => {
    setPendingDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const addDocumentToDelete = (documentIndex) => {
    const doc = editingStudent.studentProfile.documents[documentIndex];
    setDocumentsToDelete((prev) => [...prev, doc]);
  };

  const removeDocumentToDelete = (documentIndex) => {
    setDocumentsToDelete((prev) => prev.filter((_, i) => i !== documentIndex));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (userRole === "SUPER_ADMIN" && !formData.branchId) {
      toast.error("Please select a branch");
      return;
    }

    if (!formData.classId) {
      toast.error("Please select a class");
      return;
    }

    if (formData.rollNumber && !/^\d{6}$/.test(formData.rollNumber)) {
      toast.error("Roll Number must be exactly 6 digits");
      return;
    }

    try {
      // Convert profile photo to base64 if exists
      let profilePhotoBase64 = null;
      if (pendingProfileFile) {
        profilePhotoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(pendingProfileFile);
        });
      }

      // Convert documents to base64 if exist
      const documentsBase64 = await Promise.all(
        pendingDocuments.map(async (doc) => {
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(doc.file);
          });
          return {
            ...doc,
            file: base64, // Replace File object with base64 string
          };
        }),
      );

      // --- Selected subjects with manual fees ---
      const subjectsWithFees = (formData.selectedSubjects || []).map((sub) => ({
        id: sub.id,
        name: sub.name,
        subject_code: sub.subject_code,
        fee: sub.fee || 0,
      }));

      // Calculate totals
      const totalSubjectFee = subjectsWithFees.reduce(
        (sum, s) => sum + (parseFloat(s.fee) || 0),
        0,
      );
      let discountAmount = 0;
      if (formData.feeDiscount?.type === "percentage") {
        const discountPercentage = parseFloat(formData.feeDiscount?.amount) || 0;
        discountAmount = totalSubjectFee * (discountPercentage / 100);
      } else {
        discountAmount = parseFloat(formData.feeDiscount?.amount) || 0;
      }
      const payableFee = Math.max(0, totalSubjectFee - discountAmount);

      // --- Map to PostgreSQL backend API format ---
      const submissionData = {
        // User table fields (snake_case for backend)
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.phone, // default password = phone number
        branch_id: formData.branchId,

        // Academic enrollment fields
        academic_year_id: formData.academicYear,
        group_id: formData.groupId,
        class_id: formData.classId,
        section_id: formData.section,
        subjects: subjectsWithFees,
        total_fee: totalSubjectFee,
        discount: discountAmount,
        payable_fee: payableFee,
        roll_no: formData.rollNumber || "",
        registration_no: formData.registrationNumber || "", 

        // Additional info stored in details JSONB
        academic_info: {
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          blood_group: formData.bloodGroup,
          nationality: formData.nationality,
          religion: formData.religion,
          cnic: formData.cnic,
          alternate_phone: formData.alternatePhone,
          address: formData.address,
          admission_date: formData.admissionDate,
          status: formData.status,
          father: formData.father,
          fee_mention: formData.feeMention,
          transport_fee: formData.transportFee,
          medical_info: formData.medicalInfo,
        },

        // Files
        pendingProfileFile: profilePhotoBase64,
        pendingDocuments: documentsBase64,
        documentsToDelete,

        // Editing mode
        isEditMode: !!editingStudent,
        studentId: editingStudent?.id || editingStudent?._id,
      };

      // Call parent onSubmit
      await onSubmit(submissionData);
    } catch (error) {
      console.error("Error preparing submission:", error);
      toast.error("Failed to prepare student data");
    }
  };

  const renderPersonalInfoTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Personal Information</h3>
      </div>

      {/* Profile Photo */}
      <div className="border-b pb-6">
        <label className="block text-sm font-medium mb-3">Profile Photo</label>
        <div className="flex items-center gap-6">
          <div className="relative">
            {profilePreview ? (
              <img
                src={profilePreview}
                alt="Profile preview"
                className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleProfileUpload(e.target.files[0])}
              className="hidden"
              id="profile-upload"
            />
            <label htmlFor="profile-upload" className="cursor-pointer">
              <div className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                <span>
                  {uploading ? "Uploading..." : "Upload Profile Photo"}
                </span>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Recommended: Square image, max 2MB
            </p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Shoaib"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Raza"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Email
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="student@easeacademy.com (Optional)"
            icon={Mail}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Phone <span className="text-red-500">*</span>
          </label>
          <Input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+92 300 1234567"
            icon={Phone}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Alternate Phone
          </label>
          <Input
            type="tel"
            name="alternatePhone"
            value={formData.alternatePhone}
            onChange={handleInputChange}
            placeholder="+92 300 1234567"
            icon={Phone}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">CNIC/B-Form</label>
          <Input
            type="text"
            name="cnic"
            value={formData.cnic}
            onChange={handleInputChange}
            placeholder="XXXXX-XXXXXXX-X"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Date of Birth
          </label>
          <Input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            icon={Calendar}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Gender</label>
          <GenderSelect
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Blood Group</label>
          <BloodGroupSelect
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Nationality</label>
          <Input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            placeholder="Pakistani"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Religion</label>
          <Input
            type="text"
            name="religion"
            value={formData.religion}
            onChange={handleInputChange}
            placeholder="Islam"
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Address Information
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Street Address
            </label>
            <Input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              placeholder="House #, Street, Area"
            />
          </div>
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <Input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                placeholder="Karachi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <Input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                placeholder="Sindh"
              />
            </div>
          </div>
      </div>
    </div>
  );

  // --- Subject toggle handler ---
  const handleSubjectToggle = (subject, isChecked) => {
    setFormData((prev) => {
      const current = prev.selectedSubjects || [];
      if (isChecked) {
        // Add subject with default fee = 0
        return {
          ...prev,
          selectedSubjects: [
            ...current,
            {
              id: subject.id,
              name: subject.name,
              subject_code: subject.subject_code,
              fee: 0,
            },
          ],
        };
      } else {
        // Remove subject
        return {
          ...prev,
          selectedSubjects: current.filter((s) => s.id !== subject.id),
        };
      }
    });
  };

  // --- Update fee for a specific selected subject ---
  const handleSubjectFeeChange = (subjectId, fee) => {
    setFormData((prev) => ({
      ...prev,
      selectedSubjects: (prev.selectedSubjects || []).map((s) =>
        s.id === subjectId ? { ...s, fee: parseFloat(fee) || 0 } : s,
      ),
    }));
  };

  const feeSummary = useMemo(() => {
    const totalSubjectFee = (formData.selectedSubjects || []).reduce(
      (sum, s) => sum + (parseFloat(s.fee) || 0),
      0,
    );
    let discount = 0;
    if (formData.feeDiscount?.type === "percentage") {
      const discountPercentage = parseFloat(formData.feeDiscount?.amount) || 0;
      discount = totalSubjectFee * (discountPercentage / 100);
    } else {
      discount = parseFloat(formData.feeDiscount?.amount) || 0;
    }
    const transportFee = formData.transportFee?.enabled
      ? parseFloat(formData.transportFee?.amount) || 0
      : 0;
    const payable = Math.max(0, totalSubjectFee + transportFee - discount);
    return { totalSubjectFee, discount, transportFee, payable };
  }, [
    formData.selectedSubjects,
    formData.feeDiscount?.amount,
    formData.feeDiscount?.type,
    formData.transportFee,
  ]);

  const renderAcademicInfoTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Academic Information</h3>
      </div>

      {/* Step 1: Branch Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Branch <span className="text-red-500">*</span>
        </label>
        {userRole === "SUPER_ADMIN" ? (
          <BranchSelect
            name="branchId"
            value={formData.branchId}
            onChange={handleInputChange}
            branches={branches}
            placeholder="Select Branch"
            required
          />
        ) : (
          <Input
            value="Auto Configured (Your Branch)"
            readOnly
            className="bg-gray-100 text-gray-500 font-semibold cursor-not-allowed"
          />
        )}
      </div>

      {/* Step 2: Group Selection (cascaded from branch) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Group <span className="text-red-500">*</span>
          </label>
          <Dropdown
            name="groupId"
            value={formData.groupId}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select Group" },
              ...(availableGroups.length > 0 ? availableGroups : groups).map((g) => ({
                value: g.id || g._id,
                label: g.name,
              })),
            ]}
            placeholder="Select Group"
            disabled={!currentBranchIdState && userRole === "SUPER_ADMIN"}
          />
          {(availableGroups.length === 0 && currentBranchIdState) && (
            <p className="text-xs text-amber-600 mt-1">
              No groups found for this branch
            </p>
          )}
        </div>

        {/* Step 3: Class Selection (cascaded from group) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Class <span className="text-red-500">*</span>
          </label>
          <Dropdown
            name="classId"
            value={formData.classId}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select Class" },
              ...(availableClasses.length > 0 ? availableClasses : classes).map((c) => ({
                value: c.id || c._id,
                label: c.name,
              })),
            ]}
            placeholder="Select Class"
            disabled={!formData.groupId}
          />
          {(availableClasses.length === 0 && formData.groupId) && (
            <p className="text-xs text-amber-600 mt-1">
              No classes found for this group
            </p>
          )}
        </div>
      </div>

      {/* Step 4: Section (cascaded from class) + Academic Year */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Section <span className="text-red-500">*</span>
          </label>
          {classSections && classSections.length > 0 ? (
            <Dropdown
              name="section"
              value={formData.section}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, section: e.target.value }))
              }
              options={[
                { value: "", label: "Select Section" },
                ...classSections.map((s) => ({
                  value: s.id || s.name,
                  label: s.name,
                })),
              ]}
              placeholder="Select Section"
              disabled={!formData.classId}
            />
          ) : (
            <Input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleInputChange}
              placeholder="A"
              disabled={!formData.classId}
            />
          )}
          {classSections.length === 0 && formData.classId && (
            <p className="text-xs text-amber-600 mt-1">
              No sections defined — type manually
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Academic Year <span className="text-red-500">*</span>
          </label>
          <Dropdown
            name="academicYear"
            value={formData.academicYear}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select Academic Year" },
              ...academicYears.map((ay) => ({
                value: ay.id,
                label: `${ay.name}${ay.is_current ? " (Current)" : ""}`,
              })),
            ]}
            placeholder="Select Academic Year"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Admission Date
          </label>
          <Input
            type="date"
            name="admissionDate"
            value={formData.admissionDate}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Step 5: Course / Subject Selection with Manual Fee */}
      {formData.classId && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold mb-4">Courses / Subjects</h4>
          {availableSubjects.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-2">
                Select courses and enter fee for each course:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableSubjects.map((subject) => {
                  const isSelected = (formData.selectedSubjects || []).some(
                    (s) => s.id === subject.id,
                  );
                  const selectedSub = (formData.selectedSubjects || []).find(
                    (s) => s.id === subject.id,
                  );
                  return (
                    <div
                      key={subject.id}
                      className={`border rounded-lg p-4 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            handleSubjectToggle(subject, e.target.checked)
                          }
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{subject.name}</p>
                          {subject.subject_code && (
                            <p className="text-xs text-gray-500">
                              Code: {subject.subject_code}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Manual Fee Input - only visible when selected */}
                      {isSelected && (
                        <div className="mt-3 ml-7">
                          <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Fee (PKR)
                          </label>
                          <Input
                            type="number"
                            value={selectedSub?.fee || 0}
                            onChange={(e) =>
                              handleSubjectFeeChange(subject.id, e.target.value)
                            }
                            placeholder="0"
                            min="0"
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500 text-sm">
                No courses/subjects available for this class
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Add subjects to this class from Academic Management
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fee Summary */}
      {(formData.selectedSubjects || []).length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold mb-3">Fee Summary</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {(formData.selectedSubjects || []).map((sub) => (
              <div key={sub.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{sub.name}</span>
                <span className="font-medium">
                  PKR {parseFloat(sub.fee || 0).toLocaleString()}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Course Fee</span>
                <span className="font-semibold">
                  PKR {feeSummary.totalSubjectFee.toLocaleString()}
                </span>
              </div>
              {feeSummary.discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span>- PKR {feeSummary.discount.toLocaleString()}</span>
                </div>
              )}
              {feeSummary.transportFee > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Transport Fee</span>
                  <span>+ PKR {feeSummary.transportFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold mt-1 pt-1 border-t">
                <span>Payable Fee</span>
                <span className="text-green-700">
                  PKR {feeSummary.payable.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roll Number & Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Registration No{" "}
            <span className="text-xs text-muted-foreground font-normal">
              (Leave blank for auto)
            </span>
          </label>
          <Input
            type="text"
            name="registrationNumber"
            value={formData.registrationNumber}
            onChange={handleInputChange}
            placeholder="e.g. MAL-2026-0001"
            icon={FileText}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Roll Number{" "}
            <span className="text-xs text-muted-foreground font-normal">
              (Leave blank for auto)
            </span>
          </label>
          <Input
            type="text"
            name="rollNumber"
            value={formData.rollNumber}
            onChange={handleInputChange}
            placeholder="6-digit Roll Number"
            icon={GraduationCap}
            maxLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <div className="flex items-center gap-3 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg max-w-fit">
            <button
              type="button"
              role="switch"
              aria-checked={formData.status === "active"}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  status: prev.status === "active" ? "inactive" : "active",
                }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.status === "active"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.status === "active"
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm font-semibold capitalize ${formData.status === "active" ? "text-green-700" : "text-gray-500"}`}
            >
              {formData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Fee Information */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold mb-4">Fee Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Fee Discount Type
            </label>
            <Dropdown
              name="feeDiscount.type"
              value={formData.feeDiscount.type}
              onChange={handleInputChange}
              options={[
                { value: "fixed", label: "Fixed Amount" },
                { value: "percentage", label: "Percentage" },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Discount Amount
            </label>
            <Input
              type="number"
              name="feeDiscount.amount"
              value={formData.feeDiscount.amount}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Fee Mention (Payment Plan) <span className="text-red-500">*</span>
            </label>
            <Dropdown
              name="feeMention"
              value={formData.feeMention}
              onChange={handleInputChange}
              options={[
                { value: "Monthly", label: "Monthly" },
                { value: "Lump Sum", label: "Lump Sum" },
                { value: "Instalment", label: "Instalment" },
              ]}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Discount Reason
            </label>
            <Input
              type="text"
              name="feeDiscount.reason"
              value={formData.feeDiscount.reason}
              onChange={handleInputChange}
              placeholder="Reason for discount"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderMedicalInfoTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Activity className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Medical & Emergency Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Medical Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Blood Group</label>
              <Dropdown
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                options={[
                  { value: "", label: "Unknown" },
                  { value: "A+", label: "A+" },
                  { value: "A-", label: "A-" },
                  { value: "B+", label: "B+" },
                  { value: "B-", label: "B-" },
                  { value: "O+", label: "O+" },
                  { value: "O-", label: "O-" },
                  { value: "AB+", label: "AB+" },
                  { value: "AB-", label: "AB-" },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Allergies</label>
              <Input
                name="medicalInfo.allergies"
                value={formData.medicalInfo.allergies}
                onChange={handleInputChange}
                placeholder="e.g. Peanuts, Penicillin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chronic Conditions</label>
              <Input
                name="medicalInfo.chronicConditions"
                value={formData.medicalInfo.chronicConditions}
                onChange={handleInputChange}
                placeholder="e.g. Asthma, Diabetes"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Emergency Contact</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Contact Name</label>
              <Input
                name="emergencyContact.name"
                value={formData.emergencyContact.name}
                onChange={handleInputChange}
                placeholder="Full Name"
                icon={User}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Relationship</label>
              <Input
                name="emergencyContact.relationship"
                value={formData.emergencyContact.relationship}
                onChange={handleInputChange}
                placeholder="e.g. Uncle, Neighbor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input
                name="emergencyContact.phone"
                value={formData.emergencyContact.phone}
                onChange={handleInputChange}
                placeholder="+92 300 0000000"
                icon={Phone}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeeTransportTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Fees & Transport Configuration</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 border rounded-xl p-6 bg-blue-50/30">
          <h4 className="text-sm font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Fee Management
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Payment Plan (Fee Mention)</label>
              <Dropdown
                name="feeMention"
                value={formData.feeMention}
                onChange={handleInputChange}
                options={[
                  { value: "Monthly", label: "Monthly" },
                  { value: "Lump Sum", label: "Lump Sum" },
                  { value: "Instalment", label: "Instalment" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Discount Type</label>
                <Dropdown
                  name="feeDiscount.type"
                  value={formData.feeDiscount.type}
                  onChange={handleInputChange}
                  options={[
                    { value: "fixed", label: "Fixed Amount" },
                    { value: "percentage", label: "Percentage" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount/Value</label>
                <Input
                  type="number"
                  name="feeDiscount.amount"
                  value={formData.feeDiscount.amount}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Discount Reason</label>
              <Input
                name="feeDiscount.reason"
                value={formData.feeDiscount.reason}
                onChange={handleInputChange}
                placeholder="Why this discount?"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border rounded-xl p-6 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Transport Services
          </h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="transport_enabled"
                checked={formData.transportFee.enabled}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  transportFee: { ...prev.transportFee, enabled: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="transport_enabled" className="text-sm font-medium cursor-pointer">Enable Transport Service</label>
            </div>
            
            {formData.transportFee.enabled && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block text-sm font-medium mb-2">Transport Amount (Monthly)</label>
                  <Input
                    type="number"
                    name="transportFee.amount"
                    value={formData.transportFee.amount}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  const renderParentGuardianTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Father Information
        </h3>
      </div>

      <div className="border border-gray-100 bg-gray-50/30 rounded-xl p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Father's Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="father.name"
              value={formData.father.name}
              onChange={handleInputChange}
              placeholder="e.g. Muhammad Ali"
              icon={User}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              name="father.phone"
              value={formData.father.phone}
              onChange={handleInputChange}
              placeholder="+92 XXX XXXXXXX"
              icon={Phone}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CNIC Number
          </label>
          <Input
            type="text"
            name="father.cnic"
            value={formData.father.cnic}
            onChange={handleInputChange}
            placeholder="XXXXX-XXXXXXX-X"
            maxLength={15}
          />
        </div>
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents</h3>
      </div>

      {/* Document Name Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Document Name
          </label>
          <Input
            type="text"
            placeholder="Enter document name (e.g., B-Form, Birth Certificate, etc.)"
            value={formData.documentName || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, documentName: e.target.value }))
            }
            className="mb-4"
          />
        </div>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => {
              if (!formData.documentName?.trim()) {
                toast.error("Please enter a document name first");
                return;
              }
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
              input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                  handleDocumentUpload(file, formData.documentName.trim());
                  setFormData((prev) => ({ ...prev, documentName: "" })); // Clear the input after upload
                }
              };
              input.click();
            }}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
          <p className="text-sm text-gray-500">
            Supported: PDF, DOC, DOCX, JPG, PNG (Max 5MB per file)
          </p>
        </div>
      </div>

      {/* Uploaded Documents List */}
      {pendingDocuments.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold mb-4">Documents to Upload</h4>
          <div className="space-y-3">
            {pendingDocuments.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.type} • {(doc.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePendingDocument(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Documents (for edit mode) */}
      {editingStudent?.studentProfile?.documents?.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold mb-4">Existing Documents</h4>
          <div className="space-y-3">
            {editingStudent.studentProfile.documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.name || doc.type || "Document"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.type} •{" "}
                      {doc.uploadedAt
                        ? new Date(doc.uploadedAt).toLocaleDateString()
                        : "Recently uploaded"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => addDocumentToDelete(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                    disabled={documentsToDelete.some(
                      (d) => d.publicId === doc.publicId,
                    )}
                  >
                    {documentsToDelete.some((d) => d.publicId === doc.publicId)
                      ? "Marked for Deletion"
                      : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Marked for Deletion */}
      {documentsToDelete.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold mb-4 text-red-600">
            Documents Marked for Deletion
          </h4>
          <div className="space-y-3">
            {documentsToDelete.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      {doc.name || doc.type || "Document"}
                    </p>
                    <p className="text-xs text-red-600">
                      {doc.type} • Marked for deletion
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocumentToDelete(index)}
                  className="text-green-600 hover:text-green-700 text-sm"
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return renderPersonalInfoTab();
      case "academic":
        return renderAcademicInfoTab();
      case "parent":
        return renderParentGuardianTab();
      case "medical":
        return renderMedicalInfoTab();
      case "fee":
        return renderFeeTransportTab();
      case "documents":
        return renderDocumentsTab();
      default:
        return renderPersonalInfoTab();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      closeOnBackdrop={false}
      title={editingStudent ? "Edit Student Record" : "Register New Student"}
      size="2xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
            {activeTab !== "personal" && (
              <Button
                variant="ghost"
                onClick={() => {
                  const tabIndex = STUDENT_FORM_TABS.findIndex(
                    (tab) => tab.id === activeTab,
                  );
                  if (tabIndex > 0) {
                    setActiveTab(STUDENT_FORM_TABS[tabIndex - 1].id);
                  }
                }}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== "documents" ? (
              <Button
                onClick={() => {
                  const tabIndex = STUDENT_FORM_TABS.findIndex(
                    (tab) => tab.id === activeTab,
                  );
                  if (tabIndex < STUDENT_FORM_TABS.length - 1) {
                    setActiveTab(STUDENT_FORM_TABS[tabIndex + 1].id);
                  }
                }}
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {editingStudent ? "Update Student" : "Register Student"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row h-full max-h-[75vh] overflow-hidden -m-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-1 overflow-y-auto">
          {STUDENT_FORM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                {tab.label}
              </button>
            );
          })}

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="px-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Status
              </div>
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                formData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          <div className="max-w-3xl mx-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StudentFormModal;
