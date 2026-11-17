import DUProfileCard from "./daisyUI/DUProfileCard";

const ProfileCard = ({ user, onProfileUpdated }) => {
  return (
    <div className="profile-card">
      <DUProfileCard user={user} onProfileUpdated={onProfileUpdated} />
    </div>
  );
};

export default ProfileCard;
