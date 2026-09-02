import profilePic from "@assets/profilePic.jpg";
import college from "@assets/college.jpg";
import { AiFillStar } from 'react-icons/ai';
import { MdSchool } from 'react-icons/md';
import { FaAngrycreative } from "react-icons/fa6";

export const DUProfileCard = ({ user }) => {
  return (
    <div>
        <div className="h-32 rounded-2xl" style={{backgroundImage: "url(" + college + ")", backgroundSize: "cover"}}>
        </div>
        <div className="avatar avatar-online -mt-16">
            <div className="w-24 h-24 rounded-full border-base-100 border-4">
                <img src={profilePic} />
            </div>
        </div>



          <div className="flex-row flex align-middle items-center ">
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <div className="ml-2 mr-2 badge badge-secondary">
                <div className="flex flex-row align-middle items-center">
                    <span><AiFillStar className="mr-2"/></span>
                    <span>{String(user.role).toUpperCase()}</span>
                </div>
            </div>
            <div class="badge badge-primary">
                <div className="flex flex-row align-middle items-center">
                    <span><FaAngrycreative className="mr-2"/></span>
                    <span>{String(user.email).includes("@ubiobio.cl") ? "DOCENTE UBB" : "ESTUDIANTE UBB"}</span>
                </div>
                
            </div>
          </div>

          <p>
            {"@" + String(user.email).split("@")[0]}
          </p>
    </div>
  );
};

export default DUProfileCard;
