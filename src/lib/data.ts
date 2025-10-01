

export type Student = {
  id: string;
  admissionNo: string;
  name: string;
  class: string;
  section: string;
  roll: number;
  fatherName: string;
  phone: string;
  avatar: string;
  dob?: string;
  gender?: string;
  religion?: string;
  bloodGroup?: string;
  nationality?: string;
  email?: string;
  department?: string[];
  residency?: string[];
  fatherPhone?: string;
  fatherOccupation?: string;
  fatherNid?: string;
  motherName?: string;
  motherPhone?: string;
  motherOccupation?: string;
  motherNid?: string;
  permanentVillage?: string;
  permanentPost?: string;
  permanentUpazila?: string;
  permanentDistrict?: string;
  presentVillage?: string;
  presentPost?: string;
  presentUpazila?: string;
  presentDistrict?: string;
  previousSchool?: string;
  previousClass?: string;
  previousRoll?: string;
  transferReason?: string;
};

// This static data is no longer the primary source.
// It can be used for reference or seeding the database, but the app will now use Firestore.
export const studentData: Student[] = [
  { id: 's001', admissionNo: '2025-001', name: 'আরিফ আহমেদ', class: 'দশম', section: 'A', roll: 1, fatherName: 'মোঃ আব্দুল হামিদ', phone: '01712345678', avatar: 'https://picsum.photos/80/80?random=1' },
  { id: 's002', admissionNo: '2025-002', name: 'সুমাইয়া ইসলাম', class: 'দশম', section: 'B', roll: 2, fatherName: 'মোঃ লাভলু সেখ', phone: '01812345679', avatar: 'https://picsum.photos/80/80?random=2' },
  { id: 's003', admissionNo: '2025-003', name: 'ইমরান খান', class: 'দশম', section: 'A', roll: 3, fatherName: 'Md Hamed Ali', phone: '01912345680', avatar: 'https://picsum.photos/80/80?random=3' },
  { id: 's004', admissionNo: '2026-001', name: 'ফারিয়া জাহান', class: 'নবম', section: 'A', roll: 1, fatherName: 'মোঃ সালমান ফারসি', phone: '01612345681', avatar: 'https://picsum.photos/80/80?random=4' },
  { id: 's005', admissionNo: '2026-002', name: 'রাকিব হাসান', class: 'নবম', section: 'B', roll: 2, fatherName: 'মোঃ আব্দুল্লাহ', phone: '01512345682', avatar: 'https://picsum.photos/80/80?random=5' },
  { id: 's006', admissionNo: '2027-001', name: 'নুসরাত চৌধুরী', class: 'অষ্টম', section: 'A', roll: 1, fatherName: 'মোঃ শফিক', phone: '01412345683', avatar: 'https://picsum.photos/80/80?random=6' },
  { id: 's007', admissionNo: '2027-002', name: 'মেহেদি আলম', class: 'অষ্টম', section: 'B', roll: 2, fatherName: 'মোঃ জাহিদ', phone: '01312345684', avatar: 'https://picsum.photos/80/80?random=7' },
  { id: 's008', admissionNo: '2028-001', name: 'সাদিয়া আফরিন', class: 'সপ্তম', section: 'A', roll: 1, fatherName: 'মোঃ হাসান', phone: '01722345685', avatar: 'https://picsum.photos/80/80?random=8' },
  { id: 's009', admissionNo: '2028-002', name: 'তানভীর রহমান', class: 'সপ্তম', section: 'B', roll: 2, fatherName: 'মোঃ ইকবাল', phone: '01822345686', avatar: 'https://picsum.photos/80/80?random=9' },
  { id: 's010', admissionNo: '2029-001', name: 'জান্নাতুল ফেরদৌস', class: 'ষষ্ঠ', section: 'A', roll: 1, fatherName: 'মোঃ কবির', phone: '01922345687', avatar: 'https://picsum.photos/80/80?random=10' },
];


export type Parent = {
  id: string;
  name: string;
  occupation: string;
  phone: string;
  email: string;
  avatar: string;
};

