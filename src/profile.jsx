import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { Edit2, User, X } from "lucide-react";
import DatabaseErrorNotice from "./DailyLogError";
import { databaseError } from "./dailyLogErrors";
import { EMPTY_PROFILE, GENDERS, FOOD_HABITS, createProfilePayload, toProfileForm } from "./profileData";
import profileSetupSql from "../supabase/migrations/202610130002_profile_fields.sql?raw";
import "./profile.css";

const PROFILE_COLUMNS = "age,gender,occupation,food_habit";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const [profileData, setProfileData] = useState({ ...EMPTY_PROFILE });
  const [savedData, setSavedData] = useState({ ...EMPTY_PROFILE });
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [retry, setRetry] = useState(0);
  const dirty = useRef(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      setLoadError(null);
      setSaveError(null);
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!auth.user) throw new Error("Please sign in again to access your profile.");
        if (active) setUserAuth(auth.user);
        const { data, error } = await supabase.from("profiles")
          .select(PROFILE_COLUMNS).eq("id", auth.user.id).maybeSingle();
        if (error) throw databaseError(error, "Profile editing");
        if (active) {
          const form = toProfileForm(data);
          setSavedData(form);
          if (!dirty.current) setProfileData(form);
        }
      } catch (error) {
        if (active) setLoadError(error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => { active = false; };
  }, [retry]);

  function update(field, value) {
    dirty.current = true;
    setSaved(false);
    setSaveError(null);
    setProfileData((previous) => ({ ...previous, [field]: value }));
  }

  function toggleEditing() {
    if (isEditing) {
      setProfileData({ ...savedData });
      dirty.current = false;
      setSaveError(null);
    }
    setSaved(false);
    setIsEditing((value) => !value);
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (loading || loadError || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = createProfilePayload(profileData, userAuth?.id);
      const { data, error } = await supabase.from("profiles")
        .upsert(payload, { onConflict: "id" }).select(PROFILE_COLUMNS).single();
      if (error) throw databaseError(error, "Profile editing");
      const form = toProfileForm(data);
      setProfileData(form);
      setSavedData(form);
      dirty.current = false;
      setIsEditing(false);
      setSaved(true);
    } catch (error) {
      setSaveError(error);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="profile-page-view-container" aria-busy={loading || saving}>
      <div className="profile-card-header">
        <button type="button" className="edit-action-top-btn" onClick={toggleEditing}
          aria-label={isEditing ? "Cancel profile changes" : "Edit profile"} disabled={loading || saving || Boolean(loadError)}>
          {isEditing ? <X size={18} /> : <Edit2 size={18} />}
        </button>
        <div className="profile-avatar-row">
          <div className="avatar-mock-circle"><User size={32} color="#8b5cf6" /></div>
          <div className="profile-user-details">
            <h3>{userAuth?.user_metadata?.first_name || "Your profile"}</h3>
            <p>{userAuth?.email || ""}</p>
          </div>
        </div>
      </div>

      {loading && <p role="status">Loading your profile…</p>}
      {(loadError || saveError) && <DatabaseErrorNotice error={loadError || saveError}
        setupSql={import.meta.env.DEV ? profileSetupSql : ""}
        onRetry={() => setRetry((value) => value + 1)} retrying={loading || saving} />}
      {saved && <p className="profile-success" role="status">Your profile was saved.</p>}

      <form onSubmit={saveProfile}>
        <fieldset className="profile-fields" disabled={loading || saving || Boolean(loadError)}>
          <legend className="sr-only">Personal information</legend>
          <div className="personal-info-card-panel">
            <h4>Personal Information</h4>
            <div className="metric-data-row">
              <label className="label-tag" htmlFor={isEditing ? "profile-age" : undefined}>Age</label>
              {isEditing ? <input id="profile-age" name="age" type="number" min="0" max="150" step="1"
                value={profileData.age} onChange={(event) => update("age", event.target.value)} />
                : <span className="value-display">{loading ? "Loading…" : loadError ? "Unavailable" : profileData.age === "" ? "Not set" : profileData.age}</span>}
            </div>
            <div className="metric-data-row">
              <label className="label-tag" htmlFor={isEditing ? "profile-gender" : undefined}>Gender</label>
              {isEditing ? <select id="profile-gender" name="gender" value={profileData.gender} onChange={(event) => update("gender", event.target.value)}>
                <option value="">Not set</option>
                {GENDERS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
              </select> : <span className="value-display">{loading ? "Loading…" : loadError ? "Unavailable" : profileData.gender || "Not set"}</span>}
            </div>
            <div className="metric-data-row">
              <label className="label-tag" htmlFor={isEditing ? "profile-occupation" : undefined}>Occupation</label>
              {isEditing ? <input id="profile-occupation" name="occupation" type="text" value={profileData.occupation}
                onChange={(event) => update("occupation", event.target.value)} />
                : <span className="value-display">{loading ? "Loading…" : loadError ? "Unavailable" : profileData.occupation || "Not set"}</span>}
            </div>
            <div className="metric-data-row">
              <label className="label-tag" htmlFor={isEditing ? "profile-food-habit" : undefined}>Food Habit</label>
              {isEditing ? <select id="profile-food-habit" name="foodHabit" value={profileData.foodHabit} onChange={(event) => update("foodHabit", event.target.value)}>
                <option value="">Not set</option>
                {FOOD_HABITS.map((habit) => <option key={habit} value={habit}>{habit}</option>)}
              </select> : <span className="value-display">{loading ? "Loading…" : loadError ? "Unavailable" : profileData.foodHabit || "Not set"}</span>}
            </div>
          </div>
          {isEditing && <button className="profile-save-trigger-btn" type="submit">{saving ? "Saving…" : "Save Profile Updates"}</button>}
        </fieldset>
      </form>
    </div>
  );
}
