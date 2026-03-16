import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from 'react-router-dom';

// Toast
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Icons
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AppsIcon from "@mui/icons-material/Apps";
import ViewListIcon from "@mui/icons-material/ViewList";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import bannerLearning from '../images/enrollment/girl.png';

const Enrollments = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [filteredEnrollments, setFilteredEnrollments] = useState([]);
    const [viewMode, setViewMode] = useState("grid");
    const [loading, setLoading] = useState(true);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [updatingProgress, setUpdatingProgress] = useState(false);
    const [editingProgress, setEditingProgress] = useState(false);
    const [newProgress, setNewProgress] = useState(0);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [showFilters, setShowFilters] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        averageProgress: 0
    });

    const user = JSON.parse(localStorage.getItem("user"));
    const navigate = useNavigate();
    const location = useLocation();

    const sortEnrollments = (enrollments, sortType) => {
        const activeEnrollments = enrollments.filter(e => e.status !== 'cancelled');
        const cancelledEnrollments = enrollments.filter(e => e.status === 'cancelled');

        // Sort active enrollments based on selected sort option
        switch (sortType) {
            case 'recent':
                activeEnrollments.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
                cancelledEnrollments.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
                break;
            case 'progress':
                activeEnrollments.sort((a, b) => b.progress - a.progress);
                cancelledEnrollments.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
                break;
            case 'title':
                activeEnrollments.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
                cancelledEnrollments.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
                break;
            default:
                break;
        }

        // Return active enrollments first, then cancelled
        return [...activeEnrollments, ...cancelledEnrollments];
    };

    useEffect(() => {
        fetchEnrollments();
        if (location.state?.enrollmentSuccess) {
            toast.success(location.state.message || "Successfully enrolled in course!");
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, []);

    // Filter and sort enrollments
    useEffect(() => {
        let filtered = [...enrollments];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(e =>
                e.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.instructor.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(e => e.status === statusFilter);
        }

        // Apply sorting with cancelled courses at bottom
        filtered = sortEnrollments(filtered, sortBy);

        setFilteredEnrollments(filtered);
    }, [enrollments, searchTerm, statusFilter, sortBy]);

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `http://localhost:3003/api/enrollment/user/${user.id}`
            );
            setEnrollments(res.data);
            setFilteredEnrollments(res.data);
            calculateStats(res.data);
        } catch (err) {
            toast.error("Failed to load enrollments");
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (enrollmentsData) => {
        const total = enrollmentsData.length;
        const completed = enrollmentsData.filter(e => e.progress === 100).length;
        const inProgress = enrollmentsData.filter(e => e.progress > 0 && e.progress < 100).length;
        const totalProgress = enrollmentsData.reduce((sum, e) => sum + (e.progress || 0), 0);
        const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;

        setStats({
            total,
            completed,
            inProgress,
            averageProgress
        });
    };

    const openEnrollmentDetail = (enrollment) => {
        setSelectedEnrollment(enrollment);
        setNewProgress(enrollment.progress || 0);
        setEditingProgress(false);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedEnrollment(null);
        setEditingProgress(false);
    };

    const updateProgress = async () => {
        if (!selectedEnrollment) return;

        if (newProgress < selectedEnrollment.progress) {
            toast.warning("Learning is forward only! ");
            return;
        }

        setUpdatingProgress(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:3003/api/enrollment/${selectedEnrollment._id}/progress`,
                { progress: newProgress },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                toast.success('Progress updated successfully!');
                setSelectedEnrollment({ ...selectedEnrollment, progress: newProgress });
                setEditingProgress(false);

                // Update the enrollment in the list
                const updatedEnrollments = enrollments.map(e =>
                    e._id === selectedEnrollment._id ? { ...e, progress: newProgress } : e
                );
                setEnrollments(updatedEnrollments);
                calculateStats(updatedEnrollments);
            }
        } catch (error) {
            console.error('Progress update error:', error);
            toast.error(error.response?.data?.message || 'Failed to update progress');
        } finally {
            setUpdatingProgress(false);
        }
    };

    const cancelEnrollment = (id, title, progress) => {
        //prevent cancellation if progress >= 50
        if (progress >= 50) {
            toast.warning("Cannot cancel enrollment - You've already completed 50% or more of the course!");
            return;
        }

        toast(
            ({ closeToast }) => (
                <div>
                    <p style={{ marginBottom: "10px" }}>
                        Cancel enrollment for <b>{title}</b> ?
                    </p>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            style={styles.confirmBtn}
                            onClick={async () => {
                                try {
                                    const token = localStorage.getItem('token');
                                    await axios.delete(
                                        `http://localhost:3003/api/enrollment/${id}`,
                                        {
                                            headers: {
                                                'Authorization': `Bearer ${token}`
                                            }
                                        }
                                    );
                                    toast.success(`${title} enrollment cancelled`);
                                    fetchEnrollments();
                                    closeToast();
                                } catch (err) {
                                    toast.error("Failed to cancel enrollment");
                                }
                            }}
                        >
                            Yes
                        </button>
                        <button style={styles.cancelConfirmBtn} onClick={closeToast}>
                            No
                        </button>
                    </div>
                </div>
            ),
            { autoClose: false }
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#00b4b4';
            case 'completed': return '#2e7d32';
            case 'cancelled': return '#e74c3c';
            default: return '#888';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <AccessTimeIcon style={{ fontSize: 16 }} />;
            case 'completed': return <EmojiEventsIcon style={{ fontSize: 16 }} />;
            case 'cancelled': return <CancelIcon style={{ fontSize: 16 }} />;
            default: return null;
        }
    };

    const getProgressColor = (progress) => {
        if (progress === 100) return '#2e7d32';
        if (progress >= 75) return '#00b4b4';
        if (progress >= 50) return '#f39c12';
        if (progress >= 25) return '#f1c40f';
        return '#e74c3c';
    };

    return (
        <div style={styles.page}>
            <ToastContainer position="top-center" autoClose={3000} />

            {/* Hero Section with Blob Effects */}
            <section style={styles.hero}>
                <div style={styles.blob1} />
                <div style={styles.blob2} />
                <div style={styles.heroInner}>
                    <div style={styles.heroLeft}>
                        <span style={styles.heroEyebrow}>
                            My Enrollments
                        </span>
                        <h1 style={{ ...styles.heroTitle, fontFamily: "'Jakarta-Sans', sans-serif" }}>
                            Track Your Progress<br />& Achieve Your Goals
                        </h1>
                        <p style={styles.heroSub}>
                            Monitor your course progress, update completion status,
                            and manage all your enrollments in one place.
                        </p>
                        <div style={styles.heroBtns}>
                            <button className="hero-btn-primary" style={styles.heroBtnPrimary}
                                onClick={() => document.getElementById('enrollments-section').scrollIntoView({ behavior: 'smooth' })}>
                                View My Courses
                            </button>
                            <button className="hero-btn-secondary" style={styles.heroBtnSecondary}
                                onClick={() => navigate('/courses')}>
                                Explore More Courses
                            </button>
                        </div>
                        <div style={styles.blob3} />
                    </div>
                    <div style={styles.heroRight}>

                        <div style={{ ...styles.heroCircle, top: '70%', right: '30%' }}>
                            <img src={bannerLearning} alt="Students"
                                style={{ width: '550px', objectFit: 'contain', borderRadius: '12px' }} />
                        </div>
                        <div style={{ ...styles.floatBadge, top: '10%', right: '-35%' }} className="float-badge">
                            <SchoolIcon style={{ fontSize: '16px', color: '#00a89d' }} />
                            <span style={styles.floatBadgeText}>{stats.total} Courses Enrolled</span>
                        </div>
                        <div style={{ ...styles.floatBadge, bottom: '-15%', left: '-5%' }} className="float-badge-2">
                            <EmojiEventsIcon style={{ fontSize: '16px', color: '#00a89d' }} />
                            <span style={styles.floatBadgeText}>{stats.completed} Completed</span>
                        </div>
                        <div style={{ ...styles.floatBadge, bottom: '8%', right: '-50%' }} className="float-badge">
                            <TrendingUpIcon style={{ fontSize: '16px', color: '#00a89d' }} />
                            <span style={styles.floatBadgeText}>{stats.averageProgress}% Avg Progress</span>
                        </div>
                        <div style={{ ...styles.dot, top: '120%', left: '-25%', width: '14px', height: '14px', opacity: 0.5 }} />
                        <div style={{ ...styles.dot, bottom: '25%', right: '-25%', width: '20px', height: '20px', opacity: 0.3 }} />
                        <div style={{ ...styles.dot, top: '55%', left: '-38%', width: '10px', height: '10px', opacity: 0.4 }} />
                    </div>
                </div>
            </section>

            {/* Stats Cards */}
            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconWrap, backgroundColor: '#e8fafa' }}>
                        <MenuBookIcon style={{ ...styles.statIcon, color: '#00b4b4' }} />
                    </div>
                    <div>
                        <h3 style={styles.statNum}>{stats.total}</h3>
                        <p style={styles.statLbl}>Total Enrolled</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconWrap, backgroundColor: '#e6f7e6' }}>
                        <EmojiEventsIcon style={{ ...styles.statIcon, color: '#2e7d32' }} />
                    </div>
                    <div>
                        <h3 style={styles.statNum}>{stats.completed}</h3>
                        <p style={styles.statLbl}>Completed</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconWrap, backgroundColor: '#fff3e0' }}>
                        <TrendingUpIcon style={{ ...styles.statIcon, color: '#f39c12' }} />
                    </div>
                    <div>
                        <h3 style={styles.statNum}>{stats.inProgress}</h3>
                        <p style={styles.statLbl}>In Progress</p>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconWrap, backgroundColor: '#e8e8ff' }}>
                        <SchoolIcon style={{ ...styles.statIcon, color: '#6c63ff' }} />
                    </div>
                    <div>
                        <h3 style={styles.statNum}>{stats.averageProgress}%</h3>
                        <p style={styles.statLbl}>Avg. Progress</p>
                    </div>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div id="enrollments-section" style={styles.filterSection}>
                <div style={styles.filterBar}>
                    <div style={styles.searchWrap}>
                        <SearchIcon style={styles.searchIcon} />
                        <input
                            className="search-input"
                            style={styles.searchInput}
                            placeholder="Search by course title or instructor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button style={styles.clearBtn} onClick={() => setSearchTerm('')}>
                                <CloseIcon style={{ fontSize: '16px', color: '#aaa' }} />
                            </button>
                        )}
                    </div>

                    <button
                        style={styles.filterToggleBtn}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FilterListIcon /> Filters
                    </button>

                    <select
                        className="filter-select"
                        style={styles.select}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="recent">Most Recent</option>
                        <option value="progress">Highest Progress</option>
                        <option value="title">Course Title</option>
                    </select>

                    <span style={styles.resultsCount}>
                        {filteredEnrollments.length} course{filteredEnrollments.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Filter Chips */}
                {showFilters && (
                    <div style={styles.filterChips}>
                        <button
                            className="category-chip"
                            onClick={() => setStatusFilter('all')}
                            style={{ ...styles.chip, ...(statusFilter === 'all' ? styles.chipActive : {}) }}
                        >
                            All
                        </button>
                        <button
                            className="category-chip"
                            onClick={() => setStatusFilter('active')}
                            style={{ ...styles.chip, ...(statusFilter === 'active' ? styles.chipActive : {}) }}
                        >
                            Active
                        </button>
                        <button
                            className="category-chip"
                            onClick={() => setStatusFilter('completed')}
                            style={{ ...styles.chip, ...(statusFilter === 'completed' ? styles.chipActive : {}) }}
                        >
                            Completed
                        </button>
                        <button
                            className="category-chip"
                            onClick={() => setStatusFilter('cancelled')}
                            style={{ ...styles.chip, ...(statusFilter === 'cancelled' ? styles.chipActive : {}) }}
                        >
                            Cancelled
                        </button>
                    </div>
                )}
            </div>

            {/* View Toggle */}
            <div style={styles.toggleWrapper}>
                <button
                    style={{
                        ...styles.toggleBtn,
                        backgroundColor: viewMode === "grid" ? "#00b4b4" : "#ccc",
                    }}
                    onClick={() => setViewMode("grid")}
                >
                    <AppsIcon style={{ fontSize: 18 }} /> Grid
                </button>
                <button
                    style={{
                        ...styles.toggleBtn,
                        backgroundColor: viewMode === "list" ? "#00b4b4" : "#ccc",
                    }}
                    onClick={() => setViewMode("list")}
                >
                    <ViewListIcon style={{ fontSize: 18 }} /> List
                </button>
            </div>

            {/* Main Content Area */}
            <section style={styles.section}>
                <div style={styles.mainContainer}>

                    {/* LEFT SIDE: Enrollment Cards Container */}
                    <div style={{
                        ...styles.cardsContainer,
                        flexDirection: viewMode === "list" ? "column" : "row",
                    }}>
                        {loading ? (
                            <div style={styles.loadingWrap}>
                                <div style={styles.spinner}></div>
                                <p style={styles.loadingText}>Loading your courses...</p>
                            </div>
                        ) : filteredEnrollments.length === 0 ? (
                            <div style={styles.emptyState}>
                                <SchoolIcon style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                                <h3 style={styles.emptyTitle}>No Enrollments Found</h3>
                                <p style={styles.emptyText}>
                                    {searchTerm || statusFilter !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Browse our courses and start your learning journey today!'}
                                </p>
                                <button
                                    style={styles.browseBtn}
                                    onClick={() => navigate('/courses')}
                                >
                                    Browse Courses
                                </button>
                            </div>
                        ) : (
                            filteredEnrollments.map((enroll) => {
                                const progressColor = getProgressColor(enroll.progress);
                                const statusColor = getStatusColor(enroll.status);

                                return (
                                    <div
                                        key={enroll._id}
                                        className="course-card"
                                        style={{
                                            ...styles.courseCard,
                                            width: viewMode === "list" ? "100%" : "320px",
                                            maxWidth: viewMode === "list" ? "100%" : "320px",
                                            display: viewMode === "list" ? "flex" : "block",
                                            alignItems: "center",
                                            justifyContent: viewMode === "list" ? "space-between" : "initial",
                                            gap: viewMode === "list" ? "20px" : "0",
                                            boxSizing: "border-box",
                                            borderTop: `4px solid ${statusColor}`,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => openEnrollmentDetail(enroll)}
                                    >
                                        {/* Course info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={styles.metaRow}>
                                                <span style={{
                                                    ...styles.courseCategory,
                                                    backgroundColor: `${statusColor}15`,
                                                    color: statusColor
                                                }}>
                                                    {getStatusIcon(enroll.status)}
                                                    <span style={{ marginLeft: 4 }}>{enroll.status}</span>
                                                </span>
                                            </div>
                                            <h3 style={styles.courseTitle}>{enroll.courseTitle}</h3>
                                            <div style={styles.metaRow}>
                                                <PersonIcon style={styles.metaIcon} />
                                                <span style={styles.metaText}>{enroll.instructor}</span>
                                            </div>
                                            <div style={styles.metaRow}>
                                                <AccessTimeIcon style={styles.metaIcon} />
                                                <span style={styles.metaText}>
                                                    Enrolled: {new Date(enroll.enrolledAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Circle */}
                                        <div style={styles.progressCircleContainer}>
                                            <svg width="70" height="70" viewBox="0 0 36 36">
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="#eee"
                                                    strokeWidth="3"
                                                />
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke={progressColor}
                                                    strokeWidth="3"
                                                    strokeDasharray={`${enroll.progress}, 100`}
                                                    strokeLinecap="round"
                                                />
                                                <text x="18" y="20.5" textAnchor="middle" fontSize="6" fill="#333" fontWeight="bold">
                                                    {enroll.progress}%
                                                </text>
                                            </svg>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* RIGHT SIDE: Learning Insights (only in list view) */}
                    {viewMode === "list" && filteredEnrollments.length > 0 && (
                        <div style={styles.sideImgArea}>
                            <div style={styles.insightsHeader}>
                                <SchoolIcon style={{ fontSize: 32, color: '#00b4b4' }} />
                                <h3 style={styles.insightsTitle}>Learning Insights</h3>
                            </div>

                            <div style={styles.insightsContent}>
                                <div style={styles.insightItem}>
                                    <span style={styles.insightLabel}>Total Learning Time</span>
                                    <span style={styles.insightValue}>
                                        {Math.round(stats.total * 15)} hours
                                    </span>
                                </div>
                                <div style={styles.insightItem}>
                                    <span style={styles.insightLabel}>Completion Rate</span>
                                    <span style={styles.insightValue}>
                                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                                    </span>
                                </div>
                                <div style={styles.insightItem}>
                                    <span style={styles.insightLabel}>Active Courses</span>
                                    <span style={styles.insightValue}>{stats.inProgress}</span>
                                </div>
                            </div>

                            <div style={styles.progressSummary}>
                                <div style={styles.summaryItem}>
                                    <span style={styles.summaryLabel}>Completed</span>
                                    <span style={{ ...styles.summaryValue, color: '#2e7d32' }}>{stats.completed}</span>
                                </div>
                                <div style={styles.summaryItem}>
                                    <span style={styles.summaryLabel}>In Progress</span>
                                    <span style={{ ...styles.summaryValue, color: '#f39c12' }}>{stats.inProgress}</span>
                                </div>
                                <div style={styles.summaryItem}>
                                    <span style={styles.summaryLabel}>Avg. Progress</span>
                                    <span style={{ ...styles.summaryValue, color: '#00b4b4' }}>{stats.averageProgress}%</span>
                                </div>
                            </div>

                            <p style={styles.insightsFooter}>
                                Click on any course to update your progress!
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Course Detail Modal (keep existing modal code) */}
            {modalOpen && selectedEnrollment && (
                <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div style={styles.modal} className="modal-anim">
                        {/* Modal Header */}
                        <div style={{
                            ...styles.modalHeader,
                            background: `linear-gradient(135deg, ${getStatusColor(selectedEnrollment.status)} 0%, ${getStatusColor(selectedEnrollment.status)}dd 100%)`
                        }}>
                            <div style={styles.modalHeaderContent}>
                                <SchoolIcon style={{ fontSize: 32, color: '#fff' }} />
                                <div style={{ flex: 1 }}>
                                    <p style={styles.modalCategory}>{selectedEnrollment.status}</p>
                                    <h2 style={styles.modalTitle}>{selectedEnrollment.courseTitle}</h2>
                                </div>
                                <button style={styles.modalCloseBtn} onClick={closeModal}>
                                    <CloseIcon style={{ fontSize: 18, color: '#fff' }} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div style={styles.modalBody}>
                            {/* Instructor and Enrollment Date */}
                            <div style={styles.modalInfoGrid}>
                                <div style={styles.modalInfoItem}>
                                    <PersonIcon style={styles.modalInfoIcon} />
                                    <div>
                                        <p style={styles.modalInfoLabel}>Instructor</p>
                                        <p style={styles.modalInfoValue}>{selectedEnrollment.instructor}</p>
                                    </div>
                                </div>
                                <div style={styles.modalInfoItem}>
                                    <AccessTimeIcon style={styles.modalInfoIcon} />
                                    <div>
                                        <p style={styles.modalInfoLabel}>Enrolled On</p>
                                        <p style={styles.modalInfoValue}>
                                            {new Date(selectedEnrollment.enrolledAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Section */}
                            <div style={styles.progressSection}>
                                <div style={styles.progressHeader}>
                                    <h3 style={styles.progressTitle}>Course Progress</h3>
                                    {!editingProgress ? (
                                        <button
                                            style={styles.editProgressBtn}
                                            onClick={() => setEditingProgress(true)}
                                            disabled={selectedEnrollment.status === 'cancelled' || selectedEnrollment.progress === 100}
                                        >
                                            <EditIcon style={{ fontSize: 16 }} /> Update Progress
                                        </button>
                                    ) : (
                                        <button
                                            style={styles.saveProgressBtn}
                                            onClick={updateProgress}
                                            disabled={updatingProgress}
                                        >
                                            {updatingProgress ? (
                                                <div style={styles.smallSpinner} />
                                            ) : (
                                                <SaveIcon style={{ fontSize: 16 }} />
                                            )}
                                            {updatingProgress ? 'Saving...' : 'Save'}
                                        </button>
                                    )}
                                </div>

                                {editingProgress ? (
                                    <div style={styles.progressEditor}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={newProgress}
                                            onChange={(e) => setNewProgress(parseInt(e.target.value))}
                                            style={styles.progressSlider}
                                        />
                                        <div style={styles.progressValueDisplay}>
                                            <span style={styles.progressValue}>{newProgress}%</span>
                                            <span style={styles.progressStatus}>
                                                {newProgress === 100 ? 'Completed!' :
                                                    newProgress > 0 ? 'In Progress' : 'Not Started'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={styles.progressDisplay}>
                                        <div style={styles.progressBar}>
                                            <div style={{
                                                ...styles.progressFill,
                                                width: `${selectedEnrollment.progress}%`,
                                                backgroundColor: getProgressColor(selectedEnrollment.progress)
                                            }} />
                                        </div>
                                        <div style={styles.progressStats}>
                                            <span style={styles.progressPercentage}>
                                                {selectedEnrollment.progress}% Complete
                                            </span>
                                            {selectedEnrollment.progress === 100 && (
                                                <span style={styles.completedBadge}>
                                                    <EmojiEventsIcon style={{ fontSize: 16 }} /> Course Completed!
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div style={styles.modalActions}>
                                {selectedEnrollment.status !== 'cancelled' && selectedEnrollment.progress < 50 && (
                                    <button
                                        style={styles.cancelEnrollmentBtn}
                                        onClick={() => {
                                            closeModal();
                                            cancelEnrollment(selectedEnrollment._id, selectedEnrollment.courseTitle, selectedEnrollment.progress);
                                        }}
                                    >
                                        <CancelIcon style={{ fontSize: 18 }} /> Cancel Enrollment
                                    </button>
                                )}
                                <button
                                    style={styles.closeModalBtn}
                                    onClick={closeModal}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: {
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        backgroundColor: "#f5f6fa",
        minHeight: "100vh"
    },
    hero: {
        position: 'relative',
        background: 'linear-gradient(135deg, #f0fafa 0%, #e0f7f6 50%, #ccf0ee 100%)',
        padding: '70px 60px',
        overflow: 'hidden',
        minHeight: '300px',
    },
    blob1: {
        position: 'absolute', top: '-60px', right: '25%',
        width: '220px', height: '220px', borderRadius: '50%',
        background: 'rgba(0,168,157,0.25)', pointerEvents: 'none',
    },
    blob2: {
        position: 'absolute', bottom: '-40px', right: '-2%',
        width: '160px', height: '160px', borderRadius: '50%',
        background: 'rgba(0,168,157,0.35)', pointerEvents: 'none',
    },
    blob3: {
        position: 'absolute', top: '20%', left: '-20%',
        width: '220px', height: '220px', borderRadius: '50%',
        background: 'rgba(0,168,157,0.3)', pointerEvents: 'none',
    },

    heroInner: {
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '5px',
        maxWidth: '100%', margin: '0 auto',
        marginLeft: '160px', marginRight: '160px', height: '300px'
    },
    heroLeft: { flex: 1, maxWidth: '650px' },
    heroEyebrow: {
        display: 'inline-block', backgroundColor: '#00a89d', color: '#fff',
        padding: '5px 16px', borderRadius: '20px', fontSize: '13px',
        fontWeight: '700', marginBottom: '18px',
    },
    heroTitle: {
        fontSize: '48px', fontWeight: '800', color: '#004040',
        margin: '0 0 18px', lineHeight: '1.2',
    },
    heroSub: { fontSize: '17px', color: '#1a5050', lineHeight: '1.8', margin: '0 0 30px' },
    heroBtns: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
    heroBtnPrimary: {
        backgroundColor: '#00a89d', color: '#fff', border: 'none',
        padding: '13px 32px', borderRadius: '8px', cursor: 'pointer',
        fontSize: '15px', fontWeight: '700', transition: 'all 0.2s',
        boxShadow: '0 4px 14px rgba(0,168,157,0.3)', fontFamily: "'DM Sans', sans-serif",
    },
    heroBtnSecondary: {
        backgroundColor: '#fff', color: '#00a89d', border: '1.5px solid #00a89d',
        padding: '13px 32px', borderRadius: '8px', cursor: 'pointer',
        fontSize: '15px', fontWeight: '700', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
    },
    heroRight: { position: 'relative', width: '360px', height: '300px', flexShrink: 0 },
    heroCircle: {
        position: 'absolute', top: '65%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '480px', height: '480px', borderRadius: '50%',
        //background: 'linear-gradient(135deg, #00a89d, #007a75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        //boxShadow: '0 12px 40px rgba(0,168,157,0.35)',
    },
    floatBadge: {
        position: 'absolute', backgroundColor: '#fff', borderRadius: '30px',
        padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '7px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '12px',
        fontWeight: '600', color: '#2c3e50', whiteSpace: 'nowrap',
    },
    floatBadgeText: { fontSize: '12px', color: '#2c3e50', fontWeight: '600' },
    dot: {
        position: 'absolute', borderRadius: '50%',
        background: 'linear-gradient(135deg, #00a89d, #007a75)',
    },
    statsRow: {
        display: 'flex',
        gap: '20px',
        padding: '30px 60px 0',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '1400px',
        margin: '0 auto'
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '20px 30px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
        flex: '1',
        minWidth: '180px'
    },
    statIconWrap: {
        width: '55px',
        height: '55px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    statIcon: {
        fontSize: '28px'
    },
    statNum: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#2c3e50',
        margin: 0
    },
    statLbl: {
        color: '#888',
        fontSize: '13px',
        margin: 0
    },
    filterSection: {
        padding: '30px 60px 0',
        maxWidth: '1400px',
        margin: '0 auto'
    },
    filterBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '18px',
        flexWrap: 'wrap'
    },
    searchWrap: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        minWidth: '220px'
    },
    searchIcon: {
        position: 'absolute',
        left: '16px',
        color: '#bbb',
        fontSize: '20px',
        pointerEvents: 'none'
    },
    searchInput: {
        width: '100%',
        padding: '13px 42px 13px 46px',
        borderRadius: '30px',
        border: '1.5px solid #e0e0e0',
        fontSize: '14px',
        outline: 'none',
        backgroundColor: '#fff',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        fontFamily: "'DM Sans', sans-serif",
    },
    clearBtn: {
        position: 'absolute',
        right: '14px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '2px',
    },
    filterToggleBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '11px 20px',
        borderRadius: '30px',
        border: '1.5px solid #e0e0e0',
        backgroundColor: '#fff',
        color: '#555',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#f5f5f5'
        }
    },
    select: {
        padding: '13px 20px',
        borderRadius: '30px',
        border: '1.5px solid #e0e0e0',
        fontSize: '14px',
        backgroundColor: '#fff',
        cursor: 'pointer',
        minWidth: '170px',
        fontFamily: "'DM Sans', sans-serif",
    },
    resultsCount: {
        color: '#aaa',
        fontSize: '13px',
        whiteSpace: 'nowrap',
        fontWeight: '600'
    },
    filterChips: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '20px'
    },
    chip: {
        padding: '7px 18px',
        borderRadius: '30px',
        border: '1.5px solid #e0e0e0',
        backgroundColor: '#fff',
        color: '#666',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.18s',
        fontFamily: "'DM Sans', sans-serif",
    },
    chipActive: {
        backgroundColor: '#00b4b4',
        borderColor: '#00b4b4',
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,180,180,0.3)',
    },
    section: {
        padding: "30px 60px 60px"
    },
    mainContainer: {
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "30px",
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto"
    },
    cardsContainer: {
        flex: 1,
        display: "flex",
        flexWrap: "wrap",
        gap: "25px",
        justifyContent: "flex-start"
    },
    toggleWrapper: {
        textAlign: "right",
        display: "flex",
        justifyContent: "flex-end",
        maxWidth: "1400px",
        margin: "20px auto 0",
        padding: "0 60px"
    },
    toggleBtn: {
        padding: "8px 16px",
        margin: "0 5px",
        border: "none",
        borderRadius: "6px",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        transition: 'background-color 0.2s'
    },
    courseCard: {
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "25px",
        boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
        transition: 'transform 0.2s, box-shadow 0.2s',
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.1)'
        }
    },
    courseCategory: {
        padding: "4px 12px",
        borderRadius: "15px",
        fontSize: "12px",
        fontWeight: "600",
        display: "inline-flex",
        alignItems: "center",
        marginBottom: "10px",
        textTransform: 'capitalize'
    },
    courseTitle: {
        fontSize: "17px",
        color: "#2c3e50",
        marginBottom: "14px",
        fontWeight: '700'
    },
    metaRow: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        marginBottom: "10px"
    },
    metaIcon: {
        color: "#00b4b4",
        fontSize: "18px"
    },
    metaText: {
        color: "#888",
        fontSize: "13px"
    },
    progressCircleContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '10px'
    },
    sideImgArea: {
        flex: "0 0 400px",
        position: "sticky",
        top: "20px",
        backgroundColor: "#fff",
        borderRadius: "16px",
        padding: "25px",
        boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
        boxSizing: "border-box"
    },
    insightsHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
    },
    insightsTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#2c3e50',
        margin: 0
    },
    insightsContent: {
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        padding: '15px',
        marginBottom: '20px'
    },
    insightItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #eee'
    },
    insightLabel: {
        fontSize: '13px',
        color: '#666'
    },
    insightValue: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#00b4b4'
    },
    progressSummary: {
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        marginBottom: '15px'
    },
    summaryItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #eee'
    },
    summaryLabel: {
        fontSize: '13px',
        color: '#666'
    },
    summaryValue: {
        fontSize: '14px',
        fontWeight: '700'
    },
    insightsFooter: {
        fontSize: '13px',
        color: '#888',
        textAlign: 'center',
        marginTop: '15px',
        fontStyle: 'italic'
    },
    loadingWrap: {
        textAlign: 'center',
        padding: '60px',
        width: '100%'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #f0f0f0',
        borderTop: '3px solid #00b4b4',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        margin: '0 auto 14px'
    },
    smallSpinner: {
        width: '16px',
        height: '16px',
        border: '2px solid #f0f0f0',
        borderTop: '2px solid #fff',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        marginRight: '6px'
    },
    loadingText: {
        color: '#888',
        fontSize: '15px'
    },
    emptyState: {
        textAlign: 'center',
        padding: '80px 20px',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 3px 12px rgba(0,0,0,0.07)'
    },
    emptyTitle: {
        fontSize: '20px',
        color: '#2c3e50',
        marginBottom: '8px',
        fontWeight: '700'
    },
    emptyText: {
        fontSize: '14px',
        color: '#888',
        marginBottom: '20px'
    },
    browseBtn: {
        padding: '12px 30px',
        backgroundColor: '#00b4b4',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#009999'
        }
    },
    confirmBtn: {
        backgroundColor: "#ff4d4f",
        border: "none",
        padding: "6px 12px",
        color: "#fff",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: '600'
    },
    cancelConfirmBtn: {
        backgroundColor: "#ccc",
        border: "none",
        padding: "6px 12px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: '600'
    },
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'modalIn 0.3s ease'
    },
    modalHeader: {
        padding: '24px',
        color: '#fff'
    },
    modalHeaderContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    modalCategory: {
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        opacity: 0.9,
        margin: '0 0 4px'
    },
    modalTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        margin: 0
    },
    modalCloseBtn: {
        background: 'rgba(255,255,255,0.2)',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#fff',
        transition: 'background-color 0.2s',
        ':hover': {
            background: 'rgba(255,255,255,0.3)'
        }
    },
    modalBody: {
        padding: '24px',
        overflowY: 'auto',
        maxHeight: 'calc(90vh - 140px)'
    },
    modalInfoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
    },
    modalInfoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px'
    },
    modalInfoIcon: {
        color: '#00b4b4',
        fontSize: '20px'
    },
    modalInfoLabel: {
        fontSize: '11px',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        margin: '0 0 2px'
    },
    modalInfoValue: {
        fontSize: '14px',
        color: '#2c3e50',
        fontWeight: '600',
        margin: 0
    },
    progressSection: {
        marginBottom: '24px'
    },
    progressHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
    },
    progressTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#2c3e50',
        margin: 0
    },
    editProgressBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 12px',
        backgroundColor: '#00b4b4',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#009999'
        },
        ':disabled': {
            backgroundColor: '#ccc',
            cursor: 'not-allowed'
        }
    },
    saveProgressBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 12px',
        backgroundColor: '#2e7d32',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#1e5a22'
        },
        ':disabled': {
            backgroundColor: '#ccc',
            cursor: 'not-allowed'
        }
    },
    progressDisplay: {
        width: '100%'
    },
    progressBar: {
        height: '8px',
        backgroundColor: '#eee',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '8px'
    },
    progressFill: {
        height: '100%',
        borderRadius: '4px',
        transition: 'width 0.3s ease'
    },
    progressStats: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    progressPercentage: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#2c3e50'
    },
    completedBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        backgroundColor: '#e6f7e6',
        color: '#2e7d32',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600'
    },
    progressEditor: {
        marginTop: '8px'
    },
    progressSlider: {
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        background: '#eee',
        outline: 'none',
        WebkitAppearance: 'none',
        marginBottom: '12px'
    },
    progressValueDisplay: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    progressValue: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#00b4b4'
    },
    progressStatus: {
        fontSize: '13px',
        color: '#888'
    },
    modalActions: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        borderTop: '1px solid #eee',
        paddingTop: '20px'
    },
    cancelEnrollmentBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 16px',
        backgroundColor: '#ff4d4f',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#ff3335'
        }
    },
    closeModalBtn: {
        padding: '10px 24px',
        backgroundColor: '#f0f0f0',
        color: '#666',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#e0e0e0'
        }
    }
};

