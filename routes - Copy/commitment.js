const express = require('express');
const db = require('../db/database');

// Helper function to log commitment metrics
function logCommitmentMetric(projectId, userId, metricName, scoreImpact, loggedById = null) {
  try {
    // Map metric names to categories
    const positiveMetrics = [
      'Update Tepat Waktu',
      'Komunikasi Responsif',
      'Pengiriman Awal',
      'Kolaborasi Baik',
      'Kualitas Memuaskan'
    ];
    
    const category = positiveMetrics.includes(metricName) ? 'positive' : 'negative';
    
    const result = db.prepare(`
      INSERT INTO commitment_metrics (
        project_id, user_id, metric_name, metric_category, score_impact, logged_by_id, logged_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      projectId,
      userId,
      metricName,
      category,
      scoreImpact,
      loggedById
    );
    
    return result.lastID;
  } catch (err) {
    console.error('Error logging commitment metric:', err);
    return null;
  }
}

// Function to calculate trust score from metrics
function calculateTrustScore(userId) {
  try {
    // Aggregate all metrics for user
    const metrics = db.prepare(`
      SELECT 
        SUM(CASE WHEN metric_category = 'positive' THEN score_impact ELSE 0 END) as positive_score,
        SUM(CASE WHEN metric_category = 'negative' THEN ABS(score_impact) ELSE 0 END) as negative_score,
        COUNT(*) as total_metrics
      FROM commitment_metrics
      WHERE user_id = ?
    `).get(userId);
    
    if (!metrics || metrics.total_metrics === 0) {
      return 100; // New users start with 100%
    }
    
    // Calculate score: 100 - (negative penalties)
    // Base 100, deduct negative impacts, with diminishing returns
    const baseScore = 100;
    const penalty = Math.min(metrics.negative_score || 0, 40); // Cap at -40
    const bonus = Math.min((metrics.positive_score || 0) / 5, 20); // Cap bonus at +20
    
    const trustScore = Math.max(0, Math.min(100, baseScore - penalty + bonus));
    return Math.round(trustScore);
    
  } catch (err) {
    console.error('Error calculating trust score:', err);
    return 100;
  }
}

module.exports = {
  logCommitmentMetric,
  calculateTrustScore
};
