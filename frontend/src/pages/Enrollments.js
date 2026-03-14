import React, { useEffect, useState } from "react";
import axios from "axios";

// Toast
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Icons
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AppsIcon from "@mui/icons-material/Apps";
import ViewListIcon from "@mui/icons-material/ViewList";

const Enrollments = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [viewMode, setViewMode] = useState("list"); // grid or list
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        try {
            const res = await axios.get(
                `http://localhost:3003/api/enrollment/user/${user.id}`
            );
            setEnrollments(res.data);
        } catch (err) {
            toast.error("Failed to load enrollments");
        }
    };

    const cancelEnrollment = (id, title) => {
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
                                    await axios.delete(
                                        `http://localhost:3003/api/enrollment/${id}`
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

    return (
        <div style={styles.page}>
            <ToastContainer position="top-center" autoClose={3000} />

            {/* Banner */}
            <section style={styles.banner}>
                <h1 style={styles.bannerTitle}>My Enrollments</h1>
                <p style={styles.bannerSubtitle}>Track learning progress</p>
            </section>

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
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    gap: "30px",
                    width: "100%",
                    maxWidth: "1400px", // Keeps layout from getting too wide on huge screens
                    margin: "0 auto"
                }}>
                    
                    {/* LEFT SIDE: Enrollment Cards Container */}
                    <div style={{
                        flex: 1, 
                        display: "flex",
                        flexDirection: viewMode === "list" ? "column" : "row",
                        flexWrap: "wrap",
                        gap: "25px",
                        justifyContent: viewMode === "list" ? "flex-start" : "center",
                    }}>
                        {enrollments.map((enroll) => (
                            <div
                                key={enroll._id}
                                style={{
                                    ...styles.courseCard,
                                    width: viewMode === "list" ? "100%" : "300px",
                                    maxWidth: viewMode === "list" ? "100%" : "300px",
                                    display: viewMode === "list" ? "flex" : "block",
                                    alignItems: "center",
                                    justifyContent: viewMode === "list" ? "space-between" : "initial",
                                    gap: viewMode === "list" ? "20px" : "0",
                                    boxSizing: "border-box"
                                }}
                            >
                                {/* Course info */}
                                <div style={{ flex: 1 }}>
                                    <span style={styles.courseCategory}>{enroll.status}</span>
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

                                {/* Progress & Buttons */}
                                <div style={{ 
                                    display: "flex", 
                                    flexDirection: "column", 
                                    alignItems: viewMode === "list" ? "flex-end" : "flex-start", 
                                    gap: "10px",
                                    minWidth: "200px" // Prevents the progress section from squishing
                                    
                                }}>
                                    <div style={styles.metaRow}>
                                        <CheckCircleOutlineIcon style={styles.metaIcon} />
                                        <span style={styles.metaText}>Progress: {enroll.progress}%</span>
                                    </div>
                                    <div style={styles.progressBar}>
                                        <div style={{ ...styles.progressFill, width: `${enroll.progress}%` }} />
                                    </div>
                                    {enroll.progress === 100 ? (
                                        <div style={styles.completedBadge}>
                                            <EmojiEventsIcon style={{ fontSize: 18, marginRight: 5 }} /> Completed
                                        </div>
                                    ) : enroll.status === "cancelled" ? (
                                        <button style={styles.disabledBtn} disabled>Enrollment Cancelled</button>
                                    ) : (
                                        <button 
                                            style={styles.cancelBtn} 
                                            onClick={() => cancelEnrollment(enroll._id, enroll.courseTitle)}
                                        >
                                            Cancel Enrollment
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT SIDE: Static Image Area */}
                    {viewMode === "list" && (
                        <div style={styles.sideImgArea}>
                            <img 
                                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300&h=500&auto=format&fit=crop" 
                                alt="Side Banner" 
                                style={styles.sideImg} 
                            />
                            <div style={styles.sideImgText}>
                                <h3 style={{ margin: '10px 0', color: '#2c3e50' }}>Student Portal</h3>
            
            {/* Enrollment Count Logic */}
            <div style={styles.countBadge}>
                <EmojiEventsIcon style={{ fontSize: 20, color: '#00b4b4' }} />
                <br></br>
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                    {enrollments.length}
                </span>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    Courses Enrolled
                </p>
            </div>

            <p style={{ fontSize: '13px', color: '#888', marginTop: '10px' }}>
                Keep tracking your progress to reach your goals!
            </p>
                            </div>
                        </div>
                    )}
                </div>

            </section>

        </div>

    );

};

const styles = {
    page: { 
        fontFamily: "Segoe UI, sans-serif", 
        backgroundColor: "#f5f6fa", 
        minHeight: "100vh" 
    },
    banner: { 
        background: "linear-gradient(135deg,#00b4b4,#007a7a)", 
        padding: "60px", 
        color: "#fff" 
    },
    bannerTitle: { 
        fontSize: "34px", 
        fontWeight: "bold", 
        margin: 0 
    },
    bannerSubtitle: { 
        fontSize: "16px", 
        opacity: 0.9 
    },
    section: { 
        padding: "40px 60px",
    
     },
    toggleWrapper: { 
        textAlign: "right", 
        margin: "30px 50px", 
        display: "flex", 
        justifyContent: "flex-end" 
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
        gap: "5px" 
    },
    courseCard: { 
        backgroundColor: "#fff", 
        borderRadius: "12px", 
        padding: "25px", 
        boxShadow: "0 3px 12px rgba(0,0,0,0.07)" 
    },
    courseCategory: { 
        backgroundColor: "#e8fafa", 
        color: "#00b4b4", 
        padding: "4px 12px", 
        borderRadius: "15px", 
        fontSize: "12px", 
        fontWeight: "600", 
        display: "inline-block", 
        marginBottom: "10px" 
    },
    courseTitle: { 
        fontSize: "17px", 
        color: "#2c3e50", 
        marginBottom: "14px" 
    },
    metaRow: { 
        display: "flex", 
        alignItems: "center", 
        gap: "7px", 
        marginBottom: "10px" 
    },
    metaIcon: { 
        color: "#00b4b4", 
        fontSize: "18px" },
    metaText: { 
        color: "#888", 
        fontSize: "13px" },
    progressBar: { 
        width: "150px", 
        height: "8px", 
        backgroundColor: "#eee", 
        borderRadius: "10px", 
        marginBottom: "10px" 
    },
    progressFill: { 
        height: "100%", 
        backgroundColor: "#00b4b4", 
        borderRadius: "10px" 
    },
    completedBadge: { 
        backgroundColor: "#e6f7e6", 
        color: "#2e7d32", 
        padding: "6px 10px", 
        borderRadius: "8px", 
        fontSize: "12px", 
        fontWeight: "600", 
        display: "flex", 
        alignItems: "center" 
    },
    cancelBtn: { 
        padding: "10px 20px", 
        border: "none", 
        borderRadius: "8px", 
        backgroundColor: "#ff4d4f", 
        color: "#fff", 
        fontWeight: "bold", 
        cursor: "pointer" ,
        width: "100%"
    },
    disabledBtn: { 
        padding: "10px 20px", 
        border: "none", 
        borderRadius: "8px", 
        backgroundColor: "#ff4d4f", 
        color: "#fff", 
        fontWeight: "bold", 
        opacity: 0.5, 
        cursor: "not-allowed" ,
        width: "100%"
    },
    confirmBtn: { 
        backgroundColor: "#ff4d4f", 
        border: "none", 
        padding: "6px 12px", 
        color: "#fff", 
        borderRadius: "6px", 
        cursor: "pointer" 
    },
    cancelConfirmBtn: { 
        backgroundColor: "#ccc", 
        border: "none", 
        padding: "6px 12px", 
        borderRadius: "6px", 
        cursor: "pointer" 
    },
    
   sideImgArea: {
        flex: "0 0 400px", // The '0 0' prevents the image area from shrinking or growing
        position: "sticky",
        top: "20px",
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box"
    },
    sideImg: { 
        width: "100%", 
        height: "auto", 
        borderRadius: "8px" 
    },
    sideImgText: { 
        textAlign: "center", 
        marginTop: "15px" 
    }
};

export default Enrollments;