// keyframes animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    @keyframes modalIn {
        from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(28px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-10px); }
    }
    .float-badge {
        animation: float 3s ease-in-out infinite;
    }
    .float-badge-2 {
        animation: float 3s ease-in-out infinite 1.5s;
    }
    .course-card {
        transition: all 0.2s ease;
    }
    .course-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.1);
    }
    .search-input:focus {
        border-color: #00b4b4 !important;
        box-shadow: 0 0 0 3px rgba(0,180,180,0.14) !important;
    }
    .filter-select:focus {
        border-color: #00b4b4 !important;
        outline: none;
    }
    .category-chip:hover {
        transform: scale(1.06);
    }
    input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #00b4b4;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,180,180,0.3);
    }
    input[type=range]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #00b4b4;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,180,180,0.3);
        border: none;
    }
    .hero-btn-primary:hover {
        background-color: #007a75 !important;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,168,157,0.42) !important;
    }
    .hero-btn-secondary:hover {
        background-color: #e0f7f6 !important;
    }
    ::-webkit-scrollbar {
        width: 6px;
    }
    ::-webkit-scrollbar-track {
        background: #f0f0f0;
    }
    ::-webkit-scrollbar-thumb {
        background: #00b4b4;
        border-radius: 4px;
    }
`;
document.head.appendChild(styleSheet);

export default Enrollments;