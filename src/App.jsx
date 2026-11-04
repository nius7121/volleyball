import React from 'react';
import StudentApp from './student/StudentApp';
import TeacherApp from './teacher/TeacherApp';

export default function App() {
  return window.location.pathname.startsWith('/teacher') ? <TeacherApp /> : <StudentApp />;
}
