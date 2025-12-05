// Map occupation từ database về translation keys
const OCCUPATION_MAPPING = {
  // Student variants
  "student": "student",
  
  // Teacher variants  
  "teacher": "teacher",
  "teacher/professor": "teacherProfessor",
  "professor": "teacherProfessor",
  "giáo viên": "teacher",
  "giảng viên": "teacherProfessor",
  
  // IT variants
  "it": "itSoftware", 
  "it/software/technology": "itSoftware",
  "software": "itSoftware",
  "technology": "itSoftware",
  "developer": "itSoftware",
  "programmer": "itSoftware",
  
  // Engineer variants
  "engineer": "engineer",
  "engineering": "engineer", 
  "kỹ sư": "engineer",
  
  // Designer
  "designer": "designer",
  "thiết kế": "designer",
  
  // Healthcare
  "nurse": "nurse", 
  "doctor": "doctor",
  "y tá": "nurse",
  "bác sĩ": "doctor",
  "healthcare": "doctor",
  
  // Business
  "marketing": "marketing",
  "sales": "sales", 
  "finance": "finance",
  "business": "business",
  "bán hàng": "sales",
  "tài chính": "finance",
  "kinh doanh": "business",
  
  // Hospitality
  "hospitality": "hospitalityTourism",
  "hospitality/tourism": "hospitalityTourism", 
  "tourism": "hospitalityTourism",
  "du lịch": "hospitalityTourism",
  
  // Government
  "government": "government",
  "công chức": "government",
  
  // Others
  "retired": "retired",
  "unemployed": "unemployed",
  "đã nghỉ hưu": "retired",
  "thất nghiệp": "unemployed"
};

function normalizeOccupation(occupation) {
  if (!occupation || occupation === "null" || occupation.trim() === "") return "other";
  
  const cleaned = occupation.trim().toLowerCase();
  
  // Tìm exact match trước
  if (OCCUPATION_MAPPING[cleaned]) {
    return OCCUPATION_MAPPING[cleaned];
  }
  
  // Tìm partial match
  for (const [key, value] of Object.entries(OCCUPATION_MAPPING)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return value;
    }
  }
  
  return "other";
}

module.exports = { OCCUPATION_MAPPING, normalizeOccupation };
