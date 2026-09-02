import DUProfileCard from "./daisyUI/DUProfileCard";

const ProfileCard = ({ user }) => {
  return (
    <div className="profile-card">
      {DUProfileCard({user})}
    </div>
  );
};

export default ProfileCard;
