import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Grid, List, AlertTriangle, CheckCircle, 
  Hourglass, LayoutGrid, AlertCircle, RefreshCw, BookOpen
} from 'lucide-react';
import { coursesAPI } from '../api';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterClassroom, setFilterClassroom] = useState('all'); // 'all', 'assigned', 'unassigned'
  const [viewMode, setViewMode] = useState(localStorage.getItem('dashboard_view') || 'grid'); // 'grid', 'list'

  const { data: courses, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesAPI.list,
  });

  const toggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('dashboard_view', mode);
  };

  // Filter courses based on search text and classroom assignment
  const filteredCourses = courses?.filter((course) => {
    const matchesSearch = 
      course.title.toLowerCase().includes(search.toLowerCase()) || 
      course.code.toLowerCase().includes(search.toLowerCase());
    
    if (filterClassroom === 'assigned') {
      return matchesSearch && course.classroom_assigned;
    } else if (filterClassroom === 'unassigned') {
      return matchesSearch && !course.classroom_assigned;
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              My Courses
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Welcome back! Here are the academic courses you are enrolled in.
            </p>
          </div>

          {/* View Toggles */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleViewMode('grid')}
              className={`rounded-lg p-2 transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400' 
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
              title="Grid View"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => toggleViewMode('list')}
              className={`rounded-lg p-2 transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400' 
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
              title="List View"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute top-3 left-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by course code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 transition-all duration-200"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all duration-200"
          >
            <option value="all">All Classrooms</option>
            <option value="assigned">Classroom Assigned</option>
            <option value="unassigned">Not Assigned Yet</option>
          </select>
        </div>

        {/* Loading skeleton screen */}
        {isLoading && (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                <div className="space-y-2 pt-4">
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-6 text-center dark:border-rose-950/50 dark:bg-rose-950/10 max-w-2xl mx-auto">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
            <h3 className="text-lg font-bold text-rose-800 dark:text-rose-400">Failed to Load Courses</h3>
            <p className="text-sm text-rose-600 dark:text-rose-500 mt-2">{error?.message || "An unexpected network error occurred."}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center space-x-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* Render Courses list */}
        {!isLoading && !isError && (
          <>
            {filteredCourses?.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl mx-auto shadow-sm">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Courses Found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 px-4">
                  We couldn't find any courses matching your search query or filter criteria.
                </p>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredCourses?.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className={`group relative rounded-2xl border bg-white p-6 dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-850 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                      course.classroom_assigned 
                        ? 'border-slate-200/80 dark:border-slate-800/80' 
                        : 'border-amber-200/80 dark:border-amber-950/40 bg-amber-50/5 dark:bg-amber-950/2'
                    }`}
                  >
                    <div>
                      {/* Top labels */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-violet-100 group-hover:text-violet-800 dark:group-hover:bg-violet-950/50 dark:group-hover:text-violet-300 transition-colors duration-200">
                          {course.code}
                        </span>
                        
                        {/* Classroom Warning indicator */}
                        {course.classroom_assigned ? (
                          <span className="inline-flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>No Classroom</span>
                          </span>
                        )}
                      </div>

                      {/* Course Title */}
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200">
                        {course.title}
                      </h2>
                      
                      {/* Description */}
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                        {course.description}
                      </p>
                    </div>

                    {/* Progress Area */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      {/* Alert Card if unassigned */}
                      {!course.classroom_assigned && (
                        <div className="mb-4 rounded-lg bg-amber-50/60 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-950/40">
                          <div className="flex items-start space-x-1.5">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                            <span>
                              <strong>Enrolled:</strong> You aren't assigned to a section/classroom yet. You won't see live sessions.
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span className="font-semibold">Course Progress</span>
                        <span>{course.progress_percentage}%</span>
                      </div>
                      
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-600 dark:bg-violet-500 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${course.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
