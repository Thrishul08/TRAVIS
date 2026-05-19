import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../../utils/apiConfig';
import './UserProfile.css';

const UserProfile = (props) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [updatedUser, setUpdatedUser] = useState({
        name: '',
        email: ''
    });
    
    const navigate = useNavigate();
    const { showAlert } = props;

    useEffect(() => {
        const token = sessionStorage.getItem("auth-token");
        if (!token) {
            navigate("/login");
            showAlert("Please login to access your profile", "warning");
            return;
        }

        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/auth/getuser`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': token
                    }
                });
                
                const userData = await response.json();
                if (response.ok) {
                    setUser(userData);
                    setUpdatedUser({
                        name: userData.name,
                        email: userData.email
                    });
                } else {
                    showAlert("Failed to fetch user profile", "danger");
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                showAlert("An error occurred while fetching your profile", "danger");
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [navigate, showAlert]);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setUpdatedUser({
                name: user.name,
                email: user.email
            });
        }
    };

    const handleChange = (e) => {
        setUpdatedUser({
            ...updatedUser,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // Simulating update - replace with actual API call
            setUser({
                ...user,
                name: updatedUser.name,
                email: updatedUser.email
            });
            setIsEditing(false);
            showAlert("Profile updated successfully", "success");
        } catch (error) {
            showAlert("Failed to update profile", "danger");
        }
    };

    if (loading) {
        return (
            <div className="profile-container">
                <div className="profile-loader">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Back Button */}
            <Link to="/dashboard" className="profile-back-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <span>Back to Dashboard</span>
            </Link>
            
            <div className="d-flex justify-content-center align-items-center profile-content-container">
                <div className="profile-card-wrapper">
                    <Card className="profile-card">
                        <div className="profile-title-container">
                            <h1 className="profile-title">User Profile</h1>
                        </div>
                        <div className="profile-avatar-container">
                            <div className="profile-avatar">
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                        </div>
                        <div className="profile-body-container">
                            {isEditing ? (
                                <form onSubmit={handleUpdate}>
                                    <div className="mb-3">
                                        <label htmlFor="name" className="form-label profile-label">Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control profile-input-field" 
                                            id="name" 
                                            name="name" 
                                            value={updatedUser.name} 
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label profile-label">Email</label>
                                        <input 
                                            type="email" 
                                            className="form-control profile-input-field" 
                                            id="email" 
                                            name="email" 
                                            value={updatedUser.email} 
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="profile-date-joined">
                                        <span>Member since: </span>
                                        {new Date(user?.date).toLocaleDateString('en-US', { 
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="profile-buttons-container">
                                        <button 
                                            type="submit" 
                                            className="btn profile-save-button"
                                        >
                                            Save Changes
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn profile-cancel-button"
                                            onClick={handleEditToggle}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="profile-details">
                                    <div className="profile-info-item">
                                        <h3 className="profile-info-label">Name</h3>
                                        <p className="profile-info-value">{user?.name}</p>
                                    </div>
                                    <div className="profile-info-item">
                                        <h3 className="profile-info-label">Email</h3>
                                        <p className="profile-info-value">{user?.email}</p>
                                    </div>
                                    <div className="profile-date-joined">
                                        <span>Member since: </span>
                                        {new Date(user?.date).toLocaleDateString('en-US', { 
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="profile-buttons-container">
                                        <button 
                                            className="btn profile-edit-button"
                                            onClick={handleEditToggle}
                                        >
                                            Edit Profile
                                        </button>
                                        <button 
                                            className="btn profile-password-button"
                                            onClick={() => showAlert("Password change functionality will be implemented soon", "info")}
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;