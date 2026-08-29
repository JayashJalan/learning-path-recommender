const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

export function createProfile(message) {
  return request('/api/profile', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export function buildPath(profile) {
  return request('/api/path', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export function submitFeedback(profile, completedCourseIds) {
  return request('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ profile, completed_course_ids: completedCourseIds }),
  });
}

export function askAssistant(question, pathContext) {
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ question, path_context: pathContext }),
  });
}
