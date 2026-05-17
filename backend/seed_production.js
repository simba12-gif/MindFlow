const { db, admin } = require('./utils/firebase');

async function seedProductionData() {
  console.log('Initializing premium academic dataset seeding into Firestore...');

  const batch = db.batch();

  // 1. Setup realistic department blueprints
  const depts = [
    { name: 'School of Engineering', totalStudents: 850 },
    { name: 'Medical Sciences', totalStudents: 680 },
    { name: 'Faculty of Fine Arts', totalStudents: 420 },
    { name: 'Business Administration', totalStudents: 510 }
  ];

  // 2. Generate 30 realistic students
  const studentNames = [
    'Emily Zhang', 'Marcus Vance', 'Sophia Patel', 'Liam O\'Connor', 'Aria Tanaka',
    'Jordan Miller', 'Elena Rostova', 'Devon Harris', 'Chloe Dubois', 'Zayn Malik',
    'Sarah Jenkins', 'Alexander Wu', 'Isabella Rossi', 'Gabriel Silva', 'Mia Kowalski',
    'Noah Bernstein', 'Olivia Martinez', 'Ethan Campbell', 'Ava Sterling', 'Lucas Wright',
    'Hannah Abbott', 'Cedric Diggory', 'Luna Lovegood', 'Harry Potter', 'Ron Weasley',
    'Hermione Granger', 'Neville Longbottom', 'Draco Malfoy', 'Cho Chang', 'Ginny Weasley'
  ];

  const students = [];

  for (let i = 0; i < 30; i++) {
    const deptInfo = depts[i % depts.length];
    const email = `${studentNames[i].toLowerCase().replace(/[^a-z]/g, '')}@university.edu`;
    const uid = `student_prod_${100 + i}`;
    
    // Distribute risks: 3 critical, 4 high, 8 moderate, 15 low
    let riskLevel = 'low';
    let score = 15 + Math.floor(Math.random() * 20);

    if (i < 3) {
      riskLevel = 'critical';
      score = 82 + Math.floor(Math.random() * 12);
    } else if (i < 7) {
      riskLevel = 'high';
      score = 65 + Math.floor(Math.random() * 15);
    } else if (i < 15) {
      riskLevel = 'moderate';
      score = 40 + Math.floor(Math.random() * 20);
    }

    const studentDocRef = db.collection('users').doc(uid);
    const studentData = {
      uid,
      name: studentNames[i],
      email,
      role: 'student',
      department: deptInfo.name,
      semester: `${(i % 8) + 1}st Semester`,
      sleepGoal: 8,
      latestBurnoutScore: score,
      latestRiskLevel: riskLevel,
      onboarded: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    batch.set(studentDocRef, studentData);
    students.push(studentData);
  }

  console.log(`Generated ${students.length} student profiles.`);

  // 3. Seed unacknowledged Alerts for high-risk / critical students
  const activeAlerts = [
    {
      id: 'alert_prod_001',
      uid: 'student_prod_100', // Emily Zhang (Critical)
      riskLevel: 'critical',
      score: 94,
      message: 'COHORT_ENG_Y4: Burnout threshold exceeded [0.94]. Continuous elevated stress metrics observed across 4 consecutive days.',
      acknowledged: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: 'alert_prod_002',
      uid: 'student_prod_101', // Marcus Vance (Critical)
      riskLevel: 'critical',
      score: 86,
      message: 'CLINICAL_ROTATION: Critical burnout score recorded during pediatric night cycle.',
      acknowledged: false,
      timestamp: new Date(Date.now() - 4 * 3600 * 1000) // 4 hours ago
    },
    {
      id: 'alert_prod_003',
      uid: 'student_prod_103', // Liam O'Connor (High)
      riskLevel: 'high',
      score: 78,
      message: 'LATENIGHT_ANOMALY: High academic workload and low sleep cycle anomalies detected over past 48 hours.',
      acknowledged: false,
      timestamp: new Date(Date.now() - 10 * 3600 * 1000) // 10 hours ago
    },
    {
      id: 'alert_prod_004',
      uid: 'student_prod_104', // Aria Tanaka (High)
      riskLevel: 'high',
      score: 69,
      message: 'ACADEMIC_LOAD: Spiked homework pressure weight recorded for graduation project.',
      acknowledged: false,
      timestamp: new Date(Date.now() - 24 * 3600 * 1000) // 24 hours ago
    }
  ];

  activeAlerts.forEach(alert => {
    const alertRef = db.collection('alerts').doc(alert.id);
    batch.set(alertRef, alert);
  });

  console.log(`Generated ${activeAlerts.length} active cognitive alerts.`);

  // 4. Seed check-ins for today to drive the Campus Check-in Rate
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // 18 students check in today (60% check-in rate)
  for (let i = 0; i < 18; i++) {
    const student = students[i];
    const checkinRef = db.collection('checkins').doc(`checkin_prod_${100 + i}`);
    batch.set(checkinRef, {
      uid: student.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      mood: 3 + (i % 3),
      sleep: 6 + (i % 3),
      workload: 4 + (i % 3),
      stress: 2 + (i % 4),
      score: student.latestBurnoutScore,
      level: student.latestRiskLevel,
      dateKey: new Date().toISOString().split('T')[0]
    });
  }

  console.log('Generated today\'s check-in activity telemetry.');

  // 5. Seed Department Aggregates
  const today = new Date().toISOString().split('T')[0];

  const deptMetrics = [
    { name: 'School of Engineering', avg: 74, highRisk: 6, total: 850 },
    { name: 'Medical Sciences', avg: 58, highRisk: 4, total: 680 },
    { name: 'Faculty of Fine Arts', avg: 31, highRisk: 1, total: 420 },
    { name: 'Business Administration', avg: 22, highRisk: 0, total: 510 }
  ];

  deptMetrics.forEach(dept => {
    const docRef = db.collection('department_analytics').doc(`${dept.name}_${today}`);
    batch.set(docRef, {
      department: dept.name,
      date: today,
      avgBurnoutScore: dept.avg,
      highRiskCount: dept.highRisk,
      studentCount: dept.total,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  console.log('Generated aggregated department analytics.');

  await batch.commit();
  console.log('Premium counselor dashboard datasets successfully committed to Firestore!');
  process.exit(0);
}

seedProductionData().catch(err => {
  console.error('Seeding process failed:', err);
  process.exit(1);
});
