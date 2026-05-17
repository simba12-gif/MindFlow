const { db } = require('./utils/firebase');

async function clearMockData() {
  console.log('Cleaning up mock data from Firestore...');

  // 1. Delete users starting with student_mock_
  const usersSnapshot = await db.collection('users').get();
  const userDeletions = [];
  usersSnapshot.forEach(doc => {
    if (doc.id.startsWith('student_mock_')) {
      userDeletions.push(doc.ref.delete());
    }
  });
  await Promise.all(userDeletions);
  console.log(`Deleted ${userDeletions.length} mock users.`);

  // 2. Delete checkins starting with checkin_mock_
  const checkinsSnapshot = await db.collection('checkins').get();
  const checkinDeletions = [];
  checkinsSnapshot.forEach(doc => {
    if (doc.id.startsWith('checkin_mock_')) {
      checkinDeletions.push(doc.ref.delete());
    }
  });
  await Promise.all(checkinDeletions);
  console.log(`Deleted ${checkinDeletions.length} mock checkins.`);

  // 3. Delete alerts starting with alert_mock_
  const alertsSnapshot = await db.collection('alerts').get();
  const alertDeletions = [];
  alertsSnapshot.forEach(doc => {
    if (doc.id.startsWith('alert_mock_')) {
      alertDeletions.push(doc.ref.delete());
    }
  });
  await Promise.all(alertDeletions);
  console.log(`Deleted ${alertDeletions.length} mock alerts.`);

  // 4. Delete department analytics created in seeding
  const depts = ['School of Engineering', 'Faculty of Fine Arts', 'Medical Sciences'];
  const today = new Date().toISOString().split('T')[0];
  const analyticsDeletions = [];
  depts.forEach(deptName => {
    const docRef = db.collection('department_analytics').doc(`${deptName}_${today}`);
    analyticsDeletions.push(docRef.delete());
  });
  await Promise.all(analyticsDeletions);
  console.log('Deleted department analytics mock docs.');

  console.log('Mock data cleanup complete!');
  process.exit(0);
}

clearMockData().catch(err => {
  console.error('Mock data cleanup failed:', err);
  process.exit(1);
});
