import { useEffect, useState } from "react";
import { useGetProfile } from "@hooks/profile/useGetProfile.jsx";
import ProfileCard from "@components/ProfileCard.jsx";
import { DULoading } from "../components/daisyUI/DULoading";

const Profile = () => {
  const { fetchProfile } = useGetProfile();
  const [profileData, setProfileData] = useState(null);

  const reloadProfile = async () => {
    const res = await fetchProfile();
    if (res?.data) {
      setProfileData(res.data);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    reloadProfile();
  }, []);

  return (
    <div>
      {profileData ? (
        <div className="profile-container">
          <ProfileCard user={profileData} onProfileUpdated={reloadProfile} />
        </div>
      ) : (
        <DULoading />
      )}
    </div>
  );
};

export default Profile;
