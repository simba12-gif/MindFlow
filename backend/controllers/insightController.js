const { db, admin } = require('../utils/firebase');
const { generateAIInsights } = require('../utils/ai');

/**
 * @desc Get personalized AI insights for the student
 * @route GET /api/insights/me
 */
const getMyInsights = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const today = new Date().toISOString().split('T')[0];

    // 1. Check for cached insights for today
    const cacheRef = db.collection('ai_insights').doc(`${uid}_${today}`);
    const cacheDoc = await cacheRef.get();

    if (cacheDoc.exists) {
      return res.status(200).json(cacheDoc.data());
    }

    // 2. Fetch data for AI prompt
    // Get last 7 check-ins
    const checkinsSnapshot = await db.collection('checkins')
      .where('uid', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(7)
      .get();

    const checkins = checkinsSnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        mood: d.moodScore,
        stress: d.stressLevel,
        sleep: d.sleepHours,
        workload: d.workloadRating
      };
    });

    // Get latest burnout score
    const scoreSnapshot = await db.collection('burnout_scores')
      .where('uid', '==', uid)
      .orderBy('calculatedAt', 'desc')
      .limit(1)
      .get();

    const latestScore = scoreSnapshot.empty ? { score: 'N/A', riskLevel: 'unknown' } : scoreSnapshot.docs[0].data();

    // 3. Generate insights via AI
    const insights = await generateAIInsights({
      checkins,
      score: latestScore.score,
      riskLevel: latestScore.riskLevel
    });

    // 4. Cache and return
    const insightData = {
      uid,
      insights,
      date: today,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await cacheRef.set(insightData);

    res.status(200).json(insightData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyInsights
};