export const parentData: Parent[] = [
    { id: 'p001', name: 'মোঃ আব্দুল হামিদ', occupation: 'ব্যবসায়ী', phone: '01712345678', email: 'abdul.hamid@example.com', avatar: 'https://picsum.photos/80/80?random=11' },
    { id: 'p002', name: 'মোঃ লাভলু সেখ', occupation: 'শিক্ষক', phone: '01812345679', email: 'lablu.sheikh@example.com', avatar: 'https://picsum.photos/80/80?random=12' },
    { id: 'p003', name: 'Md Hamed Ali', occupation: 'প্রকৌশলী', phone: '01912345680', email: 'hamed.ali@example.com', avatar: 'https://picsum.photos/80/80?random=13' },
    { id: 'p004', name: 'মোঃ সালমান ফারসি', occupation: 'ডাক্তার', phone: '01612345681', email: 'salman.farsi@example.com', avatar: 'https://picsum.photos/80/80?random=14' },
    { id: 'p005', name: 'মোঃ আব্দুল্লাহ', occupation: 'আইনজীবী', phone: '01512345682', email: 'abdullah@example.com', avatar: 'https://picsum.photos/80/80?random=15' },
];

export type EducationalQualification = {
  level: string;
  institute: string;
  gpa: string;
  passingYear: string;
};

export type Teacher = {
  id: string;
  name: string;
  subject: string;
  phone: string;
  email: string;
  avatar: string;
  designation?: string;
  fatherName?: string;
  motherName?: string;
  maritalStatus?: string;
  hasExperience?: boolean;
  previousSchool?: string;
  previousDesignation?: string;
  previousSubject?: string;
  experienceYears?: string;
  qualifications?: EducationalQualification[];
  presentAddress?: string;
  permanentAddress?: string;
  nid?: string;
  dob?: string;
  gender?: string;
  religion?: string;
  bloodGroup?: string;
  address?: string;
};

export const teacherData: Teacher[] = [
  { id: 't001', name: 'আহমেদ হোসেন', subject: 'বাংলা', phone: '01711111111', email: 'ahmed.hossain@example.com', avatar: 'https://picsum.photos/80/80?random=21' },
  { id: 't002', name: 'ফাতেমা বেগম', subject: 'ইংরেজি', phone: '01822222222', email: 'fatema.begum@example.com', avatar: 'https://picsum.photos/80/80?random=22' },
  { id: 't003', name: 'জামাল উদ্দিন', subject: 'গণিত', phone: '01933333333', email: 'jamal.uddin@example.com', avatar: 'https://picsum.photos/80/80?random=23' },
  { id: 't004', name: 'তাসলিমা খাতুন', subject: 'বিজ্ঞান', phone: '01644444444', email: 'taslima.khatun@example.com', avatar: 'https://picsum.photos/80/80?random=24' },
];


export const routineData = [
    { time: "১০:০০ - ১০:৪৫", sun: "বাংলা", mon: "গণিত", tue: "বিজ্ঞান", wed: "ইংরেজি", thu: "সমাজ" },
    { time: "১০:৪৫ - ১১:৩০", sun: "গণিত", mon: "বাংলা", tue: "ইংরেজি", wed: "বিজ্ঞান", thu: "ধর্ম" },
    { time: "১১:৩০ - ১২:১৫", sun: "ইংরেজি", mon: "বিজ্ঞান", tue: "সমাজ", wed: "বাংলা", thu: "গণিত" },
    { time: "১২:১৫ - ০১:০০", sun: "বিজ্ঞান", mon: "সমাজ", tue: "গণিত", wed: "ধর্ম", thu: "বাংলা" },
    { time: "০১:০০ - ০২:০০", sun: "বিরতি", mon: "বিরতি", tue: "বিরতি", wed: "বিরতি", thu: "বিরতি" },
    { time: "০২:০০ - ০২:৪৫", sun: "সমাজ", mon: "ইংরেজি", tue: "ধর্ম", wed: "গণিত", thu: "বিজ্ঞান" },
    { time: "০২:৪৫ - ০৩:৩০", sun: "ধর্ম", mon: "ক্রীড়া", tue: "বাংলা", wed: "সমাজ", thu: "ক্রীড়া" },
];

