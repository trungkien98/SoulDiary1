function startOfDayUTC(d = new Date()) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function diffDaysUTC(a, b) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function applyStreakByDate(userDoc, activityDate = new Date()) {
  const today = startOfDayUTC(activityDate);

  if (!userDoc.lastStreakDate) {
    userDoc.streakCount = 1;
    userDoc.bestStreak = Math.max(userDoc.bestStreak || 0, 1);
    userDoc.lastStreakDate = today;
    return;
  }

  const last = startOfDayUTC(userDoc.lastStreakDate);
  const days = diffDaysUTC(last, today);

  if (days === 0) return; // cùng ngày không tăng

  if (days === 1) userDoc.streakCount = (userDoc.streakCount || 0) + 1;
  else userDoc.streakCount = 1; // đứt streak

  userDoc.lastStreakDate = today;
  userDoc.bestStreak = Math.max(userDoc.bestStreak || 0, userDoc.streakCount);
}

module.exports = { applyStreakByDate };
