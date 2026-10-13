// profile.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Edit2, User, X } from "lucide-react";
import "./profile.css";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [userAuth, setUserAuth] = useState(null);

  const [profileData, setProfileData] = useState({
    age: 22,
    gender: "Female",
    occupation: "Student",
    foodHabit: "Non-Vegetarian",
  });

  useEffect(() => {
    async function loadUserProfileMetrics() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        setUserAuth(user);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfileData({
            age: data.age || 22,
            gender: data.gender || "Female",
            occupation: data.occupation || "Student",
            foodHabit: data.food_habit || "Non-Vegetarian",
          });
        }
      } catch (err) {
        console.error("Account profile load error:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfileMetrics();
  }, []);

  const handleUpdateProfileData = async () => {
    if (!userAuth) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userAuth.id,
        age: parseInt(profileData.age) || 0,
        gender: profileData.gender,
        occupation: profileData.occupation,
        food_habit: profileData.foodHabit,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setIsEditing(false);
      alert("🎉 Account information updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err.message);
      alert(`Update conflict error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isEditing) {
    return (
      <div
        className="profile-page-view-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p>Syncing security records...</p>
      </div>
    );
  }

  return (
    <div className="profile-page-view-container">

      {/* PROFILE HEADER */}
      <div className="profile-card-header">

        <button
          className="edit-action-top-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? <X size={18} /> : <Edit2 size={18} />}
        </button>

        <div className="profile-avatar-row">

          <div className="avatar-mock-circle">
            <User size={32} color="#8b5cf6" />
          </div>

          <div className="profile-user-details">
            <h3>
              {userAuth?.user_metadata?.first_name || "Jannatul Islam"}
            </h3>

            <p>
              {userAuth?.email || "jannatul@example.com"}
            </p>
          </div>

        </div>
      </div>

      {/* PERSONAL INFORMATION */}
      <div className="personal-info-card-panel">

        <h4>Personal Information</h4>

        {/* AGE */}
        <div className="metric-data-row">
          <span className="label-tag">Age</span>

          {isEditing ? (
            <input
              type="number"
              value={profileData.age}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  age: e.target.value,
                })
              }
            />
          ) : (
            <span className="value-display">
              {profileData.age}
            </span>
          )}
        </div>

        {/* GENDER */}
        <div className="metric-data-row">
          <span className="label-tag">Gender</span>

          {isEditing ? (
            <select
              value={profileData.gender}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  gender: e.target.value,
                })
              }
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          ) : (
            <span className="value-display">
              {profileData.gender}
            </span>
          )}
        </div>

        {/* OCCUPATION */}
        <div className="metric-data-row">
          <span className="label-tag">Occupation</span>

          {isEditing ? (
            <input
              type="text"
              value={profileData.occupation}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  occupation: e.target.value,
                })
              }
            />
          ) : (
            <span className="value-display">
              {profileData.occupation}
            </span>
          )}
        </div>

        {/* FOOD HABIT */}
        <div className="metric-data-row">
          <span className="label-tag">Food Habit</span>

          {isEditing ? (
            <select
              value={profileData.foodHabit}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  foodHabit: e.target.value,
                })
              }
            >
              <option value="Non-Vegetarian">
                Non-Vegetarian
              </option>

              <option value="Vegetarian">
                Vegetarian
              </option>

              <option value="Vegan">
                Vegan
              </option>
            </select>
          ) : (
            <span className="value-display">
              {profileData.foodHabit}
            </span>
          )}
        </div>

      </div>

      {/* SAVE BUTTON */}
      {isEditing && (
        <button
          className="profile-save-trigger-btn"
          onClick={handleUpdateProfileData}
        >
          Save Profile Updates
        </button>
      )}

    </div>
  );
}