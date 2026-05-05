/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  Users, BookOpen, Bell, TrendingUp, TrendingDown, Plus, ChevronRight, 
  MessageSquare, User, Filter, AlertCircle, CheckCircle2, Info, Loader2,
  Calendar, Award, Target, LayoutDashboard, LogOut, Settings, MoreVertical,
  Sparkles, BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { MOCK_STUDENTS, MOCK_SUBJECTS, MOCK_GRADES, MOCK_FEEDBACK, MOCK_ALERTS } from './data';
import { Role, GradeEntry, TeacherFeedback, Alert, Student } from './types';

// --- Dashboard Logic Helpers ---

const calculateAverage = (grades: GradeEntry[]) => {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((acc, curr) => acc + (curr.score / curr.maxScore) * 100, 0);
  return Math.round(sum / grades.length);
};

const getStatusColor = (average: number) => {
  if (average >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
  if (average >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  if (average >= 80) return 'text-blue-700 bg-blue-50 border-blue-100';
  if (average >= 75) return 'text-amber-700 bg-amber-50 border-amber-100';
  return 'text-rose-700 bg-rose-50 border-rose-100';
};

const getStatusLabel = (average: number) => {
  if (average >= 90) return 'Exceeding Expectations';
  if (average >= 85) return 'Shows Progress';
  if (average >= 75) return 'Steady Performance';
  return 'Needs Improvement';
};

// --- Sub-components ---

const SuccessModal = ({ show, message, onClose }: { show: boolean, message: string, onClose: () => void }) => (
  <AnimatePresence>
    {show && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Success!</h3>
          <p className="text-sm text-slate-500 font-medium">{message}</p>
          <button 
            onClick={onClose}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md flex flex-col items-center">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</span>
    <span className={cn("text-2xl font-bold", colorClass.split(' ')[0], "text-emerald-600")}>{value}</span>
  </div>
);

// --- Teacher Components ---

const GradeEncoder = ({ students, subjects, selectedStudentId, onAddGrade, onAddFeedback }: { students: Student[], subjects: any[], selectedStudentId?: string, onAddGrade: any, onAddFeedback: any }) => {
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const aLastName = a.name.split(' ').slice(-1)[0].toLowerCase();
      const bLastName = b.name.split(' ').slice(-1)[0].toLowerCase();
      return aLastName.localeCompare(bLastName);
    });
  }, [students]);
  
  const [selectedStudent, setSelectedStudent] = useState(sortedStudents[0]?.id || '');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');

  React.useEffect(() => {
    if (selectedStudentId) {
      setSelectedStudent(selectedStudentId);
    }
  }, [selectedStudentId]);
  
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [category, setCategory] = useState<'written' | 'performance' | 'exam'>('written');
  const [customType, setCustomType] = useState('Quiz 1');
  const [feedbackText, setFeedbackText] = useState('');

  const QUICK_TEMPLATES = [
    { text: 'Outstanding consistency!', sentiment: 'positive' as const },
    { text: 'Shows great improvement.', sentiment: 'improving' as const },
    { text: 'Needs extra practice.', sentiment: 'at-risk' as const },
    { text: 'Active class participant.', sentiment: 'positive' as const }
  ];

  const CATEGORY_MAP = {
    written: { label: 'Written Works', types: ['Quiz 1', 'Quiz 2', 'Assignment 1', 'Assignment 2', 'Short Quiz'] },
    performance: { label: 'Performance Tasks', types: ['Lab Report', 'Project', 'Activity', 'Participation', 'Journal'] },
    exam: { label: 'Exams', types: ['Midterm Exam', 'Final Exam', 'Periodical Test'] }
  };

