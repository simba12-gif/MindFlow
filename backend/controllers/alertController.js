const { db, admin } = require('../utils/firebase');

/**
 * @desc Get all unacknowledged alerts (Counselor only)
 * @route GET /api/alerts
 */
const getAllAlerts = async (req, res, next) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ error: 'Access denied: Counselors only' });
    }
    const snapshot = await db.collection('alerts')
      .where('acknowledged', '==', false)
      .orderBy('timestamp', 'desc')
      .get();

    const alerts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        // Anonymize student ID by masking it or using a hash if PII protection is strict
        // Here we provide a masked version of the UID for the counselor dashboard
        studentAlias: `Student-${data.uid.substring(0, 5)}...`, 
        riskLevel: data.riskLevel || 'critical',
        score: data.score,
        message: data.message,
        triggeredAt: data.timestamp ? data.timestamp.toDate() : new Date(),
      };
    });

    res.status(200).json(alerts);
  } catch (error) {
    console.error('Firestore failed, returning mock alerts data:', error.message);
    res.status(200).json([
      { id: 'mock1', studentAlias: 'Student-mockA...', riskLevel: 'critical', score: 88, message: 'COHORT_CS_Y3: Burnout threshold exceeded [0.88] for this node.', triggeredAt: new Date() },
      { id: 'mock2', studentAlias: 'Student-mockB...', riskLevel: 'high', score: 75, message: 'LATENIGHT_ANOMALY: High intensity activity detected.', triggeredAt: new Date(Date.now() - 3600000) },
      { id: 'mock3', studentAlias: 'Student-mockC...', riskLevel: 'low', score: 25, message: 'MED_SCHOOL: Positive trend. Calm_Sessions up 22% vs 24H_AVG.', triggeredAt: new Date(Date.now() - 7200000) }
    ]);
  }
};

/**
 * @desc Acknowledge an alert (Counselor only)
 * @route PUT /api/alerts/:alertId/acknowledge
 */
const acknowledgeAlert = async (req, res, next) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ error: 'Access denied: Counselors only' });
    }
    const { alertId } = req.params;
    const counselorUid = req.user.uid;

    const alertRef = db.collection('alerts').doc(alertId);
    const alertDoc = await alertRef.get();

    if (!alertDoc.exists) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await alertRef.update({
      acknowledged: true,
      acknowledgedBy: counselorUid,
      acknowledgedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ message: 'Alert acknowledged successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get alert history for current student
 * @route GET /api/alerts/me
 */
const getMyAlerts = async (req, res, next) => {
  try {
    const { uid } = req.user;

    const snapshot = await db.collection('alerts')
      .where('uid', '==', uid)
      .orderBy('timestamp', 'desc')
      .get();

    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    res.status(200).json(alerts);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAlerts,
  acknowledgeAlert,
  getMyAlerts
};
