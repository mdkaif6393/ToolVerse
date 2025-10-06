const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Track an event
const trackEvent = async (eventData) => {
  const { event_type, user_id, session_id, page, meta } = eventData;
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([{ event_type, user_id, session_id, page, meta }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error tracking event:', error);
    throw error;
  }
};

// Get analytics summary
const getAnalyticsSummary = async () => {
  try {
    // Total page views
    const { count: totalPageViews, error: pageViewsError } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('event_type', 'page_view');

    if (pageViewsError) throw pageViewsError;

    // Total users (distinct by session_id or user_id)
    const { data: distinctUsers, error: distinctUsersError } = await supabase
      .from('events')
      .select('user_id, session_id')
      .distinct();

    if (distinctUsersError) throw distinctUsersError;

    const userSet = new Set();
    distinctUsers.forEach(event => {
      const identifier = event.user_id || event.session_id;
      userSet.add(identifier);
    });
    const totalUsers = userSet.size;

    // Active users (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: activeUsersData, error: activeUsersError } = await supabase
      .from('events')
      .select('user_id, session_id')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .distinct();

    if (activeUsersError) throw activeUsersError;

    const activeUserSet = new Set();
    activeUsersData.forEach(event => {
      const identifier = event.user_id || event.session_id;
      activeUserSet.add(identifier);
    });
    const activeUsers = activeUserSet.size;

    // Signups this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { count: signupsThisWeek, error: signupsError } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('event_type', 'signup')
      .gte('created_at', startOfWeek.toISOString());

    if (signupsError) throw signupsError;

    return {
      totalPageViews: totalPageViews || 0,
      totalUsers,
      activeUsers,
      signupsThisWeek: signupsThisWeek || 0,
    };
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    throw error;
  }
};

module.exports = {
  trackEvent,
  getAnalyticsSummary,
};
