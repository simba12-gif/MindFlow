const { db, admin } = require('./utils/firebase');

async function createTestAccounts() {
  console.log('Creating official test accounts for Hackathon Judges...');

  const accounts = [
    {
      email: 'student@university.edu',
      password: 'mindflow2026',
      displayName: 'Test Student',
      role: 'student',
      department: 'School of Engineering',
      semester: 'Fall 2026',
      subjects: ['CS101', 'MATH201'],
      sleepGoal: 8
    },
    {
      email: 'counselor@university.edu',
      password: 'mindflow2026',
      displayName: 'Test Counselor',
      role: 'counselor',
      department: 'Wellness Center'
    }
  ];

  for (const acc of accounts) {
    let userRecord;
    try {
      // Check if user already exists
      userRecord = await admin.auth().getUserByEmail(acc.email);
      console.log(`User ${acc.email} already exists. Updating password...`);
      await admin.auth().updateUser(userRecord.uid, {
        password: acc.password,
        displayName: acc.displayName
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`Creating new auth user for ${acc.email}...`);
        userRecord = await admin.auth().createUser({
          email: acc.email,
          password: acc.password,
          displayName: acc.displayName,
        });
      } else {
        console.error(`Error creating auth user ${acc.email}:`, error);
        continue;
      }
    }

    // Now set the firestore record
    const userRef = db.collection('users').doc(userRecord.uid);
    const docData = {
      uid: userRecord.uid,
      email: acc.email,
      name: acc.displayName,
      role: acc.role,
      department: acc.department,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add student specific fields
    if (acc.role === 'student') {
      docData.semester = acc.semester;
      docData.subjects = acc.subjects;
      docData.sleepGoal = acc.sleepGoal;
    }

    await userRef.set(docData, { merge: true });
    console.log(`Firestore record updated for ${acc.email}`);
  }

  console.log('Test accounts successfully created!');
  process.exit(0);
}

createTestAccounts().catch(console.error);
