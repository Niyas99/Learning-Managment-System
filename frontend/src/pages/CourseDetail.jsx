import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, BookOpen, Calendar, Award, Users, PlayCircle, 
  FileText, ExternalLink, CheckSquare, Square, CheckCircle, 
  Clock, AlertTriangle, Search, AlertCircle, RefreshCw, X
} from 'lucide-react';
import { coursesAPI } from '../api';
import Navbar from '../components/Navbar';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Tab states - persist last opened tab to localStorage
  const localStorageTabKey = `course_${id}_tab`;
  const [activeTab, setActiveTab] = useState(localStorage.getItem(localStorageTabKey) || 'materials');
  const [searchMaterial, setSearchMaterial] = useState('');
  
  // Toast notifications state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Remember this course as last opened
  useEffect(() => {
    localStorage.setItem('last_opened_course', id);
  }, [id]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    localStorage.setItem(localStorageTabKey, tabName);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Fetch course details
  const { data: course, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesAPI.retrieve(id),
  });

  // Toggle study material mutation with OPTIMISTIC UPDATE
  const toggleMaterialMutation = useMutation({
    mutationFn: ({ materialId, completed }) => 
      coursesAPI.toggleMaterial(materialId, completed),
    
    // On mutate, execute optimistic update
    onMutate: async ({ materialId, completed }) => {
      // 1. Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['course', id] });

      // 2. Snapshot the previous value
      const previousCourse = queryClient.getQueryData(['course', id]);

      // 3. Optimistically update the cache
      if (previousCourse) {
        let totalCompletions = 0;
        let totalMaterials = 0;
        
        // Deep copy the cached course details
        const updatedCourse = {
          ...previousCourse,
          modules: previousCourse.modules.map(module => {
            const updatedMaterials = module.study_materials.map(mat => {
              if (mat.id === materialId) {
                return { ...mat, completed };
              }
              return mat;
            });
            
            // Calculate module materials count
            totalMaterials += updatedMaterials.length;
            totalCompletions += updatedMaterials.filter(m => m.completed).length;

            return {
              ...module,
              study_materials: updatedMaterials
            };
          })
        };

        // Recalculate progress percentage
        updatedCourse.progress_percentage = totalMaterials > 0 
          ? Math.round((totalCompletions / totalMaterials) * 100) 
          : 0;

        queryClient.setQueryData(['course', id], updatedCourse);
      }

      // Return the snapshot context
      return { previousCourse };
    },

    // If mutation fails, rollback using previous snapshot context
    onError: (err, variables, context) => {
      if (context?.previousCourse) {
        queryClient.setQueryData(['course', id], context.previousCourse);
      }
      showToast('Connection failed. Progress changes could not be saved.', 'error');
    },

    // On success, show toast and refresh cache to align with server
    onSuccess: (data) => {
      showToast(
        data.completed 
          ? 'Material marked as completed!' 
          : 'Material marked as pending.', 
        'success'
      );
    },

    // Always refetch after success or error to ensure synchrony
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });

  const handleToggleMaterial = (materialId, currentCompleted) => {
    toggleMaterialMutation.mutate({ materialId, completed: !currentCompleted });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 rounded-xl px-4 py-3 shadow-lg border backdrop-blur-md transition-all duration-300 translate-y-0 ${
          toast.type === 'error' 
            ? 'bg-rose-50/90 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-900 dark:text-rose-250' 
            : 'bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-900 dark:text-emerald-250'
        }`}>
          <div className="shrink-0">
            {toast.type === 'error' ? <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" /> : <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          </div>
          <p className="text-sm font-medium">{toast.message}</p>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Skeleton Loading detail screen */}
      {isLoading && (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 rounded-2xl space-y-4">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            <div className="h-10 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-md"></div>
          </div>
        </div>
      )}

      {/* Error detail view */}
      {isError && (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-8 text-center dark:border-rose-950/50 dark:bg-rose-950/10 max-w-2xl mx-auto shadow-sm">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
            <h3 className="text-lg font-bold text-rose-800 dark:text-rose-400">Failed to Load Course Details</h3>
            <p className="text-sm text-rose-600 dark:text-rose-500 mt-2">
              {error?.response?.status === 403 
                ? "Unauthorized Access (IDOR Protection): You do not have enrollment permission to view this course."
                : error?.message || "An error occurred while loading this page."}
            </p>
            <div className="flex justify-center space-x-4 mt-6">
              <Link
                to="/"
                className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Dashboard</span>
              </Link>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center space-x-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Course Detail content */}
      {!isLoading && !isError && course && (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb back */}
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors duration-250"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Courses</span>
          </Link>

          {/* Banner Course Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 dark:border-slate-800/80 dark:bg-slate-900 shadow-sm mb-8 transition-colors">
            {/* Background design accents */}
            <div className="absolute right-0 top-0 -z-10 h-32 w-32 bg-violet-100 dark:bg-violet-950/20 rounded-full blur-3xl"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-md bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-750 dark:bg-violet-950/40 dark:text-violet-300">
                  {course.code}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {course.title}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                  {course.description}
                </p>
              </div>

              {/* Progress Panel */}
              <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-100 dark:border-slate-850 shrink-0">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  <span className="font-semibold">Overall Course Progress</span>
                  <span className="font-bold text-violet-650 dark:text-violet-400">{course.progress_percentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden mb-1">
                  <div 
                    className="h-full bg-violet-600 dark:bg-violet-500 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress_percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Alert bar if unassigned */}
            {!course.classroom_assigned && (
              <div className="mt-6 flex items-start space-x-2.5 rounded-lg bg-amber-50/60 p-4 text-xs sm:text-sm text-amber-850 border border-amber-100 dark:bg-amber-950/10 dark:border-amber-950/30 dark:text-amber-400 animate-pulse">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Not Assigned to Section:</span> You are currently enrolled, but classroom coordinators have not assigned you a Section yet. You will not be able to attend Live Classes, but you can read study materials and submit assignments.
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-850 mb-8 overflow-x-auto">
            <div className="flex space-x-6 min-w-max">
              {[
                { id: 'materials', label: 'Study Materials', icon: BookOpen },
                { id: 'sessions', label: 'Live Classes', icon: Calendar },
                { id: 'assignments', label: 'Assignments', icon: Award },
                { id: 'faculty', label: 'Faculty', icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center space-x-2 pb-4 text-sm font-semibold border-b-2 transition-all focus:outline-none ${
                      isSelected
                        ? 'border-violet-600 text-violet-650 dark:border-violet-400 dark:text-violet-400'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Contents */}
          <div className="min-h-[300px]">
            {/* STUDY MATERIALS TAB */}
            {activeTab === 'materials' && (
              <div className="space-y-6">
                {/* Search / Filter materials */}
                {course.modules?.length > 0 && (
                  <div className="relative max-w-md">
                    <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search study materials in this course..."
                      value={searchMaterial}
                      onChange={(e) => setSearchMaterial(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-100 transition-all"
                    />
                  </div>
                )}

                {course.modules?.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-sm">
                    <BookOpen className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-650 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Modules Released</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 px-4">
                      This course does not have any modules or study materials seeded yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {course.modules?.map((module) => {
                      // Filter study materials based on search keyword
                      const filteredMaterials = module.study_materials?.filter(m =>
                        m.title.toLowerCase().includes(searchMaterial.toLowerCase())
                      );

                      // If we are searching and this module has no matching materials, skip module rendering
                      if (searchMaterial && (!filteredMaterials || filteredMaterials.length === 0)) {
                        return null;
                      }

                      return (
                        <div key={module.id} className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden dark:border-slate-800/80 dark:bg-slate-900 shadow-sm">
                          <div className="bg-slate-50 px-6 py-4 border-b border-slate-250/20 dark:bg-slate-950/20 dark:border-slate-800/80">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center">
                              <span className="w-6 h-6 inline-flex justify-center items-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 text-xs font-bold mr-2">
                                {module.order}
                              </span>
                              {module.title}
                            </h3>
                          </div>

                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(!module.study_materials || module.study_materials.length === 0) ? (
                              <p className="p-6 text-sm text-slate-400 text-center">No study materials in this module.</p>
                            ) : (
                              filteredMaterials.map((material) => (
                                <div key={material.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                  <div className="flex items-center space-x-4 min-w-0">
                                    {/* Completion Checkbox */}
                                    <button
                                      onClick={() => handleToggleMaterial(material.id, material.completed)}
                                      disabled={toggleMaterialMutation.isPending}
                                      className="text-violet-650 hover:scale-105 active:scale-95 disabled:opacity-50 dark:text-violet-400 focus:outline-none transition-transform"
                                      aria-label={material.completed ? "Mark as pending" : "Mark as completed"}
                                    >
                                      {material.completed ? (
                                        <CheckSquare className="h-6 w-6 text-violet-600 dark:text-violet-400 fill-violet-50 dark:fill-violet-950/30" />
                                      ) : (
                                        <Square className="h-6 w-6 text-slate-350 dark:text-slate-600" />
                                      )}
                                    </button>

                                    {/* Resource Link Icon */}
                                    <a 
                                      href={material.content_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center space-x-2.5 min-w-0 group/link"
                                    >
                                      <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-950 text-slate-500 dark:text-slate-400 group-hover/link:bg-violet-50 dark:group-hover/link:bg-violet-950/50 group-hover/link:text-violet-600 dark:group-hover/link:text-violet-450 transition-colors">
                                        {material.material_type === 'video' ? <PlayCircle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                      </div>
                                      <div className="text-left min-w-0">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover/link:text-violet-600 dark:group-hover/link:text-violet-400 transition-colors truncate">
                                          {material.title}
                                        </h4>
                                        <span className="inline-flex items-center text-xs text-slate-400 dark:text-slate-500 font-medium capitalize mt-0.5">
                                          {material.material_type} Resource
                                          <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                        </span>
                                      </div>
                                    </a>
                                  </div>

                                  {/* Right pill state */}
                                  <div>
                                    {material.completed ? (
                                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                                        Done
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-650 dark:bg-slate-850 dark:text-slate-400">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* LIVE CLASSES TAB */}
            {activeTab === 'sessions' && (
              <div>
                {!course.classroom_assigned || !course.live_sessions || course.live_sessions.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-sm">
                    <Calendar className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-650 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Scheduled Live Classes</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 px-6">
                      {!course.classroom_assigned 
                        ? "Since you aren't assigned to a classroom, you cannot view scheduled live classes. Please contact administration."
                        : "There are currently no active or upcoming live classes scheduled for this classroom."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {course.live_sessions.map((session) => (
                      <div 
                        key={session.id} 
                        className={`rounded-2xl border bg-white p-6 dark:bg-slate-900 shadow-sm flex flex-col justify-between ${
                          session.status === 'ongoing' 
                            ? 'border-violet-550 ring-2 ring-violet-550/20 dark:border-violet-500' 
                            : 'border-slate-200/80 dark:border-slate-800/80'
                        }`}
                      >
                        <div>
                          {/* Live Session Status Badges */}
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs text-slate-450 dark:text-slate-500 flex items-center space-x-1.5 font-medium">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{new Date(session.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </span>
                            
                            {session.status === 'upcoming' && (
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
                                Upcoming
                              </span>
                            )}
                            {session.status === 'ongoing' && (
                              <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-850 dark:bg-violet-950/40 dark:text-violet-300 animate-pulse">
                                Live Now
                              </span>
                            )}
                            {session.status === 'completed' && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-650 dark:bg-slate-850 dark:text-slate-400">
                                Completed
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {session.title}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            {session.description || "No description provided."}
                          </p>
                        </div>

                        {/* Session link button */}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Duration: {Math.round((new Date(session.end_time) - new Date(session.start_time)) / 60000)} mins
                          </span>
                          
                          {session.status === 'completed' ? (
                            <button 
                              disabled
                              className="inline-flex items-center space-x-1.5 rounded-lg bg-slate-100 px-3.5 py-1.5 text-sm font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                            >
                              Closed
                            </button>
                          ) : (
                            <a
                              href={session.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-sm font-bold shadow-sm transition-all duration-200 ${
                                session.status === 'ongoing'
                                  ? 'bg-violet-600 text-white hover:bg-violet-700'
                                  : 'bg-white text-slate-750 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span>{session.status === 'ongoing' ? 'Join Lecture' : 'Lecture Room'}</span>
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ASSIGNMENTS TAB */}
            {activeTab === 'assignments' && (
              <div className="space-y-6">
                {(!course.modules || course.modules.every(m => !m.assignments || m.assignments.length === 0)) ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-sm">
                    <Award className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-650 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Assignments Active</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 px-4">
                      This course does not have any assignments published in its modules.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {course.modules.map(module => {
                      if (!module.assignments || module.assignments.length === 0) return null;
                      return (
                        <div key={module.id} className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                            {module.title}
                          </h4>
                          
                          <div className="space-y-4">
                            {module.assignments.map((assignment) => (
                              <div key={assignment.id} className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800/80 dark:bg-slate-900 shadow-sm transition-all duration-300 flex flex-col md:flex-row justify-between md:items-center gap-6">
                                <div>
                                  {/* Status Labels */}
                                  <div className="flex items-center space-x-3 mb-2.5">
                                    {assignment.status_label === 'published' && (
                                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-805 dark:bg-blue-950/20 dark:text-blue-400">
                                        Open / Pending
                                      </span>
                                    )}
                                    {assignment.status_label === 'submitted' && (
                                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-805 dark:bg-amber-950/20 dark:text-amber-455">
                                        Submitted for Review
                                      </span>
                                    )}
                                    {assignment.status_label === 'evaluated' && (
                                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-805 dark:bg-emerald-950/20 dark:text-emerald-450">
                                        Graded
                                      </span>
                                    )}

                                    <span className="text-xs text-slate-400 dark:text-slate-505">
                                      Due: {new Date(assignment.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>

                                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {assignment.title}
                                  </h3>
                                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
                                    {assignment.description}
                                  </p>

                                  {/* Graded/Evaluated Feedback section */}
                                  {assignment.status_label === 'evaluated' && assignment.feedback && (
                                    <div className="mt-3.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Faculty Feedback:</span>
                                      <p className="text-sm text-slate-650 dark:text-slate-350 italic">"{assignment.feedback}"</p>
                                    </div>
                                  )}
                                </div>

                                {/* Scoring Panel */}
                                <div className="shrink-0 flex items-center md:flex-col gap-4 md:gap-1.5 md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                                  <div className="text-left md:text-right">
                                    <span className="text-xs text-slate-405 dark:text-slate-500 block font-semibold">Grades Obtained</span>
                                    <span className="text-xl font-extrabold tracking-tight text-slate-850 dark:text-white">
                                      {assignment.status_label === 'evaluated' 
                                        ? `${assignment.marks_obtained}` 
                                        : '—'}
                                      <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">/{assignment.max_marks}</span>
                                    </span>
                                  </div>

                                  {assignment.status_label === 'published' && (
                                    <button 
                                      onClick={() => showToast('To submit assignments, please upload via the student portal or deploy in custom branches.', 'info')}
                                      className="rounded-lg bg-violet-650 hover:bg-violet-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors"
                                    >
                                      Submit File
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* FACULTY TAB */}
            {activeTab === 'faculty' && (
              <div>
                {!course.faculty || course.faculty.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-sm">
                    <Users className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-650 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Faculty Assigned</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 px-4">
                      There are currently no faculty teachers assigned to this course's section.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {course.faculty.map((member) => (
                      <div key={member.id} className="rounded-2xl border border-slate-200/85 bg-white p-6 dark:border-slate-800/85 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-250 flex flex-col items-center text-center">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
                          alt={member.name}
                          className="h-20 w-20 rounded-full object-cover border-2 border-violet-100 dark:border-violet-950"
                        />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">
                          {member.name}
                        </h3>
                        <span className="text-xs text-violet-650 dark:text-violet-400 font-semibold mt-0.5">
                          {member.email}
                        </span>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-3">
                          {member.bio || "No profile bio provided by teacher."}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
