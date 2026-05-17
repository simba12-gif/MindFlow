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
      .orderBy('calculatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ 
        message: 'No score calculated yet. Complete more check-ins.',
        hasData: false 
      });
    }

    const data = snapshot.docs[0].data();
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
      .orderBy('calculatedAt', 'desc')
      .limit(14)
      .get();

    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      calculatedAt: doc.data().calculatedAt.toDate()
    })).reverse(); // Oldest first for the graph

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyLatestScore,
  getMyScoreHistory
};
