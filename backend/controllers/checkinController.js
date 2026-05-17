const { db, admin } = require('../utils/firebase');
const { calculateBurnoutScore } = require('../utils/scoring');

/**
 * @desc Submit a daily check-in
 * @route POST /api/checkins
 */
const submitCheckin = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { moodScore, sleepHours, stressLevel, workloadRating, notes, dateKey } = req.body;

    // 1. Check if user already checked in for this local dateKey
    // dateKey format: YYYY-MM-DD (determined by client locale)
    const activeDateKey = dateKey || new Date().toISOString().split('T')[0];
    
    const existingCheckin = await db.collection('checkins')
      .where('uid', '==', uid)
      .where('dateKey', '==', activeDateKey)
      .limit(1)
      .get();

    if (!existingCheckin.empty) {
      return res.status(400).json({ error: 'You have already submitted a check-in for today' });
    }

    // 2. Create the check-in with validation and clamping
    const mood = Math.min(10, Math.max(1, Number(moodScore)));
    const sleep = Math.min(24, Math.max(0, Number(sleepHours)));
    const stress = Math.min(10, Math.max(1, Number(stressLevel)));
    const workload = Math.min(10, Math.max(1, Number(workloadRating)));

    if ([mood, sleep, stress, workload].some(isNaN)) {
      return res.status(400).json({ error: 'Invalid check-in values: must be numeric' });
    }

    const checkinData = {
      uid,
      dateKey: activeDateKey,
      moodScore: mood,
      sleepHours: sleep,
      stressLevel: stress,
      workloadRating: workload,
      notes: notes || '',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('checkins').add(checkinData);
    
    // 3. Trigger burnout calculation asynchronously
    calculateBurnoutScore(uid).catch(err => 
      console.error(`[CRITICAL] Burnout calculation failed for user ${uid}:`, err)
    );

    res.status(201).json({
      message: 'Check-in submitted successfully',
      id: docRef.id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get last 30 check-ins for the user
 * @route GET /api/checkins/me
 */
const getMyCheckins = async (req, res, next) => {
  try {
    const { uid } = req.user;

    const snapshot = await db.collection('checkins')
      .where('uid', '==', uid)
      .get();

    const checkins = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory by timestamp desc
    checkins.sort((a, b) => {
      const timeA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp ? b.timestamp.toDate().getTime() : 0;
      return timeB - timeA;
    });

    const limitedCheckins = checkins.slice(0, 30).map(c => ({
      ...c,
      timestamp: c.timestamp.toDate()
    }));

    res.status(200).json(limitedCheckins);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get today's check-in for the user
 * @route GET /api/checkins/me/today
 */
const getTodayCheckin = async (req, res, next) => {
  try {
    const { uid } = req.user;

    const snapshot = await db.collection('checkins')
      .where('uid', '==', uid)
      .get();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const checkinsToday = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(doc => {
        if (!doc.timestamp) return false;
        const jsDate = doc.timestamp.toDate();
        return jsDate >= startOfDay && jsDate <= endOfDay;
      });

    if (checkinsToday.length === 0) {
      return res.status(200).json({ checkedIn: false });
    }

    const doc = checkinsToday[0];
    res.status(200).json({
      checkedIn: true,
      data: {
        ...doc,
        timestamp: doc.timestamp.toDate()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitCheckin,
  getMyCheckins,
  getTodayCheckin
};
