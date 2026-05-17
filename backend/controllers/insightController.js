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
      .get();

    const allCheckins = checkinsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory by timestamp desc
    allCheckins.sort((a, b) => {
      const timeA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp ? b.timestamp.toDate().getTime() : 0;
      return timeB - timeA;
    });

    const checkins = allCheckins.slice(0, 7).map(d => {
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
      .get();

    const scoreDocs = scoreSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory by calculatedAt desc
    scoreDocs.sort((a, b) => {
      const timeA = a.calculatedAt ? a.calculatedAt.toDate().getTime() : 0;
      const timeB = b.calculatedAt ? b.calculatedAt.toDate().getTime() : 0;
      return timeB - timeA;
    });

    const latestScore = scoreDocs.length === 0 ? { score: 'N/A', riskLevel: 'unknown' } : scoreDocs[0];

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
