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
    schools: { s1: { name: 'Demo Quran School', n: 1 } },
    teachers: {
      t1: { name: 'Amina', role: 'admin', active: true, n: 1, email: DEMO_USERS.admin.email, schools: ['s1'] },
      t2: { name: 'Bilal', role: 'teacher', active: true, n: 2, email: DEMO_USERS.teacher.email, phone: '+61400111222', schools: ['s1'] },
      t3: { name: 'Khalid', role: 'teacher', active: true, n: 3, email: 'khalid@demo.school', phone: '+61400333444', schools: ['s1'] },
      t4: { name: 'Sami', role: 'supervisor', active: true, n: 4, email: DEMO_USERS.supervisor.email, schools: ['s1'] },
    },
    classes: {
      c1: { name: 'Kids class', n: 1, days: everyDay, time: '15:30', end: '17:00', teacher: 't2', school: 's1' },
      c2: { name: 'Teens class', n: 2, days: [1, 3, 5], time: '17:30', end: '19:00', teacher: 't3', school: 's1' },
    },
    students: {},
    events: {},
    marks: {
      k1: { sid: 's1', w: 12, k: 'prompt', date: daysAgo(1), t: 1 },
      k2: { sid: 's2', w: 30, k: 'prompt', date: daysAgo(2), t: 1 },
      // tajweed mistakes with the rule chosen (tr): iqlab in أَلِيمُۢ, idgham without ghunnah in هُدࣰى
      k3: { sid: 's1', w: 117, k: 'tajweed', tr: 'iqlab', date: daysAgo(1), t: 2 },
      k4: { sid: 's1', w: 59, k: 'tajweed', tr: 'idgN', date: daysAgo(3), t: 3 },
    },
    // suggestions and problems sent with 💬 Suggest (only admins see them, in Settings)
    feedback: {
      f1: { kind: 'idea', text: 'Could the parent message also show the surahs reviewed this week?', by: 'Bilal', email: DEMO_USERS.teacher.email, page: 'wa', at: `${daysAgo(1)}T16:20:00.000Z`, date: daysAgo(1), status: 'new' },
      f2: { kind: 'problem', text: 'On my phone the mushaf page is too small to tap the right word.', by: 'Khalid', email: 'khalid@demo.school', page: 'mushaf', at: `${daysAgo(3)}T18:05:00.000Z`, date: daysAgo(3), status: 'new' },
      f3: { kind: 'idea', text: 'A list of students who were absent twice this month would help.', by: 'Sami', email: DEMO_USERS.supervisor.email, page: 'reports', at: `${daysAgo(9)}T09:40:00.000Z`, date: daysAgo(9), status: 'done' },
    },
  };
  const kids = [
    ['s1', 'Yusuf', 'c1', 5, 40], ['s2', 'Maryam', 'c1', 7, 120], ['s3', 'Ibrahim', 'c1', 5, 15],
    ['s4', 'Fatima', 'c2', 15, 300], ['s5', 'Zakariya', 'c2', 10, 210], ['s6', 'Hana', 'c2', 15, 420],
  ];
  let e = 1;
  const tjp = { s1: { iqlab: [1, 4], ikhfa: [3, 5], madd5: [4, 4] } }; // tajweed practice results (right, asked) per rule
  // group moves (date, from, to, who): Maryam moved from the Teens class to the Kids class
  const moves = { s2: [{ date: daysAgo(20), from: 'c2', to: 'c1', by: 'Demo Owner', at: Date.now() - 20 * 864e5 }] };
  // parents' WhatsApp numbers: a teacher sees them only in their own group (Bilal: Kids class)
  const phone = { s1: '+61400555001', s2: '+61400555002', s4: '+61400555004', s5: '+61400555005' };
  for (const [id, name, cls, amount, pos] of kids) {
    const days = data.classes[cls].days;
    data.students[id] = {
      name, cls, order: 'nas', startS: 113, prevS: [], amount, readPages: 20, readStart: 1, farDays: 7, days, start: daysAgo(60), pos,
      ...(tjp[id] ? { tjp: tjp[id] } : {}),
      ...(moves[id] ? { moves: moves[id] } : {}),
      ...(phone[id] ? { phone: phone[id] } : {}),
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
  // Bilal covered Khalid's Teens class a week ago: his session for Fatima shows "recorded by Bilal (covering)"
  data.events.cover1 = {
    sid: 's4', type: 'session', date: daysAgo(7), att: 'present', hw: true, hifzLines: 15, hifzMist: 1, hifzGrade: 'Very good',
    revType: 'near', revMist: 0, revGrade: 'Excellent', by: 'Bilal', tid: 't2', uid: DEMO_USERS.teacher.id, at: 1, pv: 2,
  };
  data.events.own1 = {
    sid: 's1', type: 'session', date: daysAgo(6), att: 'present', hw: true, hifzLines: 5, hifzMist: 0, hifzGrade: 'Excellent',
    revType: 'far', revMist: 0, revGrade: 'Excellent', by: 'Bilal', tid: 't2', uid: DEMO_USERS.teacher.id, at: 1, pv: 2,
  };
  return data;
}