return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Performance Record
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Student</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {sortedStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Subject</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Score</label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Total</label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-2">Category</label>
            <div className="flex gap-2">
              {(['written', 'performance', 'exam'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setCustomType(CATEGORY_MAP[c].types[0]);
                  }}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium rounded-lg transition-all text-center",
                    category === c ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {CATEGORY_MAP[c].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Type</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
            >
              {CATEGORY_MAP[category].types.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="custom">Custom</option>
            </select>
          </div>

          <button 
            onClick={() => {
              if (!score) return;
              onAddGrade({
                id: Math.random().toString(36).substr(2, 9),
                studentId: selectedStudent,
                subjectId: selectedSubject,
                score: Number(score),
                maxScore: Number(maxScore),
                category,
                type: customType,
                date: new Date().toISOString().split('T')[0]
              });
              setScore('');
            }}
            className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-all"
          >
            Post Record
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Teacher's Journal
        </h3>
          <div className="flex items-center justify-between mb-3">
             <label className="text-xs text-slate-500">Feedback</label>
             <button 
                onClick={() => {
                  const student = students.find(s => s.id === selectedStudent);
                  const msg = `Based on recent scores, ${student?.name.split(' ')[0]} is showing strong ${category} skills. Overall performance is stable.`;
                  setFeedbackText(msg);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs hover:bg-emerald-100 transition-colors"
              >
                <Sparkles className="w-3 h-3" /> AI Generate
             </button>
         </div>
        <textarea 
          className="w-full h-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none resize-none mb-3"
          placeholder="Write a note to parents..."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2 mb-3">
          {QUICK_TEMPLATES.map(tmp => (
            <button 
              key={tmp.text}
              onClick={() => setFeedbackText(tmp.text)}
              className="text-left px-2 py-1.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-all"
            >
              {tmp.text}
            </button>
          ))}
        </div>
        <button 
          onClick={() => {
            if (!feedbackText) return;
            onAddFeedback({
              id: Date.now().toString(),
              studentId: selectedStudent,
              subjectId: selectedSubject,
              text: feedbackText,
              date: new Date().toISOString().split('T')[0],
              sentiment: QUICK_TEMPLATES.find(t => t.text === feedbackText)?.sentiment || 'neutral'
            });
            setFeedbackText('');
          }}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
        >
          Send Feedback
        </button>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>('parent');
  const [activeTeacherTab, setActiveTeacherTab] = useState('dashboard');
  const [grades, setGrades] = useState<GradeEntry[]>(MOCK_GRADES);
  const [feedback, setFeedback] = useState<TeacherFeedback[]>(MOCK_FEEDBACK);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [acknowledgedFeedbackIds, setAcknowledgedFeedbackIds] = useState<Set<string>>(new Set());
  const [isExpandingStudents, setIsExpandingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('s1');

  const sortedStudents = useMemo(() => {
    return [...MOCK_STUDENTS].sort((a, b) => {
      const aLastName = a.name.split(' ').slice(-1)[0].toLowerCase();
      const bLastName = b.name.split(' ').slice(-1)[0].toLowerCase();
      return aLastName.localeCompare(bLastName);
    });
  }, []);

  const currentUserStudent = MOCK_STUDENTS.find(s => s.id === 's1')!;
  
  const studentGrades = useMemo(() => 
    grades.filter(g => g.studentId === currentUserStudent.id), 
  [grades, currentUserStudent.id]);

  const studentAverages = useMemo(() => {
    return MOCK_SUBJECTS.map(sub => {
      const subGrades = studentGrades.filter(g => g.subjectId === sub.id);
      return {
        id: sub.id,
        name: sub.name,
        average: calculateAverage(subGrades),
        recentTrend: subGrades.length > 2 
          ? (subGrades[subGrades.length-1].score / subGrades[subGrades.length-1].maxScore) >= (subGrades[subGrades.length-2].score / subGrades[subGrades.length-2].maxScore)
          : null
      };
    });
  }, [studentGrades]);

  const stats = useMemo(() => {
    const totalAvg = Math.round(studentAverages.reduce((a, b) => a + b.average, 0) / studentAverages.length);
    const growth = 2; // Fixed for demo
    return { totalAvg, growth };
  }, [studentAverages]);

  // AI Learning Analysis Generator
  const aiAnalysis = useMemo(() => {
    const subAverages = studentAverages;
    if (subAverages.length === 0) return null;

    // Find strongest and weakest subjects
    const sorted = [...subAverages].sort((a, b) => b.average - a.average);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    const overallAvg = Math.round(subAverages.reduce((a, b) => a + b.average, 0) / subAverages.length);

    // Count recent grades (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentGrades = studentGrades.filter(g => new Date(g.date) >= weekAgo);
    const recentCount = recentGrades.length;

    // Determine trend (compare last 2 grades)
    let trend = 'stable';
    if (studentGrades.length >= 2) {
      const last2 = studentGrades.slice(-2);
      const older = last2[0].score / last2[0].maxScore;
      const newer = last2[1].score / last2[1].maxScore;
      if (newer > older + 0.05) trend = 'improving';
      else if (newer < older - 0.05) trend = 'declining';
    }

    // Generate dynamic message
    let message = '';
    if (overallAvg >= 90) {
      message = `is consistently excelling across all subjects! Outstanding performance in ${strongest.name} with ${strongest.average}%.`;
    } else if (overallAvg >= 80) {
      message = `is showing strong performance in ${strongest.name} at ${strongest.average}%. ${weakest.name} needs attention at ${weakest.average}%.`;
    } else if (overallAvg >= 75) {
      message = `is maintaining steady progress. Focus on ${weakest.name} to improve overall performance.`;
    } else {
      message = `needs additional support. Consider reviewing ${weakest.name} fundamentals.`;
    }

    // Determine next milestone
    const nextMilestone = 'Exam Week'; // Could be dynamic based on date

    return {
      overallAvg,
      strongest: strongest.name,
      strongestAvg: strongest.average,
      weakest: weakest.name,
      weakestAvg: weakest.average,
      recentActivity: recentCount,
      nextMilestone,
      trend,
      message,
      retention: overallAvg,
      participation: recentCount >= 3 ? 'High' : recentCount >= 1 ? 'Moderate' : 'Low',
      focusScore: `${Math.min(10, Math.max(5, Math.round(overallAvg / 10 * 1.2 * 10) / 10)}/10`
    };
  }, [studentGrades, studentAverages]);

const handleAddGrade = (newGrade: GradeEntry) => {
    // Intelligent Risk Detection (Light AI Logic) - check BEFORE adding
    const prevGrades = grades.filter(g => g.studentId === newGrade.studentId && g.subjectId === newGrade.subjectId);
    if (prevGrades.length > 0) {
      const prevAvg = calculateAverage(prevGrades);
      const newScorePercent = (newGrade.score / newGrade.maxScore) * 100;
      
      console.log('Checking insight:', { prevGrades: prevGrades.length, prevAvg, newScorePercent, diff: newScorePercent - prevAvg });
      
      if (newScorePercent < prevAvg - 10) {
        setAlerts(prev => [{
          id: Date.now().toString(),
          studentId: newGrade.studentId,
          title: 'Curriculum Support Opportunity',
          message: `Noticeable variance in ${MOCK_SUBJECTS.find(s => s.id === newGrade.subjectId)?.name}. A supportive review session at home might be beneficial this weekend.`,
          type: 'decline',
          date: new Date().toISOString().split('T')[0],
          isRead: false
        }, ...prev]);
      } else if (newScorePercent > prevAvg + 5) {
        setAlerts(prev => [{
          id: Date.now().toString(),
          studentId: newGrade.studentId,
          title: 'Celebration Moment',
          message: `Exceptional progress recorded in ${MOCK_SUBJECTS.find(s => s.id === newGrade.subjectId)!}! High engagement detected in ${newGrade.type}.`,
          type: 'improvement',
          date: new Date().toISOString().split('T')[0],
          isRead: false
        }, ...prev]);
      }
    }
    
    setGrades(prev => [...prev, newGrade]);
    setSuccessModal({ show: true, message: 'Performance record posted successfully!' });
  };

  const handleAddFeedback = (newFb: TeacherFeedback) => {
    setFeedback(prev => [newFb, ...prev]);
    setSuccessModal({ show: true, message: 'Feedback sent to parent successfully!' });
  };

  const handleMarkAlertRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  const handleAcknowledgeFeedback = (id: string) => {
    setAcknowledgedFeedbackIds(prev => new Set([...prev, id]));
  };

  const [detailedSubjectId, setDetailedSubjectId] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{ show: boolean, message: string }>({ show: false, message: '' });
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const newStudent: Student = {
      id: `s${MOCK_STUDENTS.length + 1}`,
      name: newStudentName,
      parentId: `p${MOCK_STUDENTS.length + 1}`,
      classId: 'c1'
    };
    // This would normally update the database
    setNewStudentName('');
    setShowAddStudent(false);
    setSuccessModal({ show: true, message: 'Student added successfully!' });
  };

  if (!isAuthenticated) {
return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-8 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <BookOpen className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">GabayAral</h1>
          <p className="text-xs text-slate-500 font-medium">Academic Monitoring Portal</p>
        </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-3 text-center">Select your role</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setRole('teacher')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    role === 'teacher' ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400"
                  )}
                >
                  <Award className="w-6 h-6" />
                  <span className="text-sm font-semibold">Teacher</span>
                </button>
                <button 
                  onClick={() => setRole('parent')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    role === 'parent' ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400"
                  )}
                >
                  <User className="w-6 h-6" />
                  <span className="text-sm font-semibold">Parent</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder={role === 'teacher' ? "Teacher ID" : "Parent Access Code"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Settings className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  placeholder="Password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button 
              onClick={() => setIsAuthenticated(true)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all"
            >
              Continue as {role === 'teacher' ? 'Teacher' : 'Parent'}
            </button>
            
            <div className="text-center">
               <p className="text-xs text-slate-400">Powered by AI Insights</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">GabayAral</span>
              <p className="text-[10px] text-emerald-600 font-medium">Insightful Learning</p>
            </div>
          </div>


          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="w-5 h-5 text-slate-500" />
              {alerts.some(a => !a.isRead) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{role === 'teacher' ? 'Prof. Cruz' : 'Elena Santos'}</p>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden"
              >
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role === 'teacher' ? 'teacher-8' : 'parent-2'}`} alt="Avatar" />
              </button>
            </div>
          </div>
        </div>
      </nav>


      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
{role === 'parent' ? (
            <motion.div 
              key="parent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Column: Student Header & Overview */}
              <div className="lg:col-span-2 space-y-6">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold">Learner Insight</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{currentUserStudent.name}</h1>
                    <p className="text-sm text-slate-500">
                       Grade 8 • St. Jude Section • 2nd Academic Period
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center">
                      <span className="text-xs text-slate-500 mb-1">Growth</span>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold">+{stats.growth}%</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center">
                      <span className="text-xs text-slate-500 mb-1">Period</span>
                      <div className="flex items-center gap-1 text-blue-600">
                        <Calendar className="w-4 h-4" />
                        <span className="font-bold">W3</span>
                      </div>
                    </div>
                  </div>
                </header>

                {/* AI Summary Card */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-slate-900 p-6 rounded-xl text-white"
                >
                    <div className="flex items-center gap-2 mb-4">
                      <BrainCircuit className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">AI Learning Analysis</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Good morning, Elena.</h2>
                    {aiAnalysis && (
                      <p className="text-sm text-slate-400 mb-4">
                        Based on this week's progress, <span className="text-white font-semibold">{currentUserStudent.name.split(' ')[0]}</span> {aiAnalysis.message}
                        {aiAnalysis.trend === 'improving' && ' Recent scores show improvement!'}
                        {aiAnalysis.trend === 'declining' && ' Recent scores need attention.'}
                      </p>
                    )}
                    <div className="grid grid-cols-4 gap-3">
                      {aiAnalysis && [
                        { label: 'Retention', value: `${aiAnalysis.retention}%`, color: aiAnalysis.retention >= 80 ? 'text-emerald-400' : 'text-amber-400' },
                        { label: 'Activity', value: `${aiAnalysis.recentActivity} grades`, color: 'text-blue-400' },
                        { label: 'Trend', value: aiAnalysis.trend === 'improving' ? '↑' : aiAnalysis.trend === 'declining' ? '↓' : '→', color: aiAnalysis.trend === 'improving' ? 'text-emerald-400' : aiAnalysis.trend === 'declining' ? 'text-rose-400' : 'text-slate-400' },
                        { label: 'Next', value: aiAnalysis.nextMilestone, color: 'text-slate-100' }
                      ].map((item, i) => (
                        <div key={i} className="bg-white/5 p-3 rounded-lg">
                          <p className="text-[10px] text-slate-500 mb-1">{item.label}</p>
                          <p className={cn("font-bold", item.color)}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                </motion.div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Growth Indicators</h2>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {studentAverages.map(sub => (
                      <div 
                        key={sub.id} 
                        onClick={() => setDetailedSubjectId(detailedSubjectId === sub.id ? null : sub.id)}
                        className={cn(
                          "bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer",
                          detailedSubjectId === sub.id && "ring-2 ring-slate-900 border-transparent"
                        )}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-slate-800">{sub.name}</h3>
                            <p className="text-xs text-slate-500">Teacher: {MOCK_SUBJECTS.find(s => s.id === sub.id)?.teacherId === 't1' ? 'Prof. Cruz' : 'Mr. Reyes'}</p>
                          </div>
                          <span className={cn("px-2 py-1 rounded text-xs font-medium", getStatusColor(sub.average))}>
                            {getStatusLabel(sub.average)}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {(['written', 'performance', 'exam'] as const).map(cat => {
                            const catGrades = studentGrades.filter(g => g.subjectId === sub.id && g.category === cat);
                            const avgValue = calculateAverage(catGrades);
                            const lastEntry = catGrades[catGrades.length - 1];
                            
                            return (
                              <div key={cat} className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-500">
                                  <span>{cat === 'written' ? 'Written' : cat === 'performance' ? 'Performance' : 'Exams'}</span>
                                  <div className="flex items-center gap-2">
                                    {lastEntry && (
                                      <span className="text-slate-400">{lastEntry.score}/{lastEntry.maxScore}</span>
                                    )}
                                    <span className="text-slate-900 font-medium">{avgValue}%</span>
                                  </div>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${avgValue}%` }}
                                    transition={{ duration: 0.8 }}
                                    className={cn(
                                      "h-full rounded-full", 
                                      cat === 'written' ? 'bg-emerald-500' : cat === 'performance' ? 'bg-blue-500' : 'bg-slate-700'
                                    )} 
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-500 mb-2">Recent Records</p>
                          <div className="space-y-1">
                            {studentGrades
                              .filter(g => g.subjectId === sub.id)
                              .slice(-3)
                              .reverse()
                              .map((g) => (
                                <div key={g.id} className="flex justify-between items-center text-sm">
                                  <span className="text-slate-700">{g.type}</span>
                                  <span className={cn(
                                    "font-medium px-2 py-0.5 rounded text-xs",
                                    (g.score/g.maxScore) >= 0.85 ? "text-emerald-700 bg-emerald-50" : (g.score/g.maxScore) >= 0.75 ? "text-blue-700 bg-blue-50" : "text-amber-700 bg-amber-50"
                                  )}>
                                    {g.score}/{g.maxScore}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grade History */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h2 className="text-lg font-bold mb-4">Performance History</h2>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={studentGrades.slice(-10).map((g, index) => ({ 
                        name: `R${index+1}`, 
                        val: (g.score/g.maxScore)*100,
                        subject: MOCK_SUBJECTS.find(s => s.id === g.subjectId)?.name
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" hide />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                          formatter={(value: number) => [`${Math.round(value)}%`, 'Score']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="val" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Right Column: Alerts & Feedback */}
              <div className="space-y-6">
                {/* Insights Panel */}
                <section>
                  <h3 className="font-semibold text-lg mb-4">Recent Insights</h3>
                  <div className="space-y-3">
                    {alerts.filter(a => !a.isRead).length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">No new notifications</p>
                    )}
                    {alerts.filter(a => !a.isRead).map(alert => (
                      <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        key={alert.id} 
                        onClick={() => handleMarkAlertRead(alert.id)}
                        className={cn(
                          "p-4 rounded-lg border flex gap-3 cursor-pointer hover:shadow-md transition-all",
                          alert.type === 'decline' ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
                          alert.type === 'decline' ? "bg-white text-amber-600" : "bg-white text-emerald-600"
                        )}>
                          {alert.type === 'decline' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-500 mb-1">{alert.title}</p>
                          <p className="text-sm text-slate-700">{alert.message}</p>
                          <div className="flex justify-between mt-2">
                            <span className="text-xs text-slate-400">{new Date(alert.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Teacher Feedback Panel */}
                <section>
                  <h3 className="font-semibold text-lg mb-4">Educator's Feedback</h3>
                  <div className="space-y-4">
                    {feedback.map(fb => (
                      <div key={fb.id} className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-medium text-emerald-600">
                            {MOCK_SUBJECTS.find(s => s.id === fb.subjectId)?.name}
                          </span>
                          <span className="text-xs text-slate-400">{fb.date}</span>
                        </div>
                        <p className="text-sm text-slate-700 italic">"{fb.text}"</p>
                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <div className={cn("w-2 h-2 rounded-full", fb.sentiment === 'positive' ? "bg-emerald-500" : "bg-emerald-400")} />
                             <span className="text-xs text-slate-500 capitalize">{fb.sentiment}</span>
                           </div>
                           <button 
                             onClick={() => handleAcknowledgeFeedback(fb.id)}
                             disabled={acknowledgedFeedbackIds.has(fb.id)}
                             className={cn(
                               "text-xs font-medium transition-all",
                               acknowledgedFeedbackIds.has(fb.id) ? "text-slate-300" : "text-emerald-600 hover:text-emerald-800"
                             )}
                           >
                             {acknowledgedFeedbackIds.has(fb.id) ? 'Seen' : 'Acknowledge'}
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Protocol Card */}
                <div className="bg-slate-900 p-5 rounded-xl text-white">
                   <div className="flex items-center gap-2 mb-3">
                      <BrainCircuit className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-emerald-400">Gabay Protocol</span>
                   </div>
                   <h4 className="font-bold mb-2">Collaborative Mentoring</h4>
                   <p className="text-xs text-slate-400 mb-3">
                     Academic monitoring that empowers parents and supports teachers.
                   </p>
                   <div className="flex items-center gap-2 text-emerald-400 text-xs">
                     <div className="w-2 h-2 bg-emerald-400 rounded-full" /> REAL-TIME SYNC
                   </div>
                </div>
              </div>
            </motion.div>
) : (
            <motion.div 
              key="teacher"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
              {/* Sidebar for Teachers */}
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Faculty Hub</p>
                      <p className="text-xs text-slate-500">S.Y. 2025-2026</p>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    {[
                      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                      { id: 'classes', icon: Users, label: 'My Classes' },
                      { id: 'curriculum', icon: BookOpen, label: 'Curriculum' }
                    ].map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setActiveTeacherTab(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all text-sm",
                          activeTeacherTab === item.id 
                            ? "bg-slate-900 text-white" 
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <item.icon className="w-4 h-4" /> {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                   <p className="text-sm font-medium text-slate-600 mb-3">Communication</p>
                   <button 
                      onClick={() => setActiveTeacherTab('feedback')}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all text-sm",
                        activeTeacherTab === 'feedback' ? "bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <MessageSquare className="w-4 h-4" /> Home Feedback
                    </button>
                </div>

                <button 
                  onClick={() => setShowAddStudent(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all"
                >
                  <Users className="w-4 h-4" /> Add Student
                </button>

                <div className="bg-emerald-600 p-5 rounded-xl text-white">
                    <p className="text-xs text-emerald-200 mb-1">Class Health</p>
                    <h4 className="text-2xl font-bold mb-1">94%</h4>
                    <p className="text-xs text-emerald-200">Participation Rate</p>
                </div>
              </div>

              {/* Central Area: Student List & Encoding */}
              <div className="lg:col-span-3 space-y-6">
                <header className="flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Grade 8 • St. Jude Section</h1>
                    <p className="text-sm text-slate-500">Performance Encoding & Monitoring</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Period 1
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stats Overview */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900 p-6 rounded-xl text-white">
                        <p className="text-xs text-slate-400 mb-2">Authenticated Students</p>
                        <h3 className="text-3xl font-bold">{MOCK_STUDENTS.length}</h3>
                        <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full" /> ALL CONNECTED
                        </div>
                      </div>
                      <div className="bg-emerald-600 p-6 rounded-xl text-white">
                        <p className="text-xs text-emerald-200 mb-2">Class Completion</p>
                        <h3 className="text-3xl font-bold">94%</h3>
                        <div className="mt-4 flex items-center gap-2 text-emerald-100 text-xs">
                          <TrendingUp className="w-4 h-4" /> 2% INCREASE
                        </div>
                      </div>
                    </div>

                    {/* Student Performance Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Class Performance</h3>
                        <span className="text-xs text-slate-500">Live Updates</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-4 py-3 text-xs font-medium text-slate-500">Student</th>
                              <th className="px-4 py-3 text-xs font-medium text-slate-500">Average</th>
                              <th className="px-4 py-3 text-xs font-medium text-slate-500">Last Entry</th>
                              <th className="px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                              <th className="px-4 py-3"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {sortedStudents.slice(0, isExpandingStudents ? undefined : 8).map(student => {
                              const sGrades = grades.filter(g => g.studentId === student.id);
                              const avg = calculateAverage(sGrades);
                              const isSelected = selectedStudentId === student.id;
                              return (
                                <tr 
                                  key={student.id} 
                                  onClick={() => setSelectedStudentId(student.id)}
                                  className={cn(
                                    "hover:bg-slate-50 transition-colors cursor-pointer",
                                    isSelected && "bg-emerald-50"
                                  )}
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs",
                                        isSelected ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600"
                                      )}>
                                        {student.name.charAt(0)}
                                      </div>
                                      <span className="font-medium text-slate-900">{student.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="font-medium text-slate-700">{avg}%</span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-500">
                                    {sGrades[sGrades.length-1]?.score || 0}/{sGrades[sGrades.length-1]?.maxScore || 100}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", getStatusColor(avg))}>
                                      <div className={cn("w-1.5 h-1.5 rounded-full", avg >= 75 ? "bg-emerald-500" : "bg-rose-500")} />
                                      {avg >= 75 ? 'Stable' : 'Review'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button 
                                      onClick={() => alert(`Opening record for ${student.name}`)}
                                      className="p-1.5 text-slate-400 hover:text-slate-600"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                        <button 
                          onClick={() => setIsExpandingStudents(!isExpandingStudents)}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          {isExpandingStudents ? 'Collapse' : 'View All'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Encoding Panel */}
                  <div className="space-y-4">
                    <GradeEncoder 
                      students={MOCK_STUDENTS} 
                      subjects={MOCK_SUBJECTS}
                      selectedStudentId={selectedStudentId}
                      onAddGrade={handleAddGrade}
                      onAddFeedback={handleAddFeedback}
                    />

                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-start gap-3">
                       <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                       <div className="text-xs text-emerald-800">
                         <strong>Tip:</strong> Encouraging parents about small wins boosts student morale.
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
          <p className="text-xs text-slate-400">System Online</p>
        </div>
        <div className="flex gap-4">
          <button className="text-xs text-slate-500 hover:text-white">Privacy</button>
          <button className="text-xs text-slate-500 hover:text-white">Support</button>
        </div>
      </footer>

      <SuccessModal 
        show={successModal.show} 
        message={successModal.message} 
        onClose={() => setSuccessModal({ show: false, message: '' })} 
      />

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddStudent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddStudent(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" /> Add New Student
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Student Name</label>
                  <input 
                    type="text" 
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowAddStudent(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddStudent}
                    disabled={!newStudentName.trim()}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    Add Student
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

