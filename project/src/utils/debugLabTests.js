/**
 * Lab Tests API Debugging Tool
 * 
 * This script helps identify which API endpoint works with your Spring Boot backend.
 */

// Configuration
const API_BASE_URL = 'http://localhost:8082/api';
const VISIT_ID = 31; // The visit ID we know has lab tests
const PATIENT_ID = '026'; // The patient ID associated with this visit

// Sample lab test data matching the database schema
const sampleLabTest = {
  visit_id: VISIT_ID,
  patient_id: PATIENT_ID, // Include patient_id field
  test_name: 'Test Lab',
  reference_range: 'Normal Range',
  result: '',
  status: 'pending'
};

// Define all possible endpoints to test
const endpoints = [
  `${API_BASE_URL}/labtests/visit/${VISIT_ID}`, // GET - Fetch tests for visit
  `${API_BASE_URL}/labtests`,                   // POST - Create new test
  `${API_BASE_URL}/visits/${VISIT_ID}/labtests` // Nested resource approach
];

/**
 * BACKEND SOLUTION GUIDE:
 * 
 * If none of these endpoints work, you need to add a proper REST controller to your Spring Boot application.
 * Here's how you should set it up:
 * 
 * 1. Create a LabTestController.java file with:
 * 
 * @RestController
 * @RequestMapping("/api/labtests")
 * public class LabTestController {
 *     
 *     @Autowired
 *     private LabTestRepository labTestRepository;
 *     
 *     @GetMapping("/visit/{visitId}")
 *     public List<LabTest> getLabTestsByVisitId(@PathVariable Long visitId) {
 *         return labTestRepository.findByVisitId(visitId);
 *     }
 *     
 *     @GetMapping("/patient/{patientId}")
 *     public List<LabTest> getLabTestsByPatientId(@PathVariable String patientId) {
 *         return labTestRepository.findByPatientId(patientId);
 *     }
 *     
 *     @PostMapping
 *     public LabTest createLabTest(@RequestBody LabTest labTest) {
 *         return labTestRepository.save(labTest);
 *     }
 * }
 * 
 * 2. Create a LabTestRepository.java interface:
 * 
 * @Repository
 * public interface LabTestRepository extends JpaRepository<LabTest, Long> {
 *     List<LabTest> findByVisitId(Long visitId);
 *     List<LabTest> findByPatientId(String patientId);
 * }
 * 
 * 3. Update LabTest.java entity to include the patient_id field:
 * 
 * @Entity
 * @Table(name = "labtests")
 * public class LabTest {
 *     @Id
 *     @GeneratedValue(strategy = GenerationType.IDENTITY)
 *     private Long test_id;
 *     
 *     private Long visit_id;
 *     private String patient_id;  // Added patient_id field
 *     private String test_name;
 *     private String reference_range;
 *     private String result;
 *     private String status;
 *     
 *     // Getters and setters
 * }
 */

// Test GET endpoints
async function testGetEndpoints() {
  console.log('=== TESTING GET ENDPOINTS ===');
  
  for (const endpoint of endpoints) {
    if (!endpoint.includes('/visit/')) continue; // Skip non-GET endpoints
    
    try {
      console.log(`Testing GET: ${endpoint}`);
      const response = await fetch(endpoint);
      const status = response.status;
      
      console.log(`Status: ${status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response:', data);
        console.log(`✅ SUCCESS: ${endpoint} returned ${data.length} lab tests`);
      } else {
        console.log(`❌ ERROR: ${endpoint} failed with status ${status}`);
      }
    } catch (error) {
      console.error(`Network error for ${endpoint}:`, error.message);
    }
    
    console.log('---');
  }
}

// Test POST endpoint
async function testPostEndpoint() {
  console.log('\n=== TESTING POST ENDPOINT ===');
  
  const postEndpoint = `${API_BASE_URL}/labtests`;
  
  try {
    console.log(`Testing POST: ${postEndpoint}`);
    console.log('Data:', sampleLabTest);
    
    const response = await fetch(postEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sampleLabTest),
    });
    
    const status = response.status;
    console.log(`Status: ${status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data);
      console.log(`✅ SUCCESS: Lab test created successfully`);
    } else {
      console.log(`❌ ERROR: Failed to create lab test with status ${status}`);
    }
  } catch (error) {
    console.error(`Network error for ${postEndpoint}:`, error.message);
  }
}

// Run tests
async function runTests() {
  await testGetEndpoints();
  await testPostEndpoint();
  
  console.log('\n=== SUMMARY ===');
  console.log('If all endpoints failed, check the BACKEND SOLUTION GUIDE above');
  console.log('Make sure your Spring Boot application has proper REST controllers set up.');
}

runTests();

/**
 * USAGE:
 * 
 * 1. In browser: Copy and paste this entire file into your browser console
 * 
 * 2. In Node.js:
 *    - Save this file
 *    - Run: node debugLabTests.js
 *    
 * 3. In your Spring Boot application:
 *    - Add this to application.properties for detailed logging:
 *      
 *      spring.jpa.show-sql=true
 *      logging.level.org.hibernate.SQL=DEBUG
 *      logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
 */ 