const { db } = require('../utils/firebase');

/**
 * @desc Get latest burnout score for current user
 * @route GET /api/burnout/me
 */
const getMyLatestScore = async (req, res, next) => {
  try {
    const { uid } = req.user;

    const snapshot = await db.collection('burnout_scores')
      .where('uid', '==', uid)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ 
        message: 'No score calculated yet. Complete more check-ins.',
        hasData: false 
      });
    }

    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory by calculatedAt desc
    docs.sort((a, b) => {
      const timeA = a.calculatedAt ? a.calculatedAt.toDate().getTime() : 0;
      const timeB = b.calculatedAt ? b.calculatedAt.toDate().getTime() : 0;
      return timeB - timeA;
    });

    const data = docs[0];
    res.status(200).json({
      hasData: true,
      ...data,
      calculatedAt: data.calculatedAt.toDate()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get historical burnout scores for trend visualization
 * @route GET /api/burnout/me/history
 */
const getMyScoreHistory = async (req, res, next) => {
  try {
    const { uid } = req.user;

    const snapshot = await db.collection('burnout_scores')
      .where('uid', '==', uid)
      .get();

    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory by calculatedAt desc (most recent first)
    history.sort((a, b) => {
      const timeA = a.calculatedAt ? a.calculatedAt.toDate().getTime() : 0;
      const timeB = b.calculatedAt ? b.calculatedAt.toDate().getTime() : 0;
      return timeB - timeA;
    });

    // Limit to 14 and then reverse for the graph (so oldest first)
    const limitedHistory = history.slice(0, 14).map(h => ({
      ...h,
      calculatedAt: h.calculatedAt.toDate()
    })).reverse();

    res.status(200).json(limitedHistory);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyLatestScore,
  getMyScoreHistory
};