export type BookInventoryItem = {
  docId: string;
  id: string;
  name: string;
  author: string;
  class: string;
  publisher: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  purchaseDate: string;
};

export const bookInventoryData: BookInventoryItem[] = [
  { docId: '1', id: '01', name: 'Books', author: 'Amin', class: '1', publisher: 'Iqoora Noorani Academy', quantity: 28, purchasePrice: 250, sellingPrice: 360, purchaseDate: '18/07/2025' },
  { docId: '2', id: '02', name: 'Books', author: 'Amin', class: '1', publisher: 'Iqoora Noorani Academy', quantity: 20, purchasePrice: 250, sellingPrice: 360, purchaseDate: '18/07/2025' },
];

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: 'in-stock' | 'out-of-stock' | 'low-stock';
}

export const inventoryData: InventoryItem[] = [
  { id: 'inv001', name: 'ডেস্ক', category: 'আসবাবপত্র', quantity: 50, price: 3500, status: 'in-stock' },
  { id: 'inv002', name: 'চেয়ার', category: 'আসবাবপত্র', quantity: 100, price: 1500, status: 'in-stock' },
  { id: 'inv003', name: 'হোয়াইটবোর্ড', category: 'শিক্ষা উপকরণ', quantity: 10, price: 2500, status: 'low-stock' },
  { id: 'inv004', name: 'মার্কার', category: 'শিক্ষা উপকরণ', quantity: 200, price: 30, status: 'in-stock' },
  { id: 'inv005', name: 'ডাস্টার', category: 'শিক্ষা উপকরণ', quantity: 25, price: 50, status: 'in-stock' },
  { id: 'inv006', name: 'ল্যাপটপ', category: 'ইলেকট্রনিক্স', quantity: 5, price: 55000, status: 'low-stock' },
  { id: 'inv007', name: 'প্রজেক্টর', category: 'ইলেকট্রনিক্স', quantity: 2, price: 45000, status: 'low-stock' },
  { id: 'inv008', name: 'ফুটবল', category: 'ক্রীড়া সামগ্রী', quantity: 0, price: 1200, status: 'out-of-stock' },
  { id: 'inv009', name: 'ব্যাট', category: 'ক্রীড়া সামগ্রী', quantity: 15, price: 800, status: 'in-stock' },
];


export const attendanceRecordsForAI = [
  // Arif Ahmed - good attendance
  { studentId: "s001", date: "2024-07-01", isPresent: true },
  { studentId: "s001", date: "2024-07-02", isPresent: true },
  { studentId: "s001", date: "2024-07-03", isPresent: true },
  { studentId: "s001", date: "2024-07-04", isPresent: false },
  { studentId: "s001", date: "2024-07-05", isPresent: true },
  { studentId: "s001", date: "2024-07-08", isPresent: true },
  { studentId: "s001", date: "2024-07-09", isPresent: true },
  { studentId: "s001", date: "2024-07-10", isPresent: true },

  // Sumaiya Islam - potential truancy
  { studentId: "s002", date: "2024-07-01", isPresent: true },
  { studentId: "s002", date: "2024-07-02", isPresent: false },
  { studentId: "s002", date: "2024-07-03", isPresent: true },
  { studentId: "s002", date: "2024-07-04", isPresent: false },
  { studentId: "s002", date: "2024-07-05", isPresent: false },
  { studentId: "s002", date: "2024-07-08", isPresent: true },
  { studentId: "s002", date: "2024-07-09", isPresent: false },
  { studentId: "s002", date: "2024-07-10", isPresent: true },

  // Imran Khan - high truancy
  { studentId: "s003", date: "2024-07-01", isPresent: false },
  { studentId: "s003", date: "2024-07-02", isPresent: true },
  { studentId: "s003", date: "2024-07-03", isPresent: false },
  { studentId: "s003", date: "2024-07-04", isPresent: false },
  { studentId: "s003", date: "2024-07-05", isPresent: true },
  { studentId: "s003", date: "2024-07-08", isPresent: false },
  { studentId: "s003", date: "2024-07-09", isPresent: false },
  { studentId: "s003", date: "2024-07-10", isPresent: true },
];

    
