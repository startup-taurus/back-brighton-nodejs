const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const AGE_CATEGORY = {
  KIDS: 'kids',
  ADULTS: 'adults',
};

const ALLOWED_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
  N_A: 'n/a',
};

const ATTENDANCE_THRESHOLDS = {
  MIN_CONSECUTIVE_ABSENCES: 3,
};

const USER_TYPES = {
  ADMIN: 'admin_staff',
  PROFESSOR: 'professor',
  TEACHER: 'teacher', 
  STUDENT: 'student',
  FINANCIAL: 'financial',
  COORDINATOR: 'coordinator',
  RECEPTIONIST: 'receptionist',
};

const ROLE_IDS = {
  ADMIN: 1,
  PROFESSOR: 2,
  STUDENT: 3,
  FINANCIAL: 4,
  COORDINATOR: 5,
  RECEPTIONIST: 6,
};

const MODULES_ORDER = [
  'Dashboard', 'Students', 'Professors', 'Courses', 'Syllabus',
  'Attendance', 'Gradebook', 'Holidays', 'Users', 'Payments',
  'FinancialReports', 'StudentReports'
];

const MODULE_RULES = [
  { key: 'dashboard', module: 'Dashboard' },
  { key: 'student_report', module: 'StudentReports' },
  { key: 'student', module: 'Students' },
  { key: 'transfer', module: 'Students' },
  { key: 'teacher', module: 'Professors' },
  { key: 'cancelled_lesson', module: 'Holidays' },
  { key: 'course', module: 'Courses' },
  { key: 'syllabus', module: 'Syllabus' },
  { key: 'attendance', module: 'Attendance' },
  { key: 'gradebook', module: 'Gradebook' },
  { key: 'grade', module: 'Gradebook' },
  { key: 'holiday', module: 'Holidays' },
  { key: 'user', module: 'Users' },
  { key: 'payment', module: 'Payments' },
  { key: 'financial', module: 'FinancialReports' },
];

const EXAMS_TYPE = {
  STARTERS: 'STARTERS',
  MOVERS: 'MOVERS',
  FLYERS: 'FLYERS',
  KEY: 'KEY',
  PRELIM: 'PRELIM',
  FIRST: 'FIRST',
};

const EXAM_MODULES = {
  THREE_MODULES: {
    READING_WRITING: 'reading-and-writing',
    LISTENING: 'listening-yle',
    SPEAKING: 'speaking-yle'
  },
  FOUR_MODULES: {
    READING: 'reading',
    LISTENING: 'listening',
    WRITING: 'writing',
    SPEAKING: 'speaking'
  }
};

const EXAM_TYPE_MODULES = {
  [EXAMS_TYPE.STARTERS]: 3,
  [EXAMS_TYPE.MOVERS]: 3,
  [EXAMS_TYPE.FLYERS]: 3,
  [EXAMS_TYPE.KEY]: 3,
  [EXAMS_TYPE.PRELIM]: 4,
  [EXAMS_TYPE.FIRST]: 4,
};

const LEVEL_TO_EXAM_TYPE = {
  1: EXAMS_TYPE.MOVERS,     
  2: EXAMS_TYPE.KEY,       
  3: EXAMS_TYPE.PRELIM,     
  4: EXAMS_TYPE.PRELIM,     
  5: EXAMS_TYPE.FIRST,   
  6: EXAMS_TYPE.FIRST,      
  7: EXAMS_TYPE.STARTERS,   
  8: EXAMS_TYPE.MOVERS,     
  9: EXAMS_TYPE.FLYERS,    
  10: EXAMS_TYPE.PRELIM,  
  11: EXAMS_TYPE.PRELIM,   
  12: EXAMS_TYPE.MOVERS,  
  13: EXAMS_TYPE.FLYERS,    
  14: EXAMS_TYPE.PRELIM,   
};


