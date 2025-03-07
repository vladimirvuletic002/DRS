import React, { useState, useEffect } from "react";
import "../styles/EditProfile.css";

function EditProfile() {
    const [userData, setUserData] = useState({
        first_name: "",
        last_name: "",
        address: "",
        city: "",
        country: "",
        phone: "",
        email: ""
    });

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");  // Potvrda nove lozinke
    const [message, setMessage] = useState('');
    const [passMessage, setPassMessage] = useState('');

    // Funkcija za automatsko brisanje poruka
    const clearMessages = () => {
        setTimeout(() => {
            setMessage('');
            setPassMessage('');
        }, 6000);
    };

    useEffect(() => {
        // Fetch user data from the server
        fetch("http://localhost:5000/user", {
            credentials: "include"
        })
        .then(response => response.json())
        .then(data => {
            if (!data.error) {
                setUserData(data);
            }
        })
        .catch(error => console.error("Error fetching user data:", error));
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        fetch("http://localhost:5000/edit-profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            setMessage(data.message || data.error);
            clearMessages();
        })
        .catch(error => console.error("Error updating profile:", error));
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPassMessage("All fields are required!");
            clearMessages();
            return;
        }

        if (newPassword !== confirmPassword) {
            setPassMessage("Passwords don't match!");
            clearMessages();
            return;
        }

        fetch("http://localhost:5000/change_password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        })
        .then(response => response.json())
        .then(data => {
            setPassMessage(data.passMessage || data.error);clearMessages();
        })
        .catch(error => console.error("Error changing password:", error));
    };


    return(
        <div className="edit-profile-container">
            <div className="edit-data-container">
                <h1 className="h1-edit">Edit Profile</h1>
                <form className="edit-form" onSubmit={handleProfileUpdate}>
                    
                    <table>
                        <tr>
                            <label>Email: </label>
                        </tr>
                        <tr>
                        <input type="email" name="email" value={userData.email} disabled placeholder="Email (cannot be changed!)" className="email-input" />
                        </tr>
                        <tr>
                            <td><label>Name: </label></td>
                            <td><label>Surname: </label></td>
                        </tr>
                        <tr>
                            <td><input type="text" name="first_name" value={userData.first_name} onChange={handleInputChange} placeholder="Name" required /></td>
                            <td><input type="text" name="last_name" value={userData.last_name} onChange={handleInputChange} placeholder="Surname" required /></td>
                        </tr>

                        <tr>
                            <td><label>Address: </label></td>
                            <td><label>City: </label></td>
                        </tr>
                        <tr>
                            <td><input type="text" name="address" value={userData.address} onChange={handleInputChange} placeholder="Address" required /></td>
                            <td><input type="text" name="city" value={userData.city} onChange={handleInputChange} placeholder="City" required /></td>
                        </tr>

                        <tr>
                            <td><label>Country: </label></td>
                            <td><label>Phone number: </label></td>
                        </tr>
                        <tr>
                            <td><input type="text" name="country" value={userData.country} onChange={handleInputChange} placeholder="Country" required /></td>
                            <td><input type="text" name="phone" value={userData.phone} onChange={handleInputChange} placeholder="Mobile number" required /></td>
                        </tr>

                        <tr>
                            <button type="submit">Save Changes</button>
                        </tr>
                    </table>
                </form>

                {message && <p className="message">{message}</p>}

                <h2 className="h2-edit">Change Password</h2>
                <form className="edit-form" onSubmit={handleChangePassword}>
                    <table>
                        <tr>
                            <label>Current Password:</label>
                        </tr>
                        <tr>
                        <input type="password" name="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" required />
                        </tr>

                        <tr>
                            <td><label>New password:</label></td>
                            <td><label>Confirmation: </label></td>
                        </tr>
                        <tr>
                            <td><input type="password" name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required /></td>
                            <td> <input type="password" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required /></td>
                        </tr>

                        <tr>
                        <button type="submit">Change password</button>
                        </tr>
                    </table>
                    

                </form>

                {passMessage && <p className="message">{passMessage}</p>}
            </div>
        </div>
    );


};

export default EditProfile;