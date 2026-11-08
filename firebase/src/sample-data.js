// Made-up sample school for demo mode (previews and local development). No real people.
// Dates are relative to today so the app always has recent history to show.
// Shape matches the app's own backup file: { collection: { id: record } }.

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (k) => { const d = new Date(); d.setDate(d.getDate() - k); return iso(d); };
const GRADES = ['Excellent', 'Very good', 'Good', 'Very good', 'Excellent', 'Pass'];

// Demo sign-ins, one per role (the role switcher in the preview banner picks one).
export const DEMO_USERS = {
  owner: { id: 'demo-owner', email: 'owner@demo.school', name: 'Demo Owner', label: 'Owner', isOwner: true, canEdit: true },
  admin: { id: 'demo-admin', email: 'amina@demo.school', name: 'Amina', label: 'Admin', isOwner: false, canEdit: true },
  teacher: { id: 'demo-teacher', email: 'bilal@demo.school', name: 'Bilal', label: 'Teacher (Bilal)', isOwner: false, canEdit: false },
  supervisor: { id: 'demo-supervisor', email: 'sami@demo.school', name: 'Sami', label: 'Supervisor', isOwner: false, canEdit: false },
};

export function sampleData() {
  const everyDay = [0, 1, 2, 3, 4, 5, 6];
  const data = {
    settings: { main: { school: { name: 'Demo Quran School' } } },
    teachers: {
      t1: { name: 'Amina', role: 'admin', active: true, n: 1, email: DEMO_USERS.admin.email },
      t2: { name: 'Bilal', role: 'teacher', active: true, n: 2, email: DEMO_USERS.teacher.email, phone: '+61400111222' },
      t3: { name: 'Khalid', role: 'teacher', active: true, n: 3, email: 'khalid@demo.school', phone: '+61400333444' },
      t4: { name: 'Sami', role: 'supervisor', active: true, n: 4, email: DEMO_USERS.supervisor.email },
    },
    classes: {
      c1: { name: 'Kids class', n: 1, days: everyDay, time: '15:30', end: '17:00', teacher: 't2' },
      c2: { name: 'Teens class', n: 2, days: [1, 3, 5], time: '17:30', end: '19:00', teacher: 't3' },
    },
    students: {},
    events: {},
    marks: {
      k1: { sid: 's1', w: 12, k: 'prompt', date: daysAgo(1), t: 1 },
      k2: { sid: 's2', w: 30, k: 'prompt', date: daysAgo(2), t: 1 },
    },
  };
  const kids = [
    ['s1', 'Yusuf', 'c1', 5, 40], ['s2', 'Maryam', 'c1', 7, 120], ['s3', 'Ibrahim', 'c1', 5, 15],
    ['s4', 'Fatima', 'c2', 15, 300], ['s5', 'Zakariya', 'c2', 10, 210], ['s6', 'Hana', 'c2', 15, 420],
  ];
  let e = 1;
  for (const [id, name, cls, amount, pos] of kids) {
    const days = data.classes[cls].days;
    data.students[id] = {
      name, cls, order: 'nas', startS: 113, prevS: [], amount, readPages: 20, readStart: 1, farDays: 7, days, start: daysAgo(60), pos,
    };
    for (let k = 14; k >= 1; k--) {
      const d = new Date(); d.setDate(d.getDate() - k);
      if (!days.includes(d.getDay())) continue;
      const r = (id.charCodeAt(1) * 7 + k * 13) % 10; // deterministic variety
      const att = r === 0 ? 'absent' : r === 1 ? 'late' : 'present';
      data.events[`e${e++}`] = att === 'absent'
        ? { sid: id, type: 'session', date: iso(d), att }
        : {
          sid: id, type: 'session', date: iso(d), att, hw: r !== 2,
          hifzLines: amount, hifzMist: r % 4, hifzGrade: GRADES[r % GRADES.length],
          revType: k % 2 ? 'near' : 'far', revMist: (r + 1) % 3, revGrade: GRADES[(r + 2) % GRADES.length],
        };
    }
  }
  return data;
}