const LEVEL_TO_EXAM_TYPE_BY_AGE = {
  2: {
    kids: EXAMS_TYPE.FLYERS,
    adults: EXAMS_TYPE.KEY
  },

  1: {
    kids: EXAMS_TYPE.MOVERS,
    adults: EXAMS_TYPE.MOVERS
  },
  7: {
    kids: EXAMS_TYPE.STARTERS,
    adults: EXAMS_TYPE.STARTERS
  },
  3: {
    kids: EXAMS_TYPE.PRELIM,
    adults: EXAMS_TYPE.PRELIM
  },
  4: {
    kids: EXAMS_TYPE.PRELIM,
    adults: EXAMS_TYPE.PRELIM
  },
  5: {
    kids: EXAMS_TYPE.FIRST,
    adults: EXAMS_TYPE.FIRST
  },
  6: {
    kids: EXAMS_TYPE.FIRST,
    adults: EXAMS_TYPE.FIRST
  }
};
const DELETED = {
  DELETED_ITEM: 'DELETED',
};
const ERROR_MESSAGES = {
  STUDENT_NOT_FOUND: 'Student not found',
  PROFESSOR_NOT_FOUND: 'Professor not found',
  TRANSFER_VALIDATION: 'Please provide either a course or a level to transfer students.',
  TRANSFER_ERROR: 'Error requesting transfer for students',
  PROGRESS_ERROR: 'Error transferring or progressing students',
  GRADING_ITEMS_FETCH_ERROR: 'Error fetching grading items',
  COURSE_NOT_FOUND: 'Course not found',
  COURSE_HAS_NO_SYLLABUS: 'Course has no syllabus',
  GRADING_ITEM_NOT_FOUND: 'Grading item not found',
  ASSIGNMENT_CATEGORY_NOT_FOUND: 'Assignment category not found',
  ASSIGNMENT_NAME_REQUIRED: 'Assignment name is required',
  ASSIGNMENT_NOT_FOUND_IN_COURSE: 'Assignment not found in course',
  NO_ADJACENT_ASSIGNMENT: 'No adjacent assignment in this course',
  NO_EMPTY_ASSIGNMENT_TARGET: 'No empty assignment available to receive grades',
  EMAIL_CEDULA_REQUIRED: 'Email and cedula are required',
  EMAIL_ALREADY_REGISTERED: 'This email is already registered',
  CEDULA_ALREADY_REGISTERED: 'This cedula is already registered',
  EMAIL_CEDULA_ALREADY_REGISTERED: 'Email and cedula are already registered',
  EMAIL_CEDULA_AVAILABLE: 'Email and cedula are available',
  USERNAME_ALREADY_REGISTERED: 'This username is already registered',
  USERNAME_AVAILABLE: 'This username is available',
  USERNAME_EMAIL_ALREADY_REGISTERED: 'This username and email are already registered',
  EMAIL_CEDULA_USERNAME_ALREADY_REGISTERED: 'Email, cedula and username are already registered',
  EMAIL_USERNAME_ALREADY_REGISTERED: 'Email and username are already registered',
  CEDULA_USERNAME_ALREADY_REGISTERED: 'Cedula and username are already registered',
};

const GRADING_CATEGORIES = {
  ASSIGNMENT: 'ASSIGNMENTS',
  TEST: 'PROGRESS TESTS', 
  EXAM: 'MOVERS EXAM'
};

const GRADING_ORIGIN = {
  SYLLABUS: 'syllabus',
  COURSE: 'course',
};

const COURSE_TYPES = {
  ONLINE: 'online',
  ON_SITE: 'on-site',
  PRIVATE: 'private',
  PRIVATE_ONLINE: 'private - online'
};
const HOLIDAY_TYPE ={
  NATIONAL: 'national',
  LOCAL: 'local',
}
const STATUS={
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TRANSFERRED: 'transferred',
  COMPLETED: 'completed',
}
const STATUS_MAP = {
  active: 1,
  inactive: 0,
}
const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
  RECOVERED: 'recovered',
}

module.exports = {
  DAYS_OF_WEEK,
  AGE_CATEGORY,
  ALLOWED_STATUS,
  USER_TYPES,
  EXAMS_TYPE,
  EXAM_MODULES,
  EXAM_TYPE_MODULES,
  LEVEL_TO_EXAM_TYPE,
  LEVEL_TO_EXAM_TYPE_BY_AGE,
  ERROR_MESSAGES,
  GRADING_CATEGORIES,
  GRADING_ORIGIN,
  DELETED,
  COURSE_TYPES,
  ATTENDANCE_THRESHOLDS,
  HOLIDAY_TYPE ,
  STATUS,
  STATUS_MAP,
  ATTENDANCE_STATUS,
  ROLE_IDS
  , MODULES_ORDER
  , MODULE_RULES
};
