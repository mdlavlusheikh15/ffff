
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherAttendanceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/teacher/dashboard/attendance/take');
  }, [router]);

  return null;
}